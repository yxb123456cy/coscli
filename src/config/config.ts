import os from "node:os";
import path from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dump, load } from "js-yaml";

export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigValue[];
export type ConfigObject = { [key: string]: ConfigValue };

export interface CosConfig {
  secretId?: string;
  secretKey?: string;
  sessionToken?: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
  [key: string]: ConfigValue | undefined;
}

export interface ConfigOverrides {
  secretId?: string;
  secretKey?: string;
  sessionToken?: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
  profile?: string;
}

export function getDefaultConfigPath(): string {
  return path.join(os.homedir(), ".cos.yaml");
}

export function writeConfigFile(configPath: string, config: ConfigObject): void {
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, dump(config, { noRefs: true, lineWidth: 120 }), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function readConfigFile(configPath: string = getDefaultConfigPath()): ConfigObject {
  let content: string;
  try {
    content = readFileSync(configPath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) return {};
    throw new Error(`无法读取配置文件：${configPath}`, { cause: error });
  }

  try {
    const parsed = load(content);
    if (parsed === undefined || parsed === null) return {};
    if (!isConfigObject(parsed)) throw new Error("配置文件根节点必须是 YAML 对象");
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message === "配置文件根节点必须是 YAML 对象") throw error;
    throw new Error(`配置文件格式无效：${configPath}`, { cause: error });
  }
}

export function resolveConfig(
  fileConfig: ConfigObject,
  environment: NodeJS.ProcessEnv = process.env,
  overrides: ConfigOverrides = {},
): CosConfig {
  const profile = overrides.profile ?? environment.COSCLI_PROFILE;
  const profileConfig =
    profile && isConfigObject(fileConfig.profiles) && isConfigObject(fileConfig.profiles[profile])
      ? fileConfig.profiles[profile]
      : {};
  const base = { ...fileConfig, ...profileConfig };
  delete base.profiles;

  const envConfig: ConfigOverrides = {
    secretId: environment.COSCLI_SECRET_ID ?? environment.TENCENTCLOUD_SECRETID,
    secretKey: environment.COSCLI_SECRET_KEY ?? environment.TENCENTCLOUD_SECRETKEY,
    sessionToken: environment.COSCLI_SESSION_TOKEN ?? environment.TENCENTCLOUD_SESSION_TOKEN,
    region: environment.COSCLI_REGION,
    bucket: environment.COSCLI_BUCKET,
    endpoint: environment.COSCLI_ENDPOINT,
  };
  return { ...base, ...removeUndefined(envConfig), ...removeUndefined(overrides) };
}

export function validateConfig(config: ConfigObject): string[] {
  const errors: string[] = [];
  for (const key of ["secretId", "secretKey", "sessionToken", "region", "bucket", "endpoint"]) {
    const value = config[key];
    if (value !== undefined && typeof value !== "string") errors.push(`${key} 必须是字符串`);
  }
  for (const key of ["secretId", "secretKey", "region", "bucket"]) {
    if (typeof config[key] === "string" && config[key].trim() === "")
      errors.push(`${key} 不能为空`);
  }
  if (typeof config.endpoint === "string") {
    try {
      const url = new URL(config.endpoint);
      if (!/^https?:$/.test(url.protocol)) errors.push("endpoint 必须使用 http 或 https");
    } catch {
      errors.push("endpoint 必须是有效 URL");
    }
  }
  return errors;
}

export function redactConfig(config: Record<string, ConfigValue | undefined>): ConfigObject {
  return Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        isSensitiveKey(key)
          ? typeof value === "string" && value
            ? "***"
            : value
          : redactValue(value),
      ]),
  ) as ConfigObject;
}

function redactValue(value: ConfigValue | undefined): ConfigValue | undefined {
  if (Array.isArray(value)) return value.map((item) => redactValue(item) as ConfigValue);
  if (isConfigObject(value)) return redactConfig(value);
  return value;
}

function isSensitiveKey(key: string): boolean {
  return /(secret|token|password|credential|access.?key)/i.test(key);
}

function removeUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isConfigObject(value: unknown): value is ConfigObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
