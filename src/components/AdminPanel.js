"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "../app/admin/admin.module.css";
import ProjectForm from "./ProjectForm";
import ArtistForm from "./ArtistForm";
import EditProjectForm from "./EditProjectForm";
import EditArtistForm from "./EditArtistForm";
import ClientLogosForm from "./ClientLogosForm";
import ShowreelForm from "./ShowreelForm";
import {
  deleteProject,
  deleteArtist,
  addProject,
  addArtist,
} from "../app/actions";
import Toast from "./Toast";
import { getProjectArtistLabel, getProjectArtistSlugs } from "../lib/projectArtists";

export default function AdminPanel({
  projects = [],
  artists = [],
  clientLogos = [],
}) {
  const [view, setView] = useState("projects"); // 'projects' or 'artists'
  const [modal, setModal] = useState(null); // { type: 'addProject'|'addArtist'|'editProject'|'editArtist'|'showreel'|'logos', payload }
  const [rowsProjects, setRowsProjects] = useState(projects || []);
  const [rowsArtists, setRowsArtists] = useState(artists || []);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmModal, setConfirmModal] = useState(null);
  const [deletedPending, setDeletedPending] = useState(null);
  const sessionCheckRef = useRef(null);

  function requestDeleteProject(item) {
    setConfirmModal({ type: "project", item });
  }

  async function handleDeleteProjectConfirmed(item) {
    const id = item.id;
    setConfirmModal(null);
    setBusyId(id);
    try {
      await deleteProject(id);
      setRowsProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletedPending({ type: "project", item });
      setToast({ type: "success", message: "Project deleted" });
      // auto-clear pending after timeout
      const t = setTimeout(() => setDeletedPending(null), 8000);
      setDeletedPending((d) => ({ ...d, timeout: t }));
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Delete failed" });
    } finally {
      setBusyId(null);
    }
  }

  function requestDeleteArtist(item) {
    setConfirmModal({ type: "artist", item });
  }

  async function handleDeleteArtistConfirmed(item) {
    const id = item.id;
    setConfirmModal(null);
    setBusyId(id);
    try {
      await deleteArtist(id);
      setRowsArtists((prev) => prev.filter((a) => a.id !== id));
      setDeletedPending({ type: "artist", item });
      setToast({ type: "success", message: "Artist deleted" });
      const t = setTimeout(() => setDeletedPending(null), 8000);
      setDeletedPending((d) => ({ ...d, timeout: t }));
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Delete failed" });
    } finally {
      setBusyId(null);
    }
  }

  function openAddProject() {
    setModal({ type: "addProject" });
  }
  function openAddArtist() {
    setModal({ type: "addArtist" });
  }
  function openShowreel() {
    setModal({ type: "showreel" });
  }
  function openLogos() {
    setModal({ type: "logos" });
  }

  // Periodically verify server-side session; if expired, redirect to login.
  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/check-session");
        if (!mounted) return;
        const json = await res.json();
        if (!json?.ok) {
          setToast({
            type: "error",
            message: "Session expired, redirecting to login...",
          });
          // slight delay so toast is visible
          setTimeout(() => {
            window.location.href = "/login";
          }, 1200);
        }
      } catch (e) {
        // network errors shouldn't force logout immediately
      }
    }

    // initial check
    checkSession();
    sessionCheckRef.current = setInterval(checkSession, 30 * 1000); // every 30s
    return () => {
      mounted = false;
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    };
  }, []);

  return (
    <div>
      <div className={styles.adminControlsTop}>
        <div className={styles.controlButtons}>
          <button
            className={styles.dashboardButtonWhite}
            onClick={openAddProject}
          >
            Add new project
          </button>
          <button
            className={styles.dashboardButtonWhite}
            onClick={openAddArtist}
          >
            Add new artist
          </button>
          <button
            className={styles.dashboardButtonWhite}
            onClick={openShowreel}
          >
            Update showreel
          </button>
          <button className={styles.dashboardButtonWhite} onClick={openLogos}>
            Upload client logos
          </button>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={
              view === "projects" ? styles.toggleActive : styles.toggleBtn
            }
            onClick={() => setView("projects")}
          >
            Projects
          </button>
          <button
            className={
              view === "artists" ? styles.toggleActive : styles.toggleBtn
            }
            onClick={() => setView("artists")}
          >
            Artists
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 8,
          alignItems: "center",
        }}
      >
        <input
          placeholder={
            view === "projects" ? "Search projects..." : "Search artists..."
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.input}
          style={{ maxWidth: 320 }}
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className={styles.input}
          style={{ width: 160 }}
        >
          {view === "projects" ? (
            <>
              <option value="id">Id</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
            </>
          ) : (
            <>
              <option value="id">Id</option>
              <option value="name">Name</option>
              <option value="slug">Slug</option>
            </>
          )}
        </select>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          className={styles.input}
          style={{ width: 120 }}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <label style={{ marginRight: 8 }}>Page size</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className={styles.input}
            style={{ width: 80 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapperCompact}>
        {view === "projects"
          ? (() => {
              // filter
              const filtered = rowsProjects.filter((p) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const artistLabel = getProjectArtistLabel(p).toLowerCase();
                return (
                  String(p.title || "")
                    .toLowerCase()
                    .includes(q) ||
                  artistLabel.includes(q) ||
                  getProjectArtistSlugs(p).join(" ").toLowerCase().includes(q) ||
                  String(p.slug || "")
                    .toLowerCase()
                    .includes(q)
                );
              });

              // sort
              filtered.sort((a, b) => {
                const aVal =
                  sortKey === "artist"
                    ? getProjectArtistLabel(a)
                    : String(a[sortKey] || "");
                const bVal =
                  sortKey === "artist"
                    ? getProjectArtistLabel(b)
                    : String(b[sortKey] || "");
                const aNorm = aVal.toLowerCase();
                const bNorm = bVal.toLowerCase();
                if (aNorm < bNorm) return sortDir === "asc" ? -1 : 1;
                if (aNorm > bNorm) return sortDir === "asc" ? 1 : -1;
                return 0;
              });

              const total = filtered.length;
              const pages = Math.max(1, Math.ceil(total / pageSize));
              const current = Math.min(page, pages);
              const start = (current - 1) * pageSize;
              const paged = filtered.slice(start, start + pageSize);

              return (
                <>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeader}>
                        <th>Id</th>
                        <th>Title</th>
                        <th>Artist</th>
                        <th>Categories</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((p) => (
                        <tr key={p.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>{p.id}</td>
                          <td className={styles.tableCell}>{p.title}</td>
                          <td className={styles.tableCell}>
                            {getProjectArtistLabel(p) || "Unknown artists"}
                          </td>
                          <td className={styles.tableCell}>
                            {(p.categories || p.category || []).toString()}
                          </td>
                          <td className={styles.tableCell}>
                            <button
                              className={styles.actionButton}
                              onClick={() =>
                                setModal({ type: "editProject", payload: p })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => requestDeleteProject(p)}
                              disabled={busyId === p.id}
                              style={{ marginLeft: 8 }}
                            >
                              {busyId === p.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      Showing {start + 1}–{Math.min(start + pageSize, total)} of{" "}
                      {total}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setPage(Math.max(1, page - 1))}
                      >
                        Prev
                      </button>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setPage(Math.min(pages, page + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              );
            })()
          : (() => {
              const filtered = rowsArtists.filter((a) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  String(a.name || "")
                    .toLowerCase()
                    .includes(q) ||
                  String(a.slug || "")
                    .toLowerCase()
                    .includes(q)
                );
              });
              filtered.sort((a, b) => {
                const aVal = String(a[sortKey] || "").toLowerCase();
                const bVal = String(b[sortKey] || "").toLowerCase();
                if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
                return 0;
              });
              const total = filtered.length;
              const pages = Math.max(1, Math.ceil(total / pageSize));
              const current = Math.min(page, pages);
              const start = (current - 1) * pageSize;
              const paged = filtered.slice(start, start + pageSize);

              return (
                <>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeader}>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Slogan</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((a) => (
                        <tr key={a.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>{a.id}</td>
                          <td className={styles.tableCell}>{a.name}</td>
                          <td className={styles.tableCell}>{a.slug}</td>
                          <td className={styles.tableCell}>
                            {a.slogan || "—"}
                          </td>
                          <td className={styles.tableCell}>
                            <button
                              className={styles.actionButton}
                              onClick={() =>
                                setModal({ type: "editArtist", payload: a })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => requestDeleteArtist(a)}
                              disabled={busyId === a.id}
                              style={{ marginLeft: 8 }}
                            >
                              {busyId === a.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      Showing {start + 1}–{Math.min(start + pageSize, total)} of{" "}
                      {total}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setPage(Math.max(1, page - 1))}
                      >
                        Prev
                      </button>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setPage(Math.min(pages, page + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
      </div>

      {/* Bottom update sections */}
      <div className={styles.updateSection}>
        <div className={styles.updatePanel}>
          <h4>Update / Upload</h4>
          <p className={styles.updateSub}>
            Use the forms below to upload assets and update site-level items
          </p>
        </div>
        <div className={styles.updateButtons}>
          <button
            className={styles.dashboardButtonWhite}
            onClick={openShowreel}
          >
            Update Showreel
          </button>
          <button className={styles.dashboardButtonWhite} onClick={openLogos}>
            Update Client Logos
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className={styles.modalBackdrop} onClick={() => setModal(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setModal(null)}
            >
              ×
            </button>
            {modal.type === "addProject" && (
              <ProjectForm
                artists={rowsArtists}
                onSaved={(created) => {
                  setRowsProjects((prev) => [created, ...prev]);
                  setModal(null);
                }}
              />
            )}
            {modal.type === "addArtist" && (
              <ArtistForm
                initialArtists={rowsArtists}
                onSaved={(created) => {
                  setRowsArtists((prev) => [created, ...prev]);
                  setModal(null);
                }}
              />
            )}
            {modal.type === "editProject" && (
              <EditProjectForm
                project={modal.payload}
                artists={rowsArtists}
                onSaved={(updated) => {
                  setRowsProjects((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p)),
                  );
                  setModal(null);
                }}
              />
            )}
            {modal.type === "editArtist" && (
              <EditArtistForm
                artist={modal.payload}
                onSaved={(updated) => {
                  setRowsArtists((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a)),
                  );
                  setModal(null);
                }}
              />
            )}
            {modal.type === "showreel" && <ShowreelForm />}
            {modal.type === "logos" && (
              <ClientLogosForm initialLogos={clientLogos} />
            )}
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this {confirmModal.type}? This
              action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className={styles.toggleBtn}
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              {confirmModal.type === "project" ? (
                <button
                  className={styles.deleteButton}
                  onClick={() =>
                    handleDeleteProjectConfirmed(confirmModal.item)
                  }
                >
                  Delete
                </button>
              ) : (
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteArtistConfirmed(confirmModal.item)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Undo bar for recent deletes */}
      {deletedPending && (
        <div style={{ position: "fixed", bottom: 18, left: 18, zIndex: 9999 }}>
          <div
            style={{
              background: "#222",
              color: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>Deleted {deletedPending.type}</div>
            <button
              className={styles.dashboardButtonWhite}
              onClick={async () => {
                // attempt undo by re-creating the item
                try {
                  if (deletedPending.type === "project") {
                    const f = new FormData();
                    const it = deletedPending.item;
                    f.append("title", it.title || it.name || "Restored");
                    f.append("slug", it.slug || it.title || "restored");
                    f.append(
                      "categories",
                      Array.isArray(it.categories)
                        ? it.categories.join(",")
                        : it.category || "",
                    );
                    (Array.isArray(it.artistSlugs) ? it.artistSlugs : []).forEach(
                      (slug) => {
                        if (slug) f.append("artistSlugs", slug);
                      },
                    );
                    if (it.imageUrl) f.append("imageUrl", it.imageUrl);
                    if (it.previewImageUrl)
                      f.append("previewImageUrl", it.previewImageUrl);
                    if (it.youtubeUrl) f.append("youtubeUrl", it.youtubeUrl);
                    if (it.instagramUrl)
                      f.append("instagramUrl", it.instagramUrl);
                    if (it.mediaType) f.append("mediaType", it.mediaType);
                    if (it.description) f.append("description", it.description);
                    await addProject(f);
                    setRowsProjects((prev) => [it, ...prev]);
                  } else if (deletedPending.type === "artist") {
                    const f = new FormData();
                    const it = deletedPending.item;
                    f.append("name", it.name || it.title || "Restored");
                    f.append("slug", it.slug || it.name || "restored");
                    f.append("slogan", it.slogan || "");
                    f.append("instagramUrl", it.instagramUrl || "");
                    f.append("bio", it.bio || "");
                    const created = await addArtist(f);
                    if (created) setRowsArtists((prev) => [created, ...prev]);
                  }
                  setDeletedPending(null);
                  setToast({
                    type: "success",
                    message: "Undo successful (attempted)",
                  });
                } catch (e) {
                  setToast({
                    type: "error",
                    message: "Undo failed: " + (e?.message || ""),
                  });
                }
              }}
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
