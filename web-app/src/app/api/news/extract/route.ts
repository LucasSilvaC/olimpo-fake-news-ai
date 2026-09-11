import { ExtractionError } from "@/lib/news/errors";
import { extractNews } from "@/lib/news/extract-news";
import { readLimitedBody } from "@/lib/news/fetch-page";
import { extractNewsSchema } from "@/lib/news/schemas";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = JSON.parse((await readLimitedBody(request.body, 8192)).toString("utf8"));
    } catch {
      throw new ExtractionError("INVALID_URL");
    }
    const parsed = extractNewsSchema.safeParse(body);
    if (!parsed.success) throw new ExtractionError("INVALID_URL");
    return Response.json(await extractNews(parsed.data.url), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const failure =
      error instanceof ExtractionError ? error : new ExtractionError("INTERNAL_ERROR");
    return Response.json(
      { error: failure.code, message: failure.message },
      {
        status: failure.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
