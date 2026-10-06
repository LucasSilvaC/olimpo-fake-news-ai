import { Pencil, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { RegisterViewModel } from "../model/use-register-view-model";

import { Avatar } from "@/components/atoms/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { AvatarEditorModal } from "@/components/organisms/avatar-customizer/avatar-editor-modal";

export function ProfileCustomizer({ vm }: { vm: RegisterViewModel }) {
  const [editing, setEditing] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const triggerId = useId();
  const hintId = useId();

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowHint(false), 8000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <section
      aria-label="Personalização do perfil"
      className={`flex justify-center transition-[padding] duration-300 motion-reduce:transition-none ${showHint && !editing ? "pt-24 pb-1" : "py-1"}`}
    >
      <TooltipProvider>
        <Tooltip
          open={showHint && !editing}
          triggerId={triggerId}
          onOpenChange={(_, details) => {
            if (details.reason === "escape-key") setShowHint(false);
          }}
        >
          <TooltipTrigger
            id={triggerId}
            render={<button type="button" disabled={vm.pending} />}
            aria-label="Editar avatar"
            aria-haspopup="dialog"
            aria-expanded={editing}
            aria-describedby={showHint && !editing ? hintId : undefined}
            onClick={() => {
              setShowHint(false);
              setEditing(true);
            }}
            className="group relative cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:opacity-60"
          >
            <span className="block size-24 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-md ring-2 ring-blue-500/20 transition group-hover:ring-blue-500/50">
              <Avatar {...vm.avatar} part="face" className="size-full" label="Seu avatar" />
            </span>
            <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm">
              <Pencil className="size-3.5" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            id={hintId}
            side="top"
            sideOffset={12}
            className="max-w-[260px] gap-2 rounded-xl px-4 py-3 shadow-lg"
          >
            <Sparkles className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
            <span>
              <strong className="block text-xs">Tenha seu próprio estilo</strong>
              <span className="mt-1 block text-[11px] leading-relaxed">
                Seu avatar é editável. Clique para personalizar.
              </span>
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AvatarEditorModal
        open={editing}
        value={vm.avatar}
        onSave={(avatar) => {
          vm.setAvatar(avatar);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </section>
  );
}
