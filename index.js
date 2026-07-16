import express from "express";
import cors from "cors";
import data from "./db.json" assert { type: "json" };

const app = express();

app.use(cors());           // ← this is the fix
app.use(express.json());

app.get("/cards", (req, res) => res.json(data.cards));

app.post("/cards", (req, res) => {
  const card = { id: Date.now(), ...req.body };
  data.cards.push(card);
  res.status(201).json(card);
});

app.listen(3000, () => console.log("Server running on port 3000"));

  
