"use strict";
/* eslint-disable vue/one-component-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const panelDataMap = new WeakMap();
const CATEGORY_DISPLAY_NAMES = {
    scene: 'Scene Tools',
    node: 'Node Tools',
    component: 'Component Tools',
    prefab: 'Prefab Tools',
    project: 'Project Tools',
    debug: 'Debug Tools',
    preferences: 'Preferences Tools',
    server: 'Server Tools',
    broadcast: 'Broadcast Tools',
    sceneAdvanced: 'Advanced Scene Tools',
    sceneView: 'Scene View Tools',
    referenceImage: 'Reference Image Tools',
    assetAdvanced: 'Advanced Asset Tools',
    validation: 'Validation Tools'
};
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (!this.$.app)
            return;
        const app = (0, vue_1.createApp)({});
        app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
        app.component('McpServerApp', (0, vue_1.defineComponent)({
            setup() {
                const activeTab = (0, vue_1.ref)('server');
                const serverRunning = (0, vue_1.ref)(false);
                const serverStatusText = (0, vue_1.ref)('Stopped');
                const connectedClients = (0, vue_1.ref)(0);
                const httpUrl = (0, vue_1.ref)('');
                const isProcessing = (0, vue_1.ref)(false);
                const settingsChanged = (0, vue_1.ref)(false);
                const settings = (0, vue_1.ref)({
                    port: 3000,
                    autoStart: false,
                    debugLog: false,
                    maxConnections: 10
                });
                const availableTools = (0, vue_1.ref)([]);
                const toolCategories = (0, vue_1.ref)([]);
                const statusClass = (0, vue_1.computed)(() => ({
                    'status-running': serverRunning.value,
                    'status-stopped': !serverRunning.value
                }));
                const totalTools = (0, vue_1.computed)(() => availableTools.value.length);
                const enabledToolCount = (0, vue_1.computed)(() => availableTools.value.filter(t => t.enabled).length);
                const disabledToolCount = (0, vue_1.computed)(() => totalTools.value - enabledToolCount.value);
                const switchTab = (tabName) => {
                    activeTab.value = tabName;
                    if (tabName === 'tools') {
                        loadToolManagerState();
                    }
                };
                const toggleServer = async () => {
                    try {
                        if (serverRunning.value) {
                            await Editor.Message.request('cocos-mcp-server', 'stop-server');
                        }
                        else {
                            const currentSettings = {
                                port: settings.value.port,
                                autoStart: settings.value.autoStart,
                                enableDebugLog: settings.value.debugLog,
                                maxConnections: settings.value.maxConnections
                            };
                            await Editor.Message.request('cocos-mcp-server', 'update-settings', currentSettings);
                            await Editor.Message.request('cocos-mcp-server', 'start-server');
                        }
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to toggle server:', error);
                    }
                };
                const saveSettings = async () => {
                    try {
                        const settingsData = {
                            port: settings.value.port,
                            autoStart: settings.value.autoStart,
                            enableDebugLog: settings.value.debugLog,
                            maxConnections: settings.value.maxConnections
                        };
                        await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                        settingsChanged.value = false;
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to save settings:', error);
                    }
                };
                const copyUrl = async () => {
                    try {
                        await navigator.clipboard.writeText(httpUrl.value);
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to copy URL:', error);
                    }
                };
                const loadToolManagerState = async () => {
                    var _a;
                    try {
                        const result = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
                        if (result === null || result === void 0 ? void 0 : result.success) {
                            availableTools.value = (_a = result.availableTools) !== null && _a !== void 0 ? _a : [];
                            const categories = new Set(availableTools.value.map(t => t.category));
                            toolCategories.value = Array.from(categories);
                        }
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to load tool manager state:', error);
                    }
                };
                const updateToolStatus = async (category, name, enabled) => {
                    // Optimistic update
                    const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                    if (toolIndex !== -1) {
                        availableTools.value[toolIndex].enabled = enabled;
                        availableTools.value = [...availableTools.value];
                    }
                    try {
                        const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', category, name, enabled);
                        if (!(result === null || result === void 0 ? void 0 : result.success) && toolIndex !== -1) {
                            // Roll back on failure
                            availableTools.value[toolIndex].enabled = !enabled;
                            availableTools.value = [...availableTools.value];
                        }
                    }
                    catch (error) {
                        // Roll back on error
                        if (toolIndex !== -1) {
                            availableTools.value[toolIndex].enabled = !enabled;
                            availableTools.value = [...availableTools.value];
                        }
                        console.error('[MCP Panel] Failed to update tool status:', error);
                    }
                };
                const saveChanges = async () => {
                    try {
                        const updates = availableTools.value.map(tool => ({
                            category: String(tool.category),
                            name: String(tool.name),
                            enabled: Boolean(tool.enabled)
                        }));
                        await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', updates);
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to save tool changes:', error);
                    }
                };
                const selectAllTools = async () => {
                    availableTools.value.forEach(t => { t.enabled = true; });
                    await saveChanges();
                };
                const deselectAllTools = async () => {
                    availableTools.value.forEach(t => { t.enabled = false; });
                    await saveChanges();
                };
                const toggleCategoryTools = async (category, enabled) => {
                    availableTools.value.forEach(t => {
                        if (t.category === category)
                            t.enabled = enabled;
                    });
                    await saveChanges();
                };
                const getToolsByCategory = (category) => {
                    return availableTools.value.filter(t => t.category === category);
                };
                const getCategoryDisplayName = (category) => {
                    var _a;
                    return (_a = CATEGORY_DISPLAY_NAMES[category]) !== null && _a !== void 0 ? _a : category;
                };
                (0, vue_1.watch)(settings, () => { settingsChanged.value = true; }, { deep: true });
                (0, vue_1.onMounted)(async () => {
                    var _a, _b, _c, _d;
                    await loadToolManagerState();
                    try {
                        const status = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                        if (status === null || status === void 0 ? void 0 : status.settings) {
                            settings.value = {
                                port: (_a = status.settings.port) !== null && _a !== void 0 ? _a : 3000,
                                autoStart: (_b = status.settings.autoStart) !== null && _b !== void 0 ? _b : false,
                                debugLog: (_c = status.settings.enableDebugLog) !== null && _c !== void 0 ? _c : false,
                                maxConnections: (_d = status.settings.maxConnections) !== null && _d !== void 0 ? _d : 10
                            };
                        }
                    }
                    catch (error) {
                        console.error('[MCP Panel] Failed to load server settings:', error);
                    }
                    setInterval(async () => {
                        var _a;
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                            if (result) {
                                serverRunning.value = result.running;
                                serverStatusText.value = result.running ? 'Running' : 'Stopped';
                                connectedClients.value = (_a = result.clients) !== null && _a !== void 0 ? _a : 0;
                                httpUrl.value = result.running ? `http://localhost:${result.port}` : '';
                                isProcessing.value = false;
                            }
                        }
                        catch (error) {
                            console.error('[MCP Panel] Failed to poll server status:', error);
                        }
                    }, 2000);
                });
                return {
                    activeTab,
                    serverRunning,
                    serverStatusText,
                    connectedClients,
                    httpUrl,
                    isProcessing,
                    settings,
                    availableTools,
                    toolCategories,
                    settingsChanged,
                    statusClass,
                    totalTools,
                    enabledToolCount,
                    disabledToolCount,
                    switchTab,
                    toggleServer,
                    saveSettings,
                    copyUrl,
                    loadToolManagerState,
                    updateToolStatus,
                    selectAllTools,
                    deselectAllTools,
                    saveChanges,
                    toggleCategoryTools,
                    getToolsByCategory,
                    getCategoryDisplayName
                };
            },
            template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8'),
        }));
        app.mount(this.$.app);
        panelDataMap.set(this, app);
    },
    beforeClose() { },
    close() {
        var _a;
        (_a = panelDataMap.get(this)) === null || _a === void 0 ? void 0 : _a.unmount();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUErQzs7QUFFL0MsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUM1Qiw2QkFBdUY7QUFFdkYsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVksQ0FBQztBQWdCN0MsTUFBTSxzQkFBc0IsR0FBMkI7SUFDbkQsS0FBSyxFQUFFLGFBQWE7SUFDcEIsSUFBSSxFQUFFLFlBQVk7SUFDbEIsU0FBUyxFQUFFLGlCQUFpQjtJQUM1QixNQUFNLEVBQUUsY0FBYztJQUN0QixPQUFPLEVBQUUsZUFBZTtJQUN4QixLQUFLLEVBQUUsYUFBYTtJQUNwQixXQUFXLEVBQUUsbUJBQW1CO0lBQ2hDLE1BQU0sRUFBRSxjQUFjO0lBQ3RCLFNBQVMsRUFBRSxpQkFBaUI7SUFDNUIsYUFBYSxFQUFFLHNCQUFzQjtJQUNyQyxTQUFTLEVBQUUsa0JBQWtCO0lBQzdCLGNBQWMsRUFBRSx1QkFBdUI7SUFDdkMsYUFBYSxFQUFFLHNCQUFzQjtJQUNyQyxVQUFVLEVBQUUsa0JBQWtCO0NBQ2pDLENBQUM7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFNBQVMsRUFBRTtRQUNQLElBQUksS0FBSyxDQUFDO1FBQ1YsSUFBSSxLQUFLLENBQUM7S0FDYjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFB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QyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIHZ1ZS9vbmUtY29tcG9uZW50LXBlci1maWxlICovXHJcblxyXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY3JlYXRlQXBwLCBBcHAsIGRlZmluZUNvbXBvbmVudCwgcmVmLCBjb21wdXRlZCwgb25Nb3VudGVkLCB3YXRjaCB9IGZyb20gJ3Z1ZSc7XHJcblxyXG5jb25zdCBwYW5lbERhdGFNYXAgPSBuZXcgV2Vha01hcDxhbnksIEFwcD4oKTtcclxuXHJcbmludGVyZmFjZSBUb29sQ29uZmlnIHtcclxuICAgIGNhdGVnb3J5OiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBlbmFibGVkOiBib29sZWFuO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFNlcnZlclNldHRpbmdzIHtcclxuICAgIHBvcnQ6IG51bWJlcjtcclxuICAgIGF1dG9TdGFydDogYm9vbGVhbjtcclxuICAgIGRlYnVnTG9nOiBib29sZWFuO1xyXG4gICAgbWF4Q29ubmVjdGlvbnM6IG51bWJlcjtcclxufVxyXG5cclxuY29uc3QgQ0FURUdPUllfRElTUExBWV9OQU1FUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICAgIHNjZW5lOiAnU2NlbmUgVG9vbHMnLFxyXG4gICAgbm9kZTogJ05vZGUgVG9vbHMnLFxyXG4gICAgY29tcG9uZW50OiAnQ29tcG9uZW50IFRvb2xzJyxcclxuICAgIHByZWZhYjogJ1ByZWZhYiBUb29scycsXHJcbiAgICBwcm9qZWN0OiAnUHJvamVjdCBUb29scycsXHJcbiAgICBkZWJ1ZzogJ0RlYnVnIFRvb2xzJyxcclxuICAgIHByZWZlcmVuY2VzOiAnUHJlZmVyZW5jZXMgVG9vbHMnLFxyXG4gICAgc2VydmVyOiAnU2VydmVyIFRvb2xzJyxcclxuICAgIGJyb2FkY2FzdDogJ0Jyb2FkY2FzdCBUb29scycsXHJcbiAgICBzY2VuZUFkdmFuY2VkOiAnQWR2YW5jZWQgU2NlbmUgVG9vbHMnLFxyXG4gICAgc2NlbmVWaWV3OiAnU2NlbmUgVmlldyBUb29scycsXHJcbiAgICByZWZlcmVuY2VJbWFnZTogJ1JlZmVyZW5jZSBJbWFnZSBUb29scycsXHJcbiAgICBhc3NldEFkdmFuY2VkOiAnQWR2YW5jZWQgQXNzZXQgVG9vbHMnLFxyXG4gICAgdmFsaWRhdGlvbjogJ1ZhbGlkYXRpb24gVG9vbHMnXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xyXG4gICAgbGlzdGVuZXJzOiB7XHJcbiAgICAgICAgc2hvdygpIHsgfSxcclxuICAgICAgICBoaWRlKCkgeyB9LFxyXG4gICAgfSxcclxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxyXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy9zdHlsZS9kZWZhdWx0L2luZGV4LmNzcycpLCAndXRmLTgnKSxcclxuICAgICQ6IHtcclxuICAgICAgICBhcHA6ICcjYXBwJyxcclxuICAgICAgICBwYW5lbFRpdGxlOiAnI3BhbmVsVGl0bGUnLFxyXG4gICAgfSxcclxuICAgIHJlYWR5KCkge1xyXG4gICAgICAgIGlmICghdGhpcy4kLmFwcCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBhcHAgPSBjcmVhdGVBcHAoe30pO1xyXG4gICAgICAgIGFwcC5jb25maWcuY29tcGlsZXJPcHRpb25zLmlzQ3VzdG9tRWxlbWVudCA9ICh0YWcpID0+IHRhZy5zdGFydHNXaXRoKCd1aS0nKTtcclxuXHJcbiAgICAgICAgYXBwLmNvbXBvbmVudCgnTWNwU2VydmVyQXBwJywgZGVmaW5lQ29tcG9uZW50KHtcclxuICAgICAgICAgICAgc2V0dXAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVUYWIgPSByZWYoJ3NlcnZlcicpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyUnVubmluZyA9IHJlZihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzZXJ2ZXJTdGF0dXNUZXh0ID0gcmVmKCdTdG9wcGVkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb25uZWN0ZWRDbGllbnRzID0gcmVmKDApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaHR0cFVybCA9IHJlZignJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc1Byb2Nlc3NpbmcgPSByZWYoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NDaGFuZ2VkID0gcmVmKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHJlZjxTZXJ2ZXJTZXR0aW5ncz4oe1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IDEwXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGVUb29scyA9IHJlZjxUb29sQ29uZmlnW10+KFtdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xDYXRlZ29yaWVzID0gcmVmPHN0cmluZ1tdPihbXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzQ2xhc3MgPSBjb21wdXRlZCgoKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgICdzdGF0dXMtcnVubmluZyc6IHNlcnZlclJ1bm5pbmcudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3N0YXR1cy1zdG9wcGVkJzogIXNlcnZlclJ1bm5pbmcudmFsdWVcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFRvb2xzID0gY29tcHV0ZWQoKCkgPT4gYXZhaWxhYmxlVG9vbHMudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29sQ291bnQgPSBjb21wdXRlZCgoKSA9PiBhdmFpbGFibGVUb29scy52YWx1ZS5maWx0ZXIodCA9PiB0LmVuYWJsZWQpLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlZFRvb2xDb3VudCA9IGNvbXB1dGVkKCgpID0+IHRvdGFsVG9vbHMudmFsdWUgLSBlbmFibGVkVG9vbENvdW50LnZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzd2l0Y2hUYWIgPSAodGFiTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlVGFiLnZhbHVlID0gdGFiTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFiTmFtZSA9PT0gJ3Rvb2xzJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9nZ2xlU2VydmVyID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXJ2ZXJSdW5uaW5nLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3N0b3Atc2VydmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDogc2V0dGluZ3MudmFsdWUucG9ydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHNldHRpbmdzLnZhbHVlLmF1dG9TdGFydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogc2V0dGluZ3MudmFsdWUuZGVidWdMb2csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IHNldHRpbmdzLnZhbHVlLm1heENvbm5lY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBjdXJyZW50U2V0dGluZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdGFydC1zZXJ2ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB0b2dnbGUgc2VydmVyOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVTZXR0aW5ncyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5nc0RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBzZXR0aW5ncy52YWx1ZS5wb3J0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBzZXR0aW5ncy52YWx1ZS5hdXRvU3RhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogc2V0dGluZ3MudmFsdWUuZGVidWdMb2csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc2V0dGluZ3MudmFsdWUubWF4Q29ubmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBzZXR0aW5nc0RhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb3B5VXJsID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGh0dHBVcmwudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBjb3B5IFVSTDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkVG9vbE1hbmFnZXJTdGF0ZSA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldFRvb2xNYW5hZ2VyU3RhdGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdD8uc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSByZXN1bHQuYXZhaWxhYmxlVG9vbHMgPz8gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0gbmV3IFNldChhdmFpbGFibGVUb29scy52YWx1ZS5tYXAodCA9PiB0LmNhdGVnb3J5KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sQ2F0ZWdvcmllcy52YWx1ZSA9IEFycmF5LmZyb20oY2F0ZWdvcmllcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gbG9hZCB0b29sIG1hbmFnZXIgc3RhdGU6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlVG9vbFN0YXR1cyA9IGFzeW5jIChjYXRlZ29yeTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBPcHRpbWlzdGljIHVwZGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xJbmRleCA9IGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZpbmRJbmRleCh0ID0+IHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5ICYmIHQubmFtZSA9PT0gbmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2xJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWVbdG9vbEluZGV4XS5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSBbLi4uYXZhaWxhYmxlVG9vbHMudmFsdWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZVRvb2xTdGF0dXMnLCBjYXRlZ29yeSwgbmFtZSwgZW5hYmxlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0Py5zdWNjZXNzICYmIHRvb2xJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJvbGwgYmFjayBvbiBmYWlsdXJlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZVt0b29sSW5kZXhdLmVuYWJsZWQgPSAhZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlID0gWy4uLmF2YWlsYWJsZVRvb2xzLnZhbHVlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJvbGwgYmFjayBvbiBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9vbEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWVbdG9vbEluZGV4XS5lbmFibGVkID0gIWVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZSA9IFsuLi5hdmFpbGFibGVUb29scy52YWx1ZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzYXZlQ2hhbmdlcyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gYXZhaWxhYmxlVG9vbHMudmFsdWUubWFwKHRvb2wgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBTdHJpbmcodG9vbC5jYXRlZ29yeSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBTdHJpbmcodG9vbC5uYW1lKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IEJvb2xlYW4odG9vbC5lbmFibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1c0JhdGNoJywgdXBkYXRlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHNhdmUgdG9vbCBjaGFuZ2VzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEFsbFRvb2xzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZvckVhY2godCA9PiB7IHQuZW5hYmxlZCA9IHRydWU7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNhdmVDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2VsZWN0QWxsVG9vbHMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUuZm9yRWFjaCh0ID0+IHsgdC5lbmFibGVkID0gZmFsc2U7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNhdmVDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvZ2dsZUNhdGVnb3J5VG9vbHMgPSBhc3luYyAoY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZvckVhY2godCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSkgdC5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlQ2hhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBnZXRUb29sc0J5Q2F0ZWdvcnkgPSAoY2F0ZWdvcnk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdmFpbGFibGVUb29scy52YWx1ZS5maWx0ZXIodCA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGdldENhdGVnb3J5RGlzcGxheU5hbWUgPSAoY2F0ZWdvcnk6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIENBVEVHT1JZX0RJU1BMQVlfTkFNRVNbY2F0ZWdvcnldID8/IGNhdGVnb3J5O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB3YXRjaChzZXR0aW5ncywgKCkgPT4geyBzZXR0aW5nc0NoYW5nZWQudmFsdWUgPSB0cnVlOyB9LCB7IGRlZXA6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgb25Nb3VudGVkKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC1zZXJ2ZXItc3RhdHVzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXM/LnNldHRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy52YWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBzdGF0dXMuc2V0dGluZ3MucG9ydCA/PyAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc3RhdHVzLnNldHRpbmdzLmF1dG9TdGFydCA/PyBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogc3RhdHVzLnNldHRpbmdzLmVuYWJsZURlYnVnTG9nID8/IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzdGF0dXMuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgPz8gMTBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gbG9hZCBzZXJ2ZXIgc2V0dGluZ3M6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtc2VydmVyLXN0YXR1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclJ1bm5pbmcudmFsdWUgPSByZXN1bHQucnVubmluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJTdGF0dXNUZXh0LnZhbHVlID0gcmVzdWx0LnJ1bm5pbmcgPyAnUnVubmluZycgOiAnU3RvcHBlZCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkQ2xpZW50cy52YWx1ZSA9IHJlc3VsdC5jbGllbnRzID8/IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFVybC52YWx1ZSA9IHJlc3VsdC5ydW5uaW5nID8gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtyZXN1bHQucG9ydH1gIDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nLnZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gcG9sbCBzZXJ2ZXIgc3RhdHVzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmVUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyUnVubmluZyxcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJTdGF0dXNUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RlZENsaWVudHMsXHJcbiAgICAgICAgICAgICAgICAgICAgaHR0cFVybCxcclxuICAgICAgICAgICAgICAgICAgICBpc1Byb2Nlc3NpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbENhdGVnb3JpZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NDaGFuZ2VkLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0NsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZFRvb2xDb3VudCxcclxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZFRvb2xDb3VudCxcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2hUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlU2VydmVyLFxyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVTZXR0aW5ncyxcclxuICAgICAgICAgICAgICAgICAgICBjb3B5VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRUb29sTWFuYWdlclN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRvb2xTdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0QWxsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzZWxlY3RBbGxUb29scyxcclxuICAgICAgICAgICAgICAgICAgICBzYXZlQ2hhbmdlcyxcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVDYXRlZ29yeVRvb2xzLFxyXG4gICAgICAgICAgICAgICAgICAgIGdldFRvb2xzQnlDYXRlZ29yeSxcclxuICAgICAgICAgICAgICAgICAgICBnZXRDYXRlZ29yeURpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL3Z1ZS9tY3Atc2VydmVyLWFwcC5odG1sJyksICd1dGYtOCcpLFxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgYXBwLm1vdW50KHRoaXMuJC5hcHApO1xyXG4gICAgICAgIHBhbmVsRGF0YU1hcC5zZXQodGhpcywgYXBwKTtcclxuICAgIH0sXHJcbiAgICBiZWZvcmVDbG9zZSgpIHsgfSxcclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LnVubW91bnQoKTtcclxuICAgIH0sXHJcbn0pO1xyXG4iXX0=