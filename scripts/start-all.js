const { spawn, spawnSync } = require("node:child_process");
const net = require("node:net");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [];
let shuttingDown = false;

const portsToCheck = [
  { port: 3000, label: "frontend" },
  { port: 5000, label: "backend" },
];

const checkPortOpen = (port) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
        return;
      }

      reject(err);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });

const ensurePortsAvailable = async () => {
  for (const target of portsToCheck) {
    const isAvailable = await checkPortOpen(target.port);

    if (!isAvailable) {
      console.error(
        `Port ${target.port} is unavailable, so the ${target.label} server cannot start.`
      );
      console.error("Stop the existing process on that port and run this command again.");
      process.exit(1);
    }
  }
};

const shutdown = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of processes) {
    if (child && !child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
};

const runBuild = () => {
  console.log("Building frontend for a stable startup...");

  const result = spawnSync(npmCmd, ["run", "build"], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    console.error("Frontend build failed. Fix the errors above and try again.");
    process.exit(result.status || 1);
  }
};

const startProcess = (label, args, color) => {
  const child = spawn(npmCmd, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`${color}[${label}] ${data}\x1b[0m`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`${color}[${label}] ${data}\x1b[0m`);
  });

  child.on("error", (err) => {
    process.stderr.write(`${color}[${label}] failed to start: ${err.message}\x1b[0m\n`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    const detail = signal ? `signal ${signal}` : `code ${code}`;
    process.stdout.write(`${color}[${label}] exited with ${detail}\x1b[0m\n`);

    if (!shuttingDown) {
      shutdown(code ?? 1);
    }
  });

  processes.push(child);
  return child;
};

const main = async () => {
  await ensurePortsAvailable();
  runBuild();

  console.log("Starting backend on http://localhost:5000 and frontend on http://localhost:3000");
  startProcess("api", ["run", "api:start"], "\x1b[36m");
  startProcess("web", ["run", "start", "--", "--port", "3000"], "\x1b[35m");
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((err) => {
  console.error(`Failed to start application: ${err.message}`);
  process.exit(1);
});
