const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

function headRequest(url) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.request(
        {
          method: "HEAD",
          host: u.hostname,
          path: u.pathname + (u.search || ""),
          port: u.port || (u.protocol === "https:" ? 443 : 80),
          timeout: 5000,
        },
        (res) => {
          resolve(res.statusCode);
        },
      );
      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.abort();
        reject(new Error("timeout"));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function check() {
  const dataPath = path.join(process.cwd(), "data.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const store = JSON.parse(raw);
  const items = [];

  (store.artists || []).forEach((a) => {
    if (a.imageUrl)
      items.push({ type: "artist", id: a.id, name: a.name, url: a.imageUrl });
  });
  (store.projects || []).forEach((p) => {
    if (p.imageUrl)
      items.push({
        type: "project-image",
        id: p.id,
        name: p.title,
        url: p.imageUrl,
      });
    if (p.videoUrl)
      items.push({
        type: "project-video",
        id: p.id,
        name: p.title,
        url: p.videoUrl,
      });
  });

  if (items.length === 0) {
    console.log("No URLs found in data.json");
    return;
  }

  for (const it of items) {
    try {
      const status = await headRequest(it.url);
      console.log(`${it.type} ${it.id} (${it.name}): ${it.url} -> ${status}`);
    } catch (err) {
      console.log(
        `${it.type} ${it.id} (${it.name}): ${it.url} -> ERROR: ${err.message}`,
      );
    }
  }
}

check().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
