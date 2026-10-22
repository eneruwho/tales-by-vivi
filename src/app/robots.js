export default function robots() {
  return {
    rules: [
      {
        userAgent: ["meta-externalagent", "facebookexternalhit"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api/"],
      },
    ],
  };
}
