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
exports.DebugTools = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DebugTools {
    constructor() {
        this.consoleMessages = [];
    }
    getTools() {
        return [
            {
                name: 'get_console_logs',
                description: 'Get editor console logs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of recent logs to retrieve',
                            default: 100
                        },
                        filter: {
                            type: 'string',
                            description: 'Filter logs by type',
                            enum: ['all', 'log', 'warn', 'error', 'info'],
                            default: 'all'
                        }
                    }
                }
            },
            {
                name: 'clear_console',
                description: 'Clear editor console',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'execute_script',
                description: 'Execute JavaScript in scene context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        script: { type: 'string', description: 'JavaScript code to execute' }
                    },
                    required: ['script']
                }
            },
            {
                name: 'get_node_tree',
                description: 'Get detailed node tree for debugging',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootUuid: {
                            type: 'string',
                            description: 'Root node UUID (uses scene root if omitted)'
                        },
                        maxDepth: {
                            type: 'number',
                            description: 'Maximum tree depth',
                            default: 10
                        }
                    }
                }
            },
            {
                name: 'get_performance_stats',
                description: 'Get performance statistics',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'validate_scene',
                description: 'Validate current scene for issues',
                inputSchema: {
                    type: 'object',
                    properties: {
                        checkMissingAssets: {
                            type: 'boolean',
                            description: 'Check for missing asset references',
                            default: true
                        },
                        checkPerformance: {
                            type: 'boolean',
                            description: 'Check for performance issues',
                            default: true
                        }
                    }
                }
            },
            {
                name: 'get_editor_info',
                description: 'Get editor and environment information',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'get_project_logs',
                description: 'Get project logs from temp/logs/project.log file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lines: {
                            type: 'number',
                            description: 'Number of lines to read from end of log file',
                            default: 100,
                            minimum: 1,
                            maximum: 10000
                        },
                        filterKeyword: {
                            type: 'string',
                            description: 'Filter logs containing specific keyword (optional)'
                        },
                        logLevel: {
                            type: 'string',
                            description: 'Filter by log level',
                            enum: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
                            default: 'ALL'
                        }
                    }
                }
            },
            {
                name: 'get_log_file_info',
                description: 'Get information about the project log file',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'search_project_logs',
                description: 'Search for specific patterns or errors in project logs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'Search pattern (supports regex)'
                        },
                        maxResults: {
                            type: 'number',
                            description: 'Maximum number of matching results',
                            default: 20,
                            minimum: 1,
                            maximum: 100
                        },
                        contextLines: {
                            type: 'number',
                            description: 'Number of context lines to show around each match',
                            default: 2,
                            minimum: 0,
                            maximum: 10
                        }
                    },
                    required: ['pattern']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'get_console_logs': return this.getConsoleLogs(args.limit, args.filter);
            case 'clear_console': return this.clearConsole();
            case 'execute_script': return this.executeScript(args.script);
            case 'get_node_tree': return this.getNodeTree(args.rootUuid, args.maxDepth);
            case 'get_performance_stats': return this.getPerformanceStats();
            case 'validate_scene': return this.validateScene(args);
            case 'get_editor_info': return this.getEditorInfo();
            case 'get_project_logs': return this.getProjectLogs(args.lines, args.filterKeyword, args.logLevel);
            case 'get_log_file_info': return this.getLogFileInfo();
            case 'search_project_logs': return this.searchProjectLogs(args.pattern, args.maxResults, args.contextLines);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    getConsoleLogs(limit = 100, filter = 'all') {
        const logs = filter === 'all'
            ? this.consoleMessages
            : this.consoleMessages.filter(m => m.type === filter);
        const recent = logs.slice(-limit);
        return {
            success: true,
            data: { total: logs.length, returned: recent.length, logs: recent }
        };
    }
    clearConsole() {
        this.consoleMessages = [];
        try {
            Editor.Message.send('console', 'clear');
            return { success: true, message: 'Console cleared successfully' };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async executeScript(script) {
        try {
            const result = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'console',
                method: 'eval',
                args: [script]
            });
            return { success: true, data: { result, message: 'Script executed successfully' } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async getNodeTree(rootUuid, maxDepth = 10) {
        const buildTree = async (nodeUuid, depth = 0) => {
            var _a, _b, _c, _d, _e;
            if (depth >= maxDepth)
                return { truncated: true };
            try {
                const nodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
                const tree = {
                    uuid: nodeData.uuid,
                    name: nodeData.name,
                    active: nodeData.active,
                    components: (_b = (_a = nodeData.components) === null || _a === void 0 ? void 0 : _a.map((c) => c.__type__)) !== null && _b !== void 0 ? _b : [],
                    childCount: (_d = (_c = nodeData.children) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0,
                    children: []
                };
                if ((_e = nodeData.children) === null || _e === void 0 ? void 0 : _e.length) {
                    for (const childId of nodeData.children) {
                        tree.children.push(await buildTree(childId, depth + 1));
                    }
                }
                return tree;
            }
            catch (err) {
                return { error: err.message };
            }
        };
        try {
            if (rootUuid) {
                return { success: true, data: await buildTree(rootUuid) };
            }
            const hierarchy = await Editor.Message.request('scene', 'query-hierarchy');
            const trees = await Promise.all(hierarchy.children.map((n) => buildTree(n.uuid)));
            return { success: true, data: trees };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async getPerformanceStats() {
        var _a, _b, _c, _d, _e;
        try {
            const stats = await Editor.Message.request('scene', 'query-performance');
            const perfStats = {
                nodeCount: (_a = stats.nodeCount) !== null && _a !== void 0 ? _a : 0,
                componentCount: (_b = stats.componentCount) !== null && _b !== void 0 ? _b : 0,
                drawCalls: (_c = stats.drawCalls) !== null && _c !== void 0 ? _c : 0,
                triangles: (_d = stats.triangles) !== null && _d !== void 0 ? _d : 0,
                memory: (_e = stats.memory) !== null && _e !== void 0 ? _e : {}
            };
            return { success: true, data: perfStats };
        }
        catch (_f) {
            return { success: true, data: { message: 'Performance stats not available in edit mode' } };
        }
    }
    async validateScene(options) {
        var _a;
        const issues = [];
        try {
            if (options.checkMissingAssets) {
                const assetCheck = await Editor.Message.request('scene', 'check-missing-assets');
                if ((_a = assetCheck === null || assetCheck === void 0 ? void 0 : assetCheck.missing) === null || _a === void 0 ? void 0 : _a.length) {
                    issues.push({
                        type: 'error',
                        category: 'assets',
                        message: `Found ${assetCheck.missing.length} missing asset references`,
                        details: assetCheck.missing
                    });
                }
            }
            if (options.checkPerformance) {
                const hierarchy = await Editor.Message.request('scene', 'query-hierarchy');
                const nodeCount = this.countNodes(hierarchy.children);
                if (nodeCount > 1000) {
                    issues.push({
                        type: 'warning',
                        category: 'performance',
                        message: `High node count: ${nodeCount} nodes (recommended < 1000)`,
                        suggestion: 'Consider using object pooling or scene optimization'
                    });
                }
            }
            const result = { valid: issues.length === 0, issueCount: issues.length, issues };
            return { success: true, data: result };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    countNodes(nodes) {
        return nodes.reduce((count, node) => count + 1 + (node.children ? this.countNodes(node.children) : 0), 0);
    }
    getEditorInfo() {
        var _a, _b, _c, _d;
        return {
            success: true,
            data: {
                editor: {
                    version: (_b = (_a = Editor.versions) === null || _a === void 0 ? void 0 : _a.editor) !== null && _b !== void 0 ? _b : 'Unknown',
                    cocosVersion: (_d = (_c = Editor.versions) === null || _c === void 0 ? void 0 : _c.cocos) !== null && _d !== void 0 ? _d : 'Unknown',
                    platform: process.platform,
                    arch: process.arch,
                    nodeVersion: process.version
                },
                project: {
                    name: Editor.Project.name,
                    path: Editor.Project.path,
                    uuid: Editor.Project.uuid
                },
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        };
    }
    findLogFile() {
        var _a;
        const candidates = [(_a = Editor.Project) === null || _a === void 0 ? void 0 : _a.path, process.cwd()].filter(Boolean);
        for (const base of candidates) {
            const p = path.join(base, 'temp', 'logs', 'project.log');
            if (fs.existsSync(p))
                return p;
        }
        return null;
    }
    getProjectLogs(lines = 100, filterKeyword, logLevel = 'ALL') {
        const logFilePath = this.findLogFile();
        if (!logFilePath) {
            return { success: false, error: 'Project log file not found at temp/logs/project.log' };
        }
        try {
            const allLines = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(l => l.trim());
            let filtered = allLines.slice(-lines);
            if (logLevel !== 'ALL') {
                filtered = filtered.filter(l => l.includes(`[${logLevel}]`) || l.includes(logLevel.toLowerCase()));
            }
            if (filterKeyword) {
                filtered = filtered.filter(l => l.toLowerCase().includes(filterKeyword.toLowerCase()));
            }
            return {
                success: true,
                data: {
                    totalLines: allLines.length,
                    requestedLines: lines,
                    filteredLines: filtered.length,
                    logLevel,
                    filterKeyword: filterKeyword !== null && filterKeyword !== void 0 ? filterKeyword : null,
                    logs: filtered,
                    logFilePath
                }
            };
        }
        catch (err) {
            return { success: false, error: `Failed to read project logs: ${err.message}` };
        }
    }
    getLogFileInfo() {
        const logFilePath = this.findLogFile();
        if (!logFilePath) {
            return { success: false, error: 'Project log file not found at temp/logs/project.log' };
        }
        try {
            const stats = fs.statSync(logFilePath);
            const lineCount = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(l => l.trim()).length;
            return {
                success: true,
                data: {
                    filePath: logFilePath,
                    fileSize: stats.size,
                    fileSizeFormatted: this.formatFileSize(stats.size),
                    lastModified: stats.mtime.toISOString(),
                    lineCount,
                    created: stats.birthtime.toISOString()
                }
            };
        }
        catch (err) {
            return { success: false, error: `Failed to get log file info: ${err.message}` };
        }
    }
    searchProjectLogs(pattern, maxResults = 20, contextLines = 2) {
        const logFilePath = this.findLogFile();
        if (!logFilePath) {
            return { success: false, error: 'Project log file not found at temp/logs/project.log' };
        }
        try {
            const logLines = fs.readFileSync(logFilePath, 'utf8').split('\n');
            let regex;
            try {
                regex = new RegExp(pattern, 'gi');
            }
            catch (_a) {
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            }
            const matches = [];
            for (let i = 0; i < logLines.length && matches.length < maxResults; i++) {
                regex.lastIndex = 0;
                if (!regex.test(logLines[i]))
                    continue;
                const start = Math.max(0, i - contextLines);
                const end = Math.min(logLines.length - 1, i + contextLines);
                matches.push({
                    lineNumber: i + 1,
                    matchedLine: logLines[i],
                    context: Array.from({ length: end - start + 1 }, (_, j) => ({
                        lineNumber: start + j + 1,
                        content: logLines[start + j],
                        isMatch: start + j === i
                    }))
                });
            }
            return {
                success: true,
                data: { pattern, totalMatches: matches.length, maxResults, contextLines, logFilePath, matches }
            };
        }
        catch (err) {
            return { success: false, error: `Failed to search project logs: ${err.message}` };
        }
    }
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
exports.DebugTools = DebugTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLFVBQVU7SUFBdkI7UUFDWSxvQkFBZSxHQUFxQixFQUFFLENBQUM7SUFvYW5ELENBQUM7SUFsYUcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixXQUFXLEVBQUUseUJBQXlCO2dCQUN0QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLEtBQUssRUFBRTs0QkFDSCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUNBQW1DOzRCQUNoRCxPQUFPLEVBQUUsR0FBRzt5QkFDZjt3QkFDRCxNQUFNLEVBQUU7NEJBQ0osSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFCQUFxQjs0QkFDbEMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQzs0QkFDN0MsT0FBTyxFQUFFLEtBQUs7eUJBQ2pCO3FCQUNKO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLHNCQUFzQjtnQkFDbkMsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsV0FBVyxFQUFFLHFDQUFxQztnQkFDbEQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxF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cnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIENvbnNvbGVNZXNzYWdlLCBQZXJmb3JtYW5jZVN0YXRzLCBWYWxpZGF0aW9uUmVzdWx0LCBWYWxpZGF0aW9uSXNzdWUgfSBmcm9tICcuLi90eXBlcyc7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmV4cG9ydCBjbGFzcyBEZWJ1Z1Rvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcclxuICAgIHByaXZhdGUgY29uc29sZU1lc3NhZ2VzOiBDb25zb2xlTWVzc2FnZVtdID0gW107XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9jb25zb2xlX2xvZ3MnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgZWRpdG9yIGNvbnNvbGUgbG9ncycsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgcmVjZW50IGxvZ3MgdG8gcmV0cmlldmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMTAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbHRlciBsb2dzIGJ5IHR5cGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydhbGwnLCAnbG9nJywgJ3dhcm4nLCAnZXJyb3InLCAnaW5mbyddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2FsbCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NsZWFyX2NvbnNvbGUnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDbGVhciBlZGl0b3IgY29uc29sZScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczoge30gfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZXhlY3V0ZV9zY3JpcHQnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRlIEphdmFTY3JpcHQgaW4gc2NlbmUgY29udGV4dCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0phdmFTY3JpcHQgY29kZSB0byBleGVjdXRlJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydzY3JpcHQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X25vZGVfdHJlZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBkZXRhaWxlZCBub2RlIHRyZWUgZm9yIGRlYnVnZ2luZycsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSb290IG5vZGUgVVVJRCAodXNlcyBzY2VuZSByb290IGlmIG9taXR0ZWQpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhEZXB0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ01heGltdW0gdHJlZSBkZXB0aCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAxMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3BlcmZvcm1hbmNlX3N0YXRzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHBlcmZvcm1hbmNlIHN0YXRpc3RpY3MnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHt9IH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRlX3NjZW5lJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgY3VycmVudCBzY2VuZSBmb3IgaXNzdWVzJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja01pc3NpbmdBc3NldHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgZm9yIG1pc3NpbmcgYXNzZXQgcmVmZXJlbmNlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUGVyZm9ybWFuY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgZm9yIHBlcmZvcm1hbmNlIGlzc3VlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfZWRpdG9yX2luZm8nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgZWRpdG9yIGFuZCBlbnZpcm9ubWVudCBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczoge30gfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3Byb2plY3RfbG9ncycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBwcm9qZWN0IGxvZ3MgZnJvbSB0ZW1wL2xvZ3MvcHJvamVjdC5sb2cgZmlsZScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgbGluZXMgdG8gcmVhZCBmcm9tIGVuZCBvZiBsb2cgZmlsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAxMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4aW11bTogMTAwMDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyS2V5d29yZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbHRlciBsb2dzIGNvbnRhaW5pbmcgc3BlY2lmaWMga2V5d29yZCAob3B0aW9uYWwpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dMZXZlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbHRlciBieSBsb2cgbGV2ZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydFUlJPUicsICdXQVJOJywgJ0lORk8nLCAnREVCVUcnLCAnVFJBQ0UnLCAnQUxMJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnQUxMJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X2xvZ19maWxlX2luZm8nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHByb2plY3QgbG9nIGZpbGUnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHt9IH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3NlYXJjaF9wcm9qZWN0X2xvZ3MnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZWFyY2ggZm9yIHNwZWNpZmljIHBhdHRlcm5zIG9yIGVycm9ycyBpbiBwcm9qZWN0IGxvZ3MnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZWFyY2ggcGF0dGVybiAoc3VwcG9ydHMgcmVnZXgpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhSZXN1bHRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBudW1iZXIgb2YgbWF0Y2hpbmcgcmVzdWx0cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAyMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiAxMDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dExpbmVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGNvbnRleHQgbGluZXMgdG8gc2hvdyBhcm91bmQgZWFjaCBtYXRjaCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdHRlcm4nXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfY29uc29sZV9sb2dzJzogICByZXR1cm4gdGhpcy5nZXRDb25zb2xlTG9ncyhhcmdzLmxpbWl0LCBhcmdzLmZpbHRlcik7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NsZWFyX2NvbnNvbGUnOiAgICAgIHJldHVybiB0aGlzLmNsZWFyQ29uc29sZSgpO1xyXG4gICAgICAgICAgICBjYXNlICdleGVjdXRlX3NjcmlwdCc6ICAgICByZXR1cm4gdGhpcy5leGVjdXRlU2NyaXB0KGFyZ3Muc2NyaXB0KTtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0X25vZGVfdHJlZSc6ICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZVRyZWUoYXJncy5yb290VXVpZCwgYXJncy5tYXhEZXB0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldF9wZXJmb3JtYW5jZV9zdGF0cyc6IHJldHVybiB0aGlzLmdldFBlcmZvcm1hbmNlU3RhdHMoKTtcclxuICAgICAgICAgICAgY2FzZSAndmFsaWRhdGVfc2NlbmUnOiAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVTY2VuZShhcmdzKTtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0X2VkaXRvcl9pbmZvJzogICAgcmV0dXJuIHRoaXMuZ2V0RWRpdG9ySW5mbygpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfcHJvamVjdF9sb2dzJzogICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0TG9ncyhhcmdzLmxpbmVzLCBhcmdzLmZpbHRlcktleXdvcmQsIGFyZ3MubG9nTGV2ZWwpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfbG9nX2ZpbGVfaW5mbyc6ICByZXR1cm4gdGhpcy5nZXRMb2dGaWxlSW5mbygpO1xyXG4gICAgICAgICAgICBjYXNlICdzZWFyY2hfcHJvamVjdF9sb2dzJzogcmV0dXJuIHRoaXMuc2VhcmNoUHJvamVjdExvZ3MoYXJncy5wYXR0ZXJuLCBhcmdzLm1heFJlc3VsdHMsIGFyZ3MuY29udGV4dExpbmVzKTtcclxuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q29uc29sZUxvZ3MobGltaXQ6IG51bWJlciA9IDEwMCwgZmlsdGVyOiBzdHJpbmcgPSAnYWxsJyk6IFRvb2xSZXNwb25zZSB7XHJcbiAgICAgICAgY29uc3QgbG9ncyA9IGZpbHRlciA9PT0gJ2FsbCdcclxuICAgICAgICAgICAgPyB0aGlzLmNvbnNvbGVNZXNzYWdlc1xyXG4gICAgICAgICAgICA6IHRoaXMuY29uc29sZU1lc3NhZ2VzLmZpbHRlcihtID0+IG0udHlwZSA9PT0gZmlsdGVyKTtcclxuICAgICAgICBjb25zdCByZWNlbnQgPSBsb2dzLnNsaWNlKC1saW1pdCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YTogeyB0b3RhbDogbG9ncy5sZW5ndGgsIHJldHVybmVkOiByZWNlbnQubGVuZ3RoLCBsb2dzOiByZWNlbnQgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbGVhckNvbnNvbGUoKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICB0aGlzLmNvbnNvbGVNZXNzYWdlcyA9IFtdO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2NvbnNvbGUnLCAnY2xlYXInKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ0NvbnNvbGUgY2xlYXJlZCBzdWNjZXNzZnVsbHknIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTY3JpcHQoc2NyaXB0OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbnNvbGUnLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnZXZhbCcsXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbc2NyaXB0XVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyByZXN1bHQsIG1lc3NhZ2U6ICdTY3JpcHQgZXhlY3V0ZWQgc3VjY2Vzc2Z1bGx5JyB9IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVUcmVlKHJvb3RVdWlkPzogc3RyaW5nLCBtYXhEZXB0aDogbnVtYmVyID0gMTApOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIGNvbnN0IGJ1aWxkVHJlZSA9IGFzeW5jIChub2RlVXVpZDogc3RyaW5nLCBkZXB0aDogbnVtYmVyID0gMCk6IFByb21pc2U8YW55PiA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkZXB0aCA+PSBtYXhEZXB0aCkgcmV0dXJuIHsgdHJ1bmNhdGVkOiB0cnVlIH07XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cmVlOiBhbnkgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZURhdGEudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlRGF0YS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZURhdGEuYWN0aXZlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IChub2RlRGF0YSBhcyBhbnkpLmNvbXBvbmVudHM/Lm1hcCgoYzogYW55KSA9PiBjLl9fdHlwZV9fKSA/PyBbXSxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZENvdW50OiBub2RlRGF0YS5jaGlsZHJlbj8ubGVuZ3RoID8/IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVEYXRhLmNoaWxkcmVuPy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkSWQgb2Ygbm9kZURhdGEuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5jaGlsZHJlbi5wdXNoKGF3YWl0IGJ1aWxkVHJlZShjaGlsZElkLCBkZXB0aCArIDEpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJlZTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHJvb3RVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBhd2FpdCBidWlsZFRyZWUocm9vdFV1aWQpIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5OiBhbnkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1oaWVyYXJjaHknKTtcclxuICAgICAgICAgICAgY29uc3QgdHJlZXMgPSBhd2FpdCBQcm9taXNlLmFsbChoaWVyYXJjaHkuY2hpbGRyZW4ubWFwKChuOiBhbnkpID0+IGJ1aWxkVHJlZShuLnV1aWQpKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHRyZWVzIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFBlcmZvcm1hbmNlU3RhdHMoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0czogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktcGVyZm9ybWFuY2UnKTtcclxuICAgICAgICAgICAgY29uc3QgcGVyZlN0YXRzOiBQZXJmb3JtYW5jZVN0YXRzID0ge1xyXG4gICAgICAgICAgICAgICAgbm9kZUNvdW50OiBzdGF0cy5ub2RlQ291bnQgPz8gMCxcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudENvdW50OiBzdGF0cy5jb21wb25lbnRDb3VudCA/PyAwLFxyXG4gICAgICAgICAgICAgICAgZHJhd0NhbGxzOiBzdGF0cy5kcmF3Q2FsbHMgPz8gMCxcclxuICAgICAgICAgICAgICAgIHRyaWFuZ2xlczogc3RhdHMudHJpYW5nbGVzID8/IDAsXHJcbiAgICAgICAgICAgICAgICBtZW1vcnk6IHN0YXRzLm1lbW9yeSA/PyB7fVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBwZXJmU3RhdHMgfTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyBtZXNzYWdlOiAnUGVyZm9ybWFuY2Ugc3RhdHMgbm90IGF2YWlsYWJsZSBpbiBlZGl0IG1vZGUnIH0gfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVNjZW5lKG9wdGlvbnM6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgY29uc3QgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXSA9IFtdO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNoZWNrTWlzc2luZ0Fzc2V0cykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRDaGVjazogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2hlY2stbWlzc2luZy1hc3NldHMnKTtcclxuICAgICAgICAgICAgICAgIGlmIChhc3NldENoZWNrPy5taXNzaW5nPy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnYXNzZXRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEZvdW5kICR7YXNzZXRDaGVjay5taXNzaW5nLmxlbmd0aH0gbWlzc2luZyBhc3NldCByZWZlcmVuY2VzYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsczogYXNzZXRDaGVjay5taXNzaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2hlY2tQZXJmb3JtYW5jZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5OiBhbnkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1oaWVyYXJjaHknKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVDb3VudCA9IHRoaXMuY291bnROb2RlcyhoaWVyYXJjaHkuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVDb3VudCA+IDEwMDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdwZXJmb3JtYW5jZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBIaWdoIG5vZGUgY291bnQ6ICR7bm9kZUNvdW50fSBub2RlcyAocmVjb21tZW5kZWQgPCAxMDAwKWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb246ICdDb25zaWRlciB1c2luZyBvYmplY3QgcG9vbGluZyBvciBzY2VuZSBvcHRpbWl6YXRpb24nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0ID0geyB2YWxpZDogaXNzdWVzLmxlbmd0aCA9PT0gMCwgaXNzdWVDb3VudDogaXNzdWVzLmxlbmd0aCwgaXNzdWVzIH07XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb3VudE5vZGVzKG5vZGVzOiBhbnlbXSk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGVzLnJlZHVjZSgoY291bnQsIG5vZGUpID0+IGNvdW50ICsgMSArIChub2RlLmNoaWxkcmVuID8gdGhpcy5jb3VudE5vZGVzKG5vZGUuY2hpbGRyZW4pIDogMCksIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RWRpdG9ySW5mbygpOiBUb29sUmVzcG9uc2Uge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IChFZGl0b3IgYXMgYW55KS52ZXJzaW9ucz8uZWRpdG9yID8/ICdVbmtub3duJyxcclxuICAgICAgICAgICAgICAgICAgICBjb2Nvc1ZlcnNpb246IChFZGl0b3IgYXMgYW55KS52ZXJzaW9ucz8uY29jb3MgPz8gJ1Vua25vd24nLFxyXG4gICAgICAgICAgICAgICAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyY2g6IHByb2Nlc3MuYXJjaCxcclxuICAgICAgICAgICAgICAgICAgICBub2RlVmVyc2lvbjogcHJvY2Vzcy52ZXJzaW9uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcHJvamVjdDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IEVkaXRvci5Qcm9qZWN0Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogRWRpdG9yLlByb2plY3QucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBFZGl0b3IuUHJvamVjdC51dWlkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbWVtb3J5OiBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXHJcbiAgICAgICAgICAgICAgICB1cHRpbWU6IHByb2Nlc3MudXB0aW1lKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kTG9nRmlsZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgICAgICBjb25zdCBjYW5kaWRhdGVzID0gW0VkaXRvci5Qcm9qZWN0Py5wYXRoLCBwcm9jZXNzLmN3ZCgpXS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNhbmRpZGF0ZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgcCA9IHBhdGguam9pbihiYXNlLCAndGVtcCcsICdsb2dzJywgJ3Byb2plY3QubG9nJyk7XHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRQcm9qZWN0TG9ncyhsaW5lczogbnVtYmVyID0gMTAwLCBmaWx0ZXJLZXl3b3JkPzogc3RyaW5nLCBsb2dMZXZlbDogc3RyaW5nID0gJ0FMTCcpOiBUb29sUmVzcG9uc2Uge1xyXG4gICAgICAgIGNvbnN0IGxvZ0ZpbGVQYXRoID0gdGhpcy5maW5kTG9nRmlsZSgpO1xyXG4gICAgICAgIGlmICghbG9nRmlsZVBhdGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnUHJvamVjdCBsb2cgZmlsZSBub3QgZm91bmQgYXQgdGVtcC9sb2dzL3Byb2plY3QubG9nJyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBhbGxMaW5lcyA9IGZzLnJlYWRGaWxlU3luYyhsb2dGaWxlUGF0aCwgJ3V0ZjgnKS5zcGxpdCgnXFxuJykuZmlsdGVyKGwgPT4gbC50cmltKCkpO1xyXG4gICAgICAgICAgICBsZXQgZmlsdGVyZWQgPSBhbGxMaW5lcy5zbGljZSgtbGluZXMpO1xyXG4gICAgICAgICAgICBpZiAobG9nTGV2ZWwgIT09ICdBTEwnKSB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9IGZpbHRlcmVkLmZpbHRlcihsID0+IGwuaW5jbHVkZXMoYFske2xvZ0xldmVsfV1gKSB8fCBsLmluY2x1ZGVzKGxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZmlsdGVyS2V5d29yZCkge1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyZWQgPSBmaWx0ZXJlZC5maWx0ZXIobCA9PiBsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmlsdGVyS2V5d29yZC50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxMaW5lczogYWxsTGluZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZExpbmVzOiBsaW5lcyxcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZExpbmVzOiBmaWx0ZXJlZC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgbG9nTGV2ZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyS2V5d29yZDogZmlsdGVyS2V5d29yZCA/PyBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvZ3M6IGZpbHRlcmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvZ0ZpbGVQYXRoXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRmFpbGVkIHRvIHJlYWQgcHJvamVjdCBsb2dzOiAke2Vyci5tZXNzYWdlfWAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRMb2dGaWxlSW5mbygpOiBUb29sUmVzcG9uc2Uge1xyXG4gICAgICAgIGNvbnN0IGxvZ0ZpbGVQYXRoID0gdGhpcy5maW5kTG9nRmlsZSgpO1xyXG4gICAgICAgIGlmICghbG9nRmlsZVBhdGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnUHJvamVjdCBsb2cgZmlsZSBub3QgZm91bmQgYXQgdGVtcC9sb2dzL3Byb2plY3QubG9nJyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGZzLnN0YXRTeW5jKGxvZ0ZpbGVQYXRoKTtcclxuICAgICAgICAgICAgY29uc3QgbGluZUNvdW50ID0gZnMucmVhZEZpbGVTeW5jKGxvZ0ZpbGVQYXRoLCAndXRmOCcpLnNwbGl0KCdcXG4nKS5maWx0ZXIobCA9PiBsLnRyaW0oKSkubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogbG9nRmlsZVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVNpemU6IHN0YXRzLnNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVNpemVGb3JtYXR0ZWQ6IHRoaXMuZm9ybWF0RmlsZVNpemUoc3RhdHMuc2l6ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdE1vZGlmaWVkOiBzdGF0cy5tdGltZS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVDb3VudCxcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkOiBzdGF0cy5iaXJ0aHRpbWUudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYEZhaWxlZCB0byBnZXQgbG9nIGZpbGUgaW5mbzogJHtlcnIubWVzc2FnZX1gIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2VhcmNoUHJvamVjdExvZ3MocGF0dGVybjogc3RyaW5nLCBtYXhSZXN1bHRzOiBudW1iZXIgPSAyMCwgY29udGV4dExpbmVzOiBudW1iZXIgPSAyKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICBjb25zdCBsb2dGaWxlUGF0aCA9IHRoaXMuZmluZExvZ0ZpbGUoKTtcclxuICAgICAgICBpZiAoIWxvZ0ZpbGVQYXRoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Byb2plY3QgbG9nIGZpbGUgbm90IGZvdW5kIGF0IHRlbXAvbG9ncy9wcm9qZWN0LmxvZycgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgbG9nTGluZXMgPSBmcy5yZWFkRmlsZVN5bmMobG9nRmlsZVBhdGgsICd1dGY4Jykuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICBsZXQgcmVnZXg6IFJlZ0V4cDtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCAnZ2knKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgICByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybi5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpLCAnZ2knKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlczogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2dMaW5lcy5sZW5ndGggJiYgbWF0Y2hlcy5sZW5ndGggPCBtYXhSZXN1bHRzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJlZ2V4Lmxhc3RJbmRleCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXJlZ2V4LnRlc3QobG9nTGluZXNbaV0pKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgaSAtIGNvbnRleHRMaW5lcyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBNYXRoLm1pbihsb2dMaW5lcy5sZW5ndGggLSAxLCBpICsgY29udGV4dExpbmVzKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogaSArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZExpbmU6IGxvZ0xpbmVzW2ldLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IEFycmF5LmZyb20oeyBsZW5ndGg6IGVuZCAtIHN0YXJ0ICsgMSB9LCAoXywgaikgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogc3RhcnQgKyBqICsgMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogbG9nTGluZXNbc3RhcnQgKyBqXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaDogc3RhcnQgKyBqID09PSBpXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgcGF0dGVybiwgdG90YWxNYXRjaGVzOiBtYXRjaGVzLmxlbmd0aCwgbWF4UmVzdWx0cywgY29udGV4dExpbmVzLCBsb2dGaWxlUGF0aCwgbWF0Y2hlcyB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRmFpbGVkIHRvIHNlYXJjaCBwcm9qZWN0IGxvZ3M6ICR7ZXJyLm1lc3NhZ2V9YCB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcm1hdEZpbGVTaXplKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJ107XHJcbiAgICAgICAgbGV0IHNpemUgPSBieXRlcztcclxuICAgICAgICBsZXQgdW5pdEluZGV4ID0gMDtcclxuICAgICAgICB3aGlsZSAoc2l6ZSA+PSAxMDI0ICYmIHVuaXRJbmRleCA8IHVuaXRzLmxlbmd0aCAtIDEpIHsgc2l6ZSAvPSAxMDI0OyB1bml0SW5kZXgrKzsgfVxyXG4gICAgICAgIHJldHVybiBgJHtzaXplLnRvRml4ZWQoMil9ICR7dW5pdHNbdW5pdEluZGV4XX1gO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==