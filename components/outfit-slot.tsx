"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ClothingItem } from "@/lib/types";
import { ItemImage } from "@/components/item-image";

export function OutfitSlot({ label, items, index, onChange }: { label: string; items: ClothingItem[]; index: number; onChange: (index: number) => void }) {
  const item = items[index];
  const go = (offset: number) => {
    if (!items.length) return;
    onChange((index + offset + items.length) % items.length);
  };

  return (
    <section aria-label={`${label} selector`} className="relative overflow-hidden rounded-[24px] border border-line/80 bg-paper">
      <div className="absolute left-4 top-3 z-10 text-[9px] font-semibold uppercase tracking-[.23em] text-muted">{label}</div>
      {item ? (
        <>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={item.id} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.32} onDragEnd={(_, info) => { if (info.offset.x < -45) go(1); if (info.offset.x > 45) go(-1); }} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .18 }} style={{ touchAction: "pan-y" }} className="h-full cursor-grab active:cursor-grabbing">
              <ItemImage src={item.signed_url} alt={item.name} className="h-40 w-full bg-transparent pt-6" />
              <div className="absolute inset-x-12 bottom-3 truncate text-center text-xs font-medium">{item.name}</div>
            </motion.div>
          </AnimatePresence>
          {items.length > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label={`Previous ${label}`} className="absolute bottom-2 left-2 z-20 grid min-h-11 min-w-11 place-items-center rounded-full text-muted"><ChevronLeft size={20} /></button>
              <button onClick={() => go(1)} aria-label={`Next ${label}`} className="absolute bottom-2 right-2 z-20 grid min-h-11 min-w-11 place-items-center rounded-full text-muted"><ChevronRight size={20} /></button>
            </>
          )}
        </>
      ) : (
        <Link href="/add" className="flex h-40 flex-col items-center justify-center gap-2 pt-4 text-sm text-muted"><span className="grid h-11 w-11 place-items-center rounded-full border border-line"><Plus size={18} /></span>Add {label.toLowerCase()}</Link>
      )}
    </section>
  );
}
