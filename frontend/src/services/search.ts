import { getAnomalyRows } from "@/services/anomalies";
import { getBuildingStats } from "@/services/buildings";
import { getMeterRows } from "@/services/meters";

export async function getSearchData(scope?: string[]) {
  const [b, m, a] = await Promise.all([getBuildingStats(scope), getMeterRows(scope), getAnomalyRows(scope)]);
  return {
    buildings: b.map((x) => ({ id: x.id, name: x.name, address: x.address, type: x.type })),
    meters: m.map((x) => ({ id: x.id, buildingName: x.buildingName, location: x.location, online: x.online })),
    anomalies: a.map((x) => ({
      id: x.id,
      meterId: x.meterId,
      buildingName: x.buildingName,
      severity: x.severity,
      status: x.status,
    })),
  };
}

export type SearchData = Awaited<ReturnType<typeof getSearchData>>;
