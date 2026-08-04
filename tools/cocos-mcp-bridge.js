/**
 * Stdio ↔ HTTP bridge for Cocos Creator MCP (extensions/cocos-mcp-server).
 * Use when Cursor's url transport cannot talk to the editor's simple POST /mcp.
 *
 * Cursor mcp.json:
 * {
 *   "mcpServers": {
 *     "cocos-creator": {
 *       "command": "node",
 *       "args": ["D:/cca/slider_cocos/tools/cocos-mcp-bridge.js"],
 *       "env": { "COCOS_MCP_PORT": "3100" }
 *     }
 *   }
 * }
 */
'use strict';

const http = require('http');

const PORT = Number(process.env.COCOS_MCP_PORT || 3100);
const HOST = process.env.COCOS_MCP_HOST || '127.0.0.1';

let buffer = Buffer.alloc(0);

function postJson(message) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(message);
        const req = http.request(
            {
                hostname: HOST,
                port: PORT,
                path: '/mcp',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
                timeout: 120000,
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8');
                    try {
                        resolve(JSON.parse(body));
                    } catch (err) {
                        reject(new Error(`Invalid JSON from Cocos MCP: ${body.slice(0, 200)}`));
                    }
                });
            },
        );
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Cocos MCP timeout (${HOST}:${PORT}) — is Creator running with MCP started?`));
        });
        req.write(data);
        req.end();
    });
}

function writeMessage(message) {
    const json = JSON.stringify(message);
    const payload = Buffer.from(json, 'utf8');
    process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
    process.stdout.write(payload);
}

function tryParse() {
    while (true) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;

        const headerText = buffer.slice(0, headerEnd).toString('utf8');
        const match = /Content-Length:\s*(\d+)/i.exec(headerText);
        if (!match) {
            buffer = buffer.slice(headerEnd + 4);
            continue;
        }

        const length = Number(match[1]);
        const total = headerEnd + 4 + length;
        if (buffer.length < total) return;

        const body = buffer.slice(headerEnd + 4, total).toString('utf8');
        buffer = buffer.slice(total);

        let message;
        try {
            message = JSON.parse(body);
        } catch {
            continue;
        }

        // Notifications have no id — still forward, ignore empty responses.
        postJson(message)
            .then((response) => {
                if (message.id !== undefined && message.id !== null) {
                    writeMessage(response);
                }
            })
            .catch((err) => {
                if (message.id !== undefined && message.id !== null) {
                    writeMessage({
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32000,
                            message: err.message || String(err),
                        },
                    });
                } else {
                    process.stderr.write(`[cocos-mcp-bridge] ${err.message}\n`);
                }
            });
    }
}

process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    tryParse();
});

process.stderr.write(`[cocos-mcp-bridge] proxying stdio → http://${HOST}:${PORT}/mcp\n`);
