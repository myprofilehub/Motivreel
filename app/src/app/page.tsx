"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./page.module.css";

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

interface Comment {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

const QUOTES = [
  "Every day is a fresh start. 🔥",
  "Your only limit is your mind. ✨",
  "Dream big. Work hard. Stay focused. 💫",
  "Rise up and attack the day with enthusiasm. 🌅",
  "You are capable of amazing things. 🚀",
  "Push yourself, because no one else will. 💪",
  "The secret is to start. Go! 🌟",
  "Hard work beats talent when talent doesn't work hard. ⚡",
];

export default function HomePage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quote, setQuote] = useState("");

  // Likes (persisted in localStorage)
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [heartBurst, setHeartBurst] = useState<number | null>(null);

  // Audio state
  const [isMuted, setIsMuted] = useState(true);

  // Comments panel
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentReelId, setCommentReelId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    try {
      const storedLiked = JSON.parse(localStorage.getItem("motivreel_liked") || "[]");
      const storedCounts = JSON.parse(localStorage.getItem("motivreel_counts") || "{}");
      setLiked(new Set(storedLiked));
      setLikeCounts(storedCounts);
    } catch {}
  }, []);

  const fetchReels = useCallback(async () => {
    try {
      const res = await fetch("/api/reels");
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data);
        setReels([]);
        return [];
      }
      setReels(data);
      return data as Reel[];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 3s while any reel is still "downloading"
  const startPolling = useCallback((data: Reel[]) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const hasPending = data.some((r) => r.status === "downloading");
    if (!hasPending) return;

    pollRef.current = setInterval(async () => {
      const fresh = await fetchReels();
      if (!fresh.some((r: Reel) => r.status === "downloading")) {
        clearInterval(pollRef.current!);
      }
    }, 3000);
  }, [fetchReels]);

  useEffect(() => {
    fetchReels().then(startPolling);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchReels, startPolling]);

  // Pause all videos except the active one
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      const idx = reels.findIndex((r) => r.id === id);
      if (idx === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, reels]);

  // Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );

    const slides = containerRef.current?.querySelectorAll("[data-index]");
    slides?.forEach((slide) => observerRef.current!.observe(slide));
    return () => observerRef.current?.disconnect();
  }, [reels]);

  // ── Like ────────────────────────────────────────────────────────
  const handleLike = (reelId: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      const newCounts = { ...likeCounts };
      if (next.has(reelId)) {
        next.delete(reelId);
        newCounts[reelId] = Math.max(0, (newCounts[reelId] || 1) - 1);
      } else {
        next.add(reelId);
        newCounts[reelId] = (newCounts[reelId] || 0) + 1;
        setHeartBurst(reelId);
        setTimeout(() => setHeartBurst(null), 700);
      }
      localStorage.setItem("motivreel_liked", JSON.stringify([...next]));
      localStorage.setItem("motivreel_counts", JSON.stringify(newCounts));
      setLikeCounts(newCounts);
      return next;
    });
  };

  // ── Share ───────────────────────────────────────────────────────
  const handleShare = async (reel: Reel) => {
    if (navigator.share) {
      await navigator.share({ url: reel.url, title: reel.title || "Watch this!" });
    } else {
      await navigator.clipboard.writeText(reel.url);
    }
  };

  // ── Download ────────────────────────────────────────────────────
  const handleDownload = (reel: Reel) => {
    if (reel.videoPath) {
      // Direct download of the locally stored video
      const a = document.createElement("a");
      a.href = reel.videoPath;
      a.download = `${reel.title || "motivreel"}.mp4`;
      a.click();
    } else {
      window.open(reel.url, "_blank", "noopener,noreferrer");
    }
  };

  // ── Comments ────────────────────────────────────────────────────
  const openComments = async (reelId: number) => {
    setCommentReelId(reelId);
    setCommentOpen(true);
    setCommentsLoading(true);
    setComments([]);
    try {
      const res = await fetch(`/api/reels/${reelId}/comments`);
      setComments(await res.json());
    } catch {} finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => { setCommentOpen(false); setCommentText(""); };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentReelId) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/reels/${commentReelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, author: commentAuthor }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
      }
    } catch {} finally {
      setPostingComment(false);
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

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Only show reels that are ready
  const readyReels = reels.filter((r) => r.status === "ready" && Boolean(r.videoPath));

  return (
    <div className={styles.root}>
      <div className={styles.bgGradient} aria-hidden="true" />
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔥</span>
          <span className={styles.logoText}>MotivReel</span>
        </div>
        <p className={styles.tagline}>{quote}</p>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className={styles.loadingScreen}>
          <div className="spinner" />
          <p>Loading your motivation...</p>
        </div>
      ) : readyReels.length === 0 ? (
        <div className={styles.emptyScreen}>
          <div className={styles.emptyIcon}>
            {reels.some((r) => r.status === "downloading") ? "⏳" : "🎬"}
          </div>
          <h2>
            {reels.some((r) => r.status === "downloading")
              ? "Preparing your reels..."
              : "Coming Soon"}
          </h2>
          <p>
            {reels.some((r) => r.status === "downloading")
              ? "Videos are being downloaded. This page refreshes automatically!"
              : "Motivational reels are being curated just for you. Check back soon!"}
          </p>
          {reels.some((r) => r.status === "downloading") && (
            <div className="spinner" style={{ marginTop: 8 }} />
          )}
        </div>
      ) : (
        <>
          <div className={styles.scrollContainer} ref={containerRef}>
            {readyReels.map((reel, i) => (
              <div
                key={reel.id}
                className={styles.slide}
                data-index={i}
                id={`reel-${reel.id}`}
              >
                {/* Native video player */}
                <div className={styles.videoWrapper}>
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(reel.id, el);
                      else videoRefs.current.delete(reel.id);
                    }}
                    className={styles.videoEl}
                    src={reel.videoPath!}
                    poster={reel.thumbnail || undefined}
                    loop
                    muted={isMuted}
                    playsInline
                    controls={false}
                    preload={i === activeIndex ? "auto" : "none"}
                    onClick={(e) => {
                      const v = e.currentTarget;
                      if (v.paused) v.play();
                      else v.pause();
                    }}
                  />
                  {/* Mute Toggle Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      fontSize: '20px',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>

                {/* Side actions */}
                <div className={styles.sideActions}>
                  <button
                    className={`${styles.actionBtn} ${heartBurst === reel.id ? styles.heartBurst : ""}`}
                    onClick={() => handleLike(reel.id)}
                    aria-label={liked.has(reel.id) ? "Unlike" : "Like"}
                    id={`heart-btn-${reel.id}`}
                  >
                    <span className={`${styles.actionIcon} ${liked.has(reel.id) ? styles.iconLiked : ""}`}>
                      {liked.has(reel.id) ? "❤️" : "🤍"}
                    </span>
                    <span className={styles.actionLabel}>{likeCounts[reel.id] || 0}</span>
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => openComments(reel.id)}
                    aria-label="Comments"
                    id={`comment-btn-${reel.id}`}
                  >
                    <span className={styles.actionIcon}>💬</span>
                    <span className={styles.actionLabel}>Comment</span>
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => handleShare(reel)}
                    aria-label="Share"
                    id={`share-btn-${reel.id}`}
                  >
                    <span className={styles.actionIcon}>🔗</span>
                    <span className={styles.actionLabel}>Share</span>
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => handleDownload(reel)}
                    aria-label="Download"
                    id={`download-btn-${reel.id}`}
                  >
                    <span className={styles.actionIcon}>⬇️</span>
                    <span className={styles.actionLabel}>Save</span>
                  </button>
                </div>

                {/* Bottom info */}
                <div className={styles.infoOverlay}>
                  {reel.title && <p className={styles.reelTitle}>{reel.title}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className={styles.progressDots} role="tablist">
            {readyReels.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Reel ${i + 1}`}
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                onClick={() => {
                  containerRef.current
                    ?.querySelectorAll("[data-index]")
                    [i]?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>

          {readyReels.length > 1 && activeIndex === 0 && (
            <div className={styles.swipeHint}>
              <span className={styles.swipeArrow}>↕</span> Swipe to explore
            </div>
          )}
        </>
      )}

      {/* Comments Panel */}
      {commentOpen && (
        <div className={styles.commentOverlay} onClick={closeComments} />
      )}
      <div className={`${styles.commentPanel} ${commentOpen ? styles.commentPanelOpen : ""}`}>
        <div className={styles.commentPanelHeader}>
          <h3 className={styles.commentPanelTitle}>💬 Comments</h3>
          <button className={styles.commentCloseBtn} onClick={closeComments} id="close-comments-btn">✕</button>
        </div>
        <form onSubmit={submitComment} className={styles.commentForm} id="comment-form">
          <input type="text" className={`input ${styles.commentNameInput}`} placeholder="Your name (optional)"
            value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} maxLength={40} id="comment-author-input" />
          <div className={styles.commentInputRow}>
            <input type="text" className={`input ${styles.commentTextInput}`} placeholder="Write something inspiring... ✨"
              value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={300} required id="comment-text-input" />
            <button type="submit" className={`btn btn-primary ${styles.commentSubmitBtn}`}
              disabled={postingComment || !commentText.trim()} id="comment-submit-btn">
              {postingComment ? "…" : "→"}
            </button>
          </div>
        </form>
        <div className={styles.commentsList}>
          {commentsLoading ? (
            <div className={styles.commentsLoading}><div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /></div>
          ) : comments.length === 0 ? (
            <div className={styles.commentsEmpty}><p>No comments yet. Be the first to inspire! 🌟</p></div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>{(c.author || "A")[0].toUpperCase()}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{c.author || "Anonymous"}</span>
                    <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className={styles.commentText}>{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
