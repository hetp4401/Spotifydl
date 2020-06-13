import React, { useState } from "react";
import axios from "axios";
import "./App.css";

import Par from "./Par";

const ytdl = require("ytdl-core");

const App = () => {
  const [id, setid] = useState("");
  const [pl, setpl] = useState([]);
  const [idx, setidx] = useState(-1);

  const [err, seterr] = useState("");

  const download = (url, name) => {
    if (ytdl.validateURL(url)) {
      window.location.href = window.location.href = `/download?URL=${
        "https://www.youtube.com/" + url
      }&name=${name}`;
    }
  };

  const get_playlist = async () => {
    const res = await axios.get("/getplaylist?pid=" + id);
    const data = res.data;
    console.log(data);

    if (!("failed" in data)) {
      seterr("Songs:");
      setpl(data.map((x) => x.name));

      setTimeout(() => {
        data.forEach((x, i) => {
          setTimeout(() => {
            setidx(i);
            download(x.url, x.name);
          }, 8000 * i);
        });
      }, 2000);
    } else {
      seterr("Id not valid");
    }
  };

  return (
    <div className="App" style={{ margin: 0, height: "100%" }}>
      <img
        src="https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png"
        width="200"
        height="200"
        style={{ marginTop: 30 }}
        alt="spotify logo"
      />
      <h1
        style={{
          fontWeight: "lighter",
          fontFamily: "Verdana",
        }}
      >
        Spotify PlayList Converter
      </h1>

      <div>
        <input
          className="URL-input"
          placeholder="Enter playlist id"
          value={id}
          onChange={(e) => setid(e.target.value)}
        />
        <button
          className="convert-button"
          onClick={() => {
            get_playlist();
            seterr("Fetching...");
          }}
        >
          Download
        </button>
      </div>
      <p style={{ marginTop: 0 }}>
        <small
          style={{
            fontWeight: "lighter",
            fontFamily: "Verdana",
            color: "#1f1f1f",
          }}
        >
          * Click allow for multiple file download
        </small>
      </p>

      <h3 style={{ fontWeight: "lighter", fontFamily: "Verdana" }}>{err}</h3>

      {pl.map((x, i) => (
        <div key={i} style={{ marginTop: 0, marginBottom: 0 }}>
          <p
            className="songs"
            style={
              i <= idx
                ? {
                    color: "#0ed657",
                    fontWeight: "lighter",
                    fontFamily: "Verdana",
                  }
                : {
                    color: "gray",
                    fontWeight: "lighter",
                    fontFamily: "Verdana",
                  }
            }
          >
            {x}
          </p>
        </div>
      ))}
      <div style={{ height: 1000 }}></div>
      <Par></Par>
    </div>
  );
};

export default App;