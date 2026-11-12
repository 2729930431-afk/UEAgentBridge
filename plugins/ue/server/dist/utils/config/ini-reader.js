import fs from 'node:fs';
import path from 'node:path';
function projectRoot(projectPath) {
    return projectPath.toLowerCase().endsWith('.uproject') ? path.dirname(projectPath) : projectPath;
}
export function projectRootFromEnv() {
    const projectPath = process.env.UE_PROJECT_PATH;
    return projectPath ? projectRoot(projectPath) : undefined;
}
function readIniSection(filePath, sectionName) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return undefined;
    }
    let section;
    let inSection = false;
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#'))
            continue;
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            inSection = trimmed.slice(1, -1) === sectionName;
            if (inSection)
                section ??= Object.create(null);
            continue;
        }
        const eq = trimmed.indexOf('=');
        if (inSection && section && eq > 0)
            section[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return section;
}
export function readProjectIniValue(projectPath, category, sectionName, key) {
    const dirPath = projectRoot(projectPath);
    const cleanCategory = category.replace(/^Default/, '');
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanCategory))
        return undefined;
    for (const configPath of [
        path.join(dirPath, 'Config', `Default${cleanCategory}.ini`),
        path.join(dirPath, 'Saved', 'Config', 'WindowsEditor', `${cleanCategory}.ini`),
        path.join(dirPath, 'Saved', 'Config', 'Windows', `${cleanCategory}.ini`),
        path.join(dirPath, 'Saved', 'Config', 'Mac', `${cleanCategory}.ini`),
        path.join(dirPath, 'Saved', 'Config', 'Linux', `${cleanCategory}.ini`)
    ]) {
        const value = readIniSection(configPath, sectionName)?.[key];
        if (value !== undefined)
            return value;
    }
    return undefined;
}
//# sourceMappingURL=ini-reader.js.map