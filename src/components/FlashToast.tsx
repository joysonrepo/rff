"use client";

import { useEffect, useState } from "react";
import styles from "./AppShell.module.css";

type FlashToastProps = {
  type: "success" | "error";
  message: string;
};

export function FlashToast({ type, message }: FlashToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      document.cookie = "rff_flash=; path=/; max-age=0; SameSite=Lax";
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  function handleClose() {
    setVisible(false);
    document.cookie = "rff_flash=; path=/; max-age=0; SameSite=Lax";
  }

  return (
    <div className={type === "success" ? styles.toastSuccess : styles.toastError} role="status" aria-live="polite">
      <p className={styles.toastMessage}>{message}</p>
      <button type="button" onClick={handleClose} className={styles.toastOk}>
        Ok
      </button>
    </div>
  );
}
