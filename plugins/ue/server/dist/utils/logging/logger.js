const LOG_LEVEL_ORDER = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
function normalizeLogLevel(value, fallback) {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return Object.hasOwn(LOG_LEVEL_ORDER, normalized) ? normalized : fallback;
}
export class Logger {
    scope;
    level;
    constructor(scope, level = 'info') {
        this.scope = scope;
        this.level = normalizeLogLevel(process.env.LOG_LEVEL ?? process.env.LOGLEVEL, level);
    }
    isEnabled(level) {
        return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[this.level];
    }
    write(level, args) {
        if (this.isEnabled(level))
            console.error(`[${this.scope}]`, ...args);
    }
    debug(...args) { this.write('debug', args); }
    info(...args) { this.write('info', args); }
    warn(...args) { this.write('warn', args); }
    error(...args) { this.write('error', args); }
}
//# sourceMappingURL=logger.js.map