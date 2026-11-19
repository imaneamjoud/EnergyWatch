import { buildings } from "@/mocks/data";
import { demoUsers } from "@/mocks/users";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Result } from "@/services/buildings";
import type { Role, User } from "@/types";

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  buildingIds: string[];
  active: boolean;
}

const normalize = (u: User): User => ({ ...u, active: u.active !== false });

export async function getUsers(): Promise<User[]> {
  return demoUsers.map(normalize);
}

function validate(input: UserInput, id: string | null, actorId: string): TranslationKey | null {
  if (!input.name.trim()) return "usr.err.name";
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "usr.err.email";
  if (demoUsers.some((u) => u.id !== id && u.email.toLowerCase() === email)) return "usr.err.emailExists";
  if (input.role === "MANAGER" && input.buildingIds.length === 0) return "usr.err.buildings";

  if (id) {
    const current = demoUsers.find((u) => u.id === id);
    if (!current) return "usr.err.notFound";
    if (id === actorId && (current.role !== input.role || !input.active)) return "usr.err.self";
    const losesAdmin =
      current.role === "ADMIN" && current.active !== false && (input.role !== "ADMIN" || !input.active);
    const otherAdmin = demoUsers.some((u) => u.id !== id && u.role === "ADMIN" && u.active !== false);
    if (losesAdmin && !otherAdmin) return "usr.err.lastAdmin";
  }
  return null;
}

const cleanBuildings = (input: UserInput) =>
  input.role === "MANAGER" ? input.buildingIds.filter((b) => buildings.some((x) => x.id === b)) : [];

export async function createUser(input: UserInput, actorId: string): Promise<Result<{ id: string }>> {
  const error = validate(input, null, actorId);
  if (error) return { ok: false, error };
  const next = demoUsers.reduce((mx, u) => Math.max(mx, Number(u.id.slice(1)) || 0), 0) + 1;
  const id = `u${next}`;
  demoUsers.push({
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    buildingIds: cleanBuildings(input),
    active: input.active,
  });
  return { ok: true, data: { id } };
}

export async function updateUser(id: string, input: UserInput, actorId: string): Promise<Result<{ id: string }>> {
  const error = validate(input, id, actorId);
  if (error) return { ok: false, error };
  const u = demoUsers.find((x) => x.id === id);
  if (!u) return { ok: false, error: "usr.err.notFound" };
  u.name = input.name.trim();
  u.email = input.email.trim();
  u.role = input.role;
  u.buildingIds = cleanBuildings(input);
  u.active = input.active;
  return { ok: true, data: { id } };
}

export async function setUserActive(id: string, active: boolean, actorId: string): Promise<Result<{ id: string }>> {
  const u = demoUsers.find((x) => x.id === id);
  if (!u) return { ok: false, error: "usr.err.notFound" };
  return updateUser(
    id,
    { name: u.name, email: u.email, role: u.role, buildingIds: u.buildingIds, active },
    actorId
  );
}
