import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Truck, Package, Clock, CheckCircle2, AlertTriangle,
  MapPin, ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";
import type { Shipment, Job } from "@shared/schema";

const CYAN = "#00e5ff";
const GREEN = "#00e676";
const AMBER = "#ff9100";
const RED = "#ff1744";

type ShipmentEvent = {
  timestamp: string;
  location: string;
  description: string;
  status: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  "label-created": { label: "Label Created", color: "text-white/50", bg: "bg-white/[0.06] border border-white/[0.12]" },
  "picked-up": { label: "Picked Up", color: `text-[${AMBER}]`, bg: `bg-[${AMBER}]/10 border border-[${AMBER}]/20` },
  "in-transit": { label: "In Transit", color: `text-[${CYAN}]`, bg: `bg-[${CYAN}]/10 border border-[${CYAN}]/20`, pulse: true },
  "out-for-delivery": { label: "Out for Delivery", color: `text-[${GREEN}]`, bg: `bg-[${GREEN}]/10 border border-[${GREEN}]/20`, pulse: true },
  "delivered": { label: "Delivered", color: `text-[${GREEN}]`, bg: `bg-[${GREEN}]/10 border border-[${GREEN}]/20` },
  "exception": { label: "Exception", color: `text-[${RED}]`, bg: `bg-[${RED}]/10 border border-[${RED}]/20` },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig["label-created"];
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`}
    >
      {cfg.label}
    </span>
  );
}

function CarrierBadge({ carrier }: { carrier: string }) {
  const isFedex = carrier === "fedex";
  return (
    <span
      data-testid={`carrier-badge-${carrier}`}
      className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
        isFedex
          ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
          : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
      }`}
    >
      <Truck className="w-3 h-3 inline-block mr-1 -mt-0.5" />
      {isFedex ? "FedEx" : "UPS"}
    </span>
  );
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  if (carrier === "fedex") {
    return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  }
  return `https://www.ups.com/track?tracknum=${trackingNumber}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function parseShipmentType(reference: string | null): string {
  if (!reference) return "";
  if (reference.toLowerCase().includes("tps") || reference.toLowerCase().includes("tp")) return "TPs";
  if (reference.toLowerCase().includes("final run")) return "Final Run";
  return reference;
}

function EventTimeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <div data-testid="event-timeline" className="pl-4 py-3">
      <div className="relative">
        {events.map((event, i) => {
          const isLast = i === events.length - 1;
          const statusCfg = statusConfig[event.status] || statusConfig["label-created"];
          const dotColor =
            event.status === "delivered" ? GREEN :
            event.status === "in-transit" ? CYAN :
            event.status === "out-for-delivery" ? GREEN :
            event.status === "picked-up" ? AMBER :
            event.status === "exception" ? RED :
            "rgba(255,255,255,0.3)";

          return (
            <div key={i} className="flex gap-3 relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className="absolute left-[5px] top-[14px] w-[1px] bg-white/10"
                  style={{ height: "calc(100% - 2px)" }}
                />
              )}
              {/* Dot */}
              <div className="flex-shrink-0 mt-1.5">
                <div
                  className="w-[11px] h-[11px] rounded-full border-2"
                  style={{
                    borderColor: dotColor,
                    backgroundColor: isLast ? dotColor : "transparent",
                  }}
                />
              </div>
              {/* Content */}
              <div className="pb-4 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-white/70">{event.description}</span>
                  <span className={`text-[10px] ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-white/30 font-mono tabular-nums">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  {event.location && (
                    <span className="text-[10px] text-white/25 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShipmentRow({ shipment, jobs, isExpanded, onToggle }: {
  shipment: Shipment;
  jobs: Job[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const job = jobs.find(j => j.jobId === shipment.jobId);
  const events = (shipment.events as ShipmentEvent[]) || [];

  return (
    <>
      <tr
        data-testid={`shipment-row-${shipment.trackingNumber}`}
        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="py-2.5 pr-3">
          <CarrierBadge carrier={shipment.carrier} />
        </td>
        <td className="py-2.5 pr-3">
          <div className="flex items-center gap-1.5">
            <a
              href={getTrackingUrl(shipment.carrier, shipment.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono tabular-nums text-[#00e5ff]/80 hover:text-[#00e5ff] text-xs"
              data-testid={`tracking-link-${shipment.trackingNumber}`}
              onClick={(e) => e.stopPropagation()}
            >
              {shipment.trackingNumber}
            </a>
            <ExternalLink className="w-3 h-3 text-white/20" />
          </div>
        </td>
        <td className="py-2.5 pr-3">
          {shipment.jobId && (
            <span className="font-mono tabular-nums text-[#00e5ff]/60 text-xs" data-testid={`job-link-${shipment.jobId}`}>
              {shipment.jobId}
            </span>
          )}
        </td>
        <td className="py-2.5 pr-3 text-xs text-white/50">{shipment.yourReference || "—"}</td>
        <td className="py-2.5 pr-3 text-xs text-white/60">{shipment.recipientName}</td>
        <td className="py-2.5 pr-3"><StatusBadge status={shipment.status} /></td>
        <td className="py-2.5 pr-3 text-xs font-mono tabular-nums text-white/40">{formatDate(shipment.shipDate)}</td>
        <td className="py-2.5 pr-3 text-xs font-mono tabular-nums text-white/40">{formatDate(shipment.estimatedDelivery)}</td>
        <td className="py-2.5 pr-3 text-xs font-mono tabular-nums text-white/50">
          {shipment.packageCount} / {shipment.weight} lbs
        </td>
        <td className="py-2.5">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/30" />
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr data-testid={`shipment-detail-${shipment.trackingNumber}`}>
          <td colSpan={10} className="bg-white/[0.015] border-b border-white/[0.04]">
            <div className="px-4 py-2">
              <div className="flex gap-8">
                <div className="flex-1">
                  <div className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-2">Shipment Timeline</div>
                  <EventTimeline events={events} />
                </div>
                <div className="w-56 space-y-2">
                  <div className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 mb-2">Details</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Service</span>
                      <span className="text-white/70">{shipment.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Recipient</span>
                      <span className="text-white/70">{shipment.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Destination</span>
                      <span className="text-white/70">{shipment.recipientCity}, {shipment.recipientState}</span>
                    </div>
                    {job && (
                      <div className="flex justify-between">
                        <span className="text-white/40">Client</span>
                        <span className="text-white/70">{job.clientName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/40">Cost</span>
                      <span className="text-white/70 font-mono tabular-nums">${shipment.shippingCost?.toFixed(2)}</span>
                    </div>
                    {shipment.actualDelivery && (
                      <div className="flex justify-between">
                        <span className="text-white/40">Delivered</span>
                        <span className="text-white/70 font-mono tabular-nums">{formatDate(shipment.actualDelivery)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Shipping() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: shipments = [] } = useQuery<Shipment[]>({
    queryKey: ["/api/shipments"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/shipments"); return res.json(); },
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/jobs"); return res.json(); },
  });

  const toggleRow = (trackingNumber: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(trackingNumber)) next.delete(trackingNumber);
      else next.add(trackingNumber);
      return next;
    });
  };

  // KPI calculations
  const activeShipments = shipments.filter(s => s.status !== "delivered");
  const inTransit = shipments.filter(s => s.status === "in-transit");
  const deliveredThisMonth = shipments.filter(s => {
    if (s.status !== "delivered" || !s.actualDelivery) return false;
    return s.actualDelivery.startsWith("2026-03");
  });

  // Avg transit time (delivered shipments with both dates)
  const deliveredWithDates = shipments.filter(s => s.status === "delivered" && s.shipDate && s.actualDelivery);
  const avgTransitDays = deliveredWithDates.length > 0
    ? deliveredWithDates.reduce((sum, s) => {
        const ship = new Date(s.shipDate!).getTime();
        const deliver = new Date(s.actualDelivery!).getTime();
        return sum + (deliver - ship) / (1000 * 60 * 60 * 24);
      }, 0) / deliveredWithDates.length
    : 0;

  // Separate active vs delivered
  const deliveredShipments = shipments.filter(s => s.status === "delivered");

  // Shipments grouped by job
  const jobsWithShipments = new Map<string, { job: Job | undefined; shipments: Shipment[] }>();
  for (const s of shipments) {
    if (!s.jobId) continue;
    if (!jobsWithShipments.has(s.jobId)) {
      jobsWithShipments.set(s.jobId, { job: jobs.find(j => j.jobId === s.jobId), shipments: [] });
    }
    jobsWithShipments.get(s.jobId)!.shipments.push(s);
  }
  // Add jobs that have no shipments yet but are in packaging/shipped status
  for (const job of jobs) {
    if (!jobsWithShipments.has(job.jobId) && (job.status === "packaging" || job.status === "shipped")) {
      jobsWithShipments.set(job.jobId, { job, shipments: [] });
    }
  }

  // Carrier stats
  const fedexShipments = shipments.filter(s => s.carrier === "fedex");
  const upsShipments = shipments.filter(s => s.carrier === "ups");
  const fedexSpend = fedexShipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);
  const upsSpend = upsShipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);

  const tableHeaderClass = "text-left text-white/30 text-[10px] tracking-[0.1em] uppercase border-b border-white/[0.06] pb-2 pr-3";

  return (
    <div data-testid="shipping-page" className="space-y-6">
      <h1 className="font-display font-bold text-lg text-white/90">Shipping & Tracking</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="shipping-kpi-cards">
        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-[#00e5ff]" />
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Active Shipments</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white/90" data-testid="kpi-active-shipments">
            {activeShipments.length}
          </div>
        </div>

        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-[#00e5ff]" />
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">In Transit</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white/90" data-testid="kpi-in-transit">
            {inTransit.length}
          </div>
        </div>

        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Delivered This Month</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white/90" data-testid="kpi-delivered-month">
            {deliveredThisMonth.length}
          </div>
        </div>

        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#ff9100]" />
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/40">Avg Transit Time</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white/90" data-testid="kpi-avg-transit">
            {avgTransitDays.toFixed(1)}
            <span className="text-xs text-white/30 ml-1 font-normal">days</span>
          </div>
        </div>
      </div>

      {/* Active Shipments Table */}
      {activeShipments.length > 0 && (
        <div className="glow-card rounded-xl p-6" data-testid="active-shipments-section">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-[#00e5ff]" />
            <h2 className="font-display font-bold text-lg text-white/90">Active Shipments</h2>
            {activeShipments.some(s => s.status === "in-transit") && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] animate-pulse">
                {inTransit.length} in transit
              </span>
            )}
          </div>
          <table className="w-full text-xs" data-testid="active-shipments-table">
            <thead>
              <tr>
                <th className={tableHeaderClass}>Carrier</th>
                <th className={tableHeaderClass}>Tracking #</th>
                <th className={tableHeaderClass}>Job</th>
                <th className={tableHeaderClass}>Reference</th>
                <th className={tableHeaderClass}>Recipient</th>
                <th className={tableHeaderClass}>Status</th>
                <th className={tableHeaderClass}>Ship Date</th>
                <th className={tableHeaderClass}>Est. Delivery</th>
                <th className={tableHeaderClass}>Pkgs / Weight</th>
                <th className={`${tableHeaderClass} w-8`}></th>
              </tr>
            </thead>
            <tbody>
              {activeShipments.map(s => (
                <ShipmentRow
                  key={s.trackingNumber}
                  shipment={s}
                  jobs={jobs}
                  isExpanded={expandedRows.has(s.trackingNumber)}
                  onToggle={() => toggleRow(s.trackingNumber)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery History */}
      <div className="glow-card rounded-xl p-6" data-testid="delivery-history-section">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
          <h2 className="font-display font-bold text-lg text-white/90">Delivery History</h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676]">
            {deliveredShipments.length} delivered
          </span>
        </div>
        <table className="w-full text-xs" data-testid="delivery-history-table">
          <thead>
            <tr>
              <th className={tableHeaderClass}>Carrier</th>
              <th className={tableHeaderClass}>Tracking #</th>
              <th className={tableHeaderClass}>Job</th>
              <th className={tableHeaderClass}>Reference</th>
              <th className={tableHeaderClass}>Recipient</th>
              <th className={tableHeaderClass}>Status</th>
              <th className={tableHeaderClass}>Ship Date</th>
              <th className={tableHeaderClass}>Est. Delivery</th>
              <th className={tableHeaderClass}>Pkgs / Weight</th>
              <th className={`${tableHeaderClass} w-8`}></th>
            </tr>
          </thead>
          <tbody>
            {deliveredShipments.map(s => (
              <ShipmentRow
                key={s.trackingNumber}
                shipment={s}
                jobs={jobs}
                isExpanded={expandedRows.has(s.trackingNumber)}
                onToggle={() => toggleRow(s.trackingNumber)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Shipments by Job */}
      <div data-testid="shipments-by-job-section">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-bold text-lg text-white/90">Shipments by Job</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from(jobsWithShipments.entries()).map(([jobId, { job, shipments: jobShipments }]) => (
            <div
              key={jobId}
              data-testid={`job-shipments-${jobId}`}
              className="glow-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono tabular-nums text-[#00e5ff]/80 text-xs">{jobId}</span>
                  {job && <div className="text-sm text-white/70 mt-0.5">{job.clientName}</div>}
                </div>
                {job && (
                  <StatusBadge status={job.status} />
                )}
              </div>
              {jobShipments.length > 0 ? (
                <div className="space-y-2">
                  {jobShipments.map(s => (
                    <div
                      key={s.trackingNumber}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <div className="font-mono tabular-nums text-[10px] text-[#00e5ff]/60">{s.trackingNumber}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {parseShipmentType(s.yourReference) || s.service}
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.08]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff9100]/60" />
                  <span className="text-[10px] text-white/30">Awaiting shipment</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Carrier Summary */}
      <div data-testid="carrier-summary-section">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-bold text-lg text-white/90">Carrier Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="glow-card rounded-xl p-5" data-testid="carrier-fedex">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                <span className="font-display font-bold text-sm text-white/80">FedEx</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676]">connected</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Account</span>
                <span className="text-white/70 font-mono">RecordMadness</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Shipments</span>
                <span className="text-white/70 font-mono tabular-nums">{fedexShipments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Total Spend</span>
                <span className="text-white/70 font-mono tabular-nums">${fedexSpend.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-xl p-5" data-testid="carrier-ups">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span className="font-display font-bold text-sm text-white/80">UPS</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676]">connected</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Shipments</span>
                <span className="text-white/70 font-mono tabular-nums">{upsShipments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Total Spend</span>
                <span className="text-white/70 font-mono tabular-nums">${upsSpend.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
