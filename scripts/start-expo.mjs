import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const mode = process.argv[2];

if (mode !== "lan" && mode !== "tunnel") {
  console.error("Usage: node scripts/start-expo.mjs <lan|tunnel>");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const expoPackageRoot = dirname(require.resolve("expo/package.json"));
const expoCli = join(expoPackageRoot, "bin", "cli");
const transport = mode === "lan" ? "--lan" : "--tunnel";
const extraArgs = process.argv.slice(3);
const child = spawn(process.execPath, [expoCli, "start", transport, ...extraArgs], {
  env: {
    ...process.env,
    EXPO_PUBLIC_API_MODE: mode
  },
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(`Could not start Expo: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Expo stopped by signal ${signal}.`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});
