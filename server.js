const express = require("express");
const cors = require("cors");
const app = express();

const exec = require("child_process").exec;
const https = require("https");
const request = require("request");
const Parser = require("fast-html-parser");

require("dotenv").config();

app.use(cors());

app.get("/gpl", (req, res) => {
  var pid = req.query.pid;
  if (pid.length === 82) {
    var i1 = pid.indexOf("playlist/");
    var i2 = pid.indexOf("?");
    pid = pid.substring(i1 + 9, i2);
  } else if (pid.length == 39) {
    var i1 = pid.indexOf("playlist:");
    pid = pid.substring(i1 + 9);
  }

  var total = 0;
  var playlist = [];
  var token = "";
  var fail = 0;

  exec(process.env.T1, (e, stdout, std) => {
    if (e) res.send({ failed: "no such playlist" });
    token = JSON.parse(stdout).access_token;
    start();
  });

  const start = () => {
    request(
      {
        url: process.env.T2 + pid,
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      (e, r, b) => {
        if (e) res.send({ failed: "no such playlist" });
        try {
          total = JSON.parse(b).tracks.total;
          for (var i = 0; i < Math.ceil(total / 100); i++) get_songs(i * 100);
        } catch (error) {
          res.send({ failed: "no such playlist" });
        }
      }
    );
  };

  const get_songs = (n) => {
    request(
      {
        url: process.env.T2 + pid + process.env.T3 + n,
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      (e, r, b) => {
        if (e) res.send({ failed: "no such playlist" });
        try {
          const json = JSON.parse(b);
          const items = json.items;

          items.forEach((x) => {
            try {
              const xname = x.track.name.replace(/[<>":\/|?*]/g, "");
              const xartist = x.track.album.artists[0].name;

              playlist.push({ name: xname, artist: xartist });
            } catch (error) {
              fail += 1;
            }
          });
          if (playlist.length === total - fail) res.send(playlist);
        } catch (error) {
          res.send({ failed: "no such playlist" });
        }
      }
    );
  };
});

app.get("/dl", (req, res) => {
  try {
    var url = req.query.url;
    var name = req.query.name;
    res.header(
      "Content-Disposition",
      'attachment; filename="' + name + '.mp3"'
    );
    https.get(url, (response) => response.pipe(res));
  } catch (error) {}
});

app.get("/gdl", (req, res) => {
  const name = req.query.name;
  const artist = req.query.artist;
  request(
    {
      url: process.env.T4 + name + " " + artist.substring(0, 15) + " lyrics",
      method: "GET",
      timeout: 18000,
    },
    (e1, r, b1) => {
      if (e1) res.send("");
      const index = b1.indexOf(process.env.T6);
      const url = b1.substring(index, index + 19);

      request(
        {
          url: process.env.T5 + url,
          method: "GET",
        },
        (e2, r, b2) => {
          if (e2) res.send("");
          try {
            const html = Parser.parse(b2);
            const durl = html.querySelector("#download").querySelector("a")
              .rawAttributes.href;
            res.send(durl);
          } catch (error) {
            res.send("");
          }
        }
      );
    }
  );
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));
