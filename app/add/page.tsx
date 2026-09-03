"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ClipboardPaste, ImagePlus, LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Input, LoadingButton, SetupNotice } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

function fileExtension(file: File) {
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return byType[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "png";
}

export default function AddItemPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedTags, setSavedTags] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectImage = useCallback((next?: File | null) => {
    setError("");
    setStatus("");
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setError("Please use a PNG, JPEG, WebP, HEIC or HEIF image.");
      return;
    }
    if (next.size > MAX_FILE_SIZE) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(next);
    });
    setFile(next);
    setName((current) => current || next.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.from("categories").select("*").order("is_system", { ascending: false }).order("name").then(({ data }) => {
      const rows = (data ?? []) as Category[];
      setCategories(rows.filter((row) => row.kind === "category"));
      setSavedTags(rows.filter((row) => row.kind === "tag"));
      const top = rows.find((row) => row.slug === "top");
      if (top) setCategoryId(top.id);
    });
  }, []);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const image = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith("image/"));
      if (!image) return;
      event.preventDefault();
      selectImage(image.getAsFile());
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectImage]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0]);
  }

  async function pasteFromClipboard() {
    setPasting(true);
    setError("");
    try {
      if (!navigator.clipboard?.read) {
        throw new Error("Clipboard image access is not supported by this browser. You can still paste directly on this page.");
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const type = clipboardItem.types.find((candidate) => candidate.startsWith("image/"));
        if (!type) continue;
        const blob = await clipboardItem.getType(type);
        const extension = type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
        selectImage(new File([blob], `pasted-piece-${Date.now()}.${extension}`, { type }));
        return;
      }
      throw new Error("There is no image on your clipboard.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be pasted. Try the photo library instead.");
    } finally {
      setPasting(false);
    }
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  async function save() {
    const supabase = createClient();
    if (!supabase || !file || !categoryId || !name.trim()) return;
    setBusy(true);
    setError("");
    setStatus("Saving to your private wardrobe…");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please sign in again.");

      const path = `${user.id}/${crypto.randomUUID()}.${fileExtension(file)}`;
      const { error: uploadError } = await supabase.storage.from("clothing-items").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("items").insert({
        user_id: user.id,
        name: name.trim(),
        category_id: categoryId,
        image_url: path,
        tags,
      });
      if (insertError) {
        await supabase.storage.from("clothing-items").remove([path]);
        throw insertError;
      }

      setStatus("Piece added");
      router.push("/closet");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="safe-top min-h-dvh px-5">
      <PageHeader title="Add a piece" />
      {!isSupabaseConfigured ? <div className="mt-8"><SetupNotice /></div> : (
        <div className="pb-6 pt-5">
          <input ref={cameraRef} className="sr-only" type="file" accept={ACCEPTED_TYPES.join(",")} capture="environment" onChange={chooseFile} />
          <input ref={libraryRef} className="sr-only" type="file" accept={ACCEPTED_TYPES.join(",")} onChange={chooseFile} />
          {!preview ? (
            <div>
              <button
                onClick={() => cameraRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); selectImage(event.dataTransfer.files[0]); }}
                className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-[30px] border border-dashed border-muted/45 bg-paper/70 px-8 text-center active:scale-[.99]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-ink text-paper"><Camera size={25} strokeWidth={1.5} /></span>
                <span className="mt-5 font-editorial text-2xl">Add your prepared piece</span>
                <span className="mt-2 text-sm leading-6 text-muted">Use a ready-to-save image, ideally with a transparent background.</span>
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => libraryRef.current?.click()} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-paper px-3 text-xs font-semibold"><ImagePlus size={17} /> Photo library</button>
                <button onClick={pasteFromClipboard} disabled={pasting} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-paper px-3 text-xs font-semibold disabled:opacity-50"><ClipboardPaste size={17} /> {pasting ? "Reading…" : "Paste image"}</button>
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-muted">You can also press <kbd className="rounded border border-line bg-paper px-1.5 py-0.5">⌘V</kbd> or <kbd className="rounded border border-line bg-paper px-1.5 py-0.5">Ctrl+V</kbd> anywhere on this page.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[30px] border border-line bg-[#e9e4dc]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected clothing preview" className="h-[330px] w-full object-contain p-4" />
              <button onClick={clearImage} aria-label="Remove selected photo" className="absolute right-3 top-3 grid min-h-11 min-w-11 place-items-center rounded-full bg-ink text-paper"><X size={18} /></button>
              <button onClick={() => libraryRef.current?.click()} className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-paper/95 px-4 text-xs font-semibold shadow-soft"><ImagePlus size={16} /> Replace</button>
            </div>
          )}

          <div className="mt-6 space-y-6">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Piece name</span>
              <Input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ivory linen shirt" />
            </label>

            <fieldset>
              <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Category</legend>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm ${categoryId === category.id ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}>
                    {category.name}{categoryId === category.id && <Check size={15} />}
                  </button>
                ))}
              </div>
            </fieldset>

            {savedTags.length > 0 && (
              <fieldset>
                <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Tags</legend>
                <div className="flex flex-wrap gap-2">
                  {savedTags.map((tag) => {
                    const active = tags.includes(tag.name);
                    return <button key={tag.id} type="button" onClick={() => setTags(active ? tags.filter((value) => value !== tag.name) : [...tags, tag.name])} className={`min-h-11 rounded-full border px-4 text-xs ${active ? "border-accent bg-accent text-white" : "border-line bg-paper"}`}>{tag.name}</button>;
                  })}
                </div>
              </fieldset>
            )}

            <div className="rounded-2xl bg-paper p-4 text-xs leading-5 text-muted"><LockKeyhole className="mr-2 inline text-accent" size={15} />Your image is saved exactly as supplied in your private wardrobe.</div>
            {error && <p role="alert" className="text-sm text-accent">{error}</p>}
            {status && !error && <p role="status" className="text-center text-sm text-muted">{status}</p>}
            <LoadingButton loading={busy} onClick={save} disabled={!file || !categoryId || !name.trim()} className="w-full">Save to wardrobe</LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
