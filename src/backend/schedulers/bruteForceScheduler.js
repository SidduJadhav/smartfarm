// Brute Force Scheduler with Single Priority Formula
export function bruteForceScheduler(input) {
  try {
    const data = parseInput(input)
    if (!data) {
      return { error: "Failed to parse input JSON" }
    }

    scheduleIrrigation(data)
    return generateOutput(data, "Enhanced Greedy")
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
      priority: 0,
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

function calculatePriorities(data) {
  console.log("🧮 Calculating field priorities using standard formula")

  for (let i = 0; i < data.fieldCount; i++) {
    const field = data.fields[i]

    // Standard priority formula
    const moistureDeficit = 100 - field.moisture
    const waterEfficiency = 1000 / field.waterNeeded
    field.priority = moistureDeficit * (1 + waterEfficiency / 1000)

    console.log(
      `📊 ${field.name}: moisture=${field.moisture}%, deficit=${moistureDeficit}, ` +
        `waterNeeded=${field.waterNeeded}L, efficiency=${waterEfficiency.toFixed(2)}, ` +
        `priority=${field.priority.toFixed(2)}`,
    )
  }
}

function scheduleIrrigation(data) {
  if (!data || data.fieldCount <= 0 || data.totalWater < 0) {
    return
  }

  // Calculate priorities
  calculatePriorities(data)

  // Sort by priority (highest first), then by water needed (highest first) as tiebreaker
  data.fields.sort((a, b) => {
    if (Math.abs(a.priority - b.priority) < 0.01) {
      return b.waterNeeded - a.waterNeeded
    }
    return b.priority - a.priority
  })

  console.log("🔄 Field priority order:")
  data.fields.forEach((field, index) => {
    console.log(`  ${index + 1}. ${field.name} (priority: ${field.priority.toFixed(2)})`)
  })

  data.totalWaterUsed = 0
  data.remainingWater = data.totalWater

  // Initialize all fields as unscheduled
  for (let i = 0; i < data.fieldCount; i++) {
    data.fields[i].scheduled = false
    data.fields[i].allocated = 0
  }

  // Greedy allocation based on priority
  for (let i = 0; i < data.fieldCount; i++) {
    const field = data.fields[i]

    if (data.remainingWater >= field.waterNeeded) {
      field.allocated = field.waterNeeded
      field.scheduled = true
      data.remainingWater -= field.waterNeeded
      data.totalWaterUsed += field.waterNeeded

      console.log(`✅ Scheduled ${field.name}: ${field.waterNeeded}L (full need)`)
    } else if (data.remainingWater > 0) {
      const minAllocation = Math.floor(field.waterNeeded / 10)
      if (data.remainingWater >= minAllocation) {
        field.allocated = data.remainingWater
        field.scheduled = true
        data.totalWaterUsed += data.remainingWater
        data.remainingWater = 0

        console.log(`✅ Scheduled ${field.name}: ${field.allocated}L (partial)`)
      }
      break
    } else {
      console.log(`❌ No water remaining for ${field.name}`)
      break
    }
  }

  // Restore original field order for output
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
      priority: Math.round(field.priority * 100) / 100,
    }))

  return {
    algorithm,
    scheduled,
    totalWaterUsed: data.totalWaterUsed,
    remainingWater: data.remainingWater,
  }
}
