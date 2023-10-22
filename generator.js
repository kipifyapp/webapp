const querystring = require("querystring");

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

const MAX = 50;

function array_sum(arr) {
    let sum = arr.reduce(function (x, y) {
        return x + y;
    }, 0);
    return sum;
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

async function generate_from_profile(access_token, playlist) {
    if (!playlist) {
        playlist = [];
    }
    if (playlist.length === MAX) {
        return playlist;
    }

    const limit = MAX - playlist.length;

    // const artists = (await get_top_items("artists", access_token, { "time_range": "short_term", "limit": 5 })).items;
    const tracks = (await get_top_items("tracks", access_token, { "time_range": "short_term", "limit": 5 })).items;
    // const tracks_num = tracks.length;
    // const features = (await get_tracks_audio_features(tracks.map((track) => track.id), access_token)).audio_features;

    // const artists_seed = artists.map((artist) => artist.id);
    // const genres_seed = await get_genres(artists);
    const tracks_seed = tracks.map((track) => track.id);

    const options = {
        "limit": limit,
        // "seed_artists": artists_seed,
        // "seed_genres": genres_seed,
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
    const saved = await check_user_saved_tracks(recommendations.map((track) => track.id), access_token);

    // remove saved
    recommendations.forEach((track, i) => {
        if (!saved[i]) {
            playlist.push(track);
        }
    });

    // remove duplicates
    playlist = playlist.filter((track, index) => {
        let searchIndex = playlist.findIndex((track2) => {
            return track2.id === track.id;
        });
        return searchIndex === index;
    });

    if (playlist.length !== MAX) {
        playlist = await generate_from_profile(access_token, playlist);
    }

    return playlist;
}

async function generate_from_tracks(access_token, tracks_seed, playlist) {
    if (!playlist) {
        playlist = [];
    }
    if (playlist.length === MAX) {
        return playlist;
    }

    const limit = MAX - playlist.length;

    // const artists = (await get_top_items("artists", access_token, { "time_range": "short_term", "limit": 5 })).items;
    // const tracks = (await get_top_items("tracks", access_token, { "time_range": "short_term", "limit": 5 })).items;
    const tracks_num = tracks_seed.length;
    const features = (await get_tracks_audio_features(tracks_seed, access_token)).audio_features;

    // const artists_seed = artists.map((artist) => artist.id);
    // const genres_seed = await get_genres(artists);
    // const tracks_seed = tracks.map((track) => track.id);

    const options = {
        "limit": limit,
        // "seed_artists": artists_seed,
        // "seed_genres": genres_seed,
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
    const saved = await check_user_saved_tracks(recommendations.map((track) => track.id), access_token);

    // remove saved
    recommendations.forEach((track, i) => {
        if (!saved[i]) {
            playlist.push(track);
        }
    });

    // remove duplicates
    playlist = playlist.filter((track, index) => {
        let searchIndex = playlist.findIndex((track2) => {
            return track2.id === track.id;
        });
        return searchIndex === index;
    });

    if (playlist.length !== MAX) {
        playlist = await generate_from_tracks(access_token, tracks_seed, playlist);
    }

    return playlist;
}

module.exports = {
    generate_from_profile,
    generate_from_tracks
};