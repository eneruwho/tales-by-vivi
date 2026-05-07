const http = require("http");
const options = { hostname: "localhost", port: 3001, path: "/", method: "GET" };
const req = http.request(options, (res) => {
  console.log("status", res.statusCode);
  res.on("data", (d) => process.stdout.write(d));
  res.on("end", () => process.exit(0));
});
req.on("error", (e) => {
  console.error("err", e.message);
  process.exit(2);
});
req.end();
