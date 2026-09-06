"use client";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }) {
  return (
    <Suspense fallback={<div aria-hidden="true" />}>
      <TemplateContent>{children}</TemplateContent>
    </Suspense>
  );
}

function TemplateContent({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return children;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
