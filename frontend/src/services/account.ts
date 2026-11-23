import { checkPassword, demoUsers, userPasswords } from "@/mocks/users";
import type { Result } from "@/services/buildings";
import type { User } from "@/types";

export async function updateProfile(
  userId: string,
  input: { name: string; email: string }
): Promise<Result<User>> {
  const u = demoUsers.find((x) => x.id === userId);
  if (!u) return { ok: false, error: "prof.err.notFound" };

  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, error: "usr.err.name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "usr.err.email" };
  if (demoUsers.some((x) => x.id !== userId && x.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "usr.err.emailExists" };
  }

  u.name = name;
  u.email = email;
  return { ok: true, data: { ...u } };
}

export async function changePassword(
  userId: string,
  current: string,
  next: string,
  confirm: string
): Promise<Result<null>> {
  if (!demoUsers.some((x) => x.id === userId)) return { ok: false, error: "prof.err.notFound" };
  if (!checkPassword(userId, current)) return { ok: false, error: "prof.err.currentWrong" };
  if (next.length < 8) return { ok: false, error: "prof.err.tooShort" };
  if (next === current) return { ok: false, error: "prof.err.same" };
  if (next !== confirm) return { ok: false, error: "prof.err.mismatch" };
  userPasswords.set(userId, next);
  return { ok: true, data: null };
}
