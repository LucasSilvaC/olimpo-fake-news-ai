import type { DemoNewsFixture } from "@/server/demo/demo-news";

export interface LoadDemoNewsRepositoryInput {
  roomId: string;
  hostId: string;
  fixtures: DemoNewsFixture[];
}

export interface LoadedDemoNews {
  playlistItems: {
    id: string;
    roomId: string;
    articleId: string;
    roundOrder: number;
  }[];
  totalRounds: number;
}

export interface ILoadDemoNewsRepository {
  load(input: LoadDemoNewsRepositoryInput): Promise<LoadedDemoNews>;
}
