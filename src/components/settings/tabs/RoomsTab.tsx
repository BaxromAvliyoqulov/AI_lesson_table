"use client";

import React, { useState, useMemo } from "react";
import { Room, Branch, RoomType } from "@/types";
import { DoorOpen, Plus, Search, Edit2, Trash2, Building2, Users } from "lucide-react";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";

interface RoomsTabProps {
  rooms: Room[];
  branches: Branch[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Oddiy sinf xonasi",
  GYM: "Sport zali",
  COMP_LAB: "Informatika xonasi",
  LAB: "Laboratoriya (Fizika/Kimyo)",
  OUTDOOR_PITCH: "Ochiq sport maydoni",
};

export const RoomsTab: React.FC<RoomsTabProps> = ({
  rooms,
  branches,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // O'chirish tasdiqlash modali va toast
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (typeFilter !== "ALL") {
      list = list.filter((r) => r.roomType === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms, typeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Xona nomi bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">Barcha xonalar ({rooms.length})</option>
            <option value="GENERAL">Umumiy sinf xonalari</option>
            <option value="GYM">Sport zallari</option>
            <option value="COMP_LAB">Informatika xonalari</option>
            <option value="LAB">Laboratoriyalar</option>
          </select>
        </div>

        <button
          onClick={onAddRoom}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi xona qo'shish</span>
        </button>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <DoorOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Xona topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini o'zgartiring yoki yangi xona qo'shing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredRooms.map((room) => {
            const branch = branchMap.get(room.branchId);

            return (
              <div
                key={room.id}
                className="flex flex-col justify-between p-4 rounded-3xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all min-w-0 overflow-hidden"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0">
                        <DoorOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-foreground text-sm truncate" title={room.name}>
                          {room.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{branch?.name || "Asosiy bino"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditRoom(room)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="shrink-0">Turi:</span>
                      <span className="font-semibold text-foreground shrink-0 text-right truncate">
                        {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="w-3 h-3 shrink-0" />
                        <span>Sig'imi:</span>
                      </span>
                      <span className="font-bold text-primary shrink-0">{room.capacity} o'quvchi</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TASDIQLASH MODALI (Zamonaviy UI Confirm) ── */}
      <ConfirmActionModal
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={() => {
          if (roomToDelete) {
            onDeleteRoom(roomToDelete.id);
            showToast(`"${roomToDelete.name}" xonasi muvaffaqiyatli o'chirildi`);
            setRoomToDelete(null);
          }
        }}
        title="Xonani o'chirish"
        description={`"${roomToDelete?.name}" xonasini o'chirishni tasdiqlaysizmi?`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* ── TOAST XABARNOMA ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-rose-600 text-white shadow-rose-600/30"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
