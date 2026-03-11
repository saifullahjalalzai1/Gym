import { useEffect } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import { useExpenseForm } from "../hooks/useExpenseForm";
import type { ExpenseFormValues } from "../types/reports";

interface AddExpenseModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
}

const getToday = () => new Date().toISOString().slice(0, 10);

export default function AddExpenseModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useExpenseForm({
    expense_date: getToday(),
    category: "other",
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      expense_name: "",
      amount: undefined,
      expense_date: getToday(),
      category: "other",
      note: "",
    });
  }, [isOpen, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      note: values.note?.trim() || undefined,
    });
    onClose();
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      description="Record a new gym expense for reporting."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} loading={isSubmitting}>
            Save Expense
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Expense Name"
          placeholder="Enter expense name"
          error={errors.expense_name?.message}
          {...register("expense_name")}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Amount (AFN)"
            type="number"
            min="0.01"
            step="0.01"
            error={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />
          <Input
            label="Expense Date"
            type="date"
            error={errors.expense_date?.message}
            {...register("expense_date")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Category</label>
          <select
            {...register("category")}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="salary">Salary</option>
            <option value="equipment">Equipment</option>
            <option value="maintenance">Maintenance</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
          {errors.category?.message ? (
            <p className="mt-1.5 text-sm text-error">{errors.category.message}</p>
          ) : null}
        </div>
        <Textarea
          label="Note (Optional)"
          rows={3}
          error={errors.note?.message}
          {...register("note")}
        />
      </form>
    </Modal>
  );
}

