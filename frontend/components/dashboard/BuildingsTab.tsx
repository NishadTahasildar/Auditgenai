"use client";

import React, { useState } from "react";
import { Plus, Home, Layers, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { BuildingItem, FlatItem } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface BuildingsTabProps {
  buildings: BuildingItem[];
  selectedBuildingId: number | null;
  onSelectBuilding: (id: number) => void;
  flats: FlatItem[];
  isSocietyAdmin: boolean;
  selectedSocietyId: number | null;
  dataLoading: boolean;
  // Building Form
  newBldName: string;
  setNewBldName: (v: string) => void;
  onCreateBuilding: (e: React.FormEvent) => void;
  // Flat Form
  newFlatNum: string;
  setNewFlatNum: (v: string) => void;
  newFlatFloor: number;
  setNewFlatFloor: (v: number) => void;
  newFlatArea: number;
  setNewFlatArea: (v: number) => void;
  onCreateFlat: (e: React.FormEvent) => void;
  // Modify & Remove Building
  onUpdateBuilding: (id: number, name: string) => Promise<void>;
  onDeleteBuilding: (id: number) => Promise<void>;
  // Modify & Remove Flat
  onUpdateFlat: (
    id: number,
    payload: { flat_number?: string; floor_number?: number; area_sqft?: number }
  ) => Promise<void>;
  onDeleteFlat: (id: number) => Promise<void>;
}

export function BuildingsTab({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  flats,
  isSocietyAdmin,
  selectedSocietyId,
  dataLoading,
  newBldName,
  setNewBldName,
  onCreateBuilding,
  newFlatNum,
  setNewFlatNum,
  newFlatFloor,
  setNewFlatFloor,
  newFlatArea,
  setNewFlatArea,
  onCreateFlat,
  onUpdateBuilding,
  onDeleteBuilding,
  onUpdateFlat,
  onDeleteFlat,
}: BuildingsTabProps) {
  // Building Edit/Delete state
  const [editingBuilding, setEditingBuilding] = useState<BuildingItem | null>(null);
  const [editBldName, setEditBldName] = useState("");
  const [editBldLoading, setEditBldLoading] = useState(false);
  const [editBldError, setEditBldError] = useState<string | null>(null);

  const [deletingBuilding, setDeletingBuilding] = useState<BuildingItem | null>(null);
  const [deleteBldLoading, setDeleteBldLoading] = useState(false);
  const [deleteBldError, setDeleteBldError] = useState<string | null>(null);

  // Flat Edit/Delete state
  const [editingFlat, setEditingFlat] = useState<FlatItem | null>(null);
  const [editFlatNum, setEditFlatNum] = useState("");
  const [editFlatFloor, setEditFlatFloor] = useState<number>(1);
  const [editFlatArea, setEditFlatArea] = useState<number>(850);
  const [editFlatLoading, setEditFlatLoading] = useState(false);
  const [editFlatError, setEditFlatError] = useState<string | null>(null);

  const [deletingFlat, setDeletingFlat] = useState<FlatItem | null>(null);
  const [deleteFlatLoading, setDeleteFlatLoading] = useState(false);
  const [deleteFlatError, setDeleteFlatError] = useState<string | null>(null);

  // Building handlers
  const openEditBuilding = (b: BuildingItem) => {
    setEditingBuilding(b);
    setEditBldName(b.name);
    setEditBldError(null);
  };

  const handleSaveBuildingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding) return;
    setEditBldLoading(true);
    setEditBldError(null);
    try {
      await onUpdateBuilding(editingBuilding.id, editBldName);
      setEditingBuilding(null);
    } catch (err: unknown) {
      setEditBldError(err instanceof Error ? err.message : "Failed to update building");
    } finally {
      setEditBldLoading(false);
    }
  };

  const handleConfirmDeleteBuilding = async () => {
    if (!deletingBuilding) return;
    setDeleteBldLoading(true);
    setDeleteBldError(null);
    try {
      await onDeleteBuilding(deletingBuilding.id);
      setDeletingBuilding(null);
    } catch (err: unknown) {
      setDeleteBldError(err instanceof Error ? err.message : "Failed to delete building");
    } finally {
      setDeleteBldLoading(false);
    }
  };

  // Flat handlers
  const openEditFlat = (f: FlatItem) => {
    setEditingFlat(f);
    setEditFlatNum(f.flat_number);
    setEditFlatFloor(f.floor_number ?? 1);
    setEditFlatArea(f.area_sqft ?? 850);
    setEditFlatError(null);
  };

  const handleSaveFlatEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlat) return;
    setEditFlatLoading(true);
    setEditFlatError(null);
    try {
      await onUpdateFlat(editingFlat.id, {
        flat_number: editFlatNum,
        floor_number: Number(editFlatFloor),
        area_sqft: Number(editFlatArea),
      });
      setEditingFlat(null);
    } catch (err: unknown) {
      setEditFlatError(err instanceof Error ? err.message : "Failed to update flat");
    } finally {
      setEditFlatLoading(false);
    }
  };

  const handleConfirmDeleteFlat = async () => {
    if (!deletingFlat) return;
    setDeleteFlatLoading(true);
    setDeleteFlatError(null);
    try {
      await onDeleteFlat(deletingFlat.id);
      setDeletingFlat(null);
    } catch (err: unknown) {
      setDeleteFlatError(err instanceof Error ? err.message : "Failed to delete flat");
    } finally {
      setDeleteFlatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Buildings & Flats
            </h2>
            {dataLoading && (
              <Badge variant="primary" size="xs">
                Syncing...
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage society wings, towers, and apartment units with floor and area metrics.
          </p>
        </div>
      </div>

      {/* Add Building Form (Society Admin) */}
      {isSocietyAdmin && selectedSocietyId && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Building / Wing to Society</span>
            </div>
          }
          description="Register a building, tower, or wing within the currently selected housing society"
        >
          <form onSubmit={onCreateBuilding} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                required
                value={newBldName}
                onChange={(e) => setNewBldName(e.target.value)}
                placeholder="Building Name (e.g. Tower A, Wing B)"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Building
            </Button>
          </form>
        </Card>
      )}

      {/* Buildings & Flats Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Buildings Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Buildings ({buildings.length})
            </h3>
            <span className="text-[11px] text-slate-500">Select to view flats</span>
          </div>

          <div className="space-y-2">
            {buildings.map((b) => {
              const isSelected = selectedBuildingId === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBuilding(b.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-150 flex items-center justify-between text-xs group ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 text-white shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 mr-2">
                    <Home
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-indigo-400" : "text-slate-500"
                      }`}
                    />
                    <span className="font-medium text-slate-200 truncate">{b.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={isSelected ? "primary" : "neutral"} size="xs">
                      {b.flats_count} Units
                    </Badge>

                    {isSocietyAdmin && (
                      <div
                        className="flex items-center gap-0.5 ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditBuilding(b)}
                          title="Modify Building"
                          className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingBuilding(b);
                            setDeleteBldError(null);
                          }}
                          title="Remove Building"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {buildings.length === 0 && (
              <div className="p-6 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/20">
                <p className="text-xs text-slate-400">No buildings registered yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Flats Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Units in Selected Wing ({flats.length})
            </h3>
          </div>

          {/* Add Flat Form */}
          {isSocietyAdmin && selectedBuildingId && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Create Unit in Selected Building</span>
                </div>
              }
              description="Register flat number (enforces uniqueness per building), floor, and carpet area"
            >
              <form onSubmit={onCreateFlat} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  label="Flat / Unit #"
                  required
                  value={newFlatNum}
                  onChange={(e) => setNewFlatNum(e.target.value)}
                  placeholder="e.g. 101"
                />
                <Input
                  label="Floor Number"
                  type="number"
                  value={newFlatFloor}
                  onChange={(e) => setNewFlatFloor(Number(e.target.value))}
                />
                <Input
                  label="Area (sq.ft)"
                  type="number"
                  value={newFlatArea}
                  onChange={(e) => setNewFlatArea(Number(e.target.value))}
                />
                <div className="flex items-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Flat
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Flats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {flats.map((f) => (
              <div
                key={f.id}
                className="group p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors text-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">
                    Flat {f.flat_number}
                  </span>
                  <Badge variant="neutral" size="xs">
                    {f.area_sqft ? `${f.area_sqft} sq.ft` : "Standard"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800/60">
                  <span>Floor {f.floor_number ?? "N/A"}</span>
                  {isSocietyAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditFlat(f)}
                        title="Modify Flat"
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingFlat(f);
                          setDeleteFlatError(null);
                        }}
                        title="Remove Flat"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {flats.length === 0 && (
              <div className="col-span-full py-10 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/20">
                <p className="text-xs text-slate-400">
                  {selectedBuildingId
                    ? "No flats registered in this building yet."
                    : "Select a building to view units."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Building Modal */}
      <Modal
        isOpen={Boolean(editingBuilding)}
        onClose={() => setEditingBuilding(null)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Modify Building / Wing</span>
          </div>
        }
        description="Rename this building or wing in the housing society"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBuildingEdit} className="space-y-4 mt-2">
          {editBldError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {editBldError}
            </div>
          )}

          <Input
            label="Building / Wing Name"
            required
            value={editBldName}
            onChange={(e) => setEditBldName(e.target.value)}
            placeholder="e.g. Tower A"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingBuilding(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={editBldLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Building Modal */}
      <Modal
        isOpen={Boolean(deletingBuilding)}
        onClose={() => setDeletingBuilding(null)}
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Remove Building / Wing</span>
          </div>
        }
        description="Deleting this building will remove all flats and resident assignments within it"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 mt-2">
          {deleteBldError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {deleteBldError}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-white">
              &quot;{deletingBuilding?.name}&quot;
            </span>
            ? This action cannot be reversed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingBuilding(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={deleteBldLoading}
              onClick={handleConfirmDeleteBuilding}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Flat Modal */}
      <Modal
        isOpen={Boolean(editingFlat)}
        onClose={() => setEditingFlat(null)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Modify Unit / Flat</span>
          </div>
        }
        description="Update unit identifier, floor level, and carpet area"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveFlatEdit} className="space-y-4 mt-2">
          {editFlatError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {editFlatError}
            </div>
          )}

          <Input
            label="Flat / Unit #"
            required
            value={editFlatNum}
            onChange={(e) => setEditFlatNum(e.target.value)}
          />
          <Input
            label="Floor Number"
            type="number"
            value={editFlatFloor}
            onChange={(e) => setEditFlatFloor(Number(e.target.value))}
          />
          <Input
            label="Area (sq.ft)"
            type="number"
            value={editFlatArea}
            onChange={(e) => setEditFlatArea(Number(e.target.value))}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingFlat(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={editFlatLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Flat Modal */}
      <Modal
        isOpen={Boolean(deletingFlat)}
        onClose={() => setDeletingFlat(null)}
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Remove Unit / Flat</span>
          </div>
        }
        description="This action will delete the flat and any linked resident associations"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 mt-2">
          {deleteFlatError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {deleteFlatError}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-white">
              Flat {deletingFlat?.flat_number}
            </span>
            ?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingFlat(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={deleteFlatLoading}
              onClick={handleConfirmDeleteFlat}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
