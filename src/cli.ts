import { Command, CommanderError } from "commander";
import packageJson from "../package.json";
import process from "node:process";
import { createConfigCommand } from "./commands/config";
import { CliError, toCliError } from "./errors/cli-error";
import { CliOutput, type OutputOptions } from "./output/output";

export interface GlobalOptions extends OutputOptions {
  config?: string;
  region?: string;
  endpoint?: string;
  profile?: string;
  yes: boolean;
}

export function createCli(): Command {
  const program = new Command();

  program
    .name("coscli")
    .description(packageJson.description)
    .version(packageJson.version)
    .option("-c, --config <path>", "配置文件路径")
    .option("--region <region>", "COS 地域")
    .option("--endpoint <url>", "COS 服务端点")
    .option("--profile <name>", "配置 profile 名称")
    .option("--json", "以 JSON 格式输出")
    .option("--quiet", "仅输出必要结果")
    .option("--verbose", "输出详细诊断信息")
    .option("--debug", "输出调试信息")
    .option("--yes", "跳过破坏性操作确认");

  return program;
}

export function getGlobalOptions(program: Command): GlobalOptions {
  const options = program.opts<Partial<GlobalOptions>>();
  return {
    config: options.config,
    region: options.region,
    endpoint: options.endpoint,
    profile: options.profile,
    json: options.json === true,
    quiet: options.quiet === true,
    verbose: options.verbose === true,
    debug: options.debug === true,
    yes: options.yes === true,
  };
}

export async function runCli(argv: string[] = process.argv): Promise<number> {
  const program = createCli();
  const outputOptions: OutputOptions = {
    json: argv.includes("--json"),
    quiet: argv.includes("--quiet"),
    verbose: argv.includes("--verbose"),
    debug: argv.includes("--debug"),
  };
  const output = new CliOutput(outputOptions);
  program.addCommand(createConfigCommand(output));

  try {
    program.exitOverride();
    program.parse(argv, { from: "node" });
    output.debug("parsed CLI arguments", getGlobalOptions(program));
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode !== 0) {
        output.error({
          message: error.message,
          category: "usage",
          exitCode: error.exitCode,
        });
      }
      return error.exitCode;
    }

    const cliError = error instanceof CliError ? error : toCliError(error);
    output.error(cliError);
    return cliError.exitCode;
  }
}
