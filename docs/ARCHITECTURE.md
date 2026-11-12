# Architecture boundaries

## Agent adapter

The initial adapter is the Codex package at `plugins/ue`: manifest, MCP launch declaration, project configuration loader and shared skills. It contains no model API key or model orchestration framework. A future Agent adapter can reuse the same stdio/HTTP MCP and workflows, but must implement and verify that host's installation and configuration format.

## MCP and workflows

The vendored, unmodified EngineWire 0.6.0 stdio proxy forwards calls to the editor's native `/mcp`. It exposes the same single `unreal` tool. Search discovers capabilities; describe provides current schemas; execute invokes them. Skills instruct the agent on this sequence and task-specific checks; they are not a separate execution service.

The launcher resolves machine configuration outside the repository. Explicit environment variables take precedence over the user JSON file. It never starts UE. The default endpoint is loopback-only; the editor is the authentication authority, and the proxy reads the token from the configured UE project.

## Business and UE adaptation

These remain in the pinned EngineWire submodule: domain handlers, capability contracts, game-thread dispatch, native MCP, safeguards and version compatibility. Upstream updates should change the submodule commit and vendored proxy together, preserve licenses, compile against the intended UE version, and report what was actually checked.

Native scene interfaces are preferred for actor placement, transforms, materials and collision. When users request interface-based work, a Python scene generator is not an interchangeable substitute. Arbitrary editor Python remains a supplementary upstream capability when authorized and needed.

## Validation

Compilation is the default for source changes. Runtime checks, PIE, editor restarts and synthetic input are opt-in per task. Packaging and documentation changes receive static validation. An editor being open does not itself authorize runtime tests. Record compilation, inspection and runtime results separately.
