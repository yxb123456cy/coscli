# COSCLI Node.js 技术设计

## 1. 架构分层

```text
CLI 入口与 Commander
        ↓
命令适配层 commands/
        ↓
应用服务 application/
        ↓
领域模块 path/ sync/ transfer/
        ↓
COS 适配层 storage/
        ↓
cos-nodejs-sdk-v5
```

文件系统访问通过独立的本地适配模块完成，不能让命令层直接混合远端 API 与本地扫描逻辑。

## 2. 推荐目录

```text
coscli-node/
├── bin/coscli.ts
├── src/
│   ├── cli.ts
│   ├── commands/
│   ├── application/
│   ├── storage/
│   │   ├── cos-client.ts
│   │   ├── cos-errors.ts
│   │   ├── object-transfer.ts
│   │   ├── multipart-upload.ts
│   │   └── multipart-download.ts
│   ├── config/
│   ├── path/
│   ├── sync/
│   │   ├── scanner.ts
│   │   ├── comparator.ts
│   │   ├── planner.ts
│   │   └── executor.ts
│   ├── output/
│   └── errors/
├── test/
└── package.json
```

## 3. 命令模型

Commander 负责构建如下命令树：

```text
coscli
├── config
├── mb
├── rb
├── ls
├── du
├── lsdu
├── cp
├── sync
├── rm
├── cat
├── signurl
├── hash
├── restore
├── lsparts
├── abort
└── symlink
```

全局选项建议包括：

```text
-c, --config <path>
--region <region>
--endpoint <url>
--profile <name>
--json
--quiet
--verbose
--debug
--yes
```

具体参数和默认值应以官方 COSCLI 文档核对后固化，不应仅凭命令名称推断。

## 4. 配置设计

```ts
interface CosConfig {
  secretId?: string;
  secretKey?: string;
  sessionToken?: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
}
```

配置解析流程：

```text
读取 CLI 覆盖项
  → 读取环境变量
  → 读取 -c 文件或 ~/.cos.yaml
  → YAML 解析
  → Zod 校验
  → 生成不可变运行时配置
```

凭证由 `CredentialProvider` 提供，COS Client 不负责决定配置来源。

## 5. 存储适配层

`CosClient` 对 SDK 做最小但稳定的封装：

```text
listBuckets
headBucket
createBucket
deleteBucket
listObjects
headObject
putObject
getObject
deleteObject
copyObject
createMultipartUpload
uploadPart
completeMultipartUpload
abortMultipartUpload
getPresignedUrl
```

适配层负责：

- SDK 参数映射
- 分页转换
- Stream 与文件流转换
- SDK 错误转换为领域错误
- 超时、重试和请求取消
- 不向上层泄露原始 Secret 或完整响应头

## 6. `cp` 设计

根据源和目标类型选择操作：

```text
local file  → COS object       上传
COS object  → local file       下载
COS object  → COS object       复制
local dir   → COS prefix       批量上传
COS prefix  → local dir        批量下载
```

目录任务需要经过：

```text
遍历 → 路径映射 → 过滤 → 任务队列 → 有界并发执行 → 汇总
```

## 7. `sync` 设计

支持：

```text
本地 → COS
COS → 本地
COS → COS
```

执行流程：

```text
解析两端路径
  → 扫描源端
  → 分页读取目标端
  → 比较元数据
  → 生成 Create/Update/Skip/Delete 计划
  → dry-run 展示计划
  → 有界并发执行
  → 汇总成功、跳过、失败
```

比较策略：

- 默认比较文件大小和修改时间。
- `--size-only` 只比较大小。
- `--checksum` 或 `--compare md5` 进行显式校验。
- 不默认把 COS ETag 视为文件 MD5，因为分片上传可能产生复合 ETag。

默认不删除目标端多余对象。只有指定 `--delete` 才生成删除计划。

## 8. 传输设计

- 小文件使用普通上传/下载。
- 大文件使用 SDK 分片和并发传输。
- 传输任务支持取消信号，响应 `SIGINT` 后停止新增任务并等待可安全结束的任务。
- 重试只针对网络错误、超时、5xx 和明确可重试的限流错误。
- 权限、签名、参数和资源不存在错误直接失败。
- 进度层通过事件接收字节数，不耦合 SDK 输出格式。

## 9. 输出与退出码

建议退出码：

```text
0   全部成功
1   参数或配置错误
2   认证或权限错误
3   网络或服务错误
4   文件系统错误
5   批量任务部分失败
6   用户取消或拒绝确认
```

`--json` 输出统一包含操作类型、统计数据和失败项；Secret、Token 和敏感 URL 参数必须脱敏或不输出。

## 10. 发布设计

第一阶段：

- 使用 `tsup` 构建
- 通过 npm 发布
- `bin` 字段暴露 `coscli`

第二阶段再评估：

- Node SEA
- Bun compile
- Windows/macOS/Linux 独立可执行文件

项目应提供 Node.js 版本检查、`--version` 和 `--help`，并在发布前验证 Windows 路径与信号处理行为。
