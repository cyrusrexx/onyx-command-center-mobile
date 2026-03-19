import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import {
  LayoutDashboard, Kanban, Settings, Thermometer,
  DollarSign, Wrench, Package, Truck, Users, Store,
  ClipboardList, X,
} from "lucide-react";
import onyxIcon from "@assets/onyx-icon.png";
import { useActiveUser } from "@/lib/userContext";
import { useMobileNav } from "@/lib/mobileNav";

const allNavItems = [
  { path: "/", label: "Command Center", icon: LayoutDashboard },
  { path: "/pipeline", label: "Job Pipeline", icon: Kanban },
  { path: "/production", label: "Press Control", icon: Settings },
  { path: "/press-log", label: "Press Log", icon: ClipboardList },
  { path: "/environment", label: "Environment", icon: Thermometer },
  { path: "/finance", label: "Financial", icon: DollarSign },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/shipping", label: "Shipping", icon: Truck },
  { path: "/leads", label: "Lead Tracker", icon: Users },
  { path: "/vendors", label: "Vendors", icon: Store },
];

const integrations = [
  { name: "QuickBooks", status: "connected" },
  { name: "Monday.com", status: "connected" },
  { name: "Gmail", status: "connected" },
  { name: "Slack", status: "syncing" },
  { name: "Sensors", status: "connected" },
  { name: "FedEx", status: "connected" },
  { name: "UPS", status: "connected" },
];

export default function AppSidebar() {
  const [location] = useLocation();
  const { activeUser } = useActiveUser();
  const { sidebarOpen, setSidebarOpen } = useMobileNav();

  const navItems = useMemo(() => {
    return allNavItems.filter(item => activeUser.access.includes(item.path));
  }, [activeUser.access]);

  function handleNavClick() {
    // Close sidebar on mobile when a nav item is tapped
    setSidebarOpen(false);
  }

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        data-testid="app-sidebar"
        className={`
          fixed left-0 top-0 h-screen z-50 flex flex-col w-[260px]
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-[240px]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, #08090c 0%, #0c0d12 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src={onyxIcon} alt="Onyx" className="w-7 h-7 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-[11px] tracking-[0.12em] text-white/90 uppercase whitespace-nowrap">
                Onyx Record Press
              </div>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActive
                      ? "bg-[#00e5ff]/10 border border-[#00e5ff]/20"
                      : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                  }`}
                  style={isActive ? { boxShadow: "0 0 15px rgba(0,229,255,0.08)" } : {}}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-[#00e5ff]" : "text-white/40 group-hover:text-white/70"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      isActive ? "text-[#00e5ff]" : "text-white/60 group-hover:text-white/90"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="px-4 pb-3">
          <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-2">
            System Status
          </div>
          <div className="space-y-1.5">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    int.status === "connected"
                      ? "bg-[#00e676] pulse-green"
                      : int.status === "syncing"
                      ? "bg-[#ff9100] pulse-amber"
                      : "bg-[#ff1744] pulse-red"
                  }`}
                />
                <span className="text-[11px] text-white/40">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
