import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifySessionToken } from "../entities/jwt.helper";
import { drizzleUserRepository } from "../repositories/drizzle-user.repository";
import { IUserRepository } from "../repositories/user.repository.interface";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  xp: number;
}

export class GetSessionUseCase {
  constructor(private readonly userRepository: IUserRepository = drizzleUserRepository) {}

  async execute(token?: string): Promise<SessionUser> {
    let resolvedToken = token;

    if (!resolvedToken) {
      try {
        const cookieStore = await cookies();
        resolvedToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      } catch {
        // cookies() may not be available outside Next.js request context (e.g., pure unit tests)
      }
    }

    if (!resolvedToken) {
      throw new Error("Unauthorized: Missing session token");
    }

    let payload;
    try {
      payload = await verifySessionToken(resolvedToken);
    } catch {
      throw new Error("Unauthorized: Invalid or expired session token");
    }

    const user = await this.userRepository.findById(payload.id);
    if (!user) {
      throw new Error("Unauthorized: User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
    };
  }
}

export const getSessionUseCase = new GetSessionUseCase();
