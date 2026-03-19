import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import type { Vendor } from "@shared/schema";
import {
  Search, X, Phone, Mail, Globe, MapPin, Star, Building2,
  ChevronDown, ExternalLink, Package, Zap, Music, Truck,
  Wrench, Flame, Beaker, Store, DollarSign, Tag, Clock,
  ArrowUpDown, SlidersHorizontal, FileText,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  plating:     { label: "Plating",     color: "#00e5ff", bg: "rgba(0,229,255,0.12)",   icon: Zap },
  materials:   { label: "Materials",   color: "#e040fb", bg: "rgba(224,64,251,0.12)",   icon: Beaker },
  mastering:   { label: "Mastering",   color: "#ff9100", bg: "rgba(255,145,0,0.12)",    icon: Music },
  packaging:   { label: "Packaging",   color: "#00e676", bg: "rgba(0,230,118,0.12)",    icon: Package },
  equipment:   { label: "Equipment",   color: "#ffea00", bg: "rgba(255,234,0,0.12)",    icon: Wrench },
  utilities:   { label: "Utilities",   color: "#546e7a", bg: "rgba(84,110,122,0.12)",   icon: Flame },
  logistics:   { label: "Logistics",   color: "#42a5f5", bg: "rgba(66,165,245,0.12)",   icon: Truck },
  consulting:  { label: "Consulting",  color: "#ffd740", bg: "rgba(255,215,64,0.12)",   icon: FileText },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",   color: "#00e676", bg: "rgba(0,230,118,0.12)" },
  inactive: { label: "Inactive", color: "#546e7a", bg: "rgba(84,110,122,0.12)" },
  "on-hold": { label: "On Hold", color: "#ff9100", bg: "rgba(255,145,0,0.12)" },
};

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return "—";
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-white/20 text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= rating ? "text-[#ffd740] fill-[#ffd740]" : "text-white/10"}`}
        />
      ))}
    </div>
  );
}

// ─── Vendor Detail Panel ─────────────────────────────────────────────────
function VendorDetailPanel({
  vendor,
  onClose,
}: {
  vendor: Vendor;
  onClose: () => void;
}) {
  const catCfg = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG["materials"];
  const statusCfg = STATUS_CONFIG[vendor.status] || STATUS_CONFIG["active"];
  const CatIcon = catCfg.icon;
  const tags = vendor.tags ? vendor.tags.split(",") : [];
  const services = vendor.productsServices ? vendor.productsServices.split(",").map(s => s.trim()) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative h-full w-full max-w-[640px] overflow-y-auto border-l border-white/[0.06]"
        style={{ background: "linear-gradient(180deg, #0c0d12 0%, #08090c 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 border-b border-white/[0.06] px-6 py-4"
          style={{ background: "rgba(12,13,18,0.95)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: catCfg.bg }}
              >
                <CatIcon className="w-5 h-5" style={{ color: catCfg.color }} />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white/95">{vendor.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                    style={{ background: catCfg.bg, color: catCfg.color }}
                  >
                    {catCfg.label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              data-testid="close-vendor-detail"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
              Contact Information
            </h3>
            <div className="space-y-2">
              {vendor.contactName && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Building2 className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-white/40">Contact</div>
                    <div className="text-sm text-white/80 font-medium">{vendor.contactName}</div>
                  </div>
                </div>
              )}
              {vendor.contactEmail && (
                <a
                  href={`mailto:${vendor.contactEmail}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-[#00e5ff]/30 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#00e5ff]/60 group-hover:text-[#00e5ff] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-white/40">Email</div>
                    <div className="text-sm text-white/70 group-hover:text-white/90">{vendor.contactEmail}</div>
                  </div>
                </a>
              )}
              {vendor.contactPhone && (
                <a
                  href={`tel:${vendor.contactPhone}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-[#00e5ff]/30 transition-colors group"
                >
                  <Phone className="w-4 h-4 text-[#00e5ff]/60 group-hover:text-[#00e5ff] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-white/40">Phone</div>
                    <div className="text-sm text-white/70 group-hover:text-white/90">{vendor.contactPhone}</div>
                  </div>
                </a>
              )}
              {vendor.website && (
                <a
                  href={`https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-[#00e5ff]/30 transition-colors group"
                >
                  <Globe className="w-4 h-4 text-[#00e5ff]/60 group-hover:text-[#00e5ff] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/40">Website</div>
                    <div className="text-sm text-white/70 group-hover:text-white/90 truncate">{vendor.website}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 flex-shrink-0" />
                </a>
              )}
              {vendor.address && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-white/40">Address</div>
                    <div className="text-sm text-white/70">{vendor.address}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Account Details */}
          <section>
            <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
              Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendor.accountNumber && (
                <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Account #</div>
                  <div className="text-sm text-white/80 font-mono">{vendor.accountNumber}</div>
                </div>
              )}
              {vendor.paymentTerms && (
                <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Payment Terms</div>
                  <div className="text-sm text-white/80 font-medium uppercase">
                    {vendor.paymentTerms.replace(/-/g, " ")}
                  </div>
                </div>
              )}
              <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="text-[10px] text-white/30 uppercase mb-1">Last Order</div>
                <div className="text-sm text-white/80 tabular-nums">{formatDate(vendor.lastOrderDate)}</div>
              </div>
              <div className="px-3 py-2.5 rounded-lg border border-[#00e676]/20 bg-[#00e676]/[0.06]">
                <div className="text-[10px] text-white/30 uppercase mb-1">Spend YTD</div>
                <div className="text-sm font-bold text-[#00e676] tabular-nums">
                  {formatCurrency(vendor.totalSpendYTD)}
                </div>
              </div>
            </div>
          </section>

          {/* Rating */}
          <section>
            <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
              Rating
            </h3>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <StarRating rating={vendor.rating} />
              {vendor.rating && (
                <span className="text-sm text-white/50 ml-1">{vendor.rating}/5</span>
              )}
            </div>
          </section>

          {/* Products & Services */}
          {services.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
                Products & Services
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {services.map((svc, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs text-white/60 bg-white/[0.04] border border-white/[0.06]"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {vendor.notes && (
            <section>
              <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
                Notes
              </h3>
              <div className="px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {vendor.notes}
              </div>
            </section>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] text-white/50 bg-white/[0.06] border border-white/[0.04]"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function Vendors() {
  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "totalSpendYTD" || field === "rating" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...vendors];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.contactName && v.contactName.toLowerCase().includes(q)) ||
          (v.contactEmail && v.contactEmail.toLowerCase().includes(q)) ||
          (v.productsServices && v.productsServices.toLowerCase().includes(q)) ||
          (v.notes && v.notes.toLowerCase().includes(q)) ||
          (v.tags && v.tags.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") result = result.filter((v) => v.category === categoryFilter);
    if (statusFilter !== "all") result = result.filter((v) => v.status === statusFilter);

    result.sort((a, b) => {
      let va: any = (a as any)[sortField];
      let vb: any = (b as any)[sortField];
      if (sortField === "totalSpendYTD" || sortField === "rating") {
        va = va ?? 0;
        vb = vb ?? 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    return result;
  }, [vendors, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalSpend = useMemo(
    () => vendors.reduce((sum, v) => sum + (v.totalSpendYTD || 0), 0),
    [vendors]
  );
  const activeCount = useMemo(
    () => vendors.filter((v) => v.status === "active").length,
    [vendors]
  );
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of vendors) c[v.category] = (c[v.category] || 0) + 1;
    return c;
  }, [vendors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SortHeader = ({ field, label, align }: { field: string; label: string; align?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors ${
        sortField === field ? "text-[#00e5ff]" : "text-white/30 hover:text-white/50"
      } ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      {sortField === field && (
        <span className="text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-6" data-testid="vendors-page">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-white/95">Vendor Directory</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Suppliers, service providers & partners
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="glow-card rounded-xl px-4 py-3 border border-white/[0.06]"
          style={{ background: "rgba(18,19,26,0.8)" }}
        >
          <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">
            Total Vendors
          </div>
          <div className="text-2xl font-bold text-white/90 tabular-nums mt-1">{vendors.length}</div>
        </div>
        <div
          className="glow-card rounded-xl px-4 py-3 border border-white/[0.06]"
          style={{ background: "rgba(18,19,26,0.8)" }}
        >
          <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">
            Active
          </div>
          <div className="text-2xl font-bold text-[#00e676] tabular-nums mt-1">{activeCount}</div>
        </div>
        <div
          className="glow-card rounded-xl px-4 py-3 border border-white/[0.06]"
          style={{ background: "rgba(18,19,26,0.8)" }}
        >
          <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">
            Total Spend YTD
          </div>
          <div className="text-2xl font-bold text-[#00e5ff] tabular-nums mt-1">
            {formatCurrency(totalSpend)}
          </div>
        </div>
        <div
          className="glow-card rounded-xl px-4 py-3 border border-white/[0.06]"
          style={{ background: "rgba(18,19,26,0.8)" }}
        >
          <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">
            Categories
          </div>
          <div className="text-2xl font-bold text-white/90 tabular-nums mt-1">
            {Object.keys(categoryCounts).length}
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1 rounded-xl p-1 bg-white/[0.02] border border-white/[0.06] flex-wrap overflow-x-auto">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            categoryFilter === "all" ? "bg-white/[0.08] text-white/80" : "hover:bg-white/[0.04] text-white/40"
          }`}
        >
          All
          <span className="text-white/30 tabular-nums">{vendors.length}</span>
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0) return null;
          const CIcon = cfg.icon;
          return (
            <button
              key={key}
              data-testid={`category-filter-${key}`}
              onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                categoryFilter === key ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              }`}
              style={{ color: categoryFilter === key ? cfg.color : undefined }}
            >
              <CIcon className="w-3 h-3" style={{ color: cfg.color, opacity: categoryFilter === key ? 1 : 0.5 }} />
              {cfg.label}
              <span className="text-white/30 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            data-testid="vendor-search"
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/30 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
            </button>
          )}
        </div>

        <select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/60 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-white/30">
        {filtered.length} vendor{filtered.length !== 1 ? "s" : ""} shown
      </div>

      {/* Vendor Table — Desktop: grid table, Mobile: card list */}
      {/* Desktop table (hidden on mobile) */}
      <div
        className="hidden md:block rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ background: "rgba(18,19,26,0.6)" }}
      >
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_100px_100px_80px] gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <SortHeader field="name" label="Vendor" />
          <SortHeader field="category" label="Category" />
          <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">Contact</div>
          <SortHeader field="totalSpendYTD" label="Spend YTD" align="right" />
          <SortHeader field="lastOrderDate" label="Last Order" />
          <SortHeader field="rating" label="Rating" />
        </div>

        {/* Table rows */}
        {filtered.map((vendor) => {
          const catCfg = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG["materials"];
          const statusCfg = STATUS_CONFIG[vendor.status] || STATUS_CONFIG["active"];
          const CatIcon = catCfg.icon;

          return (
            <div
              key={vendor.id}
              data-testid={`vendor-row-${vendor.id}`}
              onClick={() => setSelectedVendor(vendor)}
              className="grid grid-cols-[2fr_1fr_1fr_100px_100px_80px] gap-3 px-4 py-3 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors group"
            >
              {/* Vendor name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: catCfg.bg }}
                >
                  <CatIcon className="w-4 h-4" style={{ color: catCfg.color }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white/80 font-medium truncate group-hover:text-white/95">
                      {vendor.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-1.5 py-0 rounded text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                    {vendor.paymentTerms && (
                      <span className="text-[10px] text-white/25 uppercase">
                        {vendor.paymentTerms.replace(/-/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: catCfg.bg, color: catCfg.color }}
                >
                  {catCfg.label}
                </span>
              </div>

              {/* Contact */}
              <div className="flex flex-col justify-center min-w-0">
                {vendor.contactName && (
                  <div className="text-xs text-white/60 truncate">{vendor.contactName}</div>
                )}
                {vendor.contactPhone && (
                  <div className="text-[10px] text-white/30 truncate">{vendor.contactPhone}</div>
                )}
              </div>

              {/* Spend YTD */}
              <div className="flex items-center justify-end">
                <span
                  className={`text-sm tabular-nums font-medium ${
                    vendor.totalSpendYTD ? "text-white/70" : "text-white/20"
                  }`}
                >
                  {formatCurrency(vendor.totalSpendYTD)}
                </span>
              </div>

              {/* Last Order */}
              <div className="flex items-center">
                <span className="text-xs text-white/50 tabular-nums">
                  {formatDate(vendor.lastOrderDate)}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center">
                <StarRating rating={vendor.rating} />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-white/30">
            No vendors match your filters
          </div>
        )}
      </div>

      {/* Mobile card list (visible only on mobile) */}
      <div className="md:hidden space-y-2">
        {filtered.map((vendor) => {
          const catCfg = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG["materials"];
          const statusCfg = STATUS_CONFIG[vendor.status] || STATUS_CONFIG["active"];
          const CatIcon = catCfg.icon;
          return (
            <div
              key={vendor.id}
              data-testid={`vendor-card-${vendor.id}`}
              onClick={() => setSelectedVendor(vendor)}
              className="glow-card rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: catCfg.bg }}
                >
                  <CatIcon className="w-4 h-4" style={{ color: catCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/85 font-medium truncate">{vendor.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span
                      className="px-1.5 py-0 rounded text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: catCfg.bg, color: catCfg.color }}
                    >
                      {catCfg.label}
                    </span>
                    <span
                      className="px-1.5 py-0 rounded text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/50 tabular-nums font-medium">
                      {formatCurrency(vendor.totalSpendYTD)}
                    </span>
                    <StarRating rating={vendor.rating} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">
            No vendors match your filters
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedVendor && (
        <VendorDetailPanel vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}
    </div>
  );
}
