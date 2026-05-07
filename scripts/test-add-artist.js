const http = require("http");
const data = JSON.stringify({
  name: "Test Member",
  slug: "test-member",
  slogan: "X",
  bio: "Y",
  imageUrl:
    "https://res.cloudinary.com/dsyvbjozy/image/upload/v1778170258/artists/artists-1778170252991-1.png",
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const options = {
  hostname: "localhost",
  port,
  path: "/api/add-artist",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("status", res.statusCode);
    console.log("body", body);
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error("request error", e.message);
  process.exit(2);
});

req.write(data);
req.end();
