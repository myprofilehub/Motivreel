"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./admin.module.css";

interface Reel {
  id: number;
  url: string;
  platform: string;
  title: string;
  videoPath: string | null;
  thumbnail: string | null;
  status: string; // "downloading" | "ready" | "failed"
  createdAt: string;
}

type ToastType = "success" | "error";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const [reels, setReels] = useState<Reel[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    setToast({ msg, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchReels = useCallback(async () => {
    setReelsLoading(true);
    try {
      const res = await fetch("/api/reels");
      const data: Reel[] = await res.json();
      setReels(data);
      return data;
    } catch {
      showToast("Failed to load reels", "error");
      return [];
    } finally {
      setReelsLoading(false);
    }
  }, [showToast]);

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((res) => {
        if (res.status === 200) setAuthed(true);
        else setAuthed(false);
      })
      .catch(() => setAuthed(false));
  }, []);

  // Auto-poll every 3s while any reel is downloading
  useEffect(() => {
    if (!authed) return;
    fetchReels().then((data) => {
      if (data.some((r: Reel) => r.status === "downloading")) {
        pollRef.current = setInterval(async () => {
          const fresh = await fetchReels();
          if (!fresh.some((r: Reel) => r.status === "downloading")) {
            clearInterval(pollRef.current!);
          }
        }, 3000);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [authed, fetchReels]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      setAuthed(true);
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
    setPinLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
  };

  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setAddLoading(true);
    const res = await fetch("/api/reels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), title: title.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("✅ Reel added successfully!");
      setUrl("");
      setTitle("");
      fetchReels();
    } else {
      showToast(data.error || "Failed to add reel", "error");
    }
    setAddLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this reel from your collection?")) return;

    const res = await fetch(`/api/reels/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("🗑️ Reel removed");
      setReels((prev) => prev.filter((r) => r.id !== id));
    } else {
      showToast("Failed to delete reel", "error");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":   return "▶";
      case "instagram": return "◈";
      case "sharechat": return "◉";
      default:          return "◎";
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ── Loading auth state ────────────────────────────────────────
  if (authed === null) {
    return (
      <div className={styles.centeredPage}>
        <div className={styles.bgGradient} />
        <div className="spinner" />
      </div>
    );
  }

  // ── PIN Login ─────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={styles.centeredPage}>
        <div className={styles.bgGradient} />
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />

        <form className={`glass ${styles.loginCard}`} onSubmit={handlePinSubmit} id="admin-login-form">
          <div className={styles.loginIcon}>🔐</div>
          <h1 className={styles.loginTitle}>Admin Panel</h1>
          <p className={styles.loginSubtitle}>Enter your PIN to manage your reel collection</p>

          <div className={styles.pinRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.pinDot} ${pin.length > i ? styles.pinDotFilled : ""}`}
              />
            ))}
          </div>

          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={styles.pinInput}
            placeholder="Enter PIN"
            autoFocus
            id="admin-pin-input"
            required
          />

          {pinError && <p className={styles.pinError}>{pinError}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pinLoading || pin.length < 4}
            id="admin-login-btn"
          >
            {pinLoading ? "Verifying..." : "Unlock →"}
          </button>

          <a href="/" className={styles.backLink}>← Back to viewer</a>
        </form>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────
  return (
    <div className={styles.dashboard}>
      <div className={styles.bgGradient} />
      <div className={styles.bgOrb1} />

      {/* Sidebar */}
      <aside className={`glass ${styles.sidebar}`}>
        <div className={styles.sidebarLogo}>
          <span>🔥</span>
          <span className={styles.sidebarLogoText}>MotivReel</span>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <span>🎬</span> Collection
          </div>
        </nav>

        <div className={styles.sidebarStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{reels.length}</span>
            <span className={styles.statLabel}>Total Reels</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>
              {reels.filter((r) => r.platform === "youtube").length}
            </span>
            <span className={styles.statLabel}>YouTube</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>
              {reels.filter((r) => r.platform === "instagram").length}
            </span>
            <span className={styles.statLabel}>Instagram</span>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <a href="/" className="btn btn-ghost btn-sm">← View Blog</a>
          <button onClick={handleLogout} className="btn btn-danger btn-sm" id="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.mainHeader}>
          <div>
            <h1 className={styles.mainTitle}>Reel Collection</h1>
            <p className={styles.mainSubtitle}>Add and manage your motivational videos</p>
          </div>
        </div>

        {/* Add reel form */}
        <form
          onSubmit={handleAddReel}
          className={`glass ${styles.addForm}`}
          id="add-reel-form"
        >
          <div className={styles.addFormHeader}>
            <span className={styles.addFormIcon}>✨</span>
            <h2 className={styles.addFormTitle}>Add New Reel</h2>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="reel-url">Video URL *</label>
              <input
                id="reel-url"
                type="url"
                className="input"
                placeholder="Paste YouTube Shorts, Instagram Reel, or ShareChat URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className={styles.inputHint}>
                Supports: youtube.com/shorts/ · instagram.com/reel/ · sharechat.com
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="reel-title">Title (optional)</label>
              <input
                id="reel-title"
                type="text"
                className="input"
                placeholder="Add a motivational caption..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={addLoading || !url.trim()}
            id="add-reel-btn"
          >
            {addLoading ? "Adding..." : "+ Add to Collection"}
          </button>
        </form>

        {/* Reels list */}
        <div className={styles.reelsList}>
          {reelsLoading ? (
            <div className={styles.listLoading}>
              <div className="spinner" />
            </div>
          ) : reels.length === 0 ? (
            <div className={`glass ${styles.emptyCard}`}>
              <span className={styles.emptyCardIcon}>🎬</span>
              <p>No reels yet. Add your first motivational reel above!</p>
            </div>
          ) : (
            reels.map((reel, i) => (
              <div
                key={reel.id}
                className={`glass ${styles.reelCard}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={styles.reelCardLeft}>
                  <div className={`${styles.reelNum}`}>{i + 1}</div>
                  <div className={styles.reelCardInfo}>
                    <div className={styles.reelCardMeta}>
                      <span className={`badge badge-${reel.platform}`}>
                        {getPlatformIcon(reel.platform)} {reel.platform}
                      </span>
                      <span className={`${styles.badgeStatus} ${styles[`status_${reel.status}`]}`}>
                        {reel.status === "downloading" && "⏳ "}
                        {reel.status === "ready" && "✅ "}
                        {reel.status === "failed" && "❌ "}
                        {reel.status}
                      </span>
                      <span className={styles.reelDate}>{formatDate(reel.createdAt)}</span>
                    </div>
                    {reel.title && (
                      <p className={styles.reelCardTitle}>{reel.title}</p>
                    )}
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.reelUrl}
                    >
                      {reel.url.length > 60 ? reel.url.slice(0, 60) + "…" : reel.url}
                    </a>
                  </div>
                </div>

                <div className={styles.reelCardActions}>
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    aria-label="Open reel"
                  >
                    ↗
                  </a>
                  <button
                    onClick={() => handleDelete(reel.id)}
                    className="btn btn-danger btn-sm"
                    aria-label="Delete reel"
                    id={`delete-reel-${reel.id}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type} ${toastVisible ? "show" : ""}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
