import React, { useEffect } from "react";
import styles from "./Toast.module.css";

// PUBLIC_INTERFACE
export default function Toast({ toast, onClose }) {
  /** Toast message component. */
  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => onClose(), toast.durationMs || 3500);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const variantClass = toast.variant === "error" ? styles.error : styles.success;

  return (
    <div className={`${styles.toast} ${variantClass}`} role="status" aria-live="polite">
      <div className={styles.message}>
        <strong className={styles.title}>{toast.title}</strong>
        {toast.message ? <div className={styles.body}>{toast.message}</div> : null}
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Close toast">
        ×
      </button>
    </div>
  );
}
