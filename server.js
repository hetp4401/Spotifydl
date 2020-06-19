const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");
const exec = require("child_process").exec;
const Parser = require("fast-html-parser");
const https = require("https");

require("dotenv").config();

app.use(cors());

app.get("/getplaylist", (req, res) => {
  var pid = req.query.pid;

  var TOTAL = 0;
  var rtotal = 0;
  const playlist = [];
  var token = "";

  exec(process.env.ST1, (err, stdout, std) => {
    token = JSON.parse(stdout).access_token;
    start();
  });

  const start = () => {
    request(
      {
        url: process.env.ST2 + pid,
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
        url: process.env.ST2 + pid + process.env.ST3 + n,
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
          process.env.YT1 + xname + " " + xartist.substring(0, 20) + " lyrics",
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

  try {
    https.get(URL, (response) => {
      response.pipe(res);
    });
  } catch (error) {
    res.send({ failed: "failed" });
  }
});

app.get("/link", (req, res) => {
  const url = req.query.url;
  request(process.env.YT2 + url, (err, re, body) => {
    const html = Parser.parse(body);
    const durl = html.querySelector("#download").querySelector("a")
      .rawAttributes.href;
    res.send(durl);
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));
