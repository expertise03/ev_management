export interface Manager {
  manager_id: string;
  manager_key: string;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  assigned_city: string;
  total_drivers: number;
  account_status: string;
  email_verified: boolean;
  created_at: string;
}

export interface Driver {
  driver_id: string;
  user_id: string;
  driver_name: string;
  email: string;
  phone: string;
  role: string;
  account_status: string;
  email_verified: boolean;
  fleet_manager_id: string;
  manager_key_used: string;
  manager_email: string;
  vehicle_id: string;
  vin: string;
  registration_number: string;
  vehicle_make: string;
  vehicle_model: string;
  car_type: string;
  manufacture_year: number;
  vehicle_weight_kg: number;
  battery_capacity_kwh: number;
  insurance_expiry: string;
  driver_experience_years: number;
  driver_income: number;
  created_at: string;
}

export interface HierarchyEntry {
  fleet_manager_id: string;
  manager_key: string;
  manager_name: string;
  manager_email: string;
  driver_id: string;
  driver_name: string;
  driver_email: string;
  vehicle_id: string;
  driver_sequence: number;
}

export interface TripRecord {
  user_id: string;
  email: string;
  role: string;
  account_status: string;
  email_verified: boolean;
  last_login: string;
  fleet_manager_id: string;
  manager_key_used: string;
  manager_email: string;
  vehicle_id: string;
  vin: string;
  registration_number: string;
  vehicle_make: string;
  vehicle_model: string;
  car_type: string;
  manufacture_year: number;
  vehicle_weight_kg: number;
  vehicle_status: string;
  insurance_expiry: string;
  battery_capacity_kwh: number;
  battery_percentage: number;
  battery_health_percent: number;
  battery_temperature: number;
  battery_voltage: number;
  charging_cycles: number;
  battery_age_months: number;
  battery_alert_flag: boolean;
  alert_threshold_percent: number;
  motor_speed_rpm: number;
  motor_temperature: number;
  motor_efficiency: number;
  latitude: number;
  longitude: number;
  speed_kmph: number;
  acceleration: number;
  distance_travelled_km: number;
  trip_duration_min: number;
  remaining_range_km: number;
  load_weight_kg: number;
  start_location: string;
  start_latitude: number;
  start_longitude: number;
  destination: string;
  destination_latitude: number;
  destination_longitude: number;
  route_distance_km: number;
  eta_minutes: number;
  road_type: string;
  traffic_level: string;
  weather_condition: string;
  charging_stops_en_route: number;
  charging_status: string;
  charging_station_id: string;
  charging_duration_min: number;
  charging_cost_rs: number;
  energy_consumed_kwh: number;
  charger_type: string;
  driver_id: string;
  driver_income: number;
  driver_experience_years: number;
  driver_score: number;
  harsh_braking_count: number;
  sudden_acceleration_count: number;
  overspeed_count: number;
  cost_per_km: number;
  daily_energy_cost: number;
  monthly_energy_cost: number;
  total_trip_cost: number;
  tire_health_percent: number;
  last_service_days: number;
  maintenance_cost_rs: number;
  maintenance_alert: string;
  timestamp: string;
  day_of_week: string;
  month: string;
}

export type UserRole = 'manager' | 'driver';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
}
