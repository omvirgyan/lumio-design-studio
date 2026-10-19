"use client";

import {
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  FolderPlus,
  Clock,
  SlidersHorizontal,
  LayoutGrid,
  Home,
  FolderOpen,
  LayoutTemplate,
  Presentation,
  Image as ImageIcon,
  FileText,
  Video,
  Palette,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { SIZE_PRESETS } from "@/lib/design/presets";
import { getTemplate, TEMPLATE_CATEGORIES, TEMPLATES, templateToDoc, type Template } from "@/lib/design/templates";
import { blankDoc, MAX_DIMENSION, MIN_DIMENSION, type DesignDoc, type PageData } from "@/lib/design/types";
import { DesignPreview } from "@/components/design-preview";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/input";
import { LogoMark } from "@/components/ui/logo";
import { UserMenu } from "./user-menu";

type DesignSummary = {
  id: string;
  title: string;
  width: number;
  height: number;
  thumbnail: string | null;
  shared: boolean;
  updatedAt: number;
};

const templatePages = new Map<string, PageData>(
  TEMPLATES.map((t) => [t.id, { id: t.id, background: t.pages[0].background, objects: t.pages[0].objects }]),
);

const QUICK_CREATE = [
  { id: "presentation", label: "Presentation", icon: Presentation, color: "bg-orange-500" },
  { id: "ig-post", label: "Social post", icon: ImageIcon, color: "bg-rose-500" },
  { id: "ig-story", label: "Story", icon: ImageIcon, color: "bg-fuchsia-500" },
  { id: "yt-thumb", label: "Thumbnail", icon: Video, color: "bg-violet-600" },
  { id: "a4", label: "Document", icon: FileText, color: "bg-cyan-600" },
  { id: "poster", label: "Poster", icon: LayoutGrid, color: "bg-emerald-600" },
  { id: "business-card", label: "Business card", icon: CreditCard, color: "bg-blue-600" },
  { id: "logo", label: "Logo", icon: Palette, color: "bg-indigo-600" },
];

export function Dashboard({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const params = useSearchParams();
  const [designs, setDesigns] = useState<DesignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [renaming, setRenaming] = useState<DesignSummary | null>(null);
  const [deleting, setDeleting] = useState<DesignSummary | null>(null);
  const autoTemplate = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ designs: DesignSummary[] }>("/api/designs");
      setDesigns(data.designs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load designs");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api<{ designs: DesignSummary[] }>("/api/designs")
      .then((d) => alive && setDesigns(d.designs))
      .catch((err: unknown) => alive && setError(err instanceof Error ? err.message : "Could not load designs"));
    return () => {
      alive = false;
    };
  }, []);

  const create = useCallback(
    async (title: string, doc: DesignDoc) => {
      setCreating(true);
      try {
        const { design } = await api<{ design: { id: string } }>("/api/designs", {
          method: "POST",
          json: { title, doc },
        });
        router.push(`/design/${design.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create design");
        setCreating(false);
      }
    },
    [router],
  );

  const fromTemplate = useCallback((t: Template) => create(t.name, templateToDoc(t)), [create]);

  // Landing page links to /dashboard?template=<id>; create it once after login.
  useEffect(() => {
    const id = params.get("template");
    const t = id ? getTemplate(id) : undefined;
    if (t && !autoTemplate.current) {
      autoTemplate.current = true;
      void fromTemplate(t);
    }
  }, [params, fromTemplate]);

  const q = query.trim().toLowerCase();
  const filteredTemplates = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (!category || t.category === category) &&
          (!q || t.name.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q))),
      ),
    [category, q],
  );
  const filteredDesigns = designs?.filter((d) => !q || d.title.toLowerCase().includes(q)) ?? null;

  async function duplicate(d: DesignSummary) {
    await api(`/api/designs/${d.id}/duplicate`, { method: "POST" }).catch((e: Error) => setError(e.message));
    await load();
  }

  return (
    <div className="flex min-h-screen flex-1 bg-[#1d1c22] text-[#f7f5fa]">
      <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col items-center border-r border-white/10 bg-[#211e29] py-4 md:flex" aria-label="Workspace navigation">
        <Link href="/dashboard" className="mb-7 flex flex-col items-center gap-1.5 text-[10px] font-semibold text-white" aria-label="Lumio home">
          <LogoMark size={30} />
          <span>Lumio</span>
        </Link>
        <button type="button" onClick={() => setCustomOpen(true)} className="mb-5 flex flex-col items-center gap-1 text-[11px] font-medium text-[#e8e3ef]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#8138ed] to-[#ad4ad9] shadow-lg shadow-purple-900/30"><Plus className="h-6 w-6" /></span>
          Create
        </button>
        <nav className="flex w-full flex-col items-center gap-1" aria-label="Main navigation">
          <Link href="/dashboard" aria-current="page" className="flex w-full flex-col items-center gap-1 bg-white/10 py-2.5 text-[11px] text-white"><Home className="h-5 w-5" />Home</Link>
          <Link href="#designs" className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-[#bbb6c5] transition-colors hover:bg-white/5 hover:text-white"><FolderOpen className="h-5 w-5" />Projects</Link>
          <Link href="#templates" className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-[#bbb6c5] transition-colors hover:bg-white/5 hover:text-white"><LayoutTemplate className="h-5 w-5" />Templates</Link>
        </nav>
        <div className="mt-auto"><UserMenu name={user.name} email={user.email} compact /></div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#211e29] px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold text-white"><LogoMark size={30} />Lumio</Link>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCustomOpen(true)} aria-label="Create a design" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8138ed] text-white"><Plus className="h-5 w-5" /></button>
            <UserMenu name={user.name} email={user.email} compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1800px] space-y-10 px-4 pb-16 pt-2 sm:px-6 lg:px-8">
          {error && (
            <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="underline">Dismiss</button>
            </div>
          )}

          <section aria-labelledby="studio-heading" className="overflow-hidden rounded-2xl bg-[#201e25]">
            <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_8%_0%,rgba(0,196,204,0.3),transparent_42%),radial-gradient(ellipse_at_92%_0%,rgba(121,38,224,0.48),transparent_50%),linear-gradient(180deg,#232032_0%,#1f1e24_100%)] px-4 pb-8 pt-12 text-center sm:px-8 sm:pt-14">
              <h1 id="studio-heading" className="bg-gradient-to-r from-[#32d3df] via-[#9aabff] to-[#8d56f7] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                What will you design today?
              </h1>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs">
                <span className="rounded-full border border-[#9e64eb]/70 bg-[#7643b2]/30 px-4 py-1.5 font-semibold text-white">Home</span>
                <Link href="#templates" className="rounded-full border border-white/40 px-4 py-1.5 text-[#e5e2ec] transition-colors hover:border-white hover:text-white">Templates</Link>
              </div>
              <div className="mx-auto mt-5 flex h-14 w-full max-w-[800px] items-center gap-3 rounded-2xl border border-[#8f58d2] bg-[#1d1c22] px-5 shadow-[0_0_24px_rgba(129,56,237,0.28)] focus-within:ring-2 focus-within:ring-[#ad7bf0]">
                <Search className="h-5 w-5 shrink-0 text-[#e5e2ec]" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" }); }} placeholder="Search your designs and templates" aria-label="Search designs and templates" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#a6a2ad] focus:outline-none" />
              </div>
            </div>

            <div className="px-3 pb-7 pt-6 sm:px-6">
              <h2 className="mb-5 text-lg font-semibold text-white sm:hidden">Quick Create</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:justify-center sm:gap-5">
                <Link href="#templates" className="flex min-w-[72px] flex-col items-center gap-2 text-xs text-[#d7d3de] hover:text-white">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f0f8] text-[#7d2ae8] sm:h-14 sm:w-14"><LayoutTemplate className="h-6 w-6" /></span>Templates
                </Link>
                {QUICK_CREATE.map((item) => {
                  const Icon = item.icon;
                  const preset = SIZE_PRESETS.find((p) => p.id === item.id);
                  if (!preset) return null;
                  return (
                    <button key={item.id} type="button" disabled={creating} onClick={() => create(preset.name, blankDoc(preset.width, preset.height))} className="flex min-w-[72px] flex-col items-center gap-2 text-xs text-[#d7d3de] transition-colors hover:text-white disabled:opacity-50">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color} text-white shadow-md sm:h-14 sm:w-14`}><Icon className="h-6 w-6" /></span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
                <button type="button" onClick={() => setCustomOpen(true)} className="flex min-w-[72px] flex-col items-center gap-2 text-xs text-[#d7d3de] hover:text-white">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efedf2] text-[#24222b] sm:h-14 sm:w-14"><SlidersHorizontal className="h-6 w-6" /></span>Custom size
                </button>
              </div>
            </div>
          </section>

          <section id="designs" aria-labelledby="designs-heading" className="scroll-mt-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="designs-heading" className="text-xl font-semibold text-[#f3f1f6]">Continue designing</h2>
              {q && <span className="text-xs text-[#aaa5b2]">Results for &quot;{query}&quot;</span>}
            </div>
            {filteredDesigns === null ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-white/5"><Spinner className="text-[#a979f0]" size={28} /></div>
            ) : filteredDesigns.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                <FolderPlus className="h-8 w-8 text-[#a979f0]" />
                <p className="mt-3 text-sm font-semibold">{q ? "No matching designs" : "Your designs will appear here"}</p>
                <p className="mt-1 text-xs text-[#aaa5b2]">{q ? "Try another search term." : "Choose a quick-create format or template to begin."}</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {filteredDesigns.map((d) => (
                  <LumioDesignCard key={d.id} design={d} onRename={() => setRenaming(d)} onDuplicate={() => duplicate(d)} onDelete={() => setDeleting(d)} />
                ))}
              </ul>
            )}
          </section>

          <section id="templates" aria-labelledby="templates-heading" className="scroll-mt-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="templates-heading" className="text-xl font-semibold text-[#f3f1f6]">Templates for you</h2>
                <p className="mt-1 text-xs text-[#aaa5b2]">Choose a layout and make it your own.</p>
              </div>
              <div className="flex max-w-full gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Template categories">
                {[null, ...TEMPLATE_CATEGORIES].map((c) => (
                  <button key={c ?? "all"} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${category === c ? "bg-[#7140b8] text-white" : "text-[#aaa5b2] hover:bg-white/10 hover:text-white"}`}>{c ?? "All"}</button>
                ))}
              </div>
            </div>
            {filteredTemplates.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-[#aaa5b2]">No templates match your search.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map((t) => {
                  const page = templatePages.get(t.id);
                  if (!page) return null;
                  return (
                    <button key={t.id} type="button" disabled={creating} onClick={() => fromTemplate(t)} className="group overflow-hidden rounded-xl border border-white/10 bg-[#29272e] text-left transition-colors hover:border-[#9e64eb] disabled:opacity-50">
                      <div className="aspect-[4/3] overflow-hidden bg-[#34313c]"><DesignPreview page={page} width={t.width} height={t.height} alt={`${t.name} template`} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" /></div>
                      <div className="p-3"><span className="block truncate text-sm font-semibold text-white">{t.name}</span><span className="mt-1 block text-xs text-[#aaa5b2]">{t.category} · {t.pages.length} {t.pages.length === 1 ? "page" : "pages"}</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Lumio Sheet Modals */}
      <CustomSizeDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreate={(w, h) => create("Untitled design", blankDoc(w, h))}
      />

      <RenameDialog
        key={renaming?.id ?? "none"}
        design={renaming}
        onClose={() => setRenaming(null)}
        onSaved={() => {
          setRenaming(null);
          void load();
        }}
      />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete Project?">
        <div className="p-1">
          <p className="text-xs text-[#86868b] leading-relaxed">
            &ldquo;{deleting?.title}&rdquo; and its entire revision history will be permanently erased. This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-full bg-black/[0.05] px-4 py-2 text-xs font-semibold text-[#1d1d1f] hover:bg-black/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!deleting) return;
                await api(`/api/designs/${deleting.id}`, { method: "DELETE" }).catch((e: Error) => setError(e.message));
                setDeleting(null);
                void load();
              }}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function LumioDesignCard({
  design,
  onRename,
  onDuplicate,
  onDelete,
}: {
  design: DesignSummary;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    }
    if (menu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menu]);

  return (
    <li className="group relative list-none" ref={menuRef}>
      <Link
        href={`/design/${design.id}`}
        className="block rounded-xl border border-white/10 bg-[#29272e] p-3 transition-colors duration-200 hover:border-[#9e64eb]"
      >
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-[#36333e] p-2">
          {design.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.thumbnail}
              alt=""
              className="max-h-full max-w-full rounded shadow-sm transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="max-h-full max-w-full rounded bg-white shadow-sm ring-1 ring-black/5"
              style={{ aspectRatio: `${design.width} / ${design.height}`, height: "100%" }}
            />
          )}
        </div>

        <div className="mt-3">
          <p className="truncate text-xs font-bold text-white group-hover:text-[#d7bbff] transition-colors">
            {design.title}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#aaa5b2]">
            <span>{design.width} × {design.height}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(design.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
          {design.shared && (
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
              Shared Link
            </span>
          )}
        </div>
      </Link>

      {/* Floating Lumio Action Button */}
      <button
        type="button"
        aria-label={`Actions for ${design.title}`}
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenu((m) => !m);
        }}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#26232d]/90 text-white shadow-md opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 ring-1 ring-white/20"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menu && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-50 w-44 rounded-xl border border-white/10 bg-[#2b2833] p-1.5 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          {[
            { label: "Rename", icon: Pencil, action: onRename, danger: false },
            { label: "Duplicate", icon: Copy, action: onDuplicate, danger: false },
            { label: "Delete", icon: Trash2, action: onDelete, danger: true },
          ].map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              role="menuitem"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenu(false);
                action();
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                danger
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function CustomSizeDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (w: number, h: number) => void;
}) {
  const [w, setW] = useState("1080");
  const [h, setH] = useState("1080");
  const valid = [w, h].every(
    (v) => Number.isInteger(Number(v)) && Number(v) >= MIN_DIMENSION && Number(v) <= MAX_DIMENSION,
  );

  return (
    <Dialog open={open} onClose={onClose} title="Custom Canvas Dimensions">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) {
            onClose();
            onCreate(Number(w), Number(h));
          }
        }}
        className="p-1"
      >
        <p className="text-xs text-[#86868b] mb-4">
          Specify exact pixel measurements for your new design canvas.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold text-[#1d1d1f]">
            Width (px)
            <input
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={w}
              onChange={(e) => setW(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-black/[0.02] px-3 py-2 text-sm font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#1d1d1f]">
            Height (px)
            <input
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={h}
              onChange={(e) => setH(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-black/[0.02] px-3 py-2 text-sm font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </label>
        </div>

        {!valid && (
          <p className="mt-2 text-xs font-medium text-rose-600">
            Enter whole numbers between {MIN_DIMENSION} and {MAX_DIMENSION}.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/[0.05] px-4 py-2 text-xs font-semibold text-[#1d1d1f] hover:bg-black/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="rounded-full bg-[#0071E3] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] disabled:opacity-50 transition-colors"
          >
            Create Canvas
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function RenameDialog({
  design,
  onClose,
  onSaved,
}: {
  design: DesignSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(design?.title ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={!!design} onClose={onClose} title="Rename Project">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!design) return;
          try {
            await api(`/api/designs/${design.id}`, { method: "PATCH", json: { title } });
            onSaved();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not rename project");
          }
        }}
        className="p-1"
      >
        <p className="text-xs text-[#86868b] mb-3">
          Enter a new title for this design document.
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          autoFocus
          className="w-full rounded-xl border border-black/15 bg-black/[0.02] px-3.5 py-2.5 text-sm font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          aria-label="Design title"
        />

        {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/[0.05] px-4 py-2 text-xs font-semibold text-[#1d1d1f] hover:bg-black/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-full bg-[#0071E3] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] disabled:opacity-50 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Dialog>
  );
}
