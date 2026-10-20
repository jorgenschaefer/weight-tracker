/**
 * The calories a day a pace of `kgPerWeek` stands for, a deficit or a
 * surplus by its sign: its amount × {@link KCAL_PER_KG} / 7, rounded to the
 * nearest ten.
 */
export function kcalPerDay(kgPerWeek: number): number {
  return Math.round((Math.abs(kgPerWeek) * KCAL_PER_KG) / 7 / 10) * 10;
}

/** The energy in a kg of body weight. */
const KCAL_PER_KG = 7700;
