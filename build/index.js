#!/usr/bin/env node
/**
 * ArXiv Search MCP Server
 *
 * 这个MCP服务器提供了与arXiv API交互的功能，允许用户搜索学术论文。
 * 它实现了以下功能：
 * - 搜索论文（通过工具）
 * - 获取论文详细信息（通过资源）
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as xml2js from "xml2js";
/**
 * 缓存最近的搜索结果
 */
const recentPapers = {};
/**
 * 创建MCP服务器
 */
const server = new Server({
    name: "arxiv-search",
    version: "0.1.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
/**
 * 解析arXiv API返回的XML数据
 */
async function parseArxivResponse(xmlData) {
    const parser = new xml2js.Parser();
    try {
        const result = await parser.parseStringPromise(xmlData);
        const entries = result.feed.entry || [];
        return entries.map((entry) => {
            // 获取论文ID（从URL中提取）
            const idUrl = entry.id[0];
            const id = idUrl.split('/').pop();
            // 获取PDF链接
            const pdfLink = entry.link.find((link) => link.$.title === 'pdf')?.$.href || '';
            // 获取分类
            const categories = entry.category ? entry.category.map((cat) => cat.$.term) : [];
            const paper = {
                id,
                title: entry.title[0],
                authors: entry.author.map((author) => author.name[0]),
                summary: entry.summary[0],
                published: entry.published[0],
                updated: entry.updated[0],
                pdfLink,
                categories
            };
            // 缓存论文数据
            recentPapers[id] = paper;
            return paper;
        });
    }
    catch (error) {
        console.error("解析arXiv响应失败:", error);
        throw new McpError(ErrorCode.InternalError, "解析arXiv响应失败");
    }
}
/**
 * 搜索arXiv论文
 */
async function searchArxiv(query, maxResults = 10, sortBy = 'relevance', start = 0) {
    try {
        const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=${start}&max_results=${maxResults}&sortBy=${sortBy}`;
        const response = await axios.get(url);
        return await parseArxivResponse(response.data);
    }
    catch (error) {
        console.error("arXiv API请求失败:", error);
        throw new McpError(ErrorCode.InternalError, "arXiv API请求失败");
    }
}
/**
 * 处理列出资源请求
 * 列出最近搜索的论文作为资源
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: Object.entries(recentPapers).map(([id, paper]) => ({
            uri: `arxiv://paper/${id}`,
            mimeType: "application/json",
            name: paper.title,
            description: `arXiv论文: ${paper.title} (作者: ${paper.authors.join(', ')})`
        }))
    };
});
/**
 * 处理读取资源请求
 * 返回特定论文的详细信息
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    if (url.protocol !== 'arxiv:') {
        throw new McpError(ErrorCode.InvalidRequest, "无效的URI协议");
    }
    const pathParts = url.pathname.split('/');
    if (pathParts.length < 3 || pathParts[1] !== 'paper') {
        throw new McpError(ErrorCode.InvalidRequest, "无效的URI路径");
    }
    const id = pathParts[2];
    const paper = recentPapers[id];
    if (!paper) {
        throw new McpError(ErrorCode.InvalidRequest, `未找到ID为${id}的论文`);
    }
    return {
        contents: [{
                uri: request.params.uri,
                mimeType: "application/json",
                text: JSON.stringify({
                    id: paper.id,
                    title: paper.title,
                    authors: paper.authors,
                    summary: paper.summary,
                    published: paper.published,
                    updated: paper.updated,
                    pdfLink: paper.pdfLink,
                    categories: paper.categories
                }, null, 2)
            }]
    };
});
/**
 * 处理列出工具请求
 * 提供搜索论文的工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_papers",
                description: "搜索arXiv学术论文",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "搜索查询（例如：'machine learning', 'quantum physics'等）"
                        },
                        max_results: {
                            type: "number",
                            description: "返回结果的最大数量（默认为10，最大为100）",
                            minimum: 1,
                            maximum: 100
                        },
                        sort_by: {
                            type: "string",
                            description: "排序方式（relevance, lastUpdatedDate, submittedDate）",
                            enum: ["relevance", "lastUpdatedDate", "submittedDate"]
                        },
                        start: {
                            type: "number",
                            description: "结果的起始索引（用于分页）",
                            minimum: 0
                        }
                    },
                    required: ["query"]
                }
            }
        ]
    };
});
/**
 * 处理调用工具请求
 * 实现搜索论文的功能
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "search_papers") {
        throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${request.params.name}`);
    }
    const args = request.params.arguments;
    if (!args || typeof args.query !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, "必须提供查询参数");
    }
    const query = args.query;
    const maxResults = typeof args.max_results === 'number' ? Math.min(args.max_results, 100) : 10;
    const sortBy = typeof args.sort_by === 'string' ? args.sort_by : 'relevance';
    const start = typeof args.start === 'number' ? Math.max(0, args.start) : 0;
    try {
        const papers = await searchArxiv(query, maxResults, sortBy, start);
        // 格式化搜索结果
        const formattedResults = papers.map((paper, index) => {
            return `论文 ${index + 1}:\n` +
                `标题: ${paper.title}\n` +
                `作者: ${paper.authors.join(', ')}\n` +
                `摘要: ${paper.summary.substring(0, 200)}${paper.summary.length > 200 ? '...' : ''}\n` +
                `发布时间: ${paper.published}\n` +
                `PDF链接: ${paper.pdfLink}\n` +
                `分类: ${paper.categories.join(', ')}\n` +
                `ID: ${paper.id}\n`;
        }).join('\n');
        return {
            content: [{
                    type: "text",
                    text: papers.length > 0
                        ? `找到 ${papers.length} 篇与 "${query}" 相关的论文:\n\n${formattedResults}`
                        : `未找到与 "${query}" 相关的论文。`
                }]
        };
    }
    catch (error) {
        console.error("搜索论文失败:", error);
        return {
            content: [{
                    type: "text",
                    text: `搜索失败: ${error instanceof Error ? error.message : String(error)}`
                }],
            isError: true
        };
    }
});
/**
 * 启动服务器
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("arXiv搜索MCP服务器已启动");
    // 错误处理
    server.onerror = (error) => console.error('[MCP错误]', error);
    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });
}
main().catch((error) => {
    console.error("服务器错误:", error);
    process.exit(1);
});
