"use client";

import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";

export function RouteLoading() {
  const pathname = usePathname();
  if (pathname === "/attendance" || pathname.startsWith("/attendance/")) {
    return null;
  }

  return (
    <div className={styles.loadingBar} role="status" aria-label="Loading" />
  );
}
