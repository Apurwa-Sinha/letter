

// main.js — Letterio (FULL VERSION with all changes)
// Includes: card rendering, like buttons, share buttons, loading state

const cardsWrapper = document.querySelector(".display--section--cards--wrapper");

// ── Quill rich-text editor setup ─────────────────────────────────────────────
const quill = new Quill("#editor", { theme: "snow" });

document.querySelector("form").addEventListener("submit", () => {
  document.querySelector("#writeup").value = quill.root.innerHTML;
  document.querySelector("#date").value = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// ── Like helpers ──────────────────────────────────────────────────────────────
function getLikes(cardId) {
  return JSON.parse(localStorage.getItem("letterio-likes") || "{}")[cardId] || 0;
}
function hasLiked(cardId) {
  return JSON.parse(localStorage.getItem("letterio-liked-ids") || "[]").includes(cardId);
}
function toggleLike(cardId) {
  const likes  = JSON.parse(localStorage.getItem("letterio-likes") || "{}");
  const liked  = JSON.parse(localStorage.getItem("letterio-liked-ids") || "[]");
  const already = liked.includes(cardId);
  if (already) {
    likes[cardId] = Math.max(0, (likes[cardId] || 1) - 1);
    liked.splice(liked.indexOf(cardId), 1);
  } else {
    likes[cardId] = (likes[cardId] || 0) + 1;
    liked.push(cardId);
  }
  localStorage.setItem("letterio-likes", JSON.stringify(likes));
  localStorage.setItem("letterio-liked-ids", JSON.stringify(liked));
  return { count: likes[cardId], liked: !already };
}

// ── Share helpers ─────────────────────────────────────────────────────────────
function cardShareUrl(card) {
  return `${window.location.origin}${window.location.pathname}?id=${card.id}`;
}
function buildShareButtons(card) {
  const url  = encodeURIComponent(cardShareUrl(card));
  const text = encodeURIComponent(`"${card.title}" — read this letter on Letterio`);

  return `
    <div class="share-buttons">
      <button class="share-btn share-btn--native" data-url="${cardShareUrl(card)}" data-text="${card.title} — read this letter on Letterio">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span>Share</span>
      </button>
      <a class="share-btn share-btn--twitter" href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span>X</span>
      </a>
      <a class="share-btn share-btn--whatsapp" href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>WhatsApp</span>
      </a>
      <a class="share-btn share-btn--facebook" href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span>Facebook</span>
      </a>
      <button class="share-btn share-btn--copy" data-url="${cardShareUrl(card)}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        <span>Copy</span>
      </button>
    </div>
  `;
}

// ── Card renderer ─────────────────────────────────────────────────────────────
function renderCard(card) {
  const liked = hasLiked(card.id);
  const count = getLikes(card.id);

  const div = document.createElement("div");
  div.className = "letter-card";
  div.innerHTML = `
    <div class="letter-card--body">
      <p class="letter-card--salutation">${card.salutation}</p>
      <div class="letter-card--writeup">${card.writeup}</div>
      <p class="letter-card--closing">${card.closing}</p>
      <p class="letter-card--from">— ${card.from || "Anonymous"}</p>
      <p class="letter-card--date">${card.date || ""}</p>
    </div>
    <div class="letter-card--footer">
      <a href="letter.html?id=${card.id}" class="letter-card--title">${card.title}</a>
      <div class="card-actions">
        <button class="like-btn ${liked ? "like-btn--active" : ""}" data-id="${card.id}"
          aria-label="${liked ? "Unlike" : "Like"} this letter" aria-pressed="${liked}">
          <svg class="like-btn--heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="${liked ? "currentColor" : "none"}" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span class="like-btn--count">${count > 0 ? count : ""}</span>
        </button>
        ${buildShareButtons(card)}
      </div>
    </div>
  `;
  return div;
}

// ── Event delegation: like + share + copy ────────────────────────────────────
document.addEventListener("click", async (e) => {

  // Like
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) {
    const id = Number(likeBtn.dataset.id);
    const { count, liked } = toggleLike(id);
    const heart = likeBtn.querySelector(".like-btn--heart");
    heart.setAttribute("fill", liked ? "currentColor" : "none");
    likeBtn.querySelector(".like-btn--count").textContent = count > 0 ? count : "";
    likeBtn.classList.toggle("like-btn--active", liked);
    likeBtn.setAttribute("aria-pressed", liked);
    likeBtn.setAttribute("aria-label", `${liked ? "Unlike" : "Like"} this letter`);
    likeBtn.classList.remove("like-btn--pop");
    void likeBtn.offsetWidth;
    likeBtn.classList.add("like-btn--pop");
    return;
  }

  // Native share
  const nativeBtn = e.target.closest(".share-btn--native");
  if (nativeBtn) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Letterio", text: nativeBtn.dataset.text, url: nativeBtn.dataset.url });
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    } else {
      await copyToClipboard(nativeBtn.dataset.url, nativeBtn);
    }
    return;
  }

  // Copy link
  const copyBtn = e.target.closest(".share-btn--copy");
  if (copyBtn) {
    await copyToClipboard(copyBtn.dataset.url, copyBtn);
  }
});

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const span = btn.querySelector("span");
    const original = span.textContent;
    span.textContent = "Copied!";
    btn.classList.add("share-btn--copied");
    setTimeout(() => {
      span.textContent = original;
      btn.classList.remove("share-btn--copied");
    }, 2000);
  } catch (err) {
    console.error("Clipboard error:", err);
  }
}

// ── Loading state ─────────────────────────────────────────────────────────────
function showLoading() {
  cardsWrapper.innerHTML = `
    <div class="cards-loading">
      <div class="loading-spinner"></div>
      <p>Loading letters…</p>
    </div>
  `;
}

// ── Fetch cards from backend ──────────────────────────────────────────────────
async function loadCards() {
  showLoading();
  try {
    const res   = await fetch("http://localhost:3000/cards");
    const cards = await res.json();
    cardsWrapper.innerHTML = "";
    if (!cards.length) {
      cardsWrapper.innerHTML = `<p class="empty-msg">No letters yet. Be the first to write one! ✍️</p>`;
      return;
    }
    cards.forEach((card) => cardsWrapper.appendChild(renderCard(card)));
  } catch (err) {
    cardsWrapper.innerHTML = `<p class="error-msg">Could not load letters. Is the server running?</p>`;
    console.error(err);
  }
}

loadCards();

      
