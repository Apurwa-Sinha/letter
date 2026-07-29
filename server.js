import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── 1. CONNECT TO MONGODB ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB safely!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ── 2. DATABASE SCHEMAS ──────────────────────────────────────────────────────
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

const cardSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, 
  title: String,
  salutation: String,
  writeup: String,
  date: String,
  closing: String,
  from: String,
  likes: { type: Number, default: 0 } // <-- Added Likes Field
});
const Card = mongoose.model("Card", cardSchema);

// ── 3. API ROUTES ────────────────────────────────────────────────────────────

// GET ALL CARDS
app.get("/cards", async (req, res) => {
  try {
    const cards = await Card.find({}, '-_id -__v'); 
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch letters" });
  }
});

// GET SINGLE CARD 
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
    const counter = await Counter.findByIdAndUpdate(
      "cardIdTracker",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const autoFormattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    const newCard = new Card({
      id: counter.seq,
      title: req.body.title,
      salutation: req.body.salutation,
      writeup: req.body.writeup,
      closing: req.body.closing,
      from: req.body.from,
      date: autoFormattedDate,
      likes: 0 // Initialize at 0
    });

    await newCard.save();

    res.status(201).json({
      id: newCard.id,
      title: newCard.title,
      salutation: newCard.salutation,
      writeup: newCard.writeup,
      date: newCard.date,
      closing: newCard.closing,
      from: newCard.from,
      likes: newCard.likes
    });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save letter" });
  }
});

// UPDATE LIKES (New Route for the Heart Button)
app.patch("/cards/:id/like", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const { action } = req.body; 
    
    // Add 1 if action is 'like', subtract 1 if 'unlike'
    const increment = action === "like" ? 1 : -1;

    const updatedCard = await Card.findOneAndUpdate(
      { id: targetId },
      { $inc: { likes: increment } },
      { new: true } 
    );

    if (!updatedCard) return res.status(404).json({ error: "Letter not found" });
    
    res.json({ likes: updatedCard.likes });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ error: "Failed to update likes" });
  }
});

// ── 4. START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Letterio API Server running on port ${PORT}`);
});
