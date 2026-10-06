import { drizzleUserRepository } from "../repositories/drizzle-user.repository";
import { IUserAvatarRepository } from "../repositories/user.repository.interface";

import { avatarConfigSchema, type AvatarConfig } from "@/lib/avatar";

export class UpdateAvatarUseCase {
  constructor(private readonly userRepository: IUserAvatarRepository = drizzleUserRepository) {}

  async execute(userId: string, avatar: AvatarConfig): Promise<void> {
    const validAvatar = avatarConfigSchema.parse(avatar);
    await this.userRepository.updateAvatar(userId, validAvatar);
  }
}
