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
        if (e) {
          res.send({ failed: "no such playlist" });
        } else {
          try {
            total = JSON.parse(b).tracks.total;
            for (var i = 0; i < Math.ceil(total / 100); i++) get_songs(i * 100);
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
        request(
          {
            url: process.env.T5 + query,
            method: "GET",
          },
          (e2, r2, b2) => {
            if (e2) {
              res.send("");
            } else {
              try {
                const html = Parser.parse(b2);
                const dl = html.querySelector("#download").querySelector("a")
                  .rawAttributes.href;
                res.send(dl);
              } catch (error) {
                res.send("");
              }
            }
          }
        );
      }
    }
  );
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));

var parse = require("fast-html-parser").parse;
const archiver = require("archiver");

var token = "";

var get_token = () => {
  exec(process.env.T1, (e, r, b) => {
    if (!e) {
      token = JSON.parse(r).access_token;
    }
  });
};

var get_playlist = (id, res) => {
  request(
    {
      url:
        "https://api.spotify.com/v1/playlists/" + id + "?fields=tracks.total",
      headers: {
        Authorization: "Bearer " + token,
      },
      method: "GET",
    },
    (e, r, b) => {
      var total = Math.ceil(JSON.parse(b).tracks.total / 100);
      var songs = [];

      get_songs = (i) => {
        var offset = i * 100;
        console.log(i);
        if (i < total) {
          request(
            {
              url:
                "https://api.spotify.com/v1/playlists/" +
                id +
                "/tracks/" +
                "?offset=" +
                offset +
                "&fields=items(track(name,album(artists)))",
              headers: {
                Authorization: "Bearer " + token,
              },
              method: "GET",
            },
            (e, r, b) => {
              songs.concat(
                JSON.parse(b).items.forEach((x) => {
                  songs.push({
                    name: x.track.name,
                    artist: x.track.album.artists[0].name,
                  });
                })
              );
              get_songs(i + 1);
            }
          );
        } else if (i == total) {
          var urls = [];
          songs.forEach((x, i) => {
            setTimeout(() => {
              request(
                {
                  url:
                    "https://www.youtube.com/results?search_query=" +
                    x.name +
                    " " +
                    x.artist.substring(0, 15) +
                    " lyrics",
                  method: "GET",
                },
                (e, r, b) => {
                  if (!e) {
                    const index = b.indexOf("watch?v=");
                    const query = b.substring(index, index + 19);
                    request(
                      {
                        url: "https://www.320youtube.com/v1/" + query,
                        method: "GET",
                      },
                      (e, r, b) => {
                        if (!e) {
                          const html = parse(b);
                          const dl = html
                            .querySelector("#download")
                            .querySelector("a").rawAttributes.href;

                          console.log(x);
                          console.log(dl);
                          urls.push({
                            name: x.name,
                            link: dl,
                          });
                          if (urls.length == songs.length) {
                            console.log("Finshed get dls");

                            const zip = archiver("zip", { zlib: { level: 9 } });

                            zip.pipe(res);

                            zip.on("progress", (progress) => {
                              console.log(progress.entries);
                            });

                            urls.forEach((x) => {
                              try {
                                zip.append(request(x.link), {
                                  name: x.name + ".mp3",
                                });
                              } catch (error) {}
                            });

                            zip.finalize();
                          }
                        }
                      }
                    );
                  }
                }
              );
            }, i * 0);
          });
        }
      };
      get_songs(0);
    }
  );
};

app.get("/download", (req, res) => {
  const id = req.query.id;
  get_playlist(id, res);
});

get_token();

// setTimeout(() => {
//   get_playlist("7aKwmmnaZSDYKXZSh7evJz");
// }, 2000);
