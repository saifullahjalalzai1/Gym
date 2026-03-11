import { useEffect, useMemo, useState } from "react";

import type {
  AttendanceBulkEntry,
  AttendanceDailySheetRow,
  AttendanceStatus,
} from "../types/attendance";

type EntryState = Record<number, AttendanceBulkEntry>;

const rowsToEntryState = (rows: AttendanceDailySheetRow[]): EntryState => {
  const next: EntryState = {};
  for (const row of rows) {
    next[row.staff_id] = {
      staff_id: row.staff_id,
      status: row.status,
      note: row.note ?? "",
    };
  }
  return next;
};

export const useAttendanceDailySheetForm = (
  rows: AttendanceDailySheetRow[],
  attendanceDate: string
) => {
  const [entryState, setEntryState] = useState<EntryState>(() => rowsToEntryState(rows));

  useEffect(() => {
    setEntryState(rowsToEntryState(rows));
  }, [rows, attendanceDate]);

  const updateStatus = (staffId: number, status: AttendanceStatus) => {
    setEntryState((prev) => ({
      ...prev,
      [staffId]: {
        staff_id: staffId,
        status,
        note: prev[staffId]?.note ?? "",
      },
    }));
  };

  const updateNote = (staffId: number, note: string) => {
    setEntryState((prev) => ({
      ...prev,
      [staffId]: {
        staff_id: staffId,
        status: prev[staffId]?.status ?? "absent",
        note,
      },
    }));
  };

  const entries = useMemo(
    () =>
      Object.values(entryState).map((entry) => ({
        staff_id: entry.staff_id,
        status: entry.status,
        note: entry.note?.trim() || undefined,
      })),
    [entryState]
  );

  return {
    entryState,
    entries,
    updateStatus,
    updateNote,
  };
};

