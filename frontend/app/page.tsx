"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  fetchCurrentUser,
  logoutUser,
  fetchSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
  fetchBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  fetchFlats,
  createFlat,
  updateFlat,
  deleteFlat,
  fetchResidents,
  createResident,
  updateResident,
  deleteResident,
  UserProfile,
  SocietyItem,
  BuildingItem,
  FlatItem,
  ResidentItem,
} from "@/lib/api";
import { Sidebar, TabKey } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import {
  OverviewTab,
  HealthData,
  SystemHealthData,
} from "@/components/dashboard/OverviewTab";
import { SocietiesTab } from "@/components/dashboard/SocietiesTab";
import { BuildingsTab } from "@/components/dashboard/BuildingsTab";
import { ResidentsTab } from "@/components/dashboard/ResidentsTab";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Active module tab
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Health Diagnostics
  const [basicHealth, setBasicHealth] = useState<HealthData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Master Data state
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick creation forms state
  const [newSocName, setNewSocName] = useState("");
  const [newSocAddress, setNewSocAddress] = useState("");
  const [newSocCity, setNewSocCity] = useState("Pune");
  const [newSocState, setNewSocState] = useState("Maharashtra");
  const [newSocPin, setNewSocPin] = useState("411001");

  const [newBldName, setNewBldName] = useState("");
  const [newFlatNum, setNewFlatNum] = useState("");
  const [newFlatFloor, setNewFlatFloor] = useState<number>(1);
  const [newFlatArea, setNewFlatArea] = useState<number>(850);

  const [newResName, setNewResName] = useState("");
  const [newResPhone, setNewResPhone] = useState("");
  const [newResEmail, setNewResEmail] = useState("");

  // Check current authenticated user
  const checkAuth = useCallback(async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Fetch health checks (manual trigger)
  const fetchHealthChecks = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const [resBasic, resSys] = await Promise.all([
        fetch(`${API_URL}/health`),
        fetch(`${API_URL}/health/system`),
      ]);

      if (!resBasic.ok) throw new Error(`FastAPI basic check failed (${resBasic.status})`);
      if (!resSys.ok) throw new Error(`FastAPI system check failed (${resSys.status})`);

      const dataBasic: HealthData = await resBasic.json();
      const dataSys: SystemHealthData = await resSys.json();

      setBasicHealth(dataBasic);
      setSystemHealth(dataSys);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unable to reach FastAPI backend";
      setHealthError(errMsg);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Load societies
  const loadSocieties = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const socs = await fetchSocieties();
      setSocieties(socs);
      if (socs.length > 0) {
        setSelectedSocietyId((prev) => (prev !== null ? prev : socs[0].id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load societies";
      setActionError(msg);
    } finally {
      setDataLoading(false);
    }
  }, [currentUser]);

  // Load buildings for active society
  const loadBuildings = useCallback(async (socId: number) => {
    setDataLoading(true);
    try {
      const blds = await fetchBuildings(socId);
      setBuildings(blds);
      if (blds.length > 0) {
        setSelectedBuildingId(blds[0].id);
      } else {
        setSelectedBuildingId(null);
        setFlats([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load buildings";
      setActionError(msg);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load flats for active building
  const loadFlats = useCallback(async (bldId: number) => {
    setDataLoading(true);
    try {
      const flts = await fetchFlats(bldId);
      setFlats(flts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load flats";
      setActionError(msg);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load residents for active society
  const loadResidents = useCallback(async (socId: number) => {
    setDataLoading(true);
    try {
      const resList = await fetchResidents(socId);
      setResidents(resList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load residents";
      setActionError(msg);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Auth check on mount with cancellation guard (clean React 19 effect)
  useEffect(() => {
    let isCancelled = false;
    async function initAuth() {
      try {
        const user = await fetchCurrentUser();
        if (!isCancelled) setCurrentUser(user);
      } catch {
        if (!isCancelled) setCurrentUser(null);
      } finally {
        if (!isCancelled) setAuthLoading(false);
      }
    }
    initAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Health check on mount + 30s polling
  useEffect(() => {
    let isCancelled = false;
    async function runProbe() {
      try {
        const [resBasic, resSys] = await Promise.all([
          fetch(`${API_URL}/health`),
          fetch(`${API_URL}/health/system`),
        ]);

        if (!resBasic.ok) throw new Error(`FastAPI basic check failed (${resBasic.status})`);
        if (!resSys.ok) throw new Error(`FastAPI system check failed (${resSys.status})`);

        const dataBasic: HealthData = await resBasic.json();
        const dataSys: SystemHealthData = await resSys.json();

        if (!isCancelled) {
          setBasicHealth(dataBasic);
          setSystemHealth(dataSys);
          setLastChecked(new Date().toLocaleTimeString());
          setHealthLoading(false);
          setHealthError(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errMsg = err instanceof Error ? err.message : "Unable to reach FastAPI backend";
          setHealthError(errMsg);
          setHealthLoading(false);
        }
      }
    }

    runProbe();
    const interval = setInterval(runProbe, 30_000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Load societies — waits until auth is confirmed
  useEffect(() => {
    if (authLoading || !currentUser) return;
    let isMounted = true;
    async function initSocs() {
      try {
        const socs = await fetchSocieties();
        if (isMounted) {
          setSocieties(socs);
          setSelectedSocietyId((prev) => (prev !== null ? prev : socs.length > 0 ? socs[0].id : null));
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load societies";
          setActionError(msg);
        }
      }
    }
    initSocs();
    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading]);

  // When selected society changes, load buildings and residents asynchronously
  useEffect(() => {
    if (!selectedSocietyId) return;
    const socId = selectedSocietyId;
    let isMounted = true;
    async function initSocietyData() {
      try {
        const [blds, resList] = await Promise.all([
          fetchBuildings(socId),
          fetchResidents(socId),
        ]);
        if (isMounted) {
          setBuildings(blds);
          setSelectedBuildingId(blds.length > 0 ? blds[0].id : null);
          setResidents(resList);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load society data";
          setActionError(msg);
        }
      }
    }
    initSocietyData();
    return () => {
      isMounted = false;
    };
  }, [selectedSocietyId]);

  // When selected building changes, load flats asynchronously
  useEffect(() => {
    if (!selectedBuildingId) return;
    const bldId = selectedBuildingId;
    let isMounted = true;
    async function initFlats() {
      try {
        const flts = await fetchFlats(bldId);
        if (isMounted) setFlats(flts);
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load flats";
          setActionError(msg);
        }
      }
    }
    initFlats();
    return () => {
      isMounted = false;
    };
  }, [selectedBuildingId]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSocieties([]);
    setSelectedSocietyId(null);
    setBuildings([]);
    setFlats([]);
    setResidents([]);
    setActiveTab("overview");
  };

  // Creation Handlers
  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      const created = await createSociety({
        name: newSocName,
        address: newSocAddress,
        city: newSocCity,
        state: newSocState,
        postal_code: newSocPin,
      });
      setActionSuccess(`Society '${created.name}' created successfully!`);
      setNewSocName("");
      setNewSocAddress("");
      loadSocieties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create society";
      setActionError(msg);
    }
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocietyId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const bld = await createBuilding(selectedSocietyId, newBldName);
      setActionSuccess(`Building '${bld.name}' created!`);
      setNewBldName("");
      loadBuildings(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create building";
      setActionError(msg);
    }
  };

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const flt = await createFlat(selectedBuildingId, {
        flat_number: newFlatNum,
        floor_number: Number(newFlatFloor),
        area_sqft: Number(newFlatArea),
      });
      setActionSuccess(`Flat '${flt.flat_number}' created!`);
      setNewFlatNum("");
      loadFlats(selectedBuildingId);
      if (selectedSocietyId) loadBuildings(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create flat";
      setActionError(msg);
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocietyId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const resObj = await createResident(selectedSocietyId, {
        full_name: newResName,
        phone_number: newResPhone,
        email: newResEmail,
      });
      setActionSuccess(`Resident '${resObj.full_name}' enrolled!`);
      setNewResName("");
      setNewResPhone("");
      setNewResEmail("");
      loadResidents(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create resident";
      setActionError(msg);
    }
  };

  // Modify & Remove Handlers
  const handleUpdateSociety = async (
    id: number,
    payload: {
      name: string;
      registration_number?: string;
      address: string;
      city: string;
      state: string;
      postal_code: string;
    }
  ) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateSociety(id, payload);
      setActionSuccess(`Society '${updated.name}' updated successfully!`);
      await loadSocieties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update society";
      setActionError(msg);
      throw err;
    }
  };

  const handleDeleteSociety = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await deleteSociety(id);
      setActionSuccess(res.message || "Society deleted successfully!");
      if (selectedSocietyId === id) {
        setSelectedSocietyId(null);
        setBuildings([]);
        setFlats([]);
        setResidents([]);
      }
      await loadSocieties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete society";
      setActionError(msg);
      throw err;
    }
  };

  const handleUpdateBuilding = async (id: number, name: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateBuilding(id, name);
      setActionSuccess(`Building renamed to '${updated.name}'!`);
      if (selectedSocietyId) await loadBuildings(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update building";
      setActionError(msg);
      throw err;
    }
  };

  const handleDeleteBuilding = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await deleteBuilding(id);
      setActionSuccess(res.message || "Building deleted successfully!");
      if (selectedBuildingId === id) {
        setSelectedBuildingId(null);
        setFlats([]);
      }
      if (selectedSocietyId) await loadBuildings(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete building";
      setActionError(msg);
      throw err;
    }
  };

  const handleUpdateFlat = async (
    id: number,
    payload: { flat_number?: string; floor_number?: number; area_sqft?: number }
  ) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateFlat(id, payload);
      setActionSuccess(`Flat '${updated.flat_number}' updated!`);
      if (selectedBuildingId) await loadFlats(selectedBuildingId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update flat";
      setActionError(msg);
      throw err;
    }
  };

  const handleDeleteFlat = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await deleteFlat(id);
      setActionSuccess(res.message || "Flat deleted successfully!");
      if (selectedBuildingId) await loadFlats(selectedBuildingId);
      if (selectedSocietyId) await loadBuildings(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete flat";
      setActionError(msg);
      throw err;
    }
  };

  const handleUpdateResident = async (
    id: number,
    payload: { full_name?: string; phone_number?: string; email?: string }
  ) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateResident(id, payload);
      setActionSuccess(`Resident '${updated.full_name}' updated!`);
      if (selectedSocietyId) await loadResidents(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update resident";
      setActionError(msg);
      throw err;
    }
  };

  const handleDeleteResident = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await deleteResident(id);
      setActionSuccess(res.message || "Resident removed successfully!");
      if (selectedSocietyId) await loadResidents(selectedSocietyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove resident";
      setActionError(msg);
      throw err;
    }
  };

  const isSuperAdmin = currentUser?.is_super_admin ?? false;
  const isSocietyAdmin =
    isSuperAdmin ||
    Boolean(
      currentUser?.roles.some(
        (r) =>
          r.role === "SOCIETY_ADMIN" &&
          (!selectedSocietyId || r.society_id === selectedSocietyId)
      )
    );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        authLoading={authLoading}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          societies={societies}
          selectedSocietyId={selectedSocietyId}
          onSelectSociety={setSelectedSocietyId}
          currentUser={currentUser}
          onRefreshHealth={() => {
            checkAuth();
            fetchHealthChecks();
          }}
          healthLoading={healthLoading}
        />

        {/* Global Action Notifications */}
        {actionError && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span className="font-medium">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-3 font-semibold"
            >
              ✕
            </button>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span className="font-medium">{actionSuccess}</span>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-3 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab View Routing */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && (
            <OverviewTab
              basicHealth={basicHealth}
              systemHealth={systemHealth}
              healthLoading={healthLoading}
              healthError={healthError}
              lastChecked={lastChecked}
            />
          )}

          {activeTab === "societies" && currentUser && (
            <SocietiesTab
              societies={societies}
              selectedSocietyId={selectedSocietyId}
              onSelectSociety={setSelectedSocietyId}
              isSuperAdmin={isSuperAdmin}
              dataLoading={dataLoading}
              newSocName={newSocName}
              setNewSocName={setNewSocName}
              newSocAddress={newSocAddress}
              setNewSocAddress={setNewSocAddress}
              newSocCity={newSocCity}
              setNewSocCity={setNewSocCity}
              newSocState={newSocState}
              setNewSocState={setNewSocState}
              newSocPin={newSocPin}
              setNewSocPin={setNewSocPin}
              onCreateSociety={handleCreateSociety}
              onUpdateSociety={handleUpdateSociety}
              onDeleteSociety={handleDeleteSociety}
            />
          )}

          {activeTab === "buildings" && currentUser && (
            <BuildingsTab
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={setSelectedBuildingId}
              flats={flats}
              isSocietyAdmin={isSocietyAdmin}
              selectedSocietyId={selectedSocietyId}
              dataLoading={dataLoading}
              newBldName={newBldName}
              setNewBldName={setNewBldName}
              onCreateBuilding={handleCreateBuilding}
              newFlatNum={newFlatNum}
              setNewFlatNum={setNewFlatNum}
              newFlatFloor={newFlatFloor}
              setNewFlatFloor={setNewFlatFloor}
              newFlatArea={newFlatArea}
              setNewFlatArea={setNewFlatArea}
              onCreateFlat={handleCreateFlat}
              onUpdateBuilding={handleUpdateBuilding}
              onDeleteBuilding={handleDeleteBuilding}
              onUpdateFlat={handleUpdateFlat}
              onDeleteFlat={handleDeleteFlat}
            />
          )}

          {activeTab === "residents" && currentUser && (
            <ResidentsTab
              residents={residents}
              isSocietyAdmin={isSocietyAdmin}
              selectedSocietyId={selectedSocietyId}
              dataLoading={dataLoading}
              newResName={newResName}
              setNewResName={setNewResName}
              newResPhone={newResPhone}
              setNewResPhone={setNewResPhone}
              newResEmail={newResEmail}
              setNewResEmail={setNewResEmail}
              onCreateResident={handleCreateResident}
              onUpdateResident={handleUpdateResident}
              onDeleteResident={handleDeleteResident}
            />
          )}
        </main>
      </div>
    </div>
  );
}
