import { Crown, Users } from "lucide-react";
import * as React from "react";


import type { RoomLobbyMember } from "../model/types";

import styles from "./room-lobby.module.css";

import { Avatar } from "@/components/atoms/avatar";

const memberCardColors = [
  { "--tint": "#edf4ff", "--accent": "#8bb9ff" },
  { "--tint": "#f4efff", "--accent": "#c3abef" },
  { "--tint": "#eaf9f4", "--accent": "#88d7be" },
  { "--tint": "#fff7e8", "--accent": "#efca82" },
] as const;

interface LobbyMemberListProps {
  members: RoomLobbyMember[];
  currentUserId: string;
  hostId: string;
}

export function LobbyMemberList({
  members,
  currentUserId,
  hostId,
}: LobbyMemberListProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member, index) => {
        const isYou = member.userId === currentUserId;
        const isHost = member.userId === hostId;
        const palette = memberCardColors[index % memberCardColors.length];

        return (
          <div
            key={member.id}
            className={styles.member}
            data-you={isYou}
            style={palette as React.CSSProperties}
          >
            <div className={styles.portrait}>
              <Avatar
                size="xl"
                part="face"
                className={styles.avatar}
                skin={member.avatar.skin}
                outfit={member.avatar.outfit}
                headwear={member.avatar.headwear}
                gender={member.avatar.gender}
                label={"Avatar de " + member.name}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900" title={member.name}>
                {member.name}
                {isYou ? <span className={styles.you}>VOCÊ</span> : null}
              </p>
              <p className={`${styles.role} ${isHost ? styles.hostRole : ""}`}>
                {isHost ? (
                  <Crown className="size-3.5" aria-hidden="true" />
                ) : (
                  <Users className="size-3.5" aria-hidden="true" />
                )}
                {isHost ? "Anfitrião da sala" : "Investigador"}
              </p>
            </div>
          </div>
        );
      })}

      {members.length === 0 ? (
        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-medium text-slate-500">
          Os jogadores aparecerão aqui quando entrarem na sala.
        </div>
      ) : null}
    </div>
  );
}
