import { createNewsPredictionResponse } from "./response";
export const runtime = "nodejs";
export async function POST(request: Request): Promise<Response> {
  return createNewsPredictionResponse(request);
}
