const rp = require("request-promise");

const credentials = {
  basic:
    "Basic NDhmNjI5NjY1MjQyNGYwYTlmZTkyZDQ4ZWM5ODA5YWQ6ZjVkYzgzY2ExNDQzNDBmMGIwNTQ1NWJjOGQ1OGE1NDc=",
  refresh:
    "AQB_68xDF4h9kwb2ROrfLNjJb0QMu99_FUBYze1spSUXEvtwdoi5vYA95ZPKb0Qvv_8aAgVkwll1ylKsN0i3bNrK7Clg9VpPMnZUkxP9jjRPp50OXIYhn7gJN_wHLsWwh_Q",
};

function getAccessToken() {
  if (
    credentials.token &&
    parseInt(new Date() - credentials.created) < 3600 * 1000
  ) {
    return Promise.resolve(credentials.token);
  }

  return rp("https://accounts.spotify.com/api/token", {
    headers: {
      Authorization: credentials.basic,
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: credentials.refresh,
    },
    method: "POST",
  }).then((body) => {
    const json = JSON.parse(body);
    const accessToken = json["access_token"];
    credentials.token = accessToken;
    credentials.created = new Date();
    return accessToken;
  });
}

function getTotal(id) {
  return rp(`https://api.spotify.com/v1/playlists/${id}/tracks?fields=total`, {
    headers: {
      Authorization: "Bearer " + credentials.token,
    },
  }).then((body) => {
    const json = JSON.parse(body);
    const total = json.total;
    return total;
  });
}

function getOffSet(id, offset) {
  return rp(
    `https://api.spotify.com/v1/playlists/${id}/tracks?fields=items.track(name,artists(name))&offset=${offset}&limit=100`,
    {
      headers: {
        Authorization: "Bearer " + credentials.token,
      },
    }
  ).then((body) => {
    const json = JSON.parse(body);
    const songs = json.items
      .map((x) => x.track)
      .map(({ name, artists }) => ({ name, artist: artists[0].name }));
    return songs;
  });
}

function getPlaylist(id) {
  return getAccessToken().then((token) =>
    getTotal(id)
      .then((total) => [...Array(Math.ceil(total / 100)).keys()])
      .then((pages) => pages.map((x) => getOffSet(id, x)))
      .then((pages) => Promise.all(pages))
      .then((pages) => pages.reduce((a, b) => a.concat(b)))
  );
}

module.exports = { getPlaylist };

