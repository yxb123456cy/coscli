# COSCLI Node.js 开发规范

## 1. 技术栈

核心技术栈：

```text
Node.js 20+
TypeScript
Commander
cos-nodejs-sdk-v5
YAML
Zod
fast-glob
p-limit
p-retry
Vitest
tsup
```

可选：`picocolors`、`cli-table3`、`@inquirer/prompts`、`ora`、`pino`。

不使用 `yargs`。

## 2. 推荐目录约定

```text
bin/coscli.ts
src/cli.ts
src/commands/
src/application/
src/storage/
src/config/
src/path/
src/sync/
src/output/
src/errors/
test/
```

职责边界：

- `commands/`：命令注册、参数读取、调用应用服务。
- `application/`：复制、同步、列表、删除和 Bucket 等用例。
- `storage/`：腾讯云 SDK 封装、分页、传输、分片和错误转换。
- `config/`：配置文件、环境变量、凭证优先级和 Schema 校验。
- `path/`：本地路径、COS URI、Key 和目标映射。
- `sync/`：扫描、比较、计划和执行。
- `output/`：表格、JSON、进度和日志输出。
- `errors/`：CLI 错误、退出码和顶层异常处理。

## 3. 命令实现规范

每个命令应具备：

- 独立的注册函数
- 明确的位置参数和选项
- 参数进入业务层前的 Zod 校验
- 人类可读和 `--json` 两种输出路径
- 可预测的退出码
- 对网络、文件系统和用户取消行为的处理

命令不得：

- 直接依赖未经封装的 SDK 原始响应结构
- 将 Secret 写入日志、错误或普通输出
- 在命令函数中实现大量同步算法
- 为未实现功能返回假成功

## 4. 配置规范

默认配置文件：

```text
~/.cos.yaml
```

支持 `-c`/`--config` 指定配置文件。

优先级：

```text
命令行参数 > 环境变量 > 指定配置文件 > ~/.cos.yaml > 默认值
```

建议支持：

```text
COS_SECRET_ID
COS_SECRET_KEY
COS_SESSION_TOKEN
COS_REGION
COS_BUCKET
COS_ENDPOINT
COS_CONFIG
```

配置读取后必须经过 Schema 校验。配置写入应尽量设置用户私有权限；凭证展示默认脱敏。

## 5. COS URI 规范

统一支持：

```text
cos://bucket/key
cos://bucket/prefix/
```

本地路径必须兼容 POSIX 和 Windows：

- 使用 Node.js `path` API，不手写分隔符判断。
- 正确区分本地路径和 COS URI。
- 保留对象 Key 中的空格、中文和特殊字符。
- 目录语义以尾部 `/`、递归选项和对象列表结果共同决定。

## 6. 批量传输规范

- 使用有界并发，默认并发数应可配置。
- 使用指数退避处理临时网络错误和可重试状态码。
- 单个任务失败默认不阻塞其他任务，最终汇总失败并返回非零退出码。
- `--dry-run` 只生成计划，不发起修改请求。
- `--delete` 必须显式指定；涉及删除时需要确认或 `--yes`。
- 大文件使用 SDK 支持的分片/并发传输能力。
- 不将全部文件或对象一次性加载到内存。

## 7. 输出和日志规范

- 业务结果写入 `stdout`。
- 诊断、警告、重试和错误写入 `stderr`。
- `--json` 模式不得混入进度动画和彩色文本。
- `--quiet` 减少非必要输出；`--verbose`/`--debug` 提供诊断信息。
- 输出中的凭证、Token、签名参数和敏感请求头必须脱敏。

## 8. 测试规范

必须覆盖：

- URI 和本地路径解析
- 配置优先级及 Schema 校验
- 同步差异和目标路径映射
- 并发、重试和失败汇总
- CLI 参数、输出和退出码
- SDK 适配器的 Mock 集成测试

真实 COS 测试仅在明确环境变量开启时运行。
