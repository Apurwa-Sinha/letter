
// ============================================================================
// main.js — Letterio (FULL VERSION: Feed, Editor, and Magical Features)
// ============================================================================

const API_URL = "http://localhost:3000/cards"; // Change this when you deploy!
const cardsWrapper = document.querySelector(".display--section--cards--wrapper");

// ── 1. QUILL RICH-TEXT EDITOR SETUP ──────────────────────────────────────────
let quill;
if (document.querySelector("#editor")) {
  quill = new Quill("#editor", { theme: "snow" });
}

// ── 2. SIGNATURE PAD LOGIC ───────────────────────────────────────────────────
const canvas = document.getElementById("signature-pad");
const ctx = canvas ? canvas.getContext("2d") : null;
let isDrawing = false;
let signatureBase64 = null;

if (canvas) {
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1864ab"; // Elegant blue ink color

  const startDrawing = (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(getX(e), getY(e));
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on mobile while drawing
    ctx.lineTo(getX(e), getY(e));
    ctx.stroke();
    signatureBase64 = canvas.toDataURL("image/png"); // Save as base64 image
  };
  
  const stopDrawing = () => { isDrawing = false; };

  const getX = (e) => e.touches ? e.touches[0].clientX - canvas.getBoundingClientRect().left : e.clientX - canvas.getBoundingClientRect().left;
  const getY = (e) => e.touches ? e.touches[0].clientY - canvas.getBoundingClientRect().top : e.clientY - canvas.getBoundingClientRect().top;

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDrawing);

  document.getElementById("clear-signature")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureBase64 = null;
  });
}

// ── 3. FORM SUBMISSION WITH MAGIC DATA ───────────────────────────────────────
const form = document.querySelector("form");

if (form && document.querySelector("#editor")) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default reload

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Sealing letter with magic...";
    submitBtn.disabled = true;

    // Sanitize Quill HTML
    const rawHTML = quill.root.innerHTML;
    const safeHTML = typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(rawHTML) : rawHTML;

    // Prepare Base Payload
    let letterPayload = {
      title: document.getElementById("title").value,
      salutation: document.getElementById("salutation").value,
      writeup: safeHTML,
      closing: document.getElementById("closing").value,
      from: document.getElementById("from").value,
      hiddenPS: document.getElementById("hiddenPS")?.value || null,
      burnAfterReading: document.getElementById("burnAfterReading")?.checked || false,
      signatureBase64: signatureBase64
    };

    // ✨ MAGIC: GEO-LOCK LOGIC
    if (document.getElementById("geoLock")?.checked) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        letterPayload.targetLat = pos.coords.latitude;
        letterPayload.targetLng = pos.coords.longitude;
      } catch (err) {
        alert("We couldn't get your location. Geo-lock will be disabled.");
      }
    }

    // ✨ MAGIC: WEATHER SYNC LOGIC
    if (document.getElementById("syncWeather")?.checked) {
      try {
        const weatherRes = await fetch("https://wttr.in/?format=j1");
        const weatherData = await weatherRes.json();
        letterPayload.weatherCondition = weatherData.current_condition[0].weatherDesc[0].value;
        letterPayload.writtenLocation = weatherData.nearest_area[0].areaName[0].value;
      } catch (err) {
        console.log("Weather sync failed, skipping.");
      }
    }

    // SEND TO MONGODB
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letterPayload)
      });

      if (!response.ok) throw new Error("Failed to save to database");

      const savedCard = await response.json();
      
      // Redirect to the newly created magical letter
      window.location.href = `letter.html?id=${savedCard.id}`;
    } catch (error) {
      console.error(error);
      alert("Failed to send letter. Is the server running?");
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// ── 4. LIKE HELPERS (MONGODB SYNC) ───────────────────────────────────────────
function getLikes(cardId) {
  return JSON.parse(localStorage.getItem("letterio-likes") || "{}")[cardId] || 0;
}

function hasLiked(cardId) {
  return JSON.parse(localStorage.getItem("letterio-liked-ids") || "[]").includes(cardId);
}

async function toggleLike(cardId, currentServerCount) {
  const likes  = JSON.parse(localStorage.getItem("letterio-likes") || "{}");
  const liked  = JSON.parse(localStorage.getItem("letterio-liked-ids") || "[]");
  const already = liked.includes(cardId);
  
  let action = "";

  if (already) {
    likes[cardId] = Math.max(0, (likes[cardId] || 1) - 1);
    liked.splice(liked.indexOf(cardId), 1);
    action = "unlike";
  } else {
    const baseCount = Math.max(likes[cardId] || 0, currentServerCount || 0);
    likes[cardId] = baseCount + 1;
    liked.push(cardId);
    action = "like";
  }

  localStorage.setItem("letterio-likes", JSON.stringify(likes));
  localStorage.setItem("letterio-liked-ids", JSON.stringify(liked));

  try {
    await fetch(`${API_URL}/${cardId}/like`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
    });
  } catch (error) {
    console.error("Failed to sync like with server:", error);
  }

  return { count: likes[cardId], liked: !already };
}

