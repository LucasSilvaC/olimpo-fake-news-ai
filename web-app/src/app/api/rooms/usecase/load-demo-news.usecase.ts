import "server-only";

import type { ILoadDemoNewsRepository } from "../repositories/load-demo-news.repository.interface";

import { getDemoNewsFixture } from "@/server/demo/demo-news";

export interface LoadDemoNewsInput {
  roomId: string;
  hostId: string;
  fixtureIds: string[];
}

export class LoadDemoNewsUseCase {
  constructor(private readonly repository: ILoadDemoNewsRepository) {}

  async execute(input: LoadDemoNewsInput) {
    if (process.env.DEMO_CHALLENGES_ENABLED === "false") {
      throw new Error("Os exemplos preparados estão desativados neste ambiente.");
    }
    if (!input.fixtureIds.length || input.fixtureIds.length > 3) {
      throw new Error("Selecione entre um e três exemplos.");
    }

    const fixtures = [...new Set(input.fixtureIds)].map((id) => {
      const fixture = getDemoNewsFixture(id);
      if (!fixture) throw new Error("Exemplo preparado não encontrado.");
      return fixture;
    });

    return this.repository.load({
      roomId: input.roomId,
      hostId: input.hostId,
      fixtures,
    });
  }
}
