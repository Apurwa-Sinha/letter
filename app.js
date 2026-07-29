// ============================================================================
// CONFIGURATION & GLOBAL STATE
// ============================================================================
const url = `https://seahorse-app-xz5gx.ondigitalocean.app/cards`;
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get("id"); 

let letterData = null;
let isSpeaking = false;

// ============================================================================
// 1. INITIALIZATION & FETCHING
// ============================================================================
async function initializeApp() {
  if (!cardId) {
    document.getElementById("envelope-status").innerText = "No letter ID found.";
    return;
  }

  try {
    const res = await fetch(`${url}/${cardId}`);
    if (!res.ok) throw new Error(`Letter not found`);
    
    letterData = await res.json();
    
    const statusText = document.getElementById("envelope-status");
    const sealBtn = document.getElementById("wax-seal");
    
    statusText.innerText = "A letter has arrived for you.";
    sealBtn.disabled = false;
    sealBtn.classList.add("ready");
    
    sealBtn.addEventListener("click", breakSeal);
  } catch (error) {
    console.error("Fetch failed:", error);
    document.getElementById("envelope-status").innerText = "Letter could not be found.";
  }
}

// ============================================================================
// 2. BREAK SEAL & REVEAL LETTER
// ============================================================================
function breakSeal() {
  const overlay = document.getElementById("envelope-overlay");
  overlay.classList.add("opened");
  
  setTimeout(() => {
    buildLetterStructure(letterData);
    overlay.style.display = 'none'; 
  }, 1000);
}

// ============================================================================
// 3. BUILD HTML (WITH XSS PROTECTION & LIKE BUTTON)
// ============================================================================
function buildLetterStructure(data) {
  const container = document.querySelector(".letter--section--container");

  const html = `
    <div class="letter--head animate-fade-up delay-1">
      <h1 class="text-xxl-light">${data.title}</h1>
      <p class="letter--date">${data.date ? data.date : 'Unknown date'}</p>
    </div>
    <p class="cards--para letter--salutation animate-fade-up delay-2">${data.salutation},</p>
    
    <div id="typewriter-box" class="cards--para letter--container typewriter-cursor"></div>
    
    <div id="letter-footer" style="opacity: 0; transition: opacity 1s;">
      <p class="letter--closing">${data.closing},</p>
      <p class="letter--from">${data.from}</p>
      
      <!-- Feature Buttons -->
      <div class="card-actions letter-actions-group" data-html2canvas-ignore>
        
        <!-- LIKE BUTTON -->
        <button id="btn-like" class="like-btn">
          <svg class="like-btn--heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="like-btn--count" id="like-count">${data.likes || 0}</span>
        </button>

        <button id="btn-read" class="feature-btn">🔊 Read to Me</button>
        <button id="btn-share" class="feature-btn">📤 Share</button>
        <button id="btn-save" class="feature-btn">📸 Save Image</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  
  let safeHTML = "";
  if (typeof DOMPurify !== "undefined") {
    safeHTML = DOMPurify.sanitize(data.writeup);
  } else {
    console.error("DOMPurify not loaded! Falling back to un-sanitized string.");
    safeHTML = data.writeup;
  }
  
  startTypewriter(safeHTML);
}

// ============================================================================
// 4. HTML-AWARE TYPEWRITER LOGIC
// ============================================================================
async function startTypewriter(htmlString) {
  const box = document.getElementById("typewriter-box");
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  
  await new Promise(r => setTimeout(r, 1000));

  async function typeNode(node, parentElement) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      for (let char of text) {
        parentElement.innerHTML += char;
        await new Promise(r => setTimeout(r, 15)); 
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const newElement = document.createElement(node.tagName);
      for (let attr of node.attributes) {
        newElement.setAttribute(attr.name, attr.value);
      }
      parentElement.appendChild(newElement);
      for (let child of node.childNodes) {
        await typeNode(child, newElement);
      }
    }
  }

  for (let child of tempDiv.childNodes) {
    await typeNode(child, box);
  }

  box.classList.remove("typewriter-cursor");
  document.getElementById("letter-footer").style.opacity = 1;
  attachFeatureListeners();
}

// ============================================================================
// 5. FEATURE ACTION LISTENERS
// ============================================================================
function attachFeatureListeners() {
  document.getElementById("btn-read").addEventListener("click", toggleSpeech);
  document.getElementById("btn-share").addEventListener("click", shareLetter);
  document.getElementById("btn-save").addEventListener("click", downloadLetter);
  
  // Like Button Initialization
  const likeBtn = document.getElementById("btn-like");
  likeBtn.addEventListener("click", toggleLike);

  // Restore liked state from local storage
  if (localStorage.getItem(`letterio-liked-${cardId}`) === "true") {
    likeBtn.classList.add("like-btn--active");
  }
}

// ── Feature: Like Button ──
async function toggleLike() {
  const btn = document.getElementById("btn-like");
  const countSpan = document.getElementById("like-count");
  const isCurrentlyLiked = btn.classList.contains("like-btn--active");

  // Trigger CSS Pop Animation
  btn.classList.add("like-btn--pop");
  setTimeout(() => btn.classList.remove("like-btn--pop"), 350); 

  let currentCount = parseInt(countSpan.innerText) || 0;
  let action = "";

  // Optimistic UI Update (Changes instantly before server confirms)
  if (isCurrentlyLiked) {
    btn.classList.remove("like-btn--active");
    countSpan.innerText = Math.max(0, currentCount - 1);
    localStorage.removeItem(`letterio-liked-${cardId}`);
    action = "unlike";
  } else {
    btn.classList.add("like-btn--active");
    countSpan.innerText = currentCount + 1;
    localStorage.setItem(`letterio-liked-${cardId}`, "true");
    action = "like";
  }

  // Background Sync to MongoDB
  try {
    await fetch(`${url}/${cardId}/like`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
    });
  } catch (error) {
    console.error("Failed to sync like with server:", error);
  }
}

// ── Feature: Text-To-Speech ──
function toggleSpeech() {
  const btn = document.getElementById("btn-read");
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    btn.innerText = "🔊 Read to Me";
    return;
  }
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = DOMPurify.sanitize(letterData.writeup);
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";
  const textToRead = `${letterData.title}. ${letterData.salutation}. ${cleanText} ${letterData.closing}, ${letterData.from}`;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.rate = 0.9; 
  utterance.pitch = 1;
  utterance.onend = () => {
    isSpeaking = false;
    btn.innerText = "🔊 Read to Me";
  };
  window.speechSynthesis.speak(utterance);
  isSpeaking = true;
  btn.innerText = "⏸️ Stop Reading";
}

// ── Feature: Native Share ──
async function shareLetter() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: letterData.title,
        text: 'I wanted to share this letter with you.',
        url: window.location.href,
      });
    } catch (error) {}
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
}

// ── Feature: Save as Image ──
async function downloadLetter() {
  const letterElement = document.querySelector(".letter--section--container");
  try {
    if (typeof html2canvas === "undefined") throw new Error("html2canvas not loaded");
    const canvas = await html2canvas(letterElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: document.documentElement.classList.contains("dark") ? "#1a1a22" : "#f4fce3"
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `Letterio-${letterData.title.replace(/\s+/g, '-')}.png`;
    link.click();
  } catch (error) {
    console.error("Save Image failed:", error);
    alert("Failed to save image. Please try again.");
  }
}

// ============================================================================
// 6. START APP ON LOAD
// ============================================================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
