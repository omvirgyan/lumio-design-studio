import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditorLoader } from "@/components/editor/editor-loader";
import { Spinner } from "@/components/ui/input";
import { getDesign } from "@/lib/server/designs";
import { requirePageUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Editor" };

export default function DesignPage({ params }: PageProps<"/design/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-ink-100 text-brand-600">
          <Spinner size={28} />
        </div>
      }
    >
      <DesignEditor params={params} />
    </Suspense>
  );
}

async function DesignEditor({ params }: { params: PageProps<"/design/[id]">["params"] }) {
  const { id } = await params;
  const user = await requirePageUser(`/design/${id}`);
  const design = await getDesign(user.id, id);
  if (!design) notFound();
  return <EditorLoader design={{ id: design.id, title: design.title, doc: design.doc, shareToken: design.shareToken, revision: design.revision }} />;
}
