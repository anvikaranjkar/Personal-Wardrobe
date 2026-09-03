"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Input, LoadingButton, SetupNotice } from "@/components/ui";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    setMessage("");

    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/closet` } });

    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Check your inbox to confirm your account.");
    else location.assign("/closet");
    setLoading(false);
  }

  return (
    <div className="safe-top flex min-h-dvh flex-col px-6 pb-8">
      <div className="flex items-center justify-between py-3">
        <p className="text-xs font-semibold uppercase tracking-[.3em]">Forme</p>
        <div className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper"><LockKeyhole size={17} /></div>
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="text-xs uppercase tracking-[.24em] text-accent">Your private archive</p>
        <h1 className="mt-4 max-w-sm font-editorial text-[54px] leading-[.93] tracking-[-.045em]">Every piece.<br />Beautifully considered.</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-muted">Build a wardrobe that lives in your pocket, then compose an outfit in a few quiet swipes.</p>

        {!isSupabaseConfigured ? <div className="mt-9"><SetupNotice /></div> : (
          <form onSubmit={submit} className="mt-9 space-y-3">
            <Input aria-label="Email address" type="email" inputMode="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input aria-label="Password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            {message && <p role="status" className="px-2 text-sm text-accent">{message}</p>}
            <LoadingButton loading={loading} className="w-full" type="submit">
              {mode === "signin" ? "Enter your wardrobe" : "Create private wardrobe"}<ArrowRight size={17} />
            </LoadingButton>
          </form>
        )}
      </div>

      {isSupabaseConfigured && (
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="min-h-11 text-sm text-muted">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      )}
    </div>
  );
}
