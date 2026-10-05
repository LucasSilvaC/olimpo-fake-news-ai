export interface ActionExecutionResult {
  id: string;
  actionName: string;
  status: "success" | "error";
  durationMs: number;
  timestamp: string;
  data: unknown;
}
