# 💌 Letterio

> **Reviving the lost art of letter writing with a touch of digital magic.**

Letterio is a full-stack web application that transforms standard text into an immersive, emotional experience. Users can draft beautifully formatted public or private letters, sign them by hand, and seal them in a digital envelope. Recipients must physically click to break the wax seal, revealing the letter alongside ambient audio, weather data, and interactive elements.

## ✨ Magical Features

* **🕯️ Interactive Wax Seal:** Letters arrive in a dark envelope. The recipient must click to break the wax seal (complete with sound effects) to read the contents.
* **✍️ Hand-Drawn Signatures:** Senders can draw their actual signature on an HTML5 canvas before sending.
* **🪙 Scratch-Off P.S.:** Senders can hide a secret postscript. The recipient must use their mouse or finger to literally "scratch off" the foil to reveal the message.
* **🔥 Burn After Reading:** Letters can be set to self-destruct. Once the recipient closes the page, the letter is permanently deleted from the MongoDB database.
* **📍 Geo-Locked Envelopes:** Letters can be locked to the sender's current GPS coordinates. The recipient can only open it if they physically travel to that exact location.
* **⛈️ Weather Sync:** Automatically captures the sender's local weather and city at the exact moment of writing, saving it as a time capsule at the top of the letter.
* **💖 Floating Reactions:** Clicking the "Like" button on a letter triggers a burst of floating, animated emojis.
* **📝 Rich Text Editing:** Built-in Quill.js editor for beautifully formatted, safe (DOMPurified) HTML content.

---

## 🛠️ Tech Stack

**Frontend:**
* HTML5 / CSS3 (Custom animations & styling)
* Vanilla JavaScript
* [Vite](https://vitejs.dev/) (Build tool & dev server with API proxying)
* [Quill.js](https://quilljs.com/) (Rich text editor)
* [DOMPurify](https://github.com/cure53/DOMPurify) (XSS sanitization)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) (Database & ODM)
* [dotenv](https://github.com/motdotla/dotenv) (Environment variable management)
* [wttr.in](https://wttr.in/) (External API for Weather Sync)

---

## 🚀 Installation & Setup

To run Letterio locally, you will need Node.js and a MongoDB database (either local or MongoDB Atlas).

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/letterio.git](https://github.com/yourusername/letterio.git)
cd letterio
