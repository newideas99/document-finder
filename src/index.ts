#!/usr/bin/env node

/**
 * MCP server that provides tools to fetch and format documentation for npm and PyPI packages.
 * It uses the official registries to get the latest package information and documentation.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Initialize server with only tools capability since we're providing on-demand documentation
const server = new Server(
  {
    name: "package-docs-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create axios instances for each registry
const npmClient = axios.create({
  baseURL: "https://registry.npmjs.org",
});

const pypiClient = axios.create({
  baseURL: "https://pypi.org/pypi",
});

/**
 * Handler that lists available tools for fetching package documentation
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_npm_docs",
        description: "Get documentation and information for an npm package",
        inputSchema: {
          type: "object",
          properties: {
            package_name: {
              type: "string",
              description: "Name of the npm package"
            }
          },
          required: ["package_name"]
        }
      },
      {
        name: "get_pypi_docs",
        description: "Get documentation and information for a Python package from PyPI",
        inputSchema: {
          type: "object",
          properties: {
            package_name: {
              type: "string",
              description: "Name of the Python package"
            }
          },
          required: ["package_name"]
        }
      }
    ]
  };
});

/**
 * Handler for tool execution - fetches and formats package documentation
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_npm_docs": {
      const { package_name } = request.params.arguments as { package_name: string };
      
      try {
        // Fetch package data from npm registry
        const response = await npmClient.get(`/${package_name}`);
        const latestVersion = response.data['dist-tags'].latest;
        const latestData = response.data.versions[latestVersion];
        
        // Format the documentation
        let docs = `# ${response.data.name} v${latestVersion}\n\n`;
        
        if (response.data.description) {
          docs += `${response.data.description}\n\n`;
        }
        
        docs += `## Installation\n\n\`\`\`bash\nnpm install ${package_name}\n\`\`\`\n\n`;
        
        if (latestData.homepage) {
          docs += `## Homepage\n${latestData.homepage}\n\n`;
        }
        
        if (latestData.repository?.url) {
          docs += `## Repository\n${latestData.repository.url.replace('git+', '')}\n\n`;
        }
        
        if (latestData.keywords?.length > 0) {
          docs += `## Keywords\n${latestData.keywords.join(', ')}\n\n`;
        }
        
        if (response.data.readme) {
          docs += `## Documentation\n\n${response.data.readme}\n`;
        }

        return {
          content: [{
            type: "text",
            text: docs
          }]
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to fetch npm package info: ${error.message}`
          );
        }
        throw error;
      }
    }

    case "get_pypi_docs": {
      const { package_name } = request.params.arguments as { package_name: string };
      
      try {
        // Fetch package data from PyPI
        const response = await pypiClient.get(`/${package_name}/json`);
        const info = response.data.info;
        
        // Format the documentation
        let docs = `# ${info.name} v${info.version}\n\n`;
        
        if (info.summary) {
          docs += `${info.summary}\n\n`;
        }
        
        docs += `## Installation\n\n\`\`\`bash\npip install ${package_name}\n\`\`\`\n\n`;
        
        if (info.home_page) {
          docs += `## Homepage\n${info.home_page}\n\n`;
        }
        
        if (info.project_urls) {
          docs += `## Project Links\n`;
          for (const [name, url] of Object.entries(info.project_urls)) {
            docs += `- ${name}: ${url}\n`;
          }
          docs += '\n';
        }
        
        if (info.keywords) {
          docs += `## Keywords\n${info.keywords}\n\n`;
        }
        
        if (info.description) {
          docs += `## Documentation\n\n${info.description}\n`;
        }

        return {
          content: [{
            type: "text",
            text: docs
          }]
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to fetch PyPI package info: ${error.message}`
          );
        }
        throw error;
      }
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Package Documentation MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
