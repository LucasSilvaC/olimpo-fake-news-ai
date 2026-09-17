import { UserEntity, UserDTO } from "../entities/user.entity";
import { signSessionToken } from "../entities/jwt.helper";
import { IUserRepository } from "../repositories/user.repository.interface";
import { drizzleUserRepository } from "../repositories/drizzle-user.repository";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: UserDTO;
  token: string;
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository = drizzleUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    if (!input.email || !input.password) {
      throw new Error("Email and password are required");
    }

    if (!UserEntity.validateEmail(input.email)) {
      throw new Error("Invalid credentials");
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await UserEntity.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const userEntity = new UserEntity(user);
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
