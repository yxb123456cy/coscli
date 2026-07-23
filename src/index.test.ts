import { describe, expect, it } from "vitest";
import { createCli } from "./cli";

describe("CLI", () => {
  it("exposes the expected name and version", () => {
    const cli = createCli();

    expect(cli.name()).toBe("coscli");
    // expect(cli.version()).toBe("0.1.0");
  });
});
