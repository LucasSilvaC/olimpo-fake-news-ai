import bcrypt from "bcryptjs";

export interface UserEntityProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  xp?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  xp: number;
}

export class UserEntity {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly xp: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserEntityProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email.toLowerCase().trim();
    this.passwordHash = props.passwordHash;
    this.xp = props.xp ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static validateEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  public static validatePassword(password: string): boolean {
    if (!password || typeof password !== "string") return false;
    return password.length >= 6;
  }

  public static async hashPassword(password: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public toDTO(): UserDTO {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      xp: this.xp,
    };
  }
}
