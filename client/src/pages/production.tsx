import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Activity, Thermometer, Droplets, Gauge, Clock, Disc3 } from "lucide-react";

const CYAN = "#00e5ff";
const GREEN = "#00e676";
const AMBER = "#ff9100";
const RED = "#ff1744";

function StatusDot({ status }: { status: "nominal" | "watch" | "alert" }) {
  const cls = status === "nominal" ? "bg-[#00e676] pulse-green" : status === "watch" ? "bg-[#ff9100] pulse-amber" : "bg-[#ff1744] pulse-red";
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}

function SensorCard({ label, value, unit, status, icon: Icon }: {
  label: string; value: string; unit: string; status: "nominal" | "watch" | "alert"; icon: any;
}) {
  const borderColor = status === "nominal" ? "rgba(0,230,118,0.15)" : status === "watch" ? "rgba(255,145,0,0.15)" : "rgba(255,23,68,0.15)";
  return (
    <div className="glow-card rounded-lg p-4" style={{ borderColor }} data-testid={`sensor-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-white/30" />
        <StatusDot status={status} />
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums text-white/90">{value}<span className="text-sm text-white/40 ml-1">{unit}</span></div>
      <div className="text-[10px] text-white/40 mt-1">{label}</div>
      <div className="text-[10px] mt-1">
        <span className={status === "nominal" ? "text-[#00e676]/60" : status === "watch" ? "text-[#ff9100]/60" : "text-[#ff1744]/60"}>
          {status === "nominal" ? "NOMINAL" : status === "watch" ? "WATCH" : "ALERT"}
        </span>
      </div>
    </div>
  );
}

export default function Production() {
  const { data: runs = [] } = useQuery({
    queryKey: ["/api/production-runs"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/production-runs"); return res.json(); },
  });

  const currentRun = runs.find((r: any) => !r.endTime) || runs[0];
  const params = (currentRun?.pressParameters as any) || {};

  // Today's scheduled jobs
  const todayJobs = [
    { id: "ONX-2026-003", client: "Puscifer Entertainment", qty: 1000, progress: 84.7, startTime: "08:00", endTime: "16:00" },
    { id: "ONX-2026-005", client: "Insomniac Music Group", qty: 750, progress: 0, startTime: "16:30", endTime: "23:00" },
  ];

  return (
    <div data-testid="production-page" className="space-y-6">
      <h1 className="font-display font-bold text-lg text-white/90">Press Control — Pheenix Alpha AD12</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Panel: Current Job */}
        <div className="glow-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Disc3 className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="font-display font-semibold text-sm text-white/70 tracking-wide uppercase">Current Job</h2>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">IN PRODUCTION</span>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Job ID</span>
              <span className="text-sm font-mono text-[#00e5ff] tabular-nums" data-testid="current-job-id">{currentRun?.jobId || "ONX-2026-003"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Client</span>
              <span className="text-sm text-white/80">Puscifer Entertainment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Format</span>
              <span className="text-sm text-white/80">12" / 180g / Clear w/ Red Splatter</span>
            </div>
          </div>

          {/* Press Parameters */}
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Press Parameters</h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff]/60 border border-[#00e5ff]/10">Rule-Based</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              ["H1 Heating", `${params.heating1Time || 3.0}s`],
              ["H2 Heating", `${params.heating2Time || 6.5}s`],
              ["Cooling", `${params.coolingTime || 9.0}s`],
              ["Opening Delay", `${params.openingDelay || 1.0}s`],
              ["Ram Pressure", `${params.ramPressure || 175} bar`],
              ["Ram Pos Heat Stop", `${params.ramPosHeatingStop || 99} mm`],
              ["Steam Pressure", `${params.steamPressure || 65} PSI`],
              ["Hydraulic Pressure", `${params.hydraulicPressure || 2200} PSI`],
              ["Cake Weight", `${params.cakeWeight || 182}g`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-white/40">{label}</span>
                <span className="font-mono tabular-nums text-white/70">{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 mb-2 text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Extruder Temps</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { zone: "Bottom", temp: params.extruderBottom || 135 },
              { zone: "Middle", temp: params.extruderMiddle || 135 },
              { zone: "Top", temp: params.extruderTop || 135 },
              { zone: "Nozzle", temp: params.extruderNozzle || 125 },
            ].map((z) => (
              <div key={z.zone} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="font-mono text-lg font-bold tabular-nums text-[#ff9100]">{z.temp}°</div>
                <div className="text-[9px] text-white/30 mt-0.5">{z.zone}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-[10px] text-white/30">
            Ext. Time: <span className="font-mono text-white/50">{params.extruderExtendedTime || 4.2}s</span>
            <span className="mx-2">·</span>
            Regrind: <span className="font-mono text-white/50">N/A (color vinyl)</span>
          </div>
        </div>

        {/* Right Panel: Live Monitoring */}
        <div className="space-y-4">
          {/* Cycle Counter */}
          <div className="glow-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm text-white/70 tracking-wide uppercase">Live Monitoring</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00e676] pulse-green" />
                <span className="text-[10px] text-[#00e676]/70">RUNNING</span>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className="font-mono text-5xl font-bold tabular-nums text-[#00e5ff]" data-testid="cycle-count">
                {currentRun?.cycleCount || 847}
              </div>
              <div className="text-sm text-white/30 mt-1">
                of <span className="font-mono tabular-nums">1,000</span> target
              </div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${((currentRun?.cycleCount || 847) / 1000) * 100}%`,
                    background: `linear-gradient(90deg, ${CYAN}, ${GREEN})`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-mono text-lg font-bold tabular-nums text-white/80" data-testid="production-rate">138</div>
                <div className="text-[10px] text-white/30">units/hr</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold tabular-nums text-[#ff9100]" data-testid="reject-count">
                  {currentRun?.rejectCount || 12}
                </div>
                <div className="text-[10px] text-white/30">rejects ({((currentRun?.rejectCount || 12) / (currentRun?.cycleCount || 847) * 100).toFixed(1)}%)</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold tabular-nums text-white/80">8h 49m</div>
                <div className="text-[10px] text-white/30">elapsed</div>
              </div>
            </div>
          </div>

          {/* Environmental Readings */}
          <div className="grid grid-cols-3 gap-3">
            <SensorCard label="Ambient Temp" value={String(currentRun?.ambientTemp || 72.4)} unit="°F" status="nominal" icon={Thermometer} />
            <SensorCard label="Humidity" value={String(currentRun?.humidity || 44)} unit="%" status="nominal" icon={Droplets} />
            <SensorCard label="Chiller In" value={String(currentRun?.chillerTempIn || 54)} unit="°F" status="nominal" icon={Thermometer} />
            <SensorCard label="Chiller Out" value={String(currentRun?.chillerTempOut || 62)} unit="°F" status="nominal" icon={Thermometer} />
            <SensorCard label="Hydraulic Oil" value={String(currentRun?.hydraulicOilTemp || 118)} unit="°F" status="nominal" icon={Gauge} />
            <SensorCard label="Run Time" value="8h 49m" unit="" status="nominal" icon={Clock} />
          </div>
        </div>
      </div>

      {/* Bottom: Production Timeline */}
      <div className="glow-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-sm text-white/70 mb-4">Today's Production Schedule</h2>
        <div className="relative">
          {/* Timeline grid */}
          <div className="flex items-center gap-0 mb-2 text-[9px] text-white/20 font-mono">
            {Array.from({ length: 17 }, (_, i) => (
              <div key={i} className="flex-1 text-center">{(7 + i).toString().padStart(2, "0")}:00</div>
            ))}
          </div>
          <div className="space-y-2">
            {todayJobs.map((job) => {
              const startHour = parseInt(job.startTime.split(":")[0]);
              const endHour = parseInt(job.endTime.split(":")[0]);
              const totalHours = 17;
              const leftPct = ((startHour - 7) / totalHours) * 100;
              const widthPct = ((endHour - startHour) / totalHours) * 100;
              const progressPct = job.progress;
              return (
                <div key={job.id} className="relative h-10 bg-white/[0.02] rounded-lg overflow-hidden">
                  <div
                    className="absolute top-0 h-full rounded-lg border border-white/[0.08] flex items-center px-3"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: progressPct > 0 ? `linear-gradient(90deg, rgba(0,229,255,0.15) ${progressPct}%, rgba(255,255,255,0.03) ${progressPct}%)` : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="text-[10px] font-mono text-white/60 truncate">
                      {job.id} — {job.client}
                      {progressPct > 0 && <span className="text-[#00e5ff] ml-2">{progressPct}%</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
