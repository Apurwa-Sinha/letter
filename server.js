import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── 1. CONNECT TO CLOUD DATABASE ─────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB safely!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ── 2. DATABASE SCHEMAS ──────────────────────────────────────────────────────

// A small tracker to mimic your 'nextId' from db.json
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

// The blueprint for a Letter
const cardSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Keeps your URL structure: ?id=1, ?id=2
  title: String,
  salutation: String,
  writeup: String,
  date: String,
  closing: String,
  from: String
});
const Card = mongoose.model("Card", cardSchema);

// ── 3. API ROUTES ────────────────────────────────────────────────────────────

// GET ALL CARDS
app.get("/cards", async (req, res) => {
  try {
    // '-_id -__v' hides MongoDB's internal tracking data from the frontend
    const cards = await Card.find({}, '-_id -__v'); 
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch letters" });
  }
});

// GET SINGLE CARD (By sequential ID)
app.get("/cards/:id", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const card = await Card.findOne({ id: targetId }, '-_id -__v');

    if (!card) return res.status(404).json({ error: "Letter not found" });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch letter" });
  }
});

// CREATE NEW CARD
app.post("/cards", async (req, res) => {
  try {
    // 1. Auto-increment the ID tracker safely
    const counter = await Counter.findByIdAndUpdate(
      "cardIdTracker",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // 2. Auto-format the date
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const autoFormattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    // 3. Build and save the new card
    const newCard = new Card({
      id: counter.seq,
      title: req.body.title,
      salutation: req.body.salutation,
      writeup: req.body.writeup,
      closing: req.body.closing,
      from: req.body.from,
      date: autoFormattedDate
    });

    await newCard.save();

    // 4. Send the new card back to the frontend
    res.status(201).json({
      id: newCard.id,
      title: newCard.title,
      salutation: newCard.salutation,
      writeup: newCard.writeup,
      date: newCard.date,
      closing: newCard.closing,
      from: newCard.from
    });

  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save letter" });
  }
});

// ── 4. START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Letterio API Server running on port ${PORT}`);
});


    
