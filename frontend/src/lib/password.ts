// 0 = vide, 1 = faible, 2 = moyenne, 3 = forte
export function strengthLevel(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  let points = 0;
  if (p.length >= 8) points++;
  if (p.length >= 12) points++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) points++;
  if (/\d/.test(p)) points++;
  if (/[^A-Za-z0-9]/.test(p)) points++;
  if (p.length < 8) return 1;
  return points >= 5 ? 3 : points >= 3 ? 2 : 1;
}

// Mot de passe aléatoire (sans 0/O, 1/l/I), avec minuscule, majuscule, chiffre et symbole
export function generatePassword(length = 12): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = lower + upper + digits + symbols;

  // Tirage sans biais : on rejette les valeurs qui fausseraient le modulo
  const rnd = (n: number) => {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    let x = 0;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % n;
  };
  const pick = (s: string) => s[rnd(s.length)];

  const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
