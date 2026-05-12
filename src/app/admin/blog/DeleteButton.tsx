"use client";

import { useRouter } from "next/navigation";

export function DeleteButton({ id, titel }: { id: number; titel: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Wil je "${titel}" verwijderen?`)) return;
    const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Verwijderen mislukt");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 hover:text-red-800 font-medium"
    >
      Verwijderen
    </button>
  );
}
