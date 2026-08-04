"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOOL_MANAGER_SETTINGS = exports.DEFAULT_SETTINGS = void 0;
exports.readSettings = readSettings;
exports.saveSettings = saveSettings;
exports.readToolManagerSettings = readToolManagerSettings;
exports.saveToolManagerSettings = saveToolManagerSettings;
exports.exportToolConfiguration = exportToolConfiguration;
exports.importToolConfiguration = importToolConfiguration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.DEFAULT_SETTINGS = {
    port: 3000,
    autoStart: false,
    enableDebugLog: false,
    allowedOrigins: ['*'],
    maxConnections: 10
};
exports.DEFAULT_TOOL_MANAGER_SETTINGS = {
    configurations: [],
    currentConfigId: '',
    maxConfigSlots: 5
};
function getSettingsDir() {
    return path.join(Editor.Project.path, 'settings');
}
function ensureSettingsDir() {
    const dir = getSettingsDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function getSettingsPath() {
    return path.join(getSettingsDir(), 'mcp-server.json');
}
function getToolManagerSettingsPath() {
    return path.join(getSettingsDir(), 'tool-manager.json');
}
function readSettings() {
    try {
        ensureSettingsDir();
        const filePath = getSettingsPath();
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return Object.assign(Object.assign({}, exports.DEFAULT_SETTINGS), JSON.parse(content));
        }
    }
    catch (e) {
        console.error('[Settings] Failed to read server settings:', e);
    }
    return Object.assign({}, exports.DEFAULT_SETTINGS);
}
function saveSettings(settings) {
    try {
        ensureSettingsDir();
        fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('[Settings] Failed to save server settings:', e);
        throw e;
    }
}
function readToolManagerSettings() {
    try {
        ensureSettingsDir();
        const filePath = getToolManagerSettingsPath();
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return Object.assign(Object.assign({}, exports.DEFAULT_TOOL_MANAGER_SETTINGS), JSON.parse(content));
        }
    }
    catch (e) {
        console.error('[Settings] Failed to read tool manager settings:', e);
    }
    return Object.assign({}, exports.DEFAULT_TOOL_MANAGER_SETTINGS);
}
function saveToolManagerSettings(settings) {
    try {
        ensureSettingsDir();
        fs.writeFileSync(getToolManagerSettingsPath(), JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('[Settings] Failed to save tool manager settings:', e);
        throw e;
    }
}
function exportToolConfiguration(config) {
    return JSON.stringify(config, null, 2);
}
function importToolConfiguration(configJson) {
    let config;
    try {
        config = JSON.parse(configJson);
    }
    catch (e) {
        throw new Error('Invalid JSON format');
    }
    if (!config.id || !config.name || !Array.isArray(config.tools)) {
        throw new Error('Invalid configuration structure: missing required fields (id, name, tools)');
    }
    return config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUNBLG9DQVlDO0FBRUQsb0NBUUM7QUFFRCwwREFZQztBQUVELDBEQVFDO0FBRUQsMERBRUM7QUFFRCwwREFXQztBQXBHRCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBR2hCLFFBQUEsZ0JBQWdCLEdBQXNCO0lBQy9DLElBQUksRUFBRSxJQUFJO0lBQ1YsU0FBUyxFQUFFLEtBQUs7SUFDaEIsY0FBYyxFQUFFLEtBQUs7SUFDckIsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ3JCLGNBQWMsRUFBRSxFQUFFO0NBQ3JCLENBQUM7QUFFVyxRQUFBLDZCQUE2QixHQUF3QjtJQUM5RCxjQUFjLEVBQUUsRUFBRTtJQUNsQixlQUFlLEVBQUUsRUFBRTtJQUNuQixjQUFjLEVBQUUsQ0FBQztDQUNwQixDQUFDO0FBRUYsU0FBUyxjQUFjO0lBQ25CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyxpQkFBaUI7SUFDdEIsTUFBTSxHQUFHLEdBQUcsY0FBYyxFQUFFLENBQUM7SUFDN0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN0QixFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxlQUFlO0lBQ3BCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFFRCxTQUFTLDBCQUEwQjtJQUMvQixP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QUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzdELE1BQU0sSUFBSSxLQUFLLENBQUMsNEVBQTRFLENBQUMsQ0FBQztJQUNsRyxDQUFDO0lBQ0QsT0FBTyxNQUEyQixDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzLCBUb29sTWFuYWdlclNldHRpbmdzLCBUb29sQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE1DUFNlcnZlclNldHRpbmdzID0ge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGF1dG9TdGFydDogZmFsc2UsXHJcbiAgICBlbmFibGVEZWJ1Z0xvZzogZmFsc2UsXHJcbiAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXHJcbiAgICBtYXhDb25uZWN0aW9uczogMTBcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX1RPT0xfTUFOQUdFUl9TRVRUSU5HUzogVG9vbE1hbmFnZXJTZXR0aW5ncyA9IHtcclxuICAgIGNvbmZpZ3VyYXRpb25zOiBbXSxcclxuICAgIGN1cnJlbnRDb25maWdJZDogJycsXHJcbiAgICBtYXhDb25maWdTbG90czogNVxyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0U2V0dGluZ3NEaXIoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3NldHRpbmdzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuc3VyZVNldHRpbmdzRGlyKCk6IHZvaWQge1xyXG4gICAgY29uc3QgZGlyID0gZ2V0U2V0dGluZ3NEaXIoKTtcclxuICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSB7XHJcbiAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNldHRpbmdzUGF0aCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihnZXRTZXR0aW5nc0RpcigpLCAnbWNwLXNlcnZlci5qc29uJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGdldFNldHRpbmdzRGlyKCksICd0b29sLW1hbmFnZXIuanNvbicpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZFNldHRpbmdzKCk6IE1DUFNlcnZlclNldHRpbmdzIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcclxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGdldFNldHRpbmdzUGF0aCgpO1xyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpO1xyXG4gICAgICAgICAgICByZXR1cm4geyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi5KU09OLnBhcnNlKGNvbnRlbnQpIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTZXR0aW5nc10gRmFpbGVkIHRvIHJlYWQgc2VydmVyIHNldHRpbmdzOicsIGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVNldHRpbmdzKHNldHRpbmdzOiBNQ1BTZXJ2ZXJTZXR0aW5ncyk6IHZvaWQge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBlbnN1cmVTZXR0aW5nc0RpcigpO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZ2V0U2V0dGluZ3NQYXRoKCksIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW1NldHRpbmdzXSBGYWlsZWQgdG8gc2F2ZSBzZXJ2ZXIgc2V0dGluZ3M6JywgZSk7XHJcbiAgICAgICAgdGhyb3cgZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk6IFRvb2xNYW5hZ2VyU2V0dGluZ3Mge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBlbnN1cmVTZXR0aW5nc0RpcigpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0VG9vbE1hbmFnZXJTZXR0aW5nc1BhdGgoKTtcclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgLi4uREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1MsIC4uLkpTT04ucGFyc2UoY29udGVudCkgfTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW1NldHRpbmdzXSBGYWlsZWQgdG8gcmVhZCB0b29sIG1hbmFnZXIgc2V0dGluZ3M6JywgZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyAuLi5ERUZBVUxUX1RPT0xfTUFOQUdFUl9TRVRUSU5HUyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3Moc2V0dGluZ3M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MpOiB2b2lkIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCksIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW1NldHRpbmdzXSBGYWlsZWQgdG8gc2F2ZSB0b29sIG1hbmFnZXIgc2V0dGluZ3M6JywgZSk7XHJcbiAgICAgICAgdGhyb3cgZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRUb29sQ29uZmlndXJhdGlvbihjb25maWdKc29uOiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XHJcbiAgICBsZXQgY29uZmlnOiBhbnk7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnSnNvbik7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04gZm9ybWF0Jyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWNvbmZpZy5pZCB8fCAhY29uZmlnLm5hbWUgfHwgIUFycmF5LmlzQXJyYXkoY29uZmlnLnRvb2xzKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb25maWd1cmF0aW9uIHN0cnVjdHVyZTogbWlzc2luZyByZXF1aXJlZCBmaWVsZHMgKGlkLCBuYW1lLCB0b29scyknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjb25maWcgYXMgVG9vbENvbmZpZ3VyYXRpb247XHJcbn1cclxuIl19