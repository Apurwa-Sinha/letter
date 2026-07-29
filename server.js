import express from "express";
import cors from "cors";
import fs from "fs/promises"; 
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "db.json");

const app = express();

// Enable CORS so your frontend can communicate with this backend securely
app.use(cors());           
app.use(express.json());

async function readDB() {
  const data = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// ── 1. GET ALL CARDS ──
app.get("/cards", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.cards);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

// ── 2. GET SINGLE CARD ──
app.get("/cards/:id", async (req, res) => {
  try {
    const db = await readDB();
    const targetId = parseInt(req.params.id); 
    const card = db.cards.find(c => c.id === targetId);

    if (!card) return res.status(404).json({ error: "Letter not found" });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch letter" });
  }
});

// ── 3. CREATE NEW CARD ──
app.post("/cards", async (req, res) => {
  try {
    const db = await readDB();
    const newId = db.nextId.id;

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const autoFormattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    const newCard = {
      id: newId,
      ...req.body,
      date: autoFormattedDate 
    };

    db.cards.push(newCard);
    db.nextId.id = newId + 1; 

    await writeDB(db);
    res.status(201).json(newCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save letter" });
  }
});

// ── DEPLOYMENT FIX: Dynamic Port ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Letterio API Server running on port ${PORT}`);
});
