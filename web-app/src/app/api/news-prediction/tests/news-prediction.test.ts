import { describe, expect, it, vi } from "vitest";

import { prediction } from "../../ai-feedback/tests/supervised-fixture";
import { createNewsPredictionResponse } from "../response";
import { GetNewsPredictionUseCase } from "../usecase/get-news-prediction.usecase";

import type { Room, RoomPlaylistItem } from "@/server/shared/database/schemas";

function fixture() {
  const room = { id: "room-1", status: "in_progress", currentRound: 1, totalRounds: 2 } as Room;
  const rooms = {
    findById: vi.fn(async () => room),
    findMember: vi.fn().mockResolvedValue({ userId: "member-1" }),
    getPlaylistItems: vi.fn().mockResolvedValue([
      {
        id: "item-1",
        roomId: "room-1",
        articleId: "article-1",
        roundOrder: 1,
      } as RoomPlaylistItem,
    ]),
  };
  const rounds = { isRoundCompleted: vi.fn().mockResolvedValue(false) };
  const analysis = {
    execute: vi.fn().mockResolvedValue({
      ...prediction,
      id: "analysis-1",
      articleId: "article-1",
      createdAt: new Date(),
    }),
  };
  const useCase = new GetNewsPredictionUseCase(rooms, rounds, analysis);
  const request = (body: unknown) =>
    new Request("http://localhost/api/news-prediction", {
      method: "POST",
      body: JSON.stringify(body),
    });
  const call = (body: unknown, getUserId = async () => "member-1") =>
    createNewsPredictionResponse(request(body), { getUserId, useCase });
  return { room, rooms, rounds, analysis, call };
}
describe("Authenticated prediction after collective closure", () => {
  it("requires a valid session and does not query inference", async () => {
    const f = fixture();
    expect(
      (
        await f.call({ roomId: "room-1", round: 1 }, async () => {
          throw new Error("unauthenticated");
        })
      ).status,
    ).toBe(401);
    expect(f.analysis.execute).not.toHaveBeenCalled();
  });
  it("rejects non-members, even when the round has closed", async () => {
    const f = fixture();
    f.rounds.isRoundCompleted.mockResolvedValue(true);
    f.rooms.findMember.mockResolvedValue(null);
    expect((await f.call({ roomId: "room-1", round: 1 })).status).toBe(403);
    expect(f.analysis.execute).not.toHaveBeenCalled();
  });
  it.each(["in_progress", "finished"])(
    "does not reveal an open round in room status %s",
    async (status) => {
      const f = fixture();
      f.room.status = status as Room["status"];
      expect((await f.call({ roomId: "room-1", round: 1 })).status).toBe(409);
      expect(f.analysis.execute).not.toHaveBeenCalled();
    },
  );
  it("does not unlock a prior round merely because the host advanced", async () => {
    const f = fixture();
    f.room.currentRound = 2;
    expect((await f.call({ roomId: "room-1", round: 1 })).status).toBe(409);
  });
  it.each([
    { roomId: "room-1", round: 1, text: "arbitrary" },
    { roomId: "room-1", round: 2.5 },
    { articleId: "article-1" },
  ])("accepts only room and integer round: %j", async (input) => {
    const f = fixture();
    expect((await f.call(input)).status).toBe(400);
    expect(f.analysis.execute).not.toHaveBeenCalled();
  });
  it("returns only authorized article analysis with no-store and round identity", async () => {
    const f = fixture();
    f.rounds.isRoundCompleted.mockResolvedValue(true);
    const response = await f.call({ roomId: "room-1", round: 1 });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      roomId: "room-1",
      round: 1,
      modelAnalysis: { fakeScore: 18 },
    });
    expect(f.analysis.execute).toHaveBeenCalledWith({ articleId: "article-1" });
  });
});
