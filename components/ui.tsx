import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function LoadingButton({ loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <Button disabled={loading || props.disabled} {...props}>
      {loading && <LoaderCircle className="animate-spin" size={17} />}
      {children}
    </Button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("min-h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-2 focus:ring-ink/5", className)}
      {...props}
    />
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-[24px] border border-dashed border-accent/40 bg-accent/[.045] p-5">
      <p className="text-sm font-semibold">Connect Supabase to begin</p>
      <p className="mt-1 text-sm leading-6 text-muted">Copy <code className="rounded bg-paper px-1">.env.example</code> to <code className="rounded bg-paper px-1">.env.local</code>, add your keys, then run the included SQL setup.</p>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[28px] border border-dashed border-line bg-paper/60 px-7 text-center">
      <div className="mb-4 h-10 w-px bg-line" />
      <h2 className="font-editorial text-2xl">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
