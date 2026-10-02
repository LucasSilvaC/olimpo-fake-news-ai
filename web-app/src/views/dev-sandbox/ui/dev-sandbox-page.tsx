"use client";

import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { ActionExecutionResult } from "@/views/dev-sandbox/model/types";
import { AuthSection } from "@/views/dev-sandbox/ui/sections/auth-section";
import { ChallengesSection } from "@/views/dev-sandbox/ui/sections/challenges-section";
import { RoomsSection } from "@/views/dev-sandbox/ui/sections/rooms-section";
import { SseSection } from "@/views/dev-sandbox/ui/sections/sse-section";
import { VotingSection } from "@/views/dev-sandbox/ui/sections/voting-section";

export function DevSandboxPage(): React.ReactElement {
  const [history, setHistory] = React.useState<ActionExecutionResult[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleResult = React.useCallback((result: ActionExecutionResult) => {
    setHistory((prev) => [result, ...prev]);
    setSelectedId(result.id);
  }, []);

  const activeResult = history.find((item) => item.id === selectedId) ?? history[0] ?? null;

  const handleClear = () => {
    setHistory([]);
    setSelectedId(null);
  };

  return (
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Developer Sandbox</h1>
                <Badge variant="tag">Dev Environment</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Raw test harness for Server Actions (Auth, Rooms, Voting, Gamification) and SSE
                Streams.
              </p>
            </div>
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear History ({history.length})
              </Button>
            )}
          </div>
        </header>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Left Column: Action Cards */}
          <div className="space-y-6">
            <AuthSection onResult={handleResult} />
            <RoomsSection onResult={handleResult} />
            <VotingSection onResult={handleResult} />
            <ChallengesSection onResult={handleResult} />
            <SseSection />
          </div>

          {/* Right Column: Response Inspector */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <Card className="border-border border-2 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response Inspector</CardTitle>
                  {activeResult && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-xs">
                        {activeResult.durationMs}ms
                      </span>
                      <Badge
                        variant={activeResult.status === "success" ? "default" : "destructive"}
                        className={
                          activeResult.status === "success"
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {activeResult.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {activeResult
                    ? `Payload for ${activeResult.actionName} at ${activeResult.timestamp}`
                    : "Live payload inspection for executed server actions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeResult ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span className="text-foreground font-mono font-semibold">
                        {activeResult.actionName}
                      </span>
                      <span className="font-mono text-[11px]">{activeResult.timestamp}</span>
                    </div>
                    <pre className="bg-muted/40 text-foreground max-h-125 overflow-auto rounded-lg border p-4 font-mono text-xs leading-relaxed">
                      {JSON.stringify(activeResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm font-medium">No actions executed yet</p>
                    <p className="mt-1 text-xs">
                      Trigger any server action from the forms on the left to inspect its live
                      return value and duration.
                    </p>
                  </div>
                )}

                {/* Execution History */}
                {history.length > 1 && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>Execution History</span>
                      <span>{history.length} runs</span>
                    </div>
                    <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                      {history.map((item) => {
                        const isSelected = item.id === (activeResult?.id ?? "");
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={`flex w-full items-center justify-between rounded p-2 text-left font-mono text-xs transition-colors ${
                              isSelected
                                ? "bg-muted border font-semibold"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <span className="mr-2 flex-1 truncate">{item.actionName}</span>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-muted-foreground text-[11px]">
                                {item.durationMs}ms
                              </span>
                              <Badge
                                variant={item.status === "success" ? "default" : "destructive"}
                                className={`px-1.5 py-0 text-[10px] ${
                                  item.status === "success"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                                    : ""
                                }`}
                              >
                                {item.status === "success" ? "OK" : "ERR"}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
