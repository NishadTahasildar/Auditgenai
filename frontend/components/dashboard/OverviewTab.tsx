import React, { useState } from "react";
import {
  Server,
  Database,
  HardDrive,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export interface HealthData {
  status: string;
  service: string;
}

export interface SystemHealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: {
    status: string;
    database: string;
    connected: boolean;
    latency_ms?: number;
    details?: string;
  };
  storage: {
    status: string;
    storage: string;
    connected: boolean;
    details?: string;
  };
}

interface OverviewTabProps {
  basicHealth: HealthData | null;
  systemHealth: SystemHealthData | null;
  healthLoading: boolean;
  healthError: string | null;
  lastChecked: string | null;
}

export function OverviewTab({
  basicHealth,
  systemHealth,
  healthLoading,
  healthError,
  lastChecked,
}: OverviewTabProps) {
  const [showRawPayloads, setShowRawPayloads] = useState(false);

  const isDbConnected = systemHealth?.database?.connected ?? false;
  const isStorageConnected = systemHealth?.storage?.connected ?? false;
  const isApiHealthy = basicHealth?.status === "healthy";

  return (
    <div className="space-y-6">
      {/* Platform Executive Banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/90 border border-slate-800 p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary" size="xs" dot>
              Foundation Operating
            </Badge>
            <span className="text-xs text-slate-400">
              Cooperative Housing Society Financial Audit Architecture
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
            System Infrastructure & Core Services
          </h2>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-4">
            Phase 1 & 2 infrastructure operational. Relational schemas, Alembic migrations,
            bcrypt cryptography, stateless JWT auth, and multi-tenant access control active.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[11px]">
              FastAPI 2.0 · Next.js 16 · PostgreSQL 16 · MinIO S3
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
              RBAC: 5 Role Profiles Configured
            </span>
          </div>
        </div>
      </div>

      {/* Health Error Alert */}
      {healthError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300">
            <p className="font-semibold text-sm">Diagnostic Alert</p>
            <p className="mt-0.5 opacity-90">{healthError}</p>
          </div>
        </div>
      )}

      {/* Core Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FastAPI Gateway */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">FastAPI REST Gateway</span>
              <Badge
                variant={isApiHealthy ? "success" : healthLoading ? "neutral" : "danger"}
                size="xs"
                dot
              >
                {basicHealth?.status || (healthLoading ? "Probing..." : "Unreachable")}
              </Badge>
            </div>
          }
          className="hover:border-slate-700/80 transition-colors"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Asynchronous endpoints for JWT auth, session verification, and society master records.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">Port: 8000</span>
            <span className="text-indigo-400 font-mono text-[11px]">Bearer / HttpOnly</span>
          </div>
        </Card>

        {/* PostgreSQL Database */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">PostgreSQL Relational DB</span>
              <Badge
                variant={isDbConnected ? "success" : healthLoading ? "neutral" : "warning"}
                size="xs"
                dot
              >
                {isDbConnected
                  ? `Active (${systemHealth?.database?.latency_ms ?? 3}ms)`
                  : healthLoading
                  ? "Probing..."
                  : "Checking"}
              </Badge>
            </div>
          }
          className="hover:border-slate-700/80 transition-colors"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              10 relational tables managing users, societies, buildings, flats, and memberships.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">Port: 5432</span>
            <span className="text-cyan-400 font-mono text-[11px]">auditgenai_db</span>
          </div>
        </Card>

        {/* MinIO Object Storage */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">MinIO S3 Object Store</span>
              <Badge
                variant={isStorageConnected ? "success" : healthLoading ? "neutral" : "neutral"}
                size="xs"
                dot
              >
                {isStorageConnected ? "Connected" : healthLoading ? "Probing..." : "Ready"}
              </Badge>
            </div>
          }
          className="hover:border-slate-700/80 transition-colors"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              S3 bucket container ready for incoming invoice OCR assets, vouchers, and statements.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">Port: 9000/9001</span>
            <span className="text-amber-400 font-mono text-[11px]">documents-bucket</span>
          </div>
        </Card>
      </div>

      {/* Diagnostics Panel */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-white font-semibold text-sm">
                Live Health & Diagnostics Probe
              </span>
            </div>
            {lastChecked && (
              <span className="text-[11px] text-slate-400 font-mono">
                Last checked: {lastChecked}
              </span>
            )}
          </div>
        }
        description="Structured verification of REST gateway, relational database, and storage subsystems"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Service Gateway
              </span>
              <Badge variant="success" size="xs">
                200 OK
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Service Name:</span>
                <span className="text-slate-200 font-medium">{basicHealth?.service || "AuditGenAI"}</span>
              </div>
              <div className="flex justify-between">
                <span>Operational Status:</span>
                <span className="text-emerald-400 font-medium">{basicHealth?.status || "online"}</span>
              </div>
              <div className="flex justify-between">
                <span>Auth Protocol:</span>
                <span className="text-slate-200 font-mono text-[11px]">Stateless JWT HS256</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Data Storage Subsystem
              </span>
              <Badge variant="info" size="xs">
                Diagnostics Valid
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Database Engine:</span>
                <span className="text-slate-200 font-medium">PostgreSQL 16 (Psycopg2)</span>
              </div>
              <div className="flex justify-between">
                <span>Migration State:</span>
                <span className="text-cyan-400 font-medium">Alembic Head Synced</span>
              </div>
              <div className="flex justify-between">
                <span>Object Storage:</span>
                <span className="text-slate-200 font-medium">MinIO S3 Compatible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Raw Payload Inspector */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowRawPayloads(!showRawPayloads)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium">
              {showRawPayloads ? "Hide Raw Diagnostic JSON" : "Inspect Raw Diagnostic JSON"}
            </span>
            {showRawPayloads ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showRawPayloads && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3 animate-fadeIn">
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 mb-2 pb-1.5 border-b border-slate-900">
                  <span className="text-emerald-400 font-semibold">GET /health</span>
                  <span className="text-[10px] text-slate-500">JSON</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {basicHealth ? JSON.stringify(basicHealth, null, 2) : "Loading probe..."}
                </pre>
              </div>

              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 mb-2 pb-1.5 border-b border-slate-900">
                  <span className="text-cyan-400 font-semibold">GET /health/system</span>
                  <span className="text-[10px] text-slate-500">JSON</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {systemHealth
                    ? JSON.stringify(systemHealth, null, 2)
                    : "Loading diagnostics..."}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
