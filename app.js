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
    
    // Data is loaded, prepare the Envelope for opening
    const statusText = document.getElementById("envelope-status");
    const sealBtn = document.getElementById("wax-seal");
    
    statusText.innerText = "A letter has arrived for you.";
    sealBtn.disabled = false;
    sealBtn.classList.add("ready");
    
    // Wait for user to break the seal
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
  
  // Wait for the fade-out animation to finish, then build the letter
  setTimeout(() => {
    buildLetterStructure(letterData);
    overlay.style.display = 'none'; // Remove completely from flow
  }, 1000);
}

// ============================================================================
// 3. BUILD HTML (WITH XSS PROTECTION)
// ============================================================================
function buildLetterStructure(data) {
  const container = document.querySelector(".letter--section--container");

  // Build the basic structure (excluding the body text)
  const html = `
    <div class="letter--head animate-fade-up delay-1">
      <h1 class="text-xxl-light">${data.title}</h1>
      <p class="letter--date">${data.date ? data.date : 'Unknown date'}</p>
    </div>
    <p class="cards--para letter--salutation animate-fade-up delay-2">${data.salutation},</p>
    
    <!-- Empty container for the typewriter -->
    <div id="typewriter-box" class="cards--para letter--container typewriter-cursor"></div>
    
    <!-- Hidden closing until typing finishes -->
    <div id="letter-footer" style="opacity: 0; transition: opacity 1s;">
      <p class="letter--closing">${data.closing},</p>
      <p class="letter--from">${data.from}</p>
      
      <!-- Feature Buttons -->
      <div class="letter-actions-group" data-html2canvas-ignore>
        <button id="btn-read" class="feature-btn">🔊 Read to Me</button>
        <button id="btn-share" class="feature-btn">📤 Share</button>
        <button id="btn-save" class="feature-btn">📸 Save Image</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  
  // 🛡️ SECURITY FIX: Sanitize the raw HTML before rendering to prevent XSS attacks
  let safeHTML = "";
  if (typeof DOMPurify !== "undefined") {
    safeHTML = DOMPurify.sanitize(data.writeup);
  } else {
    console.error("DOMPurify not loaded! Falling back to un-sanitized string (Not Recommended).");
    safeHTML = data.writeup;
  }
  
  // Pass the cleaned string to the HTML-aware typewriter
  startTypewriter(safeHTML);
}

// ============================================================================
// 4. HTML-AWARE TYPEWRITER LOGIC
// ============================================================================
async function startTypewriter(htmlString) {
  const box = document.getElementById("typewriter-box");
  
  // Convert the sanitized HTML string into actual hidden DOM elements
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  
  // Wait a moment before typing starts for dramatic effect
  await new Promise(r => setTimeout(r, 1000));

  // Recursive function to type text but instantly inject HTML elements
  async function typeNode(node, parentElement) {
    if (node.nodeType === Node.TEXT_NODE) {
      // If it's text, type it out character by character
      const text = node.textContent;
      for (let char of text) {
        parentElement.innerHTML += char;
        await new Promise(r => setTimeout(r, 15)); // Adjust typing speed here (ms)
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // If it's an HTML tag (like <p> or <br>), inject it instantly
      const newElement = document.createElement(node.tagName);
      
      // Keep any classes, styles, or safe attributes it might have
      for (let attr of node.attributes) {
        newElement.setAttribute(attr.name, attr.value);
      }
      
      parentElement.appendChild(newElement);
      
      // Recursively process the contents inside this tag
      for (let child of node.childNodes) {
        await typeNode(child, newElement);
      }
    }
  }

  // Start processing the hidden DOM elements
  for (let child of tempDiv.childNodes) {
    await typeNode(child, box);
  }

  // Typing finished: Remove cursor, show footer, attach feature listeners
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

  // Strip HTML tags for the speech reader by using a temporary div
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
    } catch (error) {
      console.log('Error sharing:', error);
    }
  } else {
    // Fallback for desktop browsers
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
}

// ── Feature: Save as Image ──
async function downloadLetter() {
  const letterElement = document.querySelector(".letter--section--container");
  try {
    if (typeof html2canvas === "undefined") throw new Error("html2canvas not loaded");
    
    // Temporarily disable text-shadow for a cleaner export if needed, or keep it
    const canvas = await html2canvas(letterElement, {
      scale: 2, // Retina quality
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

