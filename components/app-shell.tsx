"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Shirt, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/closet", label: "My Closet", icon: Shirt },
  { href: "/add", label: "Add Item", icon: Plus },
  { href: "/builder", label: "Outfit Builder", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/auth";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[540px] bg-canvas md:my-5 md:min-h-[calc(100dvh-2.5rem)] md:overflow-hidden md:rounded-[34px] md:border md:border-line/80 md:shadow-soft">
      <main className={cn(!isAuth && "pb-28")}>{children}</main>
      {!isAuth && (
        <nav aria-label="Main navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[540px] border-t border-line/80 bg-paper/95 px-4 pt-2 shadow-dock backdrop-blur-xl md:bottom-5 md:rounded-b-[34px]">
          <div className="grid grid-cols-3 gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium tracking-wide text-muted transition", active && "bg-ink text-paper")}>
                  <Icon size={20} strokeWidth={active ? 2.1 : 1.6} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
