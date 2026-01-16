import React, { useMemo, useState } from "react";
import styles from "./ResidentFormModal.module.css";
import { uploadPhoto } from "../api/client";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email.";
  }
  return errors;
}

// PUBLIC_INTERFACE
export default function ResidentFormModal({
  open,
  mode, // "create" | "edit"
  initialValue,
  token,
  onCancel,
  onSubmit,
  onToast,
}) {
  /** Modal form for creating/updating a resident (admin-only UI). */
  const initial = useMemo(() => {
    return {
      name: initialValue?.name || "",
      email: initialValue?.email || "",
      phone: initialValue?.phone || "",
      address: initialValue?.address || "",
      photo_url: initialValue?.photo_url || "",
    };
  }, [initialValue]);

  const [form, setForm] = useState(initial);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const title = mode === "edit" ? "Edit resident" : "Add resident";

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      let photoUrl = form.photo_url || null;

      if (photoFile) {
        const upload = await uploadPhoto(token, photoFile);
        photoUrl = upload.photo_url;
      }

      await onSubmit({
        name: form.name.trim(),
        email: form.email ? form.email.trim() : null,
        phone: form.phone ? form.phone.trim() : null,
        address: form.address ? form.address.trim() : null,
        photo_url: photoUrl,
      });
    } catch (err) {
      onToast({
        variant: "error",
        title: "Save failed",
        message: err.message || "Unable to save resident.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>Fields marked required must be provided.</p>
          </div>
          <button className={styles.iconBtn} onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Name <span className={styles.req}>*</span>
              </span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Full name"
              />
              {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                className={styles.input}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="name@example.com"
              />
              {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Phone</span>
              <input
                className={styles.input}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="(555) 010-1001"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Address</span>
              <input
                className={styles.input}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Street, City"
              />
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.label}>Photo</span>
              <input
                className={styles.input}
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <span className={styles.hint}>
                Optional. If selected, the photo will be uploaded to the backend and stored locally.
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnSecondary} type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button className={styles.btnPrimary} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
