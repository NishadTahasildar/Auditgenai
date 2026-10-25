"use client";

import React, { useState } from "react";
import { Plus, Building2, MapPin, Check, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { SocietyItem } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface SocietiesTabProps {
  societies: SocietyItem[];
  selectedSocietyId: number | null;
  onSelectSociety: (id: number) => void;
  isSuperAdmin: boolean;
  dataLoading: boolean;
  // Creation Form props
  newSocName: string;
  setNewSocName: (v: string) => void;
  newSocAddress: string;
  setNewSocAddress: (v: string) => void;
  newSocCity: string;
  setNewSocCity: (v: string) => void;
  newSocState: string;
  setNewSocState: (v: string) => void;
  newSocPin: string;
  setNewSocPin: (v: string) => void;
  onCreateSociety: (e: React.FormEvent) => void;
  // Modify & Remove props
  onUpdateSociety: (
    id: number,
    payload: {
      name: string;
      registration_number?: string;
      address: string;
      city: string;
      state: string;
      postal_code: string;
    }
  ) => Promise<void>;
  onDeleteSociety: (id: number) => Promise<void>;
}

export function SocietiesTab({
  societies,
  selectedSocietyId,
  onSelectSociety,
  isSuperAdmin,
  dataLoading,
  newSocName,
  setNewSocName,
  newSocAddress,
  setNewSocAddress,
  newSocCity,
  setNewSocCity,
  newSocState,
  setNewSocState,
  newSocPin,
  setNewSocPin,
  onCreateSociety,
  onUpdateSociety,
  onDeleteSociety,
}: SocietiesTabProps) {
  // Edit Modal state
  const [editingSociety, setEditingSociety] = useState<SocietyItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegNo, setEditRegNo] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal state
  const [deletingSociety, setDeletingSociety] = useState<SocietyItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openEditModal = (s: SocietyItem) => {
    setEditingSociety(s);
    setEditName(s.name);
    setEditRegNo(s.registration_number || "");
    setEditAddress(s.address);
    setEditCity(s.city);
    setEditState(s.state);
    setEditPin(s.postal_code);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSociety) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await onUpdateSociety(editingSociety.id, {
        name: editName,
        registration_number: editRegNo || undefined,
        address: editAddress,
        city: editCity,
        state: editState,
        postal_code: editPin,
      });
      setEditingSociety(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update society");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSociety) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await onDeleteSociety(deletingSociety.id);
      setDeletingSociety(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete society");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Housing Societies
            </h2>
            {dataLoading && (
              <Badge variant="primary" size="xs">
                Syncing...
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSuperAdmin
              ? "System-wide directory of all provisioned housing societies"
              : "Registered societies where your account holds active membership"}
          </p>
        </div>
      </div>

      {/* Creation Card (Super Admin Only) */}
      {isSuperAdmin && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Register New Housing Society (Super Admin)</span>
            </div>
          }
          description="Provision a new cooperative housing society, apartment association, or welfare association entity"
        >
          <form onSubmit={onCreateSociety} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Society Legal Name"
                required
                value={newSocName}
                onChange={(e) => setNewSocName(e.target.value)}
                placeholder="e.g. Marvel Heights CHS"
              />
              <Input
                label="Registered Address"
                required
                value={newSocAddress}
                onChange={(e) => setNewSocAddress(e.target.value)}
                placeholder="e.g. 42 Main Avenue"
              />
              <Input
                label="City"
                required
                value={newSocCity}
                onChange={(e) => setNewSocCity(e.target.value)}
              />
              <Input
                label="State"
                required
                value={newSocState}
                onChange={(e) => setNewSocState(e.target.value)}
              />
              <Input
                label="Postal PIN Code"
                required
                value={newSocPin}
                onChange={(e) => setNewSocPin(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Provision Society
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Societies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {societies.map((s) => {
          const isSelected = selectedSocietyId === s.id;

          return (
            <div
              key={s.id}
              onClick={() => onSelectSociety(s.id)}
              className={`rounded-xl border p-5 cursor-pointer transition-all duration-150 relative ${
                isSelected
                  ? "bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm truncate">
                    {s.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isSelected ? (
                    <Badge variant="primary" size="xs">
                      <Check className="w-3 h-3 mr-1 inline" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="success" size="xs" dot>
                      Active
                    </Badge>
                  )}

                  {isSuperAdmin && (
                    <div
                      className="flex items-center gap-0.5 ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(s)}
                        title="Modify Society"
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingSociety(s);
                          setDeleteError(null);
                        }}
                        title="Remove Society"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3 mt-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{s.address}</span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {s.city}, {s.state}
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  PIN: {s.postal_code}
                </span>
              </div>
            </div>
          );
        })}

        {societies.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No societies enrolled</p>
            <p className="text-xs text-slate-500 mt-1">
              {isSuperAdmin
                ? "Register your first housing society using the form above."
                : "No society memberships assigned to this user."}
            </p>
          </div>
        )}
      </div>

      {/* Edit Society Modal */}
      <Modal
        isOpen={Boolean(editingSociety)}
        onClose={() => setEditingSociety(null)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Modify Society Details</span>
          </div>
        }
        description="Update legal identification, registered address, and locality coordinates"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
          {editError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Society Legal Name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Registration Number"
                value={editRegNo}
                onChange={(e) => setEditRegNo(e.target.value)}
                placeholder="e.g. REG-12345 (Optional)"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Registered Address"
                required
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <Input
              label="City"
              required
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
            <Input
              label="State"
              required
              value={editState}
              onChange={(e) => setEditState(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Postal PIN Code"
                required
                value={editPin}
                onChange={(e) => setEditPin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingSociety(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={editLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Society Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingSociety)}
        onClose={() => setDeletingSociety(null)}
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Remove Housing Society</span>
          </div>
        }
        description="This action is permanent and cannot be undone."
      >
        <div className="space-y-4 mt-2">
          {deleteError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {deleteError}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-white">
              &quot;{deletingSociety?.name}&quot;
            </span>
            ? All associated buildings, units, and resident associations will be
            permanently deleted.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingSociety(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
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
