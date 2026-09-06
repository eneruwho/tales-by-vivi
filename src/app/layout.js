import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import { Suspense } from "react";

export const metadata = {
  title: "Tales by VIVI | Creative Partner",
  description:
    "Stories told through light, motion & texture. We are a creative studio specializing in animation, motion design, and visual storytelling. Based in Kolkata.",
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
