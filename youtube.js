const rp = require("request-promise");
const { parse } = require("fast-html-parser");

function getMp3(url) {
  return rp("https://www.fastconv.com/models/convertProcess.php", {
    form: {
      type: "mp3",
      search_txt: url,
    },
    method: "POST",
  }).then((body) => {
    const html = parse(body);

    const links = html
      .querySelectorAll(".data_option")
      .map((x) => x.rawAttributes["data-link"]);

    return links[0];
  });
}

function getMp3s2(url) {
  return rp("https://y2convert.net/convert?url=" + url).then((body) => {
    const html = parse(body);

    const links = html
      .querySelector("tbody")
      .querySelectorAll("tr")
      .map(
        (x) => x.querySelectorAll("td")[2].querySelector("a").rawAttributes.href
      );

    return links[0];
  });
}

function getYoutubeTop(name, artist) {
  return rp(
    encodeURI(
      `https://www.youtube.com/results?search_query=${name} lyrics ${artist}`
    )
  ).then((body) => {
    const idx = body.indexOf("/watch?v=") + 9;
    const idx2 = body.indexOf('"', idx);
    const id = body.substring(idx, idx2);
    const top = "https://www.youtube.com/watch?v=" + id;
    return top;
  });
}

function getDownload(name, artist) {
  return getYoutubeTop(name, artist).then((url) => getMp3s2(url));
}

module.exports = { getDownload };
