/**
 * The weight in kg that `input`, typed into „Gewicht heute“, enters: 30 to
 * 250 kg with at most one decimal, after a comma or a point. `null` for
 * anything else, an empty field too.
 */
export function parseEnteredKg(input: string): number | null {
  const match = /^(\d+)(?:[.,](\d))?$/.exec(input.trim());
  if (match === null) return null;
  const kg = Number(`${match[1]}.${match[2] ?? "0"}`);
  return kg >= MIN_KG && kg <= MAX_KG ? kg : null;
}

const MIN_KG = 30;
const MAX_KG = 250;
