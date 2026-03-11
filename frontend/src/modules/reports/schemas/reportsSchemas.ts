import { z } from "zod";

export const expenseCategoryValues = [
  "rent",
  "utilities",
  "salary",
  "equipment",
  "maintenance",
  "marketing",
  "other",
] as const;

export const expenseFormSchema = z.object({
  expense_name: z
    .string()
    .trim()
    .min(2, "Expense name must be at least 2 characters."),
  amount: z
    .number({
      invalid_type_error: "Amount is required.",
    })
    .positive("Amount must be greater than 0."),
  expense_date: z.string().min(1, "Expense date is required."),
  category: z.enum(expenseCategoryValues),
  note: z.string().max(1000, "Note is too long.").optional(),
});

