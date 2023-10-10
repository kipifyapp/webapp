// fetch v2
import fetch from "node-fetch";
const url = require("url");
const querystring = require("querystring");

// singular: one track
async function get_track(track_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/tracks/${track_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

// plural: multiple tracks
async function get_tracks(track_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${track_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

// singular: one track
async function get_track_audio_features(track_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/audio-features/${track_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

// plural: multiple tracks
async function get_tracks_audio_features(track_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${track_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

async function get_recommendations(access_token, query) {
    const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${querystring.stringify(query)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    // console.log(response);

    return await response.json();
}

// singular: one artists
async function get_artist(artist_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

// plural: multiple artists
async function get_artists(artist_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists?ids=${artist_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

async function get_top_items(type, access_token, query) {
    let url = `https://api.spotify.com/v1/me/top/${type}`;

    if (query) {
        url += `?${querystring.stringify(query)}`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

async function get_all_top_items(type, access_token, query) {
    let response = await get_top_items(type, access_token, query);
    let items = [];

    response.items.forEach((v, i) => {
        items.push(v);
    });

    if (response.next) {
        let query2 = querystring.parse(url.parse(response.href).query);
        let next = querystring.parse(url.parse(response.next).query);
        for (let k of Object.keys(next)) {
            query2[k] = next[k];
        }

        let next_response = await get_top_items(type, access_token, query2);

        next_response.items.forEach((v, i) => {
            items.push(v);
        });
    }

    return items;
}

async function get_user_profile(access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    return await response.json();
}

async function create_playlist(user_id, access_token, name, description) {
    const response = await fetch(
        `https://api.spotify.com/v1/users/${user_id}/playlists`, {
        method: "POST",
        body: JSON.stringify({
            name: name,
            description: description
        }),
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        }
    });

    return await response.json();
}

async function add_items_to_playlist(playlist_id, access_token, items) {
    const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        method: "POST",
        body: JSON.stringify({ uris: items }),
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        }
    });

    return await response.json();
}

// Lover https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI
// get_track("1dGr1c8CrMLDpV6mPbImSI", auth.access_token, (error, response, body) => {
//     console.log("Get track 1dGr1c8CrMLDpV6mPbImSI")
//     if (response.statusCode === 200) {
//         console.log(body, "\n")
//     } else {
//         console.log(error, response.statusCode, "\n");
//     }
// });

// Taylor Swift https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02
// get_artist("06HL4z0CvFAxyc27GXpf02", auth.access_token, (error, response, body) => {
//     console.log("Get artist 06HL4z0CvFAxyc27GXpf02")
//     if (response.statusCode === 200) {
//         console.log(body, "\n")
//     } else {
//         console.log(error, response.statusCode, "\n");
//     }
// });

module.exports = {
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
}