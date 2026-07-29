// ── SCHEMA UPDATE (Add these fields to your existing cardSchema) ──
const cardSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, 
  title: String,
  salutation: String,
  writeup: String,
  date: String,
  closing: String,
  from: String,
  likes: { type: Number, default: 0 },
  // NEW FEATURES:
  audioTheme: { type: String, default: "none" }, // 'rain', 'fireplace', 'lofi'
  unlockDate: { type: String, default: null },   // ISO Date string for Time Capsule
  burnAfterReading: { type: Boolean, default: false } // Self-destruct flag
});

// ... [Keep your existing GET, POST, and PATCH routes] ...

// ── NEW ROUTE: BURN AFTER READING (DELETE) ──
app.delete("/cards/:id", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const deletedCard = await Card.findOneAndDelete({ id: targetId });
    
    if (!deletedCard) return res.status(404).json({ error: "Letter already burned or not found" });
    
    res.json({ message: "Letter permanently deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to burn letter" });
  }
});
