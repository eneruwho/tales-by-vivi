const data = {
  name: "Test Member Fetch",
  slug: "test-member-fetch",
  slogan: "X",
  bio: "Y",
  imageUrl:
    "https://res.cloudinary.com/dsyvbjozy/image/upload/v1778170258/artists/artists-1778170252991-1.png",
};

(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/add-artist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    console.log("status", res.status);
    console.log("body", text);
  } catch (e) {
    console.error("error", e && e.message);
  }
})();
