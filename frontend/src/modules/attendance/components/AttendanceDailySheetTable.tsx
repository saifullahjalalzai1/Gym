import { Edit3 } from "lucide-react";

import { Button, Card, CardContent } from "@/components/ui";
import type {
  AttendanceBulkEntry,
  AttendanceDailySheetRow,
  AttendanceStatus,
} from "../types/attendance";

interface AttendanceDailySheetTableProps {
  rows: AttendanceDailySheetRow[];
  entryState: Record<number, AttendanceBulkEntry>;
  loading?: boolean;
  errorMessage?: string | null;
  selectedDate?: string;
  onStatusChange: (staffId: number, status: AttendanceStatus) => void;
  onNoteChange: (staffId: number, note: string) => void;
  onEditRecord: (row: AttendanceDailySheetRow) => void;
}

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "leave", label: "Leave" },
];

export default function AttendanceDailySheetTable({
  rows,
  entryState,
  loading = false,
  errorMessage = null,
  selectedDate,
  onStatusChange,
  onNoteChange,
  onEditRecord,
}: AttendanceDailySheetTableProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="text-base font-semibold text-text-primary">Daily Attendance Sheet</h3>

        {loading ? (
          <div className="rounded-lg border border-border p-6 text-sm text-text-secondary">
            Loading attendance sheet...
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-error bg-error-soft p-6 text-sm text-error">
            {errorMessage}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-sm text-text-secondary">
            No staff found for {selectedDate ?? "selected date"}. This usually means no active/on-leave staff were hired by that date.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Staff</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Position</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Note</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.staff_id} className="border-t border-border">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-text-primary">{row.staff_name}</div>
                      <div className="text-xs text-text-secondary">{row.staff_code}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-text-secondary">{row.position}</td>
                    <td className="px-4 py-3">
                      <select
                        value={entryState[row.staff_id]?.status ?? "absent"}
                        onChange={(event) =>
                          onStatusChange(
                            row.staff_id,
                            event.target.value as AttendanceStatus
                          )
                        }
                        className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={entryState[row.staff_id]?.note ?? ""}
                        onChange={(event) => onNoteChange(row.staff_id, event.target.value)}
                        placeholder="Optional note"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit3 className="h-4 w-4" />}
                        onClick={() => onEditRecord(row)}
                        disabled={!row.record_id}
                      >
                        Edit Record
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
