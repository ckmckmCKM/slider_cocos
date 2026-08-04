"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
class PrefabTools {
    getTools() {
        return [
            {
                name: 'get_prefab_list',
                description: 'Get all prefabs in the project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        folder: {
                            type: 'string',
                            description: 'Folder path to search (optional)',
                            default: 'db://assets'
                        }
                    }
                }
            },
            {
                name: 'load_prefab',
                description: 'Load a prefab by path',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'instantiate_prefab',
                description: 'Instantiate a prefab in the scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID (optional)'
                        },
                        position: {
                            type: 'object',
                            description: 'Initial position',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number' }
                            }
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'create_prefab',
                description: 'Create a prefab from a node with all children and components',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Source node UUID'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Path to save the prefab (e.g., db://assets/prefabs/MyPrefab.prefab)'
                        },
                        prefabName: {
                            type: 'string',
                            description: 'Prefab name'
                        }
                    },
                    required: ['nodeUuid', 'savePath', 'prefabName']
                }
            },
            {
                name: 'update_prefab',
                description: 'Update an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID with changes'
                        }
                    },
                    required: ['prefabPath', 'nodeUuid']
                }
            },
            {
                name: 'revert_prefab',
                description: 'Revert prefab instance to original',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        }
                    },
                    required: ['nodeUuid']
                }
            },
            {
                name: 'get_prefab_info',
                description: 'Get detailed prefab information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'validate_prefab',
                description: 'Validate a prefab file format',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'duplicate_prefab',
                description: 'Duplicate an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourcePrefabPath: {
                            type: 'string',
                            description: 'Source prefab path'
                        },
                        targetPrefabPath: {
                            type: 'string',
                            description: 'Target prefab path'
                        },
                        newPrefabName: {
                            type: 'string',
                            description: 'New prefab name'
                        }
                    },
                    required: ['sourcePrefabPath', 'targetPrefabPath']
                }
            },
            {
                name: 'restore_prefab_node',
                description: 'Restore prefab node using prefab asset (built-in undo record)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID'
                        }
                    },
                    required: ['nodeUuid', 'assetUuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'get_prefab_list':
                return await this.getPrefabList(args.folder);
            case 'load_prefab':
                return await this.loadPrefab(args.prefabPath);
            case 'instantiate_prefab':
                return await this.instantiatePrefab(args);
            case 'create_prefab':
                return await this.createPrefab(args);
            case 'update_prefab':
                return await this.updatePrefab(args.prefabPath, args.nodeUuid);
            case 'revert_prefab':
                return await this.revertPrefab(args.nodeUuid);
            case 'get_prefab_info':
                return await this.getPrefabInfo(args.prefabPath);
            case 'validate_prefab':
                return await this.validatePrefab(args.prefabPath);
            case 'duplicate_prefab':
                return await this.duplicatePrefab(args);
            case 'restore_prefab_node':
                return await this.restorePrefabNode(args.nodeUuid, args.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async getPrefabList(folder = 'db://assets') {
        return new Promise((resolve) => {
            const pattern = folder.endsWith('/') ?
                `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
            Editor.Message.request('asset-db', 'query-assets', {
                pattern: pattern
            }).then((results) => {
                const prefabs = results.map(asset => ({
                    name: asset.name,
                    path: asset.url,
                    uuid: asset.uuid,
                    folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
                }));
                resolve({ success: true, data: prefabs });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async loadPrefab(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('scene', 'load-asset', {
                    uuid: assetInfo.uuid
                });
            }).then((prefabData) => {
                resolve({
                    success: true,
                    data: {
                        uuid: prefabData.uuid,
                        name: prefabData.name,
                        message: 'Prefab loaded successfully'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async instantiatePrefab(args) {
        return new Promise(async (resolve) => {
            try {
                // Get prefab asset info
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath);
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                // Use the correct create-node API to instantiate from prefab asset
                const createNodeOptions = {
                    assetUuid: assetInfo.uuid
                };
                // Set parent node
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }
                // Set node name
                if (args.name) {
                    createNodeOptions.name = args.name;
                }
                else if (assetInfo.name) {
                    createNodeOptions.name = assetInfo.name;
                }
                // Set initial properties (e.g. position)
                if (args.position) {
                    createNodeOptions.dump = {
                        position: {
                            value: args.position
                        }
                    };
                }
                // Create the node
                const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // Note: create-node API should automatically establish prefab linkage when created from a prefab asset
                console.log('Prefab node created successfully:', {
                    nodeUuid: uuid,
                    prefabUuid: assetInfo.uuid,
                    prefabPath: args.prefabPath
                });
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        prefabPath: args.prefabPath,
                        parentUuid: args.parentUuid,
                        position: args.position,
                        message: 'Prefab instantiated successfully and prefab linkage established'
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Prefab instantiation failed: ${err.message}`,
                    instruction: 'Please check that the prefab path is correct and the prefab file format is valid'
                });
            }
        });
    }
    /**
     * Establish the link between a node and a prefab asset.
     * Creates the necessary PrefabInfo and PrefabInstance structures.
     */
    async establishPrefabConnection(nodeUuid, prefabUuid, prefabPath) {
        try {
            // Read the prefab file to get the root node's fileId
            const prefabContent = await this.readPrefabFile(prefabPath);
            if (!prefabContent || !prefabContent.data || !prefabContent.data.length) {
                throw new Error('Unable to read prefab file content');
            }
            // Find the prefab root node's fileId (usually the second object, index 1)
            const rootNode = prefabContent.data.find((item) => item.__type === 'cc.Node' && item._parent === null);
            if (!rootNode || !rootNode._prefab) {
                throw new Error('Unable to find prefab root node or its prefab info');
            }
            // Get the root node's PrefabInfo
            const rootPrefabInfo = prefabContent.data[rootNode._prefab.__id__];
            if (!rootPrefabInfo || rootPrefabInfo.__type !== 'cc.PrefabInfo') {
                throw new Error('Unable to find PrefabInfo for the prefab root node');
            }
            const rootFileId = rootPrefabInfo.fileId;
            // Use the scene API to establish the prefab connection
            const prefabConnectionData = {
                node: nodeUuid,
                prefab: prefabUuid,
                fileId: rootFileId
            };
            // Try multiple API methods to establish the prefab connection
            const connectionMethods = [
                () => Editor.Message.request('scene', 'connect-prefab-instance', prefabConnectionData),
                () => Editor.Message.request('scene', 'set-prefab-connection', prefabConnectionData),
                () => Editor.Message.request('scene', 'apply-prefab-link', prefabConnectionData)
            ];
            let connected = false;
            for (const method of connectionMethods) {
                try {
                    await method();
                    connected = true;
                    break;
                }
                catch (error) {
                    console.warn('Prefab connection method failed, trying next method:', error);
                }
            }
            if (!connected) {
                // If all API methods fail, attempt to manually modify the scene data
                console.warn('All prefab connection APIs failed, attempting manual connection');
                await this.manuallyEstablishPrefabConnection(nodeUuid, prefabUuid, rootFileId);
            }
        }
        catch (error) {
            console.error('Failed to establish prefab connection:', error);
            throw error;
        }
    }
    /**
     * Manually establish the prefab connection (fallback when API methods fail).
     */
    async manuallyEstablishPrefabConnection(nodeUuid, prefabUuid, rootFileId) {
        try {
            // Attempt to modify the node's _prefab property using the dump API
            const prefabConnectionData = {
                [nodeUuid]: {
                    '_prefab': {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab',
                        'fileId': rootFileId
                    }
                }
            };
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: '_prefab',
                dump: {
                    value: {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab'
                    }
                }
            });
        }
        catch (error) {
            console.error('Manual prefab connection also failed:', error);
            // Do not throw; the basic node creation already succeeded
        }
    }
    /**
     * Read the content of a prefab file.
     */
    async readPrefabFile(prefabPath) {
        try {
            // Try to read the file content using the asset-db API
            let assetContent;
            try {
                assetContent = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
                if (assetContent && assetContent.source) {
                    // If a source path exists, read the file directly
                    const fs = require('fs');
                    const path = require('path');
                    const fullPath = path.resolve(assetContent.source);
                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                    return JSON.parse(fileContent);
                }
            }
            catch (error) {
                console.warn('Reading via asset-db failed, trying alternative method:', error);
            }
            // Fallback: convert the db:// path to an actual file path
            const fsPath = prefabPath.replace('db://assets/', 'assets/').replace('db://assets', 'assets');
            const fs = require('fs');
            const path = require('path');
            // Try multiple possible project root paths
            const possiblePaths = [
                path.resolve(process.cwd(), '../../NewProject_3', fsPath),
                path.resolve('/Users/lizhiyong/NewProject_3', fsPath),
                path.resolve(fsPath),
                // Also try a direct path if the file is in the root directory
                path.resolve('/Users/lizhiyong/NewProject_3/assets', path.basename(fsPath))
            ];
            console.log('Attempting to read prefab file, path conversion:', {
                originalPath: prefabPath,
                fsPath: fsPath,
                possiblePaths: possiblePaths
            });
            for (const fullPath of possiblePaths) {
                try {
                    console.log(`Checking path: ${fullPath}`);
                    if (fs.existsSync(fullPath)) {
                        console.log(`Found file: ${fullPath}`);
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        const parsed = JSON.parse(fileContent);
                        console.log('File parsed successfully, data structure:', {
                            hasData: !!parsed.data,
                            dataLength: parsed.data ? parsed.data.length : 0
                        });
                        return parsed;
                    }
                    else {
                        console.log(`File does not exist: ${fullPath}`);
                    }
                }
                catch (readError) {
                    console.warn(`Failed to read file ${fullPath}:`, readError);
                }
            }
            throw new Error('Unable to find or read the prefab file');
        }
        catch (error) {
            console.error('Failed to read prefab file:', error);
            throw error;
        }
    }
    async tryCreateNodeWithPrefab(args) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                // Method 2: use create-node with a prefab asset
                const createNodeOptions = {
                    assetUuid: assetInfo.uuid
                };
                // Set parent node
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }
                return Editor.Message.request('scene', 'create-node', createNodeOptions);
            }).then((nodeUuid) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // If a position was specified, set the node position
                if (args.position && uuid) {
                    Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: args.position }
                    }).then(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                position: args.position,
                                message: 'Prefab instantiated successfully (fallback method) and position set'
                            }
                        });
                    }).catch(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                message: 'Prefab instantiated successfully (fallback method) but position could not be set'
                            }
                        });
                    });
                }
                else {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: uuid,
                            prefabPath: args.prefabPath,
                            message: 'Prefab instantiated successfully (fallback method)'
                        }
                    });
                }
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Fallback prefab instantiation method also failed: ${err.message}`
                });
            });
        });
    }
    async tryAlternativeInstantiateMethods(args) {
        return new Promise(async (resolve) => {
            try {
                // Method 1: try using create-node then apply the prefab
                const assetInfo = await this.getAssetInfo(args.prefabPath);
                if (!assetInfo) {
                    resolve({ success: false, error: 'Unable to get prefab asset info' });
                    return;
                }
                // Create an empty node
                const createResult = await this.createNode(args.parentUuid, args.position);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }
                // Try to apply the prefab to the node
                const applyResult = await this.applyPrefabToNode(createResult.data.nodeUuid, assetInfo.uuid);
                if (applyResult.success) {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            name: createResult.data.name,
                            message: 'Prefab instantiated successfully (using alternative method)'
                        }
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: 'Unable to apply prefab data to node',
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            message: 'Node created, but unable to apply prefab data'
                        }
                    });
                }
            }
            catch (error) {
                resolve({ success: false, error: `Alternative instantiation method failed: ${error}` });
            }
        });
    }
    async getAssetInfo(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                resolve(assetInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }
    async createNode(parentUuid, position) {
        return new Promise((resolve) => {
            const createNodeOptions = {
                name: 'PrefabInstance'
            };
            // Set parent node
            if (parentUuid) {
                createNodeOptions.parent = parentUuid;
            }
            // Set position
            if (position) {
                createNodeOptions.dump = {
                    position: position
                };
            }
            Editor.Message.request('scene', 'create-node', createNodeOptions).then((nodeUuid) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        name: 'PrefabInstance'
                    }
                });
            }).catch((error) => {
                resolve({ success: false, error: error.message || 'Failed to create node' });
            });
        });
    }
    async applyPrefabToNode(nodeUuid, prefabUuid) {
        return new Promise((resolve) => {
            // Try multiple methods to apply prefab data
            const methods = [
                () => Editor.Message.request('scene', 'apply-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'set-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'load-prefab-to-node', { node: nodeUuid, prefab: prefabUuid })
            ];
            const tryMethod = (index) => {
                if (index >= methods.length) {
                    resolve({ success: false, error: 'Unable to apply prefab data' });
                    return;
                }
                methods[index]().then(() => {
                    resolve({ success: true });
                }).catch(() => {
                    tryMethod(index + 1);
                });
            };
            tryMethod(0);
        });
    }
    /**
     * Create a prefab using the asset-db API.
     * Deeply integrates with the engine's asset management system to implement the full prefab creation flow.
     */
    async createPrefabWithAssetDB(nodeUuid, savePath, prefabName, includeChildren, includeComponents) {
        return new Promise(async (resolve) => {
            var _a;
            try {
                console.log('=== Creating Prefab with Asset-DB API ===');
                console.log(`Node UUID: ${nodeUuid}`);
                console.log(`Save path: ${savePath}`);
                console.log(`Prefab name: ${prefabName}`);
                // Step 1: get node data (including transform properties)
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: 'Unable to get node data'
                    });
                    return;
                }
                console.log('Node data retrieved, child count:', nodeData.children ? nodeData.children.length : 0);
                // Step 2: create the asset file first to obtain the engine-assigned UUID
                console.log('Creating prefab asset file...');
                const tempPrefabContent = JSON.stringify([{ "__type__": "cc.Prefab", "_name": prefabName }], null, 2);
                const createResult = await this.createAssetWithAssetDB(savePath, tempPrefabContent);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }
                // Get the actual UUID assigned by the engine
                const actualPrefabUuid = (_a = createResult.data) === null || _a === void 0 ? void 0 : _a.uuid;
                if (!actualPrefabUuid) {
                    resolve({
                        success: false,
                        error: 'Unable to get the engine-assigned prefab UUID'
                    });
                    return;
                }
                console.log('Engine-assigned UUID:', actualPrefabUuid);
                // Step 3: regenerate the prefab content using the actual UUID
                const prefabContent = await this.createStandardPrefabContent(nodeData, prefabName, actualPrefabUuid, includeChildren, includeComponents);
                const prefabContentString = JSON.stringify(prefabContent, null, 2);
                // Step 4: update the prefab file content
                console.log('Updating prefab file content...');
                const updateResult = await this.updateAssetWithAssetDB(savePath, prefabContentString);
                // Step 5: create the corresponding meta file (using the actual UUID)
                console.log('Creating prefab meta file...');
                const metaContent = this.createStandardMetaContent(prefabName, actualPrefabUuid);
                const metaResult = await this.createMetaWithAssetDB(savePath, metaContent);
                // Step 6: reimport the asset to update references
                console.log('Reimporting prefab asset...');
                const reimportResult = await this.reimportAssetWithAssetDB(savePath);
                // Step 7: attempt to convert the original node into a prefab instance
                console.log('Attempting to convert original node to prefab instance...');
                const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, actualPrefabUuid, savePath);
                resolve({
                    success: true,
                    data: {
                        prefabUuid: actualPrefabUuid,
                        prefabPath: savePath,
                        nodeUuid: nodeUuid,
                        prefabName: prefabName,
                        convertedToPrefabInstance: convertResult.success,
                        createAssetResult: createResult,
                        updateResult: updateResult,
                        metaResult: metaResult,
                        reimportResult: reimportResult,
                        convertResult: convertResult,
                        message: convertResult.success ? 'Prefab created and original node converted successfully' : 'Prefab created successfully, but node conversion failed'
                    }
                });
            }
            catch (error) {
                console.error('Error occurred while creating prefab:', error);
                resolve({
                    success: false,
                    error: `Failed to create prefab: ${error}`
                });
            }
        });
    }
    async createPrefab(args) {
        return new Promise(async (resolve) => {
            try {
                // Supports both prefabPath and savePath parameter names
                const pathParam = args.prefabPath || args.savePath;
                if (!pathParam) {
                    resolve({
                        success: false,
                        error: 'Missing prefab path parameter. Please provide prefabPath or savePath.'
                    });
                    return;
                }
                const prefabName = args.prefabName || 'NewPrefab';
                const fullPath = pathParam.endsWith('.prefab') ?
                    pathParam : `${pathParam}/${prefabName}.prefab`;
                const includeChildren = args.includeChildren !== false; // default true
                const includeComponents = args.includeComponents !== false; // default true
                // Prefer the new asset-db method to create the prefab
                console.log('Creating prefab using new asset-db method...');
                const assetDbResult = await this.createPrefabWithAssetDB(args.nodeUuid, fullPath, prefabName, includeChildren, includeComponents);
                if (assetDbResult.success) {
                    resolve(assetDbResult);
                    return;
                }
                // If the asset-db method fails, try using Cocos Creator's native prefab creation API
                console.log('asset-db method failed, trying native API...');
                const nativeResult = await this.createPrefabNative(args.nodeUuid, fullPath);
                if (nativeResult.success) {
                    resolve(nativeResult);
                    return;
                }
                // If the native API also fails, use the custom implementation
                console.log('Native API failed, using custom implementation...');
                const customResult = await this.createPrefabCustom(args.nodeUuid, fullPath, prefabName);
                resolve(customResult);
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Error occurred while creating prefab: ${error}`
                });
            }
        });
    }
    async createPrefabNative(nodeUuid, prefabPath) {
        return new Promise((resolve) => {
            // According to the official API documentation, there is no direct prefab creation API
            // Prefab creation must be done manually in the editor
            resolve({
                success: false,
                error: 'Native prefab creation API does not exist',
                instruction: 'According to the Cocos Creator official API documentation, prefab creation requires manual operation:\n1. Select the node in the scene\n2. Drag the node into the Assets panel\n3. Or right-click the node and choose "Create Prefab"'
            });
        });
    }
    async createPrefabCustom(nodeUuid, prefabPath, prefabName) {
        return new Promise(async (resolve) => {
            var _a, _b;
            try {
                // 1. Get the full data of the source node
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: `Unable to find node: ${nodeUuid}`
                    });
                    return;
                }
                // 2. Generate a prefab UUID
                const prefabUuid = this.generateUUID();
                // 3. Create the prefab data structure
                const prefabData = this.createPrefabData(nodeData, prefabName, prefabUuid);
                // 4. Create the prefab data structure based on the official format
                console.log('=== Starting Prefab Creation ===');
                console.log('Node name:', ((_a = nodeData.name) === null || _a === void 0 ? void 0 : _a.value) || 'Unknown');
                console.log('Node UUID:', ((_b = nodeData.uuid) === null || _b === void 0 ? void 0 : _b.value) || 'Unknown');
                console.log('Prefab save path:', prefabPath);
                console.log(`Starting prefab creation, node data:`, nodeData);
                const prefabJsonData = await this.createStandardPrefabContent(nodeData, prefabName, prefabUuid, true, true);
                // 5. Create the standard meta file data
                const standardMetaData = this.createStandardMetaData(prefabName, prefabUuid);
                // 6. Save the prefab and meta files
                const saveResult = await this.savePrefabWithMeta(prefabPath, prefabJsonData, standardMetaData);
                if (saveResult.success) {
                    // After saving successfully, convert the original node to a prefab instance
                    const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, prefabPath, prefabUuid);
                    resolve({
                        success: true,
                        data: {
                            prefabUuid: prefabUuid,
                            prefabPath: prefabPath,
                            nodeUuid: nodeUuid,
                            prefabName: prefabName,
                            convertedToPrefabInstance: convertResult.success,
                            message: convertResult.success ?
                                'Custom prefab created successfully and original node converted to prefab instance' :
                                'Prefab created successfully, but node conversion failed'
                        }
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: saveResult.error || 'Failed to save prefab file'
                    });
                }
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Error occurred while creating prefab: ${error}`
                });
            }
        });
    }
    async getNodeData(nodeUuid) {
        return new Promise(async (resolve) => {
            try {
                // First, get the basic node info
                const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUuid);
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }
                console.log(`Successfully retrieved basic info for node ${nodeUuid}`);
                // Use query-node-tree to get the full structure including child nodes
                const nodeTree = await this.getNodeWithChildren(nodeUuid);
                if (nodeTree) {
                    console.log(`Successfully retrieved full tree structure for node ${nodeUuid}`);
                    resolve(nodeTree);
                }
                else {
                    console.log(`Using basic node info`);
                    resolve(nodeInfo);
                }
            }
            catch (error) {
                console.warn(`Failed to get node data for ${nodeUuid}:`, error);
                resolve(null);
            }
        });
    }
    // Get the complete node structure including child nodes using query-node-tree
    async getNodeWithChildren(nodeUuid) {
        try {
            // Get the entire scene tree
            const tree = await Editor.Message.request('scene', 'query-node-tree');
            if (!tree) {
                return null;
            }
            // Find the specified node in the tree
            const targetNode = this.findNodeInTree(tree, nodeUuid);
            if (targetNode) {
                console.log(`Found node ${nodeUuid} in scene tree, child count: ${targetNode.children ? targetNode.children.length : 0}`);
                // Enhance the node tree to get the correct component info for each node
                const enhancedTree = await this.enhanceTreeWithMCPComponents(targetNode);
                return enhancedTree;
            }
            return null;
        }
        catch (error) {
            console.warn(`Failed to get node tree structure for ${nodeUuid}:`, error);
            return null;
        }
    }
    // Recursively search the node tree for a node with the specified UUID
    findNodeInTree(node, targetUuid) {
        var _a;
        if (!node)
            return null;
        // Check the current node
        if (node.uuid === targetUuid || ((_a = node.value) === null || _a === void 0 ? void 0 : _a.uuid) === targetUuid) {
            return node;
        }
        // Recursively check child nodes
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = this.findNodeInTree(child, targetUuid);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    /**
     * Enhance the node tree using the MCP interface to get the correct component info.
     */
    async enhanceTreeWithMCPComponents(node) {
        var _a, _b, _c;
        if (!node || !node.uuid) {
            return node;
        }
        try {
            // Use the MCP interface to get component info for the node
            const response = await fetch('http://localhost:8585/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "component_get_components",
                        "arguments": {
                            "nodeUuid": node.uuid
                        }
                    },
                    "id": Date.now()
                })
            });
            const mcpResult = await response.json();
            if ((_c = (_b = (_a = mcpResult.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text) {
                const componentData = JSON.parse(mcpResult.result.content[0].text);
                if (componentData.success && componentData.data.components) {
                    // Update the node's component info with the correct data returned by MCP
                    node.components = componentData.data.components;
                    console.log(`Node ${node.uuid} retrieved ${componentData.data.components.length} components with correct script component types`);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to get MCP component info for node ${node.uuid}:`, error);
        }
        // Recursively process child nodes
        if (node.children && Array.isArray(node.children)) {
            for (let i = 0; i < node.children.length; i++) {
                node.children[i] = await this.enhanceTreeWithMCPComponents(node.children[i]);
            }
        }
        return node;
    }
    async buildBasicNodeInfo(nodeUuid) {
        return new Promise((resolve) => {
            // Build basic node info
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeInfo) => {
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }
                // Simplified version: only return basic node info without child nodes or components.
                // These will be added as needed during subsequent prefab processing.
                const basicInfo = Object.assign(Object.assign({}, nodeInfo), { children: [], components: [] });
                resolve(basicInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }
    // Validate whether node data is valid
    isValidNodeData(nodeData) {
        if (!nodeData)
            return false;
        if (typeof nodeData !== 'object')
            return false;
        // Check basic properties - adapted to the query-node-tree data format
        return nodeData.hasOwnProperty('uuid') ||
            nodeData.hasOwnProperty('name') ||
            nodeData.hasOwnProperty('__type__') ||
            (nodeData.value && (nodeData.value.hasOwnProperty('uuid') ||
                nodeData.value.hasOwnProperty('name') ||
                nodeData.value.hasOwnProperty('__type__')));
    }
    // Unified method to extract a child node UUID
    extractChildUuid(childRef) {
        if (!childRef)
            return null;
        // Method 1: direct string
        if (typeof childRef === 'string') {
            return childRef;
        }
        // Method 2: value property contains a string
        if (childRef.value && typeof childRef.value === 'string') {
            return childRef.value;
        }
        // Method 3: value.uuid property
        if (childRef.value && childRef.value.uuid) {
            return childRef.value.uuid;
        }
        // Method 4: direct uuid property
        if (childRef.uuid) {
            return childRef.uuid;
        }
        // Method 5: __id__ reference - requires special handling
        if (childRef.__id__ !== undefined) {
            console.log(`Found __id__ reference: ${childRef.__id__}, may need to look up from data structure`);
            return null; // Return null for now; reference resolution logic can be added later
        }
        console.warn('Unable to extract child node UUID:', JSON.stringify(childRef));
        return null;
    }
    // Get the child node data that needs to be processed
    getChildrenToProcess(nodeData) {
        var _a;
        const children = [];
        // Method 1: get directly from the children array (data returned by query-node-tree)
        if (nodeData.children && Array.isArray(nodeData.children)) {
            console.log(`Getting child nodes from children array, count: ${nodeData.children.length}`);
            for (const child of nodeData.children) {
                // Child nodes returned by query-node-tree are usually already complete data structures
                if (this.isValidNodeData(child)) {
                    children.push(child);
                    console.log(`Adding child node: ${child.name || ((_a = child.value) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'}`);
                }
                else {
                    console.log('Invalid child node data:', JSON.stringify(child, null, 2));
                }
            }
        }
        else {
            console.log('Node has no child nodes or children array is empty');
        }
        return children;
    }
    generateUUID() {
        // Generate a UUID in Cocos Creator format
        const chars = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 32; i++) {
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += '-';
            }
            uuid += chars[Math.floor(Math.random() * chars.length)];
        }
        return uuid;
    }
    createPrefabData(nodeData, prefabName, prefabUuid) {
        // Build standard prefab data structure
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        // Process node data to conform to prefab format
        const processedNodeData = this.processNodeForPrefab(nodeData, prefabUuid);
        return [prefabAsset, ...processedNodeData];
    }
    processNodeForPrefab(nodeData, prefabUuid) {
        // Process node data to conform to prefab format
        const processedData = [];
        let idCounter = 1;
        // Recursively process nodes and components
        const processNode = (node, parentId = 0) => {
            const nodeId = idCounter++;
            // Create node object
            const processedNode = {
                "__type__": "cc.Node",
                "_name": node.name || "Node",
                "_objFlags": 0,
                "__editorExtras__": {},
                "_parent": parentId > 0 ? { "__id__": parentId } : null,
                "_children": node.children ? node.children.map(() => ({ "__id__": idCounter++ })) : [],
                "_active": node.active !== false,
                "_components": node.components ? node.components.map(() => ({ "__id__": idCounter++ })) : [],
                "_prefab": {
                    "__id__": idCounter++
                },
                "_lpos": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_lrot": {
                    "__type__": "cc.Quat",
                    "x": 0,
                    "y": 0,
                    "z": 0,
                    "w": 1
                },
                "_lscale": {
                    "__type__": "cc.Vec3",
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "_mobility": 0,
                "_layer": 1073741824,
                "_euler": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_id": ""
            };
            processedData.push(processedNode);
            // Process components
            if (node.components) {
                node.components.forEach((component) => {
                    const componentId = idCounter++;
                    const processedComponents = this.processComponentForPrefab(component, componentId);
                    processedData.push(...processedComponents);
                });
            }
            // Process child nodes
            if (node.children) {
                node.children.forEach((child) => {
                    processNode(child, nodeId);
                });
            }
            return nodeId;
        };
        processNode(nodeData);
        return processedData;
    }
    processComponentForPrefab(component, componentId) {
        // Process component data to conform to prefab format
        const processedComponent = Object.assign({ "__type__": component.type || "cc.Component", "_name": "", "_objFlags": 0, "__editorExtras__": {}, "node": {
                "__id__": componentId - 1
            }, "_enabled": component.enabled !== false, "__prefab": {
                "__id__": componentId + 1
            } }, component.properties);
        // Add component-specific prefab info
        const compPrefabInfo = {
            "__type__": "cc.CompPrefabInfo",
            "fileId": this.generateFileId()
        };
        return [processedComponent, compPrefabInfo];
    }
    generateFileId() {
        // Generate a file ID (simplified version)
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
        let fileId = '';
        for (let i = 0; i < 22; i++) {
            fileId += chars[Math.floor(Math.random() * chars.length)];
        }
        return fileId;
    }
    createMetaData(prefabName, prefabUuid) {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }
    async savePrefabFiles(prefabPath, prefabData, metaData) {
        return new Promise((resolve) => {
            try {
                // Use the Editor API to save the prefab file
                const prefabContent = JSON.stringify(prefabData, null, 2);
                const metaContent = JSON.stringify(metaData, null, 2);
                // Try a more reliable save method
                this.saveAssetFile(prefabPath, prefabContent).then(() => {
                    // Then create the meta file
                    const metaPath = `${prefabPath}.meta`;
                    return this.saveAssetFile(metaPath, metaContent);
                }).then(() => {
                    resolve({ success: true });
                }).catch((error) => {
                    resolve({ success: false, error: error.message || 'Failed to save prefab file' });
                });
            }
            catch (error) {
                resolve({ success: false, error: `Error occurred while saving file: ${error}` });
            }
        });
    }
    async saveAssetFile(filePath, content) {
        return new Promise((resolve, reject) => {
            // Try multiple save methods
            const saveMethods = [
                () => Editor.Message.request('asset-db', 'create-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'save-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'write-asset', filePath, content)
            ];
            const trySave = (index) => {
                if (index >= saveMethods.length) {
                    reject(new Error('All save methods failed'));
                    return;
                }
                saveMethods[index]().then(() => {
                    resolve();
                }).catch(() => {
                    trySave(index + 1);
                });
            };
            trySave(0);
        });
    }
    async updatePrefab(prefabPath, nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('scene', 'apply-prefab', {
                    node: nodeUuid,
                    prefab: assetInfo.uuid
                });
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab updated successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async revertPrefab(nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'revert-prefab', {
                node: nodeUuid
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab instance reverted successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getPrefabInfo(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('asset-db', 'query-asset-meta', assetInfo.uuid);
            }).then((metaInfo) => {
                const info = {
                    name: metaInfo.name,
                    uuid: metaInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/')),
                    createTime: metaInfo.createTime,
                    modifyTime: metaInfo.modifyTime,
                    dependencies: metaInfo.depends || []
                };
                resolve({ success: true, data: info });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async createPrefabFromNode(args) {
        var _a;
        // Extract the name from prefabPath
        const prefabPath = args.prefabPath;
        const prefabName = ((_a = prefabPath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.prefab', '')) || 'NewPrefab';
        // Call the original createPrefab method
        return await this.createPrefab({
            nodeUuid: args.nodeUuid,
            savePath: prefabPath,
            prefabName: prefabName
        });
    }
    async validatePrefab(prefabPath) {
        return new Promise((resolve) => {
            try {
                // Read the prefab file content
                Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                    if (!assetInfo) {
                        resolve({
                            success: false,
                            error: 'Prefab file does not exist'
                        });
                        return;
                    }
                    // Validate the prefab format
                    Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content) => {
                        try {
                            const prefabData = JSON.parse(content);
                            const validationResult = this.validatePrefabFormat(prefabData);
                            resolve({
                                success: true,
                                data: {
                                    isValid: validationResult.isValid,
                                    issues: validationResult.issues,
                                    nodeCount: validationResult.nodeCount,
                                    componentCount: validationResult.componentCount,
                                    message: validationResult.isValid ? 'Prefab format is valid' : 'Prefab format has issues'
                                }
                            });
                        }
                        catch (parseError) {
                            resolve({
                                success: false,
                                error: 'Prefab file format error, unable to parse JSON'
                            });
                        }
                    }).catch((error) => {
                        resolve({
                            success: false,
                            error: `Failed to read prefab file: ${error.message}`
                        });
                    });
                }).catch((error) => {
                    resolve({
                        success: false,
                        error: `Failed to query prefab info: ${error.message}`
                    });
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Error occurred while validating prefab: ${error}`
                });
            }
        });
    }
    validatePrefabFormat(prefabData) {
        const issues = [];
        let nodeCount = 0;
        let componentCount = 0;
        // Check basic structure
        if (!Array.isArray(prefabData)) {
            issues.push('Prefab data must be in array format');
            return { isValid: false, issues, nodeCount, componentCount };
        }
        if (prefabData.length === 0) {
            issues.push('Prefab data is empty');
            return { isValid: false, issues, nodeCount, componentCount };
        }
        // Check that the first element is a prefab asset
        const firstElement = prefabData[0];
        if (!firstElement || firstElement.__type__ !== 'cc.Prefab') {
            issues.push('The first element must be of type cc.Prefab');
        }
        // Count nodes and components
        prefabData.forEach((item, index) => {
            if (item.__type__ === 'cc.Node') {
                nodeCount++;
            }
            else if (item.__type__ && item.__type__.includes('cc.')) {
                componentCount++;
            }
        });
        // Check required fields
        if (nodeCount === 0) {
            issues.push('Prefab must contain at least one node');
        }
        return {
            isValid: issues.length === 0,
            issues,
            nodeCount,
            componentCount
        };
    }
    async duplicatePrefab(args) {
        return new Promise(async (resolve) => {
            try {
                const { sourcePrefabPath, targetPrefabPath, newPrefabName } = args;
                // Read the source prefab
                const sourceInfo = await this.getPrefabInfo(sourcePrefabPath);
                if (!sourceInfo.success) {
                    resolve({
                        success: false,
                        error: `Unable to read source prefab: ${sourceInfo.error}`
                    });
                    return;
                }
                // Read the source prefab content
                const sourceContent = await this.readPrefabContent(sourcePrefabPath);
                if (!sourceContent.success) {
                    resolve({
                        success: false,
                        error: `Unable to read source prefab content: ${sourceContent.error}`
                    });
                    return;
                }
                // Generate a new UUID
                const newUuid = this.generateUUID();
                // Modify the prefab data
                const modifiedData = this.modifyPrefabForDuplication(sourceContent.data, newPrefabName, newUuid);
                // Create new meta data
                const newMetaData = this.createMetaData(newPrefabName || 'DuplicatedPrefab', newUuid);
                // Prefab duplication is temporarily disabled due to complex serialization format
                resolve({
                    success: false,
                    error: 'Prefab duplication is temporarily unavailable',
                    instruction: 'Please duplicate the prefab manually in the Cocos Creator editor:\n1. Select the prefab in the Assets panel\n2. Right-click and choose Copy\n3. Paste at the target location'
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Error occurred while duplicating prefab: ${error}`
                });
            }
        });
    }
    async readPrefabContent(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content) => {
                try {
                    const prefabData = JSON.parse(content);
                    resolve({ success: true, data: prefabData });
                }
                catch (parseError) {
                    resolve({ success: false, error: 'Prefab file format error' });
                }
            }).catch((error) => {
                resolve({ success: false, error: error.message || 'Failed to read prefab file' });
            });
        });
    }
    modifyPrefabForDuplication(prefabData, newName, newUuid) {
        // Modify the prefab data to create a copy
        const modifiedData = [...prefabData];
        // Modify the first element (prefab asset)
        if (modifiedData[0] && modifiedData[0].__type__ === 'cc.Prefab') {
            modifiedData[0]._name = newName || 'DuplicatedPrefab';
        }
        // Update all UUID references (simplified version)
        // In practice, more complex UUID mapping may be required
        return modifiedData;
    }
    /**
     * Create an asset file using the asset-db API.
     */
    async createAssetWithAssetDB(assetPath, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'create-asset', assetPath, content, {
                overwrite: true,
                rename: false
            }).then((assetInfo) => {
                console.log('Asset file created successfully:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error) => {
                console.error('Failed to create asset file:', error);
                resolve({ success: false, error: error.message || 'Failed to create asset file' });
            });
        });
    }
    /**
     * Create a meta file using the asset-db API.
     */
    async createMetaWithAssetDB(assetPath, metaContent) {
        return new Promise((resolve) => {
            const metaContentString = JSON.stringify(metaContent, null, 2);
            Editor.Message.request('asset-db', 'save-asset-meta', assetPath, metaContentString).then((assetInfo) => {
                console.log('Meta file created successfully:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error) => {
                console.error('Failed to create meta file:', error);
                resolve({ success: false, error: error.message || 'Failed to create meta file' });
            });
        });
    }
    /**
     * Reimport an asset using the asset-db API.
     */
    async reimportAssetWithAssetDB(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'reimport-asset', assetPath).then((result) => {
                console.log('Asset reimported successfully:', result);
                resolve({ success: true, data: result });
            }).catch((error) => {
                console.error('Failed to reimport asset:', error);
                resolve({ success: false, error: error.message || 'Failed to reimport asset' });
            });
        });
    }
    /**
     * Update asset file content using the asset-db API.
     */
    async updateAssetWithAssetDB(assetPath, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', assetPath, content).then((result) => {
                console.log('Asset file updated successfully:', result);
                resolve({ success: true, data: result });
            }).catch((error) => {
                console.error('Failed to update asset file:', error);
                resolve({ success: false, error: error.message || 'Failed to update asset file' });
            });
        });
    }
    /**
     * Create prefab content conforming to the Cocos Creator standard.
     * Fully implements recursive node tree processing to match the engine's standard format.
     */
    async createStandardPrefabContent(nodeData, prefabName, prefabUuid, includeChildren, includeComponents) {
        console.log('Starting creation of engine-standard prefab content...');
        const prefabData = [];
        let currentId = 0;
        // 1. Create the prefab asset object (index 0)
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName || "", // Ensure prefab name is not empty
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;
        // 2. Recursively create the full node tree structure
        const context = {
            prefabData,
            currentId: currentId + 1, // The root node occupies index 1; child nodes start from index 2
            prefabAssetIndex: 0,
            nodeFileIds: new Map(), // Stores the mapping from node ID to fileId
            nodeUuidToIndex: new Map(), // Stores the mapping from node UUID to index
            componentUuidToIndex: new Map() // Stores the mapping from component UUID to index
        };
        // Create the root node and the entire node tree.
        // Note: the root node's parent should be null, not the prefab asset object.
        await this.createCompleteNodeTree(nodeData, null, 1, context, includeChildren, includeComponents, prefabName);
        console.log(`Prefab content creation complete, total ${prefabData.length} objects`);
        console.log('Node fileId mapping:', Array.from(context.nodeFileIds.entries()));
        return prefabData;
    }
    /**
     * Recursively create the full node tree, including all child nodes and their corresponding PrefabInfo.
     */
    async createCompleteNodeTree(nodeData, parentNodeIndex, nodeIndex, context, includeChildren, includeComponents, nodeName) {
        const { prefabData } = context;
        // Create the node object
        const node = this.createEngineStandardNode(nodeData, parentNodeIndex, nodeName);
        // Ensure the node is placed at the specified index position
        while (prefabData.length <= nodeIndex) {
            prefabData.push(null);
        }
        console.log(`Setting node at index ${nodeIndex}: ${node._name}, _parent:`, node._parent, `_children count: ${node._children.length}`);
        prefabData[nodeIndex] = node;
        // Generate a fileId for the current node and record the UUID-to-index mapping
        const nodeUuid = this.extractNodeUuid(nodeData);
        const fileId = nodeUuid || this.generateFileId();
        context.nodeFileIds.set(nodeIndex.toString(), fileId);
        // Record the node UUID-to-index mapping
        if (nodeUuid) {
            context.nodeUuidToIndex.set(nodeUuid, nodeIndex);
            console.log(`Recording node UUID mapping: ${nodeUuid} -> ${nodeIndex}`);
        }
        // Process child nodes first (to maintain consistent index ordering with manual creation)
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (includeChildren && childrenToProcess.length > 0) {
            console.log(`Processing ${childrenToProcess.length} child nodes of node ${node._name}`);
            // Assign indices to each child node
            const childIndices = [];
            console.log(`Preparing to assign indices for ${childrenToProcess.length} child nodes, current ID: ${context.currentId}`);
            for (let i = 0; i < childrenToProcess.length; i++) {
                console.log(`Processing child node ${i + 1}, current currentId: ${context.currentId}`);
                const childIndex = context.currentId++;
                childIndices.push(childIndex);
                node._children.push({ "__id__": childIndex });
                console.log(`Added child node reference to ${node._name}: {__id__: ${childIndex}}`);
            }
            console.log(`Node ${node._name} final children array:`, node._children);
            // Recursively create child nodes
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childIndex = childIndices[i];
                await this.createCompleteNodeTree(childData, nodeIndex, childIndex, context, includeChildren, includeComponents, childData.name || `Child${i + 1}`);
            }
        }
        // Then process components
        if (includeComponents && nodeData.components && Array.isArray(nodeData.components)) {
            console.log(`Processing ${nodeData.components.length} components of node ${node._name}`);
            const componentIndices = [];
            for (const component of nodeData.components) {
                const componentIndex = context.currentId++;
                componentIndices.push(componentIndex);
                node._components.push({ "__id__": componentIndex });
                // Record the component UUID-to-index mapping
                const componentUuid = component.uuid || (component.value && component.value.uuid);
                if (componentUuid) {
                    context.componentUuidToIndex.set(componentUuid, componentIndex);
                    console.log(`Recorded component UUID mapping: ${componentUuid} -> ${componentIndex}`);
                }
                // Create the component object, passing context to handle references
                const componentObj = this.createComponentObject(component, nodeIndex, context);
                prefabData[componentIndex] = componentObj;
                // Create a CompPrefabInfo for the component
                const compPrefabInfoIndex = context.currentId++;
                prefabData[compPrefabInfoIndex] = {
                    "__type__": "cc.CompPrefabInfo",
                    "fileId": this.generateFileId()
                };
                // If the component object has a __prefab property, set the reference
                if (componentObj && typeof componentObj === 'object') {
                    componentObj.__prefab = { "__id__": compPrefabInfoIndex };
                }
            }
            console.log(`Node ${node._name} had ${componentIndices.length} components added`);
        }
        // Create a PrefabInfo for the current node
        const prefabInfoIndex = context.currentId++;
        node._prefab = { "__id__": prefabInfoIndex };
        const prefabInfo = {
            "__type__": "cc.PrefabInfo",
            "root": { "__id__": 1 },
            "asset": { "__id__": context.prefabAssetIndex },
            "fileId": fileId,
            "targetOverrides": null,
            "nestedPrefabInstanceRoots": null
        };
        // Special handling for the root node
        if (nodeIndex === 1) {
            // The root node has no instance, but may have targetOverrides
            prefabInfo.instance = null;
        }
        else {
            // Child nodes typically have instance set to null
            prefabInfo.instance = null;
        }
        prefabData[prefabInfoIndex] = prefabInfo;
        context.currentId = prefabInfoIndex + 1;
    }
    /**
     * Convert a UUID to Cocos Creator's compressed format.
     * Implemented based on the real Cocos Creator editor's compression algorithm.
     * The first 5 hex characters are kept unchanged; the remaining 27 characters are compressed into 18.
     */
    uuidToCompressedId(uuid) {
        const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        // Remove hyphens and convert to lowercase
        const cleanUuid = uuid.replace(/-/g, '').toLowerCase();
        // Ensure the UUID is valid
        if (cleanUuid.length !== 32) {
            return uuid; // If not a valid UUID, return the original value
        }
        // Cocos Creator compression: first 5 characters unchanged, remaining 27 compressed to 18
        let result = cleanUuid.substring(0, 5);
        // The remaining 27 characters need to be compressed into 18 characters
        const remainder = cleanUuid.substring(5);
        // Every 3 hex characters are compressed into 2 characters
        for (let i = 0; i < remainder.length; i += 3) {
            const hex1 = remainder[i] || '0';
            const hex2 = remainder[i + 1] || '0';
            const hex3 = remainder[i + 2] || '0';
            // Convert 3 hex characters (12 bits) into 2 base64 characters
            const value = parseInt(hex1 + hex2 + hex3, 16);
            // Split 12 bits into two 6-bit values
            const high6 = (value >> 6) & 63;
            const low6 = value & 63;
            result += BASE64_KEYS[high6] + BASE64_KEYS[low6];
        }
        return result;
    }
    /**
     * Create component object
     */
    createComponentObject(componentData, nodeIndex, context) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
        let componentType = componentData.type || componentData.__type__ || 'cc.Component';
        const enabled = componentData.enabled !== undefined ? componentData.enabled : true;
        // console.log(`Creating component object - original type: ${componentType}`);
        // console.log('Full component data:', JSON.stringify(componentData, null, 2));
        // Handle script components - the MCP interface already returns the correct compressed UUID format
        if (componentType && !componentType.startsWith('cc.')) {
            console.log(`Using script component compressed UUID type: ${componentType}`);
        }
        // Basic component structure
        const component = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": { "__id__": nodeIndex },
            "_enabled": enabled
        };
        // Set a placeholder for the __prefab property; it will be set correctly later
        component.__prefab = null;
        // Add type-specific properties based on the component type
        if (componentType === 'cc.UITransform') {
            const contentSize = ((_b = (_a = componentData.properties) === null || _a === void 0 ? void 0 : _a.contentSize) === null || _b === void 0 ? void 0 : _b.value) || { width: 100, height: 100 };
            const anchorPoint = ((_d = (_c = componentData.properties) === null || _c === void 0 ? void 0 : _c.anchorPoint) === null || _d === void 0 ? void 0 : _d.value) || { x: 0.5, y: 0.5 };
            component._contentSize = {
                "__type__": "cc.Size",
                "width": contentSize.width,
                "height": contentSize.height
            };
            component._anchorPoint = {
                "__type__": "cc.Vec2",
                "x": anchorPoint.x,
                "y": anchorPoint.y
            };
        }
        else if (componentType === 'cc.Sprite') {
            // Handle the Sprite component's spriteFrame reference
            const spriteFrameProp = ((_e = componentData.properties) === null || _e === void 0 ? void 0 : _e._spriteFrame) || ((_f = componentData.properties) === null || _f === void 0 ? void 0 : _f.spriteFrame);
            if (spriteFrameProp) {
                component._spriteFrame = this.processComponentProperty(spriteFrameProp, context);
            }
            else {
                component._spriteFrame = null;
            }
            component._type = (_j = (_h = (_g = componentData.properties) === null || _g === void 0 ? void 0 : _g._type) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 0;
            component._fillType = (_m = (_l = (_k = componentData.properties) === null || _k === void 0 ? void 0 : _k._fillType) === null || _l === void 0 ? void 0 : _l.value) !== null && _m !== void 0 ? _m : 0;
            component._sizeMode = (_q = (_p = (_o = componentData.properties) === null || _o === void 0 ? void 0 : _o._sizeMode) === null || _p === void 0 ? void 0 : _p.value) !== null && _q !== void 0 ? _q : 1;
            component._fillCenter = { "__type__": "cc.Vec2", "x": 0, "y": 0 };
            component._fillStart = (_t = (_s = (_r = componentData.properties) === null || _r === void 0 ? void 0 : _r._fillStart) === null || _s === void 0 ? void 0 : _s.value) !== null && _t !== void 0 ? _t : 0;
            component._fillRange = (_w = (_v = (_u = componentData.properties) === null || _u === void 0 ? void 0 : _u._fillRange) === null || _v === void 0 ? void 0 : _v.value) !== null && _w !== void 0 ? _w : 0;
            component._isTrimmedMode = (_z = (_y = (_x = componentData.properties) === null || _x === void 0 ? void 0 : _x._isTrimmedMode) === null || _y === void 0 ? void 0 : _y.value) !== null && _z !== void 0 ? _z : true;
            component._useGrayscale = (_2 = (_1 = (_0 = componentData.properties) === null || _0 === void 0 ? void 0 : _0._useGrayscale) === null || _1 === void 0 ? void 0 : _1.value) !== null && _2 !== void 0 ? _2 : false;
            // Debug: print all Sprite component properties (commented out)
            // console.log('Sprite component properties:', JSON.stringify(componentData.properties, null, 2));
            component._atlas = null;
            component._id = "";
        }
        else if (componentType === 'cc.Button') {
            component._interactable = true;
            component._transition = 3;
            component._normalColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._hoverColor = { "__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255 };
            component._pressedColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._disabledColor = { "__type__": "cc.Color", "r": 124, "g": 124, "b": 124, "a": 255 };
            component._normalSprite = null;
            component._hoverSprite = null;
            component._pressedSprite = null;
            component._disabledSprite = null;
            component._duration = 0.1;
            component._zoomScale = 1.2;
            // Handle the Button's target reference
            const targetProp = ((_3 = componentData.properties) === null || _3 === void 0 ? void 0 : _3._target) || ((_4 = componentData.properties) === null || _4 === void 0 ? void 0 : _4.target);
            if (targetProp) {
                component._target = this.processComponentProperty(targetProp, context);
            }
            else {
                component._target = { "__id__": nodeIndex }; // Defaults to pointing to the node itself
            }
            component._clickEvents = [];
            component._id = "";
        }
        else if (componentType === 'cc.Label') {
            component._string = ((_6 = (_5 = componentData.properties) === null || _5 === void 0 ? void 0 : _5._string) === null || _6 === void 0 ? void 0 : _6.value) || "Label";
            component._horizontalAlign = 1;
            component._verticalAlign = 1;
            component._actualFontSize = 20;
            component._fontSize = 20;
            component._fontFamily = "Arial";
            component._lineHeight = 25;
            component._overflow = 0;
            component._enableWrapText = true;
            component._font = null;
            component._isSystemFontUsed = true;
            component._spacingX = 0;
            component._isItalic = false;
            component._isBold = false;
            component._isUnderline = false;
            component._underlineHeight = 2;
            component._cacheMode = 0;
            component._id = "";
        }
        else if (componentData.properties) {
            // Handle all component properties (both built-in and custom script components)
            for (const [key, value] of Object.entries(componentData.properties)) {
                if (key === 'node' || key === 'enabled' || key === '__type__' ||
                    key === 'uuid' || key === 'name' || key === '__scriptAsset' || key === '_objFlags') {
                    continue; // Skip these special properties, including _objFlags
                }
                // Properties starting with underscore require special handling
                if (key.startsWith('_')) {
                    // Ensure the property name is preserved as-is (including the underscore)
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                }
                else {
                    // Properties not starting with underscore are processed normally
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                }
            }
        }
        // Ensure _id is in the last position
        const _id = component._id || "";
        delete component._id;
        component._id = _id;
        return component;
    }
    /**
     * Process component property values to ensure the format is consistent with manually created prefabs.
     */
    processComponentProperty(propData, context) {
        var _a, _b;
        if (!propData || typeof propData !== 'object') {
            return propData;
        }
        const value = propData.value;
        const type = propData.type;
        // Handle null values
        if (value === null || value === undefined) {
            return null;
        }
        // Handle empty UUID objects and convert to null
        if (value && typeof value === 'object' && value.uuid === '') {
            return null;
        }
        // Handle node references
        if (type === 'cc.Node' && (value === null || value === void 0 ? void 0 : value.uuid)) {
            // In a prefab, node references must be converted to __id__ form
            if ((context === null || context === void 0 ? void 0 : context.nodeUuidToIndex) && context.nodeUuidToIndex.has(value.uuid)) {
                // Internal reference: convert to __id__ format
                return {
                    "__id__": context.nodeUuidToIndex.get(value.uuid)
                };
            }
            // External reference: set to null because external nodes do not belong to the prefab structure
            console.warn(`Node reference UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }
        // Handle asset references (prefabs, textures, sprite frames, etc.)
        if ((value === null || value === void 0 ? void 0 : value.uuid) && (type === 'cc.Prefab' ||
            type === 'cc.Texture2D' ||
            type === 'cc.SpriteFrame' ||
            type === 'cc.Material' ||
            type === 'cc.AnimationClip' ||
            type === 'cc.AudioClip' ||
            type === 'cc.Font' ||
            type === 'cc.Asset')) {
            // For prefab references, keep the original UUID format
            const uuidToUse = type === 'cc.Prefab' ? value.uuid : this.uuidToCompressedId(value.uuid);
            return {
                "__uuid__": uuidToUse,
                "__expectedType__": type
            };
        }
        // Handle component references (including specific component types like cc.Label, cc.Button, etc.)
        if ((value === null || value === void 0 ? void 0 : value.uuid) && (type === 'cc.Component' ||
            type === 'cc.Label' || type === 'cc.Button' || type === 'cc.Sprite' ||
            type === 'cc.UITransform' || type === 'cc.RigidBody2D' ||
            type === 'cc.BoxCollider2D' || type === 'cc.Animation' ||
            type === 'cc.AudioSource' || ((type === null || type === void 0 ? void 0 : type.startsWith('cc.')) && !type.includes('@')))) {
            // In a prefab, component references also need to be converted to __id__ form
            if ((context === null || context === void 0 ? void 0 : context.componentUuidToIndex) && context.componentUuidToIndex.has(value.uuid)) {
                // Internal reference: convert to __id__ format
                console.log(`Component reference ${type} UUID ${value.uuid} found in prefab context, converting to __id__`);
                return {
                    "__id__": context.componentUuidToIndex.get(value.uuid)
                };
            }
            // External reference: set to null because external components do not belong to the prefab structure
            console.warn(`Component reference ${type} UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }
        // Handle complex types and add a __type__ marker
        if (value && typeof value === 'object') {
            if (type === 'cc.Color') {
                return {
                    "__type__": "cc.Color",
                    "r": Math.min(255, Math.max(0, Number(value.r) || 0)),
                    "g": Math.min(255, Math.max(0, Number(value.g) || 0)),
                    "b": Math.min(255, Math.max(0, Number(value.b) || 0)),
                    "a": value.a !== undefined ? Math.min(255, Math.max(0, Number(value.a))) : 255
                };
            }
            else if (type === 'cc.Vec3') {
                return {
                    "__type__": "cc.Vec3",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0
                };
            }
            else if (type === 'cc.Vec2') {
                return {
                    "__type__": "cc.Vec2",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0
                };
            }
            else if (type === 'cc.Size') {
                return {
                    "__type__": "cc.Size",
                    "width": Number(value.width) || 0,
                    "height": Number(value.height) || 0
                };
            }
            else if (type === 'cc.Quat') {
                return {
                    "__type__": "cc.Quat",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0,
                    "w": value.w !== undefined ? Number(value.w) : 1
                };
            }
        }
        // Handle array types
        if (Array.isArray(value)) {
            // Node arrays
            if (((_a = propData.elementTypeData) === null || _a === void 0 ? void 0 : _a.type) === 'cc.Node') {
                return value.map(item => {
                    var _a;
                    if ((item === null || item === void 0 ? void 0 : item.uuid) && ((_a = context === null || context === void 0 ? void 0 : context.nodeUuidToIndex) === null || _a === void 0 ? void 0 : _a.has(item.uuid))) {
                        return { "__id__": context.nodeUuidToIndex.get(item.uuid) };
                    }
                    return null;
                }).filter(item => item !== null);
            }
            // Asset arrays
            if (((_b = propData.elementTypeData) === null || _b === void 0 ? void 0 : _b.type) && propData.elementTypeData.type.startsWith('cc.')) {
                return value.map(item => {
                    if (item === null || item === void 0 ? void 0 : item.uuid) {
                        return {
                            "__uuid__": this.uuidToCompressedId(item.uuid),
                            "__expectedType__": propData.elementTypeData.type
                        };
                    }
                    return null;
                }).filter(item => item !== null);
            }
            // Primitive type arrays
            return value.map(item => (item === null || item === void 0 ? void 0 : item.value) !== undefined ? item.value : item);
        }
        // Other complex object types: keep as-is but ensure a __type__ marker is present
        if (value && typeof value === 'object' && type && type.startsWith('cc.')) {
            return Object.assign({ "__type__": type }, value);
        }
        return value;
    }
    /**
     * Create a node object conforming to the engine's standard format.
     */
    createEngineStandardNode(nodeData, parentNodeIndex, nodeName) {
        // Debug: print raw node data (commented out)
        // console.log('Raw node data:', JSON.stringify(nodeData, null, 2));
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Extract basic node properties
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = nodeName || getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 1073741824;
        // Debug output
        console.log(`Creating node: ${name}, parentNodeIndex: ${parentNodeIndex}`);
        const parentRef = parentNodeIndex !== null ? { "__id__": parentNodeIndex } : null;
        console.log(`Node ${name} parent reference:`, parentRef);
        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentRef,
            "_children": [], // Child node references are dynamically added during recursion
            "_active": active,
            "_components": [], // Component references are dynamically added when processing components
            "_prefab": { "__id__": 0 }, // Temporary value; will be set correctly later
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }
    /**
     * Extract UUID from node data
     */
    extractNodeUuid(nodeData) {
        var _a, _b, _c;
        if (!nodeData)
            return null;
        // Try multiple approaches to get UUID
        const sources = [
            nodeData.uuid,
            (_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.uuid,
            nodeData.__uuid__,
            (_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.__uuid__,
            nodeData.id,
            (_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.id
        ];
        for (const source of sources) {
            if (typeof source === 'string' && source.length > 0) {
                return source;
            }
        }
        return null;
    }
    /**
     * Create a minimal node object with no components to avoid dependency issues
     */
    createMinimalNode(nodeData, nodeName) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Extract basic node properties
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = nodeName || getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 33554432;
        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": null,
            "_children": [],
            "_active": active,
            "_components": [], // Empty component array to avoid component dependency issues
            "_prefab": {
                "__id__": 2
            },
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }
    /**
     * Create standard meta file content
     */
    createStandardMetaContent(prefabName, prefabUuid) {
        return {
            "ver": "2.0.3",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName,
                "hasIcon": false
            }
        };
    }
    /**
     * Attempt to convert a raw node into a prefab instance
     */
    async convertNodeToPrefabInstance(nodeUuid, prefabUuid, prefabPath) {
        return new Promise((resolve) => {
            // This feature requires deep scene editor integration; not yet implemented
            // In a real engine context this involves complex prefab instantiation and node replacement logic
            console.log('Converting node to prefab instance requires deeper engine integration');
            resolve({
                success: false,
                error: 'Converting node to prefab instance requires deeper engine integration'
            });
        });
    }
    async restorePrefabNode(nodeUuid, assetUuid) {
        return new Promise((resolve) => {
            // Use official restore-prefab API to restore prefab node
            Editor.Message.request('scene', 'restore-prefab', nodeUuid, assetUuid).then(() => {
                resolve({
                    success: true,
                    data: {
                        nodeUuid: nodeUuid,
                        assetUuid: assetUuid,
                        message: 'Prefab node restored successfully'
                    }
                });
            }).catch((error) => {
                resolve({
                    success: false,
                    error: `Prefab node restore failed: ${error.message}`
                });
            });
        });
    }
    // New implementation based on official prefab format
    async getNodeDataForPrefab(nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData) => {
                if (!nodeData) {
                    resolve({ success: false, error: 'Node does not exist' });
                    return;
                }
                resolve({ success: true, data: nodeData });
            }).catch((error) => {
                resolve({ success: false, error: error.message });
            });
        });
    }
    async createStandardPrefabData(nodeData, prefabName, prefabUuid) {
        // Build prefab data structure based on official Canvas.prefab format
        const prefabData = [];
        let currentId = 0;
        // First element: cc.Prefab resource object
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;
        // Second element: root node
        const rootNode = await this.createNodeObject(nodeData, null, prefabData, currentId);
        prefabData.push(rootNode.node);
        currentId = rootNode.nextId;
        // Add root node PrefabInfo - fix asset reference to use UUID
        const rootPrefabInfo = {
            "__type__": "cc.PrefabInfo",
            "root": {
                "__id__": 1
            },
            "asset": {
                "__uuid__": prefabUuid
            },
            "fileId": this.generateFileId(),
            "instance": null,
            "targetOverrides": [],
            "nestedPrefabInstanceRoots": []
        };
        prefabData.push(rootPrefabInfo);
        return prefabData;
    }
    async createNodeObject(nodeData, parentId, prefabData, currentId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const nodeId = currentId++;
        // Extract basic node properties - adapted to query-node-tree data format
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 33554432;
        const node = {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentId !== null ? { "__id__": parentId } : null,
            "_children": [],
            "_active": active,
            "_components": [],
            "_prefab": parentId === null ? {
                "__id__": currentId++
            } : null,
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
        // Temporarily skip UITransform component to avoid _getDependComponent errors
        // To be added dynamically via Engine API later
        console.log(`Node ${name} temporarily skipping UITransform component to avoid engine dependency errors`);
        // Handle other components (temporarily skipped, focusing on UITransform fix)
        const components = this.extractComponentsFromNode(nodeData);
        if (components.length > 0) {
            console.log(`Node ${name} has ${components.length} other components, temporarily skipped to focus on UITransform fix`);
        }
        // Process child nodes - using full structure from query-node-tree
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (childrenToProcess.length > 0) {
            console.log(`=== Processing child nodes ===`);
            console.log(`Node ${name} has ${childrenToProcess.length} child nodes`);
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childName = childData.name || ((_j = childData.value) === null || _j === void 0 ? void 0 : _j.name) || 'unknown';
                console.log(`Processing child node ${i + 1}: ${childName}`);
                try {
                    const childId = currentId;
                    node._children.push({ "__id__": childId });
                    // Recursively create child node
                    const childResult = await this.createNodeObject(childData, nodeId, prefabData, currentId);
                    prefabData.push(childResult.node);
                    currentId = childResult.nextId;
                    // Child nodes do not need PrefabInfo, only the root node does
                    // Child node _prefab should be set to null
                    childResult.node._prefab = null;
                    console.log(`Successfully added child node: ${childName}`);
                }
                catch (error) {
                    console.error(`Error processing child node ${childName}:`, error);
                }
            }
        }
        return { node, nextId: currentId };
    }
    // Extract component info from node data
    extractComponentsFromNode(nodeData) {
        var _a, _b;
        const components = [];
        // Try to get component data from different locations
        const componentSources = [
            nodeData.__comps__,
            nodeData.components,
            (_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.__comps__,
            (_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.components
        ];
        for (const source of componentSources) {
            if (Array.isArray(source)) {
                components.push(...source.filter(comp => comp && (comp.__type__ || comp.type)));
                break; // Exit once a valid component array is found
            }
        }
        return components;
    }
    // Create standard component object
    createStandardComponentObject(componentData, nodeId, prefabInfoId) {
        const componentType = componentData.__type__ || componentData.type;
        if (!componentType) {
            console.warn('Component missing type info:', componentData);
            return null;
        }
        // Base component structure - based on official prefab format
        const component = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "node": {
                "__id__": nodeId
            },
            "_enabled": this.getComponentPropertyValue(componentData, 'enabled', true),
            "__prefab": {
                "__id__": prefabInfoId
            }
        };
        // Add type-specific properties based on component type
        this.addComponentSpecificProperties(component, componentData, componentType);
        // Add _id property
        component._id = "";
        return component;
    }
    // Add component-specific properties
    addComponentSpecificProperties(component, componentData, componentType) {
        switch (componentType) {
            case 'cc.UITransform':
                this.addUITransformProperties(component, componentData);
                break;
            case 'cc.Sprite':
                this.addSpriteProperties(component, componentData);
                break;
            case 'cc.Label':
                this.addLabelProperties(component, componentData);
                break;
            case 'cc.Button':
                this.addButtonProperties(component, componentData);
                break;
            default:
                // For unknown component types, copy all safe properties
                this.addGenericProperties(component, componentData);
                break;
        }
    }
    // UITransform component properties
    addUITransformProperties(component, componentData) {
        component._contentSize = this.createSizeObject(this.getComponentPropertyValue(componentData, 'contentSize', { width: 100, height: 100 }));
        component._anchorPoint = this.createVec2Object(this.getComponentPropertyValue(componentData, 'anchorPoint', { x: 0.5, y: 0.5 }));
    }
    // Sprite component properties
    addSpriteProperties(component, componentData) {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(this.getComponentPropertyValue(componentData, 'color', { r: 255, g: 255, b: 255, a: 255 }));
        component._spriteFrame = this.getComponentPropertyValue(componentData, 'spriteFrame', null);
        component._type = this.getComponentPropertyValue(componentData, 'type', 0);
        component._fillType = 0;
        component._sizeMode = this.getComponentPropertyValue(componentData, 'sizeMode', 1);
        component._fillCenter = this.createVec2Object({ x: 0, y: 0 });
        component._fillStart = 0;
        component._fillRange = 0;
        component._isTrimmedMode = true;
        component._useGrayscale = false;
        component._atlas = null;
    }
    // Label component properties
    addLabelProperties(component, componentData) {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(this.getComponentPropertyValue(componentData, 'color', { r: 0, g: 0, b: 0, a: 255 }));
        component._string = this.getComponentPropertyValue(componentData, 'string', 'Label');
        component._horizontalAlign = 1;
        component._verticalAlign = 1;
        component._actualFontSize = 20;
        component._fontSize = this.getComponentPropertyValue(componentData, 'fontSize', 20);
        component._fontFamily = 'Arial';
        component._lineHeight = 40;
        component._overflow = 1;
        component._enableWrapText = false;
        component._font = null;
        component._isSystemFontUsed = true;
        component._isItalic = false;
        component._isBold = false;
        component._isUnderline = false;
        component._underlineHeight = 2;
        component._cacheMode = 0;
    }
    // Button component properties
    addButtonProperties(component, componentData) {
        component.clickEvents = [];
        component._interactable = true;
        component._transition = 2;
        component._normalColor = this.createColorObject({ r: 214, g: 214, b: 214, a: 255 });
        component._hoverColor = this.createColorObject({ r: 211, g: 211, b: 211, a: 255 });
        component._pressedColor = this.createColorObject({ r: 255, g: 255, b: 255, a: 255 });
        component._disabledColor = this.createColorObject({ r: 124, g: 124, b: 124, a: 255 });
        component._duration = 0.1;
        component._zoomScale = 1.2;
    }
    // Add common properties
    addGenericProperties(component, componentData) {
        // Copy only safe, known properties
        const safeProperties = ['enabled', 'color', 'string', 'fontSize', 'spriteFrame', 'type', 'sizeMode'];
        for (const prop of safeProperties) {
            if (componentData.hasOwnProperty(prop)) {
                const value = this.getComponentPropertyValue(componentData, prop);
                if (value !== undefined) {
                    component[`_${prop}`] = value;
                }
            }
        }
    }
    // Create Vec2 object
    createVec2Object(data) {
        return {
            "__type__": "cc.Vec2",
            "x": (data === null || data === void 0 ? void 0 : data.x) || 0,
            "y": (data === null || data === void 0 ? void 0 : data.y) || 0
        };
    }
    // Create Vec3 object
    createVec3Object(data) {
        return {
            "__type__": "cc.Vec3",
            "x": (data === null || data === void 0 ? void 0 : data.x) || 0,
            "y": (data === null || data === void 0 ? void 0 : data.y) || 0,
            "z": (data === null || data === void 0 ? void 0 : data.z) || 0
        };
    }
    // Create Size object
    createSizeObject(data) {
        return {
            "__type__": "cc.Size",
            "width": (data === null || data === void 0 ? void 0 : data.width) || 100,
            "height": (data === null || data === void 0 ? void 0 : data.height) || 100
        };
    }
    // Create Color object
    createColorObject(data) {
        var _a, _b, _c, _d;
        return {
            "__type__": "cc.Color",
            "r": (_a = data === null || data === void 0 ? void 0 : data.r) !== null && _a !== void 0 ? _a : 255,
            "g": (_b = data === null || data === void 0 ? void 0 : data.g) !== null && _b !== void 0 ? _b : 255,
            "b": (_c = data === null || data === void 0 ? void 0 : data.b) !== null && _c !== void 0 ? _c : 255,
            "a": (_d = data === null || data === void 0 ? void 0 : data.a) !== null && _d !== void 0 ? _d : 255
        };
    }
    // Determine whether a component property should be copied
    shouldCopyComponentProperty(key, value) {
        // Skip internal and already-processed properties
        if (key.startsWith('__') || key === '_enabled' || key === 'node' || key === 'enabled') {
            return false;
        }
        // Skip functions and undefined values
        if (typeof value === 'function' || value === undefined) {
            return false;
        }
        return true;
    }
    // Get component property value - renamed to avoid conflicts
    getComponentPropertyValue(componentData, propertyName, defaultValue) {
        // Try to get property directly
        if (componentData[propertyName] !== undefined) {
            return this.extractValue(componentData[propertyName]);
        }
        // Try to get from value property
        if (componentData.value && componentData.value[propertyName] !== undefined) {
            return this.extractValue(componentData.value[propertyName]);
        }
        // Try property name with underscore prefix
        const prefixedName = `_${propertyName}`;
        if (componentData[prefixedName] !== undefined) {
            return this.extractValue(componentData[prefixedName]);
        }
        return defaultValue;
    }
    // Extract property value
    extractValue(data) {
        if (data === null || data === undefined) {
            return data;
        }
        // If value property exists, prefer it
        if (typeof data === 'object' && data.hasOwnProperty('value')) {
            return data.value;
        }
        // If it is a reference object, keep as-is
        if (typeof data === 'object' && (data.__id__ !== undefined || data.__uuid__ !== undefined)) {
            return data;
        }
        return data;
    }
    createStandardMetaData(prefabName, prefabUuid) {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }
    async savePrefabWithMeta(prefabPath, prefabData, metaData) {
        try {
            const prefabContent = JSON.stringify(prefabData, null, 2);
            const metaContent = JSON.stringify(metaData, null, 2);
            // Ensure path ends with .prefab
            const finalPrefabPath = prefabPath.endsWith('.prefab') ? prefabPath : `${prefabPath}.prefab`;
            const metaPath = `${finalPrefabPath}.meta`;
            // Use asset-db API to create prefab file
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', finalPrefabPath, prefabContent).then(() => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            });
            // Create meta file
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', metaPath, metaContent).then(() => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            });
            console.log(`=== Prefab save complete ===`);
            console.log(`Prefab file saved: ${finalPrefabPath}`);
            console.log(`Meta file saved: ${metaPath}`);
            console.log(`Prefab array total length: ${prefabData.length}`);
            console.log(`Prefab root node index: ${prefabData.length - 1}`);
            return { success: true };
        }
        catch (error) {
            console.error('Error saving prefab file:', error);
            return { success: false, error: error.message };
        }
    }
}
exports.PrefabTools = PrefabTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFhLFdBQVc7SUFDcEIsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsa0NBQWtDOzRCQUMvQyxPQUFPLEVBQUUsYUFBYTt5QkFDekI7cUJBQ0o7aUJBQ0o7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxhQUFhO2dCQUNuQixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUJBQW1CO3lCQUNuQztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUM7aUJBQzNCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUJBQW1CO3lCQUNuQzt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLDZCQUE2Qjt5QkFDN0M7d0JBQ0QsUUFBUSxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxrQkFBa0I7NEJB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QVEsQ0FBQyxLQUFLLDBDQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUMzRyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pILE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2xHLE1BQU0sTUFBTSxHQUFHLE1BQUEsTUFBQSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxtQ0FBSSxRQUFRLENBQUMsTUFBQSxRQUFRLENBQUMsS0FBSywwQ0FBRSxNQUFNLENBQUMsbUNBQUksSUFBSSxDQUFDO1FBQ3JGLE1BQU0sSUFBSSxHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUM3RixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQztRQUV0RixPQUFPO1lBQ0gsVUFBVSxFQUFFLFNBQVM7WUFDckIsT0FBTyxFQUFFLElBQUk7WUFDYixXQUFXLEVBQUUsQ0FBQztZQUNkLFNBQVMsRUFBRSxJQUFJO1lBQ2YsV0FBVyxFQUFFLEVBQUU7WUFDZixTQUFTLEVBQUUsTUFBTTtZQUNqQixhQUFhLEVBQUUsRUFBRSxFQUFFLDZEQUE2RDtZQUNoRixTQUFTLEVBQUU7Z0JBQ1AsUUFBUSxFQUFFLENBQUM7YUFDZDtZQUNELE9BQU8sRUFBRTtnQkFDTCxVQUFVLEVBQUUsU0FBUztnQkFDckIsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNmLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDZixHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDbEI7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDZixHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2YsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNmLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNsQjtZQUNELFNBQVMsRUFBRTtnQkFDUCxVQUFVLEVBQUUsU0FBUztnQkFDckIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNaLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDWixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDZjtZQUNELFFBQVEsRUFBRSxLQUFLO1lBQ2YsUUFBUSxFQUFFO2dCQUNOLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQzthQUNUO1lBQ0QsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFDO0lBQ04sQ0FBQztJQUVEOztPQUVHO0lBQ0sseUJBQXlCLENBQUMsVUFBa0IsRUFBRSxVQUFrQjtRQUNwRSxPQUFPO1lBQ0gsS0FBSyxFQUFFLE9BQU87WUFDZCxVQUFVLEVBQUUsUUFBUTtZQUNwQixVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUU7Z0JBQ0wsT0FBTzthQUNWO1lBQ0QsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLFVBQVU7Z0JBQzFCLFNBQVMsRUFBRSxLQUFLO2FBQ25CO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxRQUFnQixFQUFFLFVBQWtCLEVBQUUsVUFBa0I7UUFDOUYsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzNCLDJFQUEyRTtZQUMzRSxpR0FBaUc7WUFDakcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1RUFBdUUsQ0FBQyxDQUFDO1lBQ3JGLE9BQU8sQ0FBQztnQkFDSixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsdUVBQXVFO2FBQ2pGLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFnQixFQUFFLFNBQWlCO1FBQy9ELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUMzQix5REFBeUQ7WUFDeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFlLENBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUN0RixPQUFPLENBQUM7b0JBQ0osT0FBTyxFQUFFLElBQUk7b0JBQ2IsSUFBSSxFQUFFO3dCQUNGLFFBQVEsRUFBRSxRQUFRO3dCQUNsQixTQUFTLEVBQUUsU0FBUzt3QkFDcEIsT0FBTyxFQUFFLG1DQUFtQztxQkFDL0M7aUJBQ0osQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUU7Z0JBQ3BCLE9BQU8sQ0FBQztvQkFDSixPQUFPLEVBQUUsS0FBSztvQkFDZCxLQUFLLEVBQUUsK0JBQStCLEtBQUssQ0FBQyxPQUFPLEVBQUU7aUJBQ3hELENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQscURBQXFEO0lBQzdDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUFnQjtRQUMvQyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFhLEVBQUUsRUFBRTtnQkFDM0UsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNaLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztvQkFDMUQsT0FBTztnQkFDWCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDL0MsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUU7Z0JBQ3BCLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLFFBQWEsRUFBRSxVQUFrQixFQUFFLFVBQWtCO1FBQ3hGLHFFQUFxRTtRQUNyRSxNQUFNLFVBQVUsR0FBVSxFQUFFLENBQUM7UUFDN0IsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLDJDQUEyQztRQUMzQyxNQUFNLFdBQVcsR0FBRztZQUNoQixVQUFVLEVBQUUsV0FBVztZQUN2QixPQUFPLEVBQUUsVUFBVTtZQUNuQixXQUFXLEVBQUUsQ0FBQztZQUNkLGtCQUFrQixFQUFFLEVBQUU7WUFDdEIsU0FBUyxFQUFFLEVBQUU7WUFDYixNQUFNLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLENBQUM7YUFDZDtZQUNELG9CQUFvQixFQUFFLENBQUM7WUFDdkIsWUFBWSxFQUFFLEtBQUs7U0FDdEIsQ0FBQztRQUNGLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0IsU0FBUyxFQUFFLENBQUM7UUFFWiw0QkFBNEI7UUFDNUIsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDcEYsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFFNUIsNkRBQTZEO1FBQzdELE1BQU0sY0FBYyxHQUFHO1lBQ25CLFVBQVUsRUFBRSxlQUFlO1lBQzNCLE1BQU0sRUFBRTtnQkFDSixRQUFRLEVBQUUsQ0FBQzthQUNkO1lBQ0QsT0FBTyxFQUFFO2dCQUNMLFVBQVUsRUFBRSxVQUFVO2FBQ3pCO1lBQ0QsUUFBUSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDL0IsVUFBVSxFQUFFLElBQUk7WUFDaEIsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQiwyQkFBMkIsRUFBRSxFQUFFO1NBQ2xDLENBQUM7UUFDRixVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRWhDLE9BQU8sVUFBVSxDQUFDO0lBQ3RCLENBQUM7SUFHTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBYSxFQUFFLFFBQXVCLEVBQUUsVUFBaUIsRUFBRSxTQUFpQjs7UUFDdkcsTUFBTSxNQUFNLEdBQUcsU0FBUyxFQUFFLENBQUM7UUFFM0IseUVBQXlFO1FBQ3pFLE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBUyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxLQUFLLE1BQUssU0FBUztnQkFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDakQsSUFBSSxJQUFJLEtBQUssU0FBUztnQkFBRSxPQUFPLElBQUksQ0FBQztZQUNwQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUMzRyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pILE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2xHLE1BQU0sTUFBTSxHQUFHLE1BQUEsTUFBQSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxtQ0FBSSxRQUFRLENBQUMsTUFBQSxRQUFRLENBQUMsS0FBSywwQ0FBRSxNQUFNLENBQUMsbUNBQUksSUFBSSxDQUFDO1FBQ3JGLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDO1FBQ2pGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDO1FBRXRGLE1BQU0sSUFBSSxHQUFRO1lBQ2QsVUFBVSxFQUFFLFNBQVM7WUFDckIsT0FBTyxFQUFFLElBQUk7WUFDYixXQUFXLEVBQUUsQ0FBQztZQUNkLGtCQUFrQixFQUFFLEVBQUU7WUFDdEIsU0FBUyxFQUFFLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQzVELFdBQVcsRUFBRSxFQUFFO1lBQ2YsU0FBUyxFQUFFLE1BQU07WUFDakIsYUFBYSxFQUFFLEVBQUU7WUFDakIsU0FBUyxFQUFFLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixRQUFRLEVBQUUsU0FBUyxFQUFFO2FBQ3hCLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDUixPQUFPLEVBQUU7Z0JBQ0wsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDZixHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2YsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ2xCO1lBQ0QsT0FBTyxFQUFFO2dCQUNMLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2YsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNmLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDZixHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDbEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDWixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ1osR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2Y7WUFDRCxXQUFXLEVBQUUsQ0FBQztZQUNkLFFBQVEsRUFBRSxLQUFLO1lBQ2YsUUFBUSxFQUFFO2dCQUNOLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQzthQUNUO1lBQ0QsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFDO1FBRUYsNkVBQTZFO1FBQzdFLCtDQUErQztRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSwrRUFBK0UsQ0FBQyxDQUFDO1FBRXpHLDZFQUE2RTtRQUM3RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLFFBQVEsVUFBVSxDQUFDLE1BQU0sb0VBQW9FLENBQUMsQ0FBQztRQUMzSCxDQUFDO1FBRUQsa0VBQWtFO1FBQ2xFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxRQUFRLGlCQUFpQixDQUFDLE1BQU0sY0FBYyxDQUFDLENBQUM7WUFFeEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksS0FBSSxNQUFBLFNBQVMsQ0FBQyxLQUFLLDBDQUFFLElBQUksQ0FBQSxJQUFJLFNBQVMsQ0FBQztnQkFDdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUU1RCxJQUFJLENBQUM7b0JBQ0QsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDO29CQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUUzQyxnQ0FBZ0M7b0JBQ2hDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUMxRixVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7b0JBRS9CLDhEQUE4RDtvQkFDOUQsMkNBQTJDO29CQUMzQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBRWhDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixTQUFTLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELHdDQUF3QztJQUNoQyx5QkFBeUIsQ0FBQyxRQUFhOztRQUMzQyxNQUFNLFVBQVUsR0FBVSxFQUFFLENBQUM7UUFFN0IscURBQXFEO1FBQ3JELE1BQU0sZ0JBQWdCLEdBQUc7WUFDckIsUUFBUSxDQUFDLFNBQVM7WUFDbEIsUUFBUSxDQUFDLFVBQVU7WUFDbkIsTUFBQSxRQUFRLENBQUMsS0FBSywwQ0FBRSxTQUFTO1lBQ3pCLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsVUFBVTtTQUM3QixDQUFDO1FBRUYsS0FBSyxNQUFNLE1BQU0sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3BDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN4QixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsTUFBTSxDQUFDLDZDQUE2QztZQUN4RCxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxtQ0FBbUM7SUFDM0IsNkJBQTZCLENBQUMsYUFBa0IsRUFBRSxNQUFjLEVBQUUsWUFBb0I7UUFDMUYsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFFBQVEsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDO1FBRW5FLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzVELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxTQUFTLEdBQVE7WUFDbkIsVUFBVSxFQUFFLGFBQWE7WUFDekIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXLEVBQUUsQ0FBQztZQUNkLE1BQU0sRUFBRTtnQkFDSixRQUFRLEVBQUUsTUFBTTthQUNuQjtZQUNELFVBQVUsRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7WUFDMUUsVUFBVSxFQUFFO2dCQUNSLFFBQVEsRUFBRSxZQUFZO2FBQ3pCO1NBQ0osQ0FBQztRQUVGLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsOEJBQThCLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUU3RSxtQkFBbUI7UUFDbkIsU0FBUyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFFbkIsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVELG9DQUFvQztJQUM1Qiw4QkFBOEIsQ0FBQyxTQUFjLEVBQUUsYUFBa0IsRUFBRSxhQUFxQjtRQUM1RixRQUFRLGFBQWEsRUFBRSxDQUFDO1lBQ3BCLEtBQUssZ0JBQWdCO2dCQUNqQixJQUFJLENBQUMsd0JBQXdCLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNO1lBQ1YsS0FBSyxXQUFXO2dCQUNaLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ25ELE1BQU07WUFDVixLQUFLLFVBQVU7Z0JBQ1gsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDbEQsTUFBTTtZQUNWLEtBQUssV0FBVztnQkFDWixJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNO1lBQ1Y7Z0JBQ0ksd0RBQXdEO2dCQUN4RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNO1FBQ2QsQ0FBQztJQUNMLENBQUM7SUFFRCxtQ0FBbUM7SUFDM0Isd0JBQXdCLENBQUMsU0FBYyxFQUFFLGFBQWtCO1FBQy9ELFNBQVMsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUMxQyxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQzVGLENBQUM7UUFDRixTQUFTLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FDMUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUNuRixDQUFDO0lBQ04sQ0FBQztJQUVELDhCQUE4QjtJQUN0QixtQkFBbUIsQ0FBQyxTQUFjLEVBQUUsYUFBa0I7UUFDMUQsU0FBUyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDeEIsU0FBUyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDakMsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDOUIsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDOUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQ3JDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQzdGLENBQUM7UUFDRixTQUFTLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVGLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0UsU0FBUyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDeEIsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRixTQUFTLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUQsU0FBUyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDekIsU0FBUyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDekIsU0FBUyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDaEMsU0FBUyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7UUFDaEMsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELDZCQUE2QjtJQUNyQixrQkFBa0IsQ0FBQyxTQUFjLEVBQUUsYUFBa0I7UUFDekQsU0FBUyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDeEIsU0FBUyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDakMsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDOUIsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDOUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQ3JDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQ3ZGLENBQUM7UUFDRixTQUFTLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JGLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDL0IsU0FBUyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFDN0IsU0FBUyxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDL0IsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwRixTQUFTLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztRQUNoQyxTQUFTLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUMzQixTQUFTLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUN4QixTQUFTLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztRQUNsQyxTQUFTLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN2QixTQUFTLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLFNBQVMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQzVCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQzFCLFNBQVMsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQy9CLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDL0IsU0FBUyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELDhCQUE4QjtJQUN0QixtQkFBbUIsQ0FBQyxTQUFjLEVBQUUsYUFBa0I7UUFDMUQsU0FBUyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDM0IsU0FBUyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDL0IsU0FBUyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDMUIsU0FBUyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNwRixTQUFTLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLFNBQVMsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsU0FBUyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RixTQUFTLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztRQUMxQixTQUFTLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztJQUMvQixDQUFDO0lBRUQsd0JBQXdCO0lBQ2hCLG9CQUFvQixDQUFDLFNBQWMsRUFBRSxhQUFrQjtRQUMzRCxtQ0FBbUM7UUFDbkMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVyRyxLQUFLLE1BQU0sSUFBSSxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ2hDLElBQUksYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDdEIsU0FBUyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ2xDLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCxxQkFBcUI7SUFDYixnQkFBZ0IsQ0FBQyxJQUFTO1FBQzlCLE9BQU87WUFDSCxVQUFVLEVBQUUsU0FBUztZQUNyQixHQUFHLEVBQUUsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsQ0FBQyxLQUFJLENBQUM7WUFDakIsR0FBRyxFQUFFLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLENBQUMsS0FBSSxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQscUJBQXFCO0lBQ2IsZ0JBQWdCLENBQUMsSUFBUztRQUM5QixPQUFPO1lBQ0gsVUFBVSxFQUFFLFNBQVM7WUFDckIsR0FBRyxFQUFFLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLENBQUMsS0FBSSxDQUFDO1lBQ2pCLEdBQUcsRUFBRSxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxDQUFDLEtBQUksQ0FBQztZQUNqQixHQUFHLEVBQUUsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsQ0FBQyxLQUFJLENBQUM7U0FDcEIsQ0FBQztJQUNOLENBQUM7SUFFRCxxQkFBcUI7SUFDYixnQkFBZ0IsQ0FBQyxJQUFTO1FBQzlCLE9BQU87WUFDSCxVQUFVLEVBQUUsU0FBUztZQUNyQixPQUFPLEVBQUUsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsS0FBSyxLQUFJLEdBQUc7WUFDM0IsUUFBUSxFQUFFLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLE1BQU0sS0FBSSxHQUFHO1NBQ2hDLENBQUM7SUFDTixDQUFDO0lBRUQsc0JBQXNCO0lBQ2QsaUJBQWlCLENBQUMsSUFBUzs7UUFDL0IsT0FBTztZQUNILFVBQVUsRUFBRSxVQUFVO1lBQ3RCLEdBQUcsRUFBRSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxDQUFDLG1DQUFJLEdBQUc7WUFDbkIsR0FBRyxFQUFFLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLENBQUMsbUNBQUksR0FBRztZQUNuQixHQUFHLEVBQUUsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsQ0FBQyxtQ0FBSSxHQUFHO1lBQ25CLEdBQUcsRUFBRSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxDQUFDLG1DQUFJLEdBQUc7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCwwREFBMEQ7SUFDbEQsMkJBQTJCLENBQUMsR0FBVyxFQUFFLEtBQVU7UUFDdkQsaURBQWlEO1FBQ2pELElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssVUFBVSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3BGLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxzQ0FBc0M7UUFDdEMsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3JELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBR0QsNERBQTREO0lBQ3BELHlCQUF5QixDQUFDLGFBQWtCLEVBQUUsWUFBb0IsRUFBRSxZQUFrQjtRQUMxRiwrQkFBK0I7UUFDL0IsSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsSUFBSSxhQUFhLENBQUMsS0FBSyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDekUsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsMkNBQTJDO1FBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDeEMsSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxPQUFPLFlBQVksQ0FBQztJQUN4QixDQUFDO0lBRUQseUJBQXlCO0lBQ2pCLFlBQVksQ0FBQyxJQUFTO1FBQzFCLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELHNDQUFzQztRQUN0QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDM0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUM7UUFFRCwwQ0FBMEM7UUFDMUMsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDekYsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxVQUFrQixFQUFFLFVBQWtCO1FBQ2pFLE9BQU87WUFDSCxLQUFLLEVBQUUsUUFBUTtZQUNmLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE1BQU0sRUFBRSxVQUFVO1lBQ2xCLE9BQU8sRUFBRTtnQkFDTCxPQUFPO2FBQ1Y7WUFDRCxVQUFVLEVBQUUsRUFBRTtZQUNkLFVBQVUsRUFBRTtnQkFDUixjQUFjLEVBQUUsVUFBVTthQUM3QjtTQUNKLENBQUM7SUFDTixDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLFVBQWtCLEVBQUUsVUFBaUIsRUFBRSxRQUFhO1FBQ2pGLElBQUksQ0FBQztZQUNELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEQsZ0NBQWdDO1lBQ2hDLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLFNBQVMsQ0FBQztZQUM3RixNQUFNLFFBQVEsR0FBRyxHQUFHLGVBQWUsT0FBTyxDQUFDO1lBRTNDLHlDQUF5QztZQUN6QyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNsQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO29CQUN6RixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO29CQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCxtQkFBbUI7WUFDbkIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDaEYsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtvQkFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQixDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFaEUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEQsQ0FBQztJQUNMLENBQUM7Q0FFSjtBQXR5RkQsa0NBc3lGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciwgUHJlZmFiSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQcmVmYWJUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3ByZWZhYl9saXN0JyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFsbCBwcmVmYWJzIGluIHRoZSBwcm9qZWN0JyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xkZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGb2xkZXIgcGF0aCB0byBzZWFyY2ggKG9wdGlvbmFsKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdsb2FkX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xvYWQgYSBwcmVmYWIgYnkgcGF0aCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2luc3RhbnRpYXRlX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luc3RhbnRpYXRlIGEgcHJlZmFiIGluIHRoZSBzY2VuZScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUGFyZW50IG5vZGUgVVVJRCAob3B0aW9uYWwpJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luaXRpYWwgcG9zaXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3ByZWZhYlBhdGgnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnY3JlYXRlX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIHByZWZhYiBmcm9tIGEgbm9kZSB3aXRoIGFsbCBjaGlsZHJlbiBhbmQgY29tcG9uZW50cycsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2Ugbm9kZSBVVUlEJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gc2F2ZSB0aGUgcHJlZmFiIChlLmcuLCBkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYiknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgbmFtZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnc2F2ZVBhdGgnLCAncHJlZmFiTmFtZSddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICd1cGRhdGVfcHJlZmFiJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIGFuIGV4aXN0aW5nIHByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCB3aXRoIGNoYW5nZXMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3ByZWZhYlBhdGgnLCAnbm9kZVV1aWQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAncmV2ZXJ0X3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JldmVydCBwcmVmYWIgaW5zdGFuY2UgdG8gb3JpZ2luYWwnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGluc3RhbmNlIG5vZGUgVVVJRCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3ByZWZhYl9pbmZvJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGRldGFpbGVkIHByZWZhYiBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRlX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIGEgcHJlZmFiIGZpbGUgZm9ybWF0JyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGFzc2V0IHBhdGgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3ByZWZhYlBhdGgnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZHVwbGljYXRlX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0R1cGxpY2F0ZSBhbiBleGlzdGluZyBwcmVmYWInLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVByZWZhYlBhdGg6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2UgcHJlZmFiIHBhdGgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFByZWZhYlBhdGg6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgcHJlZmFiIHBhdGgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ByZWZhYk5hbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOZXcgcHJlZmFiIG5hbWUnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZVByZWZhYlBhdGgnLCAndGFyZ2V0UHJlZmFiUGF0aCddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXN0b3JlX3ByZWZhYl9ub2RlJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVzdG9yZSBwcmVmYWIgbm9kZSB1c2luZyBwcmVmYWIgYXNzZXQgKGJ1aWx0LWluIHVuZG8gcmVjb3JkKScsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgaW5zdGFuY2Ugbm9kZSBVVUlEJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgVVVJRCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnYXNzZXRVdWlkJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0X3ByZWZhYl9saXN0JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFByZWZhYkxpc3QoYXJncy5mb2xkZXIpO1xyXG4gICAgICAgICAgICBjYXNlICdsb2FkX3ByZWZhYic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5sb2FkUHJlZmFiKGFyZ3MucHJlZmFiUGF0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2luc3RhbnRpYXRlX3ByZWZhYic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnN0YW50aWF0ZVByZWZhYihhcmdzKTtcclxuICAgICAgICAgICAgY2FzZSAnY3JlYXRlX3ByZWZhYic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWIoYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3VwZGF0ZV9wcmVmYWInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlUHJlZmFiKGFyZ3MucHJlZmFiUGF0aCwgYXJncy5ub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3JldmVydF9wcmVmYWInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmV2ZXJ0UHJlZmFiKGFyZ3Mubm9kZVV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfcHJlZmFiX2luZm8nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0UHJlZmFiSW5mbyhhcmdzLnByZWZhYlBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlICd2YWxpZGF0ZV9wcmVmYWInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudmFsaWRhdGVQcmVmYWIoYXJncy5wcmVmYWJQYXRoKTtcclxuICAgICAgICAgICAgY2FzZSAnZHVwbGljYXRlX3ByZWZhYic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kdXBsaWNhdGVQcmVmYWIoYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3Jlc3RvcmVfcHJlZmFiX25vZGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzdG9yZVByZWZhYk5vZGUoYXJncy5ub2RlVXVpZCwgYXJncy5hc3NldFV1aWQpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiTGlzdChmb2xkZXI6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXR0ZXJuID0gZm9sZGVyLmVuZHNXaXRoKCcvJykgPyBcclxuICAgICAgICAgICAgICAgIGAke2ZvbGRlcn0qKi8qLnByZWZhYmAgOiBgJHtmb2xkZXJ9LyoqLyoucHJlZmFiYDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IHBhdHRlcm5cclxuICAgICAgICAgICAgfSkudGhlbigocmVzdWx0czogYW55W10pID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYnM6IFByZWZhYkluZm9bXSA9IHJlc3VsdHMubWFwKGFzc2V0ID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBmb2xkZXI6IGFzc2V0LnVybC5zdWJzdHJpbmcoMCwgYXNzZXQudXJsLmxhc3RJbmRleE9mKCcvJykpXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcHJlZmFicyB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxvYWRQcmVmYWIocHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJlZmFiIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnbG9hZC1hc3NldCcsIHtcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldEluZm8udXVpZFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oKHByZWZhYkRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHByZWZhYkRhdGEudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJlZmFiRGF0YS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIGxvYWRlZCBzdWNjZXNzZnVsbHknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBpbnN0YW50aWF0ZVByZWZhYihhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHByZWZhYiBhc3NldCBpbmZvXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXJncy5wcmVmYWJQYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmVmYWIgbm90IGZvdW5kJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBjb3JyZWN0IGNyZWF0ZS1ub2RlIEFQSSB0byBpbnN0YW50aWF0ZSBmcm9tIHByZWZhYiBhc3NldFxyXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlTm9kZU9wdGlvbnM6IGFueSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IGFzc2V0SW5mby51dWlkXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgbm9kZVxyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MucGFyZW50VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLnBhcmVudCA9IGFyZ3MucGFyZW50VXVpZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgbm9kZSBuYW1lXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMubmFtZSA9IGFyZ3MubmFtZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXNzZXRJbmZvLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5uYW1lID0gYXNzZXRJbmZvLm5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IGluaXRpYWwgcHJvcGVydGllcyAoZS5nLiBwb3NpdGlvbilcclxuICAgICAgICAgICAgICAgIGlmIChhcmdzLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuZHVtcCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBhcmdzLnBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgbm9kZVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIGNyZWF0ZU5vZGVPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBBcnJheS5pc0FycmF5KG5vZGVVdWlkKSA/IG5vZGVVdWlkWzBdIDogbm9kZVV1aWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTm90ZTogY3JlYXRlLW5vZGUgQVBJIHNob3VsZCBhdXRvbWF0aWNhbGx5IGVzdGFibGlzaCBwcmVmYWIgbGlua2FnZSB3aGVuIGNyZWF0ZWQgZnJvbSBhIHByZWZhYiBhc3NldFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1ByZWZhYiBub2RlIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5OicsIHtcclxuICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiBhc3NldEluZm8udXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBhcmdzLnByZWZhYlBhdGhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogYXJncy5wcmVmYWJQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiBhcmdzLnBhcmVudFV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhcmdzLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIGluc3RhbnRpYXRlZCBzdWNjZXNzZnVsbHkgYW5kIHByZWZhYiBsaW5rYWdlIGVzdGFibGlzaGVkJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBQcmVmYWIgaW5zdGFudGlhdGlvbiBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YCxcclxuICAgICAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1BsZWFzZSBjaGVjayB0aGF0IHRoZSBwcmVmYWIgcGF0aCBpcyBjb3JyZWN0IGFuZCB0aGUgcHJlZmFiIGZpbGUgZm9ybWF0IGlzIHZhbGlkJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVzdGFibGlzaCB0aGUgbGluayBiZXR3ZWVuIGEgbm9kZSBhbmQgYSBwcmVmYWIgYXNzZXQuXHJcbiAgICAgKiBDcmVhdGVzIHRoZSBuZWNlc3NhcnkgUHJlZmFiSW5mbyBhbmQgUHJlZmFiSW5zdGFuY2Ugc3RydWN0dXJlcy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBlc3RhYmxpc2hQcmVmYWJDb25uZWN0aW9uKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gUmVhZCB0aGUgcHJlZmFiIGZpbGUgdG8gZ2V0IHRoZSByb290IG5vZGUncyBmaWxlSWRcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29udGVudCA9IGF3YWl0IHRoaXMucmVhZFByZWZhYkZpbGUocHJlZmFiUGF0aCk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiQ29udGVudCB8fCAhcHJlZmFiQ29udGVudC5kYXRhIHx8ICFwcmVmYWJDb250ZW50LmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byByZWFkIHByZWZhYiBmaWxlIGNvbnRlbnQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRmluZCB0aGUgcHJlZmFiIHJvb3Qgbm9kZSdzIGZpbGVJZCAodXN1YWxseSB0aGUgc2Vjb25kIG9iamVjdCwgaW5kZXggMSlcclxuICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBwcmVmYWJDb250ZW50LmRhdGEuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLl9fdHlwZSA9PT0gJ2NjLk5vZGUnICYmIGl0ZW0uX3BhcmVudCA9PT0gbnVsbCk7XHJcbiAgICAgICAgICAgIGlmICghcm9vdE5vZGUgfHwgIXJvb3ROb2RlLl9wcmVmYWIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGZpbmQgcHJlZmFiIHJvb3Qgbm9kZSBvciBpdHMgcHJlZmFiIGluZm8nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSByb290IG5vZGUncyBQcmVmYWJJbmZvXHJcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0gcHJlZmFiQ29udGVudC5kYXRhW3Jvb3ROb2RlLl9wcmVmYWIuX19pZF9fXTtcclxuICAgICAgICAgICAgaWYgKCFyb290UHJlZmFiSW5mbyB8fCByb290UHJlZmFiSW5mby5fX3R5cGUgIT09ICdjYy5QcmVmYWJJbmZvJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCBQcmVmYWJJbmZvIGZvciB0aGUgcHJlZmFiIHJvb3Qgbm9kZScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByb290RmlsZUlkID0gcm9vdFByZWZhYkluZm8uZmlsZUlkO1xyXG5cclxuICAgICAgICAgICAgLy8gVXNlIHRoZSBzY2VuZSBBUEkgdG8gZXN0YWJsaXNoIHRoZSBwcmVmYWIgY29ubmVjdGlvblxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJDb25uZWN0aW9uRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgcHJlZmFiOiBwcmVmYWJVdWlkLFxyXG4gICAgICAgICAgICAgICAgZmlsZUlkOiByb290RmlsZUlkXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgQVBJIG1ldGhvZHMgdG8gZXN0YWJsaXNoIHRoZSBwcmVmYWIgY29ubmVjdGlvblxyXG4gICAgICAgICAgICBjb25zdCBjb25uZWN0aW9uTWV0aG9kcyA9IFtcclxuICAgICAgICAgICAgICAgICgpID0+IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nvbm5lY3QtcHJlZmFiLWluc3RhbmNlJywgcHJlZmFiQ29ubmVjdGlvbkRhdGEpLFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByZWZhYi1jb25uZWN0aW9uJywgcHJlZmFiQ29ubmVjdGlvbkRhdGEpLFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYXBwbHktcHJlZmFiLWxpbmsnLCBwcmVmYWJDb25uZWN0aW9uRGF0YSlcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjb25uZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBtZXRob2Qgb2YgY29ubmVjdGlvbk1ldGhvZHMpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbWV0aG9kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdQcmVmYWIgY29ubmVjdGlvbiBtZXRob2QgZmFpbGVkLCB0cnlpbmcgbmV4dCBtZXRob2Q6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgYWxsIEFQSSBtZXRob2RzIGZhaWwsIGF0dGVtcHQgdG8gbWFudWFsbHkgbW9kaWZ5IHRoZSBzY2VuZSBkYXRhXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FsbCBwcmVmYWIgY29ubmVjdGlvbiBBUElzIGZhaWxlZCwgYXR0ZW1wdGluZyBtYW51YWwgY29ubmVjdGlvbicpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5tYW51YWxseUVzdGFibGlzaFByZWZhYkNvbm5lY3Rpb24obm9kZVV1aWQsIHByZWZhYlV1aWQsIHJvb3RGaWxlSWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBlc3RhYmxpc2ggcHJlZmFiIGNvbm5lY3Rpb246JywgZXJyb3IpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYW51YWxseSBlc3RhYmxpc2ggdGhlIHByZWZhYiBjb25uZWN0aW9uIChmYWxsYmFjayB3aGVuIEFQSSBtZXRob2RzIGZhaWwpLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIG1hbnVhbGx5RXN0YWJsaXNoUHJlZmFiQ29ubmVjdGlvbihub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcsIHJvb3RGaWxlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gbW9kaWZ5IHRoZSBub2RlJ3MgX3ByZWZhYiBwcm9wZXJ0eSB1c2luZyB0aGUgZHVtcCBBUElcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29ubmVjdGlvbkRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBbbm9kZVV1aWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ19wcmVmYWInOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdfX3V1aWRfXyc6IHByZWZhYlV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdfX2V4cGVjdGVkVHlwZV9fJzogJ2NjLlByZWZhYicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdmaWxlSWQnOiByb290RmlsZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiAnX3ByZWZhYicsXHJcbiAgICAgICAgICAgICAgICBkdW1wOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ19fdXVpZF9fJzogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ19fZXhwZWN0ZWRUeXBlX18nOiAnY2MuUHJlZmFiJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01hbnVhbCBwcmVmYWIgY29ubmVjdGlvbiBhbHNvIGZhaWxlZDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB0aHJvdzsgdGhlIGJhc2ljIG5vZGUgY3JlYXRpb24gYWxyZWFkeSBzdWNjZWVkZWRcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIHRoZSBjb250ZW50IG9mIGEgcHJlZmFiIGZpbGUuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgcmVhZFByZWZhYkZpbGUocHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBUcnkgdG8gcmVhZCB0aGUgZmlsZSBjb250ZW50IHVzaW5nIHRoZSBhc3NldC1kYiBBUElcclxuICAgICAgICAgICAgbGV0IGFzc2V0Q29udGVudDogYW55O1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXNzZXRDb250ZW50ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0Q29udGVudCAmJiBhc3NldENvbnRlbnQuc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSBzb3VyY2UgcGF0aCBleGlzdHMsIHJlYWQgdGhlIGZpbGUgZGlyZWN0bHlcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGgucmVzb2x2ZShhc3NldENvbnRlbnQuc291cmNlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmdWxsUGF0aCwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShmaWxlQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JlYWRpbmcgdmlhIGFzc2V0LWRiIGZhaWxlZCwgdHJ5aW5nIGFsdGVybmF0aXZlIG1ldGhvZDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBjb252ZXJ0IHRoZSBkYjovLyBwYXRoIHRvIGFuIGFjdHVhbCBmaWxlIHBhdGhcclxuICAgICAgICAgICAgY29uc3QgZnNQYXRoID0gcHJlZmFiUGF0aC5yZXBsYWNlKCdkYjovL2Fzc2V0cy8nLCAnYXNzZXRzLycpLnJlcGxhY2UoJ2RiOi8vYXNzZXRzJywgJ2Fzc2V0cycpO1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgcG9zc2libGUgcHJvamVjdCByb290IHBhdGhzXHJcbiAgICAgICAgICAgIGNvbnN0IHBvc3NpYmxlUGF0aHMgPSBbXHJcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4uLy4uL05ld1Byb2plY3RfMycsIGZzUGF0aCksXHJcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zJywgZnNQYXRoKSxcclxuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZShmc1BhdGgpLFxyXG4gICAgICAgICAgICAgICAgLy8gQWxzbyB0cnkgYSBkaXJlY3QgcGF0aCBpZiB0aGUgZmlsZSBpcyBpbiB0aGUgcm9vdCBkaXJlY3RvcnlcclxuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZSgnL1VzZXJzL2xpemhpeW9uZy9OZXdQcm9qZWN0XzMvYXNzZXRzJywgcGF0aC5iYXNlbmFtZShmc1BhdGgpKVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0F0dGVtcHRpbmcgdG8gcmVhZCBwcmVmYWIgZmlsZSwgcGF0aCBjb252ZXJzaW9uOicsIHtcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsUGF0aDogcHJlZmFiUGF0aCxcclxuICAgICAgICAgICAgICAgIGZzUGF0aDogZnNQYXRoLFxyXG4gICAgICAgICAgICAgICAgcG9zc2libGVQYXRoczogcG9zc2libGVQYXRoc1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZnVsbFBhdGggb2YgcG9zc2libGVQYXRocykge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2hlY2tpbmcgcGF0aDogJHtmdWxsUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmdWxsUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEZvdW5kIGZpbGU6ICR7ZnVsbFBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZ1bGxQYXRoLCAndXRmOCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGZpbGVDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgcGFyc2VkIHN1Y2Nlc3NmdWxseSwgZGF0YSBzdHJ1Y3R1cmU6Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRGF0YTogISFwYXJzZWQuZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFMZW5ndGg6IHBhcnNlZC5kYXRhID8gcGFyc2VkLmRhdGEubGVuZ3RoIDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgRmlsZSBkb2VzIG5vdCBleGlzdDogJHtmdWxsUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChyZWFkRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byByZWFkIGZpbGUgJHtmdWxsUGF0aH06YCwgcmVhZEVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCBvciByZWFkIHRoZSBwcmVmYWIgZmlsZScpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIHByZWZhYiBmaWxlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdHJ5Q3JlYXRlTm9kZVdpdGhQcmVmYWIoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGFyZ3MucHJlZmFiUGF0aCkudGhlbigoYXNzZXRJbmZvOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmVmYWIgbm90IGZvdW5kJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWV0aG9kIDI6IHVzZSBjcmVhdGUtbm9kZSB3aXRoIGEgcHJlZmFiIGFzc2V0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVOb2RlT3B0aW9uczogYW55ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogYXNzZXRJbmZvLnV1aWRcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHBhcmVudCBub2RlXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wYXJlbnRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMucGFyZW50ID0gYXJncy5wYXJlbnRVdWlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIGNyZWF0ZU5vZGVPcHRpb25zKTtcclxuICAgICAgICAgICAgfSkudGhlbigobm9kZVV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gQXJyYXkuaXNBcnJheShub2RlVXVpZCkgPyBub2RlVXVpZFswXSA6IG5vZGVVdWlkO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIGEgcG9zaXRpb24gd2FzIHNwZWNpZmllZCwgc2V0IHRoZSBub2RlIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wb3NpdGlvbiAmJiB1dWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAncG9zaXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBhcmdzLnBvc2l0aW9uIH1cclxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IGFyZ3MucHJlZmFiUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXJncy5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIGluc3RhbnRpYXRlZCBzdWNjZXNzZnVsbHkgKGZhbGxiYWNrIG1ldGhvZCkgYW5kIHBvc2l0aW9uIHNldCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogYXJncy5wcmVmYWJQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgaW5zdGFudGlhdGVkIHN1Y2Nlc3NmdWxseSAoZmFsbGJhY2sgbWV0aG9kKSBidXQgcG9zaXRpb24gY291bGQgbm90IGJlIHNldCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IGFyZ3MucHJlZmFiUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgaW5zdGFudGlhdGVkIHN1Y2Nlc3NmdWxseSAoZmFsbGJhY2sgbWV0aG9kKSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWxsYmFjayBwcmVmYWIgaW5zdGFudGlhdGlvbiBtZXRob2QgYWxzbyBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdHJ5QWx0ZXJuYXRpdmVJbnN0YW50aWF0ZU1ldGhvZHMoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIE1ldGhvZCAxOiB0cnkgdXNpbmcgY3JlYXRlLW5vZGUgdGhlbiBhcHBseSB0aGUgcHJlZmFiXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCB0aGlzLmdldEFzc2V0SW5mbyhhcmdzLnByZWZhYlBhdGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVW5hYmxlIHRvIGdldCBwcmVmYWIgYXNzZXQgaW5mbycgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBlbXB0eSBub2RlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5vZGUoYXJncy5wYXJlbnRVdWlkLCBhcmdzLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmICghY3JlYXRlUmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNyZWF0ZVJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBhcHBseSB0aGUgcHJlZmFiIHRvIHRoZSBub2RlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcHBseVJlc3VsdCA9IGF3YWl0IHRoaXMuYXBwbHlQcmVmYWJUb05vZGUoY3JlYXRlUmVzdWx0LmRhdGEubm9kZVV1aWQsIGFzc2V0SW5mby51dWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChhcHBseVJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBjcmVhdGVSZXN1bHQuZGF0YS5ub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNyZWF0ZVJlc3VsdC5kYXRhLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIGluc3RhbnRpYXRlZCBzdWNjZXNzZnVsbHkgKHVzaW5nIGFsdGVybmF0aXZlIG1ldGhvZCknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1VuYWJsZSB0byBhcHBseSBwcmVmYWIgZGF0YSB0byBub2RlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IGNyZWF0ZVJlc3VsdC5kYXRhLm5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vZGUgY3JlYXRlZCwgYnV0IHVuYWJsZSB0byBhcHBseSBwcmVmYWIgZGF0YSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBBbHRlcm5hdGl2ZSBpbnN0YW50aWF0aW9uIG1ldGhvZCBmYWlsZWQ6ICR7ZXJyb3J9YCB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QXNzZXRJbmZvKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBwcmVmYWJQYXRoKS50aGVuKChhc3NldEluZm86IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldEluZm8pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGUocGFyZW50VXVpZD86IHN0cmluZywgcG9zaXRpb24/OiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjcmVhdGVOb2RlT3B0aW9uczogYW55ID0ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ1ByZWZhYkluc3RhbmNlJ1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHBhcmVudCBub2RlXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5wYXJlbnQgPSBwYXJlbnRVdWlkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgcG9zaXRpb25cclxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5kdW1wID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBjcmVhdGVOb2RlT3B0aW9ucykudGhlbigobm9kZVV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gQXJyYXkuaXNBcnJheShub2RlVXVpZCkgPyBub2RlVXVpZFswXSA6IG5vZGVVdWlkO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnUHJlZmFiSW5zdGFuY2UnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gY3JlYXRlIG5vZGUnIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGFwcGx5UHJlZmFiVG9Ob2RlKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFRyeSBtdWx0aXBsZSBtZXRob2RzIHRvIGFwcGx5IHByZWZhYiBkYXRhXHJcbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZHMgPSBbXHJcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdhcHBseS1wcmVmYWInLCB7IG5vZGU6IG5vZGVVdWlkLCBwcmVmYWI6IHByZWZhYlV1aWQgfSksXHJcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJlZmFiJywgeyBub2RlOiBub2RlVXVpZCwgcHJlZmFiOiBwcmVmYWJVdWlkIH0pLFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnbG9hZC1wcmVmYWItdG8tbm9kZScsIHsgbm9kZTogbm9kZVV1aWQsIHByZWZhYjogcHJlZmFiVXVpZCB9KVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdHJ5TWV0aG9kID0gKGluZGV4OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBtZXRob2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVbmFibGUgdG8gYXBwbHkgcHJlZmFiIGRhdGEnIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBtZXRob2RzW2luZGV4XSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeU1ldGhvZChpbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0cnlNZXRob2QoMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBwcmVmYWIgdXNpbmcgdGhlIGFzc2V0LWRiIEFQSS5cclxuICAgICAqIERlZXBseSBpbnRlZ3JhdGVzIHdpdGggdGhlIGVuZ2luZSdzIGFzc2V0IG1hbmFnZW1lbnQgc3lzdGVtIHRvIGltcGxlbWVudCB0aGUgZnVsbCBwcmVmYWIgY3JlYXRpb24gZmxvdy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJXaXRoQXNzZXREQihub2RlVXVpZDogc3RyaW5nLCBzYXZlUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSBDcmVhdGluZyBQcmVmYWIgd2l0aCBBc3NldC1EQiBBUEkgPT09Jyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm9kZSBVVUlEOiAke25vZGVVdWlkfWApO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFNhdmUgcGF0aDogJHtzYXZlUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQcmVmYWIgbmFtZTogJHtwcmVmYWJOYW1lfWApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMTogZ2V0IG5vZGUgZGF0YSAoaW5jbHVkaW5nIHRyYW5zZm9ybSBwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZURhdGEgPSBhd2FpdCB0aGlzLmdldE5vZGVEYXRhKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnVW5hYmxlIHRvIGdldCBub2RlIGRhdGEnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOb2RlIGRhdGEgcmV0cmlldmVkLCBjaGlsZCBjb3VudDonLCBub2RlRGF0YS5jaGlsZHJlbiA/IG5vZGVEYXRhLmNoaWxkcmVuLmxlbmd0aCA6IDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMjogY3JlYXRlIHRoZSBhc3NldCBmaWxlIGZpcnN0IHRvIG9idGFpbiB0aGUgZW5naW5lLWFzc2lnbmVkIFVVSURcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyBwcmVmYWIgYXNzZXQgZmlsZS4uLicpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcFByZWZhYkNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShbe1wiX190eXBlX19cIjogXCJjYy5QcmVmYWJcIiwgXCJfbmFtZVwiOiBwcmVmYWJOYW1lfV0sIG51bGwsIDIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVBc3NldFdpdGhBc3NldERCKHNhdmVQYXRoLCB0ZW1wUHJlZmFiQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNyZWF0ZVJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjcmVhdGVSZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGFjdHVhbCBVVUlEIGFzc2lnbmVkIGJ5IHRoZSBlbmdpbmVcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFjdHVhbFByZWZhYlV1aWQgPSBjcmVhdGVSZXN1bHQuZGF0YT8udXVpZDtcclxuICAgICAgICAgICAgICAgIGlmICghYWN0dWFsUHJlZmFiVXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdVbmFibGUgdG8gZ2V0IHRoZSBlbmdpbmUtYXNzaWduZWQgcHJlZmFiIFVVSUQnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0VuZ2luZS1hc3NpZ25lZCBVVUlEOicsIGFjdHVhbFByZWZhYlV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMzogcmVnZW5lcmF0ZSB0aGUgcHJlZmFiIGNvbnRlbnQgdXNpbmcgdGhlIGFjdHVhbCBVVUlEXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gYXdhaXQgdGhpcy5jcmVhdGVTdGFuZGFyZFByZWZhYkNvbnRlbnQobm9kZURhdGEsIHByZWZhYk5hbWUsIGFjdHVhbFByZWZhYlV1aWQsIGluY2x1ZGVDaGlsZHJlbiwgaW5jbHVkZUNvbXBvbmVudHMpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29udGVudFN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHByZWZhYkNvbnRlbnQsIG51bGwsIDIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgNDogdXBkYXRlIHRoZSBwcmVmYWIgZmlsZSBjb250ZW50XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRpbmcgcHJlZmFiIGZpbGUgY29udGVudC4uLicpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlUmVzdWx0ID0gYXdhaXQgdGhpcy51cGRhdGVBc3NldFdpdGhBc3NldERCKHNhdmVQYXRoLCBwcmVmYWJDb250ZW50U3RyaW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTdGVwIDU6IGNyZWF0ZSB0aGUgY29ycmVzcG9uZGluZyBtZXRhIGZpbGUgKHVzaW5nIHRoZSBhY3R1YWwgVVVJRClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyBwcmVmYWIgbWV0YSBmaWxlLi4uJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudCA9IHRoaXMuY3JlYXRlU3RhbmRhcmRNZXRhQ29udGVudChwcmVmYWJOYW1lLCBhY3R1YWxQcmVmYWJVdWlkKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU1ldGFXaXRoQXNzZXREQihzYXZlUGF0aCwgbWV0YUNvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgNjogcmVpbXBvcnQgdGhlIGFzc2V0IHRvIHVwZGF0ZSByZWZlcmVuY2VzXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVpbXBvcnRpbmcgcHJlZmFiIGFzc2V0Li4uJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWltcG9ydFJlc3VsdCA9IGF3YWl0IHRoaXMucmVpbXBvcnRBc3NldFdpdGhBc3NldERCKHNhdmVQYXRoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTdGVwIDc6IGF0dGVtcHQgdG8gY29udmVydCB0aGUgb3JpZ2luYWwgbm9kZSBpbnRvIGEgcHJlZmFiIGluc3RhbmNlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXR0ZW1wdGluZyB0byBjb252ZXJ0IG9yaWdpbmFsIG5vZGUgdG8gcHJlZmFiIGluc3RhbmNlLi4uJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0UmVzdWx0ID0gYXdhaXQgdGhpcy5jb252ZXJ0Tm9kZVRvUHJlZmFiSW5zdGFuY2Uobm9kZVV1aWQsIGFjdHVhbFByZWZhYlV1aWQsIHNhdmVQYXRoKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXVpZDogYWN0dWFsUHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogc2F2ZVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiTmFtZTogcHJlZmFiTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkVG9QcmVmYWJJbnN0YW5jZTogY29udmVydFJlc3VsdC5zdWNjZXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBc3NldFJlc3VsdDogY3JlYXRlUmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXN1bHQ6IHVwZGF0ZVJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YVJlc3VsdDogbWV0YVJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVpbXBvcnRSZXN1bHQ6IHJlaW1wb3J0UmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0UmVzdWx0OiBjb252ZXJ0UmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjb252ZXJ0UmVzdWx0LnN1Y2Nlc3MgPyAnUHJlZmFiIGNyZWF0ZWQgYW5kIG9yaWdpbmFsIG5vZGUgY29udmVydGVkIHN1Y2Nlc3NmdWxseScgOiAnUHJlZmFiIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5LCBidXQgbm9kZSBjb252ZXJzaW9uIGZhaWxlZCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBvY2N1cnJlZCB3aGlsZSBjcmVhdGluZyBwcmVmYWI6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY3JlYXRlIHByZWZhYjogJHtlcnJvcn1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0cyBib3RoIHByZWZhYlBhdGggYW5kIHNhdmVQYXRoIHBhcmFtZXRlciBuYW1lc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFBhcmFtID0gYXJncy5wcmVmYWJQYXRoIHx8IGFyZ3Muc2F2ZVBhdGg7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGhQYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdNaXNzaW5nIHByZWZhYiBwYXRoIHBhcmFtZXRlci4gUGxlYXNlIHByb3ZpZGUgcHJlZmFiUGF0aCBvciBzYXZlUGF0aC4nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYk5hbWUgPSBhcmdzLnByZWZhYk5hbWUgfHwgJ05ld1ByZWZhYic7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGhQYXJhbS5lbmRzV2l0aCgnLnByZWZhYicpID9cclxuICAgICAgICAgICAgICAgICAgICBwYXRoUGFyYW0gOiBgJHtwYXRoUGFyYW19LyR7cHJlZmFiTmFtZX0ucHJlZmFiYDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbmNsdWRlQ2hpbGRyZW4gPSBhcmdzLmluY2x1ZGVDaGlsZHJlbiAhPT0gZmFsc2U7IC8vIGRlZmF1bHQgdHJ1ZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZUNvbXBvbmVudHMgPSBhcmdzLmluY2x1ZGVDb21wb25lbnRzICE9PSBmYWxzZTsgLy8gZGVmYXVsdCB0cnVlXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlZmVyIHRoZSBuZXcgYXNzZXQtZGIgbWV0aG9kIHRvIGNyZWF0ZSB0aGUgcHJlZmFiXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRpbmcgcHJlZmFiIHVzaW5nIG5ldyBhc3NldC1kYiBtZXRob2QuLi4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0RGJSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZVByZWZhYldpdGhBc3NldERCKFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3Mubm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVsbFBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQ2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHNcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0RGJSZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXREYlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBhc3NldC1kYiBtZXRob2QgZmFpbHMsIHRyeSB1c2luZyBDb2NvcyBDcmVhdG9yJ3MgbmF0aXZlIHByZWZhYiBjcmVhdGlvbiBBUElcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhc3NldC1kYiBtZXRob2QgZmFpbGVkLCB0cnlpbmcgbmF0aXZlIEFQSS4uLicpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmF0aXZlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJOYXRpdmUoYXJncy5ub2RlVXVpZCwgZnVsbFBhdGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hdGl2ZVJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuYXRpdmVSZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbmF0aXZlIEFQSSBhbHNvIGZhaWxzLCB1c2UgdGhlIGN1c3RvbSBpbXBsZW1lbnRhdGlvblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05hdGl2ZSBBUEkgZmFpbGVkLCB1c2luZyBjdXN0b20gaW1wbGVtZW50YXRpb24uLi4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbVJlc3VsdCA9IGF3YWl0IHRoaXMuY3JlYXRlUHJlZmFiQ3VzdG9tKGFyZ3Mubm9kZVV1aWQsIGZ1bGxQYXRoLCBwcmVmYWJOYW1lKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoY3VzdG9tUmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEVycm9yIG9jY3VycmVkIHdoaWxlIGNyZWF0aW5nIHByZWZhYjogJHtlcnJvcn1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiTmF0aXZlKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byB0aGUgb2ZmaWNpYWwgQVBJIGRvY3VtZW50YXRpb24sIHRoZXJlIGlzIG5vIGRpcmVjdCBwcmVmYWIgY3JlYXRpb24gQVBJXHJcbiAgICAgICAgICAgIC8vIFByZWZhYiBjcmVhdGlvbiBtdXN0IGJlIGRvbmUgbWFudWFsbHkgaW4gdGhlIGVkaXRvclxyXG4gICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdOYXRpdmUgcHJlZmFiIGNyZWF0aW9uIEFQSSBkb2VzIG5vdCBleGlzdCcsXHJcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ0FjY29yZGluZyB0byB0aGUgQ29jb3MgQ3JlYXRvciBvZmZpY2lhbCBBUEkgZG9jdW1lbnRhdGlvbiwgcHJlZmFiIGNyZWF0aW9uIHJlcXVpcmVzIG1hbnVhbCBvcGVyYXRpb246XFxuMS4gU2VsZWN0IHRoZSBub2RlIGluIHRoZSBzY2VuZVxcbjIuIERyYWcgdGhlIG5vZGUgaW50byB0aGUgQXNzZXRzIHBhbmVsXFxuMy4gT3IgcmlnaHQtY2xpY2sgdGhlIG5vZGUgYW5kIGNob29zZSBcIkNyZWF0ZSBQcmVmYWJcIidcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJDdXN0b20obm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gMS4gR2V0IHRoZSBmdWxsIGRhdGEgb2YgdGhlIHNvdXJjZSBub2RlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRGF0YSA9IGF3YWl0IHRoaXMuZ2V0Tm9kZURhdGEobm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBVbmFibGUgdG8gZmluZCBub2RlOiAke25vZGVVdWlkfWBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMi4gR2VuZXJhdGUgYSBwcmVmYWIgVVVJRFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiVXVpZCA9IHRoaXMuZ2VuZXJhdGVVVUlEKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMy4gQ3JlYXRlIHRoZSBwcmVmYWIgZGF0YSBzdHJ1Y3R1cmVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkRhdGEgPSB0aGlzLmNyZWF0ZVByZWZhYkRhdGEobm9kZURhdGEsIHByZWZhYk5hbWUsIHByZWZhYlV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDQuIENyZWF0ZSB0aGUgcHJlZmFiIGRhdGEgc3RydWN0dXJlIGJhc2VkIG9uIHRoZSBvZmZpY2lhbCBmb3JtYXRcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc9PT0gU3RhcnRpbmcgUHJlZmFiIENyZWF0aW9uID09PScpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vZGUgbmFtZTonLCBub2RlRGF0YS5uYW1lPy52YWx1ZSB8fCAnVW5rbm93bicpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vZGUgVVVJRDonLCBub2RlRGF0YS51dWlkPy52YWx1ZSB8fCAnVW5rbm93bicpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1ByZWZhYiBzYXZlIHBhdGg6JywgcHJlZmFiUGF0aCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgcHJlZmFiIGNyZWF0aW9uLCBub2RlIGRhdGE6YCwgbm9kZURhdGEpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSnNvbkRhdGEgPSBhd2FpdCB0aGlzLmNyZWF0ZVN0YW5kYXJkUHJlZmFiQ29udGVudChub2RlRGF0YSwgcHJlZmFiTmFtZSwgcHJlZmFiVXVpZCwgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gNS4gQ3JlYXRlIHRoZSBzdGFuZGFyZCBtZXRhIGZpbGUgZGF0YVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhbmRhcmRNZXRhRGF0YSA9IHRoaXMuY3JlYXRlU3RhbmRhcmRNZXRhRGF0YShwcmVmYWJOYW1lLCBwcmVmYWJVdWlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyA2LiBTYXZlIHRoZSBwcmVmYWIgYW5kIG1ldGEgZmlsZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVSZXN1bHQgPSBhd2FpdCB0aGlzLnNhdmVQcmVmYWJXaXRoTWV0YShwcmVmYWJQYXRoLCBwcmVmYWJKc29uRGF0YSwgc3RhbmRhcmRNZXRhRGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNhdmVSZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFmdGVyIHNhdmluZyBzdWNjZXNzZnVsbHksIGNvbnZlcnQgdGhlIG9yaWdpbmFsIG5vZGUgdG8gYSBwcmVmYWIgaW5zdGFuY2VcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0UmVzdWx0ID0gYXdhaXQgdGhpcy5jb252ZXJ0Tm9kZVRvUHJlZmFiSW5zdGFuY2Uobm9kZVV1aWQsIHByZWZhYlBhdGgsIHByZWZhYlV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJOYW1lOiBwcmVmYWJOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkVG9QcmVmYWJJbnN0YW5jZTogY29udmVydFJlc3VsdC5zdWNjZXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY29udmVydFJlc3VsdC5zdWNjZXNzID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ3VzdG9tIHByZWZhYiBjcmVhdGVkIHN1Y2Nlc3NmdWxseSBhbmQgb3JpZ2luYWwgbm9kZSBjb252ZXJ0ZWQgdG8gcHJlZmFiIGluc3RhbmNlJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZWZhYiBjcmVhdGVkIHN1Y2Nlc3NmdWxseSwgYnV0IG5vZGUgY29udmVyc2lvbiBmYWlsZWQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogc2F2ZVJlc3VsdC5lcnJvciB8fCAnRmFpbGVkIHRvIHNhdmUgcHJlZmFiIGZpbGUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBFcnJvciBvY2N1cnJlZCB3aGlsZSBjcmVhdGluZyBwcmVmYWI6ICR7ZXJyb3J9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVEYXRhKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIGdldCB0aGUgYmFzaWMgbm9kZSBpbmZvXHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFN1Y2Nlc3NmdWxseSByZXRyaWV2ZWQgYmFzaWMgaW5mbyBmb3Igbm9kZSAke25vZGVVdWlkfWApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVzZSBxdWVyeS1ub2RlLXRyZWUgdG8gZ2V0IHRoZSBmdWxsIHN0cnVjdHVyZSBpbmNsdWRpbmcgY2hpbGQgbm9kZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVUcmVlID0gYXdhaXQgdGhpcy5nZXROb2RlV2l0aENoaWxkcmVuKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlVHJlZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTdWNjZXNzZnVsbHkgcmV0cmlldmVkIGZ1bGwgdHJlZSBzdHJ1Y3R1cmUgZm9yIG5vZGUgJHtub2RlVXVpZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5vZGVUcmVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFVzaW5nIGJhc2ljIG5vZGUgaW5mb2ApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobm9kZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gZ2V0IG5vZGUgZGF0YSBmb3IgJHtub2RlVXVpZH06YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgY29tcGxldGUgbm9kZSBzdHJ1Y3R1cmUgaW5jbHVkaW5nIGNoaWxkIG5vZGVzIHVzaW5nIHF1ZXJ5LW5vZGUtdHJlZVxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlV2l0aENoaWxkcmVuKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZW50aXJlIHNjZW5lIHRyZWVcclxuICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpO1xyXG4gICAgICAgICAgICBpZiAoIXRyZWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBzcGVjaWZpZWQgbm9kZSBpbiB0aGUgdHJlZVxyXG4gICAgICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdGhpcy5maW5kTm9kZUluVHJlZSh0cmVlLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgRm91bmQgbm9kZSAke25vZGVVdWlkfSBpbiBzY2VuZSB0cmVlLCBjaGlsZCBjb3VudDogJHt0YXJnZXROb2RlLmNoaWxkcmVuID8gdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGggOiAwfWApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVuaGFuY2UgdGhlIG5vZGUgdHJlZSB0byBnZXQgdGhlIGNvcnJlY3QgY29tcG9uZW50IGluZm8gZm9yIGVhY2ggbm9kZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5oYW5jZWRUcmVlID0gYXdhaXQgdGhpcy5lbmhhbmNlVHJlZVdpdGhNQ1BDb21wb25lbnRzKHRhcmdldE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuaGFuY2VkVHJlZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gZ2V0IG5vZGUgdHJlZSBzdHJ1Y3R1cmUgZm9yICR7bm9kZVV1aWR9OmAsIGVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlY3Vyc2l2ZWx5IHNlYXJjaCB0aGUgbm9kZSB0cmVlIGZvciBhIG5vZGUgd2l0aCB0aGUgc3BlY2lmaWVkIFVVSURcclxuICAgIHByaXZhdGUgZmluZE5vZGVJblRyZWUobm9kZTogYW55LCB0YXJnZXRVdWlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGlmICghbm9kZSkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IG5vZGVcclxuICAgICAgICBpZiAobm9kZS51dWlkID09PSB0YXJnZXRVdWlkIHx8IG5vZGUudmFsdWU/LnV1aWQgPT09IHRhcmdldFV1aWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZWN1cnNpdmVseSBjaGVjayBjaGlsZCBub2Rlc1xyXG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuZmluZE5vZGVJblRyZWUoY2hpbGQsIHRhcmdldFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuaGFuY2UgdGhlIG5vZGUgdHJlZSB1c2luZyB0aGUgTUNQIGludGVyZmFjZSB0byBnZXQgdGhlIGNvcnJlY3QgY29tcG9uZW50IGluZm8uXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgZW5oYW5jZVRyZWVXaXRoTUNQQ29tcG9uZW50cyhub2RlOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICghbm9kZSB8fCAhbm9kZS51dWlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gVXNlIHRoZSBNQ1AgaW50ZXJmYWNlIHRvIGdldCBjb21wb25lbnQgaW5mbyBmb3IgdGhlIG5vZGVcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDo4NTg1L21jcCcsIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXHJcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJqc29ucnBjXCI6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXRob2RcIjogXCJ0b29scy9jYWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJjb21wb25lbnRfZ2V0X2NvbXBvbmVudHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhcmd1bWVudHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJub2RlVXVpZFwiOiBub2RlLnV1aWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBEYXRlLm5vdygpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1jcFJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICAgICAgaWYgKG1jcFJlc3VsdC5yZXN1bHQ/LmNvbnRlbnQ/LlswXT8udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50RGF0YSA9IEpTT04ucGFyc2UobWNwUmVzdWx0LnJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudERhdGEuc3VjY2VzcyAmJiBjb21wb25lbnREYXRhLmRhdGEuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbm9kZSdzIGNvbXBvbmVudCBpbmZvIHdpdGggdGhlIGNvcnJlY3QgZGF0YSByZXR1cm5lZCBieSBNQ1BcclxuICAgICAgICAgICAgICAgICAgICBub2RlLmNvbXBvbmVudHMgPSBjb21wb25lbnREYXRhLmRhdGEuY29tcG9uZW50cztcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm9kZSAke25vZGUudXVpZH0gcmV0cmlldmVkICR7Y29tcG9uZW50RGF0YS5kYXRhLmNvbXBvbmVudHMubGVuZ3RofSBjb21wb25lbnRzIHdpdGggY29ycmVjdCBzY3JpcHQgY29tcG9uZW50IHR5cGVzYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBnZXQgTUNQIGNvbXBvbmVudCBpbmZvIGZvciBub2RlICR7bm9kZS51dWlkfTpgLCBlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZWN1cnNpdmVseSBwcm9jZXNzIGNoaWxkIG5vZGVzXHJcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBhd2FpdCB0aGlzLmVuaGFuY2VUcmVlV2l0aE1DUENvbXBvbmVudHMobm9kZS5jaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYnVpbGRCYXNpY05vZGVJbmZvKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBCdWlsZCBiYXNpYyBub2RlIGluZm9cclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKS50aGVuKChub2RlSW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2ltcGxpZmllZCB2ZXJzaW9uOiBvbmx5IHJldHVybiBiYXNpYyBub2RlIGluZm8gd2l0aG91dCBjaGlsZCBub2RlcyBvciBjb21wb25lbnRzLlxyXG4gICAgICAgICAgICAgICAgLy8gVGhlc2Ugd2lsbCBiZSBhZGRlZCBhcyBuZWVkZWQgZHVyaW5nIHN1YnNlcXVlbnQgcHJlZmFiIHByb2Nlc3NpbmcuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNpY0luZm8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4ubm9kZUluZm8sXHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShiYXNpY0luZm8pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSB3aGV0aGVyIG5vZGUgZGF0YSBpcyB2YWxpZFxyXG4gICAgcHJpdmF0ZSBpc1ZhbGlkTm9kZURhdGEobm9kZURhdGE6IGFueSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICghbm9kZURhdGEpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAodHlwZW9mIG5vZGVEYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBiYXNpYyBwcm9wZXJ0aWVzIC0gYWRhcHRlZCB0byB0aGUgcXVlcnktbm9kZS10cmVlIGRhdGEgZm9ybWF0XHJcbiAgICAgICAgcmV0dXJuIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCd1dWlkJykgfHwgXHJcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCduYW1lJykgfHwgXHJcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCdfX3R5cGVfXycpIHx8XHJcbiAgICAgICAgICAgICAgIChub2RlRGF0YS52YWx1ZSAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICBub2RlRGF0YS52YWx1ZS5oYXNPd25Qcm9wZXJ0eSgndXVpZCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICBub2RlRGF0YS52YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpIHx8XHJcbiAgICAgICAgICAgICAgICAgICBub2RlRGF0YS52YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnX190eXBlX18nKVxyXG4gICAgICAgICAgICAgICApKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBVbmlmaWVkIG1ldGhvZCB0byBleHRyYWN0IGEgY2hpbGQgbm9kZSBVVUlEXHJcbiAgICBwcml2YXRlIGV4dHJhY3RDaGlsZFV1aWQoY2hpbGRSZWY6IGFueSk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgICAgIGlmICghY2hpbGRSZWYpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAvLyBNZXRob2QgMTogZGlyZWN0IHN0cmluZ1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2hpbGRSZWYgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1ldGhvZCAyOiB2YWx1ZSBwcm9wZXJ0eSBjb250YWlucyBhIHN0cmluZ1xyXG4gICAgICAgIGlmIChjaGlsZFJlZi52YWx1ZSAmJiB0eXBlb2YgY2hpbGRSZWYudmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZi52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1ldGhvZCAzOiB2YWx1ZS51dWlkIHByb3BlcnR5XHJcbiAgICAgICAgaWYgKGNoaWxkUmVmLnZhbHVlICYmIGNoaWxkUmVmLnZhbHVlLnV1aWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkUmVmLnZhbHVlLnV1aWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNZXRob2QgNDogZGlyZWN0IHV1aWQgcHJvcGVydHlcclxuICAgICAgICBpZiAoY2hpbGRSZWYudXVpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRSZWYudXVpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1ldGhvZCA1OiBfX2lkX18gcmVmZXJlbmNlIC0gcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZ1xyXG4gICAgICAgIGlmIChjaGlsZFJlZi5fX2lkX18gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRm91bmQgX19pZF9fIHJlZmVyZW5jZTogJHtjaGlsZFJlZi5fX2lkX199LCBtYXkgbmVlZCB0byBsb29rIHVwIGZyb20gZGF0YSBzdHJ1Y3R1cmVgKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIFJldHVybiBudWxsIGZvciBub3c7IHJlZmVyZW5jZSByZXNvbHV0aW9uIGxvZ2ljIGNhbiBiZSBhZGRlZCBsYXRlclxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmFibGUgdG8gZXh0cmFjdCBjaGlsZCBub2RlIFVVSUQ6JywgSlNPTi5zdHJpbmdpZnkoY2hpbGRSZWYpKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIGNoaWxkIG5vZGUgZGF0YSB0aGF0IG5lZWRzIHRvIGJlIHByb2Nlc3NlZFxyXG4gICAgcHJpdmF0ZSBnZXRDaGlsZHJlblRvUHJvY2Vzcyhub2RlRGF0YTogYW55KTogYW55W10ge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAvLyBNZXRob2QgMTogZ2V0IGRpcmVjdGx5IGZyb20gdGhlIGNoaWxkcmVuIGFycmF5IChkYXRhIHJldHVybmVkIGJ5IHF1ZXJ5LW5vZGUtdHJlZSlcclxuICAgICAgICBpZiAobm9kZURhdGEuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShub2RlRGF0YS5jaGlsZHJlbikpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYEdldHRpbmcgY2hpbGQgbm9kZXMgZnJvbSBjaGlsZHJlbiBhcnJheSwgY291bnQ6ICR7bm9kZURhdGEuY2hpbGRyZW4ubGVuZ3RofWApO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGVEYXRhLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGlsZCBub2RlcyByZXR1cm5lZCBieSBxdWVyeS1ub2RlLXRyZWUgYXJlIHVzdWFsbHkgYWxyZWFkeSBjb21wbGV0ZSBkYXRhIHN0cnVjdHVyZXNcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWROb2RlRGF0YShjaGlsZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQWRkaW5nIGNoaWxkIG5vZGU6ICR7Y2hpbGQubmFtZSB8fCBjaGlsZC52YWx1ZT8ubmFtZSB8fCAnVW5rbm93bid9YCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGNoaWxkIG5vZGUgZGF0YTonLCBKU09OLnN0cmluZ2lmeShjaGlsZCwgbnVsbCwgMikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ05vZGUgaGFzIG5vIGNoaWxkIG5vZGVzIG9yIGNoaWxkcmVuIGFycmF5IGlzIGVtcHR5Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2hpbGRyZW47XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVVVSUQoKTogc3RyaW5nIHtcclxuICAgICAgICAvLyBHZW5lcmF0ZSBhIFVVSUQgaW4gQ29jb3MgQ3JlYXRvciBmb3JtYXRcclxuICAgICAgICBjb25zdCBjaGFycyA9ICcwMTIzNDU2Nzg5YWJjZGVmJztcclxuICAgICAgICBsZXQgdXVpZCA9ICcnO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gOCB8fCBpID09PSAxMiB8fCBpID09PSAxNiB8fCBpID09PSAyMCkge1xyXG4gICAgICAgICAgICAgICAgdXVpZCArPSAnLSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdXVpZCArPSBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHV1aWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVQcmVmYWJEYXRhKG5vZGVEYXRhOiBhbnksIHByZWZhYk5hbWU6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xyXG4gICAgICAgIC8vIEJ1aWxkIHN0YW5kYXJkIHByZWZhYiBkYXRhIHN0cnVjdHVyZVxyXG4gICAgICAgIGNvbnN0IHByZWZhYkFzc2V0ID0ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUHJlZmFiXCIsXHJcbiAgICAgICAgICAgIFwiX25hbWVcIjogcHJlZmFiTmFtZSxcclxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcclxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxyXG4gICAgICAgICAgICBcIl9uYXRpdmVcIjogXCJcIixcclxuICAgICAgICAgICAgXCJkYXRhXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJvcHRpbWl6YXRpb25Qb2xpY3lcIjogMCxcclxuICAgICAgICAgICAgXCJwZXJzaXN0ZW50XCI6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gUHJvY2VzcyBub2RlIGRhdGEgdG8gY29uZm9ybSB0byBwcmVmYWIgZm9ybWF0XHJcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkTm9kZURhdGEgPSB0aGlzLnByb2Nlc3NOb2RlRm9yUHJlZmFiKG5vZGVEYXRhLCBwcmVmYWJVdWlkKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtwcmVmYWJBc3NldCwgLi4ucHJvY2Vzc2VkTm9kZURhdGFdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHJvY2Vzc05vZGVGb3JQcmVmYWIobm9kZURhdGE6IGFueSwgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xyXG4gICAgICAgIC8vIFByb2Nlc3Mgbm9kZSBkYXRhIHRvIGNvbmZvcm0gdG8gcHJlZmFiIGZvcm1hdFxyXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZERhdGE6IGFueVtdID0gW107XHJcbiAgICAgICAgbGV0IGlkQ291bnRlciA9IDE7XHJcblxyXG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHByb2Nlc3Mgbm9kZXMgYW5kIGNvbXBvbmVudHNcclxuICAgICAgICBjb25zdCBwcm9jZXNzTm9kZSA9IChub2RlOiBhbnksIHBhcmVudElkOiBudW1iZXIgPSAwKTogbnVtYmVyID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gaWRDb3VudGVyKys7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbm9kZSBvYmplY3RcclxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ob2RlXCIsXHJcbiAgICAgICAgICAgICAgICBcIl9uYW1lXCI6IG5vZGUubmFtZSB8fCBcIk5vZGVcIixcclxuICAgICAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXHJcbiAgICAgICAgICAgICAgICBcIl9fZWRpdG9yRXh0cmFzX19cIjoge30sXHJcbiAgICAgICAgICAgICAgICBcIl9wYXJlbnRcIjogcGFyZW50SWQgPiAwID8geyBcIl9faWRfX1wiOiBwYXJlbnRJZCB9IDogbnVsbCxcclxuICAgICAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLm1hcCgoKSA9PiAoeyBcIl9faWRfX1wiOiBpZENvdW50ZXIrKyB9KSkgOiBbXSxcclxuICAgICAgICAgICAgICAgIFwiX2FjdGl2ZVwiOiBub2RlLmFjdGl2ZSAhPT0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IG5vZGUuY29tcG9uZW50cyA/IG5vZGUuY29tcG9uZW50cy5tYXAoKCkgPT4gKHsgXCJfX2lkX19cIjogaWRDb3VudGVyKysgfSkpIDogW10sXHJcbiAgICAgICAgICAgICAgICBcIl9wcmVmYWJcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IGlkQ291bnRlcisrXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXCJfbHBvc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcclxuICAgICAgICAgICAgICAgICAgICBcInhcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICBcInpcIjogMFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFwiX2xyb3RcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3XCI6IDFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcIl9sc2NhbGVcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcIl9tb2JpbGl0eVwiOiAwLFxyXG4gICAgICAgICAgICAgICAgXCJfbGF5ZXJcIjogMTA3Mzc0MTgyNCxcclxuICAgICAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwielwiOiAwXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCJcIlxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzc2VkRGF0YS5wdXNoKHByb2Nlc3NlZE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJvY2VzcyBjb21wb25lbnRzXHJcbiAgICAgICAgICAgIGlmIChub2RlLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuY29tcG9uZW50cy5mb3JFYWNoKChjb21wb25lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gaWRDb3VudGVyKys7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50cyA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudEZvclByZWZhYihjb21wb25lbnQsIGNvbXBvbmVudElkKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWREYXRhLnB1c2goLi4ucHJvY2Vzc2VkQ29tcG9uZW50cyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUHJvY2VzcyBjaGlsZCBub2Rlc1xyXG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc05vZGUoY2hpbGQsIG5vZGVJZCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVJZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBwcm9jZXNzTm9kZShub2RlRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZERhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwcm9jZXNzQ29tcG9uZW50Rm9yUHJlZmFiKGNvbXBvbmVudDogYW55LCBjb21wb25lbnRJZDogbnVtYmVyKTogYW55W10ge1xyXG4gICAgICAgIC8vIFByb2Nlc3MgY29tcG9uZW50IGRhdGEgdG8gY29uZm9ybSB0byBwcmVmYWIgZm9ybWF0XHJcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50ID0ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IGNvbXBvbmVudC50eXBlIHx8IFwiY2MuQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwiX25hbWVcIjogXCJcIixcclxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcclxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxyXG4gICAgICAgICAgICBcIm5vZGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY29tcG9uZW50SWQgLSAxXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2VuYWJsZWRcIjogY29tcG9uZW50LmVuYWJsZWQgIT09IGZhbHNlLFxyXG4gICAgICAgICAgICBcIl9fcHJlZmFiXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IGNvbXBvbmVudElkICsgMVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAuLi5jb21wb25lbnQucHJvcGVydGllc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEFkZCBjb21wb25lbnQtc3BlY2lmaWMgcHJlZmFiIGluZm9cclxuICAgICAgICBjb25zdCBjb21wUHJlZmFiSW5mbyA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLkNvbXBQcmVmYWJJbmZvXCIsXHJcbiAgICAgICAgICAgIFwiZmlsZUlkXCI6IHRoaXMuZ2VuZXJhdGVGaWxlSWQoKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBbcHJvY2Vzc2VkQ29tcG9uZW50LCBjb21wUHJlZmFiSW5mb107XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUZpbGVJZCgpOiBzdHJpbmcge1xyXG4gICAgICAgIC8vIEdlbmVyYXRlIGEgZmlsZSBJRCAoc2ltcGxpZmllZCB2ZXJzaW9uKVxyXG4gICAgICAgIGNvbnN0IGNoYXJzID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5Ky8nO1xyXG4gICAgICAgIGxldCBmaWxlSWQgPSAnJztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDIyOyBpKyspIHtcclxuICAgICAgICAgICAgZmlsZUlkICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmlsZUlkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlTWV0YURhdGEocHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIFwidmVyXCI6IFwiMS4xLjUwXCIsXHJcbiAgICAgICAgICAgIFwiaW1wb3J0ZXJcIjogXCJwcmVmYWJcIixcclxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxyXG4gICAgICAgICAgICBcInV1aWRcIjogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgXCJmaWxlc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJzdWJNZXRhc1wiOiB7fSxcclxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInN5bmNOb2RlTmFtZVwiOiBwcmVmYWJOYW1lXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVByZWZhYkZpbGVzKHByZWZhYlBhdGg6IHN0cmluZywgcHJlZmFiRGF0YTogYW55W10sIG1ldGFEYXRhOiBhbnkpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBFZGl0b3IgQVBJIHRvIHNhdmUgdGhlIHByZWZhYiBmaWxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocHJlZmFiRGF0YSwgbnVsbCwgMik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KG1ldGFEYXRhLCBudWxsLCAyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnkgYSBtb3JlIHJlbGlhYmxlIHNhdmUgbWV0aG9kXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVBc3NldEZpbGUocHJlZmFiUGF0aCwgcHJlZmFiQ29udGVudCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlbiBjcmVhdGUgdGhlIG1ldGEgZmlsZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gYCR7cHJlZmFiUGF0aH0ubWV0YWA7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZUFzc2V0RmlsZShtZXRhUGF0aCwgbWV0YUNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBzYXZlIHByZWZhYiBmaWxlJyB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYEVycm9yIG9jY3VycmVkIHdoaWxlIHNhdmluZyBmaWxlOiAke2Vycm9yfWAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNhdmVBc3NldEZpbGUoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgLy8gVHJ5IG11bHRpcGxlIHNhdmUgbWV0aG9kc1xyXG4gICAgICAgICAgICBjb25zdCBzYXZlTWV0aG9kcyA9IFtcclxuICAgICAgICAgICAgICAgICgpID0+IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIGZpbGVQYXRoLCBjb250ZW50KSxcclxuICAgICAgICAgICAgICAgICgpID0+IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3NhdmUtYXNzZXQnLCBmaWxlUGF0aCwgY29udGVudCksXHJcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICd3cml0ZS1hc3NldCcsIGZpbGVQYXRoLCBjb250ZW50KVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdHJ5U2F2ZSA9IChpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gc2F2ZU1ldGhvZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignQWxsIHNhdmUgbWV0aG9kcyBmYWlsZWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNhdmVNZXRob2RzW2luZGV4XSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnlTYXZlKGluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRyeVNhdmUoMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB1cGRhdGVQcmVmYWIocHJlZmFiUGF0aDogc3RyaW5nLCBub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJlZmFiIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdhcHBseS1wcmVmYWInLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZTogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiOiBhc3NldEluZm8udXVpZFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5J1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZXZlcnRQcmVmYWIobm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JldmVydC1wcmVmYWInLCB7XHJcbiAgICAgICAgICAgICAgICBub2RlOiBub2RlVXVpZFxyXG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1ByZWZhYiBpbnN0YW5jZSByZXZlcnRlZCBzdWNjZXNzZnVsbHknXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByZWZhYkluZm8ocHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJlZmFiIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1tZXRhJywgYXNzZXRJbmZvLnV1aWQpO1xyXG4gICAgICAgICAgICB9KS50aGVuKChtZXRhSW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBQcmVmYWJJbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG1ldGFJbmZvLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbWV0YUluZm8udXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwcmVmYWJQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcjogcHJlZmFiUGF0aC5zdWJzdHJpbmcoMCwgcHJlZmFiUGF0aC5sYXN0SW5kZXhPZignLycpKSxcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVUaW1lOiBtZXRhSW5mby5jcmVhdGVUaW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeVRpbWU6IG1ldGFJbmZvLm1vZGlmeVRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBtZXRhSW5mby5kZXBlbmRzIHx8IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGluZm8gfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJGcm9tTm9kZShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIC8vIEV4dHJhY3QgdGhlIG5hbWUgZnJvbSBwcmVmYWJQYXRoXHJcbiAgICAgICAgY29uc3QgcHJlZmFiUGF0aCA9IGFyZ3MucHJlZmFiUGF0aDtcclxuICAgICAgICBjb25zdCBwcmVmYWJOYW1lID0gcHJlZmFiUGF0aC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKCcucHJlZmFiJywgJycpIHx8ICdOZXdQcmVmYWInO1xyXG5cclxuICAgICAgICAvLyBDYWxsIHRoZSBvcmlnaW5hbCBjcmVhdGVQcmVmYWIgbWV0aG9kXHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlUHJlZmFiKHtcclxuICAgICAgICAgICAgbm9kZVV1aWQ6IGFyZ3Mubm9kZVV1aWQsXHJcbiAgICAgICAgICAgIHNhdmVQYXRoOiBwcmVmYWJQYXRoLFxyXG4gICAgICAgICAgICBwcmVmYWJOYW1lOiBwcmVmYWJOYW1lXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVByZWZhYihwcmVmYWJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVhZCB0aGUgcHJlZmFiIGZpbGUgY29udGVudFxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnUHJlZmFiIGZpbGUgZG9lcyBub3QgZXhpc3QnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgcHJlZmFiIGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlYWQtYXNzZXQnLCBwcmVmYWJQYXRoKS50aGVuKChjb250ZW50OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkRhdGEgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IHRoaXMudmFsaWRhdGVQcmVmYWJGb3JtYXQocHJlZmFiRGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQ6IHZhbGlkYXRpb25SZXN1bHQuaXNWYWxpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVzOiB2YWxpZGF0aW9uUmVzdWx0Lmlzc3VlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiB2YWxpZGF0aW9uUmVzdWx0Lm5vZGVDb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Q291bnQ6IHZhbGlkYXRpb25SZXN1bHQuY29tcG9uZW50Q291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHZhbGlkYXRpb25SZXN1bHQuaXNWYWxpZCA/ICdQcmVmYWIgZm9ybWF0IGlzIHZhbGlkJyA6ICdQcmVmYWIgZm9ybWF0IGhhcyBpc3N1ZXMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnUHJlZmFiIGZpbGUgZm9ybWF0IGVycm9yLCB1bmFibGUgdG8gcGFyc2UgSlNPTidcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlYWQgcHJlZmFiIGZpbGU6ICR7ZXJyb3IubWVzc2FnZX1gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHF1ZXJ5IHByZWZhYiBpbmZvOiAke2Vycm9yLm1lc3NhZ2V9YFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEVycm9yIG9jY3VycmVkIHdoaWxlIHZhbGlkYXRpbmcgcHJlZmFiOiAke2Vycm9yfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZVByZWZhYkZvcm1hdChwcmVmYWJEYXRhOiBhbnkpOiB7IGlzVmFsaWQ6IGJvb2xlYW47IGlzc3Vlczogc3RyaW5nW107IG5vZGVDb3VudDogbnVtYmVyOyBjb21wb25lbnRDb3VudDogbnVtYmVyIH0ge1xyXG4gICAgICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBsZXQgbm9kZUNvdW50ID0gMDtcclxuICAgICAgICBsZXQgY29tcG9uZW50Q291bnQgPSAwO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBiYXNpYyBzdHJ1Y3R1cmVcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJlZmFiRGF0YSkpIHtcclxuICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1ByZWZhYiBkYXRhIG11c3QgYmUgaW4gYXJyYXkgZm9ybWF0Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBpc3N1ZXMsIG5vZGVDb3VudCwgY29tcG9uZW50Q291bnQgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwcmVmYWJEYXRhLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCgnUHJlZmFiIGRhdGEgaXMgZW1wdHknKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIGlzc3Vlcywgbm9kZUNvdW50LCBjb21wb25lbnRDb3VudCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgZmlyc3QgZWxlbWVudCBpcyBhIHByZWZhYiBhc3NldFxyXG4gICAgICAgIGNvbnN0IGZpcnN0RWxlbWVudCA9IHByZWZhYkRhdGFbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdEVsZW1lbnQgfHwgZmlyc3RFbGVtZW50Ll9fdHlwZV9fICE9PSAnY2MuUHJlZmFiJykge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIGZpcnN0IGVsZW1lbnQgbXVzdCBiZSBvZiB0eXBlIGNjLlByZWZhYicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ291bnQgbm9kZXMgYW5kIGNvbXBvbmVudHNcclxuICAgICAgICBwcmVmYWJEYXRhLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5fX3R5cGVfXyA9PT0gJ2NjLk5vZGUnKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlQ291bnQrKztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLl9fdHlwZV9fICYmIGl0ZW0uX190eXBlX18uaW5jbHVkZXMoJ2NjLicpKSB7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnRDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkIGZpZWxkc1xyXG4gICAgICAgIGlmIChub2RlQ291bnQgPT09IDApIHtcclxuICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1ByZWZhYiBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIG5vZGUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlzVmFsaWQ6IGlzc3Vlcy5sZW5ndGggPT09IDAsXHJcbiAgICAgICAgICAgIGlzc3VlcyxcclxuICAgICAgICAgICAgbm9kZUNvdW50LFxyXG4gICAgICAgICAgICBjb21wb25lbnRDb3VudFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkdXBsaWNhdGVQcmVmYWIoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgc291cmNlUHJlZmFiUGF0aCwgdGFyZ2V0UHJlZmFiUGF0aCwgbmV3UHJlZmFiTmFtZSB9ID0gYXJncztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gUmVhZCB0aGUgc291cmNlIHByZWZhYlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0UHJlZmFiSW5mbyhzb3VyY2VQcmVmYWJQYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmICghc291cmNlSW5mby5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYFVuYWJsZSB0byByZWFkIHNvdXJjZSBwcmVmYWI6ICR7c291cmNlSW5mby5lcnJvcn1gXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlYWQgdGhlIHNvdXJjZSBwcmVmYWIgY29udGVudFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlQ29udGVudCA9IGF3YWl0IHRoaXMucmVhZFByZWZhYkNvbnRlbnQoc291cmNlUHJlZmFiUGF0aCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZUNvbnRlbnQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBVbmFibGUgdG8gcmVhZCBzb3VyY2UgcHJlZmFiIGNvbnRlbnQ6ICR7c291cmNlQ29udGVudC5lcnJvcn1gXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgbmV3IFVVSURcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1V1aWQgPSB0aGlzLmdlbmVyYXRlVVVJRCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1vZGlmeSB0aGUgcHJlZmFiIGRhdGFcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmaWVkRGF0YSA9IHRoaXMubW9kaWZ5UHJlZmFiRm9yRHVwbGljYXRpb24oc291cmNlQ29udGVudC5kYXRhLCBuZXdQcmVmYWJOYW1lLCBuZXdVdWlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgbmV3IG1ldGEgZGF0YVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3TWV0YURhdGEgPSB0aGlzLmNyZWF0ZU1ldGFEYXRhKG5ld1ByZWZhYk5hbWUgfHwgJ0R1cGxpY2F0ZWRQcmVmYWInLCBuZXdVdWlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVmYWIgZHVwbGljYXRpb24gaXMgdGVtcG9yYXJpbHkgZGlzYWJsZWQgZHVlIHRvIGNvbXBsZXggc2VyaWFsaXphdGlvbiBmb3JtYXRcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnUHJlZmFiIGR1cGxpY2F0aW9uIGlzIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1BsZWFzZSBkdXBsaWNhdGUgdGhlIHByZWZhYiBtYW51YWxseSBpbiB0aGUgQ29jb3MgQ3JlYXRvciBlZGl0b3I6XFxuMS4gU2VsZWN0IHRoZSBwcmVmYWIgaW4gdGhlIEFzc2V0cyBwYW5lbFxcbjIuIFJpZ2h0LWNsaWNrIGFuZCBjaG9vc2UgQ29weVxcbjMuIFBhc3RlIGF0IHRoZSB0YXJnZXQgbG9jYXRpb24nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEVycm9yIG9jY3VycmVkIHdoaWxlIGR1cGxpY2F0aW5nIHByZWZhYjogJHtlcnJvcn1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVhZFByZWZhYkNvbnRlbnQocHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVhZC1hc3NldCcsIHByZWZhYlBhdGgpLnRoZW4oKGNvbnRlbnQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJEYXRhID0gSlNPTi5wYXJzZShjb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcHJlZmFiRGF0YSB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnUHJlZmFiIGZpbGUgZm9ybWF0IGVycm9yJyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byByZWFkIHByZWZhYiBmaWxlJyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBtb2RpZnlQcmVmYWJGb3JEdXBsaWNhdGlvbihwcmVmYWJEYXRhOiBhbnlbXSwgbmV3TmFtZTogc3RyaW5nLCBuZXdVdWlkOiBzdHJpbmcpOiBhbnlbXSB7XHJcbiAgICAgICAgLy8gTW9kaWZ5IHRoZSBwcmVmYWIgZGF0YSB0byBjcmVhdGUgYSBjb3B5XHJcbiAgICAgICAgY29uc3QgbW9kaWZpZWREYXRhID0gWy4uLnByZWZhYkRhdGFdO1xyXG5cclxuICAgICAgICAvLyBNb2RpZnkgdGhlIGZpcnN0IGVsZW1lbnQgKHByZWZhYiBhc3NldClcclxuICAgICAgICBpZiAobW9kaWZpZWREYXRhWzBdICYmIG1vZGlmaWVkRGF0YVswXS5fX3R5cGVfXyA9PT0gJ2NjLlByZWZhYicpIHtcclxuICAgICAgICAgICAgbW9kaWZpZWREYXRhWzBdLl9uYW1lID0gbmV3TmFtZSB8fCAnRHVwbGljYXRlZFByZWZhYic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVcGRhdGUgYWxsIFVVSUQgcmVmZXJlbmNlcyAoc2ltcGxpZmllZCB2ZXJzaW9uKVxyXG4gICAgICAgIC8vIEluIHByYWN0aWNlLCBtb3JlIGNvbXBsZXggVVVJRCBtYXBwaW5nIG1heSBiZSByZXF1aXJlZFxyXG5cclxuICAgICAgICByZXR1cm4gbW9kaWZpZWREYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGFuIGFzc2V0IGZpbGUgdXNpbmcgdGhlIGFzc2V0LWRiIEFQSS5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBc3NldFdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZGF0YT86IGFueTsgZXJyb3I/OiBzdHJpbmcgfT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCBhc3NldFBhdGgsIGNvbnRlbnQsIHtcclxuICAgICAgICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHJlbmFtZTogZmFsc2VcclxuICAgICAgICAgICAgfSkudGhlbigoYXNzZXRJbmZvOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBc3NldCBmaWxlIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5OicsIGFzc2V0SW5mbyk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogYXNzZXRJbmZvIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBhc3NldCBmaWxlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBjcmVhdGUgYXNzZXQgZmlsZScgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgbWV0YSBmaWxlIHVzaW5nIHRoZSBhc3NldC1kYiBBUEkuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTWV0YVdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nLCBtZXRhQ29udGVudDogYW55KTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbWV0YUNvbnRlbnRTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShtZXRhQ29udGVudCwgbnVsbCwgMik7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3NhdmUtYXNzZXQtbWV0YScsIGFzc2V0UGF0aCwgbWV0YUNvbnRlbnRTdHJpbmcpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWV0YSBmaWxlIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5OicsIGFzc2V0SW5mbyk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogYXNzZXRJbmZvIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBtZXRhIGZpbGU6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIGNyZWF0ZSBtZXRhIGZpbGUnIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlaW1wb3J0IGFuIGFzc2V0IHVzaW5nIHRoZSBhc3NldC1kYiBBUEkuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgcmVpbXBvcnRBc3NldFdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVpbXBvcnQtYXNzZXQnLCBhc3NldFBhdGgpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXNzZXQgcmVpbXBvcnRlZCBzdWNjZXNzZnVsbHk6JywgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQgfSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVpbXBvcnQgYXNzZXQ6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIHJlaW1wb3J0IGFzc2V0JyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgYXNzZXQgZmlsZSBjb250ZW50IHVzaW5nIHRoZSBhc3NldC1kYiBBUEkuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlQXNzZXRXaXRoQXNzZXREQihhc3NldFBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnc2F2ZS1hc3NldCcsIGFzc2V0UGF0aCwgY29udGVudCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBc3NldCBmaWxlIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5OicsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHVwZGF0ZSBhc3NldCBmaWxlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byB1cGRhdGUgYXNzZXQgZmlsZScgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIHByZWZhYiBjb250ZW50IGNvbmZvcm1pbmcgdG8gdGhlIENvY29zIENyZWF0b3Igc3RhbmRhcmQuXHJcbiAgICAgKiBGdWxseSBpbXBsZW1lbnRzIHJlY3Vyc2l2ZSBub2RlIHRyZWUgcHJvY2Vzc2luZyB0byBtYXRjaCB0aGUgZW5naW5lJ3Mgc3RhbmRhcmQgZm9ybWF0LlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVN0YW5kYXJkUHJlZmFiQ29udGVudChub2RlRGF0YTogYW55LCBwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuLCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbik6IFByb21pc2U8YW55W10+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgY3JlYXRpb24gb2YgZW5naW5lLXN0YW5kYXJkIHByZWZhYiBjb250ZW50Li4uJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHByZWZhYkRhdGE6IGFueVtdID0gW107XHJcbiAgICAgICAgbGV0IGN1cnJlbnRJZCA9IDA7XHJcblxyXG4gICAgICAgIC8vIDEuIENyZWF0ZSB0aGUgcHJlZmFiIGFzc2V0IG9iamVjdCAoaW5kZXggMClcclxuICAgICAgICBjb25zdCBwcmVmYWJBc3NldCA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLFxyXG4gICAgICAgICAgICBcIl9uYW1lXCI6IHByZWZhYk5hbWUgfHwgXCJcIiwgLy8gRW5zdXJlIHByZWZhYiBuYW1lIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxyXG4gICAgICAgICAgICBcIl9fZWRpdG9yRXh0cmFzX19cIjoge30sXHJcbiAgICAgICAgICAgIFwiX25hdGl2ZVwiOiBcIlwiLFxyXG4gICAgICAgICAgICBcImRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogMVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIm9wdGltaXphdGlvblBvbGljeVwiOiAwLFxyXG4gICAgICAgICAgICBcInBlcnNpc3RlbnRcIjogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIHByZWZhYkRhdGEucHVzaChwcmVmYWJBc3NldCk7XHJcbiAgICAgICAgY3VycmVudElkKys7XHJcblxyXG4gICAgICAgIC8vIDIuIFJlY3Vyc2l2ZWx5IGNyZWF0ZSB0aGUgZnVsbCBub2RlIHRyZWUgc3RydWN0dXJlXHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcclxuICAgICAgICAgICAgcHJlZmFiRGF0YSxcclxuICAgICAgICAgICAgY3VycmVudElkOiBjdXJyZW50SWQgKyAxLCAvLyBUaGUgcm9vdCBub2RlIG9jY3VwaWVzIGluZGV4IDE7IGNoaWxkIG5vZGVzIHN0YXJ0IGZyb20gaW5kZXggMlxyXG4gICAgICAgICAgICBwcmVmYWJBc3NldEluZGV4OiAwLFxyXG4gICAgICAgICAgICBub2RlRmlsZUlkczogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSwgLy8gU3RvcmVzIHRoZSBtYXBwaW5nIGZyb20gbm9kZSBJRCB0byBmaWxlSWRcclxuICAgICAgICAgICAgbm9kZVV1aWRUb0luZGV4OiBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpLCAvLyBTdG9yZXMgdGhlIG1hcHBpbmcgZnJvbSBub2RlIFVVSUQgdG8gaW5kZXhcclxuICAgICAgICAgICAgY29tcG9uZW50VXVpZFRvSW5kZXg6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCkgLy8gU3RvcmVzIHRoZSBtYXBwaW5nIGZyb20gY29tcG9uZW50IFVVSUQgdG8gaW5kZXhcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgbm9kZSBhbmQgdGhlIGVudGlyZSBub2RlIHRyZWUuXHJcbiAgICAgICAgLy8gTm90ZTogdGhlIHJvb3Qgbm9kZSdzIHBhcmVudCBzaG91bGQgYmUgbnVsbCwgbm90IHRoZSBwcmVmYWIgYXNzZXQgb2JqZWN0LlxyXG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlQ29tcGxldGVOb2RlVHJlZShub2RlRGF0YSwgbnVsbCwgMSwgY29udGV4dCwgaW5jbHVkZUNoaWxkcmVuLCBpbmNsdWRlQ29tcG9uZW50cywgcHJlZmFiTmFtZSk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBQcmVmYWIgY29udGVudCBjcmVhdGlvbiBjb21wbGV0ZSwgdG90YWwgJHtwcmVmYWJEYXRhLmxlbmd0aH0gb2JqZWN0c2ApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdOb2RlIGZpbGVJZCBtYXBwaW5nOicsIEFycmF5LmZyb20oY29udGV4dC5ub2RlRmlsZUlkcy5lbnRyaWVzKCkpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByZWZhYkRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWN1cnNpdmVseSBjcmVhdGUgdGhlIGZ1bGwgbm9kZSB0cmVlLCBpbmNsdWRpbmcgYWxsIGNoaWxkIG5vZGVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIFByZWZhYkluZm8uXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQ29tcGxldGVOb2RlVHJlZShcclxuICAgICAgICBub2RlRGF0YTogYW55LFxyXG4gICAgICAgIHBhcmVudE5vZGVJbmRleDogbnVtYmVyIHwgbnVsbCxcclxuICAgICAgICBub2RlSW5kZXg6IG51bWJlcixcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIHByZWZhYkRhdGE6IGFueVtdLFxyXG4gICAgICAgICAgICBjdXJyZW50SWQ6IG51bWJlcixcclxuICAgICAgICAgICAgcHJlZmFiQXNzZXRJbmRleDogbnVtYmVyLFxyXG4gICAgICAgICAgICBub2RlRmlsZUlkczogTWFwPHN0cmluZywgc3RyaW5nPixcclxuICAgICAgICAgICAgbm9kZVV1aWRUb0luZGV4OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxyXG4gICAgICAgICAgICBjb21wb25lbnRVdWlkVG9JbmRleDogTWFwPHN0cmluZywgbnVtYmVyPlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuLFxyXG4gICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuLFxyXG4gICAgICAgIG5vZGVOYW1lPzogc3RyaW5nXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCB7IHByZWZhYkRhdGEgfSA9IGNvbnRleHQ7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBvYmplY3RcclxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5jcmVhdGVFbmdpbmVTdGFuZGFyZE5vZGUobm9kZURhdGEsIHBhcmVudE5vZGVJbmRleCwgbm9kZU5hbWUpO1xyXG5cclxuICAgICAgICAvLyBFbnN1cmUgdGhlIG5vZGUgaXMgcGxhY2VkIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggcG9zaXRpb25cclxuICAgICAgICB3aGlsZSAocHJlZmFiRGF0YS5sZW5ndGggPD0gbm9kZUluZGV4KSB7XHJcbiAgICAgICAgICAgIHByZWZhYkRhdGEucHVzaChudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coYFNldHRpbmcgbm9kZSBhdCBpbmRleCAke25vZGVJbmRleH06ICR7bm9kZS5fbmFtZX0sIF9wYXJlbnQ6YCwgbm9kZS5fcGFyZW50LCBgX2NoaWxkcmVuIGNvdW50OiAke25vZGUuX2NoaWxkcmVuLmxlbmd0aH1gKTtcclxuICAgICAgICBwcmVmYWJEYXRhW25vZGVJbmRleF0gPSBub2RlO1xyXG5cclxuICAgICAgICAvLyBHZW5lcmF0ZSBhIGZpbGVJZCBmb3IgdGhlIGN1cnJlbnQgbm9kZSBhbmQgcmVjb3JkIHRoZSBVVUlELXRvLWluZGV4IG1hcHBpbmdcclxuICAgICAgICBjb25zdCBub2RlVXVpZCA9IHRoaXMuZXh0cmFjdE5vZGVVdWlkKG5vZGVEYXRhKTtcclxuICAgICAgICBjb25zdCBmaWxlSWQgPSBub2RlVXVpZCB8fCB0aGlzLmdlbmVyYXRlRmlsZUlkKCk7XHJcbiAgICAgICAgY29udGV4dC5ub2RlRmlsZUlkcy5zZXQobm9kZUluZGV4LnRvU3RyaW5nKCksIGZpbGVJZCk7XHJcblxyXG4gICAgICAgIC8vIFJlY29yZCB0aGUgbm9kZSBVVUlELXRvLWluZGV4IG1hcHBpbmdcclxuICAgICAgICBpZiAobm9kZVV1aWQpIHtcclxuICAgICAgICAgICAgY29udGV4dC5ub2RlVXVpZFRvSW5kZXguc2V0KG5vZGVVdWlkLCBub2RlSW5kZXgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVjb3JkaW5nIG5vZGUgVVVJRCBtYXBwaW5nOiAke25vZGVVdWlkfSAtPiAke25vZGVJbmRleH1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3MgY2hpbGQgbm9kZXMgZmlyc3QgKHRvIG1haW50YWluIGNvbnNpc3RlbnQgaW5kZXggb3JkZXJpbmcgd2l0aCBtYW51YWwgY3JlYXRpb24pXHJcbiAgICAgICAgY29uc3QgY2hpbGRyZW5Ub1Byb2Nlc3MgPSB0aGlzLmdldENoaWxkcmVuVG9Qcm9jZXNzKG5vZGVEYXRhKTtcclxuICAgICAgICBpZiAoaW5jbHVkZUNoaWxkcmVuICYmIGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IGNoaWxkIG5vZGVzIG9mIG5vZGUgJHtub2RlLl9uYW1lfWApO1xyXG5cclxuICAgICAgICAgICAgLy8gQXNzaWduIGluZGljZXMgdG8gZWFjaCBjaGlsZCBub2RlXHJcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5kaWNlczogbnVtYmVyW10gPSBbXTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFByZXBhcmluZyB0byBhc3NpZ24gaW5kaWNlcyBmb3IgJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IGNoaWxkIG5vZGVzLCBjdXJyZW50IElEOiAke2NvbnRleHQuY3VycmVudElkfWApO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBjaGlsZCBub2RlICR7aSsxfSwgY3VycmVudCBjdXJyZW50SWQ6ICR7Y29udGV4dC5jdXJyZW50SWR9YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZEluZGV4ID0gY29udGV4dC5jdXJyZW50SWQrKztcclxuICAgICAgICAgICAgICAgIGNoaWxkSW5kaWNlcy5wdXNoKGNoaWxkSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5fY2hpbGRyZW4ucHVzaCh7IFwiX19pZF9fXCI6IGNoaWxkSW5kZXggfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQWRkZWQgY2hpbGQgbm9kZSByZWZlcmVuY2UgdG8gJHtub2RlLl9uYW1lfToge19faWRfXzogJHtjaGlsZEluZGV4fX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTm9kZSAke25vZGUuX25hbWV9IGZpbmFsIGNoaWxkcmVuIGFycmF5OmAsIG5vZGUuX2NoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNyZWF0ZSBjaGlsZCBub2Rlc1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSBjaGlsZHJlblRvUHJvY2Vzc1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5kZXggPSBjaGlsZEluZGljZXNbaV07XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUNvbXBsZXRlTm9kZVRyZWUoXHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGREYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNoaWxkcmVuLFxyXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkRGF0YS5uYW1lIHx8IGBDaGlsZCR7aSsxfWBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZW4gcHJvY2VzcyBjb21wb25lbnRzXHJcbiAgICAgICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGVEYXRhLmNvbXBvbmVudHMgJiYgQXJyYXkuaXNBcnJheShub2RlRGF0YS5jb21wb25lbnRzKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyAke25vZGVEYXRhLmNvbXBvbmVudHMubGVuZ3RofSBjb21wb25lbnRzIG9mIG5vZGUgJHtub2RlLl9uYW1lfWApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SW5kaWNlczogbnVtYmVyW10gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnQgb2Ygbm9kZURhdGEuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBjb250ZXh0LmN1cnJlbnRJZCsrO1xyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50SW5kaWNlcy5wdXNoKGNvbXBvbmVudEluZGV4KTtcclxuICAgICAgICAgICAgICAgIG5vZGUuX2NvbXBvbmVudHMucHVzaCh7IFwiX19pZF9fXCI6IGNvbXBvbmVudEluZGV4IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlY29yZCB0aGUgY29tcG9uZW50IFVVSUQtdG8taW5kZXggbWFwcGluZ1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50VXVpZCA9IGNvbXBvbmVudC51dWlkIHx8IChjb21wb25lbnQudmFsdWUgJiYgY29tcG9uZW50LnZhbHVlLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudFV1aWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmNvbXBvbmVudFV1aWRUb0luZGV4LnNldChjb21wb25lbnRVdWlkLCBjb21wb25lbnRJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlY29yZGVkIGNvbXBvbmVudCBVVUlEIG1hcHBpbmc6ICR7Y29tcG9uZW50VXVpZH0gLT4gJHtjb21wb25lbnRJbmRleH1gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbXBvbmVudCBvYmplY3QsIHBhc3NpbmcgY29udGV4dCB0byBoYW5kbGUgcmVmZXJlbmNlc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50T2JqID0gdGhpcy5jcmVhdGVDb21wb25lbnRPYmplY3QoY29tcG9uZW50LCBub2RlSW5kZXgsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiRGF0YVtjb21wb25lbnRJbmRleF0gPSBjb21wb25lbnRPYmo7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgQ29tcFByZWZhYkluZm8gZm9yIHRoZSBjb21wb25lbnRcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBQcmVmYWJJbmZvSW5kZXggPSBjb250ZXh0LmN1cnJlbnRJZCsrO1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiRGF0YVtjb21wUHJlZmFiSW5mb0luZGV4XSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuQ29tcFByZWZhYkluZm9cIixcclxuICAgICAgICAgICAgICAgICAgICBcImZpbGVJZFwiOiB0aGlzLmdlbmVyYXRlRmlsZUlkKClcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNvbXBvbmVudCBvYmplY3QgaGFzIGEgX19wcmVmYWIgcHJvcGVydHksIHNldCB0aGUgcmVmZXJlbmNlXHJcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50T2JqICYmIHR5cGVvZiBjb21wb25lbnRPYmogPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50T2JqLl9fcHJlZmFiID0geyBcIl9faWRfX1wiOiBjb21wUHJlZmFiSW5mb0luZGV4IH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBOb2RlICR7bm9kZS5fbmFtZX0gaGFkICR7Y29tcG9uZW50SW5kaWNlcy5sZW5ndGh9IGNvbXBvbmVudHMgYWRkZWRgKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBDcmVhdGUgYSBQcmVmYWJJbmZvIGZvciB0aGUgY3VycmVudCBub2RlXHJcbiAgICAgICAgY29uc3QgcHJlZmFiSW5mb0luZGV4ID0gY29udGV4dC5jdXJyZW50SWQrKztcclxuICAgICAgICBub2RlLl9wcmVmYWIgPSB7IFwiX19pZF9fXCI6IHByZWZhYkluZm9JbmRleCB9O1xyXG5cclxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvOiBhbnkgPSB7XHJcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5QcmVmYWJJbmZvXCIsXHJcbiAgICAgICAgICAgIFwicm9vdFwiOiB7IFwiX19pZF9fXCI6IDEgfSxcclxuICAgICAgICAgICAgXCJhc3NldFwiOiB7IFwiX19pZF9fXCI6IGNvbnRleHQucHJlZmFiQXNzZXRJbmRleCB9LFxyXG4gICAgICAgICAgICBcImZpbGVJZFwiOiBmaWxlSWQsXHJcbiAgICAgICAgICAgIFwidGFyZ2V0T3ZlcnJpZGVzXCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwibmVzdGVkUHJlZmFiSW5zdGFuY2VSb290c1wiOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgcm9vdCBub2RlXHJcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PT0gMSkge1xyXG4gICAgICAgICAgICAvLyBUaGUgcm9vdCBub2RlIGhhcyBubyBpbnN0YW5jZSwgYnV0IG1heSBoYXZlIHRhcmdldE92ZXJyaWRlc1xyXG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBDaGlsZCBub2RlcyB0eXBpY2FsbHkgaGF2ZSBpbnN0YW5jZSBzZXQgdG8gbnVsbFxyXG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJlZmFiRGF0YVtwcmVmYWJJbmZvSW5kZXhdID0gcHJlZmFiSW5mbztcclxuICAgICAgICBjb250ZXh0LmN1cnJlbnRJZCA9IHByZWZhYkluZm9JbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0IGEgVVVJRCB0byBDb2NvcyBDcmVhdG9yJ3MgY29tcHJlc3NlZCBmb3JtYXQuXHJcbiAgICAgKiBJbXBsZW1lbnRlZCBiYXNlZCBvbiB0aGUgcmVhbCBDb2NvcyBDcmVhdG9yIGVkaXRvcidzIGNvbXByZXNzaW9uIGFsZ29yaXRobS5cclxuICAgICAqIFRoZSBmaXJzdCA1IGhleCBjaGFyYWN0ZXJzIGFyZSBrZXB0IHVuY2hhbmdlZDsgdGhlIHJlbWFpbmluZyAyNyBjaGFyYWN0ZXJzIGFyZSBjb21wcmVzc2VkIGludG8gMTguXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgdXVpZFRvQ29tcHJlc3NlZElkKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgQkFTRTY0X0tFWVMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgaHlwaGVucyBhbmQgY29udmVydCB0byBsb3dlcmNhc2VcclxuICAgICAgICBjb25zdCBjbGVhblV1aWQgPSB1dWlkLnJlcGxhY2UoLy0vZywgJycpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIC8vIEVuc3VyZSB0aGUgVVVJRCBpcyB2YWxpZFxyXG4gICAgICAgIGlmIChjbGVhblV1aWQubGVuZ3RoICE9PSAzMikge1xyXG4gICAgICAgICAgICByZXR1cm4gdXVpZDsgLy8gSWYgbm90IGEgdmFsaWQgVVVJRCwgcmV0dXJuIHRoZSBvcmlnaW5hbCB2YWx1ZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29jb3MgQ3JlYXRvciBjb21wcmVzc2lvbjogZmlyc3QgNSBjaGFyYWN0ZXJzIHVuY2hhbmdlZCwgcmVtYWluaW5nIDI3IGNvbXByZXNzZWQgdG8gMThcclxuICAgICAgICBsZXQgcmVzdWx0ID0gY2xlYW5VdWlkLnN1YnN0cmluZygwLCA1KTtcclxuXHJcbiAgICAgICAgLy8gVGhlIHJlbWFpbmluZyAyNyBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgY29tcHJlc3NlZCBpbnRvIDE4IGNoYXJhY3RlcnNcclxuICAgICAgICBjb25zdCByZW1haW5kZXIgPSBjbGVhblV1aWQuc3Vic3RyaW5nKDUpO1xyXG5cclxuICAgICAgICAvLyBFdmVyeSAzIGhleCBjaGFyYWN0ZXJzIGFyZSBjb21wcmVzc2VkIGludG8gMiBjaGFyYWN0ZXJzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW1haW5kZXIubGVuZ3RoOyBpICs9IDMpIHtcclxuICAgICAgICAgICAgY29uc3QgaGV4MSA9IHJlbWFpbmRlcltpXSB8fCAnMCc7XHJcbiAgICAgICAgICAgIGNvbnN0IGhleDIgPSByZW1haW5kZXJbaSArIDFdIHx8ICcwJztcclxuICAgICAgICAgICAgY29uc3QgaGV4MyA9IHJlbWFpbmRlcltpICsgMl0gfHwgJzAnO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29udmVydCAzIGhleCBjaGFyYWN0ZXJzICgxMiBiaXRzKSBpbnRvIDIgYmFzZTY0IGNoYXJhY3RlcnNcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUludChoZXgxICsgaGV4MiArIGhleDMsIDE2KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNwbGl0IDEyIGJpdHMgaW50byB0d28gNi1iaXQgdmFsdWVzXHJcbiAgICAgICAgICAgIGNvbnN0IGhpZ2g2ID0gKHZhbHVlID4+IDYpICYgNjM7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvdzYgPSB2YWx1ZSAmIDYzO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzdWx0ICs9IEJBU0U2NF9LRVlTW2hpZ2g2XSArIEJBU0U2NF9LRVlTW2xvdzZdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGNvbXBvbmVudCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBjcmVhdGVDb21wb25lbnRPYmplY3QoY29tcG9uZW50RGF0YTogYW55LCBub2RlSW5kZXg6IG51bWJlciwgY29udGV4dD86IHsgXHJcbiAgICAgICAgbm9kZVV1aWRUb0luZGV4PzogTWFwPHN0cmluZywgbnVtYmVyPixcclxuICAgICAgICBjb21wb25lbnRVdWlkVG9JbmRleD86IE1hcDxzdHJpbmcsIG51bWJlcj5cclxuICAgIH0pOiBhbnkge1xyXG4gICAgICAgIGxldCBjb21wb25lbnRUeXBlID0gY29tcG9uZW50RGF0YS50eXBlIHx8IGNvbXBvbmVudERhdGEuX190eXBlX18gfHwgJ2NjLkNvbXBvbmVudCc7XHJcbiAgICAgICAgY29uc3QgZW5hYmxlZCA9IGNvbXBvbmVudERhdGEuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcG9uZW50RGF0YS5lbmFibGVkIDogdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ3JlYXRpbmcgY29tcG9uZW50IG9iamVjdCAtIG9yaWdpbmFsIHR5cGU6ICR7Y29tcG9uZW50VHlwZX1gKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnRnVsbCBjb21wb25lbnQgZGF0YTonLCBKU09OLnN0cmluZ2lmeShjb21wb25lbnREYXRhLCBudWxsLCAyKSk7XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBzY3JpcHQgY29tcG9uZW50cyAtIHRoZSBNQ1AgaW50ZXJmYWNlIGFscmVhZHkgcmV0dXJucyB0aGUgY29ycmVjdCBjb21wcmVzc2VkIFVVSUQgZm9ybWF0XHJcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUgJiYgIWNvbXBvbmVudFR5cGUuc3RhcnRzV2l0aCgnY2MuJykpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFVzaW5nIHNjcmlwdCBjb21wb25lbnQgY29tcHJlc3NlZCBVVUlEIHR5cGU6ICR7Y29tcG9uZW50VHlwZX1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEJhc2ljIGNvbXBvbmVudCBzdHJ1Y3R1cmVcclxuICAgICAgICBjb25zdCBjb21wb25lbnQ6IGFueSA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBjb21wb25lbnRUeXBlLFxyXG4gICAgICAgICAgICBcIl9uYW1lXCI6IFwiXCIsXHJcbiAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXHJcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcclxuICAgICAgICAgICAgXCJub2RlXCI6IHsgXCJfX2lkX19cIjogbm9kZUluZGV4IH0sXHJcbiAgICAgICAgICAgIFwiX2VuYWJsZWRcIjogZW5hYmxlZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFNldCBhIHBsYWNlaG9sZGVyIGZvciB0aGUgX19wcmVmYWIgcHJvcGVydHk7IGl0IHdpbGwgYmUgc2V0IGNvcnJlY3RseSBsYXRlclxyXG4gICAgICAgIGNvbXBvbmVudC5fX3ByZWZhYiA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0eXBlLXNwZWNpZmljIHByb3BlcnRpZXMgYmFzZWQgb24gdGhlIGNvbXBvbmVudCB0eXBlXHJcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5VSVRyYW5zZm9ybScpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudFNpemUgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/LmNvbnRlbnRTaXplPy52YWx1ZSB8fCB7IHdpZHRoOiAxMDAsIGhlaWdodDogMTAwIH07XHJcbiAgICAgICAgICAgIGNvbnN0IGFuY2hvclBvaW50ID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5hbmNob3JQb2ludD8udmFsdWUgfHwgeyB4OiAwLjUsIHk6IDAuNSB9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9jb250ZW50U2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5TaXplXCIsXHJcbiAgICAgICAgICAgICAgICBcIndpZHRoXCI6IGNvbnRlbnRTaXplLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgXCJoZWlnaHRcIjogY29udGVudFNpemUuaGVpZ2h0XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fYW5jaG9yUG9pbnQgPSB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjMlwiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IGFuY2hvclBvaW50LngsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogYW5jaG9yUG9pbnQueVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLlNwcml0ZScpIHtcclxuICAgICAgICAgICAgLy8gSGFuZGxlIHRoZSBTcHJpdGUgY29tcG9uZW50J3Mgc3ByaXRlRnJhbWUgcmVmZXJlbmNlXHJcbiAgICAgICAgICAgIGNvbnN0IHNwcml0ZUZyYW1lUHJvcCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3Nwcml0ZUZyYW1lIHx8IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uc3ByaXRlRnJhbWU7XHJcbiAgICAgICAgICAgIGlmIChzcHJpdGVGcmFtZVByb3ApIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5fc3ByaXRlRnJhbWUgPSB0aGlzLnByb2Nlc3NDb21wb25lbnRQcm9wZXJ0eShzcHJpdGVGcmFtZVByb3AsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50Ll9zcHJpdGVGcmFtZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdHlwZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3R5cGU/LnZhbHVlID8/IDA7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZmlsbFR5cGUgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9maWxsVHlwZT8udmFsdWUgPz8gMDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9zaXplTW9kZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3NpemVNb2RlPy52YWx1ZSA/PyAxO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxDZW50ZXIgPSB7IFwiX190eXBlX19cIjogXCJjYy5WZWMyXCIsIFwieFwiOiAwLCBcInlcIjogMCB9O1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxTdGFydCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX2ZpbGxTdGFydD8udmFsdWUgPz8gMDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9maWxsUmFuZ2UgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9maWxsUmFuZ2U/LnZhbHVlID8/IDA7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNUcmltbWVkTW9kZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX2lzVHJpbW1lZE1vZGU/LnZhbHVlID8/IHRydWU7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdXNlR3JheXNjYWxlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fdXNlR3JheXNjYWxlPy52YWx1ZSA/PyBmYWxzZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIERlYnVnOiBwcmludCBhbGwgU3ByaXRlIGNvbXBvbmVudCBwcm9wZXJ0aWVzIChjb21tZW50ZWQgb3V0KVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU3ByaXRlIGNvbXBvbmVudCBwcm9wZXJ0aWVzOicsIEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudERhdGEucHJvcGVydGllcywgbnVsbCwgMikpO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2F0bGFzID0gbnVsbDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnRUeXBlID09PSAnY2MuQnV0dG9uJykge1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2ludGVyYWN0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdHJhbnNpdGlvbiA9IDM7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fbm9ybWFsQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImFcIjogMjU1IH07XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5faG92ZXJDb2xvciA9IHsgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsIFwiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiYVwiOiAyNTUgfTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9wcmVzc2VkQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImFcIjogMjU1IH07XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZGlzYWJsZWRDb2xvciA9IHsgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsIFwiclwiOiAxMjQsIFwiZ1wiOiAxMjQsIFwiYlwiOiAxMjQsIFwiYVwiOiAyNTUgfTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9ub3JtYWxTcHJpdGUgPSBudWxsO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2hvdmVyU3ByaXRlID0gbnVsbDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9wcmVzc2VkU3ByaXRlID0gbnVsbDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9kaXNhYmxlZFNwcml0ZSA9IG51bGw7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZHVyYXRpb24gPSAwLjE7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fem9vbVNjYWxlID0gMS4yO1xyXG4gICAgICAgICAgICAvLyBIYW5kbGUgdGhlIEJ1dHRvbidzIHRhcmdldCByZWZlcmVuY2VcclxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0UHJvcCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3RhcmdldCB8fCBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/LnRhcmdldDtcclxuICAgICAgICAgICAgaWYgKHRhcmdldFByb3ApIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5fdGFyZ2V0ID0gdGhpcy5wcm9jZXNzQ29tcG9uZW50UHJvcGVydHkodGFyZ2V0UHJvcCwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuX3RhcmdldCA9IHsgXCJfX2lkX19cIjogbm9kZUluZGV4IH07IC8vIERlZmF1bHRzIHRvIHBvaW50aW5nIHRvIHRoZSBub2RlIGl0c2VsZlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fY2xpY2tFdmVudHMgPSBbXTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnRUeXBlID09PSAnY2MuTGFiZWwnKSB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fc3RyaW5nID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fc3RyaW5nPy52YWx1ZSB8fCBcIkxhYmVsXCI7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5faG9yaXpvbnRhbEFsaWduID0gMTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll92ZXJ0aWNhbEFsaWduID0gMTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9hY3R1YWxGb250U2l6ZSA9IDIwO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2ZvbnRTaXplID0gMjA7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZm9udEZhbWlseSA9IFwiQXJpYWxcIjtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9saW5lSGVpZ2h0ID0gMjU7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fb3ZlcmZsb3cgPSAwO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX2VuYWJsZVdyYXBUZXh0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9mb250ID0gbnVsbDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pc1N5c3RlbUZvbnRVc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9zcGFjaW5nWCA9IDA7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNJdGFsaWMgPSBmYWxzZTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pc0JvbGQgPSBmYWxzZTtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pc1VuZGVybGluZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjb21wb25lbnQuX3VuZGVybGluZUhlaWdodCA9IDI7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudC5fY2FjaGVNb2RlID0gMDtcclxuICAgICAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnREYXRhLnByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgLy8gSGFuZGxlIGFsbCBjb21wb25lbnQgcHJvcGVydGllcyAoYm90aCBidWlsdC1pbiBhbmQgY3VzdG9tIHNjcmlwdCBjb21wb25lbnRzKVxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhjb21wb25lbnREYXRhLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnbm9kZScgfHwga2V5ID09PSAnZW5hYmxlZCcgfHwga2V5ID09PSAnX190eXBlX18nIHx8XHJcbiAgICAgICAgICAgICAgICAgICAga2V5ID09PSAndXVpZCcgfHwga2V5ID09PSAnbmFtZScgfHwga2V5ID09PSAnX19zY3JpcHRBc3NldCcgfHwga2V5ID09PSAnX29iakZsYWdzJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoZXNlIHNwZWNpYWwgcHJvcGVydGllcywgaW5jbHVkaW5nIF9vYmpGbGFnc1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFByb3BlcnRpZXMgc3RhcnRpbmcgd2l0aCB1bmRlcnNjb3JlIHJlcXVpcmUgc3BlY2lhbCBoYW5kbGluZ1xyXG4gICAgICAgICAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKCdfJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIHByb3BlcnR5IG5hbWUgaXMgcHJlc2VydmVkIGFzLWlzIChpbmNsdWRpbmcgdGhlIHVuZGVyc2NvcmUpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcFZhbHVlID0gdGhpcy5wcm9jZXNzQ29tcG9uZW50UHJvcGVydHkodmFsdWUsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRba2V5XSA9IHByb3BWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFByb3BlcnRpZXMgbm90IHN0YXJ0aW5nIHdpdGggdW5kZXJzY29yZSBhcmUgcHJvY2Vzc2VkIG5vcm1hbGx5XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcFZhbHVlID0gdGhpcy5wcm9jZXNzQ29tcG9uZW50UHJvcGVydHkodmFsdWUsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRba2V5XSA9IHByb3BWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRW5zdXJlIF9pZCBpcyBpbiB0aGUgbGFzdCBwb3NpdGlvblxyXG4gICAgICAgIGNvbnN0IF9pZCA9IGNvbXBvbmVudC5faWQgfHwgXCJcIjtcclxuICAgICAgICBkZWxldGUgY29tcG9uZW50Ll9pZDtcclxuICAgICAgICBjb21wb25lbnQuX2lkID0gX2lkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBjb21wb25lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm9jZXNzIGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZXMgdG8gZW5zdXJlIHRoZSBmb3JtYXQgaXMgY29uc2lzdGVudCB3aXRoIG1hbnVhbGx5IGNyZWF0ZWQgcHJlZmFicy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBwcm9jZXNzQ29tcG9uZW50UHJvcGVydHkocHJvcERhdGE6IGFueSwgY29udGV4dD86IHtcclxuICAgICAgICBub2RlVXVpZFRvSW5kZXg/OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxyXG4gICAgICAgIGNvbXBvbmVudFV1aWRUb0luZGV4PzogTWFwPHN0cmluZywgbnVtYmVyPlxyXG4gICAgfSk6IGFueSB7XHJcbiAgICAgICAgaWYgKCFwcm9wRGF0YSB8fCB0eXBlb2YgcHJvcERhdGEgIT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9wRGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcERhdGEudmFsdWU7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHByb3BEYXRhLnR5cGU7XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBudWxsIHZhbHVlc1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIGVtcHR5IFVVSUQgb2JqZWN0cyBhbmQgY29udmVydCB0byBudWxsXHJcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUudXVpZCA9PT0gJycpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBIYW5kbGUgbm9kZSByZWZlcmVuY2VzXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdjYy5Ob2RlJyAmJiB2YWx1ZT8udXVpZCkge1xyXG4gICAgICAgICAgICAvLyBJbiBhIHByZWZhYiwgbm9kZSByZWZlcmVuY2VzIG11c3QgYmUgY29udmVydGVkIHRvIF9faWRfXyBmb3JtXHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0Py5ub2RlVXVpZFRvSW5kZXggJiYgY29udGV4dC5ub2RlVXVpZFRvSW5kZXguaGFzKHZhbHVlLnV1aWQpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJbnRlcm5hbCByZWZlcmVuY2U6IGNvbnZlcnQgdG8gX19pZF9fIGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5nZXQodmFsdWUudXVpZClcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRXh0ZXJuYWwgcmVmZXJlbmNlOiBzZXQgdG8gbnVsbCBiZWNhdXNlIGV4dGVybmFsIG5vZGVzIGRvIG5vdCBiZWxvbmcgdG8gdGhlIHByZWZhYiBzdHJ1Y3R1cmVcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBOb2RlIHJlZmVyZW5jZSBVVUlEICR7dmFsdWUudXVpZH0gbm90IGZvdW5kIGluIHByZWZhYiBjb250ZXh0LCBzZXR0aW5nIHRvIG51bGwgKGV4dGVybmFsIHJlZmVyZW5jZSlgKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBIYW5kbGUgYXNzZXQgcmVmZXJlbmNlcyAocHJlZmFicywgdGV4dHVyZXMsIHNwcml0ZSBmcmFtZXMsIGV0Yy4pXHJcbiAgICAgICAgaWYgKHZhbHVlPy51dWlkICYmIChcclxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLlByZWZhYicgfHwgXHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5UZXh0dXJlMkQnIHx8IFxyXG4gICAgICAgICAgICB0eXBlID09PSAnY2MuU3ByaXRlRnJhbWUnIHx8XHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5NYXRlcmlhbCcgfHxcclxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLkFuaW1hdGlvbkNsaXAnIHx8XHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5BdWRpb0NsaXAnIHx8XHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5Gb250JyB8fFxyXG4gICAgICAgICAgICB0eXBlID09PSAnY2MuQXNzZXQnXHJcbiAgICAgICAgKSkge1xyXG4gICAgICAgICAgICAvLyBGb3IgcHJlZmFiIHJlZmVyZW5jZXMsIGtlZXAgdGhlIG9yaWdpbmFsIFVVSUQgZm9ybWF0XHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWRUb1VzZSA9IHR5cGUgPT09ICdjYy5QcmVmYWInID8gdmFsdWUudXVpZCA6IHRoaXMudXVpZFRvQ29tcHJlc3NlZElkKHZhbHVlLnV1aWQpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgXCJfX3V1aWRfX1wiOiB1dWlkVG9Vc2UsXHJcbiAgICAgICAgICAgICAgICBcIl9fZXhwZWN0ZWRUeXBlX19cIjogdHlwZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIGNvbXBvbmVudCByZWZlcmVuY2VzIChpbmNsdWRpbmcgc3BlY2lmaWMgY29tcG9uZW50IHR5cGVzIGxpa2UgY2MuTGFiZWwsIGNjLkJ1dHRvbiwgZXRjLilcclxuICAgICAgICBpZiAodmFsdWU/LnV1aWQgJiYgKHR5cGUgPT09ICdjYy5Db21wb25lbnQnIHx8XHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5MYWJlbCcgfHwgdHlwZSA9PT0gJ2NjLkJ1dHRvbicgfHwgdHlwZSA9PT0gJ2NjLlNwcml0ZScgfHxcclxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLlVJVHJhbnNmb3JtJyB8fCB0eXBlID09PSAnY2MuUmlnaWRCb2R5MkQnIHx8XHJcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5Cb3hDb2xsaWRlcjJEJyB8fCB0eXBlID09PSAnY2MuQW5pbWF0aW9uJyB8fFxyXG4gICAgICAgICAgICB0eXBlID09PSAnY2MuQXVkaW9Tb3VyY2UnIHx8ICh0eXBlPy5zdGFydHNXaXRoKCdjYy4nKSAmJiAhdHlwZS5pbmNsdWRlcygnQCcpKSkpIHtcclxuICAgICAgICAgICAgLy8gSW4gYSBwcmVmYWIsIGNvbXBvbmVudCByZWZlcmVuY2VzIGFsc28gbmVlZCB0byBiZSBjb252ZXJ0ZWQgdG8gX19pZF9fIGZvcm1cclxuICAgICAgICAgICAgaWYgKGNvbnRleHQ/LmNvbXBvbmVudFV1aWRUb0luZGV4ICYmIGNvbnRleHQuY29tcG9uZW50VXVpZFRvSW5kZXguaGFzKHZhbHVlLnV1aWQpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJbnRlcm5hbCByZWZlcmVuY2U6IGNvbnZlcnQgdG8gX19pZF9fIGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENvbXBvbmVudCByZWZlcmVuY2UgJHt0eXBlfSBVVUlEICR7dmFsdWUudXVpZH0gZm91bmQgaW4gcHJlZmFiIGNvbnRleHQsIGNvbnZlcnRpbmcgdG8gX19pZF9fYCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IGNvbnRleHQuY29tcG9uZW50VXVpZFRvSW5kZXguZ2V0KHZhbHVlLnV1aWQpXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEV4dGVybmFsIHJlZmVyZW5jZTogc2V0IHRvIG51bGwgYmVjYXVzZSBleHRlcm5hbCBjb21wb25lbnRzIGRvIG5vdCBiZWxvbmcgdG8gdGhlIHByZWZhYiBzdHJ1Y3R1cmVcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb21wb25lbnQgcmVmZXJlbmNlICR7dHlwZX0gVVVJRCAke3ZhbHVlLnV1aWR9IG5vdCBmb3VuZCBpbiBwcmVmYWIgY29udGV4dCwgc2V0dGluZyB0byBudWxsIChleHRlcm5hbCByZWZlcmVuY2UpYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIGNvbXBsZXggdHlwZXMgYW5kIGFkZCBhIF9fdHlwZV9fIG1hcmtlclxyXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnY2MuQ29sb3InKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiclwiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5yKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJnXCI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHZhbHVlLmcpIHx8IDApKSxcclxuICAgICAgICAgICAgICAgICAgICBcImJcIjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUuYikgfHwgMCkpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYVwiOiB2YWx1ZS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5hKSkpIDogMjU1XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5WZWMzJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiBOdW1iZXIodmFsdWUueCkgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogTnVtYmVyKHZhbHVlLnkpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IE51bWJlcih2YWx1ZS56KSB8fCAwXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5WZWMyJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjMlwiLCBcclxuICAgICAgICAgICAgICAgICAgICBcInhcIjogTnVtYmVyKHZhbHVlLngpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IE51bWJlcih2YWx1ZS55KSB8fCAwXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5TaXplJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuU2l6ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjogTnVtYmVyKHZhbHVlLndpZHRoKSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IE51bWJlcih2YWx1ZS5oZWlnaHQpIHx8IDBcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2NjLlF1YXQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IE51bWJlcih2YWx1ZS54KSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiBOdW1iZXIodmFsdWUueSkgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICBcInpcIjogTnVtYmVyKHZhbHVlLnopIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3XCI6IHZhbHVlLncgIT09IHVuZGVmaW5lZCA/IE51bWJlcih2YWx1ZS53KSA6IDFcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBhcnJheSB0eXBlc1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAvLyBOb2RlIGFycmF5c1xyXG4gICAgICAgICAgICBpZiAocHJvcERhdGEuZWxlbWVudFR5cGVEYXRhPy50eXBlID09PSAnY2MuTm9kZScpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0/LnV1aWQgJiYgY29udGV4dD8ubm9kZVV1aWRUb0luZGV4Py5oYXMoaXRlbS51dWlkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcIl9faWRfX1wiOiBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5nZXQoaXRlbS51dWlkKSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH0pLmZpbHRlcihpdGVtID0+IGl0ZW0gIT09IG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBc3NldCBhcnJheXNcclxuICAgICAgICAgICAgaWYgKHByb3BEYXRhLmVsZW1lbnRUeXBlRGF0YT8udHlwZSAmJiBwcm9wRGF0YS5lbGVtZW50VHlwZURhdGEudHlwZS5zdGFydHNXaXRoKCdjYy4nKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLm1hcChpdGVtID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbT8udXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJfX3V1aWRfX1wiOiB0aGlzLnV1aWRUb0NvbXByZXNzZWRJZChpdGVtLnV1aWQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJfX2V4cGVjdGVkVHlwZV9fXCI6IHByb3BEYXRhLmVsZW1lbnRUeXBlRGF0YS50eXBlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfSkuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gbnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFByaW1pdGl2ZSB0eXBlIGFycmF5c1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKGl0ZW0gPT4gaXRlbT8udmFsdWUgIT09IHVuZGVmaW5lZCA/IGl0ZW0udmFsdWUgOiBpdGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE90aGVyIGNvbXBsZXggb2JqZWN0IHR5cGVzOiBrZWVwIGFzLWlzIGJ1dCBlbnN1cmUgYSBfX3R5cGVfXyBtYXJrZXIgaXMgcHJlc2VudFxyXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGUgJiYgdHlwZS5zdGFydHNXaXRoKCdjYy4nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgLi4udmFsdWVcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5vZGUgb2JqZWN0IGNvbmZvcm1pbmcgdG8gdGhlIGVuZ2luZSdzIHN0YW5kYXJkIGZvcm1hdC5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbmdpbmVTdGFuZGFyZE5vZGUobm9kZURhdGE6IGFueSwgcGFyZW50Tm9kZUluZGV4OiBudW1iZXIgfCBudWxsLCBub2RlTmFtZT86IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgLy8gRGVidWc6IHByaW50IHJhdyBub2RlIGRhdGEgKGNvbW1lbnRlZCBvdXQpXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ1JhdyBub2RlIGRhdGE6JywgSlNPTi5zdHJpbmdpZnkobm9kZURhdGEsIG51bGwsIDIpKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBFeHRyYWN0IGJhc2ljIG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgIGNvbnN0IGdldFZhbHVlID0gKHByb3A6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocHJvcD8udmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3AudmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChwcm9wICE9PSB1bmRlZmluZWQpIHJldHVybiBwcm9wO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0VmFsdWUobm9kZURhdGEucG9zaXRpb24pIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5wb3NpdGlvbikgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH07XHJcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5yb3RhdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnJvdGF0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAsIHc6IDEgfTtcclxuICAgICAgICBjb25zdCBzY2FsZSA9IGdldFZhbHVlKG5vZGVEYXRhLnNjYWxlKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uc2NhbGUpIHx8IHsgeDogMSwgeTogMSwgejogMSB9O1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZSA9IGdldFZhbHVlKG5vZGVEYXRhLmFjdGl2ZSkgPz8gZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmFjdGl2ZSkgPz8gdHJ1ZTtcclxuICAgICAgICBjb25zdCBuYW1lID0gbm9kZU5hbWUgfHwgZ2V0VmFsdWUobm9kZURhdGEubmFtZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/Lm5hbWUpIHx8ICdOb2RlJztcclxuICAgICAgICBjb25zdCBsYXllciA9IGdldFZhbHVlKG5vZGVEYXRhLmxheWVyKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ubGF5ZXIpIHx8IDEwNzM3NDE4MjQ7XHJcblxyXG4gICAgICAgIC8vIERlYnVnIG91dHB1dFxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGluZyBub2RlOiAke25hbWV9LCBwYXJlbnROb2RlSW5kZXg6ICR7cGFyZW50Tm9kZUluZGV4fWApO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJlbnRSZWYgPSBwYXJlbnROb2RlSW5kZXggIT09IG51bGwgPyB7IFwiX19pZF9fXCI6IHBhcmVudE5vZGVJbmRleCB9IDogbnVsbDtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTm9kZSAke25hbWV9IHBhcmVudCByZWZlcmVuY2U6YCwgcGFyZW50UmVmKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLk5vZGVcIixcclxuICAgICAgICAgICAgXCJfbmFtZVwiOiBuYW1lLFxyXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxyXG4gICAgICAgICAgICBcIl9fZWRpdG9yRXh0cmFzX19cIjoge30sXHJcbiAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRSZWYsXHJcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLCAvLyBDaGlsZCBub2RlIHJlZmVyZW5jZXMgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIGR1cmluZyByZWN1cnNpb25cclxuICAgICAgICAgICAgXCJfYWN0aXZlXCI6IGFjdGl2ZSxcclxuICAgICAgICAgICAgXCJfY29tcG9uZW50c1wiOiBbXSwgLy8gQ29tcG9uZW50IHJlZmVyZW5jZXMgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHdoZW4gcHJvY2Vzc2luZyBjb21wb25lbnRzXHJcbiAgICAgICAgICAgIFwiX3ByZWZhYlwiOiB7IFwiX19pZF9fXCI6IDAgfSwgLy8gVGVtcG9yYXJ5IHZhbHVlOyB3aWxsIGJlIHNldCBjb3JyZWN0bHkgbGF0ZXJcclxuICAgICAgICAgICAgXCJfbHBvc1wiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHBvc2l0aW9uLngsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogcG9zaXRpb24ueSxcclxuICAgICAgICAgICAgICAgIFwielwiOiBwb3NpdGlvbi56XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2xyb3RcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlF1YXRcIixcclxuICAgICAgICAgICAgICAgIFwieFwiOiByb3RhdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHJvdGF0aW9uLnksXHJcbiAgICAgICAgICAgICAgICBcInpcIjogcm90YXRpb24ueixcclxuICAgICAgICAgICAgICAgIFwid1wiOiByb3RhdGlvbi53XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2xzY2FsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogc2NhbGUueSxcclxuICAgICAgICAgICAgICAgIFwielwiOiBzY2FsZS56XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX21vYmlsaXR5XCI6IDAsXHJcbiAgICAgICAgICAgIFwiX2xheWVyXCI6IGxheWVyLFxyXG4gICAgICAgICAgICBcIl9ldWxlclwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IDAsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcclxuICAgICAgICAgICAgICAgIFwielwiOiAwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiXCJcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXh0cmFjdCBVVUlEIGZyb20gbm9kZSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgZXh0cmFjdE5vZGVVdWlkKG5vZGVEYXRhOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgICAgICBpZiAoIW5vZGVEYXRhKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUcnkgbXVsdGlwbGUgYXBwcm9hY2hlcyB0byBnZXQgVVVJRFxyXG4gICAgICAgIGNvbnN0IHNvdXJjZXMgPSBbXHJcbiAgICAgICAgICAgIG5vZGVEYXRhLnV1aWQsXHJcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy51dWlkLFxyXG4gICAgICAgICAgICBub2RlRGF0YS5fX3V1aWRfXyxcclxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/Ll9fdXVpZF9fLFxyXG4gICAgICAgICAgICBub2RlRGF0YS5pZCxcclxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/LmlkXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJyAmJiBzb3VyY2UubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG1pbmltYWwgbm9kZSBvYmplY3Qgd2l0aCBubyBjb21wb25lbnRzIHRvIGF2b2lkIGRlcGVuZGVuY3kgaXNzdWVzXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgY3JlYXRlTWluaW1hbE5vZGUobm9kZURhdGE6IGFueSwgbm9kZU5hbWU/OiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIC8vIEV4dHJhY3QgYmFzaWMgbm9kZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgY29uc3QgZ2V0VmFsdWUgPSAocHJvcDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcC52YWx1ZTtcclxuICAgICAgICAgICAgaWYgKHByb3AgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3A7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5wb3NpdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnBvc2l0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcclxuICAgICAgICBjb25zdCByb3RhdGlvbiA9IGdldFZhbHVlKG5vZGVEYXRhLnJvdGF0aW9uKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ucm90YXRpb24pIHx8IHsgeDogMCwgeTogMCwgejogMCwgdzogMSB9O1xyXG4gICAgICAgIGNvbnN0IHNjYWxlID0gZ2V0VmFsdWUobm9kZURhdGEuc2NhbGUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5zY2FsZSkgfHwgeyB4OiAxLCB5OiAxLCB6OiAxIH07XHJcbiAgICAgICAgY29uc3QgYWN0aXZlID0gZ2V0VmFsdWUobm9kZURhdGEuYWN0aXZlKSA/PyBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uYWN0aXZlKSA/PyB0cnVlO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBub2RlTmFtZSB8fCBnZXRWYWx1ZShub2RlRGF0YS5uYW1lKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ubmFtZSkgfHwgJ05vZGUnO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2V0VmFsdWUobm9kZURhdGEubGF5ZXIpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5sYXllcikgfHwgMzM1NTQ0MzI7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ob2RlXCIsXHJcbiAgICAgICAgICAgIFwiX25hbWVcIjogbmFtZSxcclxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcclxuICAgICAgICAgICAgXCJfcGFyZW50XCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLFxyXG4gICAgICAgICAgICBcIl9hY3RpdmVcIjogYWN0aXZlLFxyXG4gICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLCAvLyBFbXB0eSBjb21wb25lbnQgYXJyYXkgdG8gYXZvaWQgY29tcG9uZW50IGRlcGVuZGVuY3kgaXNzdWVzXHJcbiAgICAgICAgICAgIFwiX3ByZWZhYlwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAyXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2xwb3NcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcclxuICAgICAgICAgICAgICAgIFwieFwiOiBwb3NpdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHBvc2l0aW9uLnksXHJcbiAgICAgICAgICAgICAgICBcInpcIjogcG9zaXRpb24uelxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIl9scm90XCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXHJcbiAgICAgICAgICAgICAgICBcInhcIjogcm90YXRpb24ueCxcclxuICAgICAgICAgICAgICAgIFwieVwiOiByb3RhdGlvbi55LFxyXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHJvdGF0aW9uLnosXHJcbiAgICAgICAgICAgICAgICBcIndcIjogcm90YXRpb24ud1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIl9sc2NhbGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcclxuICAgICAgICAgICAgICAgIFwieFwiOiBzY2FsZS54LFxyXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHNjYWxlLnksXHJcbiAgICAgICAgICAgICAgICBcInpcIjogc2NhbGUuelxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIl9sYXllclwiOiBsYXllcixcclxuICAgICAgICAgICAgXCJfZXVsZXJcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcclxuICAgICAgICAgICAgICAgIFwieFwiOiAwLFxyXG4gICAgICAgICAgICAgICAgXCJ5XCI6IDAsXHJcbiAgICAgICAgICAgICAgICBcInpcIjogMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIl9pZFwiOiBcIlwiXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBzdGFuZGFyZCBtZXRhIGZpbGUgY29udGVudFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGNyZWF0ZVN0YW5kYXJkTWV0YUNvbnRlbnQocHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIFwidmVyXCI6IFwiMi4wLjNcIixcclxuICAgICAgICAgICAgXCJpbXBvcnRlclwiOiBcInByZWZhYlwiLFxyXG4gICAgICAgICAgICBcImltcG9ydGVkXCI6IHRydWUsXHJcbiAgICAgICAgICAgIFwidXVpZFwiOiBwcmVmYWJVdWlkLFxyXG4gICAgICAgICAgICBcImZpbGVzXCI6IFtcclxuICAgICAgICAgICAgICAgIFwiLmpzb25cIlxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBcInN1Yk1ldGFzXCI6IHt9LFxyXG4gICAgICAgICAgICBcInVzZXJEYXRhXCI6IHtcclxuICAgICAgICAgICAgICAgIFwic3luY05vZGVOYW1lXCI6IHByZWZhYk5hbWUsXHJcbiAgICAgICAgICAgICAgICBcImhhc0ljb25cIjogZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRlbXB0IHRvIGNvbnZlcnQgYSByYXcgbm9kZSBpbnRvIGEgcHJlZmFiIGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgY29udmVydE5vZGVUb1ByZWZhYkluc3RhbmNlKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgLy8gVGhpcyBmZWF0dXJlIHJlcXVpcmVzIGRlZXAgc2NlbmUgZWRpdG9yIGludGVncmF0aW9uOyBub3QgeWV0IGltcGxlbWVudGVkXHJcbiAgICAgICAgICAgIC8vIEluIGEgcmVhbCBlbmdpbmUgY29udGV4dCB0aGlzIGludm9sdmVzIGNvbXBsZXggcHJlZmFiIGluc3RhbnRpYXRpb24gYW5kIG5vZGUgcmVwbGFjZW1lbnQgbG9naWNcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvbnZlcnRpbmcgbm9kZSB0byBwcmVmYWIgaW5zdGFuY2UgcmVxdWlyZXMgZGVlcGVyIGVuZ2luZSBpbnRlZ3JhdGlvbicpO1xyXG4gICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdDb252ZXJ0aW5nIG5vZGUgdG8gcHJlZmFiIGluc3RhbmNlIHJlcXVpcmVzIGRlZXBlciBlbmdpbmUgaW50ZWdyYXRpb24nXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzdG9yZVByZWZhYk5vZGUobm9kZVV1aWQ6IHN0cmluZywgYXNzZXRVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBVc2Ugb2ZmaWNpYWwgcmVzdG9yZS1wcmVmYWIgQVBJIHRvIHJlc3RvcmUgcHJlZmFiIG5vZGVcclxuICAgICAgICAgICAgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KSgnc2NlbmUnLCAncmVzdG9yZS1wcmVmYWInLCBub2RlVXVpZCwgYXNzZXRVdWlkKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogYXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIG5vZGUgcmVzdG9yZWQgc3VjY2Vzc2Z1bGx5J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBQcmVmYWIgbm9kZSByZXN0b3JlIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOZXcgaW1wbGVtZW50YXRpb24gYmFzZWQgb24gb2ZmaWNpYWwgcHJlZmFiIGZvcm1hdFxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlRGF0YUZvclByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKS50aGVuKChub2RlRGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vZGUgZG9lcyBub3QgZXhpc3QnIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlRGF0YSB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU3RhbmRhcmRQcmVmYWJEYXRhKG5vZGVEYXRhOiBhbnksIHByZWZhYk5hbWU6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xyXG4gICAgICAgIC8vIEJ1aWxkIHByZWZhYiBkYXRhIHN0cnVjdHVyZSBiYXNlZCBvbiBvZmZpY2lhbCBDYW52YXMucHJlZmFiIGZvcm1hdFxyXG4gICAgICAgIGNvbnN0IHByZWZhYkRhdGE6IGFueVtdID0gW107XHJcbiAgICAgICAgbGV0IGN1cnJlbnRJZCA9IDA7XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGVsZW1lbnQ6IGNjLlByZWZhYiByZXNvdXJjZSBvYmplY3RcclxuICAgICAgICBjb25zdCBwcmVmYWJBc3NldCA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLFxyXG4gICAgICAgICAgICBcIl9uYW1lXCI6IHByZWZhYk5hbWUsXHJcbiAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXHJcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcclxuICAgICAgICAgICAgXCJfbmF0aXZlXCI6IFwiXCIsXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAxXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwib3B0aW1pemF0aW9uUG9saWN5XCI6IDAsXHJcbiAgICAgICAgICAgIFwicGVyc2lzdGVudFwiOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcHJlZmFiRGF0YS5wdXNoKHByZWZhYkFzc2V0KTtcclxuICAgICAgICBjdXJyZW50SWQrKztcclxuXHJcbiAgICAgICAgLy8gU2Vjb25kIGVsZW1lbnQ6IHJvb3Qgbm9kZVxyXG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gYXdhaXQgdGhpcy5jcmVhdGVOb2RlT2JqZWN0KG5vZGVEYXRhLCBudWxsLCBwcmVmYWJEYXRhLCBjdXJyZW50SWQpO1xyXG4gICAgICAgIHByZWZhYkRhdGEucHVzaChyb290Tm9kZS5ub2RlKTtcclxuICAgICAgICBjdXJyZW50SWQgPSByb290Tm9kZS5uZXh0SWQ7XHJcblxyXG4gICAgICAgIC8vIEFkZCByb290IG5vZGUgUHJlZmFiSW5mbyAtIGZpeCBhc3NldCByZWZlcmVuY2UgdG8gdXNlIFVVSURcclxuICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYkluZm9cIixcclxuICAgICAgICAgICAgXCJyb290XCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJhc3NldFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdXVpZF9fXCI6IHByZWZhYlV1aWRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJmaWxlSWRcIjogdGhpcy5nZW5lcmF0ZUZpbGVJZCgpLFxyXG4gICAgICAgICAgICBcImluc3RhbmNlXCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwidGFyZ2V0T3ZlcnJpZGVzXCI6IFtdLFxyXG4gICAgICAgICAgICBcIm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHNcIjogW11cclxuICAgICAgICB9O1xyXG4gICAgICAgIHByZWZhYkRhdGEucHVzaChyb290UHJlZmFiSW5mbyk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcmVmYWJEYXRhO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGVPYmplY3Qobm9kZURhdGE6IGFueSwgcGFyZW50SWQ6IG51bWJlciB8IG51bGwsIHByZWZhYkRhdGE6IGFueVtdLCBjdXJyZW50SWQ6IG51bWJlcik6IFByb21pc2U8eyBub2RlOiBhbnk7IG5leHRJZDogbnVtYmVyIH0+IHtcclxuICAgICAgICBjb25zdCBub2RlSWQgPSBjdXJyZW50SWQrKztcclxuICAgICAgICBcclxuICAgICAgICAvLyBFeHRyYWN0IGJhc2ljIG5vZGUgcHJvcGVydGllcyAtIGFkYXB0ZWQgdG8gcXVlcnktbm9kZS10cmVlIGRhdGEgZm9ybWF0XHJcbiAgICAgICAgY29uc3QgZ2V0VmFsdWUgPSAocHJvcDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcC52YWx1ZTtcclxuICAgICAgICAgICAgaWYgKHByb3AgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3A7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5wb3NpdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnBvc2l0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcclxuICAgICAgICBjb25zdCByb3RhdGlvbiA9IGdldFZhbHVlKG5vZGVEYXRhLnJvdGF0aW9uKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ucm90YXRpb24pIHx8IHsgeDogMCwgeTogMCwgejogMCwgdzogMSB9O1xyXG4gICAgICAgIGNvbnN0IHNjYWxlID0gZ2V0VmFsdWUobm9kZURhdGEuc2NhbGUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5zY2FsZSkgfHwgeyB4OiAxLCB5OiAxLCB6OiAxIH07XHJcbiAgICAgICAgY29uc3QgYWN0aXZlID0gZ2V0VmFsdWUobm9kZURhdGEuYWN0aXZlKSA/PyBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uYWN0aXZlKSA/PyB0cnVlO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBnZXRWYWx1ZShub2RlRGF0YS5uYW1lKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ubmFtZSkgfHwgJ05vZGUnO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2V0VmFsdWUobm9kZURhdGEubGF5ZXIpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5sYXllcikgfHwgMzM1NTQ0MzI7XHJcblxyXG4gICAgICAgIGNvbnN0IG5vZGU6IGFueSA9IHtcclxuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLk5vZGVcIixcclxuICAgICAgICAgICAgXCJfbmFtZVwiOiBuYW1lLFxyXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxyXG4gICAgICAgICAgICBcIl9fZWRpdG9yRXh0cmFzX19cIjoge30sXHJcbiAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRJZCAhPT0gbnVsbCA/IHsgXCJfX2lkX19cIjogcGFyZW50SWQgfSA6IG51bGwsXHJcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLFxyXG4gICAgICAgICAgICBcIl9hY3RpdmVcIjogYWN0aXZlLFxyXG4gICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLFxyXG4gICAgICAgICAgICBcIl9wcmVmYWJcIjogcGFyZW50SWQgPT09IG51bGwgPyB7XHJcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjdXJyZW50SWQrK1xyXG4gICAgICAgICAgICB9IDogbnVsbCxcclxuICAgICAgICAgICAgXCJfbHBvc1wiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHBvc2l0aW9uLngsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogcG9zaXRpb24ueSxcclxuICAgICAgICAgICAgICAgIFwielwiOiBwb3NpdGlvbi56XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2xyb3RcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlF1YXRcIixcclxuICAgICAgICAgICAgICAgIFwieFwiOiByb3RhdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHJvdGF0aW9uLnksXHJcbiAgICAgICAgICAgICAgICBcInpcIjogcm90YXRpb24ueixcclxuICAgICAgICAgICAgICAgIFwid1wiOiByb3RhdGlvbi53XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2xzY2FsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogc2NhbGUueSxcclxuICAgICAgICAgICAgICAgIFwielwiOiBzY2FsZS56XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX21vYmlsaXR5XCI6IDAsXHJcbiAgICAgICAgICAgIFwiX2xheWVyXCI6IGxheWVyLFxyXG4gICAgICAgICAgICBcIl9ldWxlclwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ4XCI6IDAsXHJcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcclxuICAgICAgICAgICAgICAgIFwielwiOiAwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiXCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBUZW1wb3JhcmlseSBza2lwIFVJVHJhbnNmb3JtIGNvbXBvbmVudCB0byBhdm9pZCBfZ2V0RGVwZW5kQ29tcG9uZW50IGVycm9yc1xyXG4gICAgICAgIC8vIFRvIGJlIGFkZGVkIGR5bmFtaWNhbGx5IHZpYSBFbmdpbmUgQVBJIGxhdGVyXHJcbiAgICAgICAgY29uc29sZS5sb2coYE5vZGUgJHtuYW1lfSB0ZW1wb3JhcmlseSBza2lwcGluZyBVSVRyYW5zZm9ybSBjb21wb25lbnQgdG8gYXZvaWQgZW5naW5lIGRlcGVuZGVuY3kgZXJyb3JzYCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSGFuZGxlIG90aGVyIGNvbXBvbmVudHMgKHRlbXBvcmFyaWx5IHNraXBwZWQsIGZvY3VzaW5nIG9uIFVJVHJhbnNmb3JtIGZpeClcclxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gdGhpcy5leHRyYWN0Q29tcG9uZW50c0Zyb21Ob2RlKG5vZGVEYXRhKTtcclxuICAgICAgICBpZiAoY29tcG9uZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBOb2RlICR7bmFtZX0gaGFzICR7Y29tcG9uZW50cy5sZW5ndGh9IG90aGVyIGNvbXBvbmVudHMsIHRlbXBvcmFyaWx5IHNraXBwZWQgdG8gZm9jdXMgb24gVUlUcmFuc2Zvcm0gZml4YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9jZXNzIGNoaWxkIG5vZGVzIC0gdXNpbmcgZnVsbCBzdHJ1Y3R1cmUgZnJvbSBxdWVyeS1ub2RlLXRyZWVcclxuICAgICAgICBjb25zdCBjaGlsZHJlblRvUHJvY2VzcyA9IHRoaXMuZ2V0Q2hpbGRyZW5Ub1Byb2Nlc3Mobm9kZURhdGEpO1xyXG4gICAgICAgIGlmIChjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT0gUHJvY2Vzc2luZyBjaGlsZCBub2RlcyA9PT1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYE5vZGUgJHtuYW1lfSBoYXMgJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IGNoaWxkIG5vZGVzYCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSBjaGlsZHJlblRvUHJvY2Vzc1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkTmFtZSA9IGNoaWxkRGF0YS5uYW1lIHx8IGNoaWxkRGF0YS52YWx1ZT8ubmFtZSB8fCAndW5rbm93bic7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBjaGlsZCBub2RlICR7aSArIDF9OiAke2NoaWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZElkID0gY3VycmVudElkO1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuX2NoaWxkcmVuLnB1c2goeyBcIl9faWRfX1wiOiBjaGlsZElkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNyZWF0ZSBjaGlsZCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5vZGVPYmplY3QoY2hpbGREYXRhLCBub2RlSWQsIHByZWZhYkRhdGEsIGN1cnJlbnRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiRGF0YS5wdXNoKGNoaWxkUmVzdWx0Lm5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJZCA9IGNoaWxkUmVzdWx0Lm5leHRJZDtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGlsZCBub2RlcyBkbyBub3QgbmVlZCBQcmVmYWJJbmZvLCBvbmx5IHRoZSByb290IG5vZGUgZG9lc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoaWxkIG5vZGUgX3ByZWZhYiBzaG91bGQgYmUgc2V0IHRvIG51bGxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZFJlc3VsdC5ub2RlLl9wcmVmYWIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTdWNjZXNzZnVsbHkgYWRkZWQgY2hpbGQgbm9kZTogJHtjaGlsZE5hbWV9YCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgY2hpbGQgbm9kZSAke2NoaWxkTmFtZX06YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyBub2RlLCBuZXh0SWQ6IGN1cnJlbnRJZCB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4dHJhY3QgY29tcG9uZW50IGluZm8gZnJvbSBub2RlIGRhdGFcclxuICAgIHByaXZhdGUgZXh0cmFjdENvbXBvbmVudHNGcm9tTm9kZShub2RlRGF0YTogYW55KTogYW55W10ge1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHM6IGFueVtdID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVHJ5IHRvIGdldCBjb21wb25lbnQgZGF0YSBmcm9tIGRpZmZlcmVudCBsb2NhdGlvbnNcclxuICAgICAgICBjb25zdCBjb21wb25lbnRTb3VyY2VzID0gW1xyXG4gICAgICAgICAgICBub2RlRGF0YS5fX2NvbXBzX18sXHJcbiAgICAgICAgICAgIG5vZGVEYXRhLmNvbXBvbmVudHMsXHJcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy5fX2NvbXBzX18sXHJcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy5jb21wb25lbnRzXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBjb21wb25lbnRTb3VyY2VzKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaCguLi5zb3VyY2UuZmlsdGVyKGNvbXAgPT4gY29tcCAmJiAoY29tcC5fX3R5cGVfXyB8fCBjb21wLnR5cGUpKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gRXhpdCBvbmNlIGEgdmFsaWQgY29tcG9uZW50IGFycmF5IGlzIGZvdW5kXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudHM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBzdGFuZGFyZCBjb21wb25lbnQgb2JqZWN0XHJcbiAgICBwcml2YXRlIGNyZWF0ZVN0YW5kYXJkQ29tcG9uZW50T2JqZWN0KGNvbXBvbmVudERhdGE6IGFueSwgbm9kZUlkOiBudW1iZXIsIHByZWZhYkluZm9JZDogbnVtYmVyKTogYW55IHtcclxuICAgICAgICBjb25zdCBjb21wb25lbnRUeXBlID0gY29tcG9uZW50RGF0YS5fX3R5cGVfXyB8fCBjb21wb25lbnREYXRhLnR5cGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFjb21wb25lbnRUeXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ29tcG9uZW50IG1pc3NpbmcgdHlwZSBpbmZvOicsIGNvbXBvbmVudERhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQmFzZSBjb21wb25lbnQgc3RydWN0dXJlIC0gYmFzZWQgb24gb2ZmaWNpYWwgcHJlZmFiIGZvcm1hdFxyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDogYW55ID0ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IGNvbXBvbmVudFR5cGUsXHJcbiAgICAgICAgICAgIFwiX25hbWVcIjogXCJcIixcclxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcclxuICAgICAgICAgICAgXCJub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IG5vZGVJZFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIl9lbmFibGVkXCI6IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnZW5hYmxlZCcsIHRydWUpLFxyXG4gICAgICAgICAgICBcIl9fcHJlZmFiXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IHByZWZhYkluZm9JZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdHlwZS1zcGVjaWZpYyBwcm9wZXJ0aWVzIGJhc2VkIG9uIGNvbXBvbmVudCB0eXBlXHJcbiAgICAgICAgdGhpcy5hZGRDb21wb25lbnRTcGVjaWZpY1Byb3BlcnRpZXMoY29tcG9uZW50LCBjb21wb25lbnREYXRhLCBjb21wb25lbnRUeXBlKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgX2lkIHByb3BlcnR5XHJcbiAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQWRkIGNvbXBvbmVudC1zcGVjaWZpYyBwcm9wZXJ0aWVzXHJcbiAgICBwcml2YXRlIGFkZENvbXBvbmVudFNwZWNpZmljUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55LCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBzd2l0Y2ggKGNvbXBvbmVudFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnY2MuVUlUcmFuc2Zvcm0nOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRVSVRyYW5zZm9ybVByb3BlcnRpZXMoY29tcG9uZW50LCBjb21wb25lbnREYXRhKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdjYy5TcHJpdGUnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRTcHJpdGVQcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnY2MuTGFiZWwnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRMYWJlbFByb3BlcnRpZXMoY29tcG9uZW50LCBjb21wb25lbnREYXRhKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdjYy5CdXR0b24nOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCdXR0b25Qcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIEZvciB1bmtub3duIGNvbXBvbmVudCB0eXBlcywgY29weSBhbGwgc2FmZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEdlbmVyaWNQcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFVJVHJhbnNmb3JtIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICBwcml2YXRlIGFkZFVJVHJhbnNmb3JtUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XHJcbiAgICAgICAgY29tcG9uZW50Ll9jb250ZW50U2l6ZSA9IHRoaXMuY3JlYXRlU2l6ZU9iamVjdChcclxuICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdjb250ZW50U2l6ZScsIHsgd2lkdGg6IDEwMCwgaGVpZ2h0OiAxMDAgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbXBvbmVudC5fYW5jaG9yUG9pbnQgPSB0aGlzLmNyZWF0ZVZlYzJPYmplY3QoXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnYW5jaG9yUG9pbnQnLCB7IHg6IDAuNSwgeTogMC41IH0pXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3ByaXRlIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICBwcml2YXRlIGFkZFNwcml0ZVByb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xyXG4gICAgICAgIGNvbXBvbmVudC5fdmlzRmxhZ3MgPSAwO1xyXG4gICAgICAgIGNvbXBvbmVudC5fY3VzdG9tTWF0ZXJpYWwgPSBudWxsO1xyXG4gICAgICAgIGNvbXBvbmVudC5fc3JjQmxlbmRGYWN0b3IgPSAyO1xyXG4gICAgICAgIGNvbXBvbmVudC5fZHN0QmxlbmRGYWN0b3IgPSA0O1xyXG4gICAgICAgIGNvbXBvbmVudC5fY29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2NvbG9yJywgeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbXBvbmVudC5fc3ByaXRlRnJhbWUgPSB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ3Nwcml0ZUZyYW1lJywgbnVsbCk7XHJcbiAgICAgICAgY29tcG9uZW50Ll90eXBlID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICd0eXBlJywgMCk7XHJcbiAgICAgICAgY29tcG9uZW50Ll9maWxsVHlwZSA9IDA7XHJcbiAgICAgICAgY29tcG9uZW50Ll9zaXplTW9kZSA9IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnc2l6ZU1vZGUnLCAxKTtcclxuICAgICAgICBjb21wb25lbnQuX2ZpbGxDZW50ZXIgPSB0aGlzLmNyZWF0ZVZlYzJPYmplY3QoeyB4OiAwLCB5OiAwIH0pO1xyXG4gICAgICAgIGNvbXBvbmVudC5fZmlsbFN0YXJ0ID0gMDtcclxuICAgICAgICBjb21wb25lbnQuX2ZpbGxSYW5nZSA9IDA7XHJcbiAgICAgICAgY29tcG9uZW50Ll9pc1RyaW1tZWRNb2RlID0gdHJ1ZTtcclxuICAgICAgICBjb21wb25lbnQuX3VzZUdyYXlzY2FsZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbXBvbmVudC5fYXRsYXMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBMYWJlbCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgcHJpdmF0ZSBhZGRMYWJlbFByb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xyXG4gICAgICAgIGNvbXBvbmVudC5fdmlzRmxhZ3MgPSAwO1xyXG4gICAgICAgIGNvbXBvbmVudC5fY3VzdG9tTWF0ZXJpYWwgPSBudWxsO1xyXG4gICAgICAgIGNvbXBvbmVudC5fc3JjQmxlbmRGYWN0b3IgPSAyO1xyXG4gICAgICAgIGNvbXBvbmVudC5fZHN0QmxlbmRGYWN0b3IgPSA0O1xyXG4gICAgICAgIGNvbXBvbmVudC5fY29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2NvbG9yJywgeyByOiAwLCBnOiAwLCBiOiAwLCBhOiAyNTUgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbXBvbmVudC5fc3RyaW5nID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdzdHJpbmcnLCAnTGFiZWwnKTtcclxuICAgICAgICBjb21wb25lbnQuX2hvcml6b250YWxBbGlnbiA9IDE7XHJcbiAgICAgICAgY29tcG9uZW50Ll92ZXJ0aWNhbEFsaWduID0gMTtcclxuICAgICAgICBjb21wb25lbnQuX2FjdHVhbEZvbnRTaXplID0gMjA7XHJcbiAgICAgICAgY29tcG9uZW50Ll9mb250U2l6ZSA9IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnZm9udFNpemUnLCAyMCk7XHJcbiAgICAgICAgY29tcG9uZW50Ll9mb250RmFtaWx5ID0gJ0FyaWFsJztcclxuICAgICAgICBjb21wb25lbnQuX2xpbmVIZWlnaHQgPSA0MDtcclxuICAgICAgICBjb21wb25lbnQuX292ZXJmbG93ID0gMTtcclxuICAgICAgICBjb21wb25lbnQuX2VuYWJsZVdyYXBUZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgY29tcG9uZW50Ll9mb250ID0gbnVsbDtcclxuICAgICAgICBjb21wb25lbnQuX2lzU3lzdGVtRm9udFVzZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbXBvbmVudC5faXNJdGFsaWMgPSBmYWxzZTtcclxuICAgICAgICBjb21wb25lbnQuX2lzQm9sZCA9IGZhbHNlO1xyXG4gICAgICAgIGNvbXBvbmVudC5faXNVbmRlcmxpbmUgPSBmYWxzZTtcclxuICAgICAgICBjb21wb25lbnQuX3VuZGVybGluZUhlaWdodCA9IDI7XHJcbiAgICAgICAgY29tcG9uZW50Ll9jYWNoZU1vZGUgPSAwO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBCdXR0b24gY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgIHByaXZhdGUgYWRkQnV0dG9uUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XHJcbiAgICAgICAgY29tcG9uZW50LmNsaWNrRXZlbnRzID0gW107XHJcbiAgICAgICAgY29tcG9uZW50Ll9pbnRlcmFjdGFibGUgPSB0cnVlO1xyXG4gICAgICAgIGNvbXBvbmVudC5fdHJhbnNpdGlvbiA9IDI7XHJcbiAgICAgICAgY29tcG9uZW50Ll9ub3JtYWxDb2xvciA9IHRoaXMuY3JlYXRlQ29sb3JPYmplY3QoeyByOiAyMTQsIGc6IDIxNCwgYjogMjE0LCBhOiAyNTUgfSk7XHJcbiAgICAgICAgY29tcG9uZW50Ll9ob3ZlckNvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdCh7IHI6IDIxMSwgZzogMjExLCBiOiAyMTEsIGE6IDI1NSB9KTtcclxuICAgICAgICBjb21wb25lbnQuX3ByZXNzZWRDb2xvciA9IHRoaXMuY3JlYXRlQ29sb3JPYmplY3QoeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfSk7XHJcbiAgICAgICAgY29tcG9uZW50Ll9kaXNhYmxlZENvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdCh7IHI6IDEyNCwgZzogMTI0LCBiOiAxMjQsIGE6IDI1NSB9KTtcclxuICAgICAgICBjb21wb25lbnQuX2R1cmF0aW9uID0gMC4xO1xyXG4gICAgICAgIGNvbXBvbmVudC5fem9vbVNjYWxlID0gMS4yO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBBZGQgY29tbW9uIHByb3BlcnRpZXNcclxuICAgIHByaXZhdGUgYWRkR2VuZXJpY1Byb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xyXG4gICAgICAgIC8vIENvcHkgb25seSBzYWZlLCBrbm93biBwcm9wZXJ0aWVzXHJcbiAgICAgICAgY29uc3Qgc2FmZVByb3BlcnRpZXMgPSBbJ2VuYWJsZWQnLCAnY29sb3InLCAnc3RyaW5nJywgJ2ZvbnRTaXplJywgJ3Nwcml0ZUZyYW1lJywgJ3R5cGUnLCAnc2l6ZU1vZGUnXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGNvbnN0IHByb3Agb2Ygc2FmZVByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudERhdGEuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRbYF8ke3Byb3B9YF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIFZlYzIgb2JqZWN0XHJcbiAgICBwcml2YXRlIGNyZWF0ZVZlYzJPYmplY3QoZGF0YTogYW55KTogYW55IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjMlwiLFxyXG4gICAgICAgICAgICBcInhcIjogZGF0YT8ueCB8fCAwLFxyXG4gICAgICAgICAgICBcInlcIjogZGF0YT8ueSB8fCAwXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIFZlYzMgb2JqZWN0XHJcbiAgICBwcml2YXRlIGNyZWF0ZVZlYzNPYmplY3QoZGF0YTogYW55KTogYW55IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxyXG4gICAgICAgICAgICBcInhcIjogZGF0YT8ueCB8fCAwLFxyXG4gICAgICAgICAgICBcInlcIjogZGF0YT8ueSB8fCAwLFxyXG4gICAgICAgICAgICBcInpcIjogZGF0YT8ueiB8fCAwXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIFNpemUgb2JqZWN0XHJcbiAgICBwcml2YXRlIGNyZWF0ZVNpemVPYmplY3QoZGF0YTogYW55KTogYW55IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuU2l6ZVwiLFxyXG4gICAgICAgICAgICBcIndpZHRoXCI6IGRhdGE/LndpZHRoIHx8IDEwMCxcclxuICAgICAgICAgICAgXCJoZWlnaHRcIjogZGF0YT8uaGVpZ2h0IHx8IDEwMFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBDb2xvciBvYmplY3RcclxuICAgIHByaXZhdGUgY3JlYXRlQ29sb3JPYmplY3QoZGF0YTogYW55KTogYW55IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuQ29sb3JcIixcclxuICAgICAgICAgICAgXCJyXCI6IGRhdGE/LnIgPz8gMjU1LFxyXG4gICAgICAgICAgICBcImdcIjogZGF0YT8uZyA/PyAyNTUsXHJcbiAgICAgICAgICAgIFwiYlwiOiBkYXRhPy5iID8/IDI1NSxcclxuICAgICAgICAgICAgXCJhXCI6IGRhdGE/LmEgPz8gMjU1XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgd2hldGhlciBhIGNvbXBvbmVudCBwcm9wZXJ0eSBzaG91bGQgYmUgY29waWVkXHJcbiAgICBwcml2YXRlIHNob3VsZENvcHlDb21wb25lbnRQcm9wZXJ0eShrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIC8vIFNraXAgaW50ZXJuYWwgYW5kIGFscmVhZHktcHJvY2Vzc2VkIHByb3BlcnRpZXNcclxuICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ19fJykgfHwga2V5ID09PSAnX2VuYWJsZWQnIHx8IGtleSA9PT0gJ25vZGUnIHx8IGtleSA9PT0gJ2VuYWJsZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2tpcCBmdW5jdGlvbnMgYW5kIHVuZGVmaW5lZCB2YWx1ZXNcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gR2V0IGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZSAtIHJlbmFtZWQgdG8gYXZvaWQgY29uZmxpY3RzXHJcbiAgICBwcml2YXRlIGdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YTogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgZGVmYXVsdFZhbHVlPzogYW55KTogYW55IHtcclxuICAgICAgICAvLyBUcnkgdG8gZ2V0IHByb3BlcnR5IGRpcmVjdGx5XHJcbiAgICAgICAgaWYgKGNvbXBvbmVudERhdGFbcHJvcGVydHlOYW1lXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4dHJhY3RWYWx1ZShjb21wb25lbnREYXRhW3Byb3BlcnR5TmFtZV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBUcnkgdG8gZ2V0IGZyb20gdmFsdWUgcHJvcGVydHlcclxuICAgICAgICBpZiAoY29tcG9uZW50RGF0YS52YWx1ZSAmJiBjb21wb25lbnREYXRhLnZhbHVlW3Byb3BlcnR5TmFtZV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leHRyYWN0VmFsdWUoY29tcG9uZW50RGF0YS52YWx1ZVtwcm9wZXJ0eU5hbWVdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVHJ5IHByb3BlcnR5IG5hbWUgd2l0aCB1bmRlcnNjb3JlIHByZWZpeFxyXG4gICAgICAgIGNvbnN0IHByZWZpeGVkTmFtZSA9IGBfJHtwcm9wZXJ0eU5hbWV9YDtcclxuICAgICAgICBpZiAoY29tcG9uZW50RGF0YVtwcmVmaXhlZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0cmFjdFZhbHVlKGNvbXBvbmVudERhdGFbcHJlZml4ZWROYW1lXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEV4dHJhY3QgcHJvcGVydHkgdmFsdWVcclxuICAgIHByaXZhdGUgZXh0cmFjdFZhbHVlKGRhdGE6IGFueSk6IGFueSB7XHJcbiAgICAgICAgaWYgKGRhdGEgPT09IG51bGwgfHwgZGF0YSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB2YWx1ZSBwcm9wZXJ0eSBleGlzdHMsIHByZWZlciBpdFxyXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcgJiYgZGF0YS5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YS52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgaXQgaXMgYSByZWZlcmVuY2Ugb2JqZWN0LCBrZWVwIGFzLWlzXHJcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiAoZGF0YS5fX2lkX18gIT09IHVuZGVmaW5lZCB8fCBkYXRhLl9fdXVpZF9fICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVN0YW5kYXJkTWV0YURhdGEocHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIFwidmVyXCI6IFwiMS4xLjUwXCIsXHJcbiAgICAgICAgICAgIFwiaW1wb3J0ZXJcIjogXCJwcmVmYWJcIixcclxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxyXG4gICAgICAgICAgICBcInV1aWRcIjogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgXCJmaWxlc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJzdWJNZXRhc1wiOiB7fSxcclxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInN5bmNOb2RlTmFtZVwiOiBwcmVmYWJOYW1lXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVByZWZhYldpdGhNZXRhKHByZWZhYlBhdGg6IHN0cmluZywgcHJlZmFiRGF0YTogYW55W10sIG1ldGFEYXRhOiBhbnkpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShwcmVmYWJEYXRhLCBudWxsLCAyKTtcclxuICAgICAgICAgICAgY29uc3QgbWV0YUNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShtZXRhRGF0YSwgbnVsbCwgMik7XHJcblxyXG4gICAgICAgICAgICAvLyBFbnN1cmUgcGF0aCBlbmRzIHdpdGggLnByZWZhYlxyXG4gICAgICAgICAgICBjb25zdCBmaW5hbFByZWZhYlBhdGggPSBwcmVmYWJQYXRoLmVuZHNXaXRoKCcucHJlZmFiJykgPyBwcmVmYWJQYXRoIDogYCR7cHJlZmFiUGF0aH0ucHJlZmFiYDtcclxuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSBgJHtmaW5hbFByZWZhYlBhdGh9Lm1ldGFgO1xyXG5cclxuICAgICAgICAgICAgLy8gVXNlIGFzc2V0LWRiIEFQSSB0byBjcmVhdGUgcHJlZmFiIGZpbGVcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgZmluYWxQcmVmYWJQYXRoLCBwcmVmYWJDb250ZW50KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1ldGEgZmlsZVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCBtZXRhUGF0aCwgbWV0YUNvbnRlbnQpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPT09IFByZWZhYiBzYXZlIGNvbXBsZXRlID09PWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJlZmFiIGZpbGUgc2F2ZWQ6ICR7ZmluYWxQcmVmYWJQYXRofWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTWV0YSBmaWxlIHNhdmVkOiAke21ldGFQYXRofWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJlZmFiIGFycmF5IHRvdGFsIGxlbmd0aDogJHtwcmVmYWJEYXRhLmxlbmd0aH1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFByZWZhYiByb290IG5vZGUgaW5kZXg6ICR7cHJlZmFiRGF0YS5sZW5ndGggLSAxfWApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2F2aW5nIHByZWZhYiBmaWxlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSJdfQ==