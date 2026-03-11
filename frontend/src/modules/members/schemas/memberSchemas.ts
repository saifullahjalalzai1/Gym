import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

const optionalPositiveNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}, z.number().positive("Must be greater than 0").optional());

export const memberFormSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    phone: z.string().trim().min(1, "Phone is required"),
    id_card_number: optionalText,
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    blood_group: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional()
      .or(z.literal("")),
    profile_picture: z.any().optional(),
    date_of_birth: optionalText,
    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say"])
      .optional()
      .or(z.literal("")),
    emergency_contact_name: optionalText,
    emergency_contact_phone: optionalText,
    height_cm: optionalPositiveNumber,
    weight_kg: optionalPositiveNumber,
    join_date: z.string().trim().min(1, "Join date is required"),
    status: z.enum(["active", "inactive"]),
    notes: optionalText,
  })
  .refine(
    (data) => {
      const hasHeight = data.height_cm !== undefined;
      const hasWeight = data.weight_kg !== undefined;
      return hasHeight === hasWeight;
    },
    {
      message: "Height and weight must both be provided for BMI.",
      path: ["height_cm"],
    }
  );

export type MemberFormSchemaInput = z.infer<typeof memberFormSchema>;
