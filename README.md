# util-mcp

Simple MCP server with utility tools for locally hosted agents.

## Tools

- **get_time** — Returns current date/time in UTC, local, and ISO format
- **get_location** — Returns approximate location based on public IP
- **ping** — Tests network connectivity to a host

## Install

```bash
npm install
```

## Run

```bash
npm start
```

The server uses stdio transport and is ready to be connected to by an MCP client.

## Connect an MCP client

Configure your MCP client to connect:

```json
{
  "mcpServers": {
    "util": {
      "command": "node",
      "args": ["/path/to/util-mcp/server.mjs"]
    }
  }
}
```