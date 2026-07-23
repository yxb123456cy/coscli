import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDefaultConfigPath, readConfigFile } from "./config";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("config", () => {
  it("uses ~/.cos.yaml as the default path", () => {
    expect(getDefaultConfigPath()).toBe(path.join(os.homedir(), ".cos.yaml"));
  });

  it("returns an empty config when ~/.cos.yaml does not exist", () => {
    const configPath = path.join(os.tmpdir(), `coscli-${Date.now()}-missing`, ".cos.yaml");

    expect(readConfigFile(configPath)).toEqual({});
  });

  it("reads a YAML object from the default config path", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "coscli-config-"));
    temporaryDirectories.push(directory);
    const configPath = path.join(directory, ".cos.yaml");

    await writeFile(configPath, "region: ap-guangzhou\nbucket: example-1250000000\n", "utf8");
    vi.spyOn(os, "homedir").mockReturnValue(directory);

    expect(getDefaultConfigPath()).toBe(configPath);
    expect(readConfigFile()).toEqual({
      region: "ap-guangzhou",
      bucket: "example-1250000000",
    });
  });

  it("rejects a YAML array as the root value", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "coscli-config-"));
    temporaryDirectories.push(directory);
    const configPath = path.join(directory, ".cos.yaml");

    await writeFile(configPath, "- invalid-root\n", "utf8");

    expect(() => readConfigFile(configPath)).toThrow("配置文件根节点必须是 YAML 对象");
  });

  it("reports invalid YAML", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "coscli-config-"));
    temporaryDirectories.push(directory);
    const configPath = path.join(directory, ".cos.yaml");

    await mkdir(directory, { recursive: true });
    await writeFile(configPath, "region: [invalid\n", "utf8");

    expect(() => readConfigFile(configPath)).toThrow(`配置文件格式无效：${configPath}`);
  });
});
