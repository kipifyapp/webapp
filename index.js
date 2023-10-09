const express = require("express"); // Express web server framework
const request = require("request"); // "Request" library
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
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

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
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
.set("views", "./views")
.use(express.static("./public"))
.use(cors())
.use(cookieParser());

const stateKey = "spotify_auth_state";
const scope = "user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private";

const generate = require("./generator.js");

app.get("/", async function(req, res) {
    if ("access_token" in req.cookies) {
        const access_token = req.cookies.access_token;
        res.clearCookie("access_token");
        let user = await get_user_profile(access_token);
        let playlist = await create_playlist(
            user.id,
            access_token,
            "My recommendation playlist",
            `Playlist created by Kipify for ${user.display_name}`,
        );

        const tracks = await generate(access_token);
        let add_items = await add_items_to_playlist(playlist.id, access_token, tracks.map((track) => track.uri));

        // https://open.spotify.com/playlist/0DS1cECPXiQYEKIonlzq4L
        res.render("index", { login: true, playlist: playlist.id });
    } else {
        res.render("index", { login: false });
    }
});

app.get("/about", function(req, res) {
    res.render("about")
});

app.get("/privacy", function(req, res) {
    res.render("privacy")
});

app.get("/login", function(req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    // your application requests authorization
    res.redirect("https://accounts.spotify.com/authorize?" +
    querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
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
                res.cookie("access_token", body.access_token);
                res.redirect("/");
            } else {
                res.redirect("/");
            }
        });
    }
});

app.get("/refresh_token", function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: { "Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64")) },
        form: {
            grant_type: "refresh_token",
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                "access_token": access_token
            });
        }
    });
});

module.exports = app;