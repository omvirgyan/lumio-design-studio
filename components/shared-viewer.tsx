"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { DesignDoc } from "@/lib/design/types";
import { DesignPreview } from "@/components/design-preview";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export function SharedViewer({ token, title, doc }: { token: string; title: string; doc: DesignDoc }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    setBusy(true);
    setError(null);
    try {
      const { design } = await api<{ design: { id: string } }>(`/api/shared/${token}/copy`, { method: "POST" });
      router.push(`/design/${design.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/s/${token}`)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not copy design");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">{title}</h1>
          <Button onClick={copy} disabled={busy}>
            {busy ? <Spinner /> : <Copy size={16} />} Make a copy
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger-600">
            {error}
          </p>
        )}
        {doc.pages.map((page, i) => (
          <figure key={page.id} className="mx-auto" style={{ maxWidth: `calc(80vh * ${doc.width / doc.height})` }}>
            <DesignPreview
              page={page}
              width={doc.width}
              height={doc.height}
              maxSize={1600}
              alt={`${title}, page ${i + 1} of ${doc.pages.length}`}
              className="rounded-lg bg-white shadow-panel ring-1 ring-ink-100"
            />
            {doc.pages.length > 1 && <figcaption className="mt-2 text-center text-xs text-ink-500">Page {i + 1}</figcaption>}
          </figure>
        ))}
      </main>
    </div>
  );
}
