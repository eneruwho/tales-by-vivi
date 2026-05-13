export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8rem 2rem",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.03)",
          color: "var(--fg)",
        }}
      >
        Loading artists...
      </div>
    </main>
  );
}
