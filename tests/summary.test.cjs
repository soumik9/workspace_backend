const assert = require('node:assert/strict');
const test = require('node:test');
const { EventEmitter } = require('node:events');
require('ts-node/register/transpile-only');
const https = require('node:https');
const { config } = require('../config/server/config.server');
require('../app/routes/main.route');
const { WorkspaceService } = require('../app/modules/workspace/workspace.service');
const WorkspaceSummaryInstance = new WorkspaceService({});

test('summary service validates input and handles provider responses without real API calls', async () => {
    const original = https.request;
    const key = config.AI.KEY;
    let status = 200;
    let responseBody = { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '- Ship Friday.' }] }] };
    let calls = 0;
    https.request = (url, options, callback) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        const request = new EventEmitter();
        request.end = payload => {
            calls++;
            const body = JSON.parse(payload);
            assert.equal(body.store, false);
            assert.equal(body.input[0].content[0].text, 'Ship Friday.');
            queueMicrotask(() => {
                const response = new EventEmitter();
                response.statusCode = status;
                response.setEncoding = () => {};
                callback(response);
                response.emit('data', JSON.stringify(responseBody));
                response.emit('end');
                request.emit('close');
            });
        };
        return request;
    };
    try {
        config.AI.KEY = '';
        await assert.rejects(WorkspaceSummaryInstance.summarize('Ship Friday.'), error => error.statusCode === 503);
        config.AI.KEY = 'mock-only';
        await assert.rejects(WorkspaceSummaryInstance.summarize('  '), error => error.statusCode === 400);
        await assert.rejects(WorkspaceSummaryInstance.summarize('x'.repeat(30001)), error => error.statusCode === 400);
        assert.equal(calls, 0);
        assert.equal(await WorkspaceSummaryInstance.summarize('Ship Friday.'), '- Ship Friday.');
        status = 429;
        await assert.rejects(WorkspaceSummaryInstance.summarize('Ship Friday.'), error => error.statusCode === 429);
        status = 500;
        await assert.rejects(WorkspaceSummaryInstance.summarize('Ship Friday.'), error => error.statusCode === 502);
        status = 200;
        responseBody = { status: 'incomplete', output: [] };
        await assert.rejects(WorkspaceSummaryInstance.summarize('Ship Friday.'), error => error.statusCode === 502);
    } finally {
        https.request = original;
        config.AI.KEY = key;
    }
});

test('summary controller checks authenticated ownership and file type before AI', async () => {
    const { WorkspaceController } = require('../app/modules/workspace/workspace.controller');
    const summarize = WorkspaceSummaryInstance.summarize;
    let calls = 0;
    let workspace = { _id: 'file1', type: 'file', content: 'Ship Friday.' };
    const service = {
        summarize: (...args) => WorkspaceSummaryInstance.summarize(...args),
        findOrThrow: async ({ query }) => {
            assert.equal(query.user, 'owner1');
            assert.equal(query._id, 'file1');
            if (!workspace) throw Object.assign(new Error('Not found'), { statusCode: 404 });
            return workspace;
        },
    };
    WorkspaceSummaryInstance.summarize = async () => { calls++; return '- Ship Friday.'; };
    const controller = new WorkspaceController(service);
    const run = entity => new Promise(resolve => {
        const res = { status() { return this; }, json(data) { resolve(data); } };
        controller.summarize({ entity, query: { workspace_id: 'file1' } }, res, resolve);
    });
    try {
        assert.equal((await run({ _id: 'owner1' })).data.summary, '- Ship Friday.');
        workspace = { ...workspace, type: 'folder' };
        assert.equal((await run({ _id: 'owner1' })).statusCode, 400);
        workspace = null;
        assert.equal((await run({ _id: 'owner1' })).statusCode, 404);
        assert.equal(calls, 1);
    } finally {
        WorkspaceSummaryInstance.summarize = summarize;
    }
});
