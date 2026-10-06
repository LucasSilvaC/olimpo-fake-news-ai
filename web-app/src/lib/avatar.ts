import { z } from "zod";

export const AVATAR_SKINS = [
  { name: "Pele clara", color: "#f6d8b7" },
  { name: "Pele bege", color: "#eac095" },
  { name: "Pele dourada", color: "#dba071" },
  { name: "Pele castanha", color: "#b97950" },
  { name: "Pele marrom", color: "#885638" },
  { name: "Pele retinta", color: "#593d32" },
] as const;

export const AVATAR_OUTFITS = [
  { id: "tunic", name: "Túnica clássica", detail: "Marfim e ouro" },
  { id: "armor", name: "Armadura heroica", detail: "Bronze e coragem" },
  { id: "cape", name: "Manto do Egeu", detail: "Azul e branco" },
] as const;

export const AVATAR_HEADWEARS = [
  { id: "laurel", name: "Coroa de louros", detail: "Um toque de glória" },
  { id: "helmet", name: "Elmo grego", detail: "Pronto para a aventura" },
  // Keep the stored ID so existing avatars automatically receive the replacement crown.
  { id: "hat", name: "Coroa real", detail: "Seu toque de realeza" },
] as const;

export const avatarConfigSchema = z.object({
  gender: z.enum(["male", "female"]),
  skin: z.enum(["#f6d8b7", "#eac095", "#dba071", "#b97950", "#885638", "#593d32"]),
  outfit: z.enum(["tunic", "armor", "cape"]),
  headwear: z.enum(["laurel", "helmet", "hat"]),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: "male",
  skin: "#dba071",
  outfit: "tunic",
  headwear: "laurel",
};
