export interface OutputOptions {
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  debug: boolean;
}

export class CliOutput {
  public constructor(private readonly options: OutputOptions) {}

  public result(value: unknown): void {
    if (this.options.quiet) {
      return;
    }

    if (this.options.json) {
      process.stdout.write(`${JSON.stringify(value)}\n`);
      return;
    }

    if (typeof value === "string") {
      process.stdout.write(`${value}\n`);
      return;
    }

    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  }

  public info(message: string): void {
    if (!this.options.quiet && (this.options.verbose || this.options.debug)) {
      process.stderr.write(`${message}\n`);
    }
  }

  public debug(message: string, details?: unknown): void {
    if (!this.options.debug) {
      return;
    }

    const suffix = details === undefined ? "" : ` ${JSON.stringify(details)}`;
    process.stderr.write(`[debug] ${message}${suffix}\n`);
  }

  public error(error: { message: string; category: string; exitCode: number }): void {
    if (this.options.json) {
      process.stderr.write(
        `${JSON.stringify({ error: error.message, category: error.category, code: error.exitCode })}\n`,
      );
      return;
    }

    process.stderr.write(`${error.message}\n`);
  }
}
