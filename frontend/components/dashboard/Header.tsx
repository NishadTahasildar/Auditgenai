import React from "react";
import Link from "next/link";
import { RefreshCw, UserCheck, LogIn, Building } from "lucide-react";
import { UserProfile, SocietyItem } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  societies: SocietyItem[];
  selectedSocietyId: number | null;
  onSelectSociety: (id: number) => void;
  currentUser: UserProfile | null;
  onRefreshHealth: () => void;
  healthLoading: boolean;
}

export function Header({
  societies,
  selectedSocietyId,
  onSelectSociety,
  currentUser,
  onRefreshHealth,
  healthLoading,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Environment & Society Selector */}
      <div className="flex items-center gap-3">
        <Badge variant="neutral" size="xs">
          Foundation Active
        </Badge>

        {selectedSocietyId && societies.length > 0 && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 hidden sm:inline">Society:</span>
            <select
              value={selectedSocietyId}
              onChange={(e) => onSelectSociety(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Health Probe & Profile Link */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefreshHealth}
          disabled={healthLoading}
          icon={
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${
                healthLoading ? "animate-spin" : ""
              }`}
            />
          }
        >
          <span>Probe Status</span>
        </Button>

        {currentUser ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium font-mono text-[11px]">{currentUser.email}</span>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
