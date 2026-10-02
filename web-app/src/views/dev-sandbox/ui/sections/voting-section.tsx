"use client";

import * as React from "react";

import { advanceRoundAction } from "@/app/api/news-voting/actions/advance-round.action";
import { submitVoteAction } from "@/app/api/news-voting/actions/submit-vote.action";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ActionExecutionResult } from "@/views/dev-sandbox/model/types";

interface VotingSectionProps {
  onResult: (result: ActionExecutionResult) => void;
}

export function VotingSection({ onResult }: VotingSectionProps): React.ReactElement {
  const [roomId, setRoomId] = React.useState("");
  const [vote, setVote] = React.useState<"reliable" | "uncertain" | "unreliable">("reliable");
  const [advanceRoomId, setAdvanceRoomId] = React.useState("");

  const [isPending, startTransition] = React.useTransition();

  const handleSubmitVote = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await submitVoteAction({
          roomId,
          vote,
        });
        const durationMs = Math.round(performance.now() - startTime);

        onResult({
          id: crypto.randomUUID(),
          actionName: "submitVoteAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "submitVoteAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleAdvanceRound = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const targetRoomId = advanceRoomId || roomId;
        const result = await advanceRoundAction({
          roomId: targetRoomId,
        });
        const durationMs = Math.round(performance.now() - startTime);

        onResult({
          id: crypto.randomUUID(),
          actionName: "advanceRoundAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "advanceRoundAction",
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
        <CardTitle className="text-lg">News Voting Actions</CardTitle>
        <CardDescription>
          Submit player votes on current round news and advance to the next round.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Submit Vote */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">submitVoteAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="vote-room-id">Room ID</Label>
              <Input
                id="vote-room-id"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  if (!advanceRoomId) setAdvanceRoomId(e.target.value);
                }}
                placeholder="Room UUID"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vote-choice">Vote Choice</Label>
              <select
                id="vote-choice"
                value={vote}
                onChange={(e) => setVote(e.target.value as "reliable" | "uncertain" | "unreliable")}
                disabled={isPending}
                className="bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="reliable">reliable</option>
                <option value="uncertain">uncertain</option>
                <option value="unreliable">unreliable</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSubmitVote} disabled={isPending} size="sm">
            Execute Submit Vote
          </Button>
        </div>

        {/* Advance Round */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">advanceRoundAction</h3>
          <div className="space-y-1">
            <Label htmlFor="advance-room-id">Room ID</Label>
            <Input
              id="advance-room-id"
              value={advanceRoomId}
              onChange={(e) => setAdvanceRoomId(e.target.value)}
              placeholder="Room UUID"
              disabled={isPending}
            />
          </div>
          <Button onClick={handleAdvanceRound} disabled={isPending} size="sm">
            Execute Advance Round
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
