"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTools = void 0;
class BroadcastTools {
    constructor() {
        this.listenedTypes = new Set();
        this.messageLog = [];
        this.setupBroadcastListeners();
    }
    getTools() {
        return [
            {
                name: 'get_broadcast_log',
                description: 'Get recent broadcast messages log',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of recent messages to return',
                            default: 50
                        },
                        messageType: {
                            type: 'string',
                            description: 'Filter by message type (optional)'
                        }
                    }
                }
            },
            {
                name: 'listen_broadcast',
                description: 'Start listening for specific broadcast messages',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messageType: {
                            type: 'string',
                            description: 'Message type to listen for'
                        }
                    },
                    required: ['messageType']
                }
            },
            {
                name: 'stop_listening',
                description: 'Stop listening for specific broadcast messages',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messageType: {
                            type: 'string',
                            description: 'Message type to stop listening for'
                        }
                    },
                    required: ['messageType']
                }
            },
            {
                name: 'clear_broadcast_log',
                description: 'Clear the broadcast messages log',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_active_listeners',
                description: 'Get list of active broadcast listeners',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'get_broadcast_log': return this.getBroadcastLog(args.limit, args.messageType);
            case 'listen_broadcast': return this.listenBroadcast(args.messageType);
            case 'stop_listening': return this.stopListening(args.messageType);
            case 'clear_broadcast_log': return this.clearBroadcastLog();
            case 'get_active_listeners': return this.getActiveListeners();
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    setupBroadcastListeners() {
        // Pre-register listeners for key editor lifecycle events
        const importantMessages = [
            'build-worker:ready', 'build-worker:closed',
            'scene:ready', 'scene:close',
            'scene:light-probe-edit-mode-changed',
            'scene:light-probe-bounding-box-edit-mode-changed',
            'asset-db:ready', 'asset-db:close',
            'asset-db:asset-add', 'asset-db:asset-change', 'asset-db:asset-delete'
        ];
        importantMessages.forEach(t => this.registerListener(t));
    }
    registerListener(messageType) {
        this.listenedTypes.add(messageType);
        // Editor.Message.on is not universally available; message types are tracked for future use.
    }
    getBroadcastLog(limit = 50, messageType) {
        const filtered = messageType
            ? this.messageLog.filter(e => e.message === messageType)
            : this.messageLog;
        const recent = filtered.slice(-limit).map(e => (Object.assign(Object.assign({}, e), { timestamp: new Date(e.timestamp).toISOString() })));
        return {
            success: true,
            data: {
                log: recent,
                count: recent.length,
                totalCount: filtered.length,
                filter: messageType !== null && messageType !== void 0 ? messageType : 'all'
            }
        };
    }
    listenBroadcast(messageType) {
        const alreadyRegistered = this.listenedTypes.has(messageType);
        if (!alreadyRegistered) {
            this.registerListener(messageType);
        }
        return {
            success: true,
            data: {
                messageType,
                message: alreadyRegistered
                    ? `Already listening for broadcast: ${messageType}`
                    : `Started listening for broadcast: ${messageType}`
            }
        };
    }
    stopListening(messageType) {
        const wasRegistered = this.listenedTypes.delete(messageType);
        return {
            success: true,
            data: {
                messageType,
                message: wasRegistered
                    ? `Stopped listening for broadcast: ${messageType}`
                    : `Was not listening for broadcast: ${messageType}`
            }
        };
    }
    clearBroadcastLog() {
        const clearedCount = this.messageLog.length;
        this.messageLog = [];
        return { success: true, data: { clearedCount } };
    }
    getActiveListeners() {
        const listeners = Array.from(this.listenedTypes).map(messageType => ({ messageType }));
        return { success: true, data: { listeners, count: listeners.length } };
    }
}
exports.BroadcastTools = BroadcastTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvYWRjYXN0LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2Jyb2FkY2FzdC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFhLGNBQWM7SUFJdkI7UUFIUSxrQkFBYSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3ZDLGVBQVUsR0FBNkQsRUFBRSxDQUFDO1FBRzlFLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRCxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSxtQ0FBbUM7Z0JBQ2hELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsS0FBSyxFQUFFOzRCQUNILElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxxQ0FBcUM7NEJBQ2xELE9BQU8sRUFBRSxFQUFFO3lCQUNkO3dCQUNELFdBQVcsRUFBRTs0QkFDVCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUNBQW1DO3lCQUNuRDtxQkFDSjtpQkFDSjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixXQUFXLEVBQUU7NEJBQ1QsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLDRCQUE0Qjt5QkFDNUM7cUJBQ0o7b0JBQ0QsUUFBUSxFQUFFLENBQUMsYUFBYSxDQUFDO2lCQUM1QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsV0FBVyxFQUFFLGdEQUFnRDtnQkFDN0QsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixXQUFX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S0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQzNFLENBQUM7Q0FDSjtBQXBLRCx3Q0FvS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IgfSBmcm9tICcuLi90eXBlcyc7XHJcblxyXG5leHBvcnQgY2xhc3MgQnJvYWRjYXN0VG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xyXG4gICAgcHJpdmF0ZSBsaXN0ZW5lZFR5cGVzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcclxuICAgIHByaXZhdGUgbWVzc2FnZUxvZzogQXJyYXk8eyBtZXNzYWdlOiBzdHJpbmc7IGRhdGE6IGFueTsgdGltZXN0YW1wOiBudW1iZXIgfT4gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnNldHVwQnJvYWRjYXN0TGlzdGVuZXJzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9icm9hZGNhc3RfbG9nJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHJlY2VudCBicm9hZGNhc3QgbWVzc2FnZXMgbG9nJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW1pdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ051bWJlciBvZiByZWNlbnQgbWVzc2FnZXMgdG8gcmV0dXJuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDUwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUeXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmlsdGVyIGJ5IG1lc3NhZ2UgdHlwZSAob3B0aW9uYWwpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnbGlzdGVuX2Jyb2FkY2FzdCcsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YXJ0IGxpc3RlbmluZyBmb3Igc3BlY2lmaWMgYnJvYWRjYXN0IG1lc3NhZ2VzJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlVHlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ01lc3NhZ2UgdHlwZSB0byBsaXN0ZW4gZm9yJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydtZXNzYWdlVHlwZSddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdzdG9wX2xpc3RlbmluZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1N0b3AgbGlzdGVuaW5nIGZvciBzcGVjaWZpYyBicm9hZGNhc3QgbWVzc2FnZXMnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUeXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWVzc2FnZSB0eXBlIHRvIHN0b3AgbGlzdGVuaW5nIGZvcidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbWVzc2FnZVR5cGUnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnY2xlYXJfYnJvYWRjYXN0X2xvZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NsZWFyIHRoZSBicm9hZGNhc3QgbWVzc2FnZXMgbG9nJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hY3RpdmVfbGlzdGVuZXJzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGxpc3Qgb2YgYWN0aXZlIGJyb2FkY2FzdCBsaXN0ZW5lcnMnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfYnJvYWRjYXN0X2xvZyc6ICAgIHJldHVybiB0aGlzLmdldEJyb2FkY2FzdExvZyhhcmdzLmxpbWl0LCBhcmdzLm1lc3NhZ2VUeXBlKTtcclxuICAgICAgICAgICAgY2FzZSAnbGlzdGVuX2Jyb2FkY2FzdCc6ICAgICByZXR1cm4gdGhpcy5saXN0ZW5Ccm9hZGNhc3QoYXJncy5tZXNzYWdlVHlwZSk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0b3BfbGlzdGVuaW5nJzogICAgICAgcmV0dXJuIHRoaXMuc3RvcExpc3RlbmluZyhhcmdzLm1lc3NhZ2VUeXBlKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xlYXJfYnJvYWRjYXN0X2xvZyc6ICByZXR1cm4gdGhpcy5jbGVhckJyb2FkY2FzdExvZygpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfYWN0aXZlX2xpc3RlbmVycyc6IHJldHVybiB0aGlzLmdldEFjdGl2ZUxpc3RlbmVycygpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEJyb2FkY2FzdExpc3RlbmVycygpOiB2b2lkIHtcclxuICAgICAgICAvLyBQcmUtcmVnaXN0ZXIgbGlzdGVuZXJzIGZvciBrZXkgZWRpdG9yIGxpZmVjeWNsZSBldmVudHNcclxuICAgICAgICBjb25zdCBpbXBvcnRhbnRNZXNzYWdlcyA9IFtcclxuICAgICAgICAgICAgJ2J1aWxkLXdvcmtlcjpyZWFkeScsICdidWlsZC13b3JrZXI6Y2xvc2VkJyxcclxuICAgICAgICAgICAgJ3NjZW5lOnJlYWR5JywgJ3NjZW5lOmNsb3NlJyxcclxuICAgICAgICAgICAgJ3NjZW5lOmxpZ2h0LXByb2JlLWVkaXQtbW9kZS1jaGFuZ2VkJyxcclxuICAgICAgICAgICAgJ3NjZW5lOmxpZ2h0LXByb2JlLWJvdW5kaW5nLWJveC1lZGl0LW1vZGUtY2hhbmdlZCcsXHJcbiAgICAgICAgICAgICdhc3NldC1kYjpyZWFkeScsICdhc3NldC1kYjpjbG9zZScsXHJcbiAgICAgICAgICAgICdhc3NldC1kYjphc3NldC1hZGQnLCAnYXNzZXQtZGI6YXNzZXQtY2hhbmdlJywgJ2Fzc2V0LWRiOmFzc2V0LWRlbGV0ZSdcclxuICAgICAgICBdO1xyXG4gICAgICAgIGltcG9ydGFudE1lc3NhZ2VzLmZvckVhY2godCA9PiB0aGlzLnJlZ2lzdGVyTGlzdGVuZXIodCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVnaXN0ZXJMaXN0ZW5lcihtZXNzYWdlVHlwZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lZFR5cGVzLmFkZChtZXNzYWdlVHlwZSk7XHJcbiAgICAgICAgLy8gRWRpdG9yLk1lc3NhZ2Uub24gaXMgbm90IHVuaXZlcnNhbGx5IGF2YWlsYWJsZTsgbWVzc2FnZSB0eXBlcyBhcmUgdHJhY2tlZCBmb3IgZnV0dXJlIHVzZS5cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEJyb2FkY2FzdExvZyhsaW1pdDogbnVtYmVyID0gNTAsIG1lc3NhZ2VUeXBlPzogc3RyaW5nKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IG1lc3NhZ2VUeXBlXHJcbiAgICAgICAgICAgID8gdGhpcy5tZXNzYWdlTG9nLmZpbHRlcihlID0+IGUubWVzc2FnZSA9PT0gbWVzc2FnZVR5cGUpXHJcbiAgICAgICAgICAgIDogdGhpcy5tZXNzYWdlTG9nO1xyXG5cclxuICAgICAgICBjb25zdCByZWNlbnQgPSBmaWx0ZXJlZC5zbGljZSgtbGltaXQpLm1hcChlID0+ICh7XHJcbiAgICAgICAgICAgIC4uLmUsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoZS50aW1lc3RhbXApLnRvSVNPU3RyaW5nKClcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGxvZzogcmVjZW50LFxyXG4gICAgICAgICAgICAgICAgY291bnQ6IHJlY2VudC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbENvdW50OiBmaWx0ZXJlZC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IG1lc3NhZ2VUeXBlID8/ICdhbGwnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbGlzdGVuQnJvYWRjYXN0KG1lc3NhZ2VUeXBlOiBzdHJpbmcpOiBUb29sUmVzcG9uc2Uge1xyXG4gICAgICAgIGNvbnN0IGFscmVhZHlSZWdpc3RlcmVkID0gdGhpcy5saXN0ZW5lZFR5cGVzLmhhcyhtZXNzYWdlVHlwZSk7XHJcbiAgICAgICAgaWYgKCFhbHJlYWR5UmVnaXN0ZXJlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXIobWVzc2FnZVR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlVHlwZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFscmVhZHlSZWdpc3RlcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgPyBgQWxyZWFkeSBsaXN0ZW5pbmcgZm9yIGJyb2FkY2FzdDogJHttZXNzYWdlVHlwZX1gXHJcbiAgICAgICAgICAgICAgICAgICAgOiBgU3RhcnRlZCBsaXN0ZW5pbmcgZm9yIGJyb2FkY2FzdDogJHttZXNzYWdlVHlwZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RvcExpc3RlbmluZyhtZXNzYWdlVHlwZTogc3RyaW5nKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICBjb25zdCB3YXNSZWdpc3RlcmVkID0gdGhpcy5saXN0ZW5lZFR5cGVzLmRlbGV0ZShtZXNzYWdlVHlwZSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB3YXNSZWdpc3RlcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgPyBgU3RvcHBlZCBsaXN0ZW5pbmcgZm9yIGJyb2FkY2FzdDogJHttZXNzYWdlVHlwZX1gXHJcbiAgICAgICAgICAgICAgICAgICAgOiBgV2FzIG5vdCBsaXN0ZW5pbmcgZm9yIGJyb2FkY2FzdDogJHttZXNzYWdlVHlwZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2xlYXJCcm9hZGNhc3RMb2coKTogVG9vbFJlc3BvbnNlIHtcclxuICAgICAgICBjb25zdCBjbGVhcmVkQ291bnQgPSB0aGlzLm1lc3NhZ2VMb2cubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZUxvZyA9IFtdO1xyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgY2xlYXJlZENvdW50IH0gfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEFjdGl2ZUxpc3RlbmVycygpOiBUb29sUmVzcG9uc2Uge1xyXG4gICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IEFycmF5LmZyb20odGhpcy5saXN0ZW5lZFR5cGVzKS5tYXAobWVzc2FnZVR5cGUgPT4gKHsgbWVzc2FnZVR5cGUgfSkpO1xyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgbGlzdGVuZXJzLCBjb3VudDogbGlzdGVuZXJzLmxlbmd0aCB9IH07XHJcbiAgICB9XHJcbn1cclxuIl19