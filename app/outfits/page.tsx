"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ItemImage } from "@/components/item-image";
import { EmptyState, SetupNotice } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClothingItem, Outfit } from "@/lib/types";

type OutfitWithItems = Outfit & { top: ClothingItem | null; bottom: ClothingItem | null; shoes: ClothingItem | null };

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("outfits").select("*, top:items!outfits_top_id_fkey(*), bottom:items!outfits_bottom_id_fkey(*), shoes:items!outfits_shoes_id_fkey(*)").order("created_at", { ascending: false });
    const rows = (data ?? []) as OutfitWithItems[];
    const paths = rows.flatMap((row) => [row.top, row.bottom, row.shoes]).filter(Boolean) as ClothingItem[];
    const signed = await Promise.all(paths.map(async (item) => ({ id: item.id, url: (await supabase.storage.from("clothing-items").createSignedUrl(item.image_url, 3600)).data?.signedUrl })));
    const urls = new Map(signed.map(({ id, url }) => [id, url]));
    setOutfits(rows.map((row) => ({ ...row, top: row.top ? { ...row.top, signed_url: urls.get(row.top.id) } : null, bottom: row.bottom ? { ...row.bottom, signed_url: urls.get(row.bottom.id) } : null, shoes: row.shoes ? { ...row.shoes, signed_url: urls.get(row.shoes.id) } : null })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("outfits").delete().eq("id", id);
    if (!error) setOutfits((current) => current.filter((outfit) => outfit.id !== id));
  }

  return (
    <div className="safe-top min-h-dvh px-5">
      <PageHeader title="Saved looks" back="/closet" />
      {!isSupabaseConfigured ? <div className="mt-8"><SetupNotice /></div> : loading ? (
        <div className="mt-8 h-72 animate-pulse rounded-[28px] bg-line/50" />
      ) : outfits.length === 0 ? (
        <div className="mt-7"><EmptyState title="No saved looks yet" body="Visit the outfit studio, swipe through your pieces and keep the combinations that feel right." action={<Link href="/builder" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper"><Plus size={16} /> Build a look</Link>} /></div>
      ) : (
        <div className="space-y-3 pb-6 pt-6">
          {outfits.map((outfit) => (
            <article key={outfit.id} className="rounded-[26px] border border-line bg-paper p-3">
              <div className="grid grid-cols-3 gap-2">
                {[outfit.top, outfit.bottom, outfit.shoes].map((item, index) => <ItemImage key={item?.id ?? index} src={item?.signed_url} alt={item?.name ?? "Empty outfit slot"} className="aspect-[3/4] rounded-[18px]" />)}
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-4">
                <div><h2 className="font-editorial text-xl">{outfit.name}</h2><p className="mt-1 text-[10px] uppercase tracking-[.17em] text-muted">{new Date(outfit.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p></div>
                <button onClick={() => remove(outfit.id)} aria-label={`Delete ${outfit.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted"><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
