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

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

// plural: multiple tracks
async function get_tracks(track_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${track_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

// singular: one track
async function get_track_audio_features(track_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/audio-features/${track_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

// plural: multiple tracks
async function get_tracks_audio_features(track_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${track_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function get_recommendations(access_token, query) {

    console.log(`https://api.spotify.com/v1/recommendations?${querystring.stringify(query)}`);

    const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${querystring.stringify(query)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers)
    }
}

// singular: one artists
async function get_artist(artist_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

// plural: multiple artists
async function get_artists(artist_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists?ids=${artist_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

// singular: one artists
async function get_artist_top_tracks(artist_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist_id}/top-tracks`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function get_album(album_id, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/albums/${album_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function get_albums(album_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/albums?ids=${album_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
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

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
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

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function check_user_saved_tracks(track_ids, access_token) {
    const response = await fetch(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${track_ids.join("%2C")}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function create_playlist(user_id, access_token, name, description) {
    const data = JSON.stringify({
        name: name,
        description: description
    });
    const response = await fetch(
        `https://api.spotify.com/v1/users/${user_id}/playlists`, {
        method: "POST",
        body: data,
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

async function add_items_to_playlist(playlist_id, access_token, items) {
    const data = JSON.stringify({ uris: items });
    const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        method: "POST",
        body: data,
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        }
    });

    if (response.status >= 200 && response.status < 300) {
        return await response.json();
    } else {
        return await console.error(response.status, response, response.headers);
    }
}

module.exports = {
    get_track,
    get_tracks,
    get_track_audio_features,
    get_tracks_audio_features,
    get_recommendations,
    get_artist,
    get_artists,
    get_artist_top_tracks,
    get_album,
    get_albums,
    get_top_items,
    get_all_top_items,
    get_user_profile,
    check_user_saved_tracks,
    create_playlist,
    add_items_to_playlist
}