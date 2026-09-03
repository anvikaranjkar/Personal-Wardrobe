"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, LogOut, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button, Input, SetupNotice } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Category, CategoryKind } from "@/lib/types";

export default function SettingsPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [kind, setKind] = useState<CategoryKind>("category");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("categories").select("*").order("kind").order("is_system", { ascending: false }).order("name");
    setRows((data ?? []) as Category[]);
  }

  useEffect(() => { load(); }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase || !value.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error: addError } = await supabase.from("categories").insert({ user_id: user.id, name: value.trim(), slug, kind, is_system: false });
    if (addError) setError(addError.code === "23505" ? "That name already exists." : addError.message);
    else { setValue(""); setError(""); load(); }
  }

  async function rename(row: Category) {
    const supabase = createClient();
    if (!supabase || !editValue.trim()) return;
    const slug = editValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error: updateError } = await supabase.from("categories").update({ name: editValue.trim(), slug }).eq("id", row.id);
    if (updateError) setError(updateError.message);
    else { setEditing(null); setError(""); load(); }
  }

  async function remove(row: Category) {
    const supabase = createClient();
    if (!supabase || row.is_system) return;
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", row.id);
    if (deleteError) setError(row.kind === "category" ? "Move or delete pieces in this category first." : deleteError.message);
    else load();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    location.assign("/auth");
  }

  return (
    <div className="safe-top min-h-dvh px-5">
      <PageHeader title="Personalize" back="/closet" />
      {!isSupabaseConfigured ? <div className="mt-8"><SetupNotice /></div> : (
        <div className="pb-6 pt-5">
          <div className="grid grid-cols-2 rounded-full bg-line/50 p-1">
            {(["category", "tag"] as CategoryKind[]).map((option) => <button key={option} onClick={() => setKind(option)} className={`min-h-11 rounded-full text-xs font-semibold capitalize transition ${kind === option ? "bg-paper shadow-sm" : "text-muted"}`}>{option === "category" ? "Categories" : "Tags"}</button>)}
          </div>

          <p className="mt-5 text-sm leading-6 text-muted">{kind === "category" ? "Create extra rails for pieces that do not fit the essentials." : "Add flexible labels such as Summer, Formal or Gym."}</p>
          <form onSubmit={add} className="mt-4 flex gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} maxLength={30} placeholder={kind === "category" ? "New category" : "New tag"} />
            <Button type="submit" aria-label={`Add ${kind}`} className="min-w-12 px-0"><Plus size={18} /></Button>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-accent">{error}</p>}

          <div className="mt-6 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-paper">
            {rows.filter((row) => row.kind === kind).map((row) => (
              <div key={row.id} className="flex min-h-16 items-center gap-3 px-4">
                <Tag size={16} className="shrink-0 text-muted" />
                {editing === row.id ? <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus className="min-h-10 border-0 bg-canvas" /> : <span className="flex-1 text-sm font-medium">{row.name}{row.is_system && <span className="ml-2 text-[9px] uppercase tracking-wider text-muted">Essential</span>}</span>}
                {!row.is_system && (editing === row.id ? (
                  <><button onClick={() => rename(row)} aria-label="Save name" className="grid min-h-11 min-w-11 place-items-center"><Check size={17} /></button><button onClick={() => setEditing(null)} aria-label="Cancel edit" className="grid min-h-11 min-w-11 place-items-center"><X size={17} /></button></>
                ) : (
                  <><button onClick={() => { setEditing(row.id); setEditValue(row.name); }} aria-label={`Edit ${row.name}`} className="grid min-h-11 min-w-11 place-items-center text-muted"><Pencil size={16} /></button><button onClick={() => remove(row)} aria-label={`Delete ${row.name}`} className="grid min-h-11 min-w-11 place-items-center text-muted"><Trash2 size={16} /></button></>
                ))}
              </div>
            ))}
          </div>

          <button onClick={signOut} className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-paper text-sm font-semibold"><LogOut size={17} /> Sign out</button>
          <p className="mt-5 text-center text-[10px] uppercase tracking-[.18em] text-muted">Private by design · Forme 1.0</p>
        </div>
      )}
    </div>
  );
}