// ── 5. SHARE HELPERS ─────────────────────────────────────────────────────────
function cardShareUrl(card) {
  return `${window.location.origin}/letter.html?id=${card.id}`;
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

// ── 6. FEED RENDERER ─────────────────────────────────────────────────────────
function renderCard(card) {
  const liked = hasLiked(card.id);
  const count = card.likes !== undefined ? card.likes : getLikes(card.id); 

  const safeWriteup = typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(card.writeup) : card.writeup;

  const div = document.createElement("div");
  div.className = "letter-card";
  div.innerHTML = `
    <div class="letter-card--body">
      <p class="letter-card--salutation">${card.salutation}</p>
      <div class="letter-card--writeup">${safeWriteup}</div>
      <p class="letter-card--closing">${card.closing}</p>
      <p class="letter-card--from">— ${card.from || "Anonymous"}</p>
      <p class="letter-card--date">${card.date || ""}</p>
    </div>
    <div class="letter-card--footer">
      <a href="letter.html?id=${card.id}" class="letter-card--title">${card.title}</a>
      <div class="card-actions">
        <button class="like-btn ${liked ? "like-btn--active" : ""}" data-id="${card.id}" data-server-count="${count}"
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

// ── 7. EVENT DELEGATION (LIKE + SHARE + COPY) ───────────────────────────────
document.addEventListener("click", async (e) => {
  // Like Button Click
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn && !likeBtn.id.includes("btn-like")) { // Ignore single letter page like btn (handled in app.js)
    const id = Number(likeBtn.dataset.id);
    const serverCount = Number(likeBtn.dataset.serverCount) || 0;
    
    const { count, liked } = await toggleLike(id, serverCount);
    
    const heart = likeBtn.querySelector(".like-btn--heart");
    heart.setAttribute("fill", liked ? "currentColor" : "none");
    likeBtn.querySelector(".like-btn--count").textContent = count > 0 ? count : "";
    likeBtn.dataset.serverCount = count;
    
    likeBtn.classList.toggle("like-btn--active", liked);
    likeBtn.setAttribute("aria-pressed", liked);
    likeBtn.setAttribute("aria-label", `${liked ? "Unlike" : "Like"} this letter`);
    
    likeBtn.classList.remove("like-btn--pop");
    void likeBtn.offsetWidth; // Trigger reflow
    likeBtn.classList.add("like-btn--pop");

    // Add floating reaction to feed!
    const floatingEmoji = document.createElement("div");
    const reactions = ["💖", "✨", "💌", "🥺"];
    floatingEmoji.innerText = reactions[Math.floor(Math.random() * reactions.length)];
    floatingEmoji.className = "floating-reaction";
    floatingEmoji.style.left = `${Math.random() * 40 + 20}%`;
    likeBtn.appendChild(floatingEmoji);
    setTimeout(() => floatingEmoji.remove(), 2000);
    return;
  }

  // Native Share Click
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

  // Copy Link Click
  const copyBtn = e.target.closest(".share-btn--copy");
  if (copyBtn) await copyToClipboard(copyBtn.dataset.url, copyBtn);
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
  } catch (err) { console.error("Clipboard error:", err); }
}

// ── 8. LOAD FEED ON INIT ─────────────────────────────────────────────────────
function showLoading() {
  if (!cardsWrapper) return;
  cardsWrapper.innerHTML = `
    <div class="cards-loading">
      <div class="loading-spinner"></div>
      <p>Loading letters…</p>
    </div>
  `;
}

async function loadCards() {
  if (!cardsWrapper) return;
  showLoading();
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Server responded with an error");
    
    const cards = await res.json();
    cardsWrapper.innerHTML = "";
    
    if (!cards.length) {
      cardsWrapper.innerHTML = `<p class="empty-msg">No letters yet. Be the first to write one! ✍️</p>`;
      return;
    }
    
    cards.sort((a, b) => b.id - a.id); // Newest first
    cards.forEach((card) => cardsWrapper.appendChild(renderCard(card)));
  } catch (err) {
    cardsWrapper.innerHTML = `<p class="error-msg">Could not load letters. Is the server running?</p>`;
    console.error(err);
  }
}

// Execute feed load
loadCards();











  





