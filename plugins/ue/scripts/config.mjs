import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { homedir } from 'node:os';

export function configPath(env = process.env) {
  return env.UE_AGENT_BRIDGE_CONFIG || join(homedir(), '.config', 'UEAgentBridge', 'config.json');
}

export function loadConfiguration(env = process.env) {
  const filename = configPath(env);
  const config = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8').replace(/^\uFEFF/, '')) : {};
  let projectPath = env.UE_PROJECT_PATH || config.projectPath;
  if (projectPath) {
    projectPath = resolve(projectPath);
    if (extname(projectPath).toLowerCase() === '.uproject') {
      if (!existsSync(projectPath)) throw new Error('Configured .uproject does not exist.');
      projectPath = dirname(projectPath);
    }
    if (!existsSync(projectPath) || !readdirSync(projectPath).some(name => name.toLowerCase().endsWith('.uproject'))) {
      throw new Error('Configure an existing UE project folder or .uproject file.');
    }
  }
  const endpoint = env.UNREAL_MCP_URL || config.endpoint || 'http://127.0.0.1:3000/mcp';
  const url = new URL(endpoint);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/mcp' || url.search || url.hash) {
    throw new Error('Use a local HTTP MCP endpoint, for example http://127.0.0.1:3000/mcp.');
  }
  return { projectPath, endpoint };
}
