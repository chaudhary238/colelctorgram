"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "figures", label: "Action Figures" },
  { id: "designer", label: "Designer Toys" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "diecast", label: "Diecast" },
];

interface EditProfileSheetProps {
  user: AuthUser;
  onClose: () => void;
  onSaved: (updated: AuthUser) => void;
}

export function EditProfileSheet({ user, onClose, onSaved }: EditProfileSheetProps) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    bio: user.bio ?? "",
    city: user.city ?? "",
    avatar_url: user.avatar_url ?? "",
    interests: user.interests ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleInterest(id: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((x) => x !== id)
        : [...prev.interests, id],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<AuthUser>("/users/me", {
        name: form.name || undefined,
        bio: form.bio || undefined,
        city: form.city || undefined,
        avatar_url: form.avatar_url || undefined,
        interests: form.interests,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Edit profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {[
            { key: "name", label: "Display name", placeholder: "Your name" },
            { key: "bio", label: "Bio", placeholder: "Tell collectors who you are…" },
            { key: "city", label: "City", placeholder: "Mumbai" },
            { key: "avatar_url", label: "Avatar URL", placeholder: "https://…" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[var(--ink-mute)] mb-1.5">{label}</label>
              {key === "bio" ? (
                <textarea
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setField(key, e.target.value)}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                />
              )}
            </div>
          ))}

          {/* Interests */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-mute)] mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = form.interests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? "bg-[var(--stamp-red)] border-transparent text-white"
                        : "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink-mute)] hover:border-[var(--ink-ghost)]"
                    )}
                  >
                    {active && <Check size={10} strokeWidth={3} />}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-[var(--stamp-red)]">{error}</p>}
        </form>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
