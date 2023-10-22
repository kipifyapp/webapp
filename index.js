const express = require("express");
const request = require("request");
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const url = require("url");
const dotenv = require("dotenv").config();

const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET; // Your secret
const redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

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

function generateRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const app = express();

app
.set("view engine", "ejs")
.set("views", `${__dirname}/views`)
.use(express.static(`${__dirname}/public`))
.use(cors())
.use(cookieParser());

const stateKey = "spotify_auth_state";
const scope = "user-read-private user-read-email user-library-read user-top-read playlist-modify-public playlist-modify-private";

const {
    generate_from_profile,
    generate_from_tracks
} = require("./generator.js");

// home

app.get("/", async function(req, res) {
    if ("access_token" in req.cookies) {
    //     const access_token = req.cookies.access_token;
    //     res.clearCookie("access_token");
    //     const user = await get_user_profile(access_token);

    //     const tracks = await generate(access_token);
    //     if (!tracks) {
    //         return res.render("index", { login: false });
    //     }

    //     const protocol = req.protocol; 
    //     const host = req.hostname; 
      
    //     const fullUrl = `${protocol}://${host}/` 

    //     const playlist = await create_playlist(
    //         user.id,
    //         access_token,
    //         "My recommendation playlist",
    //         `Playlist created by ${fullUrl} for ${user.display_name}`,
    //     );

    //     await add_items_to_playlist(playlist.id, access_token, tracks.map((track) => track.uri));

    //     // https://open.spotify.com/playlist/0DS1cECPXiQYEKIonlzq4L
        res.render("index", { login: true, playlist: "" });
    } else {
        res.render("index", { login: false });
    }
});

// create
app.get("/create", async (req, res) => {
    res.render("create", { login: false });
});

app.get("/create/:mode", async (req, res) => {
    if ("access_token" in req.cookies) {
        res.render(`create/${req.params.mode}`, { login: true, playlist: "" });
    } else {
        res.render(`create/${req.params.mode}`, { login: false });
    }
});

// generate

app.get("/generate/profile", async (req, res) => {
    if ("access_token" in req.cookies) {
        const access_token = req.cookies.access_token;
        const user = await get_user_profile(access_token);
        const tracks = await generate_from_profile(access_token);

        const protocol = req.protocol; 
        const host = req.hostname; 
        const fullUrl = `${protocol}://${host}/` 

        const playlist = await create_playlist(
            user.id,
            access_token,
            "My recommendation playlist",
            `Playlist created by ${fullUrl} for ${user.display_name}`,
        );

        await add_items_to_playlist(playlist.id, access_token, tracks.map((track) => track.uri));

        // https://open.spotify.com/playlist/1Y4IFBsjq8dEZ7C3MocDJs
        res.render("deliver", { login: true, playlist: playlist.id });
    } else {
        res.redirect("/login");
    }
});

// https://open.spotify.com/track/12FbZlYxIUv2rhB0oCQEhQ?si=d1ef5abe13d54760

app.get("/generate/tracks", async (req, res) => {
    if ("access_token" in req.cookies) {
        var trackIds = [];

        req.query.tracks.map((v) => {
            let parsed = url.parse(v);
            if (!parsed.pathname) return;
            parsed.pathname = parsed.pathname.split("/");
            if (parsed.pathname[1] !== "track") return;
            trackIds.push(parsed.pathname[2]);
        });

        // remove duplicates
        trackIds = trackIds.filter((track, index) => {
            let searchIndex = trackIds.findIndex((track2) => {
                return track2 === track;
            }); 
            return searchIndex === index;
        });

        if (trackIds.length < 1 || trackIds.length > 5) {
            return res.render("error", { error: "Nope." });
        }

        const access_token = req.cookies.access_token;
        const user = await get_user_profile(access_token);
        const tracks = await generate_from_tracks(access_token, trackIds);

        const protocol = req.protocol; 
        const host = req.hostname; 
        const fullUrl = `${protocol}://${host}/` 

        const playlist = await create_playlist(
            user.id,
            access_token,
            "My recommendation playlist",
            `Playlist created by ${fullUrl} for ${user.display_name}`,
        );

        await add_items_to_playlist(playlist.id, access_token, tracks.map((track) => track.uri));

        // https://open.spotify.com/playlist/1Y4IFBsjq8dEZ7C3MocDJs

        res.render("deliver", { login: true, playlist: playlist.id });
    } else {
        res.redirect("/login");
    }
});

// login

app.get("/login", async (req, res) => {
    res.render("login", { redirect: req.query.redirect });
});

// miscellaneous

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/privacy", function(req, res) {
    res.render("privacy");
});

// credentials

app.get("/login2", function(req, res) {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);
    // your application requests authorization
    res.redirect("https://accounts.spotify.com/authorize?" +
    querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: `${redirect_uri}`,
        state: state
    }));
});

app.get("/callback", async function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect("/#?" +
            querystring.stringify({
                error: "state_mismatch"
            }));
        } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: "authorization_code"
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64"))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                res.cookie("access_token", body.access_token, {
                    maxAge: 60 * 60 * 1000 // 1 hour
                });
                res.redirect("/");
            } else {
                res.redirect("/");
            }
        });
    }
});

module.exports = app;