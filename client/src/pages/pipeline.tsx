import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  Search, MapPin, CheckCircle2, X, Package, Truck, DollarSign,
  Calendar, User, Disc3, FileText, Clock, ChevronRight, ExternalLink,
  AlertTriangle, Recycle, Info,
} from "lucide-react";
import type { Job } from "@shared/schema";

const STAGES = [
  { key: "intake", label: "Intake", color: "#ffffff20", dotColor: "#ffffff40" },
  { key: "prepress", label: "Prepress", color: "#ffffff20", dotColor: "#ffffff60" },
  { key: "ready-to-press", label: "Ready to Press", color: "#00e67620", dotColor: "#00e676" },
  { key: "in-production", label: "In Production", color: "#00e5ff20", dotColor: "#00e5ff" },
  { key: "qc", label: "QC", color: "#ff910020", dotColor: "#ff9100" },
  { key: "packaging", label: "Packaging", color: "#ff910020", dotColor: "#ff9100" },
  { key: "shipped", label: "Shipped", color: "#00e67620", dotColor: "#00e676" },
  { key: "delivered", label: "Delivered", color: "#00e67610", dotColor: "#00e67680" },
];

const STAGE_ORDER = STAGES.map(s => s.key);

function DepositBadge({ status }: { status: string | null }) {
  if (!status || status === "none") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff1744]/20 text-[#ff1744]">No Deposit</span>;
  if (status === "75%") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff9100]/20 text-[#ff9100]">75% Paid</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00e676]/20 text-[#00e676]">100% Paid</span>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    "intake": { bg: "bg-white/10", text: "text-white/60", label: "Intake" },
    "prepress": { bg: "bg-white/10", text: "text-white/60", label: "Prepress" },
    "ready-to-press": { bg: "bg-[#00e676]/15", text: "text-[#00e676]", label: "Ready to Press" },
    "in-production": { bg: "bg-[#00e5ff]/15", text: "text-[#00e5ff]", label: "In Production" },
    "qc": { bg: "bg-[#ff9100]/15", text: "text-[#ff9100]", label: "QC" },
    "packaging": { bg: "bg-[#ff9100]/15", text: "text-[#ff9100]", label: "Packaging" },
    "shipped": { bg: "bg-[#00e676]/15", text: "text-[#00e676]", label: "Shipped" },
    "delivered": { bg: "bg-[#00e676]/10", text: "text-[#00e676]/70", label: "Delivered" },
    "closed": { bg: "bg-white/5", text: "text-white/40", label: "Closed" },
  };
  const c = config[status] || config["intake"];
  return <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const isReady = job.status === "ready-to-press" && job.depositStatus !== "none";
  return (
    <div
      data-testid={`job-card-${job.jobId}`}
      className={`glow-card rounded-lg p-3 cursor-pointer transition-all hover:border-[#00e5ff]/30 hover:scale-[1.02] active:scale-[0.98] ${
        isReady ? "border-[#00e676]/30" : ""
      }`}
      style={isReady ? { boxShadow: "0 0 12px rgba(0,230,118,0.1)" } : {}}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-[#00e5ff]/80 tabular-nums">{job.jobId}</span>
        <DepositBadge status={job.depositStatus} />
      </div>
      <div className="text-sm font-medium text-white/85 mb-1">{job.clientName}</div>
      <div className="flex items-center gap-2 text-[10px] text-white/40 mb-2">
        <span>{job.format}</span>
        <span>·</span>
        <span>{job.weight}</span>
        <span>·</span>
        <span>{job.vinylColor}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono tabular-nums text-white/50">{job.quantity?.toLocaleString()} units</span>
        {job.productionLocation && (
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <MapPin className="w-3 h-3" />
            {job.productionLocation === "onyx" ? "Onyx" : "Belu"}
          </div>
        )}
      </div>
      {job.regrindEligible && (
        <div className="mt-2 text-[10px] text-[#00e676]/60 flex items-center gap-1">
          ♻ Regrind: {job.regrindRatio || "Eligible"}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   JOB DETAIL PANEL — full-screen overlay with all cross-referenced data
   ============================================================================ */

function JobDetailPanel({
  job,
  onClose,
  allShipments,
  allRuns,
  allArAging,
}: {
  job: Job;
  onClose: () => void;
  allShipments: any[];
  allRuns: any[];
  allArAging: any[];
}) {
  const jobShipments = allShipments.filter((s: any) => s.jobId === job.jobId);
  const jobRuns = allRuns.filter((r: any) => r.jobId === job.jobId);
  const jobAR = allArAging.filter((a: any) =>
    a.customerName.toLowerCase() === job.clientName.toLowerCase()
  );

  const currentStageIdx = STAGE_ORDER.indexOf(job.status);
  const margin = job.estimatedRevenue && job.estimatedCogs
    ? (((job.estimatedRevenue - job.estimatedCogs) / job.estimatedRevenue) * 100).toFixed(1)
    : null;
  const actualMargin = job.actualRevenue && job.actualCogs
    ? (((job.actualRevenue - job.actualCogs) / job.actualRevenue) * 100).toFixed(1)
    : null;

  return (
    <div
      data-testid="job-detail-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        data-testid={`job-detail-${job.jobId}`}
        className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] m-4"
        style={{ background: "linear-gradient(180deg, #10111a 0%, #0c0d14 100%)", boxShadow: "0 0 60px rgba(0,229,255,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]" style={{ background: "rgba(16,17,26,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-4">
            <Disc3 className="w-6 h-6 text-[#00e5ff]" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-white/90">{job.jobId}</h2>
                <StatusBadge status={job.status} />
                <DepositBadge status={job.depositStatus} />
              </div>
              <div className="text-sm text-white/50 mt-0.5">{job.clientName} — {job.catalogNumber || "No catalog #"}</div>
            </div>
          </div>
          <button
            data-testid="close-job-detail"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-8 space-y-8">

          {/* STATUS TIMELINE */}
          <div>
            <div className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-4">Order Progress</div>
            <div className="flex items-center gap-0">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const stageData = STAGES[idx];
                return (
                  <div key={stage.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCurrent
                            ? "border-[#00e5ff] bg-[#00e5ff]/20 shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                            : isCompleted
                            ? "border-[#00e676] bg-[#00e676]"
                            : "border-white/15 bg-transparent"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />}
                      </div>
                      <span className={`text-[9px] mt-1.5 text-center leading-tight ${
                        isCurrent ? "text-[#00e5ff] font-medium" : isCompleted ? "text-[#00e676]/70" : "text-white/20"
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div className={`h-[2px] flex-1 -mt-4 ${
                        isCompleted ? "bg-[#00e676]/50" : "bg-white/[0.06]"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP ROW: Job Details + Client & Financial */}
          <div className="grid grid-cols-3 gap-6">

            {/* PRODUCT SPECS */}
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Disc3 className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Product Specs</h3>
              </div>
              <div className="space-y-3">
                {([
                  ["Format", job.format],
                  ["Weight", job.weight],
                  ["Color", job.vinylColor],
                  ["Quantity", `${job.quantity?.toLocaleString()} units`],
                  ["Catalog #", job.catalogNumber || "—"],
                  ["Location", job.productionLocation === "onyx" ? "Onyx (In-House)" : job.productionLocation === "belu-outsourced" ? "Belu (Outsourced)" : job.productionLocation === "belu-at-onyx" ? "Belu at Onyx" : job.productionLocation || "—"],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-sm font-mono tabular-nums text-white/80">{val}</span>
                  </div>
                ))}
                {job.regrindEligible && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                    <span className="text-xs text-[#00e676]/70 flex items-center gap-1"><Recycle className="w-3 h-3" /> Regrind</span>
                    <span className="text-sm font-mono text-[#00e676]/70">{job.regrindRatio || "Eligible"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CLIENT INFO */}
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Client</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-white/85">{job.clientName}</div>
                  <div className="text-xs text-white/40 mt-0.5">{job.catalogNumber || "No catalog"}</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Deposit</span>
                  <DepositBadge status={job.depositStatus} />
                </div>
                {jobAR.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/30 mb-2">Accounts Receivable</div>
                    {jobAR.map((ar: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ar.agingBucket === "91+" ? "bg-[#ff1744]/20 text-[#ff1744]" :
                          ar.agingBucket === "1-30" ? "bg-[#ff9100]/20 text-[#ff9100]" :
                          "bg-[#00e676]/20 text-[#00e676]"
                        }`}>{ar.agingBucket}</span>
                        <span className="text-xs font-mono tabular-nums text-white/70">${ar.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}
                {jobAR.length === 0 && (
                  <div className="text-xs text-white/30 italic">No outstanding AR</div>
                )}
              </div>
            </div>

            {/* FINANCIALS */}
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Financials</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Est. Revenue</span>
                  <span className="text-sm font-mono tabular-nums text-white/80">{job.estimatedRevenue ? `$${job.estimatedRevenue.toLocaleString()}` : "—"}</span>
                </div>
                {job.actualRevenue && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Actual Revenue</span>
                    <span className="text-sm font-mono tabular-nums text-[#00e676]">${job.actualRevenue.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Est. COGS</span>
                  <span className="text-sm font-mono tabular-nums text-white/80">{job.estimatedCogs ? `$${job.estimatedCogs.toLocaleString()}` : "—"}</span>
                </div>
                {job.actualCogs && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Actual COGS</span>
                    <span className="text-sm font-mono tabular-nums text-[#ff9100]">${job.actualCogs.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50 font-medium">Est. Margin</span>
                    <span className={`text-sm font-mono tabular-nums font-bold ${
                      margin && parseFloat(margin) > 20 ? "text-[#00e676]" : margin && parseFloat(margin) > 0 ? "text-[#ff9100]" : "text-[#ff1744]"
                    }`}>{margin ? `${margin}%` : "—"}</span>
                  </div>
                  {actualMargin && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-white/50 font-medium">Actual Margin</span>
                      <span className={`text-sm font-mono tabular-nums font-bold ${
                        parseFloat(actualMargin) > 20 ? "text-[#00e676]" : parseFloat(actualMargin) > 0 ? "text-[#ff9100]" : "text-[#ff1744]"
                      }`}>{actualMargin}%</span>
                    </div>
                  )}
                </div>
                {/* Shipping cost total */}
                {jobShipments.length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                    <span className="text-xs text-white/40">Shipping Cost</span>
                    <span className="text-sm font-mono tabular-nums text-white/70">
                      ${jobShipments.reduce((s: number, sh: any) => s + (sh.shippingCost || 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: Key Dates + Production Runs */}
          <div className="grid grid-cols-2 gap-6">

            {/* KEY DATES */}
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Key Dates</h3>
              </div>
              <div className="space-y-3">
                {([
                  ["Press Date", job.pressDate],
                  ["Ship Date", job.shipDate],
                ] as [string, string | null][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-white/40">{label}</span>
                    <span className={`text-sm font-mono tabular-nums ${val ? "text-white/80" : "text-white/20"}`}>
                      {val || "Not scheduled"}
                    </span>
                  </div>
                ))}
                {jobShipments.length > 0 && jobShipments.some((s: any) => s.estimatedDelivery) && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Est. Delivery</span>
                    <span className="text-sm font-mono tabular-nums text-[#00e5ff]">
                      {jobShipments.find((s: any) => s.status !== "delivered")?.estimatedDelivery ||
                       jobShipments[jobShipments.length - 1]?.actualDelivery || "—"}
                    </span>
                  </div>
                )}
                {jobShipments.length > 0 && jobShipments.some((s: any) => s.actualDelivery) && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Actual Delivery</span>
                    <span className="text-sm font-mono tabular-nums text-[#00e676]">
                      {jobShipments.find((s: any) => s.actualDelivery)?.actualDelivery}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PRODUCTION RUNS */}
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Disc3 className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Production Runs</h3>
                {jobRuns.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff]/60">{jobRuns.length} run{jobRuns.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {jobRuns.length > 0 ? (
                <div className="space-y-3">
                  {jobRuns.map((run: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/60">Operator: <span className="text-white/80 font-medium">{run.operatorName}</span></span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${run.endTime ? "bg-[#00e676]/15 text-[#00e676]/70" : "bg-[#00e5ff]/15 text-[#00e5ff]"}`}>
                          {run.endTime ? "Completed" : "Running"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <div className="text-white/30">Cycles</div>
                          <div className="font-mono tabular-nums text-white/80">{run.cycleCount}</div>
                        </div>
                        <div>
                          <div className="text-white/30">Rejects</div>
                          <div className="font-mono tabular-nums text-[#ff9100]">{run.rejectCount} ({run.cycleCount > 0 ? ((run.rejectCount / run.cycleCount) * 100).toFixed(1) : 0}%)</div>
                        </div>
                        <div>
                          <div className="text-white/30">Vinyl Used</div>
                          <div className="font-mono tabular-nums text-white/80">{run.vinylUsageLbs} lbs</div>
                        </div>
                      </div>
                      {run.notes && (
                        <div className="mt-2 text-[10px] text-white/40 italic">"{run.notes}"</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-white/20">No production runs yet</div>
              )}
            </div>
          </div>

          {/* SHIPMENTS */}
          <div className="glow-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-[#00e5ff]/60" />
              <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Shipments</h3>
              {jobShipments.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff]/60">{jobShipments.length}</span>
              )}
            </div>
            {jobShipments.length > 0 ? (
              <div className="space-y-3">
                {jobShipments.map((shipment: any, i: number) => {
                  const trackUrl = shipment.carrier === "fedex"
                    ? `https://www.fedex.com/fedextrack/?trknbr=${shipment.trackingNumber}`
                    : `https://www.ups.com/track?tracknum=${shipment.trackingNumber}`;

                  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                    "label-created": { bg: "bg-white/10", text: "text-white/60", label: "Label Created" },
                    "picked-up": { bg: "bg-[#ff9100]/15", text: "text-[#ff9100]", label: "Picked Up" },
                    "in-transit": { bg: "bg-[#00e5ff]/15", text: "text-[#00e5ff]", label: "In Transit" },
                    "out-for-delivery": { bg: "bg-[#00e676]/15", text: "text-[#00e676]", label: "Out for Delivery" },
                    "delivered": { bg: "bg-[#00e676]/15", text: "text-[#00e676]", label: "Delivered" },
                    "exception": { bg: "bg-[#ff1744]/15", text: "text-[#ff1744]", label: "Exception" },
                  };
                  const sc = statusConfig[shipment.status] || statusConfig["label-created"];

                  // Latest event
                  const events = (shipment.events as any[]) || [];
                  const latestEvent = events[events.length - 1];

                  return (
                    <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            shipment.carrier === "fedex" ? "bg-[#4d148c]/30 text-[#ff6200]" : "bg-[#351c15]/40 text-[#ffb500]"
                          }`}>
                            {shipment.carrier === "fedex" ? "FedEx" : "UPS"}
                          </span>
                          <a
                            href={trackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-[#00e5ff] hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {shipment.trackingNumber}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-[11px]">
                        <div>
                          <div className="text-white/30">Reference</div>
                          <div className="text-white/70">{shipment.yourReference || "—"}</div>
                        </div>
                        <div>
                          <div className="text-white/30">Recipient</div>
                          <div className="text-white/70">{shipment.recipientName}, {shipment.recipientState}</div>
                        </div>
                        <div>
                          <div className="text-white/30">Packages</div>
                          <div className="font-mono tabular-nums text-white/70">{shipment.packageCount} / {shipment.weight} lbs</div>
                        </div>
                        <div>
                          <div className="text-white/30">Cost</div>
                          <div className="font-mono tabular-nums text-white/70">${shipment.shippingCost?.toFixed(2) || "—"}</div>
                        </div>
                      </div>
                      {latestEvent && shipment.status !== "delivered" && (
                        <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center gap-2 text-[10px] text-white/40">
                          <Clock className="w-3 h-3" />
                          Latest: <span className="text-white/60">{latestEvent.description}</span>
                          {latestEvent.location && <span>— {latestEvent.location}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <div className="text-xs text-white/20">No shipments for this job yet</div>
                {(job.status === "packaging" || job.status === "qc") && (
                  <div className="text-[10px] text-[#ff9100]/60 mt-1 flex items-center gap-1 justify-center">
                    <AlertTriangle className="w-3 h-3" /> Job in {job.status === "qc" ? "QC" : "packaging"} — ship label not yet created
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTES / INSTRUCTIONS */}
          {(job.operatorNotes || job.specialInstructions) && (
            <div className="glow-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#00e5ff]/60" />
                <h3 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Notes & Instructions</h3>
              </div>
              <div className="space-y-3">
                {job.operatorNotes && (
                  <div>
                    <div className="text-[10px] text-white/30 mb-1">Operator Notes</div>
                    <div className="text-sm text-white/70 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      {job.operatorNotes}
                    </div>
                  </div>
                )}
                {job.specialInstructions && (
                  <div>
                    <div className="text-[10px] text-[#ff9100]/60 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Special Instructions
                    </div>
                    <div className="text-sm text-[#ff9100]/80 p-3 rounded-lg bg-[#ff9100]/[0.04] border border-[#ff9100]/10">
                      {job.specialInstructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MAIN PIPELINE PAGE
   ============================================================================ */

export default function Pipeline() {
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/jobs"); return res.json(); },
  });

  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ["/api/shipments"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/shipments"); return res.json(); },
  });

  const { data: runs = [] } = useQuery<any[]>({
    queryKey: ["/api/production-runs"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/production-runs"); return res.json(); },
  });

  const { data: arAging = [] } = useQuery<any[]>({
    queryKey: ["/api/ar-aging"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/ar-aging"); return res.json(); },
  });

  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const filtered = jobs.filter((j) => {
    if (search && !j.clientName.toLowerCase().includes(search.toLowerCase()) && !j.jobId.toLowerCase().includes(search.toLowerCase())) return false;
    if (formatFilter !== "all" && j.format !== formatFilter) return false;
    if (locationFilter !== "all" && j.productionLocation !== locationFilter) return false;
    return true;
  });

  return (
    <div data-testid="pipeline-page" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-white/90">Job Pipeline</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              data-testid="pipeline-search"
              type="search"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#00e5ff]/30 w-56"
            />
          </div>
          <select
            data-testid="format-filter"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 px-3 py-2 focus:outline-none"
          >
            <option value="all">All Formats</option>
            <option value='7"'>7"</option>
            <option value='10"'>10"</option>
            <option value='12"'>12"</option>
          </select>
          <select
            data-testid="location-filter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 px-3 py-2 focus:outline-none"
          >
            <option value="all">All Locations</option>
            <option value="onyx">Onyx</option>
            <option value="belu-outsourced">Belu (Outsourced)</option>
            <option value="belu-at-onyx">Belu at Onyx</option>
          </select>
        </div>
      </div>

      {/* Ready to Press indicator */}
      <div className="flex items-center gap-2 text-xs text-[#00e676]/70">
        <CheckCircle2 className="w-4 h-4" />
        <span>{filtered.filter(j => j.status === "ready-to-press" && j.depositStatus !== "none").length} jobs ready to press</span>
        <span className="text-white/20">— Materials + Payment gates cleared</span>
        <span className="ml-4 text-white/30">|</span>
        <Info className="w-3 h-3 text-white/30 ml-1" />
        <span className="text-white/30">Click any job card for full details</span>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageJobs = filtered.filter(j => j.status === stage.key);
          return (
            <div key={stage.key} className="flex-shrink-0 w-60">
              <div className="flex items-center gap-2 mb-3 px-1">
                <h3 className="text-xs font-medium tracking-[0.1em] uppercase text-white/40">{stage.label}</h3>
                <span className="text-[10px] font-mono tabular-nums bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full">
                  {stageJobs.length}
                </span>
              </div>
              <div
                className="space-y-2 min-h-[200px] p-2 rounded-xl"
                style={{ background: stage.color }}
                data-testid={`kanban-column-${stage.key}`}
              >
                {stageJobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                ))}
                {stageJobs.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-white/20">No jobs</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* JOB DETAIL OVERLAY */}
      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          allShipments={shipments}
          allRuns={runs}
          allArAging={arAging}
        />
      )}
    </div>
  );
}
