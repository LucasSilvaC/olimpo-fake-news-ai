import { createNewsInsightsResponse } from "./response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return createNewsInsightsResponse(request);
}
