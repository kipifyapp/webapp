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

// for spotify.link domains
async function getHrefsFromLink(link) {
    try {
        const response = await fetch(
            link, {
            method: "GET",
        });
        const content = await response.text();
        const hrefs = [];
    
        // i have no idea how regular expressions work, ChatGPT wrote this
        const regex = /"https:\/\/open\.spotify\.com\/track\/[^"]+"/g;
        const matches = content.match(regex);
    
        if (matches) {
            matches.forEach(match => {
                const href = match.replace(/"/g, ''); // Remove surrounding quotes
                hrefs.push(href);
            });
        }
    
        return hrefs;
    } catch (e) {
        console.error(e);
        return []
    }
}

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
    generate_from_profile_v2,
    generate_from_tracks,
    generate_from_tracks_v2
} = require("./generator.js");

// home

app.get("/", async function(req, res) {
    if ("access_token" in req.cookies) {
       res.render("index", { login: true });
    } else {
        res.render("index", { login: false });
    }
});

// create
app.get("/create", async (req, res) => {
    res.render("create");
});

app.get("/create/:mode", async (req, res) => {
    if ("access_token" in req.cookies) {
        res.render(`create/${req.params.mode}`, { login: true });
    } else {
        res.render(`create/${req.params.mode}`, { login: false });
    }
});

// deliver

app.get("/deliver/:id", async (req, res) => {
    res.render(`deliver`, { playlist: req.params.id });
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

        res.redirect(`/deliver/${playlist.id}`);
    } else {
        res.redirect("/login");
    }
});

app.get("/generate/profile-v2", async (req, res) => {
    if ("access_token" in req.cookies) {
        const access_token = req.cookies.access_token;
        const user = await get_user_profile(access_token);
        const tracks = await generate_from_profile_v2(access_token);

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

        res.redirect(`/deliver/${playlist.id}`);
    } else {
        res.redirect("/login");
    }
});

app.get("/generate/tracks", async (req, res) => {
    if ("access_token" in req.cookies) {

        var trackIds = [];

        for (let i = 0; i < req.query.tracks.length; i++) {
            const v = req.query.tracks[i];
            let parsed = url.parse(v);
            if (parsed.hostname === "spotify.link") {
                const hrefs = await getHrefsFromLink(parsed.href)
                if (hrefs.length < 1) return;
                parsed = url.parse(hrefs[0]);

                if (!parsed.pathname) return;
                parsed.pathname = parsed.pathname.split("/");
                if (parsed.pathname[1] !== "track") return;
                trackIds.push(parsed.pathname[2]);
            } else if (parsed.hostname === "open.spotify.com") {
                if (!parsed.pathname) return;
                parsed.pathname = parsed.pathname.split("/");
                if (parsed.pathname[1] !== "track") return;
                trackIds.push(parsed.pathname[2]);
            }
        }

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

        res.redirect(`/deliver/${playlist.id}`);
    } else {
        res.redirect("/login");
    }
});

app.get("/generate/tracks-v2", async (req, res) => {
    if ("access_token" in req.cookies) {
        var trackIds = [];

        for (let i = 0; i < req.query.tracks.length; i++) {
            const v = req.query.tracks[i];
            let parsed = url.parse(v);
            if (parsed.hostname === "spotify.link") {
                const hrefs = await getHrefsFromLink(parsed.href)
                if (hrefs.length < 1) return;
                parsed = url.parse(hrefs[0]);

                if (!parsed.pathname) return;
                parsed.pathname = parsed.pathname.split("/");
                if (parsed.pathname[1] !== "track") return;
                trackIds.push(parsed.pathname[2]);
            } else if (parsed.hostname === "open.spotify.com") {
                if (!parsed.pathname) return;
                parsed.pathname = parsed.pathname.split("/");
                if (parsed.pathname[1] !== "track") return;
                trackIds.push(parsed.pathname[2]);
            }
        }

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
        const tracks = await generate_from_tracks_v2(access_token, trackIds);

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

        res.redirect(`/deliver/${playlist.id}`);
    } else {
        res.redirect("/login");
    }
});

// login

app.get("/login", async (req, res) => {
    if ("access_token" in req.cookies) {
        res.redirect("/create");
    } else {
        res.render("login", { redirect: req.query.redirect });
    }
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
                res.redirect("/create");
            } else {
                res.render("error", { error: "Error while logging in, try again" });
            }
        });
    }
});

module.exports = app;