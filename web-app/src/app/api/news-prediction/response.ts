import { z } from "zod";

import { getSessionUseCase } from "../auth/usecase/get-session.usecase";

import {
  getNewsPredictionUseCase,
  NewsPredictionAccessError,
  type GetNewsPredictionUseCase,
} from "./usecase/get-news-prediction.usecase";

const requestSchema = z
  .object({ roomId: z.string().min(1).max(200), round: z.number().int().min(1) })
  .strict();
export async function createNewsPredictionResponse(
  request: Request,
  dependencies: {
    getUserId?: () => Promise<string>;
    useCase?: Pick<GetNewsPredictionUseCase, "execute">;
  } = {},
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  let userId: string;
  try {
    userId = await (
      dependencies.getUserId ?? (async () => (await getSessionUseCase.execute()).id)
    )();
  } catch {
    return Response.json({ error: "Sessão necessária." }, { status: 401, headers });
  }
  let payload;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Informe apenas roomId e round válidos." },
      { status: 400, headers },
    );
  }
  try {
    return Response.json(
      await (dependencies.useCase ?? getNewsPredictionUseCase).execute({ ...payload, userId }),
      { headers },
    );
  } catch (error) {
    if (error instanceof NewsPredictionAccessError)
      return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json(
      { error: "Não foi possível carregar a previsão desta rodada." },
      { status: 503, headers },
    );
  }
}
