// profile.schema.ts
import { z } from "zod";

export const userProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  phone: z.string().optional(), // Or add a more specific regex if needed
});

// This creates a TypeScript type from your schema
export type UserProfileFormData = z.infer<typeof userProfileSchema>;