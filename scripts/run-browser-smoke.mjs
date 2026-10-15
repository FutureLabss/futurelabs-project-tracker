/* global console, setTimeout */
import { spawn } from "node:child_process";
import http from "node:http";
import process from "node:process";


const PORT = 5178;
const HOST = "127.0.0.1";
const URL = `http://${HOST}:${PORT}`;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", () => retry());
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for server at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const server = spawn(
  npmCmd,
  ["run", "dev", "--", "--port", String(PORT), "--host", HOST],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, VITE_DATA_BACKEND: "local" },
    shell: true,
  },
);

server.stdout?.on("data", (data) => {
  const text = data.toString();
  if (text.includes("ready in")) {
    process.stdout.write(`[dev-server] ${text.trim()}\n`);
  }
});

let serverExited = false;
server.on("exit", () => {
  serverExited = true;
});

const cleanup = () => {
  if (!serverExited) {
    if (isWindows && server.pid) {
      try {
        spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } catch {
        server.kill();
      }
    } else {
      server.kill("SIGTERM");
    }
  }
};

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});
process.on("exit", () => {
  cleanup();
});

try {
  console.log(`Starting local application on ${URL}...`);
  await waitForServer(URL);
  console.log(`Server ready. Running browser smoke test...`);

  const testProcess = spawn(
    process.execPath,
    ["tests/admin-browser.smoke.cjs"],
    {
      stdio: "inherit",
      env: { ...process.env, ADMIN_TEST_URL: URL },
    },
  );

  const code = await new Promise((resolve) => {
    testProcess.on("exit", resolve);
  });

  cleanup();
  process.exit(code ?? 1);
} catch (err) {
  console.error("Browser smoke test failed:", err);
  cleanup();
  process.exit(1);
}
