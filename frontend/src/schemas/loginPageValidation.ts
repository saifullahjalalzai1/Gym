import z from "zod";

// Login Schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .max(50, { message: "Username must be at most 50 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be at most 100 characters" }),
});

// Change Password Schema
export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, { message: "Current password is required" }),
    new_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirm_password: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

// Infer types from schemas
export type LoginFormInputs = z.infer<typeof loginSchema>;
export type ChangePasswordFormInputs = z.infer<typeof changePasswordSchema>;
