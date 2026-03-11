import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

const requiredPositiveNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  },
  z
    .number({
      required_error: "Monthly salary is required",
      invalid_type_error: "Monthly salary is required",
    })
    .positive("Monthly salary must be greater than 0")
);

const assignedClassesSchema = z
  .array(z.string().trim().min(1, "Class name cannot be empty"))
  .default([])
  .transform((values) => {
    const normalized: string[] = [];
    const seen = new Set<string>();
    values.forEach((value) => {
      const cleaned = value.trim();
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(cleaned);
      }
    });
    return normalized;
  });

export const trainerFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  father_name: optionalText,
  mobile_number: z.string().trim().min(1, "Mobile number is required"),
  whatsapp_number: optionalText,
  id_card_number: optionalText,
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  blood_group: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .or(z.literal("")),
  profile_picture: z.any().optional(),
  date_of_birth: optionalText,
  date_hired: z.string().trim().min(1, "Date hired is required"),
  monthly_salary: requiredPositiveNumber,
  salary_currency: z.string().trim().min(1, "Salary currency is required"),
  salary_status: z.enum(["paid", "unpaid", "partial"]),
  employment_status: z.enum(["active", "inactive", "on_leave", "resigned"]),
  assigned_classes: assignedClassesSchema,
  notes: optionalText,
});

export type TrainerFormSchemaInput = z.infer<typeof trainerFormSchema>;
