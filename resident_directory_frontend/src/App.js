import React, { useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import Toast from "./components/Toast";
import ResidentFormModal from "./components/ResidentFormModal";
import {
  clearAuth,
  createResident,
  deleteResident,
  getAuth,
  getApiBaseUrl,
  getResident,
  listResidents,
  login,
  setAuth,
  updateResident,
} from "./api/client";

const PAGE_SIZE = 10;

function isAdmin(auth) {
  return auth && auth.role === "admin";
}

// PUBLIC_INTERFACE
export default function App() {
  /** Main Resident Directory app UI. */
  const [auth, setAuthState] = useState(() => getAuth());
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@example.com");
  const [loginPassword, setLoginPassword] = useState("admin123");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitial, setFormInitial] = useState(null);

  const [toast, setToast] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const showToast = (t) => setToast(t);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listResidents({ q, page, pageSize: PAGE_SIZE });
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast({ variant: "error", title: "Load failed", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const onLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(loginEmail, loginPassword);
      setAuth({ token: res.access_token, role: res.role, email: res.email });
      setAuthState(getAuth());
      setLoginOpen(false);
      showToast({ variant: "success", title: "Logged in", message: `Signed in as ${res.email} (${res.role})` });
    } catch (err) {
      showToast({ variant: "error", title: "Login failed", message: err.message || "Invalid credentials" });
    }
  };

  const onLogout = () => {
    clearAuth();
    setAuthState(null);
    showToast({ variant: "success", title: "Logged out" });
  };

  const openDetails = async (id) => {
    try {
      const r = await getResident(id);
      setSelected(r);
      setDetailsOpen(true);
    } catch (err) {
      showToast({ variant: "error", title: "Failed to load details", message: err.message });
    }
  };

  const openCreate = () => {
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const r = await getResident(id);
      setFormMode("edit");
      setFormInitial(r);
      setFormOpen(true);
    } catch (err) {
      showToast({ variant: "error", title: "Failed to load resident", message: err.message });
    }
  };

  const onSaveResident = async (payload) => {
    if (!auth?.token) {
      showToast({ variant: "error", title: "Not authorized", message: "Please login as admin." });
      return;
    }

    if (formMode === "create") {
      await createResident(auth.token, payload);
      showToast({ variant: "success", title: "Resident created" });
    } else {
      await updateResident(auth.token, formInitial.id, payload);
      showToast({ variant: "success", title: "Resident updated" });
    }

    setFormOpen(false);
    await load();
  };

  const onDelete = async (id) => {
    if (!auth?.token) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this resident?");
    if (!ok) return;

    try {
      await deleteResident(auth.token, id);
      showToast({ variant: "success", title: "Resident deleted" });
      await load();
    } catch (err) {
      showToast({ variant: "error", title: "Delete failed", message: err.message });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>R</div>
          <div>
            <div className={styles.title}>Resident Directory</div>
            <div className={styles.subtitle}>Search and manage residents</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.apiHint}>
            API: <code className={styles.code}>{getApiBaseUrl()}</code>
          </div>

          {auth ? (
            <div className={styles.userBox}>
              <span className={styles.userMeta}>
                {auth.email} <span className={styles.roleBadge}>{auth.role}</span>
              </span>
              <button className={styles.btnSecondary} onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className={styles.btnPrimary} onClick={() => setLoginOpen(true)}>
              Login
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.toolbar}>
          <div className={styles.search}>
            <label className={styles.searchLabel} htmlFor="q">
              Search
            </label>
            <input
              id="q"
              className={styles.searchInput}
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search by name or email..."
            />
          </div>

          <div className={styles.actions}>
            <div className={styles.pager}>
              <button
                className={styles.btnSecondary}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className={styles.pageMeta}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                className={styles.btnSecondary}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>

            {isAdmin(auth) ? (
              <button className={styles.btnPrimary} onClick={openCreate}>
                Add resident
              </button>
            ) : null}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Residents</h2>
            <div className={styles.cardMeta}>
              {loading ? "Loading..." : `${total} total`}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className={styles.hideSm}>Email</th>
                  <th className={styles.hideSm}>Phone</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button className={styles.linkBtn} onClick={() => openDetails(r.id)}>
                        {r.name}
                      </button>
                    </td>
                    <td className={styles.hideSm}>{r.email || "—"}</td>
                    <td className={styles.hideSm}>{r.phone || "—"}</td>
                    <td className={styles.actionsCol}>
                      <button className={styles.btnSmall} onClick={() => openDetails(r.id)}>
                        View
                      </button>
                      {isAdmin(auth) ? (
                        <>
                          <button className={styles.btnSmall} onClick={() => openEdit(r.id)}>
                            Edit
                          </button>
                          <button className={styles.btnSmallDanger} onClick={() => onDelete(r.id)}>
                            Delete
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      No residents found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {loginOpen ? (
          <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Login">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>Login</h2>
                  <p className={styles.modalSub}>
                    Demo accounts: admin@example.com / admin123, user@example.com / user123
                  </p>
                </div>
                <button className={styles.iconBtn} onClick={() => setLoginOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>

              <form className={styles.modalForm} onSubmit={onLogin}>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input
                    className={styles.input}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Password</span>
                  <input
                    className={styles.input}
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="password"
                  />
                </label>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setLoginOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {detailsOpen && selected ? (
          <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Resident details">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>{selected.name}</h2>
                  <p className={styles.modalSub}>Resident details</p>
                </div>
                <button className={styles.iconBtn} onClick={() => setDetailsOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>

              <div className={styles.details}>
                <div className={styles.photoBox}>
                  {selected.photo_url ? (
                    <img
                      className={styles.photo}
                      src={`${getApiBaseUrl()}${selected.photo_url}`}
                      alt={`${selected.name} photo`}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder}>No photo</div>
                  )}
                </div>

                <div className={styles.kv}>
                  <div className={styles.k}>
                    <span>Email</span>
                    <strong>{selected.email || "—"}</strong>
                  </div>
                  <div className={styles.k}>
                    <span>Phone</span>
                    <strong>{selected.phone || "—"}</strong>
                  </div>
                  <div className={styles.k}>
                    <span>Address</span>
                    <strong>{selected.address || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setDetailsOpen(false)}>
                  Close
                </button>
                {isAdmin(auth) ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      setDetailsOpen(false);
                      openEdit(selected.id);
                    }}
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <ResidentFormModal
          open={formOpen}
          mode={formMode}
          initialValue={formInitial}
          token={auth?.token}
          onCancel={() => setFormOpen(false)}
          onSubmit={onSaveResident}
          onToast={showToast}
        />
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
