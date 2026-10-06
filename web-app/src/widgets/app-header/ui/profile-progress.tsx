"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { updateAvatarAction } from "@/app/api/auth/actions/update-avatar.action";
import { Avatar } from "@/components/atoms/avatar";
import { AvatarEditorModal } from "@/components/organisms/avatar-customizer/avatar-editor-modal";
import type { AvatarConfig } from "@/lib/avatar";

interface IProfileProgressProps {
  name: string;
  xp: number;
  avatar: AvatarConfig;
}

const XP_PER_LEVEL = 2000;

export function ProfileProgress({ name, xp, avatar }: IProfileProgressProps): React.ReactElement {
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [editing, setEditing] = useState(false);

  const totalXp = Math.max(0, xp);
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = totalXp % XP_PER_LEVEL;
  const progress = Math.round((currentLevelXp / XP_PER_LEVEL) * 100);
  const formattedCurrentXp = currentLevelXp.toLocaleString("pt-BR");
  const formattedTargetXp = XP_PER_LEVEL.toLocaleString("pt-BR");
  const formattedTotalXp = totalXp.toLocaleString("pt-BR");

  return (
    <section
      aria-label="Progresso do perfil"
      className="flex min-w-0 items-center gap-1.5 min-[380px]:gap-2 sm:gap-3"
    >
      <div className="relative size-9 shrink-0 rounded-full bg-blue-950/20 shadow-lg shadow-blue-950/15 min-[380px]:size-11 sm:size-14">
        <Avatar
          {...currentAvatar}
          part="face"
          className="size-full"
          label={`Personagem de ${name}`}
        />
        <span className="absolute -right-1 -bottom-0.5 rounded-full bg-amber-400 px-1.5 py-1 text-xs leading-none font-extrabold text-slate-900 shadow-sm">
          Nv.{level}
        </span>
      </div>

      <div className="w-16 min-w-0 min-[380px]:w-[90px] sm:w-[132px]">
        <span className="block truncate text-xs leading-tight font-extrabold tracking-tight text-white sm:text-sm">
          {name}
        </span>
        <span className="mt-0.5 block text-xs leading-tight font-bold text-white tabular-nums sm:text-sm">
          {formattedTotalXp} XP
        </span>
        <div
          role="progressbar"
          aria-label={`Progresso para o nível ${level + 1}: ${formattedCurrentXp} de ${formattedTargetXp} XP`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blue-950/40"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Editar avatar"
        aria-haspopup="dialog"
        aria-expanded={editing}
        onClick={() => setEditing(true)}
        style={{ cursor: "pointer" }}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-blue-100/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 focus-visible:outline-none min-[380px]:size-10"
      >
        <Pencil
          className="size-3.5 cursor-pointer min-[380px]:size-4"
          style={{ cursor: "pointer" }}
          aria-hidden="true"
        />
      </button>

      <AvatarEditorModal
        open={editing}
        value={currentAvatar}
        onSave={async (nextAvatar) => {
          const result = await updateAvatarAction(nextAvatar);
          if (!result.success) throw new Error(result.error);
          setCurrentAvatar(nextAvatar);
        }}
        onClose={() => setEditing(false)}
      />
    </section>
  );
}
