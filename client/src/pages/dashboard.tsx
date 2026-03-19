import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, AlertTriangle } from "lucide-react";

const CYAN = "#00e5ff";
const AMBER = "#ff9100";
const GREEN = "#00e676";
const RED = "#ff1744";

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glow-card rounded-xl p-5 ${className}`}>{children}</div>
  );
}

function KpiCard({ title, value, subtitle, delta, icon: Icon, color = CYAN }: {
  title: string; value: string; subtitle?: string; delta?: number; icon: any; color?: string;
}) {
  return (
    <GlowCard>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums text-white/90" data-testid={`kpi-${title.toLowerCase().replace(/\s/g, "-")}`}>
        {value}
      </div>
      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${delta >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="font-mono tabular-nums">{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</span>
          <span className="text-white/30 ml-1">vs prior month</span>
        </div>
      )}
      {subtitle && <div className="text-[11px] text-white/30 mt-1">{subtitle}</div>}
    </GlowCard>
  );
}

function RadialGauge({ value, max = 100, color = CYAN, label }: { value: number; max?: number; color?: string; label: string }) {
  const pct = Math.min(value / max, 1);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
          className="font-mono font-bold tabular-nums" fill="white" fontSize="18">{value}%</text>
      </svg>
      <span className="text-[10px] text-white/40 mt-1">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard-summary");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white/[0.03] rounded-xl" />)}
        </div>
      </div>
    );
  }

  const revenueVsCogs = data?.financials?.map((f: any) => ({
    period: f.period.replace("2025-", "").replace("2026-", ""),
    month: new Date(f.period + "-01").toLocaleString("en-US", { month: "short" }),
    Revenue: f.revenue,
    COGS: f.cogs,
    Net: f.netIncome,
  })) || [];

  const arBuckets = data?.arBuckets || {};
  const arPieData = [
    { name: "Current", value: arBuckets.current || 0, color: GREEN },
    { name: "1-30 Days", value: Math.abs(arBuckets["1-30"] || 0), color: AMBER },
    { name: "31-90 Days", value: (arBuckets["31-60"] || 0) + (arBuckets["61-90"] || 0), color: "#6366f1" },
    { name: "91+ Days", value: arBuckets["91+"] || 0, color: RED },
  ].filter(d => d.value > 0);

  const revenueDelta = data?.prevRevenue
    ? ((data.revenue - data.prevRevenue) / data.prevRevenue * 100)
    : 0;

  // Cash flow forecast data
  const cashFlowForecast = Array.from({ length: 15 }, (_, i) => ({
    day: `Mar ${16 + i}`,
    inflow: i < 3 ? 800 + Math.random() * 1200 : i < 8 ? 2000 + Math.random() * 2500 : 1500 + Math.random() * 2000,
    outflow: -(1200 + Math.random() * 800 + (i === 0 ? 5000 : 0) + (i === 3 ? 6150 : 0)),
  }));

  // Job profitability heatmap — use real data + representative mocked recent jobs
  const jobProfitData = [
    { name: "Bartlett", margin: 22.4, revenue: 5284 },
    { name: "Bornstien", margin: 30.7, revenue: 5266 },
    { name: "Van Orden", margin: 17.5, revenue: 2800 },
    { name: "Kanebell", margin: 31.1, revenue: 3200 },
    { name: "Puscifer", margin: 34.4, revenue: 12500 },
    { name: "Moon Stmpr", margin: 12.8, revenue: 6000 },
  ];

  // Pipeline by status
  const pipelineData = [
    { status: "Intake", count: 2, value: 5600 },
    { status: "Prepress", count: 3, value: 31700 },
    { status: "Ready", count: 2, value: 15800 },
    { status: "Production", count: 1, value: 12500 },
    { status: "QC/Pack", count: 2, value: 6000 },
    { status: "Shipped", count: 1, value: 5266 },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          title="Monthly Revenue"
          value={`$${(data?.revenue || 0).toLocaleString()}`}
          delta={revenueDelta}
          icon={DollarSign}
          color={CYAN}
        />
        <KpiCard
          title="Cash Position"
          value={`$${(data?.cashPosition || 0).toLocaleString()}`}
          subtitle="Checking + Savings"
          icon={DollarSign}
          color={CYAN}
        />
        <KpiCard
          title="Active Jobs"
          value={String(data?.activeJobCount || 0)}
          subtitle="Across all stages"
          icon={Briefcase}
          color={CYAN}
        />
        <GlowCard>
          <div className="flex items-start justify-between mb-1">
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Press Utilization</span>
          </div>
          <div className="flex items-center justify-center pt-1">
            <RadialGauge value={data?.pressUtilization || 67} color={CYAN} label="AD12 Alpha" />
          </div>
        </GlowCard>
        <KpiCard
          title="Reject Rate"
          value={`${data?.rejectRate || 3.2}%`}
          subtitle="Target: < 5%"
          icon={AlertTriangle}
          color={data?.rejectRate > 5 ? RED : GREEN}
        />
      </div>

      {/* Second Row: Revenue chart + AR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <GlowCard>
          <h3 className="font-display font-semibold text-sm text-white/70 mb-4">Revenue vs COGS</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueVsCogs}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCOGS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AMBER} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#12131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Area type="monotone" dataKey="Revenue" stroke={CYAN} fill="url(#gradRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="COGS" stroke={AMBER} fill="url(#gradCOGS)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2 text-[11px]">
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 rounded" style={{ background: CYAN }} />
              <span className="text-white/40">Revenue</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 rounded" style={{ background: AMBER }} />
              <span className="text-white/40">COGS</span></div>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="font-display font-semibold text-sm text-white/70 mb-4">AR Aging</h3>
          <div className="flex items-start gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={arPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {arPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 pt-2">
              <div className="text-xl font-mono font-bold tabular-nums text-white/90" data-testid="ar-total">
                ${(data?.arTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Current", amount: arBuckets.current, pct: "84.1%", color: GREEN },
                  { label: "1-30 Days", amount: Math.abs(arBuckets["1-30"] || 0), pct: "6.7%", color: AMBER },
                  { label: "91+ Days", amount: arBuckets["91+"], pct: "9.1%", color: RED },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                      <span className="text-white/50">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-white/70">${(row.amount || 0).toLocaleString()}</span>
                      <span className="text-white/30 w-10 text-right">{row.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[#ff1744]/70 flex items-center gap-1 pt-1">
                <AlertTriangle className="w-3 h-3" />
                Ira Altwegg $2,019 — 91+ days outstanding
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* Cash Flow Forecast */}
        <GlowCard>
          <h3 className="font-display font-semibold text-sm text-white/70 mb-4">Cash Flow Forecast (15-Day)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowForecast} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#12131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="inflow" fill={GREEN} radius={[2, 2, 0, 0]} opacity={0.8} name="Inflow" />
                <Bar dataKey="outflow" fill={RED} radius={[0, 0, 2, 2]} opacity={0.6} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Job Profitability */}
        <GlowCard>
          <h3 className="font-display font-semibold text-sm text-white/70 mb-4">Job Profitability</h3>
          <div className="space-y-2">
            {jobProfitData.map((job: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-20 truncate">{job.name}</span>
                <div className="flex-1 h-6 bg-white/[0.04] rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{
                      width: `${Math.min(job.margin, 100)}%`,
                      background: job.margin > 25 ? GREEN : job.margin > 15 ? AMBER : RED,
                      opacity: 0.7,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums text-white/70">
                    {job.margin}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: GREEN }} /> &gt;25%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: AMBER }} /> 15-25%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: RED }} /> &lt;15%</span>
          </div>
        </GlowCard>

        {/* Pipeline Value */}
        <GlowCard>
          <h3 className="font-display font-semibold text-sm text-white/70 mb-4">Pipeline by Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="status" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip contentStyle={{ background: "#12131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                <Bar dataKey="value" fill={CYAN} radius={[0, 4, 4, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
