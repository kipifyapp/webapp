const querystring = require("querystring");

const {
    get_track,
    get_tracks,
    get_track_audio_features,
    get_tracks_audio_features,
    get_recommendations,
    get_artist,
    get_artists,
    get_top_items,
    get_all_top_items,
    get_user_profile,
    create_playlist,
    add_items_to_playlist
} = require("./spotify-api.js");

var top_artists;
var top_tracks;

function array_sum(arr) {
    let sum = arr.reduce(function (x, y) {
        return x + y;
    }, 0);
    return sum;
}

async function get_all_time_top(type, access_token) {
    // const top_items_long = await get_top_items(type, access_token, { "time_range": "long_term" });
    const top_items_med = await get_top_items(type, access_token);
    const top_items_short = await get_top_items(type, access_token, { "time_range": "short_term" });
    let items = [];

    // top_items_long.items.map((item) => {
    //     items.push(item);
    // });
    top_items_med.items.map((item) => {
        items.push(item);
    });
    top_items_short.items.map((item) => {
        items.push(item);
    });

    // remove duplicated
    items = items.filter((item, index) => {
        let searchIndex = items.findIndex((item2) => {
            return item2.id === item.id;
        });
        return searchIndex === index;
    });

    return items;
}

async function get_5_artists() {
    let items = top_artists;
    let artists = [];
    for (let i = 0; i < 5; i++) {
        if (items.length === 0) break;
        let random = Math.floor(Math.random() * items.length);
        artists.push(items[random]);
        items.splice(random, 1);
    }
    return artists;
}

async function get_5_tracks() {
    let items = top_tracks;
    let tracks = [];
    for (let i = 0; i < 5; i++) {
        if (items.length === 0) break;
        let random = Math.floor(Math.random() * items.length);
        tracks.push(items[random]);
        items.splice(random, 1);
    }
    return tracks;
}

async function get_genres(artists) {
    var genres = [];
    artists.map((artist) => genres.push(artist.genres[0]));
    // remove duplicates
    genres = genres.filter(function(v, i) {
        return genres.indexOf(v) == i;
    })
    return genres;
}

async function main(access_token) {
    // top_artists = await get_all_time_top("artists", access_token);
    // top_tracks = await get_all_time_top("tracks", access_token);

    // const artists = await get_5_artists();
    // const tracks = await get_5_tracks();
    const artists = (await get_top_items("artists", access_token, { "limit": 5 })).items;
    const tracks = (await get_top_items("tracks", access_token, { "limit": 5 })).items;
    const tracks_num = tracks.length;
    // const features = (await get_tracks_audio_features(tracks.map((track) => track.id), access_token)).audio_features;

    const artists_seed = artists.map((artist) => artist.id);
    const genres_seed = await get_genres(artists);
    const tracks_seed = tracks.map((track) => track.id);

    const options = {
        "limit": 50,
        "seed_artists": artists_seed,
        "seed_genres": genres_seed,
        "seed_tracks": tracks_seed,
        // "target_acousticness": array_sum(features.map((track) => track.acousticness)) / tracks_num,
        // "target_danceability": array_sum(features.map((track) => track.danceability)) / tracks_num,
        // "target_duration_ms": array_sum(features.map((track) => track.duration_ms)) / tracks_num,
        // "target_energy": array_sum(features.map((track) => track.energy)) / tracks_num,
        // "target_instrumentalness": array_sum(features.map((track) => track.instrumentalness)) / tracks_num,
        // "target_key": array_sum(features.map((track) => track.key)) / tracks_num,
        // "target_liveness": array_sum(features.map((track) => track.liveness)) / tracks_num,
        // "target_loudness": array_sum(features.map((track) => track.loudness)) / tracks_num,
        // "target_mode": array_sum(features.map((track) => track.mode)) / tracks_num,
        // "target_popularity": array_sum(tracks.map((track) => track.popularity)) / tracks_num,
        // "target_speechiness": array_sum(features.map((track) => track.speechiness)) / tracks_num,
        // "target_tempo": array_sum(features.map((track) => track.tempo)) / tracks_num,
        // "target_time_signature": array_sum(features.map((track) => track.time_signature)) / tracks_num,
        // "target_valence": array_sum(features.map((track) => track.valence)) / tracks_num
    }

    const recommendations = (await get_recommendations(access_token, options)).tracks;

    return recommendations;
}

module.exports = main;