import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Increased limit for Base64 Signatures

// ── 1. CONNECT TO MONGODB ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB safely!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ── 2. DATABASE SCHEMAS ──────────────────────────────────────────────────────
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.model("Counter", counterSchema);

const cardSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, 
  title: String,
  salutation: String,
  writeup: String,
  date: String,
  closing: String,
  from: String,
  likes: { type: Number, default: 0 },
  
  // 🌟 THE 4 NEW MAGICAL FEATURES 🌟
  targetLat: { type: Number, default: null }, // Geo-Lock Latitude
  targetLng: { type: Number, default: null }, // Geo-Lock Longitude
  hiddenPS: { type: String, default: null },  // Scratch-off P.S. text
  weatherCondition: { type: String, default: null }, // e.g., 'Rain', 'Clear'
  writtenLocation: { type: String, default: null }, // e.g., 'London'
  signatureBase64: { type: String, default: null }, // Live Hand-drawn signature
  burnAfterReading: { type: Boolean, default: false } // Self Destruct
});
const Card = mongoose.model("Card", cardSchema);

// ── 3. API ROUTES ────────────────────────────────────────────────────────────
app.get("/cards", async (req, res) => {
  try { res.json(await Card.find({}, '-_id -__v')); } 
  catch (error) { res.status(500).json({ error: "Failed to fetch letters" }); }
});

app.get("/cards/:id", async (req, res) => {
  try {
    const card = await Card.findOne({ id: parseInt(req.params.id) }, '-_id -__v');
    if (!card) return res.status(404).json({ error: "Letter not found" });
    res.json(card);
  } catch (error) { res.status(500).json({ error: "Failed to fetch letter" }); }
});

app.post("/cards", async (req, res) => {
  try {
    const counter = await Counter.findByIdAndUpdate("cardIdTracker", { $inc: { seq: 1 } }, { new: true, upsert: true });
    const autoFormattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const newCard = new Card({
      id: counter.seq,
      title: req.body.title,
      salutation: req.body.salutation,
      writeup: req.body.writeup,
      closing: req.body.closing,
      from: req.body.from,
      date: autoFormattedDate,
      likes: 0,
      targetLat: req.body.targetLat,
      targetLng: req.body.targetLng,
      hiddenPS: req.body.hiddenPS,
      weatherCondition: req.body.weatherCondition,
      writtenLocation: req.body.writtenLocation,
      signatureBase64: req.body.signatureBase64,
      burnAfterReading: req.body.burnAfterReading
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) { res.status(500).json({ error: "Failed to save letter" }); }
});

app.patch("/cards/:id/like", async (req, res) => {
  try {
    const increment = req.body.action === "like" ? 1 : -1;
    const updatedCard = await Card.findOneAndUpdate({ id: parseInt(req.params.id) }, { $inc: { likes: increment } }, { new: true });
    res.json({ likes: updatedCard.likes });
  } catch (error) { res.status(500).json({ error: "Failed to update likes" }); }
});

app.delete("/cards/:id", async (req, res) => {
  try {
    await Card.findOneAndDelete({ id: parseInt(req.params.id) });
    res.json({ message: "Burned" });
  } catch (error) { res.status(500).json({ error: "Failed to burn" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Letterio API Server running on port ${PORT}`));
