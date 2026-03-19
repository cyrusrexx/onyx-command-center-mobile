import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  LayoutDashboard, Kanban, Settings, Thermometer,
  DollarSign, Wrench, Package, Truck, Users, ChevronLeft, ChevronRight, Store,
  ClipboardList,
} from "lucide-react";
import onyxIcon from "@assets/onyx-icon.png";
import { useActiveUser } from "@/lib/userContext";

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
  const [collapsed, setCollapsed] = useState(false);
  const { activeUser } = useActiveUser();

  const navItems = useMemo(() => {
    return allNavItems.filter(item => activeUser.access.includes(item.path));
  }, [activeUser.access]);

  return (
    <aside
      data-testid="app-sidebar"
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
      style={{
        background: "linear-gradient(180deg, #08090c 0%, #0c0d12 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
        <img src={onyxIcon} alt="Onyx" className="w-7 h-7 flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-bold text-[11px] tracking-[0.12em] text-white/90 uppercase whitespace-nowrap">
              Onyx Record Press
            </div>
          </div>
        )}
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
                {!collapsed && (
                  <span
                    className={`text-sm font-medium truncate ${
                      isActive ? "text-[#00e5ff]" : "text-white/60 group-hover:text-white/90"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      {!collapsed && (
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
      )}

      {/* Collapse button */}
      <button
        data-testid="sidebar-collapse"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-white/[0.06] hover:bg-white/[0.04] transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-white/40" />
        )}
      </button>
    </aside>
  );
}
