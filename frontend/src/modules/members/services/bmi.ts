import type { BmiCategory } from "../types/member";

export const calculateBMI = (
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): number | null => {
  if (weightKg == null || heightCm == null) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
};

export const getBmiCategory = (bmi: number | null): BmiCategory | null => {
  if (bmi == null) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
};
