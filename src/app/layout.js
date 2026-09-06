import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import { Suspense } from "react";

export const metadata = {
  metadataBase: new URL("https://www.talesbyvivi.com"),
  title: {
    default: "Tales by VIVI | Creative Partner",
    template: "%s | Tales by VIVI",
  },
  description:
    "Stories told through light, motion & texture. We are a creative studio specializing in animation, motion design, and visual storytelling. Based in Kolkata.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tales by VIVI | Creative Partner",
    description:
      "Stories told through light, motion & texture. A Kolkata-based creative studio for animation, motion design, and visual storytelling.",
    url: "/",
    siteName: "Tales by VIVI",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tales by VIVI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tales by VIVI | Creative Partner",
    description:
      "Stories told through light, motion & texture. A Kolkata-based creative studio for animation, motion design, and visual storytelling.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SmoothScroll>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            {children}
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
