# MobiTV Pro

A full-stack media streaming platform — movies, series, live TV, and retro games — built entirely with vanilla HTML, CSS, and JavaScript. Zero frameworks, zero bundlers.

🔗 **Live demo:** https://celadon-basbousa-a58e9e.netlify.app/

## Features
- Stream movies and series with no downloads required
- Live TV channels from around the world
- Retro game emulation (in progress)
- Automatic source failover — if one streaming API fails, the app transparently switches to another
- User authentication: email/password and "Continue with Google" (Firebase Auth)
- Firestore database for user and admin data
- Both end-user and admin flows supported

## Tech Stack
- HTML5 / CSS3 / Vanilla JavaScript (ES6+)
- Firebase (Authentication + Firestore)
- TMDB API — movie/series metadata and posters
- RAWG API — game cover art
- IPTV-org — live TV channel data
- retrogames.cc — retro game emulation
- vidsrc.cc — movie/series streaming source
- Netlify — hosting + serverless functions

## Status
Actively in development. Home page streaming and live TV channels are fully working; the retro games section is being finished now, followed by dedicated per-title pages for each piece of media.

## Attribution
This product uses the TMDB API but is not endorsed or certified by TMDB.

## Getting Started
This is a static frontend project — no build step required.
```bash
git clone https://github.com/sharifbaig/MobiTV-Pro.git
cd MobiTV-Pro
# add your Firebase config and API keys to config.js (see config.example.js)
# serve with any static server, e.g.:
npx serve .
```