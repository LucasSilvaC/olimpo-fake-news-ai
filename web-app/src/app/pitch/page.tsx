import type { Metadata } from "next";

import { PitchDeck } from "@/views/pitch";

export const metadata: Metadata = {
  title: "Olimpo · Pitch",
  description: "Apresentação executiva do projeto Olimpo Fake News.",
};

export default function PitchPage(): React.ReactElement {
  return <PitchDeck />;
}
