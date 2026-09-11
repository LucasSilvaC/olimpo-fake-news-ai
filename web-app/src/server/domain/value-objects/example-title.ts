import { InvalidExampleTitleError } from "@/server/domain/errors/invalid-example-title-error";

export class ExampleTitle {
  private constructor(readonly content: string) {}
  static create(content: string): ExampleTitle {
    const normalizedContent = content.trim();
    if (normalizedContent.length < 3 || normalizedContent.length > 120)
      throw new InvalidExampleTitleError();
    return new ExampleTitle(normalizedContent);
  }
}
