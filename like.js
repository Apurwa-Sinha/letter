/* ─────────────────────────────────────────────────────────────────────────────
   LIKE / HEART BUTTON — paste this into style.css (or share.css)
   ───────────────────────────────────────────────────────────────────────────── */

/* Wrapper that sits alongside share buttons */
.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Remove the border-top from share-buttons since card-actions now owns it */
.card-actions .share-buttons {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

/* ── Like button base ── */
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  cursor: pointer;
  border: 1.5px solid #e0e0e0;
  background: #f5f5f5;
  color: #888;
  transition: background 0.18s ease, color 0.18s ease,
    border-color 0.18s ease, transform 0.12s ease;
  white-space: nowrap;
  line-height: 1;
}

.like-btn svg.like-btn--heart {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: fill 0.18s ease, stroke 0.18s ease, transform 0.18s ease;
}

/* ── Hover (not yet liked) ── */
.like-btn:hover {
  border-color: #ff6b8a;
  color: #ff6b8a;
  background: #fff0f3;
  transform: translateY(-1px);
}

.like-btn:hover svg.like-btn--heart {
  stroke: #ff6b8a;
}

/* ── Active / liked state ── */
.like-btn--active {
  background: #fff0f3;
  border-color: #ff4d6d;
  color: #ff4d6d;
}

.like-btn--active svg.like-btn--heart {
  fill: #ff4d6d;
  stroke: #ff4d6d;
}

.like-btn--active:hover {
  background: #ffe0e6;
  border-color: #e0314f;
  color: #e0314f;
}

/* ── Pop animation on click ── */
@keyframes heart-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.like-btn--pop svg.like-btn--heart {
  animation: heart-pop 0.35s ease forwards;
}

/* ── Count badge ── */
.like-btn--count {
  min-width: 0.8rem;
  text-align: center;
}
