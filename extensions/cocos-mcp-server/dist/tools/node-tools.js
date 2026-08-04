"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const component_tools_1 = require("./component-tools");
class NodeTools {
    constructor() {
        this.componentTools = new component_tools_1.ComponentTools();
    }
    getTools() {
        return [
            {
                name: 'create_node',
                description: 'Create a new node in the scene. Supports creating empty nodes, nodes with components, or instantiating from assets (prefabs, etc.). IMPORTANT: You should always provide parentUuid to specify where to create the node.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Node name'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID. STRONGLY RECOMMENDED: Always provide this parameter. Use get_current_scene or get_all_nodes to find parent UUIDs. If not provided, node will be created at scene root.'
                        },
                        nodeType: {
                            type: 'string',
                            description: 'Node type: Node, 2DNode, 3DNode',
                            enum: ['Node', '2DNode', '3DNode'],
                            default: 'Node'
                        },
                        siblingIndex: {
                            type: 'number',
                            description: 'Sibling index for ordering (-1 means append at end)',
                            default: -1
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Asset UUID to instantiate from (e.g., prefab UUID). When provided, creates a node instance from the asset instead of an empty node.'
                        },
                        assetPath: {
                            type: 'string',
                            description: 'Asset path to instantiate from (e.g., "db://assets/prefabs/MyPrefab.prefab"). Alternative to assetUuid.'
                        },
                        components: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of component type names to add to the new node (e.g., ["cc.Sprite", "cc.Button"])'
                        },
                        unlinkPrefab: {
                            type: 'boolean',
                            description: 'If true and creating from prefab, unlink from prefab to create a regular node',
                            default: false
                        },
                        keepWorldTransform: {
                            type: 'boolean',
                            description: 'Whether to keep world transform when creating the node',
                            default: false
                        },
                        initialTransform: {
                            type: 'object',
                            properties: {
                                position: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                rotation: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                scale: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                }
                            },
                            description: 'Initial transform to apply to the created node'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_node_info',
                description: 'Get node information by UUID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'find_nodes',
                description: 'Find nodes by name pattern',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'Name pattern to search'
                        },
                        exactMatch: {
                            type: 'boolean',
                            description: 'Exact match or partial match',
                            default: false
                        }
                    },
                    required: ['pattern']
                }
            },
            {
                name: 'find_node_by_name',
                description: 'Find first node by exact name',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Node name to find'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_all_nodes',
                description: 'Get all nodes in the scene with their UUIDs',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'set_node_property',
                description: 'Set node property value (prefer using set_node_transform for active/layer/mobility/position/rotation/scale)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        property: {
                            type: 'string',
                            description: 'Property name (e.g., active, name, layer)'
                        },
                        value: {
                            description: 'Property value'
                        }
                    },
                    required: ['uuid', 'property', 'value']
                }
            },
            {
                name: 'set_node_transform',
                description: 'Set node transform properties (position, rotation, scale) with unified interface. Automatically handles 2D/3D node differences.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        position: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z coordinate (ignored for 2D nodes)' }
                            },
                            description: 'Node position. For 2D nodes, only x,y are used; z is ignored. For 3D nodes, all coordinates are used.'
                        },
                        rotation: {
                            type: 'object',
                            properties: {
                                x: { type: 'number', description: 'X rotation (ignored for 2D nodes)' },
                                y: { type: 'number', description: 'Y rotation (ignored for 2D nodes)' },
                                z: { type: 'number', description: 'Z rotation (main rotation axis for 2D nodes)' }
                            },
                            description: 'Node rotation in euler angles. For 2D nodes, only z rotation is used. For 3D nodes, all axes are used.'
                        },
                        scale: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z scale (usually 1 for 2D nodes)' }
                            },
                            description: 'Node scale. For 2D nodes, z is typically 1. For 3D nodes, all axes are used.'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'delete_node',
                description: 'Delete a node from scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to delete'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'move_node',
                description: 'Move node to new parent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID to move'
                        },
                        newParentUuid: {
                            type: 'string',
                            description: 'New parent node UUID'
                        },
                        siblingIndex: {
                            type: 'number',
                            description: 'Sibling index in new parent',
                            default: -1
                        }
                    },
                    required: ['nodeUuid', 'newParentUuid']
                }
            },
            {
                name: 'duplicate_node',
                description: 'Duplicate a node',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to duplicate'
                        },
                        includeChildren: {
                            type: 'boolean',
                            description: 'Include children nodes',
                            default: true
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'detect_node_type',
                description: 'Detect if a node is 2D or 3D based on its components and properties',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to analyze'
                        }
                    },
                    required: ['uuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'create_node':
                return await this.createNode(args);
            case 'get_node_info':
                return await this.getNodeInfo(args.uuid);
            case 'find_nodes':
                return await this.findNodes(args.pattern, args.exactMatch);
            case 'find_node_by_name':
                return await this.findNodeByName(args.name);
            case 'get_all_nodes':
                return await this.getAllNodes();
            case 'set_node_property':
                return await this.setNodeProperty(args.uuid, args.property, args.value);
            case 'set_node_transform':
                return await this.setNodeTransform(args);
            case 'delete_node':
                return await this.deleteNode(args.uuid);
            case 'move_node':
                return await this.moveNode(args.nodeUuid, args.newParentUuid, args.siblingIndex);
            case 'duplicate_node':
                return await this.duplicateNode(args.uuid, args.includeChildren);
            case 'detect_node_type':
                return await this.detectNodeType(args.uuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async createNode(args) {
        return new Promise(async (resolve) => {
            try {
                let targetParentUuid = args.parentUuid;
                // Fall back to scene root if no parent UUID provided
                if (!targetParentUuid) {
                    try {
                        const sceneInfo = await Editor.Message.request('scene', 'query-node-tree');
                        if (sceneInfo && typeof sceneInfo === 'object' && !Array.isArray(sceneInfo) && Object.prototype.hasOwnProperty.call(sceneInfo, 'uuid')) {
                            targetParentUuid = sceneInfo.uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        }
                        else if (Array.isArray(sceneInfo) && sceneInfo.length > 0 && sceneInfo[0].uuid) {
                            targetParentUuid = sceneInfo[0].uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        }
                        else {
                            const currentScene = await Editor.Message.request('scene', 'query-current-scene');
                            if (currentScene && currentScene.uuid) {
                                targetParentUuid = currentScene.uuid;
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to get scene root, will use default behavior');
                    }
                }
                // Resolve assetPath to UUID if provided
                let finalAssetUuid = args.assetUuid;
                if (args.assetPath && !finalAssetUuid) {
                    try {
                        const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.assetPath);
                        if (assetInfo && assetInfo.uuid) {
                            finalAssetUuid = assetInfo.uuid;
                            console.log(`Asset path '${args.assetPath}' resolved to UUID: ${finalAssetUuid}`);
                        }
                        else {
                            resolve({
                                success: false,
                                error: `Asset not found at path: ${args.assetPath}`
                            });
                            return;
                        }
                    }
                    catch (err) {
                        resolve({
                            success: false,
                            error: `Failed to resolve asset path '${args.assetPath}': ${err}`
                        });
                        return;
                    }
                }
                // Build create-node options
                const createNodeOptions = {
                    name: args.name
                };
                // Set parent node
                if (targetParentUuid) {
                    createNodeOptions.parent = targetParentUuid;
                }
                // Instantiate from asset
                if (finalAssetUuid) {
                    createNodeOptions.assetUuid = finalAssetUuid;
                    if (args.unlinkPrefab) {
                        createNodeOptions.unlinkPrefab = true;
                    }
                }
                // Add components
                if (args.components && args.components.length > 0) {
                    createNodeOptions.components = args.components;
                }
                else if (args.nodeType && args.nodeType !== 'Node' && !finalAssetUuid) {
                    // Only add nodeType component when not instantiating from asset
                    createNodeOptions.components = [args.nodeType];
                }
                // Preserve world transform
                if (args.keepWorldTransform) {
                    createNodeOptions.keepWorldTransform = true;
                }
                // Apply initial transform after creation via set_node_transform
                console.log('Creating node with options:', createNodeOptions);
                // Create the node
                const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // Handle sibling index positioning
                if (args.siblingIndex !== undefined && args.siblingIndex >= 0 && uuid && targetParentUuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for internal state to settle
                        await Editor.Message.request('scene', 'set-parent', {
                            parent: targetParentUuid,
                            uuids: [uuid],
                            keepWorldTransform: args.keepWorldTransform || false
                        });
                    }
                    catch (err) {
                        console.warn('Failed to set sibling index:', err);
                    }
                }
                // Add components if specified
                if (args.components && args.components.length > 0 && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for node creation to complete
                        for (const componentType of args.components) {
                            try {
                                const result = await this.componentTools.execute('add_component', {
                                    nodeUuid: uuid,
                                    componentType: componentType
                                });
                                if (result.success) {
                                    console.log(`Component ${componentType} added successfully`);
                                }
                                else {
                                    console.warn(`Failed to add component ${componentType}:`, result.error);
                                }
                            }
                            catch (err) {
                                console.warn(`Failed to add component ${componentType}:`, err);
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to add components:', err);
                    }
                }
                // Apply initial transform if provided
                if (args.initialTransform && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 150)); // Wait for node and components to be ready
                        await this.setNodeTransform({
                            uuid: uuid,
                            position: args.initialTransform.position,
                            rotation: args.initialTransform.rotation,
                            scale: args.initialTransform.scale
                        });
                        console.log('Initial transform applied successfully');
                    }
                    catch (err) {
                        console.warn('Failed to set initial transform:', err);
                    }
                }
                // Fetch created node info for verification
                let verificationData = null;
                try {
                    const nodeInfo = await this.getNodeInfo(uuid);
                    if (nodeInfo.success) {
                        verificationData = {
                            nodeInfo: nodeInfo.data,
                            creationDetails: {
                                parentUuid: targetParentUuid,
                                nodeType: args.nodeType || 'Node',
                                fromAsset: !!finalAssetUuid,
                                assetUuid: finalAssetUuid,
                                assetPath: args.assetPath,
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                }
                catch (err) {
                    console.warn('Failed to get verification data:', err);
                }
                const successMessage = finalAssetUuid
                    ? `Node '${args.name}' instantiated from asset successfully`
                    : `Node '${args.name}' created successfully`;
                resolve({
                    success: true,
                    data: {
                        uuid: uuid,
                        name: args.name,
                        parentUuid: targetParentUuid,
                        nodeType: args.nodeType || 'Node',
                        fromAsset: !!finalAssetUuid,
                        assetUuid: finalAssetUuid,
                        message: successMessage
                    },
                    verificationData: verificationData
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to create node: ${err.message}. Args: ${JSON.stringify(args)}`
                });
            }
        });
    }
    async getNodeInfo(uuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node', uuid).then((nodeData) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: 'Node not found or invalid response'
                    });
                    return;
                }
                // Parse node info from actual returned data structure
                const info = {
                    uuid: ((_a = nodeData.uuid) === null || _a === void 0 ? void 0 : _a.value) || uuid,
                    name: ((_b = nodeData.name) === null || _b === void 0 ? void 0 : _b.value) || 'Unknown',
                    active: ((_c = nodeData.active) === null || _c === void 0 ? void 0 : _c.value) !== undefined ? nodeData.active.value : true,
                    position: ((_d = nodeData.position) === null || _d === void 0 ? void 0 : _d.value) || { x: 0, y: 0, z: 0 },
                    rotation: ((_e = nodeData.rotation) === null || _e === void 0 ? void 0 : _e.value) || { x: 0, y: 0, z: 0 },
                    scale: ((_f = nodeData.scale) === null || _f === void 0 ? void 0 : _f.value) || { x: 1, y: 1, z: 1 },
                    parent: ((_h = (_g = nodeData.parent) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.uuid) || null,
                    children: nodeData.children || [],
                    components: (nodeData.__comps__ || []).map((comp) => ({
                        type: comp.__type__ || 'Unknown',
                        enabled: comp.enabled !== undefined ? comp.enabled : true
                    })),
                    layer: ((_j = nodeData.layer) === null || _j === void 0 ? void 0 : _j.value) || 1073741824,
                    mobility: ((_k = nodeData.mobility) === null || _k === void 0 ? void 0 : _k.value) || 0
                };
                resolve({ success: true, data: info });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async findNodes(pattern, exactMatch = false) {
        return new Promise((resolve) => {
            // Note: 'query-nodes-by-name' API doesn't exist in official documentation
            // Using tree traversal as primary approach
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const nodes = [];
                const searchTree = (node, currentPath = '') => {
                    const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
                    const matches = exactMatch ?
                        node.name === pattern :
                        node.name.toLowerCase().includes(pattern.toLowerCase());
                    if (matches) {
                        nodes.push({
                            uuid: node.uuid,
                            name: node.name,
                            path: nodePath
                        });
                    }
                    if (node.children) {
                        for (const child of node.children) {
                            searchTree(child, nodePath);
                        }
                    }
                };
                if (tree) {
                    searchTree(tree);
                }
                resolve({ success: true, data: nodes });
            }).catch((err) => {
                // Fallback: use scene script
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'findNodes',
                    args: [pattern, exactMatch]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Tree search failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async findNodeByName(name) {
        return new Promise((resolve) => {
            // Prefer Editor API for node tree queries
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const foundNode = this.searchNodeInTree(tree, name);
                if (foundNode) {
                    resolve({
                        success: true,
                        data: {
                            uuid: foundNode.uuid,
                            name: foundNode.name,
                            path: this.getNodePath(foundNode)
                        }
                    });
                }
                else {
                    resolve({ success: false, error: `Node '${name}' not found` });
                }
            }).catch((err) => {
                // Fallback: use scene script
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'findNodeByName',
                    args: [name]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    searchNodeInTree(node, targetName) {
        if (node.name === targetName) {
            return node;
        }
        if (node.children) {
            for (const child of node.children) {
                const found = this.searchNodeInTree(child, targetName);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    async getAllNodes() {
        return new Promise((resolve) => {
            // Query scene node tree
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const nodes = [];
                const traverseTree = (node) => {
                    nodes.push({
                        uuid: node.uuid,
                        name: node.name,
                        type: node.type,
                        active: node.active,
                        path: this.getNodePath(node)
                    });
                    if (node.children) {
                        for (const child of node.children) {
                            traverseTree(child);
                        }
                    }
                };
                if (tree && tree.children) {
                    traverseTree(tree);
                }
                resolve({
                    success: true,
                    data: {
                        totalNodes: nodes.length,
                        nodes: nodes
                    }
                });
            }).catch((err) => {
                // Fallback: use scene script
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getAllNodes',
                    args: []
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    getNodePath(node) {
        const path = [node.name];
        let current = node.parent;
        while (current && current.name !== 'Canvas') {
            path.unshift(current.name);
            current = current.parent;
        }
        return path.join('/');
    }
    async setNodeProperty(uuid, property, value) {
        return new Promise((resolve) => {
            // Attempt to set node property via Editor API
            Editor.Message.request('scene', 'set-property', {
                uuid: uuid,
                path: property,
                dump: {
                    value: value
                }
            }).then(() => {
                // Get comprehensive verification data including updated node info
                this.getNodeInfo(uuid).then((nodeInfo) => {
                    resolve({
                        success: true,
                        message: `Property '${property}' updated successfully`,
                        data: {
                            nodeUuid: uuid,
                            property: property,
                            newValue: value
                        },
                        verificationData: {
                            nodeInfo: nodeInfo.data,
                            changeDetails: {
                                property: property,
                                value: value,
                                timestamp: new Date().toISOString()
                            }
                        }
                    });
                }).catch(() => {
                    resolve({
                        success: true,
                        message: `Property '${property}' updated successfully (verification failed)`
                    });
                });
            }).catch((err) => {
                // Fallback to scene script if direct API fails
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'setNodeProperty',
                    args: [uuid, property, value]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async setNodeTransform(args) {
        return new Promise(async (resolve) => {
            const { uuid, position, rotation, scale } = args;
            const updatePromises = [];
            const updates = [];
            const warnings = [];
            try {
                // First get node info to determine if it's 2D or 3D
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2DNode = this.is2DNode(nodeInfo);
                if (position) {
                    const normalizedPosition = this.normalizeTransformValue(position, 'position', is2DNode);
                    if (normalizedPosition.warning) {
                        warnings.push(normalizedPosition.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: normalizedPosition.value }
                    }));
                    updates.push('position');
                }
                if (rotation) {
                    const normalizedRotation = this.normalizeTransformValue(rotation, 'rotation', is2DNode);
                    if (normalizedRotation.warning) {
                        warnings.push(normalizedRotation.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'rotation',
                        dump: { value: normalizedRotation.value }
                    }));
                    updates.push('rotation');
                }
                if (scale) {
                    const normalizedScale = this.normalizeTransformValue(scale, 'scale', is2DNode);
                    if (normalizedScale.warning) {
                        warnings.push(normalizedScale.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'scale',
                        dump: { value: normalizedScale.value }
                    }));
                    updates.push('scale');
                }
                if (updatePromises.length === 0) {
                    resolve({ success: false, error: 'No transform properties specified' });
                    return;
                }
                await Promise.all(updatePromises);
                // Verify the changes by getting updated node info
                const updatedNodeInfo = await this.getNodeInfo(uuid);
                const response = {
                    success: true,
                    message: `Transform properties updated: ${updates.join(', ')} ${is2DNode ? '(2D node)' : '(3D node)'}`,
                    updatedProperties: updates,
                    data: {
                        nodeUuid: uuid,
                        nodeType: is2DNode ? '2D' : '3D',
                        appliedChanges: updates,
                        transformConstraints: {
                            position: is2DNode ? 'x, y only (z ignored)' : 'x, y, z all used',
                            rotation: is2DNode ? 'z only (x, y ignored)' : 'x, y, z all used',
                            scale: is2DNode ? 'x, y main, z typically 1' : 'x, y, z all used'
                        }
                    },
                    verificationData: {
                        nodeInfo: updatedNodeInfo.data,
                        transformDetails: {
                            originalNodeType: is2DNode ? '2D' : '3D',
                            appliedTransforms: updates,
                            timestamp: new Date().toISOString()
                        },
                        beforeAfterComparison: {
                            before: nodeInfo,
                            after: updatedNodeInfo.data
                        }
                    }
                };
                if (warnings.length > 0) {
                    response.warning = warnings.join('; ');
                }
                resolve(response);
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to update transform: ${err.message}`
                });
            }
        });
    }
    is2DNode(nodeInfo) {
        // Check if node has 2D-specific components or is under Canvas
        const components = nodeInfo.components || [];
        // Check for common 2D components
        const has2DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
            comp.type.includes('cc.Label') ||
            comp.type.includes('cc.Button') ||
            comp.type.includes('cc.Layout') ||
            comp.type.includes('cc.Widget') ||
            comp.type.includes('cc.Mask') ||
            comp.type.includes('cc.Graphics')));
        if (has2DComponents) {
            return true;
        }
        // Check for 3D-specific components  
        const has3DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
            comp.type.includes('cc.Camera') ||
            comp.type.includes('cc.Light') ||
            comp.type.includes('cc.DirectionalLight') ||
            comp.type.includes('cc.PointLight') ||
            comp.type.includes('cc.SpotLight')));
        if (has3DComponents) {
            return false;
        }
        // Default heuristic: if z position is 0 and hasn't been changed, likely 2D
        const position = nodeInfo.position;
        if (position && Math.abs(position.z) < 0.001) {
            return true;
        }
        // Default to 3D if uncertain
        return false;
    }
    normalizeTransformValue(value, type, is2D) {
        const result = Object.assign({}, value);
        let warning;
        if (is2D) {
            switch (type) {
                case 'position':
                    if (value.z !== undefined && Math.abs(value.z) > 0.001) {
                        warning = `2D node: z position (${value.z}) ignored, set to 0`;
                        result.z = 0;
                    }
                    else if (value.z === undefined) {
                        result.z = 0;
                    }
                    break;
                case 'rotation':
                    if ((value.x !== undefined && Math.abs(value.x) > 0.001) ||
                        (value.y !== undefined && Math.abs(value.y) > 0.001)) {
                        warning = `2D node: x,y rotations ignored, only z rotation applied`;
                        result.x = 0;
                        result.y = 0;
                    }
                    else {
                        result.x = result.x || 0;
                        result.y = result.y || 0;
                    }
                    result.z = result.z || 0;
                    break;
                case 'scale':
                    if (value.z === undefined) {
                        result.z = 1; // Default scale for 2D
                    }
                    break;
            }
        }
        else {
            // 3D node - ensure all axes are defined
            result.x = result.x !== undefined ? result.x : (type === 'scale' ? 1 : 0);
            result.y = result.y !== undefined ? result.y : (type === 'scale' ? 1 : 0);
            result.z = result.z !== undefined ? result.z : (type === 'scale' ? 1 : 0);
        }
        return { value: result, warning };
    }
    async deleteNode(uuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'remove-node', { uuid: uuid }).then(() => {
                resolve({
                    success: true,
                    message: 'Node deleted successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async moveNode(nodeUuid, newParentUuid, siblingIndex = -1) {
        return new Promise((resolve) => {
            // Use correct set-parent API instead of move-node
            Editor.Message.request('scene', 'set-parent', {
                parent: newParentUuid,
                uuids: [nodeUuid],
                keepWorldTransform: false
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Node moved successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async duplicateNode(uuid, includeChildren = true) {
        return new Promise((resolve) => {
            // Note: includeChildren parameter is accepted for future use but not currently implemented
            Editor.Message.request('scene', 'duplicate-node', uuid).then((result) => {
                resolve({
                    success: true,
                    data: {
                        newUuid: result.uuid,
                        message: 'Node duplicated successfully'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async detectNodeType(uuid) {
        return new Promise(async (resolve) => {
            try {
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2D = this.is2DNode(nodeInfo);
                const components = nodeInfo.components || [];
                // Collect detection reasons
                const detectionReasons = [];
                // Check for 2D components
                const twoDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
                    comp.type.includes('cc.Label') ||
                    comp.type.includes('cc.Button') ||
                    comp.type.includes('cc.Layout') ||
                    comp.type.includes('cc.Widget') ||
                    comp.type.includes('cc.Mask') ||
                    comp.type.includes('cc.Graphics')));
                // Check for 3D components
                const threeDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
                    comp.type.includes('cc.Camera') ||
                    comp.type.includes('cc.Light') ||
                    comp.type.includes('cc.DirectionalLight') ||
                    comp.type.includes('cc.PointLight') ||
                    comp.type.includes('cc.SpotLight')));
                if (twoDComponents.length > 0) {
                    detectionReasons.push(`Has 2D components: ${twoDComponents.map((c) => c.type).join(', ')}`);
                }
                if (threeDComponents.length > 0) {
                    detectionReasons.push(`Has 3D components: ${threeDComponents.map((c) => c.type).join(', ')}`);
                }
                // Check position for heuristic
                const position = nodeInfo.position;
                if (position && Math.abs(position.z) < 0.001) {
                    detectionReasons.push('Z position is ~0 (likely 2D)');
                }
                else if (position && Math.abs(position.z) > 0.001) {
                    detectionReasons.push(`Z position is ${position.z} (likely 3D)`);
                }
                if (detectionReasons.length === 0) {
                    detectionReasons.push('No specific indicators found, defaulting based on heuristics');
                }
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        nodeName: nodeInfo.name,
                        nodeType: is2D ? '2D' : '3D',
                        detectionReasons: detectionReasons,
                        components: components.map((comp) => ({
                            type: comp.type,
                            category: this.getComponentCategory(comp.type)
                        })),
                        position: nodeInfo.position,
                        transformConstraints: {
                            position: is2D ? 'x, y only (z ignored)' : 'x, y, z all used',
                            rotation: is2D ? 'z only (x, y ignored)' : 'x, y, z all used',
                            scale: is2D ? 'x, y main, z typically 1' : 'x, y, z all used'
                        }
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to detect node type: ${err.message}`
                });
            }
        });
    }
    getComponentCategory(componentType) {
        if (!componentType)
            return 'unknown';
        if (componentType.includes('cc.Sprite') || componentType.includes('cc.Label') ||
            componentType.includes('cc.Button') || componentType.includes('cc.Layout') ||
            componentType.includes('cc.Widget') || componentType.includes('cc.Mask') ||
            componentType.includes('cc.Graphics')) {
            return '2D';
        }
        if (componentType.includes('cc.MeshRenderer') || componentType.includes('cc.Camera') ||
            componentType.includes('cc.Light') || componentType.includes('cc.DirectionalLight') ||
            componentType.includes('cc.PointLight') || componentType.includes('cc.SpotLight')) {
            return '3D';
        }
        return 'generic';
    }
}
exports.NodeTools = NodeTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVEQUFtRDtBQUVuRCxNQUFhLFNBQVM7SUFBdEI7UUFDWSxtQkFBYyxHQUFHLElBQUksZ0NBQWMsRUFBRSxDQUFDO0lBcWxDbEQsQ0FBQztJQXBsQ0csUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLDBOQUEwTjtnQkFDdk8sV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLFdBQVc7eUJBQzNCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsMExBQTBMO3lCQUMxTTt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLGlDQUFpQzs0QkFDOUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7NEJBQ2xDLE9BQU8sRUFBRSxNQUFNO3lCQUNsQjt3QkFDRCxZQUFZLEVBQUU7NEJBQ1YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFEQUFxRDs0QkFDbEUsT0FBTyxFQUFFLENBQUMsQ0FBQzt5QkFDZDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFJQUFxSTt5QkFDcko7d0JBQ0QsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5R0FBeUc7eUJBQ3pIO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVB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RSxDQUFBLE1BQUEsUUFBUSxDQUFDLElBQUksMENBQUUsS0FBSyxLQUFJLElBQUk7b0JBQ2xDLElBQUksRUFBRSxDQUFBLE1BQUEsUUFBUSxDQUFDLElBQUksMENBQUUsS0FBSyxLQUFJLFNBQVM7b0JBQ3ZDLE1BQU0sRUFBRSxDQUFBLE1BQUEsUUFBUSxDQUFDLE1BQU0sMENBQUUsS0FBSyxNQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUk7b0JBQzNFLFFBQVEsRUFBRSxDQUFBLE1BQUEsUUFBUSxDQUFDLFFBQVEsMENBQUUsS0FBSyxLQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQzFELFFBQVEsRUFBRSxDQUFBLE1BQUEsUUFBUSxDQUFDLFFBQVEsMENBQUUsS0FBSyxLQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQzFELEtBQUssRUFBRSxDQUFBLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsS0FBSyxLQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ3BELE1BQU0sRUFBRSxDQUFBLE1BQUEsTUFBQSxRQUFRLENBQUMsTUFBTSwwQ0FBRSxLQUFLLDBDQUFFLElBQUksS0FBSSxJQUFJO29CQUM1QyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsSUFBSSxFQUFFO29CQUNqQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDdkQsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksU0FBUzt3QkFDaEMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEtBQUss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QUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDeEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1lBQ2hGLGFBQWEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztZQUNuRixhQUFhLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUNwRixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBdGxDRCw4QkFzbENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yLCBOb2RlSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcclxuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL2NvbXBvbmVudC10b29scyc7XHJcblxyXG5leHBvcnQgY2xhc3MgTm9kZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcclxuICAgIHByaXZhdGUgY29tcG9uZW50VG9vbHMgPSBuZXcgQ29tcG9uZW50VG9vbHMoKTtcclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdjcmVhdGVfbm9kZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBub2RlIGluIHRoZSBzY2VuZS4gU3VwcG9ydHMgY3JlYXRpbmcgZW1wdHkgbm9kZXMsIG5vZGVzIHdpdGggY29tcG9uZW50cywgb3IgaW5zdGFudGlhdGluZyBmcm9tIGFzc2V0cyAocHJlZmFicywgZXRjLikuIElNUE9SVEFOVDogWW91IHNob3VsZCBhbHdheXMgcHJvdmlkZSBwYXJlbnRVdWlkIHRvIHNwZWNpZnkgd2hlcmUgdG8gY3JlYXRlIHRoZSBub2RlLicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbmFtZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhcmVudCBub2RlIFVVSUQuIFNUUk9OR0xZIFJFQ09NTUVOREVEOiBBbHdheXMgcHJvdmlkZSB0aGlzIHBhcmFtZXRlci4gVXNlIGdldF9jdXJyZW50X3NjZW5lIG9yIGdldF9hbGxfbm9kZXMgdG8gZmluZCBwYXJlbnQgVVVJRHMuIElmIG5vdCBwcm92aWRlZCwgbm9kZSB3aWxsIGJlIGNyZWF0ZWQgYXQgc2NlbmUgcm9vdC4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSB0eXBlOiBOb2RlLCAyRE5vZGUsIDNETm9kZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ05vZGUnLCAnMkROb2RlJywgJzNETm9kZSddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ05vZGUnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdJbmRleDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NpYmxpbmcgaW5kZXggZm9yIG9yZGVyaW5nICgtMSBtZWFucyBhcHBlbmQgYXQgZW5kKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAtMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVVUlEIHRvIGluc3RhbnRpYXRlIGZyb20gKGUuZy4sIHByZWZhYiBVVUlEKS4gV2hlbiBwcm92aWRlZCwgY3JlYXRlcyBhIG5vZGUgaW5zdGFuY2UgZnJvbSB0aGUgYXNzZXQgaW5zdGVhZCBvZiBhbiBlbXB0eSBub2RlLidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQYXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgcGF0aCB0byBpbnN0YW50aWF0ZSBmcm9tIChlLmcuLCBcImRiOi8vYXNzZXRzL3ByZWZhYnMvTXlQcmVmYWIucHJlZmFiXCIpLiBBbHRlcm5hdGl2ZSB0byBhc3NldFV1aWQuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgY29tcG9uZW50IHR5cGUgbmFtZXMgdG8gYWRkIHRvIHRoZSBuZXcgbm9kZSAoZS5nLiwgW1wiY2MuU3ByaXRlXCIsIFwiY2MuQnV0dG9uXCJdKSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0lmIHRydWUgYW5kIGNyZWF0aW5nIGZyb20gcHJlZmFiLCB1bmxpbmsgZnJvbSBwcmVmYWIgdG8gY3JlYXRlIGEgcmVndWxhciBub2RlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIGtlZXAgd29ybGQgdHJhbnNmb3JtIHdoZW4gY3JlYXRpbmcgdGhlIG5vZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFRyYW5zZm9ybToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luaXRpYWwgdHJhbnNmb3JtIHRvIGFwcGx5IHRvIHRoZSBjcmVhdGVkIG5vZGUnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ25hbWUnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X25vZGVfaW5mbycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBub2RlIGluZm9ybWF0aW9uIGJ5IFVVSUQnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZmluZF9ub2RlcycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbmQgbm9kZXMgYnkgbmFtZSBwYXR0ZXJuJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBwYXR0ZXJuIHRvIHNlYXJjaCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3RNYXRjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGFjdCBtYXRjaCBvciBwYXJ0aWFsIG1hdGNoJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdHRlcm4nXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZmluZF9ub2RlX2J5X25hbWUnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5kIGZpcnN0IG5vZGUgYnkgZXhhY3QgbmFtZScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbmFtZSB0byBmaW5kJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyduYW1lJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hbGxfbm9kZXMnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIG5vZGVzIGluIHRoZSBzY2VuZSB3aXRoIHRoZWlyIFVVSURzJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3NldF9ub2RlX3Byb3BlcnR5JyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgKHByZWZlciB1c2luZyBzZXRfbm9kZV90cmFuc2Zvcm0gZm9yIGFjdGl2ZS9sYXllci9tb2JpbGl0eS9wb3NpdGlvbi9yb3RhdGlvbi9zY2FsZSknLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvcGVydHkgbmFtZSAoZS5nLiwgYWN0aXZlLCBuYW1lLCBsYXllciknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3BlcnR5IHZhbHVlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJywgJ3Byb3BlcnR5JywgJ3ZhbHVlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3NldF9ub2RlX3RyYW5zZm9ybScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NldCBub2RlIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIChwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlKSB3aXRoIHVuaWZpZWQgaW50ZXJmYWNlLiBBdXRvbWF0aWNhbGx5IGhhbmRsZXMgMkQvM0Qgbm9kZSBkaWZmZXJlbmNlcy4nLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWiBjb29yZGluYXRlIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgcG9zaXRpb24uIEZvciAyRCBub2Rlcywgb25seSB4LHkgYXJlIHVzZWQ7IHogaXMgaWdub3JlZC4gRm9yIDNEIG5vZGVzLCBhbGwgY29vcmRpbmF0ZXMgYXJlIHVzZWQuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdYIHJvdGF0aW9uIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdZIHJvdGF0aW9uIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdaIHJvdGF0aW9uIChtYWluIHJvdGF0aW9uIGF4aXMgZm9yIDJEIG5vZGVzKScgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSByb3RhdGlvbiBpbiBldWxlciBhbmdsZXMuIEZvciAyRCBub2Rlcywgb25seSB6IHJvdGF0aW9uIGlzIHVzZWQuIEZvciAzRCBub2RlcywgYWxsIGF4ZXMgYXJlIHVzZWQuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1ogc2NhbGUgKHVzdWFsbHkgMSBmb3IgMkQgbm9kZXMpJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIHNjYWxlLiBGb3IgMkQgbm9kZXMsIHogaXMgdHlwaWNhbGx5IDEuIEZvciAzRCBub2RlcywgYWxsIGF4ZXMgYXJlIHVzZWQuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2RlbGV0ZV9ub2RlJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIGEgbm9kZSBmcm9tIHNjZW5lJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIHRvIGRlbGV0ZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdtb3ZlX25vZGUnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNb3ZlIG5vZGUgdG8gbmV3IHBhcmVudCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gbW92ZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3UGFyZW50VXVpZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05ldyBwYXJlbnQgbm9kZSBVVUlEJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nSW5kZXg6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaWJsaW5nIGluZGV4IGluIG5ldyBwYXJlbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogLTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnbmV3UGFyZW50VXVpZCddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdkdXBsaWNhdGVfbm9kZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0R1cGxpY2F0ZSBhIG5vZGUnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gZHVwbGljYXRlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQ2hpbGRyZW46IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjaGlsZHJlbiBub2RlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZGV0ZWN0X25vZGVfdHlwZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RldGVjdCBpZiBhIG5vZGUgaXMgMkQgb3IgM0QgYmFzZWQgb24gaXRzIGNvbXBvbmVudHMgYW5kIHByb3BlcnRpZXMnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gYW5hbHl6ZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZV9ub2RlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZU5vZGUoYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldF9ub2RlX2luZm8nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Tm9kZUluZm8oYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSAnZmluZF9ub2Rlcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kTm9kZXMoYXJncy5wYXR0ZXJuLCBhcmdzLmV4YWN0TWF0Y2gpO1xyXG4gICAgICAgICAgICBjYXNlICdmaW5kX25vZGVfYnlfbmFtZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kTm9kZUJ5TmFtZShhcmdzLm5hbWUpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfYWxsX25vZGVzJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFsbE5vZGVzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NldF9ub2RlX3Byb3BlcnR5JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldE5vZGVQcm9wZXJ0eShhcmdzLnV1aWQsIGFyZ3MucHJvcGVydHksIGFyZ3MudmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlICdzZXRfbm9kZV90cmFuc2Zvcm0nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0Tm9kZVRyYW5zZm9ybShhcmdzKTtcclxuICAgICAgICAgICAgY2FzZSAnZGVsZXRlX25vZGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVsZXRlTm9kZShhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlICdtb3ZlX25vZGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubW92ZU5vZGUoYXJncy5ub2RlVXVpZCwgYXJncy5uZXdQYXJlbnRVdWlkLCBhcmdzLnNpYmxpbmdJbmRleCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2R1cGxpY2F0ZV9ub2RlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmR1cGxpY2F0ZU5vZGUoYXJncy51dWlkLCBhcmdzLmluY2x1ZGVDaGlsZHJlbik7XHJcbiAgICAgICAgICAgIGNhc2UgJ2RldGVjdF9ub2RlX3R5cGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGV0ZWN0Tm9kZVR5cGUoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGUoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGxldCB0YXJnZXRQYXJlbnRVdWlkID0gYXJncy5wYXJlbnRVdWlkO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsIGJhY2sgdG8gc2NlbmUgcm9vdCBpZiBubyBwYXJlbnQgVVVJRCBwcm92aWRlZFxyXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRQYXJlbnRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2VuZUluZm8gJiYgdHlwZW9mIHNjZW5lSW5mbyA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoc2NlbmVJbmZvKSAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc2NlbmVJbmZvLCAndXVpZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXJlbnRVdWlkID0gKHNjZW5lSW5mbyBhcyBhbnkpLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm8gcGFyZW50IHNwZWNpZmllZCwgdXNpbmcgc2NlbmUgcm9vdDogJHt0YXJnZXRQYXJlbnRVdWlkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVJbmZvKSAmJiBzY2VuZUluZm8ubGVuZ3RoID4gMCAmJiBzY2VuZUluZm9bMF0udXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGFyZW50VXVpZCA9IHNjZW5lSW5mb1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYE5vIHBhcmVudCBzcGVjaWZpZWQsIHVzaW5nIHNjZW5lIHJvb3Q6ICR7dGFyZ2V0UGFyZW50VXVpZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY2VuZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWN1cnJlbnQtc2NlbmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2NlbmUgJiYgY3VycmVudFNjZW5lLnV1aWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXJlbnRVdWlkID0gY3VycmVudFNjZW5lLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gZ2V0IHNjZW5lIHJvb3QsIHdpbGwgdXNlIGRlZmF1bHQgYmVoYXZpb3InKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBhc3NldFBhdGggdG8gVVVJRCBpZiBwcm92aWRlZFxyXG4gICAgICAgICAgICAgICAgbGV0IGZpbmFsQXNzZXRVdWlkID0gYXJncy5hc3NldFV1aWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5hc3NldFBhdGggJiYgIWZpbmFsQXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGFyZ3MuYXNzZXRQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0SW5mbyAmJiBhc3NldEluZm8udXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxBc3NldFV1aWQgPSBhc3NldEluZm8udXVpZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBc3NldCBwYXRoICcke2FyZ3MuYXNzZXRQYXRofScgcmVzb2x2ZWQgdG8gVVVJRDogJHtmaW5hbEFzc2V0VXVpZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgQXNzZXQgbm90IGZvdW5kIGF0IHBhdGg6ICR7YXJncy5hc3NldFBhdGh9YFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc29sdmUgYXNzZXQgcGF0aCAnJHthcmdzLmFzc2V0UGF0aH0nOiAke2Vycn1gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEJ1aWxkIGNyZWF0ZS1ub2RlIG9wdGlvbnNcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZU5vZGVPcHRpb25zOiBhbnkgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgbm9kZVxyXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhcmVudFV1aWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5wYXJlbnQgPSB0YXJnZXRQYXJlbnRVdWlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIGZyb20gYXNzZXRcclxuICAgICAgICAgICAgICAgIGlmIChmaW5hbEFzc2V0VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLmFzc2V0VXVpZCA9IGZpbmFsQXNzZXRVdWlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLnVubGlua1ByZWZhYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy51bmxpbmtQcmVmYWIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50c1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuY29tcG9uZW50cyAmJiBhcmdzLmNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLmNvbXBvbmVudHMgPSBhcmdzLmNvbXBvbmVudHM7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3Mubm9kZVR5cGUgJiYgYXJncy5ub2RlVHlwZSAhPT0gJ05vZGUnICYmICFmaW5hbEFzc2V0VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgYWRkIG5vZGVUeXBlIGNvbXBvbmVudCB3aGVuIG5vdCBpbnN0YW50aWF0aW5nIGZyb20gYXNzZXRcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5jb21wb25lbnRzID0gW2FyZ3Mubm9kZVR5cGVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFByZXNlcnZlIHdvcmxkIHRyYW5zZm9ybVxyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mua2VlcFdvcmxkVHJhbnNmb3JtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMua2VlcFdvcmxkVHJhbnNmb3JtID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBcHBseSBpbml0aWFsIHRyYW5zZm9ybSBhZnRlciBjcmVhdGlvbiB2aWEgc2V0X25vZGVfdHJhbnNmb3JtXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIG5vZGUgd2l0aCBvcHRpb25zOicsIGNyZWF0ZU5vZGVPcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIG5vZGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBjcmVhdGVOb2RlT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gQXJyYXkuaXNBcnJheShub2RlVXVpZCkgPyBub2RlVXVpZFswXSA6IG5vZGVVdWlkO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBzaWJsaW5nIGluZGV4IHBvc2l0aW9uaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5zaWJsaW5nSW5kZXggIT09IHVuZGVmaW5lZCAmJiBhcmdzLnNpYmxpbmdJbmRleCA+PSAwICYmIHV1aWQgJiYgdGFyZ2V0UGFyZW50VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTsgLy8gV2FpdCBmb3IgaW50ZXJuYWwgc3RhdGUgdG8gc2V0dGxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wYXJlbnQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRhcmdldFBhcmVudFV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkczogW3V1aWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiBhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSB8fCBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2V0IHNpYmxpbmcgaW5kZXg6JywgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQWRkIGNvbXBvbmVudHMgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5jb21wb25lbnRzICYmIGFyZ3MuY29tcG9uZW50cy5sZW5ndGggPiAwICYmIHV1aWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7IC8vIFdhaXQgZm9yIG5vZGUgY3JlYXRpb24gdG8gY29tcGxldGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRUeXBlIG9mIGFyZ3MuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNvbXBvbmVudFRvb2xzLmV4ZWN1dGUoJ2FkZF9jb21wb25lbnQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBhZGQgY29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX06YCwgcmVzdWx0LmVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBhZGQgY29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX06YCwgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBhZGQgY29tcG9uZW50czonLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBcHBseSBpbml0aWFsIHRyYW5zZm9ybSBpZiBwcm92aWRlZFxyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuaW5pdGlhbFRyYW5zZm9ybSAmJiB1dWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDE1MCkpOyAvLyBXYWl0IGZvciBub2RlIGFuZCBjb21wb25lbnRzIHRvIGJlIHJlYWR5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0Tm9kZVRyYW5zZm9ybSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFyZ3MuaW5pdGlhbFRyYW5zZm9ybS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBhcmdzLmluaXRpYWxUcmFuc2Zvcm0ucm90YXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogYXJncy5pbml0aWFsVHJhbnNmb3JtLnNjYWxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW5pdGlhbCB0cmFuc2Zvcm0gYXBwbGllZCBzdWNjZXNzZnVsbHknKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2V0IGluaXRpYWwgdHJhbnNmb3JtOicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZldGNoIGNyZWF0ZWQgbm9kZSBpbmZvIGZvciB2ZXJpZmljYXRpb25cclxuICAgICAgICAgICAgICAgIGxldCB2ZXJpZmljYXRpb25EYXRhOiBhbnkgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0Tm9kZUluZm8odXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVJbmZvLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvOiBub2RlSW5mby5kYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25EZXRhaWxzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogdGFyZ2V0UGFyZW50VXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogYXJncy5ub2RlVHlwZSB8fCAnTm9kZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUFzc2V0OiAhIWZpbmFsQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogZmluYWxBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQYXRoOiBhcmdzLmFzc2V0UGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCB2ZXJpZmljYXRpb24gZGF0YTonLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3NNZXNzYWdlID0gZmluYWxBc3NldFV1aWQgXHJcbiAgICAgICAgICAgICAgICAgICAgPyBgTm9kZSAnJHthcmdzLm5hbWV9JyBpbnN0YW50aWF0ZWQgZnJvbSBhc3NldCBzdWNjZXNzZnVsbHlgXHJcbiAgICAgICAgICAgICAgICAgICAgOiBgTm9kZSAnJHthcmdzLm5hbWV9JyBjcmVhdGVkIHN1Y2Nlc3NmdWxseWA7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogdGFyZ2V0UGFyZW50VXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IGFyZ3Mubm9kZVR5cGUgfHwgJ05vZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tQXNzZXQ6ICEhZmluYWxBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogZmluYWxBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1Y2Nlc3NNZXNzYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25EYXRhOiB2ZXJpZmljYXRpb25EYXRhXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGNyZWF0ZSBub2RlOiAke2Vyci5tZXNzYWdlfS4gQXJnczogJHtKU09OLnN0cmluZ2lmeShhcmdzKX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZUluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIHV1aWQpLnRoZW4oKG5vZGVEYXRhOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnTm9kZSBub3QgZm91bmQgb3IgaW52YWxpZCByZXNwb25zZSdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIG5vZGUgaW5mbyBmcm9tIGFjdHVhbCByZXR1cm5lZCBkYXRhIHN0cnVjdHVyZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbzogTm9kZUluZm8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZURhdGEudXVpZD8udmFsdWUgfHwgdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlRGF0YS5uYW1lPy52YWx1ZSB8fCAnVW5rbm93bicsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlRGF0YS5hY3RpdmU/LnZhbHVlICE9PSB1bmRlZmluZWQgPyBub2RlRGF0YS5hY3RpdmUudmFsdWUgOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlRGF0YS5wb3NpdGlvbj8udmFsdWUgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IG5vZGVEYXRhLnJvdGF0aW9uPy52YWx1ZSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzY2FsZTogbm9kZURhdGEuc2NhbGU/LnZhbHVlIHx8IHsgeDogMSwgeTogMSwgejogMSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZURhdGEucGFyZW50Py52YWx1ZT8udXVpZCB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlRGF0YS5jaGlsZHJlbiB8fCBbXSxcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiAobm9kZURhdGEuX19jb21wc19fIHx8IFtdKS5tYXAoKGNvbXA6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC5fX3R5cGVfXyB8fCAnVW5rbm93bicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcC5lbmFibGVkIDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgICAgICAgICBsYXllcjogbm9kZURhdGEubGF5ZXI/LnZhbHVlIHx8IDEwNzM3NDE4MjQsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9iaWxpdHk6IG5vZGVEYXRhLm1vYmlsaXR5Py52YWx1ZSB8fCAwXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGluZm8gfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kTm9kZXMocGF0dGVybjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBOb3RlOiAncXVlcnktbm9kZXMtYnktbmFtZScgQVBJIGRvZXNuJ3QgZXhpc3QgaW4gb2ZmaWNpYWwgZG9jdW1lbnRhdGlvblxyXG4gICAgICAgICAgICAvLyBVc2luZyB0cmVlIHRyYXZlcnNhbCBhcyBwcmltYXJ5IGFwcHJvYWNoXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaFRyZWUgPSAobm9kZTogYW55LCBjdXJyZW50UGF0aDogc3RyaW5nID0gJycpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlUGF0aCA9IGN1cnJlbnRQYXRoID8gYCR7Y3VycmVudFBhdGh9LyR7bm9kZS5uYW1lfWAgOiBub2RlLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGV4YWN0TWF0Y2ggPyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5uYW1lID09PSBwYXR0ZXJuIDogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHBhdHRlcm4udG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBub2RlUGF0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hUcmVlKGNoaWxkLCBub2RlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHJlZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaFRyZWUodHJlZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiB1c2Ugc2NlbmUgc2NyaXB0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1tY3Atc2VydmVyJyxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdmaW5kTm9kZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtwYXR0ZXJuLCBleGFjdE1hdGNoXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBUcmVlIHNlYXJjaCBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9LCBTY2VuZSBzY3JpcHQgZmFpbGVkOiAke2VycjIubWVzc2FnZX1gIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZmluZE5vZGVCeU5hbWUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgLy8gUHJlZmVyIEVkaXRvciBBUEkgZm9yIG5vZGUgdHJlZSBxdWVyaWVzXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmROb2RlID0gdGhpcy5zZWFyY2hOb2RlSW5UcmVlKHRyZWUsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBmb3VuZE5vZGUudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZvdW5kTm9kZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGhpcy5nZXROb2RlUGF0aChmb3VuZE5vZGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJyR7bmFtZX0nIG5vdCBmb3VuZGAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjazogdXNlIHNjZW5lIHNjcmlwdFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnZmluZE5vZGVCeU5hbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtuYW1lXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBEaXJlY3QgQVBJIGZhaWxlZDogJHtlcnIubWVzc2FnZX0sIFNjZW5lIHNjcmlwdCBmYWlsZWQ6ICR7ZXJyMi5tZXNzYWdlfWAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZWFyY2hOb2RlSW5UcmVlKG5vZGU6IGFueSwgdGFyZ2V0TmFtZTogc3RyaW5nKTogYW55IHtcclxuICAgICAgICBpZiAobm9kZS5uYW1lID09PSB0YXJnZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5zZWFyY2hOb2RlSW5UcmVlKGNoaWxkLCB0YXJnZXROYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEFsbE5vZGVzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFF1ZXJ5IHNjZW5lIG5vZGUgdHJlZVxyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cmF2ZXJzZVRyZWUgPSAobm9kZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRoaXMuZ2V0Tm9kZVBhdGgobm9kZSlcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlVHJlZShjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHJlZSAmJiB0cmVlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2VUcmVlKHRyZWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxOb2Rlczogbm9kZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2Rlczogbm9kZXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiB1c2Ugc2NlbmUgc2NyaXB0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1tY3Atc2VydmVyJyxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdnZXRBbGxOb2RlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW11cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywgb3B0aW9ucykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyMjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRGlyZWN0IEFQSSBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9LCBTY2VuZSBzY3JpcHQgZmFpbGVkOiAke2VycjIubWVzc2FnZX1gIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Tm9kZVBhdGgobm9kZTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBwYXRoID0gW25vZGUubmFtZV07XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBub2RlLnBhcmVudDtcclxuICAgICAgICB3aGlsZSAoY3VycmVudCAmJiBjdXJyZW50Lm5hbWUgIT09ICdDYW52YXMnKSB7XHJcbiAgICAgICAgICAgIHBhdGgudW5zaGlmdChjdXJyZW50Lm5hbWUpO1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oJy8nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldE5vZGVQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHNldCBub2RlIHByb3BlcnR5IHZpYSBFZGl0b3IgQVBJXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBwcm9wZXJ0eSxcclxuICAgICAgICAgICAgICAgIGR1bXA6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgY29tcHJlaGVuc2l2ZSB2ZXJpZmljYXRpb24gZGF0YSBpbmNsdWRpbmcgdXBkYXRlZCBub2RlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Tm9kZUluZm8odXVpZCkudGhlbigobm9kZUluZm8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25EYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mbzogbm9kZUluZm8uZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZURldGFpbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHkgKHZlcmlmaWNhdGlvbiBmYWlsZWQpYFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byBzY2VuZSBzY3JpcHQgaWYgZGlyZWN0IEFQSSBmYWlsc1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnc2V0Tm9kZVByb3BlcnR5JyxcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbdXVpZCwgcHJvcGVydHksIHZhbHVlXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBEaXJlY3QgQVBJIGZhaWxlZDogJHtlcnIubWVzc2FnZX0sIFNjZW5lIHNjcmlwdCBmYWlsZWQ6ICR7ZXJyMi5tZXNzYWdlfWAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXROb2RlVHJhbnNmb3JtKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgdXVpZCwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSB9ID0gYXJncztcclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIEZpcnN0IGdldCBub2RlIGluZm8gdG8gZGV0ZXJtaW5lIGlmIGl0J3MgMkQgb3IgM0RcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mb1Jlc3BvbnNlLnN1Y2Nlc3MgfHwgIW5vZGVJbmZvUmVzcG9uc2UuZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IG5vZGUgaW5mb3JtYXRpb24nIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBub2RlSW5mb1Jlc3BvbnNlLmRhdGE7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpczJETm9kZSA9IHRoaXMuaXMyRE5vZGUobm9kZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUG9zaXRpb24gPSB0aGlzLm5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHBvc2l0aW9uLCAncG9zaXRpb24nLCBpczJETm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQb3NpdGlvbi53YXJuaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmdzLnB1c2gobm9ybWFsaXplZFBvc2l0aW9uLndhcm5pbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVQcm9taXNlcy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ3Bvc2l0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IG5vcm1hbGl6ZWRQb3NpdGlvbi52YWx1ZSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ3Bvc2l0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChyb3RhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRSb3RhdGlvbiA9IHRoaXMubm9ybWFsaXplVHJhbnNmb3JtVmFsdWUocm90YXRpb24sICdyb3RhdGlvbicsIGlzMkROb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFJvdGF0aW9uLndhcm5pbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChub3JtYWxpemVkUm90YXRpb24ud2FybmluZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAncm90YXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbm9ybWFsaXplZFJvdGF0aW9uLnZhbHVlIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncm90YXRpb24nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFNjYWxlID0gdGhpcy5ub3JtYWxpemVUcmFuc2Zvcm1WYWx1ZShzY2FsZSwgJ3NjYWxlJywgaXMyRE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkU2NhbGUud2FybmluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKG5vcm1hbGl6ZWRTY2FsZS53YXJuaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdzY2FsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBub3JtYWxpemVkU2NhbGUudmFsdWUgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCdzY2FsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlUHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIHNwZWNpZmllZCcgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh1cGRhdGVQcm9taXNlcyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFZlcmlmeSB0aGUgY2hhbmdlcyBieSBnZXR0aW5nIHVwZGF0ZWQgbm9kZSBpbmZvXHJcbiAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkTm9kZUluZm8gPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2U6IGFueSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBUcmFuc2Zvcm0gcHJvcGVydGllcyB1cGRhdGVkOiAke3VwZGF0ZXMuam9pbignLCAnKX0gJHtpczJETm9kZSA/ICcoMkQgbm9kZSknIDogJygzRCBub2RlKSd9YCxcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkUHJvcGVydGllczogdXBkYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogaXMyRE5vZGUgPyAnMkQnIDogJzNEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbGllZENoYW5nZXM6IHVwZGF0ZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUNvbnN0cmFpbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogaXMyRE5vZGUgPyAneCwgeSBvbmx5ICh6IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBpczJETm9kZSA/ICd6IG9ubHkgKHgsIHkgaWdub3JlZCknIDogJ3gsIHksIHogYWxsIHVzZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGlzMkROb2RlID8gJ3gsIHkgbWFpbiwgeiB0eXBpY2FsbHkgMScgOiAneCwgeSwgeiBhbGwgdXNlZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mbzogdXBkYXRlZE5vZGVJbmZvLmRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybURldGFpbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsTm9kZVR5cGU6IGlzMkROb2RlID8gJzJEJyA6ICczRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBsaWVkVHJhbnNmb3JtczogdXBkYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZUFmdGVyQ29tcGFyaXNvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlOiBub2RlSW5mbyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyOiB1cGRhdGVkTm9kZUluZm8uZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHdhcm5pbmdzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS53YXJuaW5nID0gd2FybmluZ3Muam9pbignOyAnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gdXBkYXRlIHRyYW5zZm9ybTogJHtlcnIubWVzc2FnZX1gIFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlzMkROb2RlKG5vZGVJbmZvOiBhbnkpOiBib29sZWFuIHtcclxuICAgICAgICAvLyBDaGVjayBpZiBub2RlIGhhcyAyRC1zcGVjaWZpYyBjb21wb25lbnRzIG9yIGlzIHVuZGVyIENhbnZhc1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlSW5mby5jb21wb25lbnRzIHx8IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENoZWNrIGZvciBjb21tb24gMkQgY29tcG9uZW50c1xyXG4gICAgICAgIGNvbnN0IGhhczJEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuc29tZSgoY29tcDogYW55KSA9PiBcclxuICAgICAgICAgICAgY29tcC50eXBlICYmIChcclxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuU3ByaXRlJykgfHxcclxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGFiZWwnKSB8fFxyXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5CdXR0b24nKSB8fFxyXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYXlvdXQnKSB8fFxyXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5XaWRnZXQnKSB8fFxyXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NYXNrJykgfHxcclxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuR3JhcGhpY3MnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoaGFzMkRDb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBDaGVjayBmb3IgM0Qtc3BlY2lmaWMgY29tcG9uZW50cyAgXHJcbiAgICAgICAgY29uc3QgaGFzM0RDb21wb25lbnRzID0gY29tcG9uZW50cy5zb21lKChjb21wOiBhbnkpID0+XHJcbiAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXHJcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XHJcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkNhbWVyYScpIHx8XHJcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxpZ2h0JykgfHxcclxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XHJcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlBvaW50TGlnaHQnKSB8fFxyXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcG90TGlnaHQnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoaGFzM0RDb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRGVmYXVsdCBoZXVyaXN0aWM6IGlmIHogcG9zaXRpb24gaXMgMCBhbmQgaGFzbid0IGJlZW4gY2hhbmdlZCwgbGlrZWx5IDJEXHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBub2RlSW5mby5wb3NpdGlvbjtcclxuICAgICAgICBpZiAocG9zaXRpb24gJiYgTWF0aC5hYnMocG9zaXRpb24ueikgPCAwLjAwMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRGVmYXVsdCB0byAzRCBpZiB1bmNlcnRhaW5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBub3JtYWxpemVUcmFuc2Zvcm1WYWx1ZSh2YWx1ZTogYW55LCB0eXBlOiAncG9zaXRpb24nIHwgJ3JvdGF0aW9uJyB8ICdzY2FsZScsIGlzMkQ6IGJvb2xlYW4pOiB7IHZhbHVlOiBhbnksIHdhcm5pbmc/OiBzdHJpbmcgfSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyAuLi52YWx1ZSB9O1xyXG4gICAgICAgIGxldCB3YXJuaW5nOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlzMkQpIHtcclxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdwb3NpdGlvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnogIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS56KSA+IDAuMDAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcgPSBgMkQgbm9kZTogeiBwb3NpdGlvbiAoJHt2YWx1ZS56fSkgaWdub3JlZCwgc2V0IHRvIDBgO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueiA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS56ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3JvdGF0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHZhbHVlLnggIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS54KSA+IDAuMDAxKSB8fCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS55KSA+IDAuMDAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nID0gYDJEIG5vZGU6IHgseSByb3RhdGlvbnMgaWdub3JlZCwgb25seSB6IHJvdGF0aW9uIGFwcGxpZWRgO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueCA9IHJlc3VsdC54IHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gcmVzdWx0LnkgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSByZXN1bHQueiB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2NhbGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS56ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSAxOyAvLyBEZWZhdWx0IHNjYWxlIGZvciAyRFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIDNEIG5vZGUgLSBlbnN1cmUgYWxsIGF4ZXMgYXJlIGRlZmluZWRcclxuICAgICAgICAgICAgcmVzdWx0LnggPSByZXN1bHQueCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnggOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcclxuICAgICAgICAgICAgcmVzdWx0LnkgPSByZXN1bHQueSAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnkgOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcclxuICAgICAgICAgICAgcmVzdWx0LnogPSByZXN1bHQueiAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnogOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHJlc3VsdCwgd2FybmluZyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZGVsZXRlTm9kZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZW1vdmUtbm9kZScsIHsgdXVpZDogdXVpZCB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vZGUgZGVsZXRlZCBzdWNjZXNzZnVsbHknXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIG1vdmVOb2RlKG5vZGVVdWlkOiBzdHJpbmcsIG5ld1BhcmVudFV1aWQ6IHN0cmluZywgc2libGluZ0luZGV4OiBudW1iZXIgPSAtMSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBjb3JyZWN0IHNldC1wYXJlbnQgQVBJIGluc3RlYWQgb2YgbW92ZS1ub2RlXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wYXJlbnQnLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IG5ld1BhcmVudFV1aWQsXHJcbiAgICAgICAgICAgICAgICB1dWlkczogW25vZGVVdWlkXSxcclxuICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogZmFsc2VcclxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdOb2RlIG1vdmVkIHN1Y2Nlc3NmdWxseSdcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZHVwbGljYXRlTm9kZSh1dWlkOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBOb3RlOiBpbmNsdWRlQ2hpbGRyZW4gcGFyYW1ldGVyIGlzIGFjY2VwdGVkIGZvciBmdXR1cmUgdXNlIGJ1dCBub3QgY3VycmVudGx5IGltcGxlbWVudGVkXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2R1cGxpY2F0ZS1ub2RlJywgdXVpZCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdVdWlkOiByZXN1bHQudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vZGUgZHVwbGljYXRlZCBzdWNjZXNzZnVsbHknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkZXRlY3ROb2RlVHlwZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm9SZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0Tm9kZUluZm8odXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvUmVzcG9uc2Uuc3VjY2VzcyB8fCAhbm9kZUluZm9SZXNwb25zZS5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgbm9kZSBpbmZvcm1hdGlvbicgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gbm9kZUluZm9SZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMuaXMyRE5vZGUobm9kZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGVJbmZvLmNvbXBvbmVudHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENvbGxlY3QgZGV0ZWN0aW9uIHJlYXNvbnNcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGVjdGlvblJlYXNvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciAyRCBjb21wb25lbnRzXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0d29EQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKChjb21wOiBhbnkpID0+IFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuU3ByaXRlJykgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuQnV0dG9uJykgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYXlvdXQnKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTWFzaycpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuR3JhcGhpY3MnKVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciAzRCBjb21wb25lbnRzXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aHJlZURDb21wb25lbnRzID0gY29tcG9uZW50cy5maWx0ZXIoKGNvbXA6IGFueSkgPT5cclxuICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuQ2FtZXJhJykgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MaWdodCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuUG9pbnRMaWdodCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuU3BvdExpZ2h0JylcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0d29EQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKGBIYXMgMkQgY29tcG9uZW50czogJHt0d29EQ29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gYy50eXBlKS5qb2luKCcsICcpfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodGhyZWVEQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKGBIYXMgM0QgY29tcG9uZW50czogJHt0aHJlZURDb21wb25lbnRzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpLmpvaW4oJywgJyl9YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHBvc2l0aW9uIGZvciBoZXVyaXN0aWNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbm9kZUluZm8ucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gJiYgTWF0aC5hYnMocG9zaXRpb24ueikgPCAwLjAwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaCgnWiBwb3NpdGlvbiBpcyB+MCAobGlrZWx5IDJEKScpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbiAmJiBNYXRoLmFicyhwb3NpdGlvbi56KSA+IDAuMDAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKGBaIHBvc2l0aW9uIGlzICR7cG9zaXRpb24uen0gKGxpa2VseSAzRClgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGV0ZWN0aW9uUmVhc29ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goJ05vIHNwZWNpZmljIGluZGljYXRvcnMgZm91bmQsIGRlZmF1bHRpbmcgYmFzZWQgb24gaGV1cmlzdGljcycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGVJbmZvLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiBpczJEID8gJzJEJyA6ICczRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnM6IGRldGVjdGlvblJlYXNvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHMubWFwKChjb21wOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjb21wLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogdGhpcy5nZXRDb21wb25lbnRDYXRlZ29yeShjb21wLnR5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGVJbmZvLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Db25zdHJhaW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGlzMkQgPyAneCwgeSBvbmx5ICh6IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBpczJEID8gJ3ogb25seSAoeCwgeSBpZ25vcmVkKScgOiAneCwgeSwgeiBhbGwgdXNlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogaXMyRCA/ICd4LCB5IG1haW4sIHogdHlwaWNhbGx5IDEnIDogJ3gsIHksIHogYWxsIHVzZWQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBkZXRlY3Qgbm9kZSB0eXBlOiAke2Vyci5tZXNzYWdlfWAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50Q2F0ZWdvcnkoY29tcG9uZW50VHlwZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBpZiAoIWNvbXBvbmVudFR5cGUpIHJldHVybiAndW5rbm93bic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLlNwcml0ZScpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkxhYmVsJykgfHwgXHJcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkJ1dHRvbicpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkxheW91dCcpIHx8XHJcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLk1hc2snKSB8fFxyXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5HcmFwaGljcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnMkQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTWVzaFJlbmRlcmVyJykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuQ2FtZXJhJykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTGlnaHQnKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5EaXJlY3Rpb25hbExpZ2h0JykgfHxcclxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuUG9pbnRMaWdodCcpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLlNwb3RMaWdodCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnM0QnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gJ2dlbmVyaWMnO1xyXG4gICAgfVxyXG59Il19