// ── Audio Theme URLs ──
const audioSources = {
  rain: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3",
  fireplace: "https://cdn.pixabay.com/download/audio/2022/02/07/audio_678262ef76.mp3",
  lofi: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
};

let bgAudio = null;

// ============================================================================
// 1. INITIALIZATION & TIME CAPSULE LOGIC
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
    
    // FEATURE: TIME CAPSULE ⏳
    if (letterData.unlockDate) {
      const unlockTime = new Date(letterData.unlockDate).getTime();
      const now = new Date().getTime();

      if (unlockTime > now) {
        statusText.innerText = "This letter is sealed until the right time.";
        sealBtn.style.opacity = 0.8;
        
        // Start Countdown Timer
        setInterval(() => {
          const distance = unlockTime - new Date().getTime();
          if (distance < 0) {
            location.reload(); // Refresh when unlocked
            return;
          }
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          
          sealBtn.innerHTML = `<span style="font-size: 0.8rem; text-align:center;">Unlocks in<br>${days}d ${hours}h ${mins}m</span>`;
        }, 1000);
        return; // Stop here, don't allow opening
      }
    }

    // Normal Unlocked State
    statusText.innerText = "A letter has arrived for you.";
    sealBtn.disabled = false;
    sealBtn.classList.add("ready");
    sealBtn.addEventListener("click", breakSeal);

  } catch (error) {
    console.error("Fetch failed:", error);
    document.getElementById("envelope-status").innerText = "Only ashes remain. This letter has been burned.";
    document.getElementById("wax-seal").style.display = "none";
  }
}

// ============================================================================
// 2. BREAK SEAL, AUDIO & BURN AFTER READING
// ============================================================================
function breakSeal() {
  const overlay = document.getElementById("envelope-overlay");
  overlay.classList.add("opened");
  
  // FEATURE: AMBIENT AUDIO 🌧️
  if (letterData.audioTheme && audioSources[letterData.audioTheme]) {
    bgAudio = new Audio(audioSources[letterData.audioTheme]);
    bgAudio.loop = true;
    bgAudio.volume = 0.4;
    bgAudio.play().catch(e => console.log("Audio autoplay prevented by browser"));
  }

  // FEATURE: BURN AFTER READING 🔥
  if (letterData.burnAfterReading) {
    // We send the delete request immediately. The user can read it now, 
    // but if they refresh or share the link, it will be gone forever.
    fetch(`${url}/${cardId}`, { method: 'DELETE' }).catch(console.error);
  }

  setTimeout(() => {
    buildLetterStructure(letterData);
    overlay.style.display = 'none'; 
  }, 1000);
}

// ============================================================================
// 3. FLOATING REACTIONS (Update your existing toggleLike function)
// ============================================================================
async function toggleLike() {
  const btn = document.getElementById("btn-like");
  const countSpan = document.getElementById("like-count");
  const isCurrentlyLiked = btn.classList.contains("like-btn--active");

  // Trigger CSS Pop Animation
  btn.classList.remove("like-btn--pop");
  void btn.offsetWidth; // Reflow
  btn.classList.add("like-btn--pop");

  // FEATURE: FLOATING REACTION 💖
  const floatingEmoji = document.createElement("div");
  const reactions = ["💖", "✨", "💌", "🥺"];
  floatingEmoji.innerText = reactions[Math.floor(Math.random() * reactions.length)];
  floatingEmoji.className = "floating-reaction";
  // Randomize slight horizontal position
  floatingEmoji.style.left = `${Math.random() * 40 + 20}%`;
  btn.appendChild(floatingEmoji);
  
  // Clean up element after animation
  setTimeout(() => floatingEmoji.remove(), 2000);

  let currentCount = parseInt(countSpan.innerText) || 0;
  let action = "";

  // Optimistic UI Update
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
    










 

