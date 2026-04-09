export class DomainError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "DOMAIN_ERROR", status = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

export function assertCondition(
  condition: unknown,
  message: string,
  code = "VALIDATION_ERROR",
  status = 400,
): asserts condition {
  if (!condition) {
    throw new DomainError(message, code, status);
  }
}
