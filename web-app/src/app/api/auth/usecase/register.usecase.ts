import crypto from "node:crypto";

import { UserEntity, UserDTO } from "../entities/user.entity";
import { drizzleUserRepository } from "../repositories/drizzle-user.repository";
import { IUserRepository } from "../repositories/user.repository.interface";

import { AvatarConfig, avatarConfigSchema, DEFAULT_AVATAR } from "@/lib/avatar";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  avatar?: AvatarConfig;
}

export interface RegisterOutput {
  user: UserDTO;
}

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository = drizzleUserRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const avatar = avatarConfigSchema.parse(
      input.avatar === undefined ? DEFAULT_AVATAR : input.avatar,
    );

    if (!input.name || input.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    if (!UserEntity.validateEmail(input.email)) {
      throw new Error("Invalid email address format");
    }

    if (!UserEntity.validatePassword(input.password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const passwordHash = await UserEntity.hashPassword(input.password, 10);
    const userId = crypto.randomUUID();

    const created = await this.userRepository.create(
      {
        id: userId,
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "participant",
        xp: 0,
      },
      avatar,
    );

    const userEntity = new UserEntity(created);
    return {
      user: userEntity.toDTO(),
    };
  }
}
