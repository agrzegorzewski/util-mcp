/**
 * util-mcp — Simple MCP server with utility tools
 *
 * Provides get_time, get_location, and ping tools via stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { platform } from "os";

const server = new McpServer({
  name: "util-server",
  version: "1.0.0",
});

server.tool(
  "get_time",
  "Returns current date and time in UTC and local timezone",
  {},
  async () => {
    const now = new Date();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            iso: now.toISOString(),
            utc: now.toUTCString(),
            local: now.toLocaleString(),
            timezone: now.getTimezoneOffset(),
            timestamp: now.getTime(),
          }),
        },
      ],
    };
  }
);

server.tool(
  "get_location",
  "Returns approximate location based on public IP",
  {},
  async () => {
    const res = await fetch("https://api.ipgeolocation.xyz/ip-info");
    const data = await res.json();

    const required = ["ip", "city", "region", "country_name", "latitude", "longitude"];
    const missing = required.filter((f) => data[f] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing fields in location response: ${missing.join(", ")}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            lat: data.latitude,
            lon: data.longitude,
          }),
        },
      ],
    };
  }
);

server.tool(
  "ping",
  "Simple ping test to check connectivity",
  {
    host: z.string().describe("Host to ping (default: google.com)"),
    count: z.number().optional().describe("Number of pings (default: 3)"),
  },
  async ({ host, count }) => {
    const { execSync } = await import("child_process");
    const isWindows = platform() === "win32";
    const cFlag = isWindows ? "-n" : "-c";
    const wFlag = isWindows ? "-w" : "-W";
    const wValue = isWindows ? 2000 : 2;
    try {
      const output = execSync(`ping ${cFlag} ${count || 3} ${wFlag} ${wValue} ${host || "google.com"}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return {
        content: [{ type: "text", text: output.trim() }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Ping failed: ${e.message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("util-mcp server running on stdio");