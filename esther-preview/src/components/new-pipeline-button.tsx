"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewPipelineDialog } from "./new-pipeline-dialog";

export function NewPipelineButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Pipeline</Button>
      <NewPipelineDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
