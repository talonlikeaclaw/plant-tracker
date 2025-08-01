// Auth
export interface AuthResponse {
  access_token: string;
  message?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

// Plants
export interface Plant {
  id: number;
  nickname: string;
  species_id: number;
  date_added: string;
  last_watered: string;
  location?: string;
}

// Care Logs
export interface CareLog {
  id: number;
  plant_id: number;
  care_type_id: number;
  note?: string;
  care_date: string;
}

// Care Plans
export interface CarePlan {
  id: number;
  user_id: number;
  plant_id: number;
  care_type_id: number;
  start_date: string;
  frequency_days: number;
  note: string;
  active: boolean;
}

// Care Types
export interface CareType {
  id: number;
  user_id: number | null;
  name: string;
  description: string;
}

// Upcoming Care Logs
export type UpcomingCareLog = {
  plant_id: number;
  plant_nickname: string;
  care_type: string;
  note?: string;
  due_date: string;
  days_until_due: number;
};
