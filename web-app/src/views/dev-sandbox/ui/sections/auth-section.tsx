"use client";

import * as React from "react";

import { loginAction } from "@/app/api/auth/actions/login.action";
import { logoutAction } from "@/app/api/auth/actions/logout.action";
import { registerAction } from "@/app/api/auth/actions/register.action";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ActionExecutionResult } from "@/views/dev-sandbox/model/types";

interface AuthSectionProps {
  onResult: (result: ActionExecutionResult) => void;
}

export function AuthSection({ onResult }: AuthSectionProps): React.ReactElement {
  const [registerName, setRegisterName] = React.useState("Dev Tester");
  const [registerEmail, setRegisterEmail] = React.useState("dev@example.com");
  const [registerPassword, setRegisterPassword] = React.useState("password123");

  const [loginEmail, setLoginEmail] = React.useState("dev@example.com");
  const [loginPassword, setLoginPassword] = React.useState("password123");

  const [isPending, startTransition] = React.useTransition();

  const handleRegister = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await registerAction({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        });
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "registerAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "registerAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleLogin = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await loginAction({
          email: loginEmail,
          password: loginPassword,
        });
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "loginAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "loginAction",
          status: "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      const startTime = performance.now();
      try {
        const result = await logoutAction();
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "logoutAction",
          status: result.success ? "success" : "error",
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          data: result,
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        onResult({
          id: crypto.randomUUID(),
          actionName: "logoutAction",
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
        <CardTitle className="text-lg">Authentication Actions</CardTitle>
        <CardDescription>
          Register, log in, or terminate an active session to test authenticated routes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Register */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">registerAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="reg-name">Name</Label>
              <Input
                id="reg-name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Name"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="Email"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Password (min 6)"
                disabled={isPending}
              />
            </div>
          </div>
          <Button onClick={handleRegister} disabled={isPending} size="sm">
            Execute Register
          </Button>
        </div>

        {/* Login */}
        <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">loginAction</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                disabled={isPending}
              />
            </div>
          </div>
          <Button onClick={handleLogin} disabled={isPending} size="sm">
            Execute Login
          </Button>
        </div>

        {/* Logout */}
        <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-semibold">logoutAction</h3>
            <p className="text-muted-foreground text-xs">Clear current session cookie</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isPending} size="sm">
            Execute Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
