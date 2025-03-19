const {
    get_artists,
    get_tracks,
    get_tracks_audio_features,
    get_recommendations,
    get_top_items,
} = require("./spotify-api.js");

const AUDIO_FEATURES = {
    "acousticness": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "danceability": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "energy": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "instrumentalness": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "key": {
        "range_min": 0,
        "range_max": 11,
        "type": "integer"
    },
    "liveness": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "loudness": {
        "range_min": -10000,
        "range_max": 10000,
        "type": "float"
    },
    "mode": {
        "range_min": 0,
        "range_max": 1,
        "type": "integer"
    },
    // "popularity": {
    //     "range_min": 0,
    //     "range_max": 100,
    //     "type": "integer"
    // },
    "speechiness": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    },
    "tempo": {
        "range_min": -10000,
        "range_max": 10000,
        "type": "float"
    },
    "time_signature": {
        "range_min": 0,
        "range_max": 11,
        "type": "integer"
    },
    "valence": {
        "range_min": 0,
        "range_max": 1,
        "type": "float"
    }
}

const TOLERANCE = 4;

function shuffle_array(array) {
    const shuffled = [];
    const len = array.length;

    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * array.length);
        shuffled.push(array[index]);
        array.splice(index, 1);
    }

    return shuffled;
}

function sort_tracks(target_tracks, tracks) {
    var target_features = {
        "acousticness": 0,
        "danceability": 0,
        "energy": 0,
        "instrumentalness": 0,
        "key": 0,
        "liveness": 0,
        "loudness": 0,
        "mode": 0,
        // "popularity": 0,
        "speechiness": 0,
        "tempo": 0,
        "time_signature": 0,
        "valence": 0
    };


    // calclate target features
    const number = target_tracks.length;

    target_tracks.forEach((v, i) => {
        Object.keys(v).forEach((k2) => {
            if (AUDIO_FEATURES[k2] !== undefined) {
                target_features[k2] += v[k2];
            }
        });
    });

    Object.keys(target_features).forEach((k) => {
        target_features[k] /= number;
    });    

    // assign score
    // root mean squared
    tracks.forEach((v, i) => {
        // track
        var score = 0;
        Object.keys(v).forEach((k3) => {
            if (target_features[k3] !== undefined) {
                // relative deviation
                if (target_features[k3] === 0) {
                    score += v[k3] * 1000;
                } else {
                    score += Math.pow(( Math.abs(v[k3] - target_features[k3]) / target_features[k3] ), 2);
                }
            }
        });
        score = Math.sqrt(score / Object.keys(target_features).length);
        v.SCORE = score;
    });

    return tracks;
}

function delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

const MAX = 50;

async function track(access_token, track_data, track_features, artist_genres) {
    const options = {
        "limit": 99,
        "seed_artists": track_data.artists[0].id,
        "seed_tracks": [track_data.id],
    }

    if (artist_genres.length > 0) {
        options["seed_genres"] = artist_genres;
    }

    Object.keys(AUDIO_FEATURES).forEach((k) => {
        // if (AUDIO_FEATURES[k]["type"] === "integer") {
        //     console.log(k);
        //     return;
        // }

        let feature = track_features[k];
        let max = (1 + TOLERANCE) * feature;
        let min = (1 - TOLERANCE) * feature;
 
        options["target_" + k] = feature;

        if (max > AUDIO_FEATURES[k]["range_max"]) {
            max = AUDIO_FEATURES[k]["range_max"]
        }

        if (min < AUDIO_FEATURES[k]["range_min"]) {
            min = AUDIO_FEATURES[k]["range_min"]
        }

        if (AUDIO_FEATURES[k]["type"] === "integer") {
            max = Math.round(max);
            min = Math.round(min);
        }

        // options["min_" + k] = min;
        // options["max_" + k] = max;
    });


    // console.log(track_data.album);

    const recommendations = (await get_recommendations(access_token, options));

    console.log(recommendations)

    return recommendations.tracks;
}

