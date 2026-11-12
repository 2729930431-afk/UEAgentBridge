import { request } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { PACKAGE } from '../constants.js';
import { projectRootFromEnv } from '../utils/config/ini-reader.js';
import { Logger } from '../utils/logging/logger.js';
const NATIVE_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const MODERN_VERSION_KEY = 'io.modelcontextprotocol/protocolVersion';
function modernHeaders(message) {
    const version = message.params?._meta?.[MODERN_VERSION_KEY];
    if (typeof version !== 'string')
        return undefined;
    const headers = { 'MCP-Protocol-Version': version, 'Mcp-Method': message.method ?? '' };
    const field = message.method === 'resources/read' ? 'uri'
        : message.method === 'tools/call' || message.method === 'prompts/get' ? 'name'
            : message.method?.startsWith('tasks/') ? 'taskId' : undefined;
    const name = field ? message.params?.[field] : undefined;
    if (typeof name === 'string' && name) {
        headers['Mcp-Name'] = /^[!-~](?:[ -~]*[!-~])?$/u.test(name) ? name : `=?base64?${Buffer.from(name, 'utf8').toString('base64')}?=`;
    }
    return headers;
}
const PLACEHOLDER_TOOL = {
    name: 'unreal',
    description: 'Unreal Engine editor: operation search, describe, execute or configure. The editor has not been '
        + 'reached yet, so this is a placeholder; the full contract replaces it once the editor answers.',
    inputSchema: { type: 'object', properties: { operation: { type: 'string', enum: ['search', 'describe', 'execute', 'configure'] } }, required: ['operation'] }
};
export async function readCapabilityToken() {
    const fromEnv = process.env.MCP_AUTOMATION_CAPABILITY_TOKEN;
    if (fromEnv)
        return fromEnv;
    const projectRoot = projectRootFromEnv();
    if (!projectRoot)
        return undefined;
    try {
        const token = (await readFile(join(projectRoot, 'Saved', 'MCP', 'capability-token'), 'utf8')).trim().toLowerCase();
        return /^[0-9a-f]{64}$/u.test(token) ? token : undefined;
    }
    catch {
        return undefined;
    }
}
export function startNativeProxy(options = {}) {
    const upstream = options.upstream ?? process.env.UNREAL_MCP_URL ?? 'http://127.0.0.1:3000/mcp';
    const cacheFile = options.cacheFile ?? process.env.UNREAL_MCP_PROXY_CACHE
        ?? join(process.env.LOCALAPPDATA ?? process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'unreal-mcp', `proxy-${new URL(upstream).port || '80'}.json`);
    const output = options.output ?? process.stdout;
    const log = new Logger('NativeProxy');
    const token = options.token ?? readCapabilityToken;
    const notConnected = `NOT_CONNECTED: the Unreal Editor is not running (nothing answers at ${upstream}). `
        + 'Start the editor and call again; this server stays connected, no reconnect is needed. If the editor is '
        + 'running, turn on Project Settings > EngineWire > Enable Native MCP Server and restart it.';
    const proxyNote = 'This server is reached through the unreal-engine-mcp-server proxy: while the editor is not '
        + 'running every call answers NOT_CONNECTED; once the editor is up the next call reaches it, with no reconnect.';
    let cache = {};
    try {
        cache = JSON.parse(readFileSync(cacheFile, 'utf8'));
    }
    catch { }
    let servedTools = cache.tools ?? [PLACEHOLDER_TOOL];
    let clientProtocol = NATIVE_PROTOCOLS[0];
    let clientReady = false;
    let session;
    let opening;
    const write = (message) => { output.write(`${JSON.stringify(message)}\n`); };
    const remember = (patch) => {
        cache = { ...cache, ...patch };
        try {
            mkdirSync(dirname(cacheFile), { recursive: true, mode: 0o700 });
            writeFileSync(cacheFile, JSON.stringify(cache), { mode: 0o600 });
        }
        catch (error) {
            log.warn(`cache not written: ${String(error)}`);
        }
    };
    const post = async (body, current, onNotification, modern) => {
        const payload = JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            Connection: 'close',
            'Content-Length': Buffer.byteLength(payload),
            ...modern
        };
        const capabilityToken = await token();
        if (capabilityToken)
            headers['X-MCP-Capability-Token'] = capabilityToken;
        if (current) {
            headers['Mcp-Session-Id'] = current.id;
            headers['MCP-Protocol-Version'] = current.protocol;
        }
        return new Promise((resolve, reject) => {
            const req = request(upstream, { method: 'POST', agent: false, headers, timeout: 600_000 }, (res) => {
                const sse = String(res.headers['content-type'] ?? '').includes('text/event-stream');
                let reply;
                let text = '';
                let pending = '';
                const take = (message) => {
                    if (message.id !== undefined && message.id === body.id && ('result' in message || 'error' in message))
                        reply = message;
                    else if (message.method && message.id === undefined)
                        onNotification?.(message);
                };
                const takeEvent = (event) => {
                    const data = event.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, '')).join('\n');
                    if (data)
                        try {
                            take(JSON.parse(data));
                        }
                        catch { }
                };
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    if (!sse) {
                        text += chunk;
                        return;
                    }
                    if (text.length < 2000)
                        text += chunk;
                    pending += chunk.replace(/\r/g, '');
                    for (let cut = pending.indexOf('\n\n'); cut >= 0; cut = pending.indexOf('\n\n')) {
                        takeEvent(pending.slice(0, cut));
                        pending = pending.slice(cut + 2);
                    }
                });
                res.on('end', () => {
                    if (sse && pending.trim())
                        takeEvent(pending);
                    if (!sse && text.trim()) {
                        try {
                            const parsed = JSON.parse(text);
                            (Array.isArray(parsed) ? parsed : [parsed]).forEach(take);
                        }
                        catch { }
                    }
                    const sessionId = res.headers['mcp-session-id'];
                    resolve({ status: res.statusCode ?? 0, sessionId: typeof sessionId === 'string' ? sessionId : undefined, reply, text });
                });
                res.on('error', reject);
            });
            req.on('timeout', () => req.destroy(Object.assign(new Error('the editor did not answer within 10 minutes'), { code: 'ETIMEDOUT' })));
            req.on('error', reject);
            req.end(payload);
        });
    };
    const adoptTools = (tools, announce) => {
        if (JSON.stringify(tools) === JSON.stringify(servedTools))
            return;
        servedTools = tools;
        remember({ tools });
        if (announce && clientReady)
            write({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    };
    const openSession = () => {
        if (session)
            return Promise.resolve(session);
        opening ??= (async () => {
            try {
                const init = await post({ jsonrpc: '2.0', id: 'proxy-initialize', method: 'initialize', params: { protocolVersion: clientProtocol, capabilities: {}, clientInfo: { name: `${PACKAGE.name} proxy`, version: PACKAGE.version } } });
                const result = init.reply?.result;
                if (!result || !init.sessionId)
                    throw new Error(`initialize answered HTTP ${init.status}: ${init.text.slice(0, 200)}`);
                const opened = { id: init.sessionId, protocol: result.protocolVersion ?? clientProtocol };
                await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, opened);
                session = opened;
                log.info(`connected to ${upstream} (${result.serverInfo?.name ?? '?'} ${result.serverInfo?.version ?? ''})`);
                remember({ instructions: result.instructions, capabilities: result.capabilities });
                post({ jsonrpc: '2.0', id: 'proxy-tools', method: 'tools/list', params: {} }, opened)
                    .then((res) => {
                    const tools = res.reply?.result?.tools;
                    if (Array.isArray(tools))
                        adoptTools(tools, true);
                })
                    .catch(() => { });
                return opened;
            }
            finally {
                opening = undefined;
            }
        })();
        return opening;
    };
    const forward = async (message) => {
        const modern = modernHeaders(message);
        if (modern)
            return post(message, undefined, write, modern);
        for (let attempt = 1;; attempt += 1) {
            const current = await openSession();
            let res;
            try {
                res = await post(message, current, write);
            }
            catch (error) {
                if (session === current) {
                    session = undefined;
                    log.warn(`lost ${upstream}: ${String(error)}`);
                }
                throw error;
            }
            if (res.status === 404 && attempt === 1) {
                if (session === current)
                    session = undefined;
                continue;
            }
            return res;
        }
    };
    const offline = (message, error) => {
        const code = error?.code;
        const why = `${notConnected} (${typeof code === 'string' ? code : String(error)})`;
        const results = {
            'tools/list': { tools: servedTools },
            'tools/call': { content: [{ type: 'text', text: why }], isError: true },
            'resources/list': { resources: [] },
            'resources/templates/list': { resourceTemplates: [] },
            'prompts/list': { prompts: [] },
            'logging/setLevel': {}
        };
        const result = results[message.method ?? ''];
        if (!result)
            return { jsonrpc: '2.0', id: message.id, error: { code: -32000, message: why } };
        return { jsonrpc: '2.0', id: message.id, result: modernHeaders(message) ? { resultType: 'complete', ...result } : result };
    };
    const handle = async (message) => {
        const { id, method } = message;
        if (method === undefined)
            return;
        if (id === undefined) {
            if (method === 'notifications/initialized') {
                clientReady = true;
                openSession().catch(() => { });
            }
            else if (modernHeaders(message)) {
            }
            else if (session) {
                post(message, session).catch(() => { });
            }
            return;
        }
        if (method === 'initialize') {
            const requested = message.params?.protocolVersion;
            clientProtocol = typeof requested === 'string' && NATIVE_PROTOCOLS.includes(requested) ? requested : NATIVE_PROTOCOLS[0];
            const upstreamCapabilities = cache.capabilities ?? { resources: {}, prompts: {}, completions: {} };
            const { subscribe: _unrelayed, ...resources } = (upstreamCapabilities.resources ?? {});
            write({
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: clientProtocol,
                    capabilities: { ...upstreamCapabilities, ...('resources' in upstreamCapabilities ? { resources } : {}), tools: { listChanged: true } },
                    serverInfo: { name: `${PACKAGE.name} proxy`, version: PACKAGE.version },
                    instructions: cache.instructions ? `${cache.instructions}\n\n${proxyNote}` : proxyNote
                }
            });
            return;
        }
        if (method === 'ping') {
            write({ jsonrpc: '2.0', id, result: {} });
            return;
        }
        try {
            const res = await forward(message);
            const tools = method === 'tools/list' ? res.reply?.result?.tools : undefined;
            if (Array.isArray(tools))
                adoptTools(tools, false);
            write(res.reply ?? { jsonrpc: '2.0', id, error: { code: -32603, message: `the editor answered HTTP ${res.status} with no JSON-RPC reply: ${res.text.slice(0, 300)}` } });
        }
        catch (error) {
            write(offline(message, error));
        }
    };
    const lines = createInterface({ input: options.input ?? process.stdin, crlfDelay: Infinity });
    lines.on('line', (line) => {
        if (!line.trim())
            return;
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch {
            write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
            return;
        }
        for (const message of Array.isArray(parsed) ? parsed : [parsed]) {
            handle(message).catch((error) => log.error(`unhandled: ${String(error)}`));
        }
    });
    return { close: () => lines.close() };
}
//# sourceMappingURL=native-proxy.js.map