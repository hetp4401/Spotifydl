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
    try {
      request(
        {
          url: process.env.T2 + pid,
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
        (e, r, b) => {
          if (e) {
            res.send({ failed: "no such playlist" });
          } else {
            try {
              total = JSON.parse(b).tracks.total;
              for (var i = 0; i < Math.ceil(total / 100); i++)
                get_songs(i * 100);
            } catch (error) {
              res.send({ failed: "no such playlist" });
            }
          }
        }
      );
    } catch (error) {
      res.send({ failed: "no such playlist" });
    }
  };

  const get_songs = (n) => {
    try {
      request(
        {
          url: process.env.T2 + pid + process.env.T3 + n,
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
        (e, r, b) => {
          if (e) {
            res.send({ failed: "no such playlist" });
          } else {
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
        }
      );
    } catch (error) {
      res.send({ failed: "no such playlist" });
    }
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
    https.get(url, { timeout: 7500 }, (response) => {
      response.pipe(res);
    });
  } catch (error) {}
});

app.get("/gdl", (req, res) => {
  const name = req.query.name;
  const artist = req.query.artist;
  try {
    request(
      {
        url: process.env.T4 + name + " " + artist.substring(0, 15) + " lyrics",
        method: "GET",
        timeout: 12000,
      },
      (e, r, b) => {
        if (e) {
          res.send("");
        } else {
          const index = b.indexOf(process.env.T6);
          const query = b.substring(index, index + 19);
          getDownload("https://www.youtube.com/watch?v=" + query).then(
            (dlink) => {
              res.send(dlink);
            }
          );
        }
      }
    );
  } catch (error) {
    res.send("");
  }
});

const rp = require("request-promise");

function getToken(youtube) {
  return rp("https://yt1s.com/api/ajaxSearch/index", {
    form: {
      q: youtube,
      vt: "mp3",
    },
    method: "POST",
  }).then((body) => {
    const json = JSON.parse(body);
    const { kc, vid } = json;
    return { kc, vid };
  });
}

function getUrl({ kc, vid }) {
  return rp("https://yt1s.com/api/ajaxConvert/convert", {
    form: {
      k: kc,
      vid: vid,
    },
    method: "POST",
  }).then((res) => {
    const json = JSON.parse(res);
    return json.dlink;
  });
}

function getDownload(youtube) {
  return getToken(youtube).then((token) => getUrl(token));
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));
