// Dynamic Programming Scheduler - converted from C
export function dpScheduler(input) {
  try {
    const data = parseInput(input)
    if (!data) {
      return { error: "Failed to parse input JSON" }
    }

    // Sort fields by priority (lowest moisture first, then highest water needed)
    data.fields.sort((a, b) => {
      if (a.moisture !== b.moisture) {
        return a.moisture - b.moisture
      }
      return b.waterNeeded - a.waterNeeded
    })

    // DP setup
    const fieldCount = data.fieldCount
    const totalWater = data.totalWater

    // Initialize DP table
    const dp = Array(fieldCount + 1)
      .fill(null)
      .map(() => Array(totalWater + 1).fill(Number.NEGATIVE_INFINITY))
    const parent = Array(fieldCount + 1)
      .fill(null)
      .map(() => Array(totalWater + 1).fill(-1))

    dp[0][0] = 0

    // DP computation
    for (let i = 0; i < fieldCount; i++) {
      const minWater = Math.ceil(data.fields[i].waterNeeded / 10)

      for (let w = 0; w <= totalWater; w++) {
        // Skip field option
        if (dp[i][w] > dp[i + 1][w]) {
          dp[i + 1][w] = dp[i][w]
          parent[i + 1][w] = -1
        }

        // Allocate to field option
        for (let x = minWater; x <= data.fields[i].waterNeeded; x++) {
          if (w < x) break

          const value = (100 - data.fields[i].moisture) * (x / data.fields[i].waterNeeded)
          const candidate = dp[i][w - x] + value

          if (candidate > dp[i + 1][w]) {
            dp[i + 1][w] = candidate
            parent[i + 1][w] = x
          }
        }
      }
    }

    // Find optimal water usage
    let bestW = 0
    let bestValue = Number.NEGATIVE_INFINITY
    for (let w = 0; w <= totalWater; w++) {
      if (dp[fieldCount][w] > bestValue) {
        bestValue = dp[fieldCount][w]
        bestW = w
      }
    }

    // Backtrack to find allocations
    let currentW = bestW
    for (let i = fieldCount - 1; i >= 0; i--) {
      const x = parent[i + 1][currentW]
      if (x >= 0) {
        data.fields[i].allocated = x
        data.fields[i].scheduled = true
        currentW -= x
      }
    }

    data.totalWaterUsed = bestW
    data.remainingWater = totalWater - bestW

    // Restore original field order
    data.fields.sort((a, b) => a.originalIndex - b.originalIndex)

    return generateOutput(data, "DynamicProgramming")
  } catch (error) {
    return { error: "Scheduler failed", details: error.message }
  }
}

function parseInput(input) {
  if (!input || typeof input !== "object") return null

  const data = {
    totalWater: input.totalWater || 0,
    fieldCount: input.fieldCount || 0,
    fields: [],
    totalWaterUsed: 0,
    remainingWater: 0,
  }

  if (data.totalWater <= 0) {
    console.error("Error: Invalid total water amount")
    return null
  }

  if (data.fieldCount <= 0 || data.fieldCount > 10) {
    console.error("Error: Invalid field count:", data.fieldCount)
    return null
  }

  if (!input.fields || !Array.isArray(input.fields)) {
    console.error("Error: Fields array not found")
    return null
  }

  for (let i = 0; i < Math.min(data.fieldCount, input.fields.length); i++) {
    const field = input.fields[i]

    if (!field.name || typeof field.name !== "string") continue

    const fieldData = {
      name: field.name.substring(0, 99), // MAX_NAME_LENGTH - 1
      moisture: field.moisture || 0,
      waterNeeded: field.waterNeeded || 0,
      allocated: 0,
      scheduled: false,
      originalIndex: i,
    }

    if (fieldData.moisture < 0 || fieldData.moisture > 100) {
      console.error(`Error: Invalid moisture level for field ${fieldData.name}: ${fieldData.moisture}`)
      return null
    }

    if (fieldData.waterNeeded < 0) {
      console.error(`Error: Invalid water needed for field ${fieldData.name}: ${fieldData.waterNeeded}`)
      return null
    }

    data.fields.push(fieldData)
  }

  data.fieldCount = data.fields.length
  return data.fieldCount > 0 ? data : null
}

function generateOutput(data, algorithm) {
  if (!data) {
    return { error: "Invalid data" }
  }

  const scheduled = data.fields
    .filter((field) => field.scheduled)
    .map((field) => ({
      name: field.name,
      moisture: field.moisture,
      need: field.waterNeeded,
      allocated: field.allocated,
    }))

  return {
    algorithm,
    scheduled,
    totalWaterUsed: data.totalWaterUsed,
    remainingWater: data.remainingWater,
  }
}
