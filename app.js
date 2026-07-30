const url = `http://localhost:3000/cards`; // Change to production URL when deployed
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get("id"); 

let letterData = null;
let bgAudio = null;

// ============================================================================
// 1. INITIALIZATION & GEO-LOCKING 🗺️
// ============================================================================
async function initializeApp() {
  if (!cardId) return document.getElementById("envelope-status").innerText = "No letter ID found.";

  try {
    const res = await fetch(`${url}/${cardId}`);
    if (!res.ok) throw new Error(`Letter not found`);
    letterData = await res.json();
    
    const statusText = document.getElementById("envelope-status");
    const sealBtn = document.getElementById("wax-seal");
    
    // FEATURE: GEO-LOCKED TREASURE HUNT 🗺️
    if (letterData.targetLat && letterData.targetLng) {
      statusText.innerText = "This letter is locked to a specific physical location.";
      sealBtn.innerHTML = `<span class="wax-seal-text">Unlock</span>`;
      sealBtn.disabled = false;
      sealBtn.classList.add("ready");
      sealBtn.addEventListener("click", verifyLocation);
      return;
    }

    // Normal State
    statusText.innerText = "A letter has arrived for you.";
    sealBtn.disabled = false;
    sealBtn.classList.add("ready");
    sealBtn.addEventListener("click", breakSeal);

  } catch (error) {
    document.getElementById("envelope-status").innerText = "Only ashes remain. This letter has been burned.";
    document.getElementById("wax-seal").style.display = "none";
  }
}

// ── GPS Distance Calculator ──
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180, p2 = lat2 * Math.PI/180;
  const deltaP = (lat2-lat1) * Math.PI/180, deltaL = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(deltaL/2) * Math.sin(deltaL/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

function verifyLocation() {
  const statusText = document.getElementById("envelope-status");
  statusText.innerText = "Checking GPS coordinates...";
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const dist = getDistanceFromLatLonInM(pos.coords.latitude, pos.coords.longitude, letterData.targetLat, letterData.targetLng);
      if (dist <= 100) {
        breakSeal(); // Less than 100 meters away? Unlock it!
      } else {
        statusText.innerText = `You are ${Math.round(dist)} meters away. You must go to the exact spot to open this.`;
      }
    }, 
    (err) => { statusText.innerText = "Location access is required to read this geo-locked letter."; }
  );
}

// ============================================================================
// 2. BREAK SEAL, WEATHER SYNC ⛈️ & BURN 🔥
// ============================================================================
function breakSeal() {
  const overlay = document.getElementById("envelope-overlay");
  overlay.classList.add("opened");
  
  // FEATURE: WEATHER-SYNCED NOSTALGIA ⛈️
  if (letterData.weatherCondition) {
    let audioSrc = "";
    if (letterData.weatherCondition.includes("Rain") || letterData.weatherCondition.includes("Thunderstorm")) {
      audioSrc = "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3";
    } else if (letterData.weatherCondition.includes("Snow")) {
      audioSrc = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"; // Lofi
    }
    
    if (audioSrc) {
      bgAudio = new Audio(audioSrc);
      bgAudio.loop = true; bgAudio.volume = 0.3;
      bgAudio.play().catch(e => console.log("Autoplay prevented"));
    }
  }

  // FEATURE: BURN AFTER READING 🔥
  if (letterData.burnAfterReading) {
    fetch(`${url}/${cardId}`, { method: 'DELETE' }).catch(console.error);
  }

  setTimeout(() => {
    buildLetterStructure(letterData);
    overlay.style.display = 'none'; 
  }, 1000);
}

function buildLetterStructure(data) {
  const container = document.querySelector(".letter--section--container");
  
  let weatherTag = "";
  if (data.weatherCondition && data.writtenLocation) {
    weatherTag = `<div class="weather-tag">Written in ${data.writtenLocation} during ${data.weatherCondition}</div>`;
  }

  let signatureImg = data.signatureBase64 ? `<img src="${data.signatureBase64}" class="signature-img" alt="Sender Signature" />` : "";

  container.innerHTML = `
    ${weatherTag}
    <div class="letter--head animate-fade-up delay-1">
      <h1 class="text-xxl-light">${data.title}</h1>
      <p class="letter--date">${data.date ? data.date : 'Unknown date'}</p>
    </div>
    <p class="cards--para letter--salutation animate-fade-up delay-2">${data.salutation},</p>
    <div id="typewriter-box" class="cards--para letter--container typewriter-cursor"></div>
    
    <div id="letter-footer" style="opacity: 0; transition: opacity 1s;">
      <p class="letter--closing">${data.closing},</p>
      ${signatureImg}
      <p class="letter--from">— ${data.from}</p>
      <div id="action-container" class="card-actions letter-actions-group" data-html2canvas-ignore></div>
    </div>
  `;
  startTypewriter(DOMPurify.sanitize(data.writeup));
}

// ============================================================================
// 3. HTML TYPEWRITER & SCRATCH-OFF P.S. 🪙
// ============================================================================
async function startTypewriter(htmlString) {
  const box = document.getElementById("typewriter-box");
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  await new Promise(r => setTimeout(r, 1000));

  async function typeNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (let char of node.textContent) {
        parent.innerHTML += char;
        await new Promise(r => setTimeout(r, 10)); 
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const newEl = document.createElement(node.tagName);
      for (let attr of node.attributes) newEl.setAttribute(attr.name, attr.value);
      parent.appendChild(newEl);
      for (let child of node.childNodes) await typeNode(child, newEl);
    }
  }
  for (let child of tempDiv.childNodes) await typeNode(child, box);
  
  box.classList.remove("typewriter-cursor");
  document.getElementById("letter-footer").style.opacity = 1;
  
  // FEATURE: THE SCRATCH-OFF P.S. 🪙
  if (letterData.hiddenPS) buildScratchOff(letterData.hiddenPS);
}

function buildScratchOff(text) {
  const footer = document.getElementById("letter-footer");
  const wrapper = document.createElement("div");
  wrapper.className = "scratch-container";
  
  wrapper.innerHTML = `
    <p class="scratch-text"><strong>P.S.</strong> ${DOMPurify.sanitize(text)}</p>
    <canvas class="scratch-canvas"></canvas>
  `;
  
  footer.insertBefore(wrapper, document.getElementById("action-container"));

  const canvas = wrapper.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  // Allow DOM to render dimensions
  setTimeout(() => {
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;
    
    // Draw Gold Foil
    ctx.fillStyle = "#cca700"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Text
    ctx.font = "bold 16px Inter";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ Scratch to Reveal Secret ✨", canvas.width / 2, canvas.height / 2);
  }, 100);

  let isDragging = false;
  const scratch = (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  canvas.addEventListener("mousedown", () => isDragging = true);
  canvas.addEventListener("mouseup", () => isDragging = false);
  canvas.addEventListener("mousemove", scratch);
  canvas.addEventListener("touchstart", () => isDragging = true);
  canvas.addEventListener("touchend", () => isDragging = false);
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); scratch(e); });
}

if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initializeApp); } 
else { initializeApp(); }
  
         













 

