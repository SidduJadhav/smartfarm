import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import JS-based algorithm functions
import { dpScheduler } from "./schedulers/dpScheduler.js";
import { greedyScheduler } from "./schedulers/greedyScheduler.js";
import { bruteForceScheduler } from "./schedulers/bruteForceScheduler.js";

// Required to use __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend build
app.use(express.static(path.join(__dirname, "../../dist")));

// API endpoint
app.post("/api/schedule", (req, res) => {
  const { technique, ...input } = req.body;

  try {
    let result;

    switch (technique) {
      case "greedy":
        result = greedyScheduler(input);
        break;
      case "dynamic":
        result = dpScheduler(input);
        break;
      case "genetic":
        result = bruteForceScheduler(input);
        break;
      default:
        return res.status(400).json({ error: "Invalid technique specified" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Scheduler failed", details: err.message || err });
  }
});

// React Router fallback
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
