import crypto from "node:crypto";
import { UserEntity, UserDTO } from "../entities/user.entity";
import { signSessionToken } from "../entities/jwt.helper";
import { IUserRepository } from "../repositories/user.repository.interface";
import { drizzleUserRepository } from "../repositories/drizzle-user.repository";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterOutput {
  user: UserDTO;
  token: string;
}

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository = drizzleUserRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
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

    const created = await this.userRepository.create({
      id: userId,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      xp: 0,
    });

    const userEntity = new UserEntity(created);
    const token = await signSessionToken({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
    });

    return {
      user: userEntity.toDTO(),
      token,
    };
  }
}
