import express from "express";
import { spawn } from "child_process";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Required to use __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend (React build output)
app.use(express.static(path.join(__dirname, "../../dist")));

// POST endpoint to run a C scheduling algorithm
app.post("/api/schedule", (req, res) => {
  const { technique, ...input } = req.body;
  const inputJSON = JSON.stringify(input);

  let executablePath;
  switch (technique) {
    case "greedy":
      executablePath = path.join(__dirname, "greedy_scheduler.out");
      break;
    case "dynamic":
      executablePath = path.join(__dirname, "dp_scheduler.out");
      break;
    case "genetic":
      executablePath = path.join(__dirname, "brute_force_scheduler.out");
      break;
    default:
      return res.status(400).json({ error: "Invalid technique specified" });
  }

  const scheduler = spawn(executablePath);
  let output = "";
  let error = "";

  scheduler.stdin.write(inputJSON);
  scheduler.stdin.end();

  scheduler.stdout.on("data", (data) => {
    output += data.toString();
  });

  scheduler.stderr.on("data", (data) => {
    error += data.toString();
  });

  scheduler.on("close", (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: "Invalid JSON from C program", details: output });
      }
    } else {
      res.status(500).json({ error: "C program failed", details: error });
    }
  });
});

// Fallback route: React Router support
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
