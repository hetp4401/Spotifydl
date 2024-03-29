const https = require("https");
const contentDisposition = require("content-disposition");

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const { getPlaylist } = require("./spotify");
const { getDownload } = require("./youtube");

app.get("/api/playlist", (req, res) => {
  var id = req.query.id;
  if (id.startsWith("https://open.spotify.com/playlist/")) {
    var i1 = id.indexOf("https://open.spotify.com/playlist/") + 34;
    var i2 = id.indexOf("?", 34);
    id = id.substring(i1, i2);
  } else if (id.length === 82) {
    var i1 = id.indexOf("playlist/");
    var i2 = id.indexOf("?");
    id = id.substring(i1 + 9, i2);
  } else if (id.length == 39) {
    var i1 = id.indexOf("playlist:");
    id = id.substring(i1 + 9);
  }

  getPlaylist(id)
    .then((playlist) => {
      res.status(200).json(playlist);
    })
    .catch((err) => {
      res.status(400).send({ error: "Error retrieving playlist" });
    });
});

app.get("/api/download", (req, res) => {
  const name = req.query.name;
  const artist = req.query.artist;

  getDownload(name, artist)
    .then((link) => {
      res.header("Content-Disposition", contentDisposition(`${name}.mp3`));
      https.get(link, function (response) {
        response.pipe(res);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({ error: "Error retrieving download link" });
    });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("working on 8080..."));
