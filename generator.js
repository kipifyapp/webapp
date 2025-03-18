const {
    get_tracks,
    get_tracks_audio_features,
    get_recommendations,
    get_top_items,
} = require("./spotify-api.js");

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
            if (target_features[k2] !== undefined) {
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
                score += Math.pow(( Math.abs(v[k3] - target_features[k3]) / target_features[k3] ), 2);
            }
        });
        score = Math.sqrt(score / Object.keys(target_features).length);
        v.SCORE = score;
    });
    
    tracks.sort((a, b) => a.SCORE - b.SCORE);

    return tracks;
}

function delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

const MAX = 50;

async function track(access_token, track_data, track_features) {
    const options = {
        "limit": 99,
        // "seed_artists": track_data.artists[0].id,
        "seed_tracks": [track_data.id],
        "target_acousticness": track_features.acousticness,
        "target_danceability": track_features.danceability,
        "target_energy": track_features.energy,
        "target_instrumentalness": track_features.instrumentalness,
        "target_key": track_features.key,
        "target_liveness": track_features.liveness,
        "target_loudness": track_features.loudness,
        "target_mode": track_features.mode,
        // "target_popularity": track_data.popularity,
        "target_speechiness": track_features.speechiness,
        "target_tempo": track_features.tempo,
        "target_time_signature": track_features.time_signature,
        "target_valence": track_features.valence
    }

    const recommendations = (await get_recommendations(access_token, options)).tracks;

    return recommendations;
}

async function generate_tracks(access_token, tracks_data) {
    // const suggested = new Map();
    var suggested = [];

    let tracks_features = (await get_tracks_audio_features(tracks_data.map((track) => track.id), access_token)).audio_features;

    for (let i = 0; i < tracks_data.length; i++) {
        let recommendations = await track(access_token, tracks_data[i], tracks_features[i]);
        let recommendations_features = (await get_tracks_audio_features(recommendations.map((track) => track.id), access_token)).audio_features;

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
            suggested.push(track);
        });
        let delayres = await delay(100);
    }

    suggested = sort_tracks(tracks_features, suggested);

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