"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesTools = void 0;
class PreferencesTools {
    getTools() {
        return [
            {
                name: 'open_preferences_settings',
                description: 'Open preferences settings panel',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tab: {
                            type: 'string',
                            description: 'Preferences tab to open (optional)',
                            enum: ['general', 'external-tools', 'data-editor', 'laboratory', 'extensions']
                        },
                        args: {
                            type: 'array',
                            description: 'Additional arguments to pass to the tab'
                        }
                    }
                }
            },
            {
                name: 'query_preferences_config',
                description: 'Query preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Plugin or category name',
                            default: 'general'
                        },
                        path: {
                            type: 'string',
                            description: 'Configuration path (optional)'
                        },
                        type: {
                            type: 'string',
                            description: 'Configuration type',
                            enum: ['default', 'global', 'local'],
                            default: 'global'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'set_preferences_config',
                description: 'Set preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Plugin name' },
                        path: { type: 'string', description: 'Configuration path' },
                        value: { description: 'Configuration value' },
                        type: {
                            type: 'string',
                            description: 'Configuration type',
                            enum: ['default', 'global', 'local'],
                            default: 'global'
                        }
                    },
                    required: ['name', 'path', 'value']
                }
            },
            {
                name: 'get_all_preferences',
                description: 'Get all available preferences categories',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'reset_preferences',
                description: 'Reset preferences to default values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Specific preference category to reset (optional)'
                        },
                        type: {
                            type: 'string',
                            description: 'Configuration type to reset',
                            enum: ['global', 'local'],
                            default: 'global'
                        }
                    }
                }
            },
            {
                name: 'export_preferences',
                description: 'Export current preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        exportPath: {
                            type: 'string',
                            description: 'Path to export preferences file (optional)'
                        }
                    }
                }
            },
            {
                name: 'import_preferences',
                description: 'Import preferences configuration from file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        importPath: { type: 'string', description: 'Path to import preferences file from' }
                    },
                    required: ['importPath']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'open_preferences_settings': return this.openPreferencesSettings(args.tab, args.args);
            case 'query_preferences_config': return this.queryPreferencesConfig(args.name, args.path, args.type);
            case 'set_preferences_config': return this.setPreferencesConfig(args.name, args.path, args.value, args.type);
            case 'get_all_preferences': return this.getAllPreferences();
            case 'reset_preferences': return this.resetPreferences(args.name, args.type);
            case 'export_preferences': return this.exportPreferences(args.exportPath);
            case 'import_preferences': return this.importPreferences();
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async openPreferencesSettings(tab, extraArgs) {
        try {
            const requestArgs = tab ? [tab, ...(extraArgs !== null && extraArgs !== void 0 ? extraArgs : [])] : [];
            await Editor.Message.request('preferences', 'open-settings', ...requestArgs);
            return { success: true, message: `Preferences opened${tab ? ` on tab: ${tab}` : ''}` };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async queryPreferencesConfig(name, configPath, type = 'global') {
        try {
            const args = [name];
            if (configPath)
                args.push(configPath);
            args.push(type);
            const config = await Editor.Message.request('preferences', 'query-config', ...args);
            return { success: true, data: { name, path: configPath, type, config } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async setPreferencesConfig(name, configPath, value, type = 'global') {
        try {
            const success = await Editor.Message.request('preferences', 'set-config', name, configPath, value, type);
            if (success) {
                return { success: true, message: `Preference '${name}.${configPath}' updated successfully` };
            }
            return { success: false, error: `Failed to update preference '${name}.${configPath}'` };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async getAllPreferences() {
        const categories = ['general', 'external-tools', 'data-editor', 'laboratory', 'extensions', 'preview', 'console', 'native', 'builder'];
        const results = await Promise.all(categories.map(cat => Editor.Message.request('preferences', 'query-config', cat, undefined, 'global')
            .then((config) => [cat, config])
            .catch(() => [cat, null])));
        const preferences = Object.fromEntries(results.filter(([, v]) => v !== null));
        return { success: true, data: { categories: Object.keys(preferences), preferences } };
    }
    async resetPreferences(name, type = 'global') {
        if (!name) {
            return { success: false, error: 'Specify a preference category to reset. Resetting all preferences is not supported via API.' };
        }
        try {
            const defaultConfig = await Editor.Message.request('preferences', 'query-config', name, undefined, 'default');
            const success = await Editor.Message.request('preferences', 'set-config', name, '', defaultConfig, type);
            if (success) {
                return { success: true, message: `Preference category '${name}' reset to default` };
            }
            return { success: false, error: `Failed to reset preference category '${name}'` };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async exportPreferences(exportPath) {
        const prefsResult = await this.getAllPreferences();
        if (!prefsResult.success)
            return prefsResult;
        return {
            success: true,
            data: {
                exportPath: exportPath !== null && exportPath !== void 0 ? exportPath : `preferences_export_${Date.now()}.json`,
                preferences: prefsResult.data,
                jsonData: JSON.stringify(prefsResult.data, null, 2)
            }
        };
    }
    importPreferences() {
        return {
            success: false,
            error: 'Import preferences requires file system access. Please use the Editor UI to import preferences manually.'
        };
    }
}
exports.PreferencesTools = PreferencesTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvcHJlZmVyZW5jZXMtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxnQkFBZ0I7SUFDekIsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsMkJBQTJCO2dCQUNqQyxXQUFXLEVBQUUsaUNBQWlDO2dCQUM5QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLEdBQUcsRUFBRTs0QkFDRCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsb0NBQW9DOzRCQUNqRCxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUM7eUJBQ2pGO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsT0FBTzs0QkFDYixXQUFXLEVBQUUseUNBQXlDO3lCQUN6RDtxQkFDSjtpQkFDSjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHlCQUF5Qjs0QkFDdEMsT0FBTyxFQUFFLFNBQVM7eUJBQ3JCO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsK0JBQStCO3lCQUMvQzt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLG9CQUFvQjs0QkFDakMsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUM7NEJBQ3BDLE9BQU8sRUFBRSxR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QztRQUM3QyxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUU7Z0JBQ0YsVUFBVSxFQUFFLFVBQVUsYUFBVixVQUFVLGNBQVYsVUFBVSxHQUFJLHNCQUFzQixJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU87Z0JBQ2pFLFdBQVcsRUFBRSxXQUFXLENBQUMsSUFBSTtnQkFDN0IsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQ3REO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFTyxpQkFBaUI7UUFDckIsT0FBTztZQUNILE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLDBHQUEwRztTQUNwSCxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBbk5ELDRDQW1OQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQcmVmZXJlbmNlc1Rvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX3ByZWZlcmVuY2VzX3NldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3BlbiBwcmVmZXJlbmNlcyBzZXR0aW5ncyBwYW5lbCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmVyZW5jZXMgdGFiIHRvIG9wZW4gKG9wdGlvbmFsKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2dlbmVyYWwnLCAnZXh0ZXJuYWwtdG9vbHMnLCAnZGF0YS1lZGl0b3InLCAnbGFib3JhdG9yeScsICdleHRlbnNpb25zJ11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWRkaXRpb25hbCBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgdGFiJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfcHJlZmVyZW5jZXNfY29uZmlnJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgcHJlZmVyZW5jZXMgY29uZmlndXJhdGlvbicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BsdWdpbiBvciBjYXRlZ29yeSBuYW1lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdnZW5lcmFsJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiBwYXRoIChvcHRpb25hbCknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb25maWd1cmF0aW9uIHR5cGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydkZWZhdWx0JywgJ2dsb2JhbCcsICdsb2NhbCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2dsb2JhbCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdzZXRfcHJlZmVyZW5jZXNfY29uZmlnJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0IHByZWZlcmVuY2VzIGNvbmZpZ3VyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUGx1Z2luIG5hbWUnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiBwYXRoJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyBkZXNjcmlwdGlvbjogJ0NvbmZpZ3VyYXRpb24gdmFsdWUnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb25maWd1cmF0aW9uIHR5cGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydkZWZhdWx0JywgJ2dsb2JhbCcsICdsb2NhbCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2dsb2JhbCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZScsICdwYXRoJywgJ3ZhbHVlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hbGxfcHJlZmVyZW5jZXMnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIGF2YWlsYWJsZSBwcmVmZXJlbmNlcyBjYXRlZ29yaWVzJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiB7fSB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXNldF9wcmVmZXJlbmNlcycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Jlc2V0IHByZWZlcmVuY2VzIHRvIGRlZmF1bHQgdmFsdWVzJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU3BlY2lmaWMgcHJlZmVyZW5jZSBjYXRlZ29yeSB0byByZXNldCAob3B0aW9uYWwpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiB0eXBlIHRvIHJlc2V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2xvYmFsJywgJ2xvY2FsJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZ2xvYmFsJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZXhwb3J0X3ByZWZlcmVuY2VzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGN1cnJlbnQgcHJlZmVyZW5jZXMgY29uZmlndXJhdGlvbicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0UGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gZXhwb3J0IHByZWZlcmVuY2VzIGZpbGUgKG9wdGlvbmFsKSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2ltcG9ydF9wcmVmZXJlbmNlcycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ltcG9ydCBwcmVmZXJlbmNlcyBjb25maWd1cmF0aW9uIGZyb20gZmlsZScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0UGF0aDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQYXRoIHRvIGltcG9ydCBwcmVmZXJlbmNlcyBmaWxlIGZyb20nIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2ltcG9ydFBhdGgnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICdvcGVuX3ByZWZlcmVuY2VzX3NldHRpbmdzJzogcmV0dXJuIHRoaXMub3BlblByZWZlcmVuY2VzU2V0dGluZ3MoYXJncy50YWIsIGFyZ3MuYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3F1ZXJ5X3ByZWZlcmVuY2VzX2NvbmZpZyc6ICByZXR1cm4gdGhpcy5xdWVyeVByZWZlcmVuY2VzQ29uZmlnKGFyZ3MubmFtZSwgYXJncy5wYXRoLCBhcmdzLnR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlICdzZXRfcHJlZmVyZW5jZXNfY29uZmlnJzogICAgcmV0dXJuIHRoaXMuc2V0UHJlZmVyZW5jZXNDb25maWcoYXJncy5uYW1lLCBhcmdzLnBhdGgsIGFyZ3MudmFsdWUsIGFyZ3MudHlwZSk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldF9hbGxfcHJlZmVyZW5jZXMnOiAgICAgICByZXR1cm4gdGhpcy5nZXRBbGxQcmVmZXJlbmNlcygpO1xyXG4gICAgICAgICAgICBjYXNlICdyZXNldF9wcmVmZXJlbmNlcyc6ICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXRQcmVmZXJlbmNlcyhhcmdzLm5hbWUsIGFyZ3MudHlwZSk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2V4cG9ydF9wcmVmZXJlbmNlcyc6ICAgICAgICByZXR1cm4gdGhpcy5leHBvcnRQcmVmZXJlbmNlcyhhcmdzLmV4cG9ydFBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlICdpbXBvcnRfcHJlZmVyZW5jZXMnOiAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0UHJlZmVyZW5jZXMoKTtcclxuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlblByZWZlcmVuY2VzU2V0dGluZ3ModGFiPzogc3RyaW5nLCBleHRyYUFyZ3M/OiBhbnlbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdEFyZ3M6IGFueVtdID0gdGFiID8gW3RhYiwgLi4uKGV4dHJhQXJncyA/PyBbXSldIDogW107XHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoJ3ByZWZlcmVuY2VzJywgJ29wZW4tc2V0dGluZ3MnLCAuLi5yZXF1ZXN0QXJncyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBQcmVmZXJlbmNlcyBvcGVuZWQke3RhYiA/IGAgb24gdGFiOiAke3RhYn1gIDogJyd9YCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVByZWZlcmVuY2VzQ29uZmlnKG5hbWU6IHN0cmluZywgY29uZmlnUGF0aD86IHN0cmluZywgdHlwZTogc3RyaW5nID0gJ2dsb2JhbCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyZ3M6IGFueVtdID0gW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoY29uZmlnUGF0aCkgYXJncy5wdXNoKGNvbmZpZ1BhdGgpO1xyXG4gICAgICAgICAgICBhcmdzLnB1c2godHlwZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoJ3ByZWZlcmVuY2VzJywgJ3F1ZXJ5LWNvbmZpZycsIC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IG5hbWUsIHBhdGg6IGNvbmZpZ1BhdGgsIHR5cGUsIGNvbmZpZyB9IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFByZWZlcmVuY2VzQ29uZmlnKG5hbWU6IHN0cmluZywgY29uZmlnUGF0aDogc3RyaW5nLCB2YWx1ZTogYW55LCB0eXBlOiBzdHJpbmcgPSAnZ2xvYmFsJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc3VjY2VzczogYm9vbGVhbiA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoJ3ByZWZlcmVuY2VzJywgJ3NldC1jb25maWcnLCBuYW1lLCBjb25maWdQYXRoLCB2YWx1ZSwgdHlwZSk7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgUHJlZmVyZW5jZSAnJHtuYW1lfS4ke2NvbmZpZ1BhdGh9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBGYWlsZWQgdG8gdXBkYXRlIHByZWZlcmVuY2UgJyR7bmFtZX0uJHtjb25maWdQYXRofSdgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEFsbFByZWZlcmVuY2VzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgY29uc3QgY2F0ZWdvcmllcyA9IFsnZ2VuZXJhbCcsICdleHRlcm5hbC10b29scycsICdkYXRhLWVkaXRvcicsICdsYWJvcmF0b3J5JywgJ2V4dGVuc2lvbnMnLCAncHJldmlldycsICdjb25zb2xlJywgJ25hdGl2ZScsICdidWlsZGVyJ107XHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxyXG4gICAgICAgICAgICBjYXRlZ29yaWVzLm1hcChjYXQgPT5cclxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZWZlcmVuY2VzJywgJ3F1ZXJ5LWNvbmZpZycsIGNhdCwgdW5kZWZpbmVkLCAnZ2xvYmFsJylcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoY29uZmlnOiBhbnkpID0+IFtjYXQsIGNvbmZpZ10gYXMgY29uc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IFtjYXQsIG51bGxdIGFzIGNvbnN0KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCBwcmVmZXJlbmNlcyA9IE9iamVjdC5mcm9tRW50cmllcyhyZXN1bHRzLmZpbHRlcigoWywgdl0pID0+IHYgIT09IG51bGwpKTtcclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHByZWZlcmVuY2VzKSwgcHJlZmVyZW5jZXMgfSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXRQcmVmZXJlbmNlcyhuYW1lPzogc3RyaW5nLCB0eXBlOiBzdHJpbmcgPSAnZ2xvYmFsJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgaWYgKCFuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NwZWNpZnkgYSBwcmVmZXJlbmNlIGNhdGVnb3J5IHRvIHJlc2V0LiBSZXNldHRpbmcgYWxsIHByZWZlcmVuY2VzIGlzIG5vdCBzdXBwb3J0ZWQgdmlhIEFQSS4nIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmVmZXJlbmNlcycsICdxdWVyeS1jb25maWcnLCBuYW1lLCB1bmRlZmluZWQsICdkZWZhdWx0Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3M6IGJvb2xlYW4gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdwcmVmZXJlbmNlcycsICdzZXQtY29uZmlnJywgbmFtZSwgJycsIGRlZmF1bHRDb25maWcsIHR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYFByZWZlcmVuY2UgY2F0ZWdvcnkgJyR7bmFtZX0nIHJlc2V0IHRvIGRlZmF1bHRgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRmFpbGVkIHRvIHJlc2V0IHByZWZlcmVuY2UgY2F0ZWdvcnkgJyR7bmFtZX0nYCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleHBvcnRQcmVmZXJlbmNlcyhleHBvcnRQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBjb25zdCBwcmVmc1Jlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0QWxsUHJlZmVyZW5jZXMoKTtcclxuICAgICAgICBpZiAoIXByZWZzUmVzdWx0LnN1Y2Nlc3MpIHJldHVybiBwcmVmc1Jlc3VsdDtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRQYXRoOiBleHBvcnRQYXRoID8/IGBwcmVmZXJlbmNlc19leHBvcnRfJHtEYXRlLm5vdygpfS5qc29uYCxcclxuICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzOiBwcmVmc1Jlc3VsdC5kYXRhLFxyXG4gICAgICAgICAgICAgICAganNvbkRhdGE6IEpTT04uc3RyaW5naWZ5KHByZWZzUmVzdWx0LmRhdGEsIG51bGwsIDIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW1wb3J0UHJlZmVyZW5jZXMoKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgZXJyb3I6ICdJbXBvcnQgcHJlZmVyZW5jZXMgcmVxdWlyZXMgZmlsZSBzeXN0ZW0gYWNjZXNzLiBQbGVhc2UgdXNlIHRoZSBFZGl0b3IgVUkgdG8gaW1wb3J0IHByZWZlcmVuY2VzIG1hbnVhbGx5LidcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==