import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PressLog } from "@shared/schema";
import {
  ClipboardList, ChevronDown, ChevronUp, Clock, AlertTriangle, Wrench,
  Plus, Disc3, Thermometer, Droplets, Gauge, Weight, Tag, ArrowRightLeft,
  Activity, FileText, X, CheckCircle2, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─── Helpers ─── */
function fmtTime(t: string | null | undefined) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${ampm}`;
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

function fmtDuration(mins: number | null | undefined) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function yieldRate(good: number, total: number) {
  if (total === 0) return 0;
  return ((good / total) * 100);
}

/* ─── Expandable Log Row ─── */
function LogRow({ log }: { log: PressLog }) {
  const [expanded, setExpanded] = useState(false);
  const rate = yieldRate(log.goodCount ?? 0, log.totalCycles ?? 0);
  const isLive = !log.pressStopTime;
  const stoppages = (log.stoppages as any[] | null) ?? [];
  const rejectReasons = (log.rejectReasons as any[] | null) ?? [];
  const maintenanceFlags = (log.maintenanceFlags as any[] | null) ?? [];

  return (
    <div className="glow-card border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        data-testid={`log-row-${log.id}`}
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        {/* Mobile layout: stacked */}
        <div className="flex items-start justify-between gap-2 md:hidden">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/90">{fmtDate(log.shiftDate)}</span>
              {isLive && <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse flex-shrink-0" />}
            </div>
            <div className="text-[11px] text-white/40 mt-0.5">
              {fmtTime(log.pressStartTime)} – {isLive ? (
                <span className="text-[#00e676] font-medium">LIVE</span>
              ) : fmtTime(log.pressStopTime)}
            </div>
            <div className="text-xs font-mono text-[#00e5ff] mt-1">{log.jobId}</div>
            <div className="text-[11px] text-white/50 truncate">{log.clientName}</div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-xs tabular-nums font-semibold border-0 ${
                rate >= 98 ? "bg-[#00e676]/10 text-[#00e676]" :
                rate >= 95 ? "bg-[#ff9100]/10 text-[#ff9100]" :
                "bg-[#ff1744]/10 text-[#ff1744]"
              }`}
            >
              {rate.toFixed(1)}%
            </Badge>
            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span className="text-[#00e676]">{log.goodCount ?? 0}</span>
              <span className="text-white/20">/</span>
              <span className="text-[#ff1744]">{log.rejectCount ?? 0}</span>
            </div>
            <div className="text-white/30">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Desktop layout: horizontal */}
        <div className="hidden md:flex items-center gap-4">
          {/* Date + status */}
          <div className="min-w-[120px]">
            <div className="text-sm font-semibold text-white/90">{fmtDate(log.shiftDate)}</div>
            <div className="text-[11px] text-white/40 mt-0.5">
              {fmtTime(log.pressStartTime)} – {isLive ? (
                <span className="text-[#00e676] font-medium">LIVE</span>
              ) : fmtTime(log.pressStopTime)}
            </div>
          </div>

          {/* Job */}
          <div className="min-w-[140px]">
            <div className="text-xs font-mono text-[#00e5ff]">{log.jobId}</div>
            <div className="text-[11px] text-white/50 truncate max-w-[140px]">{log.clientName}</div>
          </div>

          {/* Vinyl info */}
          <div className="min-w-[110px] hidden lg:block">
            <div className="text-xs text-white/70">{log.format} · {log.weight}</div>
            <div className="text-[11px] text-white/40 truncate max-w-[110px]">{log.vinylColor}</div>
          </div>

          {/* Production counts */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <div className="text-sm font-semibold text-[#00e676] tabular-nums">{log.goodCount ?? 0}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Good</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#ff1744] tabular-nums">{log.rejectCount ?? 0}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Reject</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-white/70 tabular-nums">{log.totalCycles ?? 0}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Cycles</div>
            </div>
          </div>

          {/* Yield badge */}
          <div className="min-w-[60px] text-right">
            <Badge
              variant="outline"
              className={`text-xs tabular-nums font-semibold border-0 ${
                rate >= 98 ? "bg-[#00e676]/10 text-[#00e676]" :
                rate >= 95 ? "bg-[#ff9100]/10 text-[#ff9100]" :
                "bg-[#ff1744]/10 text-[#ff1744]"
              }`}
            >
              {rate.toFixed(1)}%
            </Badge>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-2 min-w-[50px] justify-end">
            {maintenanceFlags.length > 0 && (
              <Wrench className="w-3.5 h-3.5 text-[#ff9100]" />
            )}
            {(log.totalDowntimeMinutes ?? 0) > 20 && (
              <AlertTriangle className="w-3.5 h-3.5 text-[#ffd740]" />
            )}
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            )}
          </div>

          {/* Expand */}
          <div className="text-white/30">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-5 space-y-5 bg-[#0d0e14]/60">
          {/* Grid: Press Settings | Environmental | Vinyl Usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Press Settings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                <Gauge className="w-3.5 h-3.5" /> AD12 Press Settings
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <DetailItem label="Extruder Temp" value={log.extruderTemp ? `${log.extruderTemp}°F` : "—"} />
                <DetailItem label="Mould Top" value={log.mouldTempTop ? `${log.mouldTempTop}°F` : "—"} />
                <DetailItem label="Mould Bottom" value={log.mouldTempBottom ? `${log.mouldTempBottom}°F` : "—"} />
                <DetailItem label="Clamp PSI" value={log.clampPressurePSI ? `${log.clampPressurePSI}` : "—"} />
                <DetailItem label="Clamp Time" value={log.clampTimeSec ? `${log.clampTimeSec}s` : "—"} />
                <DetailItem label="Cooling Time" value={log.coolingTimeSec ? `${log.coolingTimeSec}s` : "—"} />
                <DetailItem label="Cycle Time" value={log.cycleTimeSec ? `${log.cycleTimeSec}s` : "—"} />
                <DetailItem label="Ext. RPM" value={log.extruderRPM ? `${log.extruderRPM}` : "—"} />
                <DetailItem label="Biscuit Wt" value={log.biscuitWeightGrams ? `${log.biscuitWeightGrams}g` : "—"} />
                <DetailItem label="Trimmer" value={log.trimmerSetting || "—"} />
              </div>
            </div>

            {/* Environmental */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                <Thermometer className="w-3.5 h-3.5" /> Environmental
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <DetailItem label="Ambient" value={log.ambientTempF ? `${log.ambientTempF}°F` : "—"} />
                <DetailItem label="Humidity" value={log.humidityPercent ? `${log.humidityPercent}%` : "—"} />
                <DetailItem label="Chiller In" value={log.chillerTempIn ? `${log.chillerTempIn}°F` : "—"} />
                <DetailItem label="Chiller Out" value={log.chillerTempOut ? `${log.chillerTempOut}°F` : "—"} />
                <DetailItem label="Hyd. Oil" value={log.hydraulicOilTempF ? `${log.hydraulicOilTempF}°F` : "—"} />
                <DetailItem label="Water PSI" value={log.waterPressurePSI ? `${log.waterPressurePSI}` : "—"} />
                <DetailItem label="Steam PSI" value={log.steamPressurePSI ? `${log.steamPressurePSI}` : "—"} />
              </div>
            </div>

            {/* Vinyl & Stampers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                <Disc3 className="w-3.5 h-3.5" /> Vinyl & Stampers
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <DetailItem label="Virgin Used" value={log.vinylUsedLbs ? `${log.vinylUsedLbs} lbs` : "—"} />
                <DetailItem label="Regrind Used" value={log.regrindUsedLbs ? `${log.regrindUsedLbs} lbs` : "0 lbs"} />
                <DetailItem label="Regrind %" value={log.regrindPercent || "0%"} />
                <DetailItem label="Labels Used" value={log.labelsUsed ? `${log.labelsUsed}` : "—"} />
                <DetailItem label="Stamper A" value={log.stamperIdA || "—"} />
                <DetailItem label="Stamper B" value={log.stamperIdB || "—"} />
                <DetailItem label="Condition" value={
                  <span className={
                    log.stamperCondition === "good" ? "text-[#00e676]" :
                    log.stamperCondition === "wear-showing" ? "text-[#ff9100]" :
                    "text-[#ff1744]"
                  }>{log.stamperCondition || "—"}</span>
                } />
                {log.colorBlend && <DetailItem label="Color Blend" value={log.colorBlend} />}
              </div>
            </div>
          </div>

          {/* Stoppages */}
          {stoppages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                <Clock className="w-3.5 h-3.5" /> Stoppages ({log.totalDowntimeMinutes ?? 0} min total)
              </div>
              <div className="space-y-1.5">
                {stoppages.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                    <span className="text-white/40 tabular-nums font-mono min-w-[50px]">{s.time}</span>
                    <span className="text-[#ffd740] tabular-nums min-w-[40px]">{s.durationMin}m</span>
                    <span className="text-white/60 flex-1">{s.reason}</span>
                    {s.code && <span className="text-white/20 font-mono text-[10px]">{s.code}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reject Reasons & Maintenance Flags side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rejectReasons.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Reject Breakdown
                </div>
                <div className="space-y-1">
                  {rejectReasons.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                      <span className="text-white/60">{r.reason}</span>
                      <span className="text-[#ff1744] tabular-nums font-semibold">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {maintenanceFlags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                  <Wrench className="w-3.5 h-3.5" /> Maintenance Flags
                </div>
                <div className="space-y-1">
                  {maintenanceFlags.map((f: any, i: number) => (
                    <div key={i} className="text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          f.severity === "high" ? "bg-[#ff1744]" :
                          f.severity === "medium" ? "bg-[#ff9100]" :
                          "bg-[#ffd740]"
                        }`} />
                        <span className="text-white/70 font-medium">{f.component}</span>
                      </div>
                      <div className="text-white/40 mt-1 ml-3.5">{f.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.shiftNotes && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                  <FileText className="w-3.5 h-3.5" /> Shift Notes
                </div>
                <div className="text-xs text-white/50 leading-relaxed bg-white/[0.02] rounded-lg px-3 py-2">
                  {log.shiftNotes}
                </div>
              </div>
            )}
            {log.qualityNotes && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Quality Notes
                </div>
                <div className="text-xs text-white/50 leading-relaxed bg-white/[0.02] rounded-lg px-3 py-2">
                  {log.qualityNotes}
                </div>
              </div>
            )}
          </div>
          {log.nextShiftHandoff && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Handoff to Next Shift
              </div>
              <div className="text-xs text-[#00e5ff]/70 leading-relaxed bg-[#00e5ff]/[0.04] rounded-lg px-3 py-2 border border-[#00e5ff]/10">
                {log.nextShiftHandoff}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-white/30">{label}</span>
      <div className="text-white/70 mt-0.5">{value}</div>
    </div>
  );
}

/* ─── New Shift Form (Slide-out Panel) ─── */
function NewShiftPanel({ open, onClose, jobs }: { open: boolean; onClose: () => void; jobs: any[] }) {
  const [form, setForm] = useState({
    shiftDate: new Date().toISOString().slice(0, 10),
    operatorName: "Press Op 1",
    shiftNumber: 1,
    pressStartTime: "",
    pressStopTime: "",
    jobId: "",
    clientName: "",
    format: '12"',
    weight: "180g",
    vinylColor: "Black",
    colorBlend: "",
    regrindPercent: "0%",
    goodCount: 0,
    rejectCount: 0,
    testPressCount: 0,
    totalCycles: 0,
    extruderTemp: 330,
    mouldTempTop: 305,
    mouldTempBottom: 300,
    clampPressurePSI: 2200,
    clampTimeSec: 6.5,
    coolingTimeSec: 9.0,
    cycleTimeSec: 22.0,
    trimmerSetting: "",
    extruderRPM: 27,
    biscuitWeightGrams: 180,
    ambientTempF: 72,
    humidityPercent: 44,
    chillerTempIn: 54,
    chillerTempOut: 62,
    hydraulicOilTempF: 118,
    waterPressurePSI: 42,
    steamPressurePSI: 65,
    vinylUsedLbs: 0,
    regrindUsedLbs: 0,
    labelsUsed: 0,
    totalDowntimeMinutes: 0,
    qualityNotes: "",
    shiftNotes: "",
    nextShiftHandoff: "",
    stamperIdA: "",
    stamperIdB: "",
    stamperCondition: "good",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/press-logs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/press-logs"] });
      onClose();
    },
  });

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find((j: any) => j.jobId === jobId);
    if (job) {
      setForm(f => ({
        ...f,
        jobId: job.jobId,
        clientName: job.clientName,
        format: job.format,
        weight: job.weight,
        vinylColor: job.vinylColor,
      }));
    }
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      pressStopTime: form.pressStopTime || null,
      totalRuntimeMinutes: form.pressStopTime && form.pressStartTime ?
        Math.round((new Date(`2026-01-01T${form.pressStopTime}`).getTime() - new Date(`2026-01-01T${form.pressStartTime}`).getTime()) / 60000) : null,
      colorBlend: form.colorBlend || null,
      stoppages: [],
      rejectReasons: [],
      maintenanceFlags: [],
    };
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0c0d12] border-l border-white/[0.06] h-full overflow-y-auto">
        <div className="sticky top-0 bg-[#0c0d12]/95 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-semibold text-white/90 text-sm">New Shift Log</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" data-testid="close-panel">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Shift Info */}
          <FormSection title="Shift Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Date" type="date" value={form.shiftDate} onChange={v => setForm(f => ({ ...f, shiftDate: v }))} />
              <FormField label="Shift #" type="number" value={form.shiftNumber} onChange={v => setForm(f => ({ ...f, shiftNumber: parseInt(v) || 1 }))} />
              <FormField label="Start Time" type="time" value={form.pressStartTime} onChange={v => setForm(f => ({ ...f, pressStartTime: v }))} />
              <FormField label="Stop Time" type="time" value={form.pressStopTime} onChange={v => setForm(f => ({ ...f, pressStopTime: v }))} placeholder="Leave blank if still running" />
            </div>
          </FormSection>

          {/* Job Info */}
          <FormSection title="Job Info">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1 block">Job</label>
                <select
                  data-testid="job-select"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#00e5ff]/30"
                  value={form.jobId}
                  onChange={e => handleJobSelect(e.target.value)}
                >
                  <option value="">Select job...</option>
                  {jobs.filter((j: any) => !["delivered", "closed"].includes(j.status)).map((j: any) => (
                    <option key={j.jobId} value={j.jobId}>{j.jobId} — {j.clientName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Format" value={form.format} onChange={v => setForm(f => ({ ...f, format: v }))} />
                <FormField label="Weight" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} />
                <FormField label="Vinyl Color" value={form.vinylColor} onChange={v => setForm(f => ({ ...f, vinylColor: v }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Color Blend" value={form.colorBlend} onChange={v => setForm(f => ({ ...f, colorBlend: v }))} placeholder="Optional" />
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1 block">Regrind %</label>
                  <select
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#00e5ff]/30"
                    value={form.regrindPercent}
                    onChange={e => setForm(f => ({ ...f, regrindPercent: e.target.value }))}
                  >
                    <option value="0%">0%</option>
                    <option value="25%">25%</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                  </select>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Production Counts */}
          <FormSection title="Production Counts">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Good Count" type="number" value={form.goodCount} onChange={v => setForm(f => ({ ...f, goodCount: parseInt(v) || 0 }))} />
              <FormField label="Reject Count" type="number" value={form.rejectCount} onChange={v => setForm(f => ({ ...f, rejectCount: parseInt(v) || 0 }))} />
              <FormField label="Test Presses" type="number" value={form.testPressCount} onChange={v => setForm(f => ({ ...f, testPressCount: parseInt(v) || 0 }))} />
              <FormField label="Total Cycles" type="number" value={form.totalCycles} onChange={v => setForm(f => ({ ...f, totalCycles: parseInt(v) || 0 }))} />
            </div>
          </FormSection>

          {/* AD12 Settings */}
          <FormSection title="AD12 Press Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Extruder Temp (°F)" type="number" value={form.extruderTemp} onChange={v => setForm(f => ({ ...f, extruderTemp: parseFloat(v) || 0 }))} />
              <FormField label="Mould Top (°F)" type="number" value={form.mouldTempTop} onChange={v => setForm(f => ({ ...f, mouldTempTop: parseFloat(v) || 0 }))} />
              <FormField label="Mould Bottom (°F)" type="number" value={form.mouldTempBottom} onChange={v => setForm(f => ({ ...f, mouldTempBottom: parseFloat(v) || 0 }))} />
              <FormField label="Clamp PSI" type="number" value={form.clampPressurePSI} onChange={v => setForm(f => ({ ...f, clampPressurePSI: parseFloat(v) || 0 }))} />
              <FormField label="Clamp Time (s)" type="number" value={form.clampTimeSec} onChange={v => setForm(f => ({ ...f, clampTimeSec: parseFloat(v) || 0 }))} />
              <FormField label="Cooling Time (s)" type="number" value={form.coolingTimeSec} onChange={v => setForm(f => ({ ...f, coolingTimeSec: parseFloat(v) || 0 }))} />
              <FormField label="Cycle Time (s)" type="number" value={form.cycleTimeSec} onChange={v => setForm(f => ({ ...f, cycleTimeSec: parseFloat(v) || 0 }))} />
              <FormField label="Extruder RPM" type="number" value={form.extruderRPM} onChange={v => setForm(f => ({ ...f, extruderRPM: parseFloat(v) || 0 }))} />
              <FormField label="Biscuit Wt (g)" type="number" value={form.biscuitWeightGrams} onChange={v => setForm(f => ({ ...f, biscuitWeightGrams: parseFloat(v) || 0 }))} />
              <FormField label="Trimmer Setting" value={form.trimmerSetting} onChange={v => setForm(f => ({ ...f, trimmerSetting: v }))} />
            </div>
          </FormSection>

          {/* Environmental */}
          <FormSection title="Environmental Readings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Ambient (°F)" type="number" value={form.ambientTempF} onChange={v => setForm(f => ({ ...f, ambientTempF: parseFloat(v) || 0 }))} />
              <FormField label="Humidity (%)" type="number" value={form.humidityPercent} onChange={v => setForm(f => ({ ...f, humidityPercent: parseFloat(v) || 0 }))} />
              <FormField label="Chiller In (°F)" type="number" value={form.chillerTempIn} onChange={v => setForm(f => ({ ...f, chillerTempIn: parseFloat(v) || 0 }))} />
              <FormField label="Chiller Out (°F)" type="number" value={form.chillerTempOut} onChange={v => setForm(f => ({ ...f, chillerTempOut: parseFloat(v) || 0 }))} />
              <FormField label="Hyd. Oil (°F)" type="number" value={form.hydraulicOilTempF} onChange={v => setForm(f => ({ ...f, hydraulicOilTempF: parseFloat(v) || 0 }))} />
              <FormField label="Water PSI" type="number" value={form.waterPressurePSI} onChange={v => setForm(f => ({ ...f, waterPressurePSI: parseFloat(v) || 0 }))} />
              <FormField label="Steam PSI" type="number" value={form.steamPressurePSI} onChange={v => setForm(f => ({ ...f, steamPressurePSI: parseFloat(v) || 0 }))} />
            </div>
          </FormSection>

          {/* Vinyl Usage */}
          <FormSection title="Vinyl Usage">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Virgin (lbs)" type="number" value={form.vinylUsedLbs} onChange={v => setForm(f => ({ ...f, vinylUsedLbs: parseFloat(v) || 0 }))} />
              <FormField label="Regrind (lbs)" type="number" value={form.regrindUsedLbs} onChange={v => setForm(f => ({ ...f, regrindUsedLbs: parseFloat(v) || 0 }))} />
              <FormField label="Labels Used" type="number" value={form.labelsUsed} onChange={v => setForm(f => ({ ...f, labelsUsed: parseInt(v) || 0 }))} />
            </div>
          </FormSection>

          {/* Stampers */}
          <FormSection title="Stamper Tracking">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Stamper A ID" value={form.stamperIdA} onChange={v => setForm(f => ({ ...f, stamperIdA: v }))} />
              <FormField label="Stamper B ID" value={form.stamperIdB} onChange={v => setForm(f => ({ ...f, stamperIdB: v }))} />
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1 block">Stamper Condition</label>
                <select
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#00e5ff]/30"
                  value={form.stamperCondition}
                  onChange={e => setForm(f => ({ ...f, stamperCondition: e.target.value }))}
                >
                  <option value="good">Good</option>
                  <option value="wear-showing">Wear Showing</option>
                  <option value="replace-soon">Replace Soon</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* Downtime */}
          <FormSection title="Downtime">
            <FormField label="Total Downtime (min)" type="number" value={form.totalDowntimeMinutes} onChange={v => setForm(f => ({ ...f, totalDowntimeMinutes: parseInt(v) || 0 }))} />
          </FormSection>

          {/* Notes */}
          <FormSection title="Notes">
            <div className="space-y-3">
              <FormTextarea label="Shift Notes" value={form.shiftNotes} onChange={v => setForm(f => ({ ...f, shiftNotes: v }))} placeholder="General observations, adjustments, key events..." />
              <FormTextarea label="Quality Notes" value={form.qualityNotes} onChange={v => setForm(f => ({ ...f, qualityNotes: v }))} placeholder="QC observations, test press results..." />
              <FormTextarea label="Handoff Notes" value={form.nextShiftHandoff} onChange={v => setForm(f => ({ ...f, nextShiftHandoff: v }))} placeholder="What the next operator needs to know..." />
            </div>
          </FormSection>

          {/* Submit */}
          <button
            data-testid="submit-log"
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.jobId || !form.pressStartTime}
            className="w-full py-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] font-semibold text-sm hover:bg-[#00e5ff]/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Logging Shift..." : "Log Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-[0.1em]">{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/30 tabular-nums"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/30 resize-none"
      />
    </div>
  );
}

/* ─── Main Page ─── */
export default function PressLogPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: logs = [], isLoading } = useQuery<PressLog[]>({
    queryKey: ["/api/press-logs"],
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
  });

  // Compute summary stats
  const totalGood = logs.reduce((s, l) => s + (l.goodCount ?? 0), 0);
  const totalRejects = logs.reduce((s, l) => s + (l.rejectCount ?? 0), 0);
  const totalCycles = logs.reduce((s, l) => s + (l.totalCycles ?? 0), 0);
  const totalDowntime = logs.reduce((s, l) => s + (l.totalDowntimeMinutes ?? 0), 0);
  const avgYield = totalCycles > 0 ? ((totalGood / totalCycles) * 100) : 0;
  const liveShift = logs.find(l => !l.pressStopTime);

  return (
    <div className="space-y-6" data-testid="press-log-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#69f0ae]/10 border border-[#69f0ae]/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#69f0ae]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white/90">Press Shift Log</h1>
            <p className="text-xs text-white/40">Pheenix Alpha AD12 — Daily Field Logs</p>
          </div>
        </div>
        <button
          data-testid="new-shift-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#69f0ae]/10 border border-[#69f0ae]/20 text-[#69f0ae] text-sm font-semibold hover:bg-[#69f0ae]/15 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Shift
        </button>
      </div>

      {/* Live shift banner */}
      {liveShift && (
        <div className="glow-card border border-[#00e676]/20 rounded-xl px-5 py-4 bg-[#00e676]/[0.03]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00e676]" />
            </span>
            <div>
              <span className="text-sm font-semibold text-[#00e676]">Active Shift</span>
              <span className="text-xs text-white/40 ml-3">
                {liveShift.jobId} — {liveShift.clientName} — Started {fmtTime(liveShift.pressStartTime)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs">
              <span className="text-white/50">{liveShift.goodCount ?? 0} good</span>
              <span className="text-[#ff1744]/70">{liveShift.rejectCount ?? 0} rejects</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total Good" value={totalGood.toLocaleString()} icon={<CheckCircle2 className="w-4 h-4" />} color="#00e676" />
        <KpiCard label="Total Rejects" value={totalRejects.toLocaleString()} icon={<XCircle className="w-4 h-4" />} color="#ff1744" />
        <KpiCard label="Avg Yield" value={`${avgYield.toFixed(1)}%`} icon={<Activity className="w-4 h-4" />} color="#00e5ff" />
        <KpiCard label="Total Cycles" value={totalCycles.toLocaleString()} icon={<Disc3 className="w-4 h-4" />} color="#ff9100" />
        <KpiCard label="Downtime" value={fmtDuration(totalDowntime)} icon={<Clock className="w-4 h-4" />} color="#ffd740" />
      </div>

      {/* Log history */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium px-1">
          Shift History ({logs.length} logs)
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">No shift logs recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>

      {/* New shift panel */}
      <NewShiftPanel open={showForm} onClose={() => setShowForm(false)} jobs={jobs} />
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="glow-card border border-white/[0.06] rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color }} className="opacity-60">{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
