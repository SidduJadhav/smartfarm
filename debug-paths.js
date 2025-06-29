// Debugging script to check file paths on Render
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("=== PATH DEBUGGING ===")
console.log("Current working directory:", process.cwd())
console.log("__dirname:", __dirname)
console.log("__filename:", __filename)

// Check various paths
const pathsToCheck = [
  "dist",
  "./dist",
  "../../dist",
  "../dist",
  path.join(__dirname, "dist"),
  path.join(__dirname, "../dist"),
  path.join(__dirname, "../../dist"),
  path.join(process.cwd(), "dist"),
]

console.log("\n=== CHECKING PATHS ===")
for (const checkPath of pathsToCheck) {
  const resolved = path.resolve(checkPath)
  console.log(`Path: ${checkPath} -> Resolved: ${resolved}`)

  try {
    const fs = await import("fs")
    const exists = fs.existsSync(resolved)
    console.log(`  Exists: ${exists}`)

    if (exists) {
      try {
        const stats = fs.statSync(resolved)
        console.log(`  Is Directory: ${stats.isDirectory()}`)
        if (stats.isDirectory()) {
          const files = fs.readdirSync(resolved)
          console.log(`  Files: ${files.slice(0, 5).join(", ")}${files.length > 5 ? "..." : ""}`)
        }
      } catch (e) {
        console.log(`  Error reading: ${e.message}`)
      }
    }
  } catch (e) {
    console.log(`  Error checking: ${e.message}`)
  }
  console.log("")
}
