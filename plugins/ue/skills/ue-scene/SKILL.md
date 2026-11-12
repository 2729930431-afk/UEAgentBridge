---
name: ue-scene
description: Inspect and modify UE levels, actors, transforms and lights using EngineWire scene capabilities.
---

默认验收限制：常规源码、插件和配置修改只要求相关编译通过，不默认启动或重启 UE，也不默认执行 PIE、游戏运行、自动输入或运行回归测试。只有用户明确要求本次运行验证时才执行；过去任务的测试许可不自动延续。纯文档或 Skill 修改只检查格式。

Use ue-connect's connection workflow. Discover the exact scene capability and describe its input schema. Read the current map and target actors before edits. Preserve user assets and confine writes to the user's intended map and content paths.

Prefer native actor, level, material and collision interfaces for scene edits. When the user requests interface-based placement, use structured business capabilities rather than executing a scene script. Python is a supplement only when needed and within the user's requested method; describe its contract first, keep it bounded, and report which method was used.

For scene edits in an already authorized editor session, read actor labels, classes and transforms back and save the map. Capture and inspect the viewport when the user requests visual validation; do not start the editor or PIE merely to obtain evidence. Preserve the project's existing GameMode, player input and collision unless changing them is part of the task. Report compilation and runtime verification separately, stating when runtime tests were not run.
