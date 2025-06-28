"use client"

import type React from "react"
import type { FieldInput } from "../types"
import { Droplets, Trash2, Zap, Timer } from "lucide-react"

interface FieldFormProps {
  onSubmit: (fields: FieldInput[], totalWater: number, totalElectricity: number, waterDeliveryRate: number) => void
  fields: FieldInput[]
  setFields: React.Dispatch<React.SetStateAction<FieldInput[]>>
  totalWater: number
  setTotalWater: React.Dispatch<React.SetStateAction<number>>
  totalElectricity: number
  setTotalElectricity: React.Dispatch<React.SetStateAction<number>>
  waterDeliveryRate: number
  setWaterDeliveryRate: React.Dispatch<React.SetStateAction<number>>
  onCompleteReset: () => void
}

const FieldForm: React.FC<FieldFormProps> = ({
  onSubmit,
  fields,
  setFields,
  totalWater,
  setTotalWater,
  totalElectricity,
  setTotalElectricity,
  waterDeliveryRate,
  setWaterDeliveryRate,
  onCompleteReset,
}) => {
  const handleFieldChange = (index: number, field: Partial<FieldInput>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...field }
    setFields(newFields)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(fields, totalWater, totalElectricity, waterDeliveryRate)
  }

  const removeField = (index: number) => {
    if (fields.length <= 1) return
    setFields(fields.filter((_, i) => i !== index))
  }

  const addField = () => {
    if (fields.length >= 10) return
    setFields([...fields, { name: `Field ${String.fromCharCode(65 + fields.length)}`, moisture: 50, waterNeeded: 200 }])
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Droplets className="mr-2 text-blue-500" size={24} />
            Total Water Available
          </h2>
          <div className="flex items-center">
            <input
              type="number"
              id="totalWater"
              value={totalWater}
              onChange={(e) => setTotalWater(Math.max(0, Number(e.target.value)))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-4 py-3 text-gray-800 border"
              min="0"
              required
            />
            <span className="ml-2 text-lg font-medium text-gray-700">Liters</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Timer className="mr-2 text-yellow-500" size={24} />
            Total Electricity Time
          </h2>
          <div className="flex items-center">
            <input
              type="number"
              id="totalElectricity"
              value={totalElectricity}
              onChange={(e) => setTotalElectricity(Math.max(0, Number(e.target.value)))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-4 py-3 text-gray-800 border"
              min="0"
              required
            />
            <span className="ml-2 text-lg font-medium text-gray-700">Minutes</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Zap className="mr-2 text-purple-500" size={24} />
            Water Delivery Rate
          </h2>
          <div className="flex items-center">
            <input
              type="number"
              id="waterDeliveryRate"
              value={waterDeliveryRate}
              onChange={(e) => setWaterDeliveryRate(Math.max(0, Number(e.target.value)))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-4 py-3 text-gray-800 border"
              min="0"
              required
            />
            <span className="ml-2 text-lg font-medium text-gray-700">L/min</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Field Information</h2>
        {fields.map((field, index) => (
          <div key={index} className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Field {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label="Remove field"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  id={`name-${index}`}
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 text-gray-800 border"
                  required
                />
              </div>

              <div>
                <label htmlFor={`moisture-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Moisture (0-100)
                </label>
                <input
                  type="number"
                  id={`moisture-${index}`}
                  value={field.moisture}
                  onChange={(e) =>
                    handleFieldChange(index, { moisture: Math.min(100, Math.max(0, Number(e.target.value))) })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 text-gray-800 border"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <label htmlFor={`waterNeeded-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Water Needed (Liters)
                </label>
                <input
                  type="number"
                  id={`waterNeeded-${index}`}
                  value={field.waterNeeded}
                  onChange={(e) => handleFieldChange(index, { waterNeeded: Math.max(0, Number(e.target.value)) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 text-gray-800 border"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Field
          </button>

          <button
            type="button"
            onClick={onCompleteReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Form
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Run Scheduler
        </button>
      </div>
    </form>
  )
}

export default FieldForm
