const fs = require("node:fs");
const path = require("node:path");

const targetFile = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");
  if (content.includes("prefetch-hints}.json")) {
    content = content.replace("prefetch-hints}.json", "prefetch-hints,preview-props}.json");
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("[patch-opennext] Successfully patched load-manifest.js with preview-props");
  } else {
    console.log("[patch-opennext] Already patched or pattern not found in load-manifest.js");
  }
} else {
  console.log("[patch-opennext] Target file not found (skipped)");
}
