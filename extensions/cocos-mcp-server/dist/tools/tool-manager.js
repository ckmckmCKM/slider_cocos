"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const uuid_1 = require("uuid");
const settings_1 = require("../settings");
const scene_tools_1 = require("./scene-tools");
const node_tools_1 = require("./node-tools");
const component_tools_1 = require("./component-tools");
const prefab_tools_1 = require("./prefab-tools");
const project_tools_1 = require("./project-tools");
const debug_tools_1 = require("./debug-tools");
const preferences_tools_1 = require("./preferences-tools");
const server_tools_1 = require("./server-tools");
const broadcast_tools_1 = require("./broadcast-tools");
const scene_advanced_tools_1 = require("./scene-advanced-tools");
const scene_view_tools_1 = require("./scene-view-tools");
const reference_image_tools_1 = require("./reference-image-tools");
const asset_advanced_tools_1 = require("./asset-advanced-tools");
const validation_tools_1 = require("./validation-tools");
// All tool category instances are shared with MCPServer to avoid double instantiation.
// The same instances are reused here for tool discovery.
function createToolInstances() {
    return {
        scene: new scene_tools_1.SceneTools(),
        node: new node_tools_1.NodeTools(),
        component: new component_tools_1.ComponentTools(),
        prefab: new prefab_tools_1.PrefabTools(),
        project: new project_tools_1.ProjectTools(),
        debug: new debug_tools_1.DebugTools(),
        preferences: new preferences_tools_1.PreferencesTools(),
        server: new server_tools_1.ServerTools(),
        broadcast: new broadcast_tools_1.BroadcastTools(),
        sceneAdvanced: new scene_advanced_tools_1.SceneAdvancedTools(),
        sceneView: new scene_view_tools_1.SceneViewTools(),
        referenceImage: new reference_image_tools_1.ReferenceImageTools(),
        assetAdvanced: new asset_advanced_tools_1.AssetAdvancedTools(),
        validation: new validation_tools_1.ValidationTools()
    };
}
class ToolManager {
    constructor() {
        this.availableTools = [];
        this.settings = (0, settings_1.readToolManagerSettings)();
        this.availableTools = this.discoverTools();
        if (this.settings.configurations.length === 0) {
            this.createConfiguration('Default', 'Auto-created default tool configuration');
        }
    }
    discoverTools() {
        try {
            const instances = createToolInstances();
            const tools = [];
            for (const [category, toolSet] of Object.entries(instances)) {
                for (const tool of toolSet.getTools()) {
                    tools.push({
                        category,
                        name: tool.name,
                        enabled: true,
                        description: tool.description
                    });
                }
            }
            console.log(`[ToolManager] Discovered ${tools.length} tools`);
            return tools;
        }
        catch (error) {
            console.error('[ToolManager] Failed to discover tools:', error);
            return [];
        }
    }
    getAvailableTools() {
        return [...this.availableTools];
    }
    getConfigurations() {
        return [...this.settings.configurations];
    }
    getCurrentConfiguration() {
        var _a;
        if (!this.settings.currentConfigId)
            return null;
        return (_a = this.settings.configurations.find(c => c.id === this.settings.currentConfigId)) !== null && _a !== void 0 ? _a : null;
    }
    createConfiguration(name, description) {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`Maximum configuration slots reached (${this.settings.maxConfigSlots})`);
        }
        const now = new Date().toISOString();
        const config = {
            id: (0, uuid_1.v4)(),
            name,
            description,
            tools: this.availableTools.map(tool => (Object.assign({}, tool))),
            createdAt: now,
            updatedAt: now
        };
        this.settings.configurations.push(config);
        this.settings.currentConfigId = config.id;
        this.saveSettings();
        return config;
    }
    updateConfiguration(configId, updates) {
        const idx = this.findConfigIndex(configId);
        const updated = Object.assign(Object.assign(Object.assign({}, this.settings.configurations[idx]), updates), { updatedAt: new Date().toISOString() });
        this.settings.configurations[idx] = updated;
        this.saveSettings();
        return updated;
    }
    deleteConfiguration(configId) {
        var _a, _b;
        const idx = this.findConfigIndex(configId);
        this.settings.configurations.splice(idx, 1);
        if (this.settings.currentConfigId === configId) {
            this.settings.currentConfigId = (_b = (_a = this.settings.configurations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '';
        }
        this.saveSettings();
    }
    setCurrentConfiguration(configId) {
        this.findConfigIndex(configId); // validates existence
        this.settings.currentConfigId = configId;
        this.saveSettings();
    }
    updateToolStatus(configId, category, toolName, enabled) {
        const config = this.getConfig(configId);
        const tool = config.tools.find(t => t.category === category && t.name === toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${category}/${toolName}`);
        }
        tool.enabled = enabled;
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
    }
    updateToolStatusBatch(configId, updates) {
        const config = this.getConfig(configId);
        for (const update of updates) {
            const tool = config.tools.find(t => t.category === update.category && t.name === update.name);
            if (tool) {
                tool.enabled = update.enabled;
            }
        }
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
    }
    exportConfiguration(configId) {
        return (0, settings_1.exportToolConfiguration)(this.getConfig(configId));
    }
    importConfiguration(configJson) {
        const config = (0, settings_1.importToolConfiguration)(configJson);
        config.id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        config.createdAt = now;
        config.updatedAt = now;
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`Maximum configuration slots reached (${this.settings.maxConfigSlots})`);
        }
        this.settings.configurations.push(config);
        this.saveSettings();
        return config;
    }
    getEnabledTools() {
        const current = this.getCurrentConfiguration();
        const source = current ? current.tools : this.availableTools;
        return source.filter(t => t.enabled);
    }
    getToolManagerState() {
        const current = this.getCurrentConfiguration();
        return {
            success: true,
            availableTools: current ? current.tools : this.getAvailableTools(),
            selectedConfigId: this.settings.currentConfigId,
            configurations: this.getConfigurations(),
            maxConfigSlots: this.settings.maxConfigSlots
        };
    }
    getConfig(configId) {
        const config = this.settings.configurations.find(c => c.id === configId);
        if (!config)
            throw new Error(`Configuration not found: ${configId}`);
        return config;
    }
    findConfigIndex(configId) {
        const idx = this.settings.configurations.findIndex(c => c.id === configId);
        if (idx === -1)
            throw new Error(`Configuration not found: ${configId}`);
        return idx;
    }
    saveSettings() {
        (0, settings_1.saveToolManagerSettings)(this.settings);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3Rvb2wtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBb0M7QUFFcEMsMENBQWlJO0FBQ2pJLCtDQUEyQztBQUMzQyw2Q0FBeUM7QUFDekMsdURBQW1EO0FBQ25ELGlEQUE2QztBQUM3QyxtREFBK0M7QUFDL0MsK0NBQTJDO0FBQzNDLDJEQUF1RDtBQUN2RCxpREFBNkM7QUFDN0MsdURBQW1EO0FBQ25ELGlFQUE0RDtBQUM1RCx5REFBb0Q7QUFDcEQsbUVBQThEO0FBQzlELGlFQUE0RDtBQUM1RCx5REFBcUQ7QUFFckQsdUZBQXVGO0FBQ3ZGLHlEQUF5RDtBQUN6RCxTQUFTLG1CQUFtQjtJQUN4QixPQUFPO1FBQ0gsS0FBSyxFQUFFLElBQUksd0JBQVUsRUFBRTtRQUN2QixJQUFJLEVBQUUsSUFBSSxzQkFBUyxFQUFFO1FBQ3JCLFNBQVMsRUFBRSxJQUFJLGdDQUFjLEVBQUU7UUFDL0IsTUFBTSxFQUFFLElBQUksMEJBQVcsRUFBRTtRQUN6QixPQUFPLEVBQUUsSUFBSSw0QkFBWSxFQUFFO1FBQzNCLEtBQUssRUFBRSxJQUFJLHdCQUFVLEVBQUU7UUFDdkIsV0FBVyxFQUFFLElBQUksb0NBQWdCLEVBQUU7UUFDbkMsTUFBTSxFQUFFLElBQUksMEJBQVcsRUFBRTtRQUN6QixTQUFTLEVBQUUsSUFBSSxnQ0FBYyxFQUFFO1FBQy9CLGFBQWEsRUFBRSxJQUFJLHlDQUFrQixFQUFFO1FBQ3ZDLFNBQVMsRUFBRSxJQUFJLGlDQUFjLEVBQUU7UUFDL0IsY0FBYyxFQUFFLElBQUksMkNBQW1CLEVBQUU7UUFDekMsYUFBYSxFQUFFLElBQUkseUNBQWtCLEVBQUU7UUFDdkMsVUFBVSxFQUFFLElBQUksa0NBQWUsRUFBRTtLQUNwQyxDQUFDO0FBQ04sQ0FBQztBQUVELE1BQWEsV0FBVztJQUlwQjtRQUZRLG1CQUFjLEdBQWlC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Q3hFLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVPLFlBQVk7UUFDaEIsSUFBQSxrQ0FBdUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUNKO0FBNUtELGtDQTRLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xyXG5pbXBvcnQgeyBUb29sQ29uZmlnLCBUb29sQ29uZmlndXJhdGlvbiwgVG9vbE1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4uL3R5cGVzJztcclxuaW1wb3J0IHsgcmVhZFRvb2xNYW5hZ2VyU2V0dGluZ3MsIHNhdmVUb29sTWFuYWdlclNldHRpbmdzLCBleHBvcnRUb29sQ29uZmlndXJhdGlvbiwgaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi9zZXR0aW5ncyc7XHJcbmltcG9ydCB7IFNjZW5lVG9vbHMgfSBmcm9tICcuL3NjZW5lLXRvb2xzJztcclxuaW1wb3J0IHsgTm9kZVRvb2xzIH0gZnJvbSAnLi9ub2RlLXRvb2xzJztcclxuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL2NvbXBvbmVudC10b29scyc7XHJcbmltcG9ydCB7IFByZWZhYlRvb2xzIH0gZnJvbSAnLi9wcmVmYWItdG9vbHMnO1xyXG5pbXBvcnQgeyBQcm9qZWN0VG9vbHMgfSBmcm9tICcuL3Byb2plY3QtdG9vbHMnO1xyXG5pbXBvcnQgeyBEZWJ1Z1Rvb2xzIH0gZnJvbSAnLi9kZWJ1Zy10b29scyc7XHJcbmltcG9ydCB7IFByZWZlcmVuY2VzVG9vbHMgfSBmcm9tICcuL3ByZWZlcmVuY2VzLXRvb2xzJztcclxuaW1wb3J0IHsgU2VydmVyVG9vbHMgfSBmcm9tICcuL3NlcnZlci10b29scyc7XHJcbmltcG9ydCB7IEJyb2FkY2FzdFRvb2xzIH0gZnJvbSAnLi9icm9hZGNhc3QtdG9vbHMnO1xyXG5pbXBvcnQgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3NjZW5lLWFkdmFuY2VkLXRvb2xzJztcclxuaW1wb3J0IHsgU2NlbmVWaWV3VG9vbHMgfSBmcm9tICcuL3NjZW5lLXZpZXctdG9vbHMnO1xyXG5pbXBvcnQgeyBSZWZlcmVuY2VJbWFnZVRvb2xzIH0gZnJvbSAnLi9yZWZlcmVuY2UtaW1hZ2UtdG9vbHMnO1xyXG5pbXBvcnQgeyBBc3NldEFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL2Fzc2V0LWFkdmFuY2VkLXRvb2xzJztcclxuaW1wb3J0IHsgVmFsaWRhdGlvblRvb2xzIH0gZnJvbSAnLi92YWxpZGF0aW9uLXRvb2xzJztcclxuXHJcbi8vIEFsbCB0b29sIGNhdGVnb3J5IGluc3RhbmNlcyBhcmUgc2hhcmVkIHdpdGggTUNQU2VydmVyIHRvIGF2b2lkIGRvdWJsZSBpbnN0YW50aWF0aW9uLlxyXG4vLyBUaGUgc2FtZSBpbnN0YW5jZXMgYXJlIHJldXNlZCBoZXJlIGZvciB0b29sIGRpc2NvdmVyeS5cclxuZnVuY3Rpb24gY3JlYXRlVG9vbEluc3RhbmNlcygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2NlbmU6IG5ldyBTY2VuZVRvb2xzKCksXHJcbiAgICAgICAgbm9kZTogbmV3IE5vZGVUb29scygpLFxyXG4gICAgICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFRvb2xzKCksXHJcbiAgICAgICAgcHJlZmFiOiBuZXcgUHJlZmFiVG9vbHMoKSxcclxuICAgICAgICBwcm9qZWN0OiBuZXcgUHJvamVjdFRvb2xzKCksXHJcbiAgICAgICAgZGVidWc6IG5ldyBEZWJ1Z1Rvb2xzKCksXHJcbiAgICAgICAgcHJlZmVyZW5jZXM6IG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCksXHJcbiAgICAgICAgc2VydmVyOiBuZXcgU2VydmVyVG9vbHMoKSxcclxuICAgICAgICBicm9hZGNhc3Q6IG5ldyBCcm9hZGNhc3RUb29scygpLFxyXG4gICAgICAgIHNjZW5lQWR2YW5jZWQ6IG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKSxcclxuICAgICAgICBzY2VuZVZpZXc6IG5ldyBTY2VuZVZpZXdUb29scygpLFxyXG4gICAgICAgIHJlZmVyZW5jZUltYWdlOiBuZXcgUmVmZXJlbmNlSW1hZ2VUb29scygpLFxyXG4gICAgICAgIGFzc2V0QWR2YW5jZWQ6IG5ldyBBc3NldEFkdmFuY2VkVG9vbHMoKSxcclxuICAgICAgICB2YWxpZGF0aW9uOiBuZXcgVmFsaWRhdGlvblRvb2xzKClcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb29sTWFuYWdlciB7XHJcbiAgICBwcml2YXRlIHNldHRpbmdzOiBUb29sTWFuYWdlclNldHRpbmdzO1xyXG4gICAgcHJpdmF0ZSBhdmFpbGFibGVUb29sczogVG9vbENvbmZpZ1tdID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk7XHJcbiAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IHRoaXMuZGlzY292ZXJUb29scygpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25maWd1cmF0aW9uKCdEZWZhdWx0JywgJ0F1dG8tY3JlYXRlZCBkZWZhdWx0IHRvb2wgY29uZmlndXJhdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRpc2NvdmVyVG9vbHMoKTogVG9vbENvbmZpZ1tdIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZXMgPSBjcmVhdGVUb29sSW5zdGFuY2VzKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvb2xzOiBUb29sQ29uZmlnW10gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbY2F0ZWdvcnksIHRvb2xTZXRdIG9mIE9iamVjdC5lbnRyaWVzKGluc3RhbmNlcykpIHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdG9vbCBvZiB0b29sU2V0LmdldFRvb2xzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0b29scy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRvb2wubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1Rvb2xNYW5hZ2VyXSBEaXNjb3ZlcmVkICR7dG9vbHMubGVuZ3RofSB0b29sc2ApO1xyXG4gICAgICAgICAgICByZXR1cm4gdG9vbHM7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Rvb2xNYW5hZ2VyXSBGYWlsZWQgdG8gZGlzY292ZXIgdG9vbHM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRBdmFpbGFibGVUb29scygpOiBUb29sQ29uZmlnW10ge1xyXG4gICAgICAgIHJldHVybiBbLi4udGhpcy5hdmFpbGFibGVUb29sc107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENvbmZpZ3VyYXRpb25zKCk6IFRvb2xDb25maWd1cmF0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbLi4udGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9uc107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk6IFRvb2xDb25maWd1cmF0aW9uIHwgbnVsbCB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjID0+IGMuaWQgPT09IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSA/PyBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVDb25maWd1cmF0aW9uKG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID49IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXhpbXVtIGNvbmZpZ3VyYXRpb24gc2xvdHMgcmVhY2hlZCAoJHt0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzfSlgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBjb25maWc6IFRvb2xDb25maWd1cmF0aW9uID0ge1xyXG4gICAgICAgICAgICBpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICB0b29sczogdGhpcy5hdmFpbGFibGVUb29scy5tYXAodG9vbCA9PiAoeyAuLi50b29sIH0pKSxcclxuICAgICAgICAgICAgY3JlYXRlZEF0OiBub3csXHJcbiAgICAgICAgICAgIHVwZGF0ZWRBdDogbm93XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5wdXNoKGNvbmZpZyk7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSBjb25maWcuaWQ7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBQYXJ0aWFsPFRvb2xDb25maWd1cmF0aW9uPik6IFRvb2xDb25maWd1cmF0aW9uIHtcclxuICAgICAgICBjb25zdCBpZHggPSB0aGlzLmZpbmRDb25maWdJbmRleChjb25maWdJZCk7XHJcbiAgICAgICAgY29uc3QgdXBkYXRlZDogVG9vbENvbmZpZ3VyYXRpb24gPSB7XHJcbiAgICAgICAgICAgIC4uLnRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNbaWR4XSxcclxuICAgICAgICAgICAgLi4udXBkYXRlcyxcclxuICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNbaWR4XSA9IHVwZGF0ZWQ7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICByZXR1cm4gdXBkYXRlZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVsZXRlQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5maW5kQ29uZmlnSW5kZXgoY29uZmlnSWQpO1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCA9PT0gY29uZmlnSWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zWzBdPy5pZCA/PyAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZmluZENvbmZpZ0luZGV4KGNvbmZpZ0lkKTsgLy8gdmFsaWRhdGVzIGV4aXN0ZW5jZVxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gY29uZmlnSWQ7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVG9vbFN0YXR1cyhjb25maWdJZDogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRDb25maWcoY29uZmlnSWQpO1xyXG4gICAgICAgIGNvbnN0IHRvb2wgPSBjb25maWcudG9vbHMuZmluZCh0ID0+IHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5ICYmIHQubmFtZSA9PT0gdG9vbE5hbWUpO1xyXG4gICAgICAgIGlmICghdG9vbCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRvb2wgbm90IGZvdW5kOiAke2NhdGVnb3J5fS8ke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVG9vbFN0YXR1c0JhdGNoKGNvbmZpZ0lkOiBzdHJpbmcsIHVwZGF0ZXM6IHsgY2F0ZWdvcnk6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBlbmFibGVkOiBib29sZWFuIH1bXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0Q29uZmlnKGNvbmZpZ0lkKTtcclxuICAgICAgICBmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvb2wgPSBjb25maWcudG9vbHMuZmluZCh0ID0+IHQuY2F0ZWdvcnkgPT09IHVwZGF0ZS5jYXRlZ29yeSAmJiB0Lm5hbWUgPT09IHVwZGF0ZS5uYW1lKTtcclxuICAgICAgICAgICAgaWYgKHRvb2wpIHtcclxuICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IHVwZGF0ZS5lbmFibGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXhwb3J0Q29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gZXhwb3J0VG9vbENvbmZpZ3VyYXRpb24odGhpcy5nZXRDb25maWcoY29uZmlnSWQpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW1wb3J0Q29uZmlndXJhdGlvbihjb25maWdKc29uOiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbik7XHJcbiAgICAgICAgY29uZmlnLmlkID0gdXVpZHY0KCk7XHJcbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgIGNvbmZpZy5jcmVhdGVkQXQgPSBub3c7XHJcbiAgICAgICAgY29uZmlnLnVwZGF0ZWRBdCA9IG5vdztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID49IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXhpbXVtIGNvbmZpZ3VyYXRpb24gc2xvdHMgcmVhY2hlZCAoJHt0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzfSlgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5wdXNoKGNvbmZpZyk7XHJcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRFbmFibGVkVG9vbHMoKTogVG9vbENvbmZpZ1tdIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5nZXRDdXJyZW50Q29uZmlndXJhdGlvbigpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGN1cnJlbnQgPyBjdXJyZW50LnRvb2xzIDogdGhpcy5hdmFpbGFibGVUb29scztcclxuICAgICAgICByZXR1cm4gc291cmNlLmZpbHRlcih0ID0+IHQuZW5hYmxlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFRvb2xNYW5hZ2VyU3RhdGUoKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuZ2V0Q3VycmVudENvbmZpZ3VyYXRpb24oKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBhdmFpbGFibGVUb29sczogY3VycmVudCA/IGN1cnJlbnQudG9vbHMgOiB0aGlzLmdldEF2YWlsYWJsZVRvb2xzKCksXHJcbiAgICAgICAgICAgIHNlbGVjdGVkQ29uZmlnSWQ6IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkLFxyXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uczogdGhpcy5nZXRDb25maWd1cmF0aW9ucygpLFxyXG4gICAgICAgICAgICBtYXhDb25maWdTbG90czogdGhpcy5zZXR0aW5ncy5tYXhDb25maWdTbG90c1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDb25maWcoY29uZmlnSWQ6IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcclxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoYyA9PiBjLmlkID09PSBjb25maWdJZCk7XHJcbiAgICAgICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcihgQ29uZmlndXJhdGlvbiBub3QgZm91bmQ6ICR7Y29uZmlnSWR9YCk7XHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRDb25maWdJbmRleChjb25maWdJZDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmRJbmRleChjID0+IGMuaWQgPT09IGNvbmZpZ0lkKTtcclxuICAgICAgICBpZiAoaWR4ID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmF0aW9uIG5vdCBmb3VuZDogJHtjb25maWdJZH1gKTtcclxuICAgICAgICByZXR1cm4gaWR4O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2F2ZVNldHRpbmdzKCk6IHZvaWQge1xyXG4gICAgICAgIHNhdmVUb29sTWFuYWdlclNldHRpbmdzKHRoaXMuc2V0dGluZ3MpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==