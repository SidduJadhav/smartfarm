// Brute Force Scheduler - converted from C
export function bruteForceScheduler(input) {
  try {
    const data = parseInput(input)
    if (!data) {
      return { error: "Failed to parse input JSON" }
    }

    scheduleIrrigation(data)
    return generateOutput(data, "GreedyNoTime")
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
      name: field.name.substring(0, 99),
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

function scheduleIrrigation(data) {
  if (!data || data.fieldCount <= 0 || data.totalWater < 0) {
    return
  }

  // Sort by priority: lowest moisture, highest water needed
  data.fields.sort((a, b) => {
    if (a.moisture !== b.moisture) {
      return a.moisture - b.moisture
    }
    return b.waterNeeded - a.waterNeeded
  })

  data.totalWaterUsed = 0
  data.remainingWater = data.totalWater

  // Initialize all fields as unscheduled
  for (let i = 0; i < data.fieldCount; i++) {
    data.fields[i].scheduled = false
    data.fields[i].allocated = 0
  }

  // Simple greedy allocation
  for (let i = 0; i < data.fieldCount; i++) {
    if (data.remainingWater >= data.fields[i].waterNeeded) {
      data.fields[i].allocated = data.fields[i].waterNeeded
      data.fields[i].scheduled = true
      data.remainingWater -= data.fields[i].waterNeeded
      data.totalWaterUsed += data.fields[i].waterNeeded
    } else if (data.remainingWater > 0) {
      const minAllocation = Math.floor(data.fields[i].waterNeeded / 10)
      if (data.remainingWater >= minAllocation) {
        data.fields[i].allocated = data.remainingWater
        data.fields[i].scheduled = true
        data.totalWaterUsed += data.remainingWater
        data.remainingWater = 0
      }
      break
    } else {
      break
    }
  }

  // Restore field order if needed
  data.fields.sort((a, b) => a.originalIndex - b.originalIndex)
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
