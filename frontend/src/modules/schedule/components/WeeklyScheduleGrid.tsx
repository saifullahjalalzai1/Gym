import { Button } from "@/components/ui";
import type { WeeklyScheduleDay } from "../types/schedule";

interface WeeklyScheduleGridProps {
  days: WeeklyScheduleDay[];
  onEdit: (slotId: number) => void;
  onDelete: (slotId: number) => void;
  deletingSlotId?: number | null;
}

export default function WeeklyScheduleGrid({
  days,
  onEdit,
  onDelete,
  deletingSlotId = null,
}: WeeklyScheduleGridProps) {
  const totalSlots = days.reduce((count, day) => count + day.slots.length, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-background/70 px-3 py-2">
        <p className="text-sm font-medium text-text-primary">Weekly Slots</p>
        <p className="text-xs text-text-secondary">
          {totalSlots} {totalSlots === 1 ? "slot" : "slots"} in this week
        </p>
      </div>

      <div className="grid min-w-[1120px] gap-3 lg:grid-cols-7">
        {days.map((day) => (
          <section
            key={day.weekday}
            className="flex min-h-[340px] flex-col rounded-lg border border-border/70 bg-background/50 p-3"
          >
            <div className="mb-3 flex items-start justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{day.label}</h3>
                <p className="text-xs text-text-secondary">{day.date}</p>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                {day.slots.length}
              </span>
            </div>

            <div className="space-y-2">
              {day.slots.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface px-2 py-2 text-center text-xs text-text-secondary">
                  No classes
                </p>
              ) : (
                <div className="space-y-2">
                  {day.slots.map((slot) => (
                    <div key={slot.id} className="rounded-md border border-border bg-card p-2">
                      <p className="text-sm font-semibold text-text-primary">{slot.class_name}</p>
                      <p className="mt-1 inline-flex rounded bg-surface px-1.5 py-0.5 text-xs text-text-secondary">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">{slot.trainer_name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(slot.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={deletingSlotId === slot.id}
                          onClick={() => onDelete(slot.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
