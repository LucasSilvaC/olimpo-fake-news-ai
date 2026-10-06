"use client";

import { Check, RotateCcw, Shuffle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import styles from "./avatar-editor-modal.module.css";

import { Avatar } from "@/components/atoms/avatar";
import {
  AVATAR_HEADWEARS,
  AVATAR_OUTFITS,
  AVATAR_SKINS,
  DEFAULT_AVATAR,
  type AvatarConfig,
} from "@/lib/avatar";

interface AvatarEditorModalProps {
  open: boolean;
  value: AvatarConfig;
  onSave: (value: AvatarConfig) => void;
  onClose: () => void;
}

export function AvatarEditorModal(props: AvatarEditorModalProps) {
  return props.open ? <EditorSession {...props} /> : null;
}

function EditorSession({ value, onSave, onClose }: AvatarEditorModalProps) {
  const [draft, setDraft] = useState<AvatarConfig>(value);
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

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            <span aria-hidden="true" />
            Sua identidade no Olimpo
          </span>
          <h2 id={titleId}>Personalize seu avatar</h2>
          <p id={descriptionId}>Experimente. Combine. Faça do seu jeito.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar editor de avatar"
          className={styles.iconButton}
        >
          <X size={20} />
        </button>
      </header>
      <div className={styles.customizer}>
        <section className={styles.preview} aria-label="Prévia do personagem">
          <div className={styles.previewTop}>
            <span>PRÉVIA AO VIVO</span>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Restaurar avatar inicial"
              title="Restaurar avatar inicial"
              onClick={() => setDraft(DEFAULT_AVATAR)}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <div className={styles.stage}>
            <div className={styles.arch} aria-hidden="true" />
            <Avatar
              {...draft}
              className={styles.hero}
              label={draft.gender === "female" ? "Sua heroína do Olimpo" : "Seu herói do Olimpo"}
            />
          </div>
          <div className={styles.previewDetails}>
            <p className={styles.caption}>
              {draft.gender === "female" ? "Uma nova heroína do Olimpo" : "Um novo herói do Olimpo"}
            </p>
            <p className={styles.previewHint}>
              Cada detalhe conta. Monte um personagem com a sua cara.
            </p>
            <button type="button" className={styles.shuffle} onClick={shuffle}>
              <Shuffle size={16} /> Surpreenda-me
            </button>
          </div>
          <div className={styles.smallPreview}>
            <Avatar {...draft} part="face" className={styles.smallFace} />
            <span>Seu avatar durante o jogo</span>
          </div>
        </section>
        <section className={styles.controls} aria-label="Personalizar avatar">
          <fieldset>
            <legend>Gênero</legend>
            <div className={styles.genders}>
              {(
                [
                  { id: "male", name: "Masculino" },
                  { id: "female", name: "Feminino" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.gender}
                  aria-pressed={draft.gender === item.id}
                  onClick={() => setDraft({ ...draft, gender: item.id })}
                >
                  <Avatar {...draft} gender={item.id} part="face" className={styles.genderFace} />
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Tom de pele</legend>
            <div className={styles.swatches}>
              {AVATAR_SKINS.map((item, index) => (
                <button
                  key={item.color}
                  type="button"
                  className={styles.swatch}
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
          <fieldset>
            <legend>Roupa</legend>
            <div className={styles.options}>
              {AVATAR_OUTFITS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.option}
                  aria-label={item.name}
                  aria-pressed={draft.outfit === item.id}
                  onClick={() => setDraft({ ...draft, outfit: item.id })}
                >
                  <Avatar
                    {...draft}
                    outfit={item.id}
                    part="outfit"
                    className={styles.optionAvatar}
                  />
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Acessório</legend>
            <div className={styles.options}>
              {AVATAR_HEADWEARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.option}
                  aria-label={item.name}
                  aria-pressed={draft.headwear === item.id}
                  onClick={() => setDraft({ ...draft, headwear: item.id })}
                >
                  <Avatar
                    {...draft}
                    headwear={item.id}
                    part="headwear"
                    className={styles.optionAvatar}
                  />
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.save}
          onClick={() => {
            onSave(draft);
            onClose();
          }}
        >
          Salvar avatar <Check size={18} />
        </button>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancelar
        </button>
      </footer>
    </dialog>
  );
}
