"use client";

import * as React from "react";

import { addPlaylistNewsAction } from "@/app/api/rooms/actions/add-playlist-news.action";
import { createRoomAction } from "@/app/api/rooms/actions/create-room.action";
import { joinRoomAction } from "@/app/api/rooms/actions/join-room.action";
import { startGameAction } from "@/app/api/rooms/actions/start-game.action";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ActionExecutionResult } from "@/views/dev-sandbox/model/types";

interface RoomsSectionProps {
  onResult: (result: ActionExecutionResult) => void;
}

export function RoomsSection({ onResult }: RoomsSectionProps): React.ReactElement {
  // Shared state to facilitate chained testing
  const [createdRoomId, setCreatedRoomId] = React.useState("");
  const [roomPin, setRoomPin] = React.useState("");

  // createRoom state
  const [roomName, setRoomName] = React.useState("Dev Test Room");
  const [duration, setDuration] = React.useState("30");

  // joinRoom state
  const [joinPin, setJoinPin] = React.useState("");

  // startGame state
  const [startRoomId, setStartRoomId] = React.useState("");

  // addPlaylist state
  const [playlistRoomId, setPlaylistRoomId] = React.useState("");
  const [newsUrl, setNewsUrl] = React.useState("https://g1.globo.com");

  const [isPending, startTransition] = React.useTransition();

  const handleCreateRoom = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await createRoomAction({
          name: roomName,
          roundDurationSeconds: Number(duration) || 30,
        });
        const durationMs = Math.round(performance.now() - startTime);

        if (result.success) {
          setCreatedRoomId(result.room.id);
          setRoomPin(result.pin);
          setJoinPin(result.pin);
          setStartRoomId(result.room.id);
          setPlaylistRoomId(result.room.id);
        }

        onResult({
          id: crypto.randomUUID(),
          actionName: "createRoomAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "createRoomAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleJoinRoom = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await joinRoomAction({
          pin: joinPin || roomPin,
        });
        const durationMs = Math.round(performance.now() - startTime);

        if (result.success) {
          setStartRoomId(result.room.id);
          setPlaylistRoomId(result.room.id);
        }

        onResult({
          id: crypto.randomUUID(),
          actionName: "joinRoomAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "joinRoomAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleAddPlaylistNews = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const targetRoomId = playlistRoomId || createdRoomId;
        const result = await addPlaylistNewsAction({
          roomId: targetRoomId,
          news: [{ url: newsUrl.trim() }],
        });
        const durationMs = Math.round(performance.now() - startTime);

        onResult({
          id: crypto.randomUUID(),
          actionName: "addPlaylistNewsAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "addPlaylistNewsAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleStartGame = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const targetRoomId = startRoomId || createdRoomId;
        const result = await startGameAction({
          roomId: targetRoomId,
        });
        const durationMs = Math.round(performance.now() - startTime);

        onResult({
          id: crypto.randomUUID(),
          actionName: "startGameAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "startGameAction",
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
        <CardTitle className="text-lg">Rooms Actions</CardTitle>
        <CardDescription>
          Create multiplayer game rooms, join with PIN, add playlist news, and start the game.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Room */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">createRoomAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="room-duration">Round Duration (sec)</Label>
              <Input
                id="room-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration in seconds"
                disabled={isPending}
              />
            </div>
          </div>
          <Button onClick={handleCreateRoom} disabled={isPending} size="sm">
            Execute Create Room
          </Button>
          {roomPin && (
            <div className="text-muted-foreground pt-1 text-xs">
              Latest Created Room ID: <span className="font-mono">{createdRoomId}</span> | PIN:{" "}
              <span className="text-foreground font-mono font-bold">{roomPin}</span>
            </div>
          )}
        </div>

        {/* Join Room */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">joinRoomAction</h3>
          <div className="space-y-1">
            <Label htmlFor="join-pin">Room PIN</Label>
            <Input
              id="join-pin"
              value={joinPin}
              onChange={(e) => setJoinPin(e.target.value)}
              placeholder="e.g. 123456"
              disabled={isPending}
            />
          </div>
          <Button onClick={handleJoinRoom} disabled={isPending} size="sm">
            Execute Join Room
          </Button>
        </div>

        {/* Add Playlist News */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">addPlaylistNewsAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="playlist-room-id">Room ID</Label>
              <Input
                id="playlist-room-id"
                value={playlistRoomId}
                onChange={(e) => setPlaylistRoomId(e.target.value)}
                placeholder="Room UUID"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="playlist-url">News URL</Label>
              <Input
                id="playlist-url"
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                placeholder="https://..."
                disabled={isPending}
              />
            </div>
          </div>
          <Button onClick={handleAddPlaylistNews} disabled={isPending} size="sm">
            Execute Add Playlist News
          </Button>
        </div>

        {/* Start Game */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">startGameAction</h3>
          <div className="space-y-1">
            <Label htmlFor="start-room-id">Room ID</Label>
            <Input
              id="start-room-id"
              value={startRoomId}
              onChange={(e) => setStartRoomId(e.target.value)}
              placeholder="Room UUID"
              disabled={isPending}
            />
          </div>
          <Button onClick={handleStartGame} disabled={isPending} size="sm">
            Execute Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
