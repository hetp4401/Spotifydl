import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import MediaQuery from "react-responsive";
import ReactGa from "react-ga";

const App = () => {
  const [id, setid] = useState("");
  const [pl, setpl] = useState([]);
  const [err, seterr] = useState("");
  const [clicked, setclicked] = useState(true);

  const get_playlist = () => {
    fetch("/api/playlist?id=" + id)
      .then((res) => res.json())
      .then((playlist) => {
        setpl(playlist);
        seterr("Songs:");
      })
      .catch((err) => {
        seterr("Id not valid");
        setpl([]);
      });
  };

  useEffect(() => {
    ReactGa.initialize("UA-170046601-1");
    ReactGa.pageview("/");
  }, []);

  return (
    <div className="App">
      <img
        src="https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png"
        width="200"
        height="200"
        style={{ marginTop: 60 }}
        alt="spotify logo"
      />
      <h1
        style={{
          fontWeight: "lighter",
          fontFamily: "Verdana",
        }}
      >
        Spotify Playlist Converter
      </h1>

      <div>
        <input
          className="URL-input"
          placeholder="Enter Playlist ID, Link, Or URI"
          value={id}
          onChange={(e) => setid(e.target.value)}
          style={{ color: "#18d860" }}
        />
        <button
          className="convert-button"
          onClick={(e) => {
            get_playlist();
            seterr("Fetching...");
            setclicked(false);
            ReactGa.event({
              category: "download",
              action: "user clicked download",
            });
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
            color: "#696969",
          }}
        ></small>
      </p>

      <h3 style={{ fontWeight: "lighter", fontFamily: "Verdana" }}>{err}</h3>

      {pl.map((x, i) => (
        <div key={i} style={{ marginTop: 0, marginBottom: 0 }}>
          <p
            className="songs"
            style={{
              color: "#18d860",
              fontWeight: "lighter",
              fontFamily: "Verdana",
            }}
          >
            {x.name}
          </p>
          <a href={`/api/download?name=${x.name}&artist=${x.artist}`}>
            Download
          </a>
        </div>
      ))}

      <MediaQuery minDeviceWidth={1224}>
        {clicked ? (
          <div id="footer" style={{ fontFamily: "Verdana" }}>
            Try it on mobile! Downloads playlist straight to your device!
          </div>
        ) : (
          <div></div>
        )}
      </MediaQuery>
    </div>
  );
};

export default App;
