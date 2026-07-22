# coscli-node

Node.js/TypeScript 命令行工具，用于操作腾讯云 COS。

项目目前处于初始化阶段，目标是逐步兼容腾讯云官方 COSCLI 的核心命令和参数行为，支持 Linux、macOS 和 Windows。

## 当前状态

基础项目骨架已完成，功能仍在开发中，暂不建议用于生产环境。

## 开发环境

- Node.js 20+
- pnpm

## 本地开发

```bash
pnpm install
pnpm build
pnpm test
```

## 计划支持

`config`、`mb`、`rb`、`ls`、`du`、`lsdu`、`cp`、`sync`、`rm`、`cat`、`signurl`、`hash`、`restore`、`lsparts`、`abort` 和 `symlink`。

## 许可证

[MIT](./LICENSE)
