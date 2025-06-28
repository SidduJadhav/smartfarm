import { FieldInput, AlgorithmType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const scheduleIrrigation = async (
  fields: FieldInput[],
  totalWater: number,
  totalElectricity: number,
  waterDeliveryRate: number,
  technique: AlgorithmType
) => {
  try {
    const inputData = {
      technique,
      totalWater,
      totalElectricity,
      waterDeliveryRate,
      fieldCount: fields.length,
      fields: fields.map(field => ({
        name: field.name,
        moisture: field.moisture,
        waterNeeded: field.waterNeeded,
      })),
    };

    const response = await fetch(`${API_BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inputData)
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule irrigation');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    if (!contentType?.includes('application/json')) {
      throw new Error('Server responded with non-JSON content');
    }

    const data = await response.json();

    return {
      scheduled: data.scheduled.map((field: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: field.name,
        moisture: field.moisture,
        waterNeeded: field.need,
        allocated: field.allocated,
        timeNeeded: field.timeNeeded,
        status: field.allocated > 0 ? 'irrigated' as const : 'not-scheduled' as const
      })),
      totalWaterUsed: data.totalWaterUsed,
      totalTimeUsed: data.totalTimeUsed,
      remainingWater: data.remainingWater,
      remainingElectricity: data.remainingElectricity
    };
  } catch (error) {
    console.error('Error scheduling irrigation:', error);
    throw error;
  }
};