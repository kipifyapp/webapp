const {
    get_track,
    get_tracks,
    get_track_audio_features,
    get_tracks_audio_features,
    get_recommendations,
    get_artist,
    get_artists,
    get_artist_top_tracks,
    get_top_items,
    get_all_top_items,
    get_user_profile,
    check_user_saved_tracks,
    create_playlist,
    add_items_to_playlist
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

function delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

const MAX = 50;

async function track(access_token, track_data, track_features) {
    const options = {
        "limit": 99,
        "seed_artists": track_data.artists[0].id,
        "seed_tracks": [track_data.id],
        "target_acousticness": track_features.acousticness,
        "target_danceability": track_features.danceability,
        "target_energy": track_features.energy,
        "target_instrumentalness": track_features.instrumentalness,
        "target_key": track_features.key,
        "target_liveness": track_features.liveness,
        "target_loudness": track_features.loudness,
        "target_mode": track_features.mode,
        "target_popularity": track_data.popularity,
        "target_speechiness": track_features.speechiness,
        "target_tempo": track_features.tempo,
        "target_time_signature": track_features.time_signature,
        "target_valence": track_features.valence
    }

    const recommendations = (await get_recommendations(access_token, options)).tracks;

    return recommendations;
}

async function generate_tracks(access_token, tracks_data) {
    const tracks = [];
    const suggested = new Map();

    let tracks_features = (await get_tracks_audio_features(tracks_data.map((track) => track.id), access_token)).audio_features;

    for (let i = 0; i < tracks_data.length; i++) {
        let recommendations = await track(access_token, tracks_data[i], tracks_features[i]);
        recommendations.map((track) => {
            if (suggested.get(track.uri)) {
                suggested.set(track.uri, suggested.get(track.uri) + 1);
            } else {
                suggested.set(track.uri, 1);
            }
        });
        let delayres = await delay(3000);
    }

    let top = 0;
    const suggested2 = new Map();

    suggested.forEach((v, k) => {
        if (suggested2.get(v)) {
            let arr = suggested2.get(v);
            arr[arr.length] = k;
            suggested2.set(v, arr);
        } else {
            suggested2.set(v, [k]);
        }
        if (v > top) {
            top = v;
        }
    });

    // randomise
    suggested2.forEach((v, k) => {
        suggested2.set(k, shuffle_array(v));
    });

    for (let i = top; i > 0; i--) {
        suggested2.get(i).map((track) => {
            if (tracks.length === MAX) {
                return;
            }
            tracks.push(track);
        });
    }

    return tracks;
}

async function generate_from_profile(access_token) {
    const tracks_data = (await get_top_items("tracks", access_token, { "time_range": "short_term", "limit": 5 })).items;
    let delayres = await delay(3000);
    const recommendations = await generate_tracks(access_token, tracks_data);

    return recommendations;
}

async function generate_from_tracks(access_token, track_ids) {
    const tracks_data = (await get_tracks(track_ids, access_token)).tracks;
    let delayres = await delay(3000);
    const recommendations = await generate_tracks(access_token, tracks_data);

    return recommendations;
}

module.exports = {
    generate_from_tracks,
    generate_from_profile
};