export interface LogoutOutput {
  success: boolean;
}

export class LogoutUseCase {
  async execute(): Promise<LogoutOutput> {
    return { success: true };
  }
}
