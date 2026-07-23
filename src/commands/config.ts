import { cancel, intro, isCancel, outro, password, text } from "@clack/prompts";
import { Command } from "commander";
import process from "node:process";
import path from "node:path";
import {
  readConfigFile,
  redactConfig,
  resolveConfig,
  validateConfig,
  writeConfigFile,
  type ConfigObject,
} from "../config/config";
import { CliError, ExitCode } from "../errors/cli-error";
import type { CliOutput } from "../output/output";

export interface ConfigInitOptions {
  region?: string | boolean;
  bucket?: string;
  config?: string;
  secretId?: string;
  secretKey?: string;
  sessionToken?: string;
  endpoint?: string;
  nonInteractive?: boolean;
}

export async function initConfig(options: ConfigInitOptions, output: CliOutput): Promise<number> {
  const configPath = options.config ?? path.join(process.cwd(), ".cos.yaml");
  const values = options.nonInteractive
    ? {
        region: typeof options.region === "string" ? options.region : undefined,
        bucket: options.bucket,
        secretId: options.secretId,
        secretKey: options.secretKey,
        sessionToken: options.sessionToken,
        endpoint: options.endpoint,
      }
    : await promptForConfig(options);
  const config = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as ConfigObject;
  const errors = validateConfig(config);
  if (errors.length > 0)
    throw new CliError(`配置校验失败：${errors.join("；")}`, "usage", ExitCode.Usage);
  writeConfigFile(configPath, config);
  if (!options.nonInteractive) output.info(`配置已写入 ${configPath}`);
  output.debug("initialized config", { path: configPath });
  return ExitCode.Success;
}

async function promptForConfig(options: ConfigInitOptions): Promise<ConfigInitOptions> {
  intro("COSCLI 配置初始化");
  const region =
    typeof options.region === "string"
      ? options.region
      : await text({
          message: "请输入 COS Region",
          defaultValue: "ap-guangzhou",
          validate: (value) => (value?.trim() ? undefined : "Region 不能为空"),
        });
  if (isCancel(region)) return cancelAndThrow();
  const bucket =
    options.bucket ??
    (await text({
      message: "请输入 Bucket 名称",
      validate: (value) => (value?.trim() ? undefined : "Bucket 不能为空"),
    }));
  if (isCancel(bucket)) return cancelAndThrow();
  const secretId =
    options.secretId ??
    (await text({
      message: "请输入 SecretId",
      validate: (value) => (value?.trim() ? undefined : "SecretId 不能为空"),
    }));
  if (isCancel(secretId)) return cancelAndThrow();
  const secretKey =
    options.secretKey ??
    (await password({
      message: "请输入 SecretKey",
      validate: (value) => (value?.trim() ? undefined : "SecretKey 不能为空"),
    }));
  if (isCancel(secretKey)) return cancelAndThrow();
  const sessionToken =
    options.sessionToken ?? (await text({ message: "请输入 SessionToken（可选）" }));
  if (isCancel(sessionToken)) return cancelAndThrow();
  outro("配置输入完成");
  return {
    region,
    bucket,
    secretId,
    secretKey,
    sessionToken: sessionToken || undefined,
    endpoint: options.endpoint,
  };
}

function cancelAndThrow(): never {
  cancel("已取消配置初始化");
  throw new CliError("用户取消了配置初始化", "cancelled", ExitCode.Cancelled);
}

export function createConfigCommand(output: CliOutput): Command {
  const configCommand = new Command("config").description("配置文件操作");
  configCommand
    .command("init")
    .description("创建配置文件")
    .option("-c, --config <path>", "配置文件路径")
    .option("--region [region]")
    .option("-b, --bucket <bucket>")
    .option("--secret-id <id>")
    .option("--secret-key <key>")
    .option("--session-token <token>")
    .option("--endpoint <url>")
    .option("--non-interactive")
    .action(async (options: ConfigInitOptions, command: Command) => {
      const globalOptions = command.parent?.parent?.opts<{
        config?: string;
        region?: string;
        endpoint?: string;
      }>();
      await initConfig(
        {
          ...options,
          config: options.config ?? globalOptions?.config,
          region: typeof options.region === "string" ? options.region : globalOptions?.region,
          endpoint: options.endpoint ?? globalOptions?.endpoint,
        },
        output,
      );
    });
  configCommand
    .command("show")
    .description("安全显示配置文件内容")
    .option("-c, --config <path>")
    .option("--unsafe")
    .action((options: { config?: string; unsafe?: boolean }, command: Command) => {
      const globalOptions = command.parent?.parent?.opts<{ config?: string }>();
      const configPath = options.config ?? globalOptions?.config;
      const config = readConfigFile(configPath);
      output.result(options.unsafe ? config : redactConfig(config));
    });
  configCommand
    .command("validate")
    .description("校验配置文件")
    .option("-c, --config <path>")
    .action((options: { config?: string }, command: Command) => {
      const globalOptions = command.parent?.parent?.opts<{ config?: string }>();
      const configPath = options.config ?? globalOptions?.config;
      const errors = validateConfig(readConfigFile(configPath));
      if (errors.length > 0)
        throw new CliError(`配置校验失败：${errors.join("；")}`, "usage", ExitCode.Usage);
      output.result({ valid: true });
    });
  configCommand
    .command("resolve")
    .description("显示合并后的安全配置")
    .option("-c, --config <path>")
    .action((options: { config?: string }, command: Command) => {
      const globalOptions = command.parent?.parent?.opts<{ config?: string }>();
      const configPath = options.config ?? globalOptions?.config;
      output.result(redactConfig(resolveConfig(readConfigFile(configPath))));
    });
  return configCommand;
}
