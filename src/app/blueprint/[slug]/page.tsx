import { notFound } from "next/navigation";
import { BlueprintView } from "@/src/projectHub/BlueprintView";
import { blueprintPages, getBlueprintPage } from "@/src/projectHub/blueprint";

export function generateStaticParams() { return blueprintPages.map((page) => ({ slug: page.slug })); }

export default async function BlueprintPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getBlueprintPage(slug);
  if (!page) notFound();
  return <BlueprintView page={page} />;
}
