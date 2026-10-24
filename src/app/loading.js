export default function Loading() {
  return (
    <main
      aria-busy="true"
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
        <p>Loading the latest work…</p>
        <a href="https://www.instagram.com/talesby.vivi/" target="_blank" rel="noopener noreferrer">
          Follow the studio on Instagram
        </a>
      </div>
    </main>
  );
}
