import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({ eyebrow = "Forme", title, back }: { eyebrow?: string; title: string; back?: string }) {
  return (
    <header className="flex items-center gap-3 py-3">
      {back && (
        <Link href={back} aria-label="Go back" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line bg-paper">
          <ArrowLeft size={18} />
        </Link>
      )}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-muted">{eyebrow}</p>
        <h1 className="font-editorial text-[38px] leading-none tracking-[-.035em]">{title}</h1>
      </div>
    </header>
  );
}
