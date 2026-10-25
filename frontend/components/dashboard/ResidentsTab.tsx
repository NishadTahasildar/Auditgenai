"use client";

import React, { useState } from "react";
import { Plus, UserPlus, Users, Phone, Mail, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ResidentItem } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface ResidentsTabProps {
  residents: ResidentItem[];
  isSocietyAdmin: boolean;
  selectedSocietyId: number | null;
  dataLoading: boolean;
  // Resident Form
  newResName: string;
  setNewResName: (v: string) => void;
  newResPhone: string;
  setNewResPhone: (v: string) => void;
  newResEmail: string;
  setNewResEmail: (v: string) => void;
  onCreateResident: (e: React.FormEvent) => void;
  // Modify & Remove
  onUpdateResident: (
    id: number,
    payload: { full_name?: string; phone_number?: string; email?: string }
  ) => Promise<void>;
  onDeleteResident: (id: number) => Promise<void>;
}

export function ResidentsTab({
  residents,
  isSocietyAdmin,
  selectedSocietyId,
  dataLoading,
  newResName,
  setNewResName,
  newResPhone,
  setNewResPhone,
  newResEmail,
  setNewResEmail,
  onCreateResident,
  onUpdateResident,
  onDeleteResident,
}: ResidentsTabProps) {
  // Edit Resident state
  const [editingResident, setEditingResident] = useState<ResidentItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Resident state
  const [deletingResident, setDeletingResident] = useState<ResidentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openEditModal = (r: ResidentItem) => {
    setEditingResident(r);
    setEditName(r.full_name);
    setEditPhone(r.phone_number || "");
    setEditEmail(r.email || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await onUpdateResident(editingResident.id, {
        full_name: editName,
        phone_number: editPhone || undefined,
        email: editEmail || undefined,
      });
      setEditingResident(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update resident");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResident) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await onDeleteResident(deletingResident.id);
      setDeletingResident(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to remove resident");
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
              Society Residents
            </h2>
            {dataLoading && (
              <Badge variant="primary" size="xs">
                Syncing...
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Member roster and contact directory for the currently selected housing society.
          </p>
        </div>
      </div>

      {/* Add Resident Form (Society Admin) */}
      {isSocietyAdmin && selectedSocietyId && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Enroll Resident in Society</span>
            </div>
          }
          description="Register member profile with contact phone and email for notices and billing"
        >
          <form onSubmit={onCreateResident} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              label="Full Name"
              required
              value={newResName}
              onChange={(e) => setNewResName(e.target.value)}
              placeholder="e.g. Ramesh Patil"
            />
            <Input
              label="Phone Number"
              value={newResPhone}
              onChange={(e) => setNewResPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              icon={<Phone className="w-3.5 h-3.5" />}
            />
            <Input
              label="Email Address"
              type="email"
              value={newResEmail}
              onChange={(e) => setNewResEmail(e.target.value)}
              placeholder="e.g. ramesh@example.com"
              icon={<Mail className="w-3.5 h-3.5" />}
            />
            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                Add Resident
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Residents Table */}
      <div className="rounded-xl bg-slate-900/50 border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Full Name</th>
                <th className="px-5 py-3.5 font-semibold">Phone Contact</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">System User Link</th>
                {isSocietyAdmin && (
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {residents.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-300 font-semibold shrink-0">
                      {r.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{r.full_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-mono text-[11px]">
                    {r.phone_number || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {r.email ? (
                      <span className="font-mono text-[11px] text-slate-300">
                        {r.email}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.user_id ? (
                      <Badge variant="success" size="xs" dot>
                        Linked User #{r.user_id}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="xs">
                        Profile Only
                      </Badge>
                    )}
                  </td>
                  {isSocietyAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          title="Modify Resident"
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingResident(r);
                            setDeleteError(null);
                          }}
                          title="Remove Resident"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {residents.length === 0 && (
                <tr>
                  <td
                    colSpan={isSocietyAdmin ? 5 : 4}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <Users className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      No residents enrolled in this society yet.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Resident Modal */}
      <Modal
        isOpen={Boolean(editingResident)}
        onClose={() => setEditingResident(null)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Modify Resident Profile</span>
          </div>
        }
        description="Update personal details and communication contacts"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
          {editError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {editError}
            </div>
          )}

          <Input
            label="Full Name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            icon={<Phone className="w-3.5 h-3.5" />}
          />
          <Input
            label="Email Address"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            icon={<Mail className="w-3.5 h-3.5" />}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingResident(null)}
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

      {/* Delete Resident Modal */}
      <Modal
        isOpen={Boolean(deletingResident)}
        onClose={() => setDeletingResident(null)}
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Remove Resident Record</span>
          </div>
        }
        description="This will remove the resident profile and any linked flat occupancy records"
        maxWidth="max-w-md"
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
              &quot;{deletingResident?.full_name}&quot;
            </span>{" "}
            from the resident roster?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingResident(null)}
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
