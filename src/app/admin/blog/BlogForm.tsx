"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type FormData = {
  titel: string;
  inhoud: string;
  uitgelichte_afbeelding: string;
  publicatiedatum: string;
  gepubliceerd: boolean;
};

type Props = {
  initialData?: Partial<FormData> & { id?: number };
  mode: "nieuw" | "bewerken";
};

export function BlogForm({ initialData, mode }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    titel: initialData?.titel ?? "",
    inhoud: initialData?.inhoud ?? "",
    uitgelichte_afbeelding: initialData?.uitgelichte_afbeelding ?? "",
    publicatiedatum:
      initialData?.publicatiedatum ??
      new Date().toISOString().split("T")[0],
    gepubliceerd: initialData?.gepubliceerd !== undefined
      ? Boolean(initialData.gepubliceerd)
      : true,
  });

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload mislukt");
      const data = await res.json();
      update("uitgelichte_afbeelding", data.url);
    } catch {
      setError("Afbeelding uploaden mislukt");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        gepubliceerd: form.gepubliceerd ? 1 : 0,
      };

      let res: Response;
      if (mode === "nieuw") {
        res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/blog/${initialData?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Opslaan mislukt");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.titel}
          onChange={(e) => update("titel", e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Titel van het bericht"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Publicatiedatum <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.publicatiedatum}
          onChange={(e) => update("publicatiedatum", e.target.value)}
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Uitgelichte afbeelding
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "Uploaden..." : "Afbeelding kiezen"}
          </button>
          {form.uitgelichte_afbeelding && (
            <button
              type="button"
              onClick={() => update("uitgelichte_afbeelding", "")}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Verwijderen
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        {form.uitgelichte_afbeelding && (
          <div className="relative mt-3 w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={form.uitgelichte_afbeelding}
              alt="Uitgelichte afbeelding"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Inhoud <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.inhoud}
          onChange={(e) => update("inhoud", e.target.value)}
          required
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Inhoud van het bericht (HTML is toegestaan)"
        />
        <p className="mt-1 text-xs text-gray-500">HTML opmaak is toegestaan</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="gepubliceerd"
          checked={form.gepubliceerd}
          onChange={(e) => update("gepubliceerd", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="gepubliceerd" className="text-sm font-medium text-gray-700">
          Gepubliceerd (zichtbaar op de website)
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? "Opslaan..." : mode === "nieuw" ? "Aanmaken" : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
