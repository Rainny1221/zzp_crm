export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    if (!value || !Email.isValid(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    return new Email(value.toLowerCase().trim());
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
