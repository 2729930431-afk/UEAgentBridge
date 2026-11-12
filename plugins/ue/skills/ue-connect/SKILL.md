---
name: ue-connect
description: Connect to a configured Unreal Editor project through EngineWire and diagnose local MCP transport or reconnect issues.
---

Read [plugin setup](../../README.md) for configuration. Determine the intended project from the current task and configured UE_PROJECT_PATH or UEAgentBridge user config. Do not assume the plugin's working directory is the UE project.

默认验收限制：常规源码、插件和配置修改，默认只保证相关编译通过。除非用户明确要求，本次任务不为验证专门启动或重启 UE，不执行 PIE、游戏运行、自动输入或运行回归测试；过去任务的测试许可不自动延续。纯文档或 Skill 修改只检查格式，无需编译 UE。汇报实际编译结果，并明确运行测试未执行。

EngineWire exposes one MCP tool, `unreal`. Start with `operation: search`, then copy the selected result's `nextCall` to describe it. Use the returned contract to execute; never infer parameters from another UE bridge.

When an editor connection is needed, check the active editor project and engine version before writing. Refuse edits when the connected project differs from the user's target. The proxy reads the project's token from `Saved/MCP/capability-token`; never display or copy that token into config or reports. Only localhost is configured. If the editor is unavailable, report that state. Launch the intended project's editor only when the user explicitly requests or authorizes startup for the current task; do not launch it merely to complete validation. A timeout does not establish whether a write ran: read the affected state before retrying it.

If `unreal` is unavailable, check that the UE plugin is installed and enabled and its launcher configuration is correct. Do not assume this package provides project-specific Python scripts. Changes to configuration require reloading the host connection.
