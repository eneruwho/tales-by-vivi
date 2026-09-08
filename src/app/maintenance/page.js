import Image from "next/image";

export const metadata = {
  title: "Under Maintenance | Tales by VIVI",
  description: "Tales by VIVI is currently under maintenance. We will be back online shortly.",
};

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ marginBottom: "2.5rem", maxWidth: "220px" }}>
        <Image
          src="/logo.png"
          alt="Tales by VIVI"
          width={220}
          height={80}
          style={{ width: "100%", height: "auto", objectFit: "contain" }}
          priority
        />
      </div>

      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 300,
          letterSpacing: "-0.02em",
          marginBottom: "1rem",
          textTransform: "uppercase",
        }}
      >
        Under Maintenance
      </h1>

      <p
        style={{
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          color: "#888888",
          maxWidth: "480px",
          lineHeight: 1.6,
          fontWeight: 300,
          marginBottom: "2.5rem",
        }}
      >
        We are currently performing scheduled system upgrades. Our studio portfolio will be back online shortly.
      </p>

      <div
        style={{
          fontSize: "0.85rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#555555",
          borderTop: "1px solid #1c1c1c",
          paddingTop: "1.5rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        Tales by VIVI &copy; 2026
      </div>
    </div>
  );
}
