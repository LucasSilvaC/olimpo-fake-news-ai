"use client";

import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

interface SseEventItem {
  id: string;
  type: string;
  data: unknown;
  timestamp: string;
}

const KNOWN_EVENTS = [
  "message",
  "MEMBER_JOINED",
  "ROUND_STARTED",
  "ROUND_COMPLETED",
  "MATCH_FINISHED",
];

export function SseSection(): React.ReactElement {
  const [pin, setPin] = React.useState("");
  const [status, setStatus] = React.useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  );
  const [events, setEvents] = React.useState<SseEventItem[]>([]);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  const disconnect = React.useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const connect = React.useCallback(() => {
    if (!pin.trim()) return;

    disconnect();
    setStatus("connecting");

    const normalizedPin = pin.trim().toUpperCase();
    const es = new EventSource(`/api/rooms/${encodeURIComponent(normalizedPin)}/events`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus("connected");
    };

    es.onerror = () => {
      setStatus("error");
    };

    const handleMessage = (e: MessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(e.data);
      } catch {
        parsed = e.data;
      }
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          type: e.type,
          data: parsed,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    };

    KNOWN_EVENTS.forEach((eventType) => {
      es.addEventListener(eventType, handleMessage);
    });
  }, [pin, disconnect]);

  React.useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Connected</Badge>;
      case "connecting":
        return <Badge variant="secondary">Connecting...</Badge>;
      case "error":
        return <Badge variant="destructive">Error / Disconnected</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Realtime SSE Stream</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Connect to a room channel (/api/rooms/[pin]/events) via Server-Sent Events to monitor live
          events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-end gap-3 sm:flex-row">
          <div className="w-full space-y-1 sm:flex-1">
            <Label htmlFor="sse-pin">Room PIN</Label>
            <Input
              id="sse-pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 123456"
              disabled={status === "connected" || status === "connecting"}
            />
          </div>
          <div className="flex gap-2">
            {status === "connected" || status === "connecting" ? (
              <Button variant="outline" onClick={disconnect} size="sm">
                Disconnect SSE
              </Button>
            ) : (
              <Button onClick={connect} disabled={!pin.trim()} size="sm">
                Connect SSE
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEvents([])}
              disabled={events.length === 0}
              size="sm"
            >
              Clear Events
            </Button>
          </div>
        </div>

        {/* Event Log Output */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Incoming Events Log</span>
            <span>{events.length} event(s)</span>
          </div>
          <div className="bg-muted/20 max-h-60 space-y-2 overflow-y-auto rounded-lg border p-2 font-mono text-xs">
            {events.length === 0 ? (
              <p className="text-muted-foreground p-3 text-center">
                No events received yet. Connect to an active room to listen for events.
              </p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="bg-background space-y-1 rounded border p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary">{evt.type}</span>
                    <span className="text-muted-foreground font-normal">{evt.timestamp}</span>
                  </div>
                  <pre className="text-foreground overflow-x-auto text-[11px]">
                    {typeof evt.data === "string" ? evt.data : JSON.stringify(evt.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
