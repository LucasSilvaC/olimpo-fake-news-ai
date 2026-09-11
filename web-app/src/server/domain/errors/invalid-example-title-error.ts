export class InvalidExampleTitleError extends Error {
  constructor() {
    super("Example title must contain between 3 and 120 characters.");
    this.name = "InvalidExampleTitleError";
  }
}
