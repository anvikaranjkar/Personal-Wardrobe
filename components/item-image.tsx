import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

export function ItemImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative grid overflow-hidden bg-[#ebe6de]", className)}>
      {src ? (
        // Signed Supabase URLs and local previews are short lived, so native img is intentional.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-contain p-3" />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted/40"><Shirt size={34} strokeWidth={1.2} /></div>
      )}
    </div>
  );
}
