# Third-party components

UEAgentBridge uses **EngineWire / ChiR24/Unreal_mcp** as its UE execution and MCP foundation. This repository does not claim authorship of EngineWire.

- Source: https://github.com/ChiR24/Unreal_mcp
- Version: v0.6.0
- Pinned source commit: e0685737e040cc4d5c962747824628502cd08d0b
- License: MIT, copyright (c) 2025 Unreal Engine MCP Server Contributors.
- `external/EngineWire` is a Git submodule; its upstream LICENSE applies to that source.
- `plugins/ue/server` contains the unmodified runtime JavaScript from the `unreal-engine-mcp-server@0.6.0` npm release. Its LICENSE and package.json are included beside the runtime. It has no runtime npm dependencies and does not require npm install to launch.

The launcher, package configuration and shared workflows are maintained in this repository. Unreal Engine itself, Epic's template assets and the local Skyworld demonstration project are not distributed here. Users must obtain their own UE installation.
