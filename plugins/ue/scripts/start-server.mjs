import { loadConfiguration } from './config.mjs';

try {
  const config = loadConfiguration();
  if (config.projectPath) process.env.UE_PROJECT_PATH = config.projectPath;
  else process.stderr.write('[UEAgentBridge] No project configured; run scripts/Configure-UE.ps1 before editor calls.\n');
  process.env.UNREAL_MCP_URL = config.endpoint;
  await import('../server/dist/cli.js');
} catch (error) {
  process.stderr.write(`[UEAgentBridge] Configuration error: ${error.message}\n`);
  process.exitCode = 1;
}
