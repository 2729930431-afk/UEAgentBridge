# UEAgentBridge
Connect AI coding agents to Unreal Engine through MCP tools and shared skills, powered by EngineWire.

**UE 0.2.0** 是首个 Codex 接入版本：提供本地 MCP 接入、连接/场景/蓝图/验证四个共享 Skill，以及可扩展的 Agent 接入结构。当前只实现 Codex；Claude Code、Qoder 尚未适配或测试。

## 安装条件

- Node.js 20.19 或以上。
- Unreal Engine。当前本项目只在 **UE 5.6.1** 做过实际编译和编辑器验证；EngineWire 的其他引擎版本支持声明不代表本仓库已逐一测试。
- 从源码安装 EngineWire 需要 UE 对应的 C++ 编译工具链。Windows 使用 Visual Studio C++ Build Tools 和 Windows SDK。

## 获取源码和 UE 插件

```powershell
git clone --recurse-submodules https://github.com/2729930431-afk/UEAgentBridge.git
cd UEAgentBridge
```

已克隆但没有依赖时：`git submodule update --init --recursive`。

EngineWire 固定为 v0.6.0，提交 `e0685737e040cc4d5c962747824628502cd08d0b`。将 `external/EngineWire/plugins/EngineWire` 复制到目标 UE 项目的 `Plugins/EngineWire`。也可以按上游说明在 `.uproject` 中配置 `AdditionalPluginDirectories`，两种方式选择一种，避免重复安装同名插件。

使用 UE 的 Build.bat 构建目标项目的 Editor target。源码插件需要 C++ 项目承载，蓝图项目可先添加最小 C++ 模块；也可以自行用 UE 的 RunUAT BuildPlugin 打包源码插件。不要把本仓库的 `plugins/ue` 复制进 UE：它是 Codex 插件，不是 UE 原生插件。

## 安装 Codex 插件

在此仓库根目录执行：

```powershell
codex plugin marketplace add .
codex plugin add ue@ue-agent-bridge
```

插件显示名为 **UE**，版本 **0.2.0**。本地市场声明位于 `.agents/plugins/marketplace.json`。也可以在 Codex 插件目录中选择该市场进行安装。若已安装旧的 `ue@local-codex-plugins`，应先卸载旧版本，避免两个 UE 插件同时启动。

配置目标项目（参数是你的本机路径，不会写入仓库）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Configure-UE.ps1 -ProjectPath "<你的项目.uproject路径>"
```

配置保存在 `~/.config/UEAgentBridge/config.json`。重新加载 Codex 后，工具入口为 `unreal`。代理文件已随插件附带，使用时无需 `npm install`。本机配置和令牌不会上传到 Git。

需要进行编辑器操作时，由用户启动目标 UE 项目，启用 EngineWire 的 Native MCP 服务；默认地址 `http://127.0.0.1:3000/mcp`。连接令牌由 UE 插件生成，stdio 代理从目标项目读取。用户未要求时，插件不会为了验收主动打开或重启 UE。

## 默认验证规则

编辑器接口能够完成的修改，直接使用 EngineWire 原生能力，包括批量编辑；只有确认接口缺失或有缺陷时才说明原因并对缺口使用最小 Python 等回退。蓝图、组件、UMG、材质、导入与编译保存均适用，详见 [编辑器接口优先](plugins/ue/skills/ue-connect/SKILL.md#编辑器接口优先)。工具调用方式与游戏运行时采用蓝图还是 C++ 分开说明。

**一般情况下只保证相关编译通过，不专门启动 UE 或进行运行测试，除非用户明确要求。**

- 不默认运行 PIE、游戏、自动输入、运行回归或重启重连测试。
- 过去任务的测试许可不自动延续。
- 文档、Skill 和打包配置修改进行相应的静态检查。
- 汇报时区分“编译通过”和“运行验证通过”；未运行时明确说明。

该规则写入全部四个 Skill。包结构与 JavaScript 语法检查：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Check-Package.ps1
```

## 架构与范围

```text
Agent（当前 Codex）
  → Codex 插件清单与共享 Skill
  → stdio 代理 / 原生 MCP（search、describe、execute）
  → EngineWire 业务工具与游戏线程队列
  → UE 版本适配与编辑器 API
  → Unreal Editor
```

`plugins/ue` 是 Agent 接入包；`external/EngineWire` 是未修改的固定上游源码；`scripts` 提供配置与静态检查。MCP、业务工具与 UE 适配仍由 EngineWire 原生插件承载，没有重写成独立的五个进程或完整多 Agent 调度框架。

本机开发阶段已经验证：UE 5.6.1 编译、MCP 连接、原生 Actor 接口修改场景与碰撞、蓝图变量修改/编译/回读、PIE 角色与边界阻挡、stdio 代理跨编辑器重启恢复。可分发包的本次整理只做静态检查，没有重新启动 UE 或执行运行测试。示例展厅、UE 模板资产、测试题 PDF、缓存和机器配置均不在仓库中。

## 许可证与致谢

本仓库自有代码采用 MIT。底层能力来自 [EngineWire](https://github.com/ChiR24/Unreal_mcp)，其源码和代理保留上游 MIT 许可证；详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。UE 本体和 Epic 资产不随本仓库分发。
