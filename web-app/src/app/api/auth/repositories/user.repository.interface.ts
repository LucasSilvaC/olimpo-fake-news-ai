import { User, NewUser } from "@/server/shared/database/schemas";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  updateXp(id: string, xpDelta: number): Promise<User>;
}
