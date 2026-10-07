"use client";

import { Check, RotateCcw, Shuffle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./avatar-editor-modal.module.css";

import { Avatar } from "@/components/atoms/avatar";
import { Button } from "@/components/atoms/button";
import {
  AVATAR_HEADWEARS,
  AVATAR_OUTFITS,
  AVATAR_SKINS,
  DEFAULT_AVATAR,
  type AvatarConfig,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface AvatarEditorModalProps {
  open: boolean;
  value: AvatarConfig;
  onSave: (value: AvatarConfig) => void | Promise<void>;
  onClose: () => void;
}

export function AvatarEditorModal(props: AvatarEditorModalProps) {
  if (!props.open || typeof document === "undefined") return null;

  return createPortal(<EditorSession {...props} />, document.body);
}

function EditorSession({ value, onSave, onClose }: AvatarEditorModalProps) {
  const [draft, setDraft] = useState<AvatarConfig>(value);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  function shuffle() {
    const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;
    setDraft({
      gender: pick(["male", "female"] as const),
      skin: pick(AVATAR_SKINS).color,
      outfit: pick(AVATAR_OUTFITS).id,
      headwear: pick(AVATAR_HEADWEARS).id,
    });
  }

  async function saveAvatar() {
    if (saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar seu avatar. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        styles.dialogEnter,
        "relative mx-auto my-6 max-h-[calc(100dvh-48px)] w-[min(576px,calc(100vw-32px))] overflow-y-auto rounded-[36px] border border-slate-100 bg-white p-0 text-slate-900 shadow-[0_25px_60px_-15px_#0f172a59] max-[640px]:my-3 max-[640px]:max-h-[calc(100dvh-24px)] max-[640px]:w-[calc(100vw-24px)] max-[640px]:rounded-[28px] min-[900px]:m-auto min-[900px]:w-[min(1040px,calc(100vw-48px))] motion-reduce:[&_button]:transition-none",
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white px-7 pt-7 pb-5 max-[640px]:px-5 max-[640px]:pt-[22px] max-[640px]:pb-[18px] [&>.icon-button]:-mt-1 [&>.icon-button]:-mr-2 [@media(min-width:900px)_and_(max-height:800px)]:pt-5 [@media(min-width:900px)_and_(max-height:800px)]:pb-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-[5px] text-[10px] font-extrabold tracking-[0.075em] text-blue-700 uppercase max-[640px]:px-[9px] max-[640px]:text-[9px] [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-blue-600">
            <span aria-hidden="true" />
            Sua identidade no Olimpo
          </span>
          <h2
            id={titleId}
            className="text-2xl leading-[1.25] font-extrabold tracking-[-0.035em] max-[640px]:text-[22px]"
          >
            Personalize seu avatar
          </h2>
          <p
            id={descriptionId}
            className="mt-[5px] text-[13px] leading-[1.5] text-slate-500 max-[640px]:text-xs"
          >
            Experimente. Combine. Faça do seu jeito.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Fechar editor de avatar"
          className="icon-button grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] [&_svg]:shrink-0"
        >
          <X size={20} />
        </button>
      </header>
      <div className="px-7 pt-6 max-[640px]:px-5 max-[640px]:pt-5 min-[900px]:grid min-[900px]:grid-cols-[minmax(230px,0.9fr)_minmax(0,1.9fr)] min-[900px]:items-stretch min-[900px]:gap-7 min-[900px]:pb-6 [@media(min-width:900px)_and_(max-height:800px)]:py-4">
        <section
          aria-label="Prévia do personagem"
          className="grid grid-cols-[154px_minmax(0,1fr)] gap-x-[18px] rounded-[20px] border border-slate-200/70 bg-slate-50/80 p-4 max-[640px]:grid-cols-[116px_minmax(0,1fr)] max-[640px]:gap-x-3 max-[640px]:p-3 max-[360px]:grid-cols-[100px_minmax(0,1fr)] max-[360px]:gap-x-2 min-[900px]:flex min-[900px]:flex-col min-[900px]:items-center"
        >
          <div className="col-span-full flex w-full items-center justify-between text-[10px] font-extrabold tracking-[0.09em] text-slate-500 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:before:size-1.5 [&>span]:before:rounded-full [&>span]:before:bg-emerald-500 [&>span]:before:content-['']">
            <span>PRÉVIA AO VIVO</span>
            <button
              type="button"
              className="icon-button grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] [&_svg]:shrink-0"
              disabled={saving}
              aria-label="Restaurar avatar inicial"
              title="Restaurar avatar inicial"
              onClick={() => setDraft(DEFAULT_AVATAR)}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <div className="relative isolate grid h-[200px] w-full place-items-center max-[640px]:h-[164px] min-[900px]:h-[220px] [@media(min-width:900px)_and_(max-height:800px)]:h-[180px]">
            <div
              className="absolute top-[14px] -z-10 h-[170px] w-full rounded-[80px_80px_20px_20px] border border-blue-200/50 bg-[linear-gradient(160deg,#dbeafe,#eff6ff_65%,#fff)] max-[640px]:h-[142px] max-[640px]:rounded-[65px_65px_16px_16px] min-[900px]:h-[190px] min-[900px]:w-[180px] [@media(min-width:900px)_and_(max-height:800px)]:h-[155px] [@media(min-width:900px)_and_(max-height:800px)]:w-[156px]"
              aria-hidden="true"
            />
            <Avatar
              {...draft}
              className="h-[200px] w-[160px] max-w-full max-[640px]:h-[164px] max-[640px]:w-[132px] min-[900px]:h-[220px] min-[900px]:w-[176px] [@media(min-width:900px)_and_(max-height:800px)]:h-[180px] [@media(min-width:900px)_and_(max-height:800px)]:w-[144px]"
              label={draft.gender === "female" ? "Sua heroína do Olimpo" : "Seu herói do Olimpo"}
            />
          </div>
          <div className="flex flex-col items-start justify-center min-[900px]:items-center min-[900px]:text-center">
            <p className="text-[17px] leading-[1.35] font-extrabold tracking-[-0.025em] max-[640px]:text-[15px] max-[360px]:text-sm">
              {draft.gender === "female" ? "Uma nova heroína do Olimpo" : "Um novo herói do Olimpo"}
            </p>
            <p className="mt-2 text-[11px] leading-[1.6] text-slate-500 max-[640px]:text-[10px] [@media(min-width:900px)_and_(max-height:800px)]:mt-[5px]">
              Cada detalhe conta. Monte um personagem com a sua cara.
            </p>
            <button
              type="button"
              onClick={shuffle}
              disabled={saving}
              className="mt-[14px] flex cursor-pointer items-center justify-center gap-[7px] rounded-xl border border-blue-200/60 bg-blue-50 px-3 py-2.5 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] max-[640px]:px-2.5 max-[640px]:py-[9px] max-[640px]:text-[10px] max-[360px]:gap-[5px] max-[360px]:p-2 min-[900px]:mt-2"
            >
              <Shuffle size={16} /> Surpreenda-me
            </button>
          </div>
          <div className="col-span-full mt-[10px] flex w-full items-center gap-2.5 border-t border-slate-200/80 pt-3 text-[11px] font-semibold text-slate-700 min-[900px]:mt-4">
            <Avatar
              {...draft}
              part="face"
              className="size-[34px] border-2 border-white bg-blue-100 shadow-[0_2px_4px_#0f172a0d]"
            />
            <span>Seu avatar durante o jogo</span>
          </div>
        </section>
        <section
          aria-label="Personalizar avatar"
          className="pt-6 max-[640px]:pt-[22px] min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:content-center min-[900px]:gap-6 min-[900px]:p-0"
        >
          <fieldset disabled={saving} className="mb-6 min-w-0 border-0 p-0 min-[900px]:m-0">
            <legend className="mb-2.5 text-xs font-bold text-slate-700">Gênero</legend>
            <div className="grid grid-cols-2 gap-3 min-[900px]:gap-2">
              {(
                [
                  { id: "male", name: "Masculino" },
                  { id: "female", name: "Feminino" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold shadow-[0_1px_2px_#0f172a08] hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:shadow-[0_0_0_1px_#2563eb] min-[900px]:gap-1.5 min-[900px]:p-2"
                  aria-pressed={draft.gender === item.id}
                  onClick={() => setDraft({ ...draft, gender: item.id })}
                >
                  <Avatar
                    {...draft}
                    gender={item.id}
                    part="face"
                    className="size-9 min-[900px]:size-[30px]"
                  />
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving} className="mb-6 min-w-0 border-0 p-0 min-[900px]:m-0">
            <legend className="mb-2.5 text-xs font-bold text-slate-700">Tom de pele</legend>
            <div className="flex flex-wrap gap-[15px] p-[3px] max-[640px]:gap-[13px] max-[360px]:gap-[9px] min-[900px]:gap-2.5">
              {AVATAR_SKINS.map((item, index) => (
                <button
                  key={item.color}
                  type="button"
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-900/5 shadow-[0_1px_3px_#0f172a1a] transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] aria-pressed:outline-2 aria-pressed:outline-offset-[3px] aria-pressed:outline-blue-600 max-[640px]:size-[30px]"
                  aria-label={item.name}
                  title={item.name}
                  aria-pressed={draft.skin === item.color}
                  style={{ backgroundColor: item.color }}
                  onClick={() => setDraft({ ...draft, skin: item.color })}
                >
                  {draft.skin === item.color && (
                    <Check size={20} color={index > 2 ? "white" : "#382a25"} strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving} className="mb-6 min-w-0 border-0 p-0 min-[900px]:m-0">
            <legend className="mb-2.5 text-xs font-bold text-slate-700">Roupa</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {AVATAR_OUTFITS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex min-w-0 cursor-pointer flex-col items-center rounded-2xl border border-slate-200 bg-white px-[5px] py-3 shadow-[0_1px_2px_#0f172a08] transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:shadow-[0_0_0_1px_#2563eb] max-[640px]:px-1 max-[640px]:py-2.5 [&>small]:mt-1 [&>small]:text-center [&>small]:text-[9px] [&>small]:leading-[1.5] [&>small]:text-slate-500 max-[640px]:[&>small]:text-[8px] [&>span]:text-center [&>span]:text-[10px] [&>span]:leading-[1.5] [&>span]:font-bold [&>span]:text-slate-700"
                  aria-label={item.name}
                  aria-pressed={draft.outfit === item.id}
                  onClick={() => setDraft({ ...draft, outfit: item.id })}
                >
                  <Avatar
                    {...draft}
                    outfit={item.id}
                    part="outfit"
                    className="mb-2 h-[66px] w-16 max-[640px]:h-[58px] max-[640px]:w-14"
                  />
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving} className="mb-6 min-w-0 border-0 p-0 min-[900px]:m-0">
            <legend className="mb-2.5 text-xs font-bold text-slate-700">Acessório</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {AVATAR_HEADWEARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex min-w-0 cursor-pointer flex-col items-center rounded-2xl border border-slate-200 bg-white px-[5px] py-3 shadow-[0_1px_2px_#0f172a08] transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-[0.65] aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:shadow-[0_0_0_1px_#2563eb] max-[640px]:px-1 max-[640px]:py-2.5 [&>small]:mt-1 [&>small]:text-center [&>small]:text-[9px] [&>small]:leading-[1.5] [&>small]:text-slate-500 max-[640px]:[&>small]:text-[8px] [&>span]:text-center [&>span]:text-[10px] [&>span]:leading-[1.5] [&>span]:font-bold [&>span]:text-slate-700"
                  aria-label={item.name}
                  aria-pressed={draft.headwear === item.id}
                  onClick={() => setDraft({ ...draft, headwear: item.id })}
                >
                  <Avatar
                    {...draft}
                    headwear={item.id}
                    part="headwear"
                    className="mb-2 h-[66px] w-16 max-[640px]:h-[58px] max-[640px]:w-14"
                  />
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
      <footer className="flex flex-col gap-3 px-7 pt-1 pb-7 max-[640px]:sticky max-[640px]:bottom-0 max-[640px]:z-[1] max-[640px]:border-t max-[640px]:border-slate-100 max-[640px]:bg-white max-[640px]:px-5 max-[640px]:pt-4 max-[640px]:pb-5 min-[900px]:justify-end min-[900px]:border-t min-[900px]:border-slate-100 min-[900px]:pt-4 [@media(min-width:900px)_and_(max-height:800px)]:pb-4">
        {saveError ? (
          <p
            className="rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-[1.5] text-red-700"
            role="alert"
          >
            {saveError}
          </p>
        ) : null}
        <div className="flex gap-3 max-[360px]:flex-col max-[360px]:gap-2 min-[900px]:justify-end">
          <Button type="button" onClick={saveAvatar} disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar avatar"} <Check size={18} />
          </Button>
          <Button
            type="button"
            variant="cancel"
            size="unstyled"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </footer>
    </dialog>
  );
}
