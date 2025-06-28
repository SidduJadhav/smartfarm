export interface Field {
  id: string;
  name: string;
  moisture: number;
  waterNeeded: number;
}

export interface FieldInput {
  name: string;
  moisture: number;
  waterNeeded: number;
}

export interface ScheduledField extends Field {
  allocated: number;
  timeNeeded: number;
  status: 'irrigated' | 'not-scheduled';
}

export interface ScheduleResponse {
  scheduled: ScheduledField[];
  totalWaterUsed: number;
  totalTimeUsed: number;
  remainingWater: number;
  remainingElectricity: number;
}

export type AlgorithmType = 'greedy' | 'dynamic' | 'genetic';