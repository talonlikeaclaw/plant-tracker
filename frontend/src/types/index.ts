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
  cover_photo_id?: number | null;
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
  plant_id: number;
  care_type_id: number;
  start_date: string;
  frequency_days: number;
  note?: string;
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
  care_type_id: number;
  note?: string;
  due_date: string;
  days_until_due: number;
  cover_photo_id?: number | null;
};

// Species
export interface Species {
  id: number;
  common_name: string;
  scientific_name?: string;
  sunlight?: string;
  water_requirements?: string;
}

// Plant with enriched care data
export interface PlantCareStatus {
  careTypeName: string;
  lastCareDate: string;
  daysAgo: number;
}

export interface PlantWithCareData extends Plant {
  recentCareHistory: PlantCareStatus[];
  upcomingCare: UpcomingCareLog[];
  urgencyStatus: "overdue" | "due_today" | "due_soon" | "up_to_date";
}

// Photos
export interface Photo {
  id: number;
  owner_type: "plant" | "care_log";
  owner_id: number;
  filename: string;
  original_filename?: string;
  width?: number;
  height?: number;
  position?: number;
  created_at?: string;
}

// Source metadata describing where a photo came from (plant vs care log)
export interface PhotoSource {
  type: "plant" | "care_log";
  care_log_id?: number;
  care_type?: string;
  care_date?: string;
  note?: string;
}

// Photo with source info, returned by the aggregated gallery endpoints
export interface PhotoWithSource extends Photo {
  source: PhotoSource;
}
