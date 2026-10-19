"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fillTemplate, MAX_CSV_BYTES, MAX_CSV_ROWS, parseCsv, templateFields, type CsvData } from "@/lib/design/csv";
import { DesignPreview } from "@/components/design-preview";
import { Button } from "@/components/ui/button";
import { useEditor } from "./editor-context";

export function BulkPanel() {
  const { engine, state, notify } = useEditor();
  const [data, setData] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [row, setRow] = useState(0);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const fileToken = useRef(0);
  useEffect(() => () => { controller.current?.abort(); fileToken.current++; }, []);
  // Revision invalidates the snapshot when the mutable canvas document changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doc = useMemo(() => engine.toDoc(), [engine, state.revision]);
  const fields = useMemo(() => templateFields(doc), [doc]);
  const resolved = useMemo(() => Object.fromEntries(fields.map((field) => [field, Object.hasOwn(mapping, field) ? mapping[field] : (data?.headers.includes(field) ? field : "")])), [fields, mapping, data]);
  const mapped = !!data && fields.length > 0 && fields.every((field) => data.headers.includes(resolved[field]));
  const preview = useMemo(() => data && mapped ? fillTemplate(doc, data, row, resolved) : null, [data, mapped, doc, row, resolved]);

  async function load(file?: File) {
    if (!file) return;
    const token = ++fileToken.current;
    setData(null); setMapping({}); setRow(0); setError("");
    try {
      if (file.size > MAX_CSV_BYTES) throw new Error("CSV must be 2 MB or smaller");
      const parsed = parseCsv(await file.text());
      if (fileToken.current === token) setData(parsed);
    } catch (err) { if (fileToken.current === token) setError(err instanceof Error ? err.message : "Could not read CSV"); }
  }

  async function run() {
    if (!data || !mapped || controller.current) return;
    const abort = new AbortController(); controller.current = abort;
    setProgress({ done: 0, total: data.rows.length * doc.pages.length }); setError("");
    try {
      const { exportCsvTemplates } = await import("./bulk-export");
      const blob = await exportCsvTemplates(doc, data, resolved, { signal: abort.signal, onProgress: (done, total) => { if (!abort.signal.aborted) setProgress({ done, total }); } });
      abort.signal.throwIfAborted();
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = "lumio-bulk-graphics.zip"; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      notify("Bulk graphics ZIP downloaded");
    } catch (err) { if (!abort.signal.aborted) setError(err instanceof Error ? err.message : "Bulk export failed"); }
    finally { controller.current = null; setProgress(null); }
  }

  return <div className="space-y-4 text-sm">
    <p className="text-ink-600">Add placeholders such as <code>{"{{name}}"}</code> and <code>{"{{price}}"}</code> to text layers, then connect a CSV. Each row produces a copy of every template page.</p>
    <label className="block font-medium text-ink-700">CSV file
      <input className="mt-2 block w-full text-xs" type="file" accept=".csv,text/csv" disabled={!!progress} onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
    </label>
    <p className="text-xs text-ink-500">UTF-8 CSV with unique headers, up to {MAX_CSV_ROWS} rows / 2 MB. All processing stays on this device.</p>
    {!fields.length && <p className="rounded-lg bg-ink-50 p-3 text-ink-600">No placeholders found. Edit a text layer to include {"{{name}}"}, then return here.</p>}
    {data && <>
      <p className="font-medium">{data.rows.length} rows · {doc.pages.length} template pages</p>
      {fields.map((field) => <label key={field} className="block text-xs font-medium text-ink-700">{`{{${field}}}`}
        <select className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2" value={resolved[field]} disabled={!!progress} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}>
          <option value="">Choose a CSV column</option>{data.headers.map((header) => <option key={header} value={header}>{header}</option>)}
        </select>
      </label>)}
      {preview && <>
        <label className="block text-xs font-medium">Preview row
          <input className="ml-2 w-20 rounded border border-ink-200 p-1" type="number" min={1} max={data.rows.length} disabled={!!progress} value={row + 1} onChange={(e) => setRow(Math.max(0, Math.min(data.rows.length - 1, Number(e.target.value) - 1 || 0)))} />
        </label>
        {preview.pages.map((page, index) => <DesignPreview key={page.id} page={page} width={preview.width} height={preview.height} alt={`Row ${row + 1}, page ${index + 1}`} className="rounded-lg ring-1 ring-ink-200" />)}
        <p className="text-xs text-ink-500">Check long values for wrapping or cut-off text. The original design stays editable; generated copies download as PNGs.</p>
      </>}
      <Button className="w-full" disabled={!mapped || !!progress} onClick={run}>Download {data.rows.length * doc.pages.length} PNGs as ZIP</Button>
    </>}
    {progress && <div aria-live="polite" className="space-y-2">
      <p>Rendering {progress.done} / {progress.total} graphics…</p><progress className="w-full" max={progress.total} value={progress.done} />
      <Button variant="secondary" onClick={() => { controller.current?.abort(); }}>Cancel export</Button>
    </div>}
    {error && <p role="alert" className="text-danger-600">{error}</p>}
  </div>;
}
