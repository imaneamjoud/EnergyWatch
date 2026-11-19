export type Role = "ADMIN" | "ANALYST" | "MANAGER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  buildingIds: string[];
  active?: boolean;
}

export interface Building {
  id: string;
  name: string;
}

export type MeterStatus = "ACTIVE" | "INACTIVE";

export interface Meter {
  id: string; // ex: C001
  buildingId: string;
  status: MeterStatus;
}

export interface Measurement {
  meterId: string;
  buildingId: string;
  timestamp: string; // ISO 8601, UTC
  kwh: number;
}

export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type AnomalyStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export interface Anomaly {
  id: string;
  meterId: string;
  buildingId: string;
  timestamp: string;
  kwh: number;
  expectedKwh: number;
  method: string;
  severity: Severity;
  status: AnomalyStatus;
  recommendation: string;
}

export type BuildingType = "OFFICE" | "LAB" | "INDUSTRIAL" | "WAREHOUSE" | "DATA_CENTER";

export interface BuildingInfo extends Building {
  type: BuildingType;
  address: string;
  surfaceM2: number;
  floors: number;
  createdAt: string; // date ISO (AAAA-MM-JJ)
}
