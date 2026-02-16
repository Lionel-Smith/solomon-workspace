import { SpecViewer } from "./spec-viewer";

export default async function DesignSpecPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SpecViewer specId={id} />;
}
