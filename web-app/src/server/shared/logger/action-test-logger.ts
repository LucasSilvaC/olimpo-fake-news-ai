import pino, { type Level, type Logger } from "pino";
import pretty from "pino-pretty";

export type ActionLifecyclePhase =
  | "INPUT_RECEIVED"
  | "VALIDATION"
  | "STATE_TRANSFORMATION"
  | "PERSISTENCE"
  | "SESSION_COOKIE"
  | "RESULT";

export interface ActionTestLoggerOptions {
  level?: Level | string;
  stream?: pino.DestinationStream;
}

export interface MockCookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export class ActionTestLogger {
  readonly actionName: string;
  readonly raw: Logger;

  constructor(actionName: string, options?: ActionTestLoggerOptions) {
    this.actionName = actionName;
    const level = options?.level || process.env.LOG_LEVEL || "info";
    const dest =
      options?.stream ||
      pretty({
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
        sync: true,
      });
    this.raw = pino({ level }, dest);
  }

  logPhase(phase: ActionLifecyclePhase, data?: Record<string, unknown>, message?: string): void {
    const context = {
      action: this.actionName,
      phase,
      ...data,
    };
    this.raw.info(context, message || `[${this.actionName}] ${phase}`);
  }

  inputReceived(input: unknown, message?: string): void {
    let serializedInput: unknown = input;

    if (typeof FormData !== "undefined" && input instanceof FormData) {
      const formObj: Record<string, unknown> = {};
      input.forEach((value, key) => {
        if (key.toLowerCase().includes("password")) {
          formObj[key] = "[REDACTED]";
        } else {
          formObj[key] = value;
        }
      });
      serializedInput = formObj;
    } else if (input && typeof input === "object") {
      const obj = { ...(input as Record<string, unknown>) };
      for (const key of Object.keys(obj)) {
        if (key.toLowerCase().includes("password")) {
          obj[key] = "[REDACTED]";
        }
      }
      serializedInput = obj;
    }

    this.raw.info(
      {
        action: this.actionName,
        phase: "INPUT_RECEIVED" as const,
        input: serializedInput,
      },
      message || `[${this.actionName}] Received input`,
    );
  }

  validation(status: "passed" | "failed" | boolean, details?: unknown, message?: string): void {
    const isPassed = status === "passed" || status === true;
    const context = {
      action: this.actionName,
      phase: "VALIDATION" as const,
      status: isPassed ? "passed" : "failed",
      details,
    };

    if (isPassed) {
      this.raw.info(context, message || `[${this.actionName}] Validation succeeded`);
    } else {
      this.raw.warn(context, message || `[${this.actionName}] Validation failed`);
    }
  }

  stateTransformation(details: unknown, message?: string): void {
    this.raw.info(
      {
        action: this.actionName,
        phase: "STATE_TRANSFORMATION" as const,
        details,
      },
      message || `[${this.actionName}] State transformed`,
    );
  }

  persistence(operation: string, details?: unknown, message?: string): void {
    this.raw.info(
      {
        action: this.actionName,
        phase: "PERSISTENCE" as const,
        operation,
        details,
      },
      message || `[${this.actionName}] Persistence: ${operation}`,
    );
  }

  sessionCookie(
    operation: "set" | "delete" | "get",
    name: string,
    details?: unknown,
    message?: string,
  ): void {
    this.raw.info(
      {
        action: this.actionName,
        phase: "SESSION_COOKIE" as const,
        operation,
        cookieName: name,
        details,
      },
      message || `[${this.actionName}] Session cookie ${operation}: ${name}`,
    );
  }

  result(res: unknown, message?: string): void {
    const isError =
      res instanceof Error ||
      (typeof res === "object" &&
        res !== null &&
        "success" in res &&
        (res as { success: unknown }).success === false);

    const context = {
      action: this.actionName,
      phase: "RESULT" as const,
      result: res,
    };

    if (isError) {
      this.raw.warn(context, message || `[${this.actionName}] Action finished with error`);
    } else {
      this.raw.info(context, message || `[${this.actionName}] Action executed successfully`);
    }
  }
}

export function createActionTestLogger(
  actionName: string,
  options?: ActionTestLoggerOptions,
): ActionTestLogger {
  return new ActionTestLogger(actionName, options);
}

export interface MockCookieStore {
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  get: (name: string) => { name: string; value: string } | undefined;
  delete: (name: string) => void;
  getAll: () => Array<{ name: string; value: string }>;
  has: (name: string) => boolean;
  clear: () => void;
  store: Map<string, MockCookie>;
}

export function createMockCookieStore(logger?: ActionTestLogger): MockCookieStore {
  const store = new Map<string, MockCookie>();

  const cookieStore: MockCookieStore = {
    store,
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      store.set(name, { name, value, options });
      logger?.sessionCookie("set", name, {
        valuePreview: value && value.length > 20 ? `${value.slice(0, 10)}...` : value,
        options,
      });
    },
    get: (name: string) => {
      const cookie = store.get(name);
      logger?.sessionCookie("get", name, { found: Boolean(cookie) });
      if (!cookie) return undefined;
      return { name: cookie.name, value: cookie.value };
    },
    delete: (name: string) => {
      const existed = store.delete(name);
      logger?.sessionCookie("delete", name, { existed });
    },
    getAll: () => {
      return Array.from(store.values()).map((c) => ({
        name: c.name,
        value: c.value,
      }));
    },
    has: (name: string) => store.has(name),
    clear: () => store.clear(),
  };

  return cookieStore;
}
