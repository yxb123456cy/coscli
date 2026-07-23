export enum ExitCode {
  Success = 0,
  // oxlint-disable-next-line typescript/no-duplicate-enum-values
  Usage = 1,
  Auth = 2,
  Network = 3,
  Filesystem = 4,
  PartialFailure = 5,
  Cancelled = 6,
  Internal = 1,
}

export type ErrorCategory = "usage" | "auth" | "network" | "filesystem" | "cancelled" | "internal";

export class CliError extends Error {
  public readonly category: ErrorCategory;
  public readonly exitCode: number;

  public constructor(message: string, category: ErrorCategory = "internal", exitCode?: ExitCode) {
    super(message);
    this.name = "CliError";
    this.category = category;
    this.exitCode = exitCode ?? categoryToExitCode(category);
  }
}

export function categoryToExitCode(category: ErrorCategory): ExitCode {
  switch (category) {
    case "auth":
      return ExitCode.Auth;
    case "network":
      return ExitCode.Network;
    case "filesystem":
      return ExitCode.Filesystem;
    case "cancelled":
      return ExitCode.Cancelled;
    case "usage":
    case "internal":
      return ExitCode.Usage;
  }
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message);
  }

  return new CliError(String(error));
}
