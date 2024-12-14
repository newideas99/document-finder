# Package Documentation MCP Server

A Model Context Protocol (MCP) server that provides tools to fetch and format documentation for npm and PyPI packages. This server allows AI assistants to easily access package documentation and information directly from the official registries.

## Features

- Fetch documentation from npm registry
- Fetch documentation from PyPI registry
- Formatted output including:
  - Package name and version
  - Description
  - Installation instructions
  - Homepage and repository links
  - Keywords
  - Full documentation/readme content

## Installation

1. Clone or create the server in your MCP servers directory:
```bash
cd /path/to/mcp/servers
npx @modelcontextprotocol/create-server package-docs-server
```

2. Install dependencies:
```bash
cd package-docs-server
npm install
```

3. Build the server:
```bash
npm run build
```

## Configuration

Add the server to your Claude Desktop configuration file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "package-docs": {
      "command": "node",
      "args": [
        "/path/to/package-docs-server/build/index.js"
      ]
    }
  }
}
```

## Available Tools

### get_npm_docs

Fetches documentation for an npm package.

Parameters:
- `package_name` (string, required): Name of the npm package

Example usage:
```typescript
<use_mcp_tool>
<server_name>package-docs</server_name>
<tool_name>get_npm_docs</tool_name>
<arguments>
{
  "package_name": "react"
}
</arguments>
</use_mcp_tool>
```

### get_pypi_docs

Fetches documentation for a Python package from PyPI.

Parameters:
- `package_name` (string, required): Name of the Python package

Example usage:
```typescript
<use_mcp_tool>
<server_name>package-docs</server_name>
<tool_name>get_pypi_docs</tool_name>
<arguments>
{
  "package_name": "requests"
}
</arguments>
</use_mcp_tool>
```

## Development

The server is built with TypeScript and uses:
- `@modelcontextprotocol/sdk` for MCP server implementation
- `axios` for making HTTP requests to package registries

To modify the server:
1. Edit the source code in `src/index.ts`
2. Rebuild using `npm run build`
3. Restart Claude Desktop to load the changes

## License

MIT
