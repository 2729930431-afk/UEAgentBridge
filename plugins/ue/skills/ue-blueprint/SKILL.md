---
name: ue-blueprint
description: Read, make local edits to, and compile UE Blueprints through EngineWire with actual result verification.
---

默认验收限制：常规源码、插件和配置修改只要求相关编译通过；不为验证默认启动或重启 UE，也不默认进行 PIE、游戏运行、自动输入或运行回归测试。只有用户明确要求本次运行验证时才执行；过去任务的测试许可不自动延续。纯文档或 Skill 修改只检查格式。

Discover Blueprint read/edit/compile capabilities through `unreal` search and describe. Read the existing blueprint and relevant defaults or nodes before changing them. Use exact asset paths and returned node identifiers. Prefer a local patch or class-default edit over reconstructing a graph.

Compile the edited Blueprint in an available, authorized editor session and inspect real compiler results and logs. Save it and read the edited property or graph back. If Blueprint compilation is unavailable without starting the editor, report it as unverified rather than launching UE without current authorization. Do not report successful compilation from a successful save response or from a C++ build. Preserve the project's existing input mappings, animation and GameMode references unless changing them is part of the task. Run PIE only when the user explicitly requests runtime verification; otherwise state that runtime tests were not run.
