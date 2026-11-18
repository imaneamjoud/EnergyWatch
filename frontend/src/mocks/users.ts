import { User } from "@/types";

export const DEMO_PASSWORD = "demo123";

export const demoUsers: User[] = [
  { id: "u1", name: "Admin Principal", email: "admin@energyinsight.com", role: "ADMIN", buildingIds: [] },
  { id: "u2", name: "Sara Analyste", email: "analyste@energyinsight.com", role: "ANALYST", buildingIds: [] },
  { id: "u3", name: "Manager Administration", email: "manager1@energyinsight.com", role: "MANAGER", buildingIds: ["b1"] },
  { id: "u4", name: "Manager Production", email: "manager2@energyinsight.com", role: "MANAGER", buildingIds: ["b3"] },
  { id: "u5", name: "Manager Laboratoire", email: "manager3@energyinsight.com", role: "MANAGER", buildingIds: ["b2"] },
  { id: "u6", name: "Manager Stockage", email: "manager4@energyinsight.com", role: "MANAGER", buildingIds: ["b4"] },
];
