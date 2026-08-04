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
exports.MCPServer = void 0;
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const scene_tools_1 = require("./tools/scene-tools");
const node_tools_1 = require("./tools/node-tools");
const component_tools_1 = require("./tools/component-tools");
const prefab_tools_1 = require("./tools/prefab-tools");
const project_tools_1 = require("./tools/project-tools");
const debug_tools_1 = require("./tools/debug-tools");
const preferences_tools_1 = require("./tools/preferences-tools");
const server_tools_1 = require("./tools/server-tools");
const broadcast_tools_1 = require("./tools/broadcast-tools");
const scene_advanced_tools_1 = require("./tools/scene-advanced-tools");
const scene_view_tools_1 = require("./tools/scene-view-tools");
const reference_image_tools_1 = require("./tools/reference-image-tools");
const asset_advanced_tools_1 = require("./tools/asset-advanced-tools");
const validation_tools_1 = require("./tools/validation-tools");
class MCPServer {
    constructor(settings) {
        this.httpServer = null;
        this.tools = {};
        this.toolsList = [];
        this.enabledTools = [];
        this.settings = settings;
        this.initializeTools();
    }
    initializeTools() {
        try {
            this.tools.scene = new scene_tools_1.SceneTools();
            this.tools.node = new node_tools_1.NodeTools();
            this.tools.component = new component_tools_1.ComponentTools();
            this.tools.prefab = new prefab_tools_1.PrefabTools();
            this.tools.project = new project_tools_1.ProjectTools();
            this.tools.debug = new debug_tools_1.DebugTools();
            this.tools.preferences = new preferences_tools_1.PreferencesTools();
            this.tools.server = new server_tools_1.ServerTools();
            this.tools.broadcast = new broadcast_tools_1.BroadcastTools();
            this.tools.sceneAdvanced = new scene_advanced_tools_1.SceneAdvancedTools();
            this.tools.sceneView = new scene_view_tools_1.SceneViewTools();
            this.tools.referenceImage = new reference_image_tools_1.ReferenceImageTools();
            this.tools.assetAdvanced = new asset_advanced_tools_1.AssetAdvancedTools();
            this.tools.validation = new validation_tools_1.ValidationTools();
        }
        catch (error) {
            console.error('[MCPServer] Failed to initialize tools:', error);
            throw error;
        }
    }
    async start() {
        if (this.httpServer) {
            return;
        }
        try {
            this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
            await new Promise((resolve, reject) => {
                this.httpServer.listen(this.settings.port, '127.0.0.1', () => {
                    console.log(`[MCPServer] Started on http://127.0.0.1:${this.settings.port}`);
                    resolve();
                });
                this.httpServer.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.error(`[MCPServer] Port ${this.settings.port} is already in use`);
                    }
                    reject(err);
                });
            });
            this.rebuildToolsList();
        }
        catch (error) {
            this.httpServer = null;
            throw error;
        }
    }
    stop() {
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
            console.log('[MCPServer] Stopped');
        }
    }
    getStatus() {
        return {
            running: !!this.httpServer,
            port: this.settings.port,
            clients: 0
        };
    }
    getSettings() {
        return this.settings;
    }
    getAvailableTools() {
        return this.toolsList;
    }
    getFilteredTools(enabledTools) {
        if (!enabledTools || enabledTools.length === 0) {
            return this.toolsList;
        }
        const enabledSet = new Set(enabledTools.map(t => `${t.category}_${t.name}`));
        return this.toolsList.filter(tool => enabledSet.has(tool.name));
    }
    updateEnabledTools(enabledTools) {
        this.enabledTools = enabledTools;
        this.rebuildToolsList();
    }
    async executeToolCall(toolName, args) {
        // Tool names are structured as "{category}_{toolMethodName}".
        // We split on the first underscore only to get the category key,
        // then rejoin the rest as the method name (method names may contain underscores).
        const underscoreIdx = toolName.indexOf('_');
        if (underscoreIdx === -1) {
            throw new Error(`Invalid tool name format: ${toolName}`);
        }
        const category = toolName.substring(0, underscoreIdx);
        const methodName = toolName.substring(underscoreIdx + 1);
        if (!this.tools[category]) {
            throw new Error(`Unknown tool category: ${category}`);
        }
        return await this.tools[category].execute(methodName, args);
    }
    rebuildToolsList() {
        const enabledSet = this.enabledTools.length > 0
            ? new Set(this.enabledTools.map(t => `${t.category}_${t.name}`))
            : null;
        this.toolsList = [];
        for (const [category, toolSet] of Object.entries(this.tools)) {
            for (const tool of toolSet.getTools()) {
                const qualifiedName = `${category}_${tool.name}`;
                if (!enabledSet || enabledSet.has(qualifiedName)) {
                    this.toolsList.push({
                        name: qualifiedName,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    });
                }
            }
        }
    }
    async readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    async handleHttpRequest(req, res) {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        try {
            if (pathname === '/mcp' && req.method === 'POST') {
                await this.handleMCPRequest(req, res);
            }
            else if (pathname === '/health' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok', tools: this.toolsList.length }));
            }
            else if (pathname === '/api/tools' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ tools: this.getSimplifiedToolsList() }));
            }
            else if ((pathname === null || pathname === void 0 ? void 0 : pathname.startsWith('/api/')) && req.method === 'POST') {
                await this.handleSimpleAPIRequest(req, res, pathname);
            }
            else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        }
        catch (error) {
            console.error('[MCPServer] Unhandled request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    async handleMCPRequest(req, res) {
        const body = await this.readRequestBody(req);
        let message;
        try {
            message = JSON.parse(body);
        }
        catch (parseError) {
            res.writeHead(400);
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: `Parse error: ${parseError.message}` }
            }));
            return;
        }
        const response = await this.handleMessage(message);
        res.writeHead(200);
        res.end(JSON.stringify(response));
    }
    async handleMessage(message) {
        const { id, method, params } = message;
        try {
            let result;
            switch (method) {
                case 'initialize':
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: { tools: {} },
                        serverInfo: { name: 'cocos-mcp-server', version: '1.0.0' }
                    };
                    break;
                case 'tools/list':
                    result = { tools: this.getAvailableTools() };
                    break;
                case 'tools/call': {
                    const { name, arguments: args } = params;
                    const toolResult = await this.executeToolCall(name, args);
                    result = { content: [{ type: 'text', text: JSON.stringify(toolResult) }] };
                    break;
                }
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
            return { jsonrpc: '2.0', id, result };
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32603, message: error.message }
            };
        }
    }
    async handleSimpleAPIRequest(req, res, pathname) {
        const body = await this.readRequestBody(req);
        const pathParts = pathname.split('/').filter(p => p);
        if (pathParts.length < 3) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid API path. Use /api/{category}/{tool_name}' }));
            return;
        }
        const category = pathParts[1];
        const toolName = pathParts[2];
        const fullToolName = `${category}_${toolName}`;
        let params;
        try {
            params = body ? JSON.parse(body) : {};
        }
        catch (parseError) {
            res.writeHead(400);
            res.end(JSON.stringify({
                error: 'Invalid JSON in request body',
                details: parseError.message
            }));
            return;
        }
        try {
            const result = await this.executeToolCall(fullToolName, params);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, tool: fullToolName, result }));
        }
        catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: error.message, tool: fullToolName }));
        }
    }
    getSimplifiedToolsList() {
        return this.toolsList.map(tool => {
            const underscoreIdx = tool.name.indexOf('_');
            const category = tool.name.substring(0, underscoreIdx);
            const toolName = tool.name.substring(underscoreIdx + 1);
            return {
                name: tool.name,
                category,
                toolName,
                description: tool.description,
                apiPath: `/api/${category}/${toolName}`,
                curlExample: this.generateCurlExample(category, toolName, tool.inputSchema)
            };
        });
    }
    generateCurlExample(category, toolName, schema) {
        const sampleParams = this.generateSampleParams(schema);
        const jsonString = JSON.stringify(sampleParams, null, 2);
        return `curl -X POST http://127.0.0.1:${this.settings.port}/api/${category}/${toolName} \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonString}'`;
    }
    generateSampleParams(schema) {
        var _a, _b, _c, _d;
        if (!schema || !schema.properties)
            return {};
        const sample = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            switch (prop.type) {
                case 'string':
                    sample[key] = (_a = prop.default) !== null && _a !== void 0 ? _a : 'example_string';
                    break;
                case 'number':
                    sample[key] = (_b = prop.default) !== null && _b !== void 0 ? _b : 0;
                    break;
                case 'boolean':
                    sample[key] = (_c = prop.default) !== null && _c !== void 0 ? _c : true;
                    break;
                case 'object':
                    sample[key] = (_d = prop.default) !== null && _d !== void 0 ? _d : { x: 0, y: 0, z: 0 };
                    break;
                default: sample[key] = 'example_value';
            }
        }
        return sample;
    }
}
exports.MCPServer = MCPServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QjtBQUM3Qix5Q0FBMkI7QUFFM0IscURBQWlEO0FBQ2pELG1EQUErQztBQUMvQyw2REFBeUQ7QUFDekQsdURBQW1EO0FBQ25ELHlEQUFxRDtBQUNyRCxxREFBaUQ7QUFDakQsaUVBQTZEO0FBQzdELHVEQUFtRDtBQUNuRCw2REFBeUQ7QUFDekQsdUVBQWtFO0FBQ2xFLCtEQUEwRDtBQUMxRCx5RUFBb0U7QUFDcEUsdUVBQWtFO0FBQ2xFLCtEQUEyRDtBQUUzRCxNQUFhLFNBQVM7SUFPbEIsWUFBWSxRQUEyQjtRQUwvQixlQUFVLEdBQXVCLElBQUksQ0FBQztRQUN0QyxVQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUNoQyxjQUFTLEdBQXFCLEVBQUUsQ0FBQztRQUNqQyxpQkFBWSxHQUFVLEVBQUUsQ0FBQztRQUc3QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVPLGVBQWU7UUFDbkIsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSx3QkFBVSxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxzQkFBUyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxnQ0FBYyxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSwwQkFBVyxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSw0QkFBWSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFD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RUFBRSxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFpQyxDQUFDLEVBQUUsQ0FBQztZQUNqRixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEIsS0FBSyxRQUFRO29CQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLGdCQUFnQixDQUFDO29CQUFDLE1BQU07Z0JBQ3RFLEtBQUssUUFBUTtvQkFBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkQsS0FBSyxTQUFTO29CQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLElBQUksQ0FBQztvQkFBQyxNQUFNO2dCQUMxRCxLQUFLLFFBQVE7b0JBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQUEsSUFBSSxDQUFDLE9BQU8sbUNBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUFDLE1BQU07Z0JBQzFFLE9BQU8sQ0FBQyxDQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLENBQUM7WUFDbEQsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQ0o7QUFwVEQsOEJBb1RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcclxuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XHJcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzLCBTZXJ2ZXJTdGF0dXMsIFRvb2xEZWZpbml0aW9uIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IFNjZW5lVG9vbHMgfSBmcm9tICcuL3Rvb2xzL3NjZW5lLXRvb2xzJztcclxuaW1wb3J0IHsgTm9kZVRvb2xzIH0gZnJvbSAnLi90b29scy9ub2RlLXRvb2xzJztcclxuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL3Rvb2xzL2NvbXBvbmVudC10b29scyc7XHJcbmltcG9ydCB7IFByZWZhYlRvb2xzIH0gZnJvbSAnLi90b29scy9wcmVmYWItdG9vbHMnO1xyXG5pbXBvcnQgeyBQcm9qZWN0VG9vbHMgfSBmcm9tICcuL3Rvb2xzL3Byb2plY3QtdG9vbHMnO1xyXG5pbXBvcnQgeyBEZWJ1Z1Rvb2xzIH0gZnJvbSAnLi90b29scy9kZWJ1Zy10b29scyc7XHJcbmltcG9ydCB7IFByZWZlcmVuY2VzVG9vbHMgfSBmcm9tICcuL3Rvb2xzL3ByZWZlcmVuY2VzLXRvb2xzJztcclxuaW1wb3J0IHsgU2VydmVyVG9vbHMgfSBmcm9tICcuL3Rvb2xzL3NlcnZlci10b29scyc7XHJcbmltcG9ydCB7IEJyb2FkY2FzdFRvb2xzIH0gZnJvbSAnLi90b29scy9icm9hZGNhc3QtdG9vbHMnO1xyXG5pbXBvcnQgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3Rvb2xzL3NjZW5lLWFkdmFuY2VkLXRvb2xzJztcclxuaW1wb3J0IHsgU2NlbmVWaWV3VG9vbHMgfSBmcm9tICcuL3Rvb2xzL3NjZW5lLXZpZXctdG9vbHMnO1xyXG5pbXBvcnQgeyBSZWZlcmVuY2VJbWFnZVRvb2xzIH0gZnJvbSAnLi90b29scy9yZWZlcmVuY2UtaW1hZ2UtdG9vbHMnO1xyXG5pbXBvcnQgeyBBc3NldEFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3Rvb2xzL2Fzc2V0LWFkdmFuY2VkLXRvb2xzJztcclxuaW1wb3J0IHsgVmFsaWRhdGlvblRvb2xzIH0gZnJvbSAnLi90b29scy92YWxpZGF0aW9uLXRvb2xzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBNQ1BTZXJ2ZXIge1xyXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3M7XHJcbiAgICBwcml2YXRlIGh0dHBTZXJ2ZXI6IGh0dHAuU2VydmVyIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwcml2YXRlIHRvb2xzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XHJcbiAgICBwcml2YXRlIHRvb2xzTGlzdDogVG9vbERlZmluaXRpb25bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBlbmFibGVkVG9vbHM6IGFueVtdID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2V0dGluZ3M6IE1DUFNlcnZlclNldHRpbmdzKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZVRvb2xzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplVG9vbHMoKTogdm9pZCB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy50b29scy5zY2VuZSA9IG5ldyBTY2VuZVRvb2xzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbHMubm9kZSA9IG5ldyBOb2RlVG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5jb21wb25lbnQgPSBuZXcgQ29tcG9uZW50VG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5wcmVmYWIgPSBuZXcgUHJlZmFiVG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5wcm9qZWN0ID0gbmV3IFByb2plY3RUb29scygpO1xyXG4gICAgICAgICAgICB0aGlzLnRvb2xzLmRlYnVnID0gbmV3IERlYnVnVG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5wcmVmZXJlbmNlcyA9IG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbHMuc2VydmVyID0gbmV3IFNlcnZlclRvb2xzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbHMuYnJvYWRjYXN0ID0gbmV3IEJyb2FkY2FzdFRvb2xzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbHMuc2NlbmVBZHZhbmNlZCA9IG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5zY2VuZVZpZXcgPSBuZXcgU2NlbmVWaWV3VG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy5yZWZlcmVuY2VJbWFnZSA9IG5ldyBSZWZlcmVuY2VJbWFnZVRvb2xzKCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbHMuYXNzZXRBZHZhbmNlZCA9IG5ldyBBc3NldEFkdmFuY2VkVG9vbHMoKTtcclxuICAgICAgICAgICAgdGhpcy50b29scy52YWxpZGF0aW9uID0gbmV3IFZhbGlkYXRpb25Ub29scygpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1BTZXJ2ZXJdIEZhaWxlZCB0byBpbml0aWFsaXplIHRvb2xzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhc3luYyBzdGFydCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5odHRwU2VydmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuaHR0cFNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKHRoaXMuaGFuZGxlSHR0cFJlcXVlc3QuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmh0dHBTZXJ2ZXIhLmxpc3Rlbih0aGlzLnNldHRpbmdzLnBvcnQsICcxMjcuMC4wLjEnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFN0YXJ0ZWQgb24gaHR0cDovLzEyNy4wLjAuMToke3RoaXMuc2V0dGluZ3MucG9ydH1gKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaHR0cFNlcnZlciEub24oJ2Vycm9yJywgKGVycjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUFERFJJTlVTRScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW01DUFNlcnZlcl0gUG9ydCAke3RoaXMuc2V0dGluZ3MucG9ydH0gaXMgYWxyZWFkeSBpbiB1c2VgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlYnVpbGRUb29sc0xpc3QoKTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLmh0dHBTZXJ2ZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0b3AoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaHR0cFNlcnZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmh0dHBTZXJ2ZXIuY2xvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5odHRwU2VydmVyID0gbnVsbDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1BTZXJ2ZXJdIFN0b3BwZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFN0YXR1cygpOiBTZXJ2ZXJTdGF0dXMge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJ1bm5pbmc6ICEhdGhpcy5odHRwU2VydmVyLFxyXG4gICAgICAgICAgICBwb3J0OiB0aGlzLnNldHRpbmdzLnBvcnQsXHJcbiAgICAgICAgICAgIGNsaWVudHM6IDBcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTZXR0aW5ncygpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF2YWlsYWJsZVRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRvb2xzTGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyZWRUb29scyhlbmFibGVkVG9vbHM6IGFueVtdKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgaWYgKCFlbmFibGVkVG9vbHMgfHwgZW5hYmxlZFRvb2xzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b29sc0xpc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGVuYWJsZWRTZXQgPSBuZXcgU2V0KGVuYWJsZWRUb29scy5tYXAodCA9PiBgJHt0LmNhdGVnb3J5fV8ke3QubmFtZX1gKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9vbHNMaXN0LmZpbHRlcih0b29sID0+IGVuYWJsZWRTZXQuaGFzKHRvb2wubmFtZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzOiBhbnlbXSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZFRvb2xzID0gZW5hYmxlZFRvb2xzO1xyXG4gICAgICAgIHRoaXMucmVidWlsZFRvb2xzTGlzdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhc3luYyBleGVjdXRlVG9vbENhbGwodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICAvLyBUb29sIG5hbWVzIGFyZSBzdHJ1Y3R1cmVkIGFzIFwie2NhdGVnb3J5fV97dG9vbE1ldGhvZE5hbWV9XCIuXHJcbiAgICAgICAgLy8gV2Ugc3BsaXQgb24gdGhlIGZpcnN0IHVuZGVyc2NvcmUgb25seSB0byBnZXQgdGhlIGNhdGVnb3J5IGtleSxcclxuICAgICAgICAvLyB0aGVuIHJlam9pbiB0aGUgcmVzdCBhcyB0aGUgbWV0aG9kIG5hbWUgKG1ldGhvZCBuYW1lcyBtYXkgY29udGFpbiB1bmRlcnNjb3JlcykuXHJcbiAgICAgICAgY29uc3QgdW5kZXJzY29yZUlkeCA9IHRvb2xOYW1lLmluZGV4T2YoJ18nKTtcclxuICAgICAgICBpZiAodW5kZXJzY29yZUlkeCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHRvb2wgbmFtZSBmb3JtYXQ6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdG9vbE5hbWUuc3Vic3RyaW5nKDAsIHVuZGVyc2NvcmVJZHgpO1xyXG4gICAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSB0b29sTmFtZS5zdWJzdHJpbmcodW5kZXJzY29yZUlkeCArIDEpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMudG9vbHNbY2F0ZWdvcnldKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sIGNhdGVnb3J5OiAke2NhdGVnb3J5fWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50b29sc1tjYXRlZ29yeV0uZXhlY3V0ZShtZXRob2ROYW1lLCBhcmdzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlYnVpbGRUb29sc0xpc3QoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZW5hYmxlZFNldCA9IHRoaXMuZW5hYmxlZFRvb2xzLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgPyBuZXcgU2V0KHRoaXMuZW5hYmxlZFRvb2xzLm1hcCh0ID0+IGAke3QuY2F0ZWdvcnl9XyR7dC5uYW1lfWApKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMudG9vbHNMaXN0ID0gW107XHJcbiAgICAgICAgZm9yIChjb25zdCBbY2F0ZWdvcnksIHRvb2xTZXRdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMudG9vbHMpKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdG9vbCBvZiB0b29sU2V0LmdldFRvb2xzKCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHF1YWxpZmllZE5hbWUgPSBgJHtjYXRlZ29yeX1fJHt0b29sLm5hbWV9YDtcclxuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZFNldCB8fCBlbmFibGVkU2V0LmhhcyhxdWFsaWZpZWROYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9vbHNMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBxdWFsaWZpZWROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdG9vbC5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHRvb2wuaW5wdXRTY2hlbWFcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlYWRSZXF1ZXN0Qm9keShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG4gICAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTsgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4gcmVzb2x2ZShib2R5KSk7XHJcbiAgICAgICAgICAgIHJlcS5vbignZXJyb3InLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlSHR0cFJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHJlcS51cmwgfHwgJycsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IHBhdGhuYW1lID0gcGFyc2VkVXJsLnBhdGhuYW1lO1xyXG5cclxuICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnR0VULCBQT1NULCBPUFRJT05TJyk7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb24nKTtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG5cclxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09ICcvbWNwJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlTUNQUmVxdWVzdChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWUgPT09ICcvaGVhbHRoJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogJ29rJywgdG9vbHM6IHRoaXMudG9vbHNMaXN0Lmxlbmd0aCB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWUgPT09ICcvYXBpL3Rvb2xzJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHRvb2xzOiB0aGlzLmdldFNpbXBsaWZpZWRUb29sc0xpc3QoKSB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWU/LnN0YXJ0c1dpdGgoJy9hcGkvJykgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZVNpbXBsZUFQSVJlcXVlc3QocmVxLCByZXMsIHBhdGhuYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA0KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vdCBmb3VuZCcgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUFNlcnZlcl0gVW5oYW5kbGVkIHJlcXVlc3QgZXJyb3I6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU1DUFJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHRoaXMucmVhZFJlcXVlc3RCb2R5KHJlcSk7XHJcbiAgICAgICAgbGV0IG1lc3NhZ2U6IGFueTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDApO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxyXG4gICAgICAgICAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI3MDAsIG1lc3NhZ2U6IGBQYXJzZSBlcnJvcjogJHtwYXJzZUVycm9yLm1lc3NhZ2V9YCB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU1lc3NhZ2UobWVzc2FnZTogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBjb25zdCB7IGlkLCBtZXRob2QsIHBhcmFtcyB9ID0gbWVzc2FnZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0OiBhbnk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobWV0aG9kKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbml0aWFsaXplJzpcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvY29sVmVyc2lvbjogJzIwMjQtMTEtMDUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHsgdG9vbHM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckluZm86IHsgbmFtZTogJ2NvY29zLW1jcC1zZXJ2ZXInLCB2ZXJzaW9uOiAnMS4wLjAnIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndG9vbHMvbGlzdCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyB0b29sczogdGhpcy5nZXRBdmFpbGFibGVUb29scygpIH07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0b29scy9jYWxsJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgbmFtZSwgYXJndW1lbnRzOiBhcmdzIH0gPSBwYXJhbXM7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9vbFJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZVRvb2xDYWxsKG5hbWUsIGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgY29udGVudDogW3sgdHlwZTogJ3RleHQnLCB0ZXh0OiBKU09OLnN0cmluZ2lmeSh0b29sUmVzdWx0KSB9XSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gbWV0aG9kOiAke21ldGhvZH1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyBqc29ucnBjOiAnMi4wJywgaWQsIHJlc3VsdCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxyXG4gICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDMsIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVNpbXBsZUFQSVJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBwYXRobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHRoaXMucmVhZFJlcXVlc3RCb2R5KHJlcSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKHAgPT4gcCk7XHJcbiAgICAgICAgaWYgKHBhdGhQYXJ0cy5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwKTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBBUEkgcGF0aC4gVXNlIC9hcGkve2NhdGVnb3J5fS97dG9vbF9uYW1lfScgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHBhdGhQYXJ0c1sxXTtcclxuICAgICAgICBjb25zdCB0b29sTmFtZSA9IHBhdGhQYXJ0c1syXTtcclxuICAgICAgICBjb25zdCBmdWxsVG9vbE5hbWUgPSBgJHtjYXRlZ29yeX1fJHt0b29sTmFtZX1gO1xyXG5cclxuICAgICAgICBsZXQgcGFyYW1zOiBhbnk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcGFyYW1zID0gYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fTtcclxuICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDApO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGVycm9yOiAnSW52YWxpZCBKU09OIGluIHJlcXVlc3QgYm9keScsXHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBwYXJzZUVycm9yLm1lc3NhZ2VcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVUb29sQ2FsbChmdWxsVG9vbE5hbWUsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHRvb2w6IGZ1bGxUb29sTmFtZSwgcmVzdWx0IH0pKTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSwgdG9vbDogZnVsbFRvb2xOYW1lIH0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRTaW1wbGlmaWVkVG9vbHNMaXN0KCk6IGFueVtdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50b29sc0xpc3QubWFwKHRvb2wgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB1bmRlcnNjb3JlSWR4ID0gdG9vbC5uYW1lLmluZGV4T2YoJ18nKTtcclxuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0b29sLm5hbWUuc3Vic3RyaW5nKDAsIHVuZGVyc2NvcmVJZHgpO1xyXG4gICAgICAgICAgICBjb25zdCB0b29sTmFtZSA9IHRvb2wubmFtZS5zdWJzdHJpbmcodW5kZXJzY29yZUlkeCArIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICB0b29sTmFtZSxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0b29sLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgYXBpUGF0aDogYC9hcGkvJHtjYXRlZ29yeX0vJHt0b29sTmFtZX1gLFxyXG4gICAgICAgICAgICAgICAgY3VybEV4YW1wbGU6IHRoaXMuZ2VuZXJhdGVDdXJsRXhhbXBsZShjYXRlZ29yeSwgdG9vbE5hbWUsIHRvb2wuaW5wdXRTY2hlbWEpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUN1cmxFeGFtcGxlKGNhdGVnb3J5OiBzdHJpbmcsIHRvb2xOYW1lOiBzdHJpbmcsIHNjaGVtYTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBzYW1wbGVQYXJhbXMgPSB0aGlzLmdlbmVyYXRlU2FtcGxlUGFyYW1zKHNjaGVtYSk7XHJcbiAgICAgICAgY29uc3QganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNhbXBsZVBhcmFtcywgbnVsbCwgMik7XHJcbiAgICAgICAgcmV0dXJuIGBjdXJsIC1YIFBPU1QgaHR0cDovLzEyNy4wLjAuMToke3RoaXMuc2V0dGluZ3MucG9ydH0vYXBpLyR7Y2F0ZWdvcnl9LyR7dG9vbE5hbWV9IFxcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxcbiAgLWQgJyR7anNvblN0cmluZ30nYDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdlbmVyYXRlU2FtcGxlUGFyYW1zKHNjaGVtYTogYW55KTogYW55IHtcclxuICAgICAgICBpZiAoIXNjaGVtYSB8fCAhc2NoZW1hLnByb3BlcnRpZXMpIHJldHVybiB7fTtcclxuICAgICAgICBjb25zdCBzYW1wbGU6IGFueSA9IHt9O1xyXG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgcHJvcF0gb2YgT2JqZWN0LmVudHJpZXMoc2NoZW1hLnByb3BlcnRpZXMgYXMgUmVjb3JkPHN0cmluZywgYW55PikpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChwcm9wLnR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6ICBzYW1wbGVba2V5XSA9IHByb3AuZGVmYXVsdCA/PyAnZXhhbXBsZV9zdHJpbmcnOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6ICBzYW1wbGVba2V5XSA9IHByb3AuZGVmYXVsdCA/PyAwOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOiBzYW1wbGVba2V5XSA9IHByb3AuZGVmYXVsdCA/PyB0cnVlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6ICBzYW1wbGVba2V5XSA9IHByb3AuZGVmYXVsdCA/PyB7IHg6IDAsIHk6IDAsIHo6IDAgfTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgc2FtcGxlW2tleV0gPSAnZXhhbXBsZV92YWx1ZSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNhbXBsZTtcclxuICAgIH1cclxufVxyXG4iXX0=