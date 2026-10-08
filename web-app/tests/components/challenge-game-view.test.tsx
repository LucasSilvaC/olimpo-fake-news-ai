import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ListedGlobalChallengeDTO } from "@/app/api/global-challenges/usecase/list-global-challenges.usecase";
import { ChallengeGameView } from "@/views/challenge/ui/challenge-game-view";
import type { IRoundScoreboardStageProps } from "@/views/room-game/ui/round-scoreboard-stage";

const mocks = vi.hoisted(() => ({ answer: vi.fn(), roomVote: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/widgets/app-header", () => ({
  Header: ({ children }: { children: ReactNode }) => <header>{children}</header>,
}));
vi.mock("@/app/api/global-challenges/actions/answer-global-challenge.action", () => ({
  answerGlobalChallengeAction: mocks.answer,
}));
vi.mock("@/app/api/news-voting/actions/submit-vote.action", () => ({
  submitVoteAction: mocks.roomVote,
}));
vi.mock("@/views/room-game/ui/round-scoreboard-stage", () => ({
  RoundScoreboardStage: ({ onAdvance, leaderboard }: IRoundScoreboardStageProps) => (
    <button onClick={onAdvance}>Next solo round: {leaderboard[0]?.score} XP</button>
  ),
}));
vi.mock("@/views/room-game/ui/match-scoreboard-stage", () => ({
  MatchScoreboardStage: () => <p>Solo complete</p>,
}));

function challenge(id: string): ListedGlobalChallengeDTO {
  return {
    id,
    title: `Challenge ${id}`,
    articleId: id,
    xpReward: 50,
    isActive: true,
    createdAt: new Date(),
    isAnswered: false,
    analysis: { classification: "reliable", reasons: ["Legacy simulated reason"], confidence: 99 },
    article: {
      id,
      targetClassification: "reliable",
      createdAt: new Date(),
      article: {
        url: "https://example.com/news",
        canonicalUrl: "https://example.com/news",
        title: `News ${id}`,
        description: "Description",
        authors: [],
        publishedAt: null,
        modifiedAt: null,
        content: "Article body",
        imageUrl: null,
        publisher: "Publisher",
        language: "pt",
        extractionMethod: "local",
        usedFallback: false,
      },
    },
  };
}

beforeEach(() => vi.stubGlobal("fetch", mocks.fetch));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("solo compatibility with supervised room feedback", () => {
  it("uses the authoritative answer, retains XP and advances without room requests", async () => {
    mocks.answer.mockResolvedValue({
      success: true,
      answer: { id: "answer-1" },
      isCorrect: true,
      xpAwarded: 50,
      targetClassification: "unreliable",
      analysis: {
        classification: "reliable",
        reasons: ["Legacy simulated reason"],
        confidence: 99,
      },
    });
    render(
      <ChallengeGameView
        challenges={[challenge("one"), challenge("two")]}
        currentUser={{ id: "user-1", name: "User" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Classificar notícia como Falsa" }));
    expect(await screen.findByText("Gabarito Oficial")).toBeVisible();
    expect(screen.getByText("Gabarito Oficial").parentElement).toHaveTextContent("FALSO");
    expect(screen.getByText("50 XP ganhos")).toBeVisible();
    expect(screen.queryByText("Legacy simulated reason")).toBeNull();
    expect(document.body.textContent).not.toMatch(/99%|85%|Análise do modelo/);
    expect(mocks.answer).toHaveBeenCalledWith({ challengeId: "one", answer: "unreliable" });
    fireEvent.click(screen.getByRole("button", { name: /Ir para o Placar da Rodada/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next solo round: 50 XP" }));
    expect(screen.getByRole("heading", { name: "News two" })).toBeVisible();
    expect(mocks.roomVote).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
