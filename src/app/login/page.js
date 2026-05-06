"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send OTP");
      setStep("otp");
      setMessage("OTP sent. It expires in 1 minute.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "OTP verification failed");
      router.push("/admin");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <form
        onSubmit={step === "credentials" ? sendOtp : verifyOtp}
        className={styles.form}
      >
        <h1>Admin Access</h1>
        <input
          type="email"
          name="email"
          placeholder="Admin email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Admin password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        {step === "otp" && (
          <input
            type="text"
            name="otp"
            placeholder="Enter 6-digit OTP"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={styles.input}
          />
        )}
        {message && (
          <p style={{ margin: 0, color: "var(--muted)" }}>{message}</p>
        )}
        <button type="submit" className={styles.button} disabled={loading}>
          {loading
            ? "Working…"
            : step === "credentials"
              ? "Send OTP"
              : "Verify OTP"}
        </button>
        {step === "otp" && (
          <button
            type="button"
            className={styles.button}
            onClick={sendOtp}
            disabled={loading}
            style={{ opacity: 0.8 }}
          >
            Resend OTP
          </button>
        )}
      </form>
    </div>
  );
}
