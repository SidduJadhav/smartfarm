// Greedy Scheduler - converted from C
export function greedyScheduler(input) {
  try {
    const data = parseInput(input)
    if (!data) {
      return { error: "Failed to parse input JSON" }
    }

    scheduleIrrigation(data)
    return generateOutput(data, "Greedy")
  } catch (error) {
    return { error: "Scheduler failed", details: error.message }
  }
}

function parseInput(input) {
  if (!input || typeof input !== "object") return null

  const data = {
    totalWater: input.totalWater || 0,
    totalElectricity: input.totalElectricity || 0,
    waterDeliveryRate: input.waterDeliveryRate || 0,
    fieldCount: input.fieldCount || 0,
    fields: [],
    totalWaterUsed: 0,
    totalTimeUsed: 0,
    remainingWater: 0,
    remainingElectricity: 0,
    useTimeConstraints: false,
  }

  if (data.totalWater <= 0) {
    console.error("Error: Invalid total water amount")
    return null
  }

  // Check if we should use time constraints
  data.useTimeConstraints = data.totalElectricity > 0 && data.waterDeliveryRate > 0

  if (!data.useTimeConstraints) {
    data.totalElectricity = 1000
    data.waterDeliveryRate = 50
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
      timeNeeded: 0,
      allocated: 0,
      scheduled: false,
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

function calculateFieldTimes(data) {
  if (!data) return

  if (data.waterDeliveryRate <= 0) {
    data.waterDeliveryRate = 50
  }

  for (let i = 0; i < data.fieldCount; i++) {
    data.fields[i].timeNeeded = Math.ceil(data.fields[i].waterNeeded / data.waterDeliveryRate)
    if (data.fields[i].timeNeeded <= 0) {
      data.fields[i].timeNeeded = 1
    }
  }
}

function scheduleIrrigation(data) {
  if (!data || data.fieldCount <= 0 || data.totalWater < 0) {
    return
  }

  if (data.useTimeConstraints) {
    calculateFieldTimes(data)
  }

  // Sort fields by priority (lowest moisture first, then highest water needed)
  data.fields.sort((a, b) => {
    if (a.moisture !== b.moisture) {
      return a.moisture - b.moisture
    }
    return b.waterNeeded - a.waterNeeded
  })

  data.remainingWater = data.totalWater
  data.remainingElectricity = data.totalElectricity
  data.totalWaterUsed = 0
  data.totalTimeUsed = 0

  // Initialize all fields as unscheduled
  for (let i = 0; i < data.fieldCount; i++) {
    data.fields[i].scheduled = false
    data.fields[i].allocated = 0
  }

  // Greedy allocation
  for (let i = 0; i < data.fieldCount; i++) {
    if (data.useTimeConstraints) {
      const minWater = Math.floor(data.fields[i].waterNeeded / 10)
      const minTime = Math.ceil(minWater / data.waterDeliveryRate)

      if (data.remainingWater >= minWater && data.remainingElectricity >= minTime) {
        let waterToAllocate = data.fields[i].waterNeeded
        let timeToAllocate = data.fields[i].timeNeeded

        if (waterToAllocate > data.remainingWater) {
          waterToAllocate = data.remainingWater
          timeToAllocate = Math.ceil(waterToAllocate / data.waterDeliveryRate)
        }

        if (timeToAllocate > data.remainingElectricity) {
          timeToAllocate = data.remainingElectricity
          waterToAllocate = timeToAllocate * data.waterDeliveryRate
          if (waterToAllocate > data.fields[i].waterNeeded) {
            waterToAllocate = data.fields[i].waterNeeded
          }
        }

        data.fields[i].allocated = waterToAllocate
        data.fields[i].scheduled = true
        data.remainingWater -= waterToAllocate
        data.remainingElectricity -= timeToAllocate
        data.totalWaterUsed += waterToAllocate
        data.totalTimeUsed += timeToAllocate
      }
    } else {
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
  }
}

function generateOutput(data, algorithm) {
  if (!data) {
    return { error: "Invalid data" }
  }

  const scheduled = data.fields
    .filter((field) => field.scheduled)
    .map((field) => {
      const result = {
        name: field.name,
        moisture: field.moisture,
        need: field.waterNeeded,
        allocated: field.allocated,
      }

      if (data.useTimeConstraints) {
        result.timeNeeded = field.timeNeeded
      }

      return result
    })

  const output = {
    algorithm,
    scheduled,
    totalWaterUsed: data.totalWaterUsed,
    remainingWater: data.remainingWater,
  }

  if (data.useTimeConstraints) {
    output.totalTimeUsed = data.totalTimeUsed
    output.remainingElectricity = data.remainingElectricity
  }

  return output
}
