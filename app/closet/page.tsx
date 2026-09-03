"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Plus, Settings2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signItemImages } from "@/lib/supabase/images";
import type { Category, ClothingItem } from "@/lib/types";
import { ItemImage } from "@/components/item-image";
import { EmptyState, SetupNotice } from "@/components/ui";

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    Promise.all([
      supabase.from("items").select("*, category:categories(name, slug)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("kind", "category").order("is_system", { ascending: false }).order("name"),
    ]).then(async ([itemResult, categoryResult]) => {
      if (itemResult.data) setItems(await signItemImages(supabase, itemResult.data as ClothingItem[]));
      if (categoryResult.data) setCategories(categoryResult.data as Category[]);
      setLoading(false);
    });
  }, []);

  const visibleItems = useMemo(() => filter === "all" ? items : items.filter((item) => item.category?.slug === filter), [items, filter]);

  return (
    <div className="safe-top min-h-dvh px-5">
      <header className="flex items-center justify-between py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-muted">Forme</p>
          <h1 className="font-editorial text-[40px] leading-none tracking-[-.04em]">My wardrobe</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/outfits" aria-label="Saved outfits" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line bg-paper"><Bookmark size={18} strokeWidth={1.6} /></Link>
          <Link href="/settings" aria-label="Wardrobe settings" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line bg-paper"><Settings2 size={19} strokeWidth={1.6} /></Link>
        </div>
      </header>

      {!isSupabaseConfigured ? <div className="mt-8"><SetupNotice /></div> : (
        <>
          <section className="mt-6 flex items-end justify-between border-b border-line pb-3">
            <div><span className="font-editorial text-3xl">{items.length}</span><span className="ml-2 text-xs text-muted">{items.length === 1 ? "piece" : "pieces"}</span></div>
            <Link href="/add" className="flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[.16em]"><Plus size={16} /> Add new</Link>
          </section>

          <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-4" aria-label="Filter wardrobe">
            {[{ name: "All", slug: "all" }, ...categories].map((category) => (
              <button key={category.slug} onClick={() => setFilter(category.slug)} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-medium transition ${filter === category.slug ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}>
                {category.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3"><div className="aspect-[4/5] animate-pulse rounded-[24px] bg-line/50" /><div className="aspect-[4/5] animate-pulse rounded-[24px] bg-line/50" /></div>
          ) : visibleItems.length === 0 ? (
            <EmptyState title={filter === "all" ? "Your rails are ready" : "Nothing here yet"} body="Photograph your first piece and Forme will neatly remove the background for you." action={<Link href="/add" className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper">Add your first piece</Link>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-5">
              {visibleItems.map((item, index) => (
                <article key={item.id} className="animate-fade-up overflow-hidden rounded-[24px] border border-line/70 bg-paper p-2" style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}>
                  <ItemImage src={item.signed_url} alt={item.name} className="aspect-[4/5] rounded-[18px]" />
                  <div className="px-2 pb-2 pt-3">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[.17em] text-muted">{item.category?.name ?? "Uncategorized"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
