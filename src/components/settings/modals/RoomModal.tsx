"use client";

import React, { useState, useEffect } from "react";
import { Room, RoomType, Branch } from "@/types";
import { X, DoorOpen, Building2, Users } from "lucide-react";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomData: Room) => void;
  editingRoom: Room | null;
  currentSchoolId: string;
  branches: Branch[];
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoom,
  currentSchoolId,
  branches,
}) => {
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("GENERAL");
  const [capacity, setCapacity] = useState(35);
  const [branchId, setBranchId] = useState("");
  const lastInitializedIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastInitializedIdRef.current = null;
      return;
    }

    const currentRoomId = editingRoom ? editingRoom.id : "__NEW_ROOM__";
    if (lastInitializedIdRef.current !== currentRoomId) {
      lastInitializedIdRef.current = currentRoomId;

      if (editingRoom) {
        setName(editingRoom.name);
        setRoomType(editingRoom.roomType);
        setCapacity(editingRoom.capacity);
        setBranchId(editingRoom.branchId);
      } else {
        setName("");
        setRoomType("GENERAL");
        setCapacity(35);
        setBranchId(branches[0]?.id || "");
      }
    }
  }, [isOpen, editingRoom?.id, editingRoom, branches]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const roomData: Room = {
      id: editingRoom ? editingRoom.id : `r_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      branchId: branchId || branches[0]?.id || "",
      name: name.trim(),
      roomType,
      capacity: Number(capacity),
    };

    onSave(roomData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingRoom ? "Xonani tahrirlash" : "Yangi xona qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Xona nomi, turi va sig'imini belgilang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Xona nomi / Raqami *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: 104-xona, Sport zal, Kimyo lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Xona turi
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                <option value="GENERAL">Umumiy sinf xonasi</option>
                <option value="GYM">Sport zal</option>
                <option value="COMP_LAB">Informatika xonasi</option>
                <option value="LAB">Laboratoriya xonasi</option>
                <option value="OUTDOOR_PITCH">Ochiq maydon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                O'quvchi sig'imi
              </label>
              <input
                type="number"
                min={5}
                max={150}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>
          </div>

          {branches.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Joylashgan bino (Filial)
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              {editingRoom ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
