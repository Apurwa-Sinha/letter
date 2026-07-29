// ── 3. Build HTML (Updated to handle raw HTML) ───────────────────────────────
function buildLetterStructure(data) {
  const container = document.querySelector(".letter--section--container");

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
  
  // Pass the raw HTML string directly to the typewriter
  startTypewriter(data.writeup);
}

// ── 4. Typewriter Logic (Updated to parse HTML tags) ─────────────────────────
async function startTypewriter(htmlString) {
  const box = document.getElementById("typewriter-box");
  
  // 1. Convert the raw HTML string into actual hidden DOM elements
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  
  // Wait a moment before typing starts for dramatic effect
  await new Promise(r => setTimeout(r, 1000));

  // 2. Recursive function to type text but instantly inject HTML elements
  async function typeNode(node, parentElement) {
    if (node.nodeType === Node.TEXT_NODE) {
      // If it's text, type it out character by character
      const text = node.textContent;
      for (let char of text) {
        parentElement.innerHTML += char;
        // Typing speed (15ms per character)
        await new Promise(r => setTimeout(r, 15)); 
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // If it's an HTML tag (like <p> or <blockquote>), inject it instantly
      const newElement = document.createElement(node.tagName);
      
      // Keep any classes or styles it might have
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

  // 3. Start processing the hidden DOM elements
  for (let child of tempDiv.childNodes) {
    await typeNode(child, box);
  }

  // 4. Typing finished: Remove cursor, show footer, attach listeners
  box.classList.remove("typewriter-cursor");
  document.getElementById("letter-footer").style.opacity = 1;
  attachFeatureListeners(); // Ensure this function still exists in your app.js
}





   
