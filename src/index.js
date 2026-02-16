#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var axios_1 = require("axios");
var better_sqlite3_1 = require("better-sqlite3");
var fs_1 = require("fs");
var path_1 = require("path");
var os_1 = require("os");
var PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY environment variable is required");
}
var PerplexityServer = /** @class */ (function () {
    function PerplexityServer() {
        var _this = this;
        this.server = new index_js_1.Server({
            name: "perplexity-server",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.axiosInstance = axios_1.default.create({
            baseURL: "https://api.perplexity.ai",
            headers: {
                "Authorization": "Bearer ".concat(PERPLEXITY_API_KEY),
                "Content-Type": "application/json",
            },
        });
        // Initialize SQLite database
        var dbPath = (0, path_1.join)((0, os_1.homedir)(), ".perplexity-mcp", "chat_history.db");
        // Ensure the directory exists
        var dbDir = (0, path_1.dirname)(dbPath);
        if (!(0, fs_1.existsSync)(dbDir)) {
            (0, fs_1.mkdirSync)(dbDir);
        }
        this.db = new better_sqlite3_1.default(dbPath, { fileMustExist: false });
        this.initializeDatabase();
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = function (error) { return console.error("[MCP Error]", error); };
        process.on("SIGINT", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.db.close();
                        return [4 /*yield*/, this.server.close()];
                    case 1:
                        _a.sent();
                        process.exit(0);
                        return [2 /*return*/];
                }
            });
        }); });
    }
    PerplexityServer.prototype.initializeDatabase = function () {
        // Create chats table
        this.db.exec("\n      CREATE TABLE IF NOT EXISTS chats (\n        id TEXT PRIMARY KEY,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n      )\n    ");
        // Create messages table
        this.db.exec("\n      CREATE TABLE IF NOT EXISTS messages (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        chat_id TEXT NOT NULL,\n        role TEXT NOT NULL,\n        content TEXT NOT NULL,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (chat_id) REFERENCES chats(id)\n      )\n    ");
    };
    PerplexityServer.prototype.getChatHistory = function (chatId) {
        var messages = this.db.prepare("SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC").all(chatId);
        return messages;
    };
    PerplexityServer.prototype.saveChatMessage = function (chatId, message) {
        // Ensure chat exists
        this.db.prepare("INSERT OR IGNORE INTO chats (id) VALUES (?)").run(chatId);
        // Save message
        this.db.prepare("INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)").run(chatId, message.role, message.content);
    };
    PerplexityServer.prototype.setupToolHandlers = function () {
        var _this = this;
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
                        tools: [
                            {
                                name: "chat_perplexity",
                                description: "Maintains ongoing conversations with Perplexity AI. Creates new chats or continues existing ones with full history context.",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            description: "The message to send to Perplexity AI"
                                        },
                                        chat_id: {
                                            type: "string",
                                            description: "Optional: ID of an existing chat to continue. If not provided, a new chat will be created."
                                        }
                                    },
                                    required: ["message"]
                                }
                            },
                            {
                                name: "search",
                                description: "Perform a general search query to get comprehensive information on any topic",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        query: {
                                            type: "string",
                                            description: "The search query or question"
                                        },
                                        detail_level: {
                                            type: "string",
                                            description: "Optional: Desired level of detail (brief, normal, detailed)",
                                            enum: ["brief", "normal", "detailed"]
                                        }
                                    },
                                    required: ["query"]
                                }
                            },
                            {
                                name: "get_documentation",
                                description: "Get documentation and usage examples for a specific technology, library, or API",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        query: {
                                            type: "string",
                                            description: "The technology, library, or API to get documentation for"
                                        },
                                        context: {
                                            type: "string",
                                            description: "Additional context or specific aspects to focus on"
                                        }
                                    },
                                    required: ["query"]
                                }
                            },
                            {
                                name: "find_apis",
                                description: "Find and evaluate APIs that could be integrated into a project",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        requirement: {
                                            type: "string",
                                            description: "The functionality or requirement you're looking to fulfill"
                                        },
                                        context: {
                                            type: "string",
                                            description: "Additional context about the project or specific needs"
                                        }
                                    },
                                    required: ["requirement"]
                                }
                            },
                            {
                                name: "check_deprecated_code",
                                description: "Check if code or dependencies might be using deprecated features",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        code: {
                                            type: "string",
                                            description: "The code snippet or dependency to check"
                                        },
                                        technology: {
                                            type: "string",
                                            description: "The technology or framework context (e.g., 'React', 'Node.js')"
                                        }
                                    },
                                    required: ["code"]
                                }
                            }
                        ]
                    })];
            });
        }); });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, message, _c, chat_id, history_1, userMessage, messages, response, assistantMessage, _d, query, _e, context, prompt_1, response, _f, requirement, _g, context, prompt_2, response, _h, code, _j, technology, prompt_3, response, _k, query, _l, detail_level, prompt_4, response, error_1;
            var _m, _o, _p;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0:
                        _q.trys.push([0, 13, , 14]);
                        _a = request.params.name;
                        switch (_a) {
                            case "chat_perplexity": return [3 /*break*/, 1];
                            case "get_documentation": return [3 /*break*/, 3];
                            case "find_apis": return [3 /*break*/, 5];
                            case "check_deprecated_code": return [3 /*break*/, 7];
                            case "search": return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1:
                        _b = request.params.arguments, message = _b.message, _c = _b.chat_id, chat_id = _c === void 0 ? crypto.randomUUID() : _c;
                        history_1 = this.getChatHistory(chat_id);
                        userMessage = { role: "user", content: message };
                        this.saveChatMessage(chat_id, userMessage);
                        messages = __spreadArray(__spreadArray([], history_1, true), [userMessage], false);
                        return [4 /*yield*/, this.axiosInstance.post("/chat/completions", {
                                model: "sonar-reasoning-pro",
                                messages: messages,
                            })];
                    case 2:
                        response = _q.sent();
                        assistantMessage = {
                            role: "assistant",
                            content: response.data.choices[0].message.content,
                        };
                        this.saveChatMessage(chat_id, assistantMessage);
                        return [2 /*return*/, {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify({
                                            chat_id: chat_id,
                                            response: assistantMessage.content
                                        }, null, 2)
                                    }]
                            }];
                    case 3:
                        _d = request.params.arguments, query = _d.query, _e = _d.context, context = _e === void 0 ? "" : _e;
                        prompt_1 = "Provide comprehensive documentation and usage examples for ".concat(query, ". ").concat(context ? "Focus on: ".concat(context) : "", " Include:\n            1. Basic overview and purpose\n            2. Key features and capabilities\n            3. Installation/setup if applicable\n            4. Common usage examples\n            5. Best practices\n            6. Common pitfalls to avoid\n            7. Links to official documentation if available");
                        return [4 /*yield*/, this.axiosInstance.post("/chat/completions", {
                                model: "sonar-reasoning-pro",
                                messages: [{ role: "user", content: prompt_1 }],
                            })];
                    case 4:
                        response = _q.sent();
                        return [2 /*return*/, {
                                content: [{
                                        type: "text",
                                        text: response.data.choices[0].message.content
                                    }]
                            }];
                    case 5:
                        _f = request.params.arguments, requirement = _f.requirement, _g = _f.context, context = _g === void 0 ? "" : _g;
                        prompt_2 = "Find and evaluate APIs that could be used for: ".concat(requirement, ". ").concat(context ? "Context: ".concat(context) : "", " For each API, provide:\n            1. Name and brief description\n            2. Key features and capabilities\n            3. Pricing model (if available)\n            4. Integration complexity\n            5. Documentation quality\n            6. Community support and popularity\n            7. Any potential limitations or concerns\n            8. Code example of basic usage");
                        return [4 /*yield*/, this.axiosInstance.post("/chat/completions", {
                                model: "sonar-reasoning-pro",
                                messages: [{ role: "user", content: prompt_2 }],
                            })];
                    case 6:
                        response = _q.sent();
                        return [2 /*return*/, {
                                content: [{
                                        type: "text",
                                        text: response.data.choices[0].message.content
                                    }]
                            }];
                    case 7:
                        _h = request.params.arguments, code = _h.code, _j = _h.technology, technology = _j === void 0 ? "" : _j;
                        prompt_3 = "Analyze this code for deprecated features or patterns".concat(technology ? " in ".concat(technology) : "", ":\n\n            ").concat(code, "\n\n            Please provide:\n            1. Identification of any deprecated features, methods, or patterns\n            2. Current recommended alternatives\n            3. Migration steps if applicable\n            4. Impact of the deprecation\n            5. Timeline of deprecation if known\n            6. Code examples showing how to update to current best practices");
                        return [4 /*yield*/, this.axiosInstance.post("/chat/completions", {
                                model: "sonar-reasoning-pro",
                                messages: [{ role: "user", content: prompt_3 }],
                            })];
                    case 8:
                        response = _q.sent();
                        return [2 /*return*/, {
                                content: [{
                                        type: "text",
                                        text: response.data.choices[0].message.content
                                    }]
                            }];
                    case 9:
                        _k = request.params.arguments, query = _k.query, _l = _k.detail_level, detail_level = _l === void 0 ? "normal" : _l;
                        prompt_4 = query;
                        switch (detail_level) {
                            case "brief":
                                prompt_4 = "Provide a brief, concise answer to: ".concat(query);
                                break;
                            case "detailed":
                                prompt_4 = "Provide a comprehensive, detailed analysis of: ".concat(query, ". Include relevant examples, context, and supporting information where applicable.");
                                break;
                            default:
                                prompt_4 = "Provide a clear, balanced answer to: ".concat(query, ". Include key points and relevant context.");
                        }
                        return [4 /*yield*/, this.axiosInstance.post("/chat/completions", {
                                model: "sonar-reasoning-pro",
                                messages: [{ role: "user", content: prompt_4 }],
                            })];
                    case 10:
                        response = _q.sent();
                        return [2 /*return*/, {
                                content: [{
                                        type: "text",
                                        text: response.data.choices[0].message.content
                                    }]
                            }];
                    case 11: throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, "Unknown tool: ".concat(request.params.name));
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_1 = _q.sent();
                        if (axios_1.default.isAxiosError(error_1)) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Perplexity API error: ".concat(((_p = (_o = (_m = error_1.response) === null || _m === void 0 ? void 0 : _m.data) === null || _o === void 0 ? void 0 : _o.error) === null || _p === void 0 ? void 0 : _p.message) || error_1.message));
                        }
                        throw error_1;
                    case 14: return [2 /*return*/];
                }
            });
        }); });
    };
    PerplexityServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transport = new stdio_js_1.StdioServerTransport();
                        return [4 /*yield*/, this.server.connect(transport)];
                    case 1:
                        _a.sent();
                        console.error("Perplexity MCP server running on stdio");
                        return [2 /*return*/];
                }
            });
        });
    };
    return PerplexityServer;
}());
var server = new PerplexityServer();
server.run().catch(console.error);
