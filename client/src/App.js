import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import MediaQuery from "react-responsive";
import ReactGa from "react-ga";

const App = () => {
  const [id, setid] = useState("");
  const [pl, setpl] = useState([]);
  const [idx, setidx] = useState(-1);
  const [err, seterr] = useState("");
  const [clicked, setclicked] = useState(true);

  const download = (url, name) => {
    window.location.href = `/download?URL=${url}&name=${name}`;
  };

  const get_playlist = async () => {
    const res = await axios.get("/getplaylist?pid=" + id);
    const data = res.data;

    if (!("failed" in data)) {
      seterr("Songs:");
      setpl(data.map((x) => x.name));

      setTimeout(() => {
        data.forEach((x, i) => {
          setTimeout(async () => {
            setidx(i);
            const dlink = await axios.get("/link?url=" + x.url);
            download(dlink.data, x.name);
          }, 7000 * i);
        });
      }, 2000);
    } else {
      seterr("Id not valid");
    }
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
          placeholder="Enter playlist id"
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
        >
          * allow multiple file download
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
                    color: "#18d860",
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