async function generate_tracks(access_token, tracks_data) {
    // const suggested = new Map();
    var suggested = [];

    let tracks_features = (await get_tracks_audio_features(tracks_data.map((track) => track.id), access_token)).audio_features;

    let artist_ids = [];

    for (let i = 0; i < tracks_data.length; i++) {
        let duplicate = false;
        for (let i2 = 0; i2 < artist_ids.length; i2++) {
            if (artist_ids[i2] === tracks_data[i].artists[0].id) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            artist_ids.push(tracks_data[i].artists[0].id);
        }
    }

    var artists_data = (await get_artists(artist_ids, access_token)).artists;

    var artists_genres = new Map();

    artists_data.forEach((artist) => {
        artists_genres.set(artist.id, artist.genres);
    });

    for (let i = 0; i < tracks_data.length; i++) {
        let recommendations = await track(access_token, tracks_data[i], tracks_features[i], artists_genres.get(tracks_data[i].artists[0].id));
        let recommendations_features = (await get_tracks_audio_features(recommendations.map((track) => track.id), access_token)).audio_features;

        let temp_suggested = [];

        console.log(recommendations);
        console.log(recommendations_features);

        recommendations_features.map((track) => {
            // if (suggested.get(track.uri)) {
            //     suggested.set(track.uri, {
            //         quantity: suggested.get(track.uri).quantity + 1,
            //         track: track
            //     });
            // } else {
            //     suggested.set(track.uri, {
            //         quantity: 1,
            //         track: track
            //     });
            // }
            track.parent_id = tracks_data[i].id;
            temp_suggested.push(track);
        });

        temp_suggested = sort_tracks([tracks_features[i]], temp_suggested);

        temp_suggested.forEach((track) => {
            suggested.push(track);
        })

        let delayres = await delay(100);
    }

    suggested.sort((a, b) => a.SCORE - b.SCORE);

    suggested.forEach((track, i) => {
        let duplicate = false;
        for (let i2 = 0; i2 < suggested.length; i2++) {
            if (suggested[i2] === suggested[i].uri && i != i2) {
                duplicate = true
            }
        }
        if (!duplicate) {
            suggested[i] = track.uri;
        }
    });

    var tracks = [];

    for (let i = 0; i < suggested.length; i++) {
        if (typeof suggested[i] !== "string") {
            continue;
        }
        if (tracks.length === MAX) {
            break;
        }
        tracks[tracks.length] = suggested[i];
    }

    // let top = 0;
    // const suggested2 = new Map();

    // suggested.forEach((v, k) => {
    //     if (suggested2.has(v.quantity)) {
    //         let arr = suggested2.get(v.quantity);
    //         arr[arr.length] = v.track;
    //         suggested2.set(v.quantity, arr);
    //     } else {
    //         suggested2.set(v.quantity, [v.track]);
    //     }
    //     if (v.quantity > top) {
    //         top = v.quantity;
    //     }
    // });

    // // randomise
    // suggested2.forEach((v, k) => {
    //     suggested2.set(k, sort_tracks(tracks_features, v));
    // });

    // for (let i = top; i > 0; i--) {
    //     suggested2.get(i).map((track) => {
    //         if (tracks.length === MAX) {
    //             return;
    //         }
    //         tracks.push(track.uri);
    //     });
    // }

    return tracks;
}

async function generate_from_profile(access_token) {
    const tracks_data = (await get_top_items("tracks", access_token, { "time_range": "short_term", "limit": 5 })).items;
    let delayres = await delay(100);
    const recommendations = await generate_tracks(access_token, tracks_data);

    return recommendations;
}

async function generate_from_tracks(access_token, track_ids) {
    const tracks_data = (await get_tracks(track_ids, access_token)).tracks;
    let delayres = await delay(100);
    const recommendations = await generate_tracks(access_token, tracks_data);

    return recommendations;
}

module.exports = {
    generate_from_tracks,
    generate_from_profile
};