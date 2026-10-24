import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.65 }}>
          Tales by VIVI
        </p>
        <h1>That page is not available.</h1>
        <p style={{ maxWidth: 460, margin: "1rem auto 1.5rem", opacity: 0.7 }}>
          The link may be outdated, or this project/profile may have moved.
        </p>
        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/">Return home</Link>
          <Link href="/artists">Browse artists</Link>
          <a href="https://www.instagram.com/talesby.vivi/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
      </div>
    </main>
  );
}
