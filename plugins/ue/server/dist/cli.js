#!/usr/bin/env node
import { startNativeProxy } from './proxy/native-proxy.js';
startNativeProxy();
process.stdin.once('end', () => process.exit(0));
//# sourceMappingURL=cli.js.map