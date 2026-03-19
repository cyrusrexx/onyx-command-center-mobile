import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Package, Truck, Users, AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@shared/schema";

const GREEN = "#00e676";
const AMBER = "#ff9100";
const RED = "#ff1744";
const CYAN = "#00e5ff";

function StockBar({ current, threshold, max }: { current: number; threshold: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const threshPct = (threshold / max) * 100;
  const color = current <= threshold * 0.5 ? RED : current <= threshold ? AMBER : GREEN;
  return (
    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: `${threshPct}%` }} title="Reorder threshold" />
    </div>
  );
}

export default function Inventory() {
  const { data: items = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/inventory"); return res.json(); },
  });

  const materials = items.filter(i => i.category !== "spare-parts");
  const lowItems = materials.filter(i => i.status === "low" || i.status === "critical");

  // Purchase orders
  const purchaseOrders = [
    { id: "PO-2026-042", vendor: "Vinyl Supply Co.", items: "Black Virgin PVC — 500 lbs", status: "received", date: "2026-02-28", amount: 2400 },
    { id: "PO-2026-043", vendor: "Print Masters", items: "Custom Labels — Puscifer Ent.", status: "in-transit", date: "2026-03-08", amount: 1200 },
    { id: "PO-2026-044", vendor: "Jacket World", items: "Gatefold Jackets — 300 units", status: "ordered", date: "2026-03-12", amount: 1800 },
    { id: "PO-2026-045", vendor: "Vinyl Supply Co.", items: "Color PVC (Clear + Red) — 200 lbs", status: "in-transit", date: "2026-03-10", amount: 1600 },
    { id: "PO-2026-046", vendor: "Sleeve Supply", items: "Inner Sleeves — 2000 units", status: "received", date: "2026-02-10", amount: 320 },
  ];

  // Vendor directory
  const vendors = [
    { name: "RTI (Record Technology Inc.)", service: "Plating", contact: "Standard ordering", leadTime: "2-3 weeks" },
    { name: "Pheenix Alpha AB", service: "AD12 Parts & Service", contact: "Scotty — Remote Support", leadTime: "3-4 weeks (Sweden)" },
    { name: "All Temps", service: "Water Loop / Chiller", contact: "Service call", leadTime: "1-2 days" },
    { name: "PLC Consulting", service: "Safety Valves / Boiler", contact: "Louis", leadTime: "1-2 weeks" },
    { name: "Vinyl Supply Co.", service: "Virgin & Color PVC", contact: "TBD", leadTime: "1-2 weeks" },
    { name: "Print Masters", service: "Labels", contact: "TBD", leadTime: "1-2 weeks" },
  ];

  return (
    <div data-testid="inventory-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-white/90">Inventory & Purchasing</h1>
        {lowItems.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#ff9100]">
            <AlertTriangle className="w-4 h-4" />
            {lowItems.length} items below threshold
          </div>
        )}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-4 gap-4">
        {materials.map((item) => {
          const maxVal = Math.max(item.currentStock, item.reorderThreshold * 3);
          const statusColor = item.status === "critical" ? RED : item.status === "low" ? AMBER : GREEN;
          return (
            <div
              key={item.id}
              data-testid={`inventory-${item.id}`}
              className="glow-card rounded-xl p-4"
              style={{ borderColor: `${statusColor}15` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 text-white/30" />
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${
                  item.status === "critical" ? "bg-[#ff1744]/10 text-[#ff1744]" :
                  item.status === "low" ? "bg-[#ff9100]/10 text-[#ff9100]" :
                  "bg-[#00e676]/10 text-[#00e676]"
                }`}>{item.status}</span>
              </div>
              <div className="text-xs font-medium text-white/70 mb-1">{item.itemName}</div>
              <div className="font-mono text-xl font-bold tabular-nums text-white/90 mb-1">
                {item.currentStock.toLocaleString()}
                <span className="text-xs text-white/30 ml-1 font-normal">{item.unit}</span>
              </div>
              <StockBar current={item.currentStock} threshold={item.reorderThreshold} max={maxVal} />
              <div className="text-[10px] text-white/30 mt-1">
                Reorder at: {item.reorderThreshold.toLocaleString()} {item.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Orders */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Purchase Orders</h2>
        </div>
        <table className="w-full text-xs" data-testid="purchase-orders-table">
          <thead>
            <tr className="text-left text-white/30 text-[10px] tracking-[0.1em] uppercase border-b border-white/[0.06]">
              <th className="pb-2 pr-4">PO #</th>
              <th className="pb-2 pr-4">Vendor</th>
              <th className="pb-2 pr-4">Items</th>
              <th className="pb-2 pr-4 text-right">Amount</th>
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="py-2 pr-4 font-mono tabular-nums text-[#00e5ff]/70">{po.id}</td>
                <td className="py-2 pr-4 text-white/60">{po.vendor}</td>
                <td className="py-2 pr-4 text-white/50">{po.items}</td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums text-white/60">${po.amount.toLocaleString()}</td>
                <td className="py-2 pr-4 font-mono tabular-nums text-white/40">{po.date}</td>
                <td className="py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    po.status === "received" ? "bg-[#00e676]/10 text-[#00e676]" :
                    po.status === "in-transit" ? "bg-[#00e5ff]/10 text-[#00e5ff]" :
                    "bg-[#ff9100]/10 text-[#ff9100]"
                  }`}>{po.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Directory */}
      <div className="glow-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#00e5ff]" />
          <h2 className="font-display font-semibold text-sm text-white/70">Vendor Directory</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {vendors.map((v) => (
            <div key={v.name} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
              <div className="text-xs font-medium text-white/70 mb-1">{v.name}</div>
              <div className="text-[10px] text-white/40 mb-0.5">{v.service}</div>
              <div className="text-[10px] text-white/30">{v.contact}</div>
              <div className="text-[10px] text-[#00e5ff]/40 mt-1">Lead: {v.leadTime}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
