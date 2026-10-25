import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Activity,
  Building2,
  Home,
  Users,
  CreditCard,
  Receipt,
  Sparkles,
  FileCheck2,
  LogIn,
  LogOut,
} from "lucide-react";
import { UserProfile } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

export type TabKey = "overview" | "societies" | "buildings" | "residents";

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  currentUser: UserProfile | null;
  authLoading: boolean;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  currentUser,
  authLoading,
  onLogout,
}: SidebarProps) {
  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge: string; requiresAuth: boolean }[] = [
    {
      key: "overview",
      label: "System Health",
      icon: <Activity className="w-4 h-4 text-indigo-400" />,
      badge: "Core",
      requiresAuth: false,
    },
    {
      key: "societies",
      label: "Housing Societies",
      icon: <Building2 className="w-4 h-4 text-slate-300" />,
      badge: "Master",
      requiresAuth: true,
    },
    {
      key: "buildings",
      label: "Buildings & Flats",
      icon: <Home className="w-4 h-4 text-slate-300" />,
      badge: "Roster",
      requiresAuth: true,
    },
    {
      key: "residents",
      label: "Residents Roster",
      icon: <Users className="w-4 h-4 text-slate-300" />,
      badge: "Roster",
      requiresAuth: true,
    },
  ];

  const futureModules = [
    { label: "Billing Engine", icon: <CreditCard className="w-3.5 h-3.5" />, phase: "Phase 3" },
    { label: "Expense & Vendor", icon: <Receipt className="w-3.5 h-3.5" />, phase: "Phase 3" },
    { label: "AI Audit Intelligence", icon: <Sparkles className="w-3.5 h-3.5" />, phase: "Phase 4" },
    { label: "Audit Reports & Trail", icon: <FileCheck2 className="w-3.5 h-3.5" />, phase: "Phase 5" },
  ];

  return (
    <aside className="w-72 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                AuditGenAI
              </span>
              <Badge variant="primary" size="xs">P2</Badge>
            </div>
            <p className="text-[11px] text-slate-400">Society Financial Audit</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 text-xs">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Active Modules
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const isDisabled = item.requiresAuth && !currentUser;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => !isDisabled && onSelectTab(item.key)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                  isDisabled
                    ? "opacity-35 cursor-not-allowed text-slate-500"
                    : isActive
                    ? "bg-indigo-600/15 text-indigo-200 font-medium border border-indigo-500/25 shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <Badge
                  variant={isActive ? "primary" : "neutral"}
                  size="xs"
                >
                  {item.badge}
                </Badge>
              </button>
            );
          })}

          {/* Future Modules */}
          <div className="pt-5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Modules
          </div>
          {futureModules.map((fm) => (
            <div
              key={fm.label}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-600">{fm.icon}</span>
                <span>{fm.label}</span>
              </div>
              <Badge variant="neutral" size="xs">
                {fm.phase}
              </Badge>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        {authLoading ? (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-500 animate-pulse text-[11px]">
              Verifying session...
            </span>
          </div>
        ) : currentUser ? (
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 truncate text-xs">
                {currentUser.full_name}
              </span>
              <Badge
                variant={currentUser.is_super_admin ? "primary" : "default"}
                size="xs"
              >
                {currentUser.is_super_admin
                  ? "SUPER_ADMIN"
                  : currentUser.roles[0]?.role || "MEMBER"}
              </Badge>
            </div>
            <p className="text-slate-400 truncate text-[11px] font-mono">
              {currentUser.email}
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] border border-slate-700/60 font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 text-xs space-y-2">
            <p className="text-slate-400 text-[11px]">Sign in to access management rosters</p>
            <Link
              href="/login"
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] shadow-sm shadow-indigo-600/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
