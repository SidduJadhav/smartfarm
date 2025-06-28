"use client"

import type React from "react"
import { motion } from "framer-motion"
import type { ScheduledField, ScheduleResponse } from "../types"
import { Droplets, TreesIcon as Plant, ThermometerSun, Timer } from "lucide-react"

interface ResultsDisplayProps {
  results: ScheduleResponse | null
  onReset: () => void
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  if (!results) return null

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getMoistureColor = (moisture: number) => {
    if (moisture <= 25) return "text-red-600"
    if (moisture <= 50) return "text-yellow-600"
    if (moisture <= 75) return "text-blue-600"
    return "text-green-600"
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const StatusBadge = ({ field }: { field: ScheduledField }) => {
    if (field.status === "irrigated") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Plant size={14} className="mr-1" />
          Irrigated
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Not Scheduled
      </span>
    )
  }

  return (
    <motion.div
      className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Droplets className="mr-2" size={24} />
          Irrigation Schedule Results
        </h2>
      </div>

      <div className="p-6">
        <motion.div className="grid grid-cols-1 gap-4" variants={container} initial="hidden" animate="show">
          {results.scheduled.map((field) => (
            <motion.div
              key={field.id}
              className={`p-4 rounded-lg border ${
                field.status === "irrigated" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
              variants={item}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{field.name}</h3>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <ThermometerSun size={18} className={`mr-1.5 ${getMoistureColor(field.moisture)}`} />
                      <span className="text-sm text-gray-600">
                        Moisture: <span className="font-medium">{field.moisture}%</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Droplets size={18} className="mr-1.5 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Needed: <span className="font-medium">{field.waterNeeded}L</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Timer size={18} className="mr-1.5 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        Time: <span className="font-medium">{formatTime(field.timeNeeded)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <StatusBadge field={field} />
                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-500">Allocated:</span>
                    <div className="text-xl font-bold text-blue-600">{field.allocated}L</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Resource Summary</h3>
              <div className="mt-1 grid grid-cols-4 gap-x-6 gap-y-2">
                <div className="flex items-center">
                  <Droplets size={18} className="mr-1.5 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    Used: <span className="font-medium">{results.totalWaterUsed}L</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Droplets size={18} className="mr-1.5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Remaining: <span className="font-medium">{results.remainingWater}L</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Timer size={18} className="mr-1.5 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    Time Used: <span className="font-medium">{formatTime(results.totalTimeUsed)}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Timer size={18} className="mr-1.5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Time Left: <span className="font-medium">{formatTime(results.remainingElectricity)}</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onReset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Schedule
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ResultsDisplay
