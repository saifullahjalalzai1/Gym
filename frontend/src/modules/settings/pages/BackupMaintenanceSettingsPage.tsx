import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";

import { BackupJobsTable } from "../components";
import {
  useBackupSchedule,
  useBackups,
  useRestoreBackup,
  useRunManualBackup,
  useSystemLogs,
  useUpdateBackupSchedule,
} from "../queries";
import type { BackupScheduleSettings } from "../types";

const defaultSchedule: BackupScheduleSettings = {
  enabled: false,
  frequency: "daily",
  run_time: "02:00",
  weekday: 0,
  retention_count: 7,
  backup_directory: "",
};

export default function BackupMaintenanceSettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BackupScheduleSettings>(defaultSchedule);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const scheduleQuery = useBackupSchedule();
  const backupsQuery = useBackups({ page: 1, page_size: 25 });
  const systemLogsQuery = useSystemLogs({ limit: 20 });

  const runManualMutation = useRunManualBackup();
  const updateScheduleMutation = useUpdateBackupSchedule();
  const restoreMutation = useRestoreBackup();

  useEffect(() => {
    if (!scheduleQuery.data) return;
    setForm({
      ...scheduleQuery.data,
      run_time: (scheduleQuery.data.run_time || "02:00").slice(0, 5),
    });
  }, [scheduleQuery.data]);

  const onSaveSchedule = (event: React.FormEvent) => {
    event.preventDefault();
    updateScheduleMutation.mutate(form);
  };

  const onRestore = (id: number) => {
    const confirmed = window.confirm(
      "Restore this backup? This replaces the current SQLite database."
    );
    if (!confirmed) return;

    setRestoringId(id);
    restoreMutation.mutate(id, {
      onSettled: () => setRestoringId(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Maintenance"
        subtitle="Run manual backups, configure schedule, restore data, and monitor system logs."
        actions={[
          {
            label: "Back",
            variant: "outline",
            onClick: () => navigate("/settings"),
          },
        ]}
      />

      <Card>
        <CardHeader
          title="Manual Backup"
          subtitle="Phase 1 uses SQLite file backup/restore."
        />
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            Run an immediate backup job and store it in the configured backup directory.
          </p>
          <Button
            type="button"
            onClick={() => runManualMutation.mutate()}
            loading={runManualMutation.isPending}
          >
            Run Manual Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Backup Schedule" />
        <CardContent>
          <form className="space-y-4" onSubmit={onSaveSchedule}>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              Enable Scheduled Backups
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Frequency</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      frequency: e.target.value as BackupScheduleSettings["frequency"],
                    }))
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <Input
                label="Run Time"
                type="time"
                value={form.run_time}
                onChange={(e) => setForm((prev) => ({ ...prev, run_time: e.target.value }))}
              />

              <Input
                label="Weekday (0-6)"
                type="number"
                value={String(form.weekday)}
                onChange={(e) => setForm((prev) => ({ ...prev, weekday: Number(e.target.value || 0) }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Retention Count"
                type="number"
                value={String(form.retention_count)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, retention_count: Number(e.target.value || 1) }))
                }
              />
              <Input
                label="Backup Directory"
                value={form.backup_directory}
                onChange={(e) => setForm((prev) => ({ ...prev, backup_directory: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={updateScheduleMutation.isPending || scheduleQuery.isLoading}>
                Save Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <BackupJobsTable
        jobs={backupsQuery.data?.results ?? []}
        restoringId={restoringId}
        onRestore={onRestore}
      />

      <Card>
        <CardHeader title="System Logs" subtitle="Latest application activity log entries." />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Table</th>
                  <th className="py-2 pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(systemLogsQuery.data?.results ?? []).map((log) => (
                  <tr key={log.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{log.user_name}</td>
                    <td className="py-2 pr-4 capitalize">{log.action}</td>
                    <td className="py-2 pr-4">{log.table_name || "-"}</td>
                    <td className="py-2 pr-4">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {(systemLogsQuery.data?.results ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-text-secondary">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
