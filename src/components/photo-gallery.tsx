"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { photoUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

export function PhotoGallery({ paths, className }: { paths: string[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className={cn("grid gap-2", paths.length > 1 && "grid-cols-2", className)}>
        {paths.map((path, i) => (
          <button
            key={path}
            onClick={() => setOpen(i)}
            className={cn(
              "relative overflow-hidden rounded-xl bg-muted",
              paths.length === 1 ? "aspect-[4/3]" : "aspect-square",
            )}
          >
            <Image src={photoUrl(path)} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" unoptimized />
          </button>
        ))}
      </div>
      <Dialog open={open !== null} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent className="max-w-[min(96vw,1200px)] border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,1200px)]">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          {open !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(paths[open]!)} alt="" className="max-h-[88vh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
