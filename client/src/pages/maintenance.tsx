import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, Calendar, AlertTriangle, CheckCircle2, Clock, Package } from "lucide-react";
import type { MaintenanceTask, InventoryItem } from "@shared/schema";

const GREEN = "#00e676";
const AMBER = "#ff9100";
const RED = "#ff1744";
const CYAN = "#00e5ff";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; cls: string }> = {
    "on-track": { color: GREEN, label: "On Track", cls: "bg-[#00e676]/10 text-[#00e676] pulse-green" },
    "due-soon": { color: AMBER, label: "Due Soon", cls: "bg-[#ff9100]/10 text-[#ff9100] pulse-amber" },
    "overdue": { color: RED, label: "Overdue", cls: "bg-[#ff1744]/10 text-[#ff1744] pulse-red" },
  };
  const c = config[status] || config["on-track"];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

const FREQ_ORDER: Record<string, number> = { daily: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4 };

export default function Maintenance() {
  const { data: tasks = [] } = useQuery<MaintenanceTask[]>({
    queryKey: ["/api/maintenance"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/maintenance"); return res.json(); },
  });
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/inventory"); return res.json(); },
  });

  const spareParts = inventory.filter((i) => i.category === "spare-parts");
  const sortedTasks = [...tasks].sort((a, b) => (FREQ_ORDER[a.frequency] ?? 5) - (FREQ_ORDER[b.frequency] ?? 5));
  const overdue = tasks.filter(t => t.status === "overdue").length;
  const dueSoon = tasks.filter(t => t.status === "due-soon").length;

  // Maintenance log
  const recentLog = [
    { date: "2026-03-15", tech: "Billy", work: "Daily safety inspection — all systems nominal", type: "daily" },
    { date: "2026-03-14", tech: "Billy", work: "Daily safety inspection — noted slight steam hose wear", type: "daily" },
    { date: "2026-03-10", tech: "Billy", work: "Weekly hydraulic oil level check — level normal", type: "weekly" },
    { date: "2026-03-10", tech: "Billy", work: "Trimmer knife inspection — blade still sharp", type: "weekly" },
    { date: "2026-03-10", tech: "Moe", work: "Compressed air system check — filters clean", type: "weekly" },
    { date: "2026-02-15", tech: "Moe", work: "Monthly hydraulic oil visual inspection — clear, no particulate", type: "monthly" },
    { date: "2026-02-15", tech: "External", work: "Cake form sensor calibration — recalibrated +0.3mm offset", type: "monthly" },
  ];

  return (
    <div data-testid="maintenance-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-white/90">AD12 Maintenance</h1>
        <div className="flex items-center gap-4">
          {overdue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#ff1744]">
              <AlertTriangle className="w-4 h-4" />
              {overdue} overdue
            </div>
          )}
          {dueSoon > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#ff9100]">
              <Clock className="w-4 h-4" />
              {dueSoon} due soon
            </div>
          )}
        </div>
      </div>

      {/* Schedule Calendar */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Maintenance Schedule</h2>
        </div>
        {/* Desktop table */}
        <div className="hidden md:block space-y-1">
          <div className="grid grid-cols-7 gap-2 text-[10px] text-white/30 tracking-[0.1em] uppercase pb-2 border-b border-white/[0.06]">
            <span>Task</span>
            <span>Frequency</span>
            <span>Assigned To</span>
            <span>Last Completed</span>
            <span>Next Due</span>
            <span>Status</span>
            <span>Notes</span>
          </div>
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              data-testid={`maintenance-task-${task.id}`}
              className={`grid grid-cols-7 gap-2 text-xs py-2.5 px-1 rounded hover:bg-white/[0.02] ${
                task.status === "overdue" ? "bg-[#ff1744]/[0.03]" : ""
              }`}
            >
              <span className="text-white/70 font-medium">{task.title}</span>
              <span className="text-white/40 capitalize">{task.frequency}</span>
              <span className="text-white/40">{task.assignedTo}</span>
              <span className="font-mono tabular-nums text-white/40">{task.lastCompleted || "—"}</span>
              <span className="font-mono tabular-nums text-white/50">{task.nextDue}</span>
              <span><StatusBadge status={task.status} /></span>
              <span className="text-white/30 truncate text-[10px]">{task.notes || "—"}</span>
            </div>
          ))}
        </div>
        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              data-testid={`maintenance-task-${task.id}`}
              className={`rounded-lg p-3 border border-white/[0.06] ${
                task.status === "overdue" ? "bg-[#ff1744]/[0.03] border-[#ff1744]/20" : "bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/80 font-medium">{task.title}</span>
                <StatusBadge status={task.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div><span className="text-white/30">Frequency:</span> <span className="text-white/50 capitalize">{task.frequency}</span></div>
                <div><span className="text-white/30">Assigned:</span> <span className="text-white/50">{task.assignedTo}</span></div>
                <div><span className="text-white/30">Last:</span> <span className="text-white/50 font-mono tabular-nums">{task.lastCompleted || "—"}</span></div>
                <div><span className="text-white/30">Next:</span> <span className="text-white/50 font-mono tabular-nums">{task.nextDue}</span></div>
              </div>
              {task.notes && (
                <div className="mt-2 text-[10px] text-white/30 truncate">{task.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spare Parts */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-[#ff9100]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Critical Spare Parts Inventory</h2>
          <span className="ml-auto text-[10px] text-[#ff1744]/70 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {spareParts.filter(p => p.status === "critical").length} critical items unstocked
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="spare-parts-table">
            <thead>
              <tr className="text-left text-white/30 text-[10px] tracking-[0.1em] uppercase border-b border-white/[0.06]">
                <th className="pb-2 pr-4">Part</th>
                <th className="pb-2 pr-4 text-right">Stock</th>
                <th className="pb-2 pr-4 text-right">Reorder At</th>
                <th className="pb-2 pr-4">Vendor</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {spareParts.map((part) => (
                <tr key={part.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-2 pr-4 text-white/70">{part.itemName}</td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums text-white/50">
                    {part.currentStock} {part.unit}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums text-white/30">
                    {part.reorderThreshold} {part.unit}
                  </td>
                  <td className="py-2 pr-4 text-white/40">{part.preferredVendor}</td>
                  <td className="py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      part.status === "critical" ? "bg-[#ff1744]/10 text-[#ff1744]" :
                      part.status === "low" ? "bg-[#ff9100]/10 text-[#ff9100]" :
                      "bg-[#00e676]/10 text-[#00e676]"
                    }`}>
                      {part.status === "critical" ? "CRITICAL — NOT STOCKED" :
                       part.status === "low" ? "LOW" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Log */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Recent Maintenance Log</h2>
        </div>
        <div className="space-y-2">
          {recentLog.map((entry, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-white/[0.04] text-xs">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="font-mono tabular-nums text-white/40 w-24 flex-shrink-0">{entry.date}</span>
                <span className="text-white/50 w-16 flex-shrink-0">{entry.tech}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize sm:hidden ${
                  entry.type === "daily" ? "bg-white/[0.04] text-white/30" :
                  entry.type === "weekly" ? "bg-[#00e5ff]/5 text-[#00e5ff]/40" :
                  "bg-[#ff9100]/5 text-[#ff9100]/40"
                }`}>{entry.type}</span>
              </div>
              <span className="text-white/60 flex-1">{entry.work}</span>
              <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
                entry.type === "daily" ? "bg-white/[0.04] text-white/30" :
                entry.type === "weekly" ? "bg-[#00e5ff]/5 text-[#00e5ff]/40" :
                "bg-[#ff9100]/5 text-[#ff9100]/40"
              }`}>{entry.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
