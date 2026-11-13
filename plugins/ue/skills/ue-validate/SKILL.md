---
name: ue-validate
description: Validate UE changes with compilation by default; perform runtime, screenshot or reconnect checks when explicitly requested.
---

默认验收限制：常规源码、插件和配置修改，默认只保证相关编译通过。除非用户明确要求本次运行验证，不为测试专门启动或重启 UE，不执行 PIE、游戏运行、自动输入、运行回归或重启重连测试；过去任务的测试许可不自动延续。纯文档或 Skill 修改只检查格式，无需编译 UE。不得把编译通过表述为运行验证通过。

By default, inspect actual compiler output and report the target, result and any compilation limitations. State that runtime tests were not run. For Blueprint compilation, use an available, authorized editor session; if unavailable, disclose that Blueprint compilation was not verified rather than silently launching UE.

C++ 修改且 UE 已运行时，遵循 [C++ 热加载优先](../ue-connect/SKILL.md#c-热加载优先) 和 [Live Coding 工作流](../ue-connect/references/live-coding.md)。验证编译及当前进程补丁应用两个结果；磁盘构建成功不等于会话已更新。普通修改不得默认要求用户重启，补丁失败须先诊断模块/构建目标/日志。检查补丁加载不等于执行游戏运行测试。

遵循 [编辑器接口优先](../ue-connect/SKILL.md#编辑器接口优先)：有原生检查、编译、日志、保存或属性回读接口时，直接使用接口验证，不为验证方便另写 Python/C++ 辅助代码。验证报告区分编辑器操作方式、游戏运行时实现、编译结果和运行验证；不得将 Python 修改资产描述为通过蓝图节点实现业务逻辑。

Only when runtime or visual validation is explicitly requested, read the active map, expected actors and edited assets through the connected editor, inspect the relevant runtime state and logs, and capture a viewport image for visual claims. A screenshot response may precede file creation: wait for the file before inspecting it. Only perform restart/reconnect testing when specifically requested: save first, restart only this project's editor, reconnect, and read the saved state again.

Record actual checks and limitations in `Artifacts` when an evidence report is needed. Do not include auth tokens. Distinguish configured host integration from tools actually loaded into the current chat.
