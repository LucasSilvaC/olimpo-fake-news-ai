import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifySessionToken } from "../entities/jwt.helper";
import { drizzleUserRepository } from "../repositories/drizzle-user.repository";
import { IUserRepository } from "../repositories/user.repository.interface";

import { DEFAULT_AVATAR, type AvatarConfig } from "@/lib/avatar";
import { UserRoleType } from "@/server/shared/database/schemas";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  xp: number;
  role: UserRoleType;
  avatar: AvatarConfig;
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

    const avatar = (await this.userRepository.findAvatarByUserId(user.id)) ?? DEFAULT_AVATAR;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      role: user.role,
      avatar,
    };
  }
}

export const getSessionUseCase = new GetSessionUseCase();
