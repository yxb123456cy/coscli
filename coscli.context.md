# COSCLI Node.js 项目上下文

## 1. 项目定位

本项目是一个独立的 Node.js/TypeScript 腾讯云 COS 命令行工具，参考腾讯云官方开源项目 `tencentyun/coscli` 及其官方文档，实现 COSCLI 的核心命令、参数语义和对象存储操作能力。

项目不是当前仓库中既有 `ossctl` 的扩展，也不依赖其代码、目录结构或 Provider 抽象。项目名称暂定为 `coscli-node`，命令行可执行文件暂定为 `coscli`。

## 2. 目标用户

- 开发者和运维人员
- CI/CD 与自动化脚本
- 批量上传、下载、复制和删除数据的用户
- 需要跨 Bucket 操作或同步数据的用户

## 3. 目标平台与运行环境

- Node.js 20+
- TypeScript
- Linux、macOS、Windows
- 优先发布 npm CLI，功能稳定后再考虑独立可执行文件

## 4. 参考范围

参考对象：

- 腾讯云 COSCLI 官方开源仓库：`tencentyun/coscli`
- 腾讯云 COSCLI 官方命令与配置文档
- 腾讯云官方 Node.js SDK：`cos-nodejs-sdk-v5`

首要兼容范围：

```text
config mb rb ls du lsdu cp sync rm cat signurl hash restore lsparts abort symlink
```

后续扩展范围：

```text
bucket-tagging object-tagging object-acl bucket-acl bucket-policy
bucket-encryption bucket-versioning inventory
```

## 5. 核心原则

1. 优先兼容官方 COSCLI 的命令、参数、路径和配置行为。
2. 命令层只负责解析参数、编排服务和渲染结果，不直接堆积 SDK 业务逻辑。
3. 网络、文件遍历、并发、重试和同步计划必须具备明确的错误处理。
4. 默认输出适合人工阅读，并提供稳定的 `--json` 输出。
5. 不输出 `SecretKey`、Token 或完整敏感签名信息。
6. 破坏性操作默认确认，自动化场景通过 `--yes` 或明确选项跳过确认。
7. 大规模批处理不能使用无界的 `Promise.all()`。
8. 真实云资源测试必须显式启用，默认测试不得产生云资源或费用。

## 6. 关键使用场景

```bash
coscli config init
coscli ls cos://bucket/path/
coscli cp ./file.txt cos://bucket/path/
coscli cp cos://bucket/path/file.txt ./file.txt
coscli sync ./dist cos://bucket/dist/
coscli sync cos://source-bucket/path/ cos://target-bucket/path/
coscli rm cos://bucket/path/ --recursive --yes
coscli signurl cos://bucket/path/file.txt --duration 3600
```

## 7. 非目标

第一阶段不做：

- 兼容阿里云 OSS、AWS S3 或其他对象存储
- 修改腾讯云官方 COSCLI 的品牌、许可证或官方代码
- 将所有高级 COS 管理 API 一次性实现
- 默认执行真实云测试
- 为尚未验证的 COSCLI 行为制造伪兼容实现
