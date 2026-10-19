"use client";

import type { DesignDoc } from "@/lib/design/types";
import { renderPage, renderPageSvg } from "./fabric-setup";

export type ExportFormat = "png" | "jpeg" | "svg" | "pdf";

function slug(title: string): string {
  return title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "design";
}

function download(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Inlines this app's upload URLs so the SVG is self-contained. */
async function inlineImages(svg: string): Promise<string> {
  const urls = Array.from(new Set(Array.from(svg.matchAll(/(?:xlink:)?href="((?:https?:\/\/[^"]+)?\/api\/uploads\/[A-Za-z0-9_-]+)"/g), (m) => m[1])));
  let out = svg;
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await blobToDataUrl(await res.blob());
    out = out.split(`"${url}"`).join(`"${data}"`);
  }
  return out;
}

export async function exportDesign(
  doc: DesignDoc,
  title: string,
  options: { format: ExportFormat; scale: number; pages: number[]; transparent: boolean; quality: number },
): Promise<void> {
  const name = slug(title);
  const { width, height } = doc;
  const pages = options.pages.map((i) => doc.pages[i]).filter(Boolean);
  if (!pages.length) throw new Error("Select at least one page");
  const suffix = (i: number) => (pages.length > 1 ? `-${options.pages[i] + 1}` : "");

  if (options.format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const orientation = width >= height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "px", format: [width, height], hotfixes: ["px_scaling"], compress: true });
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage([width, height], orientation);
      const url = await renderPage(pages[i], width, height, { multiplier: options.scale, format: "jpeg", quality: 0.95 });
      pdf.addImage(url, "JPEG", 0, 0, width, height, undefined, "FAST");
    }
    const url = URL.createObjectURL(pdf.output("blob"));
    download(url, `${name}.pdf`);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return;
  }

  for (let i = 0; i < pages.length; i++) {
    if (options.format === "svg") {
      const svg = await inlineImages(await renderPageSvg(pages[i], width, height));
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      download(url, `${name}${suffix(i)}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } else {
      const url = await renderPage(pages[i], width, height, {
        multiplier: options.scale,
        format: options.format,
        quality: options.quality,
        transparent: options.transparent && options.format === "png",
      });
      download(url, `${name}${suffix(i)}.${options.format === "jpeg" ? "jpg" : "png"}`);
    }
    // Give the browser a moment between multiple downloads.
    if (pages.length > 1) await new Promise((r) => setTimeout(r, 250));
  }
}
