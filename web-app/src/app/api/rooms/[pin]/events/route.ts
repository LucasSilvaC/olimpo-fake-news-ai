import { createSSEResponse } from "@/app/api/rooms/[pin]/events/sse-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pin: string }> },
): Promise<Response> {
  const { pin } = await context.params;
  return createSSEResponse(request, pin);
}
