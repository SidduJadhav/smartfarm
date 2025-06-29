import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

// Import algorithm implementations
import { dpScheduler } from "./schedulers/dpScheduler.js"
import { greedyScheduler } from "./schedulers/greedyScheduler.js"
import { bruteForceScheduler } from "./schedulers/bruteForceScheduler.js"

// Required for ES module support (__dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize app
const app = express()
const PORT = process.env.PORT || 5000

// Enhanced logging for debugging
console.log("🚀 Starting server...")
console.log("📁 Current directory:", __dirname)
console.log("🌐 Port:", PORT)
console.log("🔧 Environment:", process.env.NODE_ENV || "development")

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// API route with enhanced error handling
app.post("/api/schedule", (req, res) => {
  console.log("📨 Received scheduling request:", req.body)

  const { technique, ...input } = req.body

  // Validate input
  if (!technique) {
    console.error("❌ No technique specified")
    return res.status(400).json({ error: "No technique specified" })
  }

  if (!input.totalWater || !input.fields) {
    console.error("❌ Invalid input data")
    return res.status(400).json({ error: "Invalid input data" })
  }

  try {
    let result
    console.log(`🔄 Processing with technique: ${technique}`)

    switch (technique) {
      case "greedy":
        result = greedyScheduler(input)
        break
      case "dynamic":
        result = dpScheduler(input)
        break
      case "genetic":
        result = bruteForceScheduler(input)
        break
      default:
        console.error("❌ Invalid technique:", technique)
        return res.status(400).json({ error: "Invalid technique specified" })
    }

    console.log("✅ Scheduling completed successfully")
    res.json(result)
  } catch (err) {
    console.error("❌ Scheduler failed:", err)
    res.status(500).json({
      error: "Scheduler failed",
      details: err.message || err,
      technique: technique,
    })
  }
})

// Determine the correct path to dist folder
const getDistPath = () => {
  // Try different possible paths
  const possiblePaths = [
    path.join(__dirname, "../../dist"), // Original path
    path.join(process.cwd(), "dist"), // From project root
    path.join(__dirname, "../../../dist"), // If nested deeper
    "./dist", // Relative to working directory
  ]

  for (const distPath of possiblePaths) {
    const resolvedPath = path.resolve(distPath)
    console.log(`🔍 Checking dist path: ${resolvedPath}`)

    try {
      if (fs.existsSync(resolvedPath)) {
        console.log(`✅ Found dist folder at: ${resolvedPath}`)
        return resolvedPath
      }
    } catch (error) {
      console.log(`❌ Path not found: ${resolvedPath}`)
    }
  }

  // Fallback to original path
  const fallbackPath = path.join(__dirname, "../../dist")
  console.log(`⚠️  Using fallback dist path: ${fallbackPath}`)
  return fallbackPath
}

// Serve static files
const distPath = getDistPath()
console.log(`📂 Serving static files from: ${distPath}`)
app.use(express.static(distPath))

// API routes should come before the catch-all
app.get("/api/*", (req, res) => {
  console.log(`❌ API route not found: ${req.path}`)
  res.status(404).json({ error: `API endpoint ${req.path} not found` })
})

// React fallback (for SPA routes) - this should be LAST
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html")
  console.log(`🔄 Serving React app from: ${indexPath}`)

  try {
    res.sendFile(indexPath)
  } catch (error) {
    console.error("❌ Error serving index.html:", error)
    res.status(500).send("Error loading application")
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("💥 Unhandled error:", error)
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  })
})

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on http://0.0.0.0:${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`📁 Serving static files from: ${distPath}`)
})

// Handle process termination
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully")
  process.exit(0)
})
