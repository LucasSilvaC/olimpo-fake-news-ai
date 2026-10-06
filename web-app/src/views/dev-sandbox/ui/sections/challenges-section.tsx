"use client";

import * as React from "react";

import { answerGlobalChallengeAction } from "@/app/api/global-challenges/actions/answer-global-challenge.action";
import { listGlobalChallengesAction } from "@/app/api/global-challenges/actions/list-global-challenges.action";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ActionExecutionResult } from "@/views/dev-sandbox/model/types";

interface ChallengesSectionProps {
  onResult: (result: ActionExecutionResult) => void;
}

export function ChallengesSection({ onResult }: ChallengesSectionProps): React.ReactElement {
  const [challengeId, setChallengeId] = React.useState("");
  const [answer, setAnswer] = React.useState<"reliable" | "uncertain" | "unreliable">("reliable");

  const [isPending, startTransition] = React.useTransition();

  const handleListChallenges = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await listGlobalChallengesAction();
        const durationMs = Math.round(performance.now() - startTime);

        if (result.success && result.challenges.length > 0 && !challengeId) {
          const first = result.challenges[0];
          if (first) {
            setChallengeId(first.id);
          }
        }

        onResult({
          id: crypto.randomUUID(),
          actionName: "listGlobalChallengesAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "listGlobalChallengesAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleAnswerChallenge = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await answerGlobalChallengeAction({
          challengeId,
          answer,
        });
        const durationMs = Math.round(performance.now() - startTime);

        onResult({
          id: crypto.randomUUID(),
          actionName: "answerGlobalChallengeAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "answerGlobalChallengeAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Global Challenges Actions</CardTitle>
        <CardDescription>
          Fetch global daily news challenges and submit user classifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* List Challenges */}
        <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-semibold">listGlobalChallengesAction</h3>
            <p className="text-muted-foreground text-xs">
              Retrieve all active global challenges with user completion status
            </p>
          </div>
          <Button onClick={handleListChallenges} disabled={isPending} size="sm">
            Execute List Challenges
          </Button>
        </div>

        {/* Answer Challenge */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">answerGlobalChallengeAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="challenge-id">Challenge ID</Label>
              <Input
                id="challenge-id"
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                placeholder="Challenge UUID"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="challenge-answer">Answer</Label>
              <select
                id="challenge-answer"
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value as "reliable" | "uncertain" | "unreliable")
                }
                disabled={isPending}
                className="bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="reliable">reliable</option>
                <option value="uncertain">uncertain</option>
                <option value="unreliable">unreliable</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAnswerChallenge} disabled={isPending} size="sm">
            Execute Answer Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
