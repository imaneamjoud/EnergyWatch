// Remplace {nom} dans un texte traduit : fill("{n} bâtiments", { n: 5 })
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
