export class RoomPin {
  public static readonly PIN_REGEX = /^\d{3} \d{3}$/;

  public readonly value: string;

  constructor(value: string) {
    const normalized = RoomPin.normalize(value);
    if (!RoomPin.isValid(normalized)) {
      throw new Error(`Invalid PIN format: "${value}". Expected format: "XXX XXX"`);
    }
    this.value = normalized;
  }

  public static isValid(pin: string): boolean {
    return RoomPin.PIN_REGEX.test(pin);
  }

  public static normalize(pin: string): string {
    const trimmed = pin.trim();
    if (RoomPin.isValid(trimmed)) {
      return trimmed;
    }
    // If digits only without space (6 digits), format as XXX XXX
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length === 6) {
      return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)}`;
    }
    return trimmed;
  }

  public static generate(): string {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    return `${part1} ${part2}`;
  }

  public toString(): string {
    return this.value;
  }
}
