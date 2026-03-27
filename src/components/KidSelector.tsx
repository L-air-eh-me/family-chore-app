"use client";

import type { Kid } from "@/lib/types";

type KidSelectorProps = {
  kids: Pick<Kid, "kidId" | "name">[];
  selectedKidId: string;
  onSelect: (kidId: string) => void;
};

export function KidSelector({ kids, selectedKidId, onSelect }: KidSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Choose your name
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kids.map((kid) => (
          <button
            key={kid.kidId}
            type="button"
            onClick={() => onSelect(kid.kidId)}
            className={`min-h-16 rounded-3xl border px-4 py-4 text-lg font-semibold transition ${
              selectedKidId === kid.kidId
                ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-400"
            }`}
          >
            {kid.name}
          </button>
        ))}
      </div>
    </div>
  );
}
