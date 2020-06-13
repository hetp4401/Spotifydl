const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const app = express();
const request = require("request");
const exec = require("child_process").exec;

app.use(cors());

app.get("/getplaylist", (req, res) => {
  var pid = req.query.pid;

  var TOTAL = 0;
  var rtotal = 0;
  const playlist = [];
  var token = "";

  exec(
    'curl -H "Authorization: Basic MzMzOWRhYTU3NWExNDA0NTgyNjE1ZGYwNWExODIyZjQ6MDA0NWNkNWZiM2VmNDI4Yzk4YTdjYmFjZGI3MzdmYTg=" -d grant_type=refresh_token -d refresh_token=AQBPkKRuCCS2UwEFjXu0GR7kxzl-9RKM8cxg1RBc_D_CiN-7YvLhGqE8K4entrfji3hLg2YvqvFEUjecCFuYSIvm_zF1QeZEnCGCVqrQUZudY0stf9gc2ajyV1hplDFaHJw https://accounts.spotify.com/api/token',
    (err, stdout, std) => {
      token = JSON.parse(stdout).access_token;
      start();
    }
  );

  const start = () => {
    request(
      {
        url: "https://api.spotify.com/v1/playlists/" + pid,
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      (err, re, body) => {
        if (!err) {
          try {
            TOTAL = JSON.parse(body).tracks.total;
            for (var i = 0; i < Math.ceil(TOTAL / 100); i++) get_songs(i * 100);
          } catch (error) {
            res.send({ failed: "no such playlist" });
          }
        }
      }
    );
  };

  const get_songs = (n) => {
    request(
      {
        url:
          "https://api.spotify.com/v1/playlists/" + pid + "/tracks?offset=" + n,
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      (err, re, body) => {
        add_song_to_playlist(body);
      }
    );

    const add_song_to_playlist = (body) => {
      const json = JSON.parse(body);
      const items = json.items;

      items.forEach((x) => {
        const xname = x.track.name.replace(/[<>":\/|?*]/g, "");
        const xartist = x.track.album.artists[0].name;

        request(
          "https://www.youtube.com/results?search_query=" +
            xname +
            " " +
            xartist +
            " lyrics",
          (err, re, body) => {
            rtotal += 1;
            if (body) {
              const index = body.indexOf("watch?v=");
              const xurl = body.substring(index, index + 19);
              playlist.push({
                name: xname,
                artist: xartist,
                url: xurl,
              });
              if (rtotal === TOTAL) {
                res.send(playlist);
              }
            }
          }
        );
      });
    };
  };
});

app.get("/download", (req, res) => {
  var URL = req.query.URL;
  var name = req.query.name;

  res.setHeader("Content-Type", "audio/mpeg");
  res.header("Content-Disposition", 'attachment; filename="' + name + '.mp3"');

  ytdl(URL, {
    format: "mp3",
    filter: "audioonly",
    quality: "highest",
  }).pipe(res);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));
