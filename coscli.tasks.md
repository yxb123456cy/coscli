# COSCLI Node.js 实施任务

## Phase 0：兼容性基线

- [ ] 固定参考版本、官方文档版本和许可证边界。
- [ ] 逐项整理官方命令、参数、别名、默认值、输出和退出码。
- [ ] 核对 `~/.cos.yaml` 的实际字段、格式和多 Bucket 配置行为。
- [ ] 建立命令兼容性矩阵，标注 `planned`、`implemented`、`verified`。
- [ ] 明确项目名称、npm 包名和与腾讯云官方项目的品牌区分。

## Phase 1：项目骨架与 CLI 基础

- [ ] 初始化 Node.js 20+、TypeScript、Commander、tsup 和 Vitest。
- [ ] 创建 `bin/coscli.ts` 和顶层 CLI 入口。
- [ ] 实现 `--help`、`--version`、全局选项和顶层异常处理。
- [ ] 实现统一退出码、错误分类和 stdout/stderr 分流。
- [ ] 实现 `--json`、`--quiet`、`--verbose` 和 `--debug` 输出模式。

## Phase 2：配置与凭证

- [ ] 实现 `~/.cos.yaml` 默认读取。
- [ ] 实现 `-c`/`--config` 自定义配置路径。
- [ ] 实现 `config init`、读取、修改、校验和安全展示。
- [ ] 实现命令行、环境变量、配置文件的优先级合并。
- [ ] 支持 SecretId、SecretKey、SessionToken、Region、Bucket 和 Endpoint。
- [ ] 确保配置写入和错误输出不泄露 Secret。

## Phase 3：路径与 COS Client

- [ ] 实现 `cos://bucket/key` URI 解析。
- [ ] 兼容 Windows、macOS 和 Linux 本地路径。
- [ ] 实现本地目录、COS 前缀和跨 Bucket 路径映射。
- [ ] 封装 `cos-nodejs-sdk-v5` 的 Bucket 和 Object API。
- [ ] 实现分页列表、Stream、错误转换、超时和请求取消。
- [ ] 编写路径解析和 SDK 适配层单元测试。

## Phase 4：基础命令

- [ ] 实现 `mb` 创建存储桶。
- [ ] 实现 `rb` 删除存储桶和确认机制。
- [ ] 实现 `ls` 列举 Bucket 和 Object。
- [ ] 实现 `du`、`lsdu` 统计能力。
- [ ] 实现 `rm` 单对象、前缀和批量删除。
- [ ] 实现 `cp` 单文件上传、下载和跨 COS 复制。
- [ ] 为每个命令补充文本、JSON、错误和退出码测试。

## Phase 5：批量传输与同步

- [ ] 使用 `fast-glob` 实现本地文件扫描和过滤。
- [ ] 使用 `p-limit` 实现有界并发。
- [ ] 使用 `p-retry` 实现可重试错误和指数退避。
- [ ] 实现大文件分片上传、下载及进度事件。
- [ ] 实现 `cp` 的目录上传和目录下载。
- [ ] 实现 `sync` 的本地到 COS、COS 到本地和 COS 到 COS。
- [ ] 实现大小、修改时间和显式 checksum 比较策略。
- [ ] 实现 `--dry-run`、`--delete`、`--exclude`、`--include`、`--jobs`。
- [ ] 实现部分失败汇总、取消处理和非零退出码。

## Phase 6：高级对象能力

- [ ] 实现 `cat` 查看对象内容。
- [ ] 实现 `signurl` 生成预签名 URL。
- [ ] 实现 `hash`，区分本地哈希和 COS ETag。
- [ ] 实现 `restore` 归档对象取回。
- [ ] 实现 `lsparts` 和 `abort` 分片上传管理。
- [ ] 实现 `symlink` 相关操作。

## Phase 7：Bucket/Object 管理能力

- [ ] 实现 Bucket 标签和 Object 标签。
- [ ] 实现 Bucket/Object ACL。
- [ ] 实现 Bucket Policy。
- [ ] 实现 Bucket Encryption。
- [ ] 实现 Bucket Versioning。
- [ ] 实现 Inventory。
- [ ] 对每个能力增加 SDK Mock 测试和文档兼容性记录。

## Phase 8：质量与发布

- [ ] 完善跨平台路径、权限、信号和终端输出测试。
- [ ] 添加显式启用的真实 COS 集成测试。
- [ ] 检查凭证、签名 URL、错误响应和日志脱敏。
- [ ] 执行类型检查、Lint、格式化和全部测试。
- [ ] 发布 npm 包并验证全局安装后的 `coscli` 命令。
- [ ] 评估 Node SEA、Bun compile 或其他独立二进制方案。
