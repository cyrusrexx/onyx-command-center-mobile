import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Thermometer, Droplets, Gauge, Radio } from "lucide-react";

const CYAN = "#00e5ff";
const GREEN = "#00e676";
const AMBER = "#ff9100";
const RED = "#ff1744";

type SensorConfig = {
  type: string; label: string; unit: string; icon: any; color: string;
  min: number; max: number; alertLow: number; alertHigh: number;
};

const SENSORS: SensorConfig[] = [
  { type: "ambient-temp", label: "Ambient Temp", unit: "°F", icon: Thermometer, color: CYAN, min: 60, max: 90, alertLow: 65, alertHigh: 85 },
  { type: "humidity", label: "Humidity", unit: "%", icon: Droplets, color: "#6366f1", min: 30, max: 65, alertLow: 40, alertHigh: 55 },
  { type: "chiller-in", label: "Chiller Inlet", unit: "°F", icon: Thermometer, color: "#3b82f6", min: 45, max: 65, alertLow: 50, alertHigh: 58 },
  { type: "chiller-out", label: "Chiller Outlet", unit: "°F", icon: Thermometer, color: "#8b5cf6", min: 50, max: 72, alertLow: 58, alertHigh: 66 },
  { type: "hydraulic-oil", label: "Hydraulic Oil", unit: "°F", icon: Gauge, color: AMBER, min: 90, max: 140, alertLow: 0, alertHigh: 122 },
  { type: "steam-pressure", label: "Steam Pressure", unit: "PSI", icon: Gauge, color: RED, min: 50, max: 80, alertLow: 55, alertHigh: 75 },
];

function getStatus(value: number, sensor: SensorConfig): "nominal" | "watch" | "alert" {
  if (value < sensor.alertLow || value > sensor.alertHigh) return "alert";
  const lowWatch = sensor.alertLow + (sensor.alertHigh - sensor.alertLow) * 0.1;
  const highWatch = sensor.alertHigh - (sensor.alertHigh - sensor.alertLow) * 0.1;
  if (value < lowWatch || value > highWatch) return "watch";
  return "nominal";
}

export default function Environment() {
  const [tab, setTab] = useState<"24hr" | "7day" | "30day">("24hr");
  
  const { data: readings = [] } = useQuery({
    queryKey: ["/api/sensors"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/sensors"); return res.json(); },
  });

  // Group readings by type
  const grouped: Record<string, any[]> = {};
  readings.forEach((r: any) => {
    if (!grouped[r.sensorType]) grouped[r.sensorType] = [];
    grouped[r.sensorType].push(r);
  });

  // Get latest value for each sensor
  const latestValues: Record<string, { value: number; readings: any[] }> = {};
  SENSORS.forEach((s) => {
    const sensorReadings = grouped[s.type] || [];
    const latest = sensorReadings[sensorReadings.length - 1];
    latestValues[s.type] = {
      value: latest?.value || 0,
      readings: sensorReadings,
    };
  });

  return (
    <div data-testid="environment-page" className="space-y-6">
      <h1 className="font-display font-bold text-lg text-white/90">Environmental Monitoring</h1>

      {/* Sensor Setup */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Sensor Network — Recommended Setup</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[#00e5ff] font-medium mb-1">Vaisala HMT331 × 2</div>
            <div className="text-white/40">Ambient temp & humidity — one near press, one at storage</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[#3b82f6] font-medium mb-1">Inline Water Temp × 2</div>
            <div className="text-white/40">Chiller loop — inlet & outlet monitoring</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[#ff9100] font-medium mb-1">AD12 Built-in Sensor</div>
            <div className="text-white/40">Hydraulic oil temp — read from control panel / Beckhoff PLC</div>
          </div>
        </div>
      </div>

      {/* Live Readings Grid */}
      <div className="grid grid-cols-3 gap-4">
        {SENSORS.map((sensor) => {
          const data = latestValues[sensor.type];
          const current = data?.value || 0;
          const sReadings = data?.readings || [];
          const status = getStatus(current, sensor);
          const dayReadings = sReadings.slice(-48);
          const minVal = dayReadings.length ? Math.min(...dayReadings.map((r: any) => r.value)) : 0;
          const maxVal = dayReadings.length ? Math.max(...dayReadings.map((r: any) => r.value)) : 0;
          const avgVal = dayReadings.length ? (dayReadings.reduce((s: number, r: any) => s + r.value, 0) / dayReadings.length) : 0;

          const sparkData = dayReadings.slice(-20).map((r: any, i: number) => ({ i, v: r.value }));
          const statusColor = status === "nominal" ? GREEN : status === "watch" ? AMBER : RED;
          const statusLabel = status === "nominal" ? "NOMINAL" : status === "watch" ? "WATCH" : "ALERT";
          const Icon = sensor.icon;

          return (
            <div
              key={sensor.type}
              className="glow-card rounded-xl p-5"
              style={{ borderColor: `${statusColor}15` }}
              data-testid={`env-sensor-${sensor.type}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: sensor.color }} />
                  <span className="text-xs font-medium text-white/50">{sensor.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${status === "nominal" ? "pulse-green bg-[#00e676]" : status === "watch" ? "pulse-amber bg-[#ff9100]" : "pulse-red bg-[#ff1744]"}`} />
                  <span className="text-[10px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
              
              <div className="font-mono text-3xl font-bold tabular-nums text-white/90 mb-1">
                {current.toFixed(1)}<span className="text-sm text-white/40 ml-1">{sensor.unit}</span>
              </div>

              {/* Sparkline */}
              <div className="h-12 mt-2 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <Line type="monotone" dataKey="v" stroke={sensor.color} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <div className="text-white/30">Min</div>
                  <div className="font-mono tabular-nums text-white/60">{minVal.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-white/30">Max</div>
                  <div className="font-mono tabular-nums text-white/60">{maxVal.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-white/30">Avg</div>
                  <div className="font-mono tabular-nums text-white/60">{avgVal.toFixed(1)}</div>
                </div>
              </div>

              <div className="mt-2 text-[9px] text-white/20">
                Threshold: {sensor.alertLow > 0 ? `${sensor.alertLow}–${sensor.alertHigh}` : `< ${sensor.alertHigh}`} {sensor.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Charts */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-sm text-white/70">Historical Data</h2>
          <div className="flex gap-1">
            {(["24hr", "7day", "30day"] as const).map((t) => (
              <button
                key={t}
                data-testid={`history-tab-${t}`}
                onClick={() => setTab(t)}
                className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
                  tab === t ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20" : "text-white/40 hover:text-white/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={
              (grouped["ambient-temp"] || []).slice(tab === "24hr" ? -48 : tab === "7day" ? -48 : -48).map((r: any, i: number) => ({
                time: new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                "Ambient": r.value,
                "Humidity": grouped["humidity"]?.[i]?.value,
                "Chiller In": grouped["chiller-in"]?.[i]?.value,
                "Chiller Out": grouped["chiller-out"]?.[i]?.value,
                "Hydraulic": grouped["hydraulic-oil"]?.[i]?.value,
              }))
            }>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} interval={7} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#12131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="Ambient" stroke={CYAN} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Humidity" stroke="#6366f1" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Chiller In" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Hydraulic" stroke={AMBER} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CYAN }} />Ambient</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: "#6366f1" }} />Humidity</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: "#3b82f6" }} />Chiller In</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: AMBER }} />Hydraulic Oil</span>
        </div>
      </div>
    </div>
  );
}
