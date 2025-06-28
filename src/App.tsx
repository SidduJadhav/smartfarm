"use client"

import { useState } from "react"
import { Toaster, toast } from "react-hot-toast"
import { Cloud, Droplets, Brain, Zap, Target } from "lucide-react"
import type { FieldInput, ScheduleResponse, AlgorithmType } from "./types"
import { scheduleIrrigation } from "./services/api"
import FieldForm from "./components/FieldForm"
import ResultsDisplay from "./components/ResultsDisplay"

const algorithms = [
  { id: "greedy" as const, name: "Greedy", icon: Zap, description: "Fast, locally optimal solution" },
  {
    id: "dynamic" as const,
    name: "Dynamic Programming without constraints",
    icon: Brain,
    description: "Optimal solution using memoization",
  },
  {
    id: "genetic" as const,
    name: "greedy without constraints",
    icon: Target,
    description: "Evolutionary approach for global optimization",
  },
]

const DEFAULT_FIELDS = [
  { name: "Field A", moisture: 20, waterNeeded: 300 },
  { name: "Field B", moisture: 35, waterNeeded: 250 },
  { name: "Field C", moisture: 45, waterNeeded: 200 },
  { name: "Field D", moisture: 15, waterNeeded: 350 },
  { name: "Field E", moisture: 60, waterNeeded: 150 },
]

function App() {
  const [results, setResults] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>("greedy")

  // Lift form state up to App component
  const [fields, setFields] = useState<FieldInput[]>(DEFAULT_FIELDS)
  const [totalWater, setTotalWater] = useState<number>(5000)
  const [totalElectricity, setTotalElectricity] = useState<number>(300)
  const [waterDeliveryRate, setWaterDeliveryRate] = useState<number>(20)

  const handleSubmit = async (
    fields: FieldInput[],
    totalWater: number,
    totalElectricity: number,
    waterDeliveryRate: number,
  ) => {
    try {
      setLoading(true)
      const data = await scheduleIrrigation(fields, totalWater, totalElectricity, waterDeliveryRate, selectedAlgorithm)
      setResults(data)
      toast.success("Irrigation schedule created successfully!")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to create irrigation schedule.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
  }

  const handleCompleteReset = () => {
    setResults(null)
    setFields(DEFAULT_FIELDS)
    setTotalWater(5000)
    setTotalElectricity(300)
    setWaterDeliveryRate(20)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Droplets className="h-10 w-10 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Smart Irrigation Scheduler</h1>
                <p className="text-blue-100">Optimize your water distribution efficiently</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-sm text-blue-100">
              <Cloud className="h-5 w-5 mr-1" />
             
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {algorithms.map((algorithm) => {
                const Icon = algorithm.icon
                return (
                  <button
                    key={algorithm.id}
                    onClick={() => setSelectedAlgorithm(algorithm.id)}
                    className={`
                      flex-1 px-4 py-4 text-center border-b-2 transition-colors
                      ${
                        selectedAlgorithm === algorithm.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center justify-center">
                      <Icon className="h-5 w-5 mr-2" />
                      <span className="font-medium">{algorithm.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{algorithm.description}</p>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {!results && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Field Information</h2>
                  <p className="mt-2 text-gray-600">
                    Enter your field details below to generate an optimal irrigation schedule
                  </p>
                </div>
                <FieldForm
                  onSubmit={handleSubmit}
                  fields={fields}
                  setFields={setFields}
                  totalWater={totalWater}
                  setTotalWater={setTotalWater}
                  totalElectricity={totalElectricity}
                  setTotalElectricity={setTotalElectricity}
                  waterDeliveryRate={waterDeliveryRate}
                  setWaterDeliveryRate={setWaterDeliveryRate}
                  onCompleteReset={handleCompleteReset}
                />
              </>
            )}

            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {results && !loading && <ResultsDisplay results={results} onReset={handleReset} />}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Droplets className="h-6 w-6 mr-2 text-blue-400" />
              <span className="text-lg font-semibold">Smart Irrigation</span>
            </div>
            <div className="text-gray-400 text-sm">© 2025 Smart Irrigation Technologies. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
