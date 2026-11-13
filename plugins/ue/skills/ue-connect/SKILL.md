---
name: ue-connect
description: Connect to a configured Unreal Editor project through EngineWire and diagnose local MCP transport or reconnect issues.
---

Read [plugin setup](../../README.md) for configuration. Determine the intended project from the current task and configured UE_PROJECT_PATH or UEAgentBridge user config. Do not assume the plugin's working directory is the UE project.

默认验收限制：常规源码、插件和配置修改，默认只保证相关编译通过。除非用户明确要求，本次任务不为验证专门启动或重启 UE，不执行 PIE、游戏运行、自动输入或运行回归测试；过去任务的测试许可不自动延续。纯文档或 Skill 修改只检查格式，无需编译 UE。汇报实际编译结果，并明确运行测试未执行。

EngineWire exposes one MCP tool, `unreal`. Start with `operation: search`, then copy the selected result's `nextCall` to describe it. Use the returned contract to execute; never infer parameters from another UE bridge.

## C++ 热加载优先

编辑器已运行时，普通 C++ 修改优先通过现有编辑器接口触发 Live Coding，并核实补丁已应用到当前进程。先读 [Live Coding 工作流](references/live-coding.md)，再编译或诊断热加载失败。不要在 Live Coding 会话中使用 `-ModuleWithSuffix` 或传统 Hot Reload 构建；不能把磁盘编译成功、命令返回 success 或“no code changes detected”当成当前会话已更新。

热加载失败先检查实际加载模块、构建目标和日志，排除参数或模块不一致；不得直接归因为桥接无法热加载，也不得直接把重启交给用户。只有证据表明本次变更无法安全热应用，或加载基线确需修复时，才说明具体原因并按本次授权处理。重启授权不自动延续到后续任务。

## 编辑器接口优先

修改 UE 场景、资产、组件属性、蓝图图表、UMG、材质、导入设置或执行编译保存时，先通过 `unreal` 的 search → describe 查找对应的原生编辑器能力。接口能够完成的操作，必须直接使用该接口；批量操作也应组合对应接口，不因减少调用次数或脚本编写方便而改用 Python。

只有能力确实缺失，或按契约调用、检查状态并排除参数问题后确认接口存在缺陷时，才对该缺口使用最小范围的回退。先简短说明缺失的能力及回退原因；不要把一次调用失败当成接口不可用。此限制同样适用于 `execute_python`、编辑器 Python 脚本、ctypes 调用和仅为绕过现有接口新增的 C++ 编辑器辅助代码。离线生成音频等非编辑器工作不受此接口选择规则限制。

工具调用方式与游戏运行时实现是两件事。遵循用户对蓝图或 C++ 的要求，并如实说明核心逻辑实际位于哪里；不能把 C++ 核心加蓝图配置当作纯蓝图节点实现。

When an editor connection is needed, check the active editor project and engine version before writing. Refuse edits when the connected project differs from the user's target. The proxy reads the project's token from `Saved/MCP/capability-token`; never display or copy that token into config or reports. Only localhost is configured. If the editor is unavailable, report that state. Launch the intended project's editor only when the user explicitly requests or authorizes startup for the current task; do not launch it merely to complete validation. A timeout does not establish whether a write ran: read the affected state before retrying it.

If `unreal` is unavailable, check that the UE plugin is installed and enabled and its launcher configuration is correct. Do not assume this package provides project-specific Python scripts. Changes to configuration require reloading the host connection.
