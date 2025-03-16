# arxiv-search MCP Server

[🚀对应视频演示](https://youtu.be/vYm0brFoMwA)
### 🚀我的微信：stoeng

[English](#english) | [中文](#中文)

<a name="english"></a>

A Model Context Protocol server for searching academic papers on arXiv.

This server provides tools to search for academic papers on arXiv and access detailed information about them. It demonstrates core MCP concepts by providing:

- Resources representing academic papers with URIs and metadata
- Tools for searching papers with customizable parameters
- Support for sorting and pagination of search results

## Features

### Resources
- List and access papers via `arxiv://paper/{id}` URIs
- Each paper has title, authors, summary, publication date, and PDF link
- JSON mime type for structured content access

### Tools
- `search_papers` - Search for academic papers on arXiv
  - Takes query as required parameter
  - Optional parameters for max results, sorting, and pagination
  - Returns formatted results with paper details

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/path/to/arxiv-search/build/index.js"],
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

To use with VSCode and Roo Cline, add to:
`~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Usage Examples

```
<use_mcp_tool>
<server_name>arxiv-search</server_name>
<tool_name>search_papers</tool_name>
<arguments>
{
  "query": "machine learning",
  "max_results": 5,
  "sort_by": "relevance"
}
</arguments>
</use_mcp_tool>
```

Available parameters:
- `query` (required): Search query (e.g., 'machine learning', 'quantum physics')
- `max_results` (optional): Maximum number of results to return (default: 10, max: 100)
- `sort_by` (optional): Sort method ('relevance', 'lastUpdatedDate', 'submittedDate')
- `start` (optional): Starting index for results (for pagination)

---

<a name="中文"></a>

# arXiv搜索 MCP 服务器

一个用于搜索arXiv学术论文的模型上下文协议(MCP)服务器。

该服务器提供了搜索arXiv学术论文并获取详细信息的工具。它通过以下方式展示了MCP的核心概念：

- 使用URI和元数据表示学术论文的资源
- 提供带有可自定义参数的论文搜索工具
- 支持搜索结果的排序和分页

## 功能特点

### 资源
- 通过`arxiv://paper/{id}`URI列出和访问论文
- 每篇论文包含标题、作者、摘要、发布日期和PDF链接
- 使用JSON mime类型进行结构化内容访问

### 工具
- `search_papers` - 在arXiv上搜索学术论文
  - 需要query作为必填参数
  - 可选参数包括最大结果数、排序方式和分页
  - 返回带有论文详细信息的格式化结果

## 开发

安装依赖:
```bash
npm install
```

构建服务器:
```bash
npm run build
```

用于自动重新构建的开发模式:
```bash
npm run watch
```

## 安装

要与Claude桌面应用一起使用，添加服务器配置:

MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arxiv-search": {
      "command": "node",
      "args": ["/path/to/arxiv-search/build/index.js"],
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

要与VSCode和Roo Cline一起使用，添加到:
`~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

### 调试

由于MCP服务器通过stdio通信，调试可能具有挑战性。我们推荐使用[MCP Inspector](https://github.com/modelcontextprotocol/inspector)，可通过以下包脚本使用:

```bash
npm run inspector
```

Inspector将提供一个URL，用于在浏览器中访问调试工具。

## 使用示例

```
<use_mcp_tool>
<server_name>arxiv-search</server_name>
<tool_name>search_papers</tool_name>
<arguments>
{
  "query": "机器学习",
  "max_results": 5,
  "sort_by": "relevance"
}
</arguments>
</use_mcp_tool>
```

可用参数:
- `query` (必填): 搜索查询（例如：'机器学习'，'量子物理'）
- `max_results` (可选): 返回结果的最大数量（默认：10，最大：100）
- `sort_by` (可选): 排序方式（'relevance'相关性, 'lastUpdatedDate'最后更新日期, 'submittedDate'提交日期）
- `start` (可选): 结果的起始索引（用于分页）
