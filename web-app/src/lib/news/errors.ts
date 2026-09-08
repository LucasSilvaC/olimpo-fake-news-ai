export type ErrorCode = "INVALID_URL" | "UNSAFE_URL" | "NOT_FOUND" | "EXTRACTION_FAILED" | "INTERNAL_ERROR";

const errors: Record<ErrorCode, { status: number; message: string }> = {
  INVALID_URL: { status: 400, message: "Informe uma URL HTTP ou HTTPS válida." },
  UNSAFE_URL: { status: 400, message: "Esta URL não pode ser acessada. Use uma notícia em um endereço público." },
  NOT_FOUND: { status: 404, message: "A página informada não foi encontrada." },
  EXTRACTION_FAILED: { status: 422, message: "Não foi possível extrair conteúdo suficiente. Verifique o link ou tente outra notícia." },
  INTERNAL_ERROR: { status: 500, message: "Ocorreu um erro ao extrair a notícia. Tente novamente." },
};

export class ExtractionError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode) {
    super(errors[code].message);
    this.name = "ExtractionError";
    this.status = errors[code].status;
  }
}
