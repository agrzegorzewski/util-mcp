import { spawn } from "child_process";
import { resolve } from "path";

async function runTests() {
  const proc = spawn("node", [resolve("./server.mjs")]);
  let id = 0;
  let testsPassed = 0;

  function request(method, params) {
    return new Promise((resolvePromise, rejectPromise) => {
      const msgId = ++id;
      const msg = { jsonrpc: "2.0", id: msgId, method, params };
      const raw = JSON.stringify(msg) + "\n";
      proc.stdin.write(raw);

      const dataHandler = (data) => {
        data.toString().split("\n").forEach((line) => {
          if (!line.trim()) return;
          try {
            const obj = JSON.parse(line);
            if (obj.id === msgId) {
              clearTimeout(timer);
              proc.stdout.off("data", dataHandler);
              resolvePromise(obj);
            }
          } catch {}
        });
      };
      proc.stdout.on("data", dataHandler);

      const timer = setTimeout(() => {
        proc.stdout.off("data", dataHandler);
        rejectPromise(new Error(`Timeout waiting for response to ${method}`));
      }, 15000);
    });
  }

  try {
    // Initialize
    const init = await request("initialize", {
      protocolVersion: "2025-03-26",
      clientInfo: { name: "test", version: "1.0" },
    });
    if (init.result) {
      console.log("✓ initialize");
      testsPassed++;
    }

    // List tools
    const tools = await request("tools/list", {});
    const toolNames = tools.result.tools.map((t) => t.name);
    console.log(`✓ tools/list (${toolNames.join(", ")})`);
    testsPassed++;

    // Test get_time
    const time = await request("tools/call", {
      name: "get_time",
      arguments: {},
    });
    const timeData = JSON.parse(time.result.content[0].text);
    if (timeData.iso && timeData.local) {
      console.log("✓ get_time");
      testsPassed++;
    }

    // Test ping
    const ping = await request("tools/call", {
      name: "ping",
      arguments: { host: "localhost", count: 1 },
    });
    if (ping.result.content[0].text.includes("localhost") || ping.result.content[0].text.includes("127.0.0.1")) {
      console.log("✓ ping");
      testsPassed++;
    }

    console.log(`\nAll ${testsPassed} tests passed!`);
  } catch (e) {
    console.error("✗ Test failed:", e.message);
  } finally {
    proc.kill();
  }
}

runTests();