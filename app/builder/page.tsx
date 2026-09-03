"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Check, WandSparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OutfitSlot } from "@/components/outfit-slot";
import { Input, LoadingButton, SetupNotice } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signItemImages } from "@/lib/supabase/images";
import type { ClothingItem } from "@/lib/types";

export default function BuilderPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [indices, setIndices] = useState({ top: 0, bottom: 0, shoes: 0 });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.from("items").select("*, category:categories(name, slug)").order("created_at", { ascending: false }).then(async ({ data }) => {
      if (data) setItems(await signItemImages(supabase, data as ClothingItem[]));
    });
  }, []);

  const groups = useMemo(() => ({
    top: items.filter((item) => item.category?.slug === "top"),
    bottom: items.filter((item) => item.category?.slug === "bottom"),
    shoes: items.filter((item) => item.category?.slug === "shoes"),
  }), [items]);
  const hasSelection = groups.top.length + groups.bottom.length + groups.shoes.length > 0;

  async function saveOutfit() {
    const supabase = createClient();
    if (!supabase || !hasSelection) return;
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setSaving(false); return; }
    const { error: saveError } = await supabase.from("outfits").insert({
      user_id: user.id,
      name: name.trim() || `Look ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      top_id: groups.top[indices.top]?.id ?? null,
      bottom_id: groups.bottom[indices.bottom]?.id ?? null,
      shoes_id: groups.shoes[indices.shoes]?.id ?? null,
    });
    setSaving(false);
    if (saveError) setError(saveError.message);
    else { setSaved(true); setName(""); setTimeout(() => setSaved(false), 2200); }
  }

  return (
    <div className="safe-top min-h-dvh overscroll-y-contain px-5" style={{ overscrollBehaviorY: "none" }}>
      <div className="flex items-center justify-between">
        <PageHeader title="Outfit studio" />
        <WandSparkles size={19} className="text-accent" />
      </div>
      {!isSupabaseConfigured ? <div className="mt-8"><SetupNotice /></div> : (
        <div className="pb-3 pt-3">
          <p className="mb-4 max-w-sm text-sm leading-6 text-muted">Swipe each piece independently. Your look stays private until you save it.</p>
          <div className="grid gap-2">
            <OutfitSlot label="Top" items={groups.top} index={indices.top} onChange={(top) => setIndices({ ...indices, top })} />
            <OutfitSlot label="Bottom" items={groups.bottom} index={indices.bottom} onChange={(bottom) => setIndices({ ...indices, bottom })} />
            <OutfitSlot label="Shoes" items={groups.shoes} index={indices.shoes} onChange={(shoes) => setIndices({ ...indices, shoes })} />
          </div>

          <div className="sticky bottom-24 z-20 mt-4 rounded-[24px] border border-line bg-paper/95 p-3 shadow-soft backdrop-blur-xl">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this look (optional)" maxLength={60} className="mb-2 bg-canvas/60" />
            {error && <p className="mb-2 px-2 text-xs text-accent">{error}</p>}
            <LoadingButton loading={saving} disabled={!hasSelection} onClick={saveOutfit} className={`w-full ${saved ? "bg-[#315f47]" : ""}`}>
              {saved ? <><Check size={17} /> Outfit saved</> : <><Bookmark size={17} /> Save this outfit</>}
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
