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

// Care Types
export interface CareType {
  id: number;
  user_id: number | null;
  name: string;
  description: string;
}
