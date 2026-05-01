const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

function getDeploymentDomain() {
  const raw =
    process.env.REPLIT_INTERNAL_APP_DOMAIN ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.EXPO_PUBLIC_DOMAIN;

  if (!raw) {
    console.error(
      "ERROR: No deployment domain found. Set REPLIT_INTERNAL_APP_DOMAIN, REPLIT_DEV_DOMAIN, or EXPO_PUBLIC_DOMAIN",
    );
    process.exit(1);
  }

  let host = raw.trim();
  if (!/^https?:\/\//i.test(host)) host = `https://${host}`;
  return new URL(host).host;
}

function main() {
  console.log("Building Circle Link web app...");

  const domain = getDeploymentDomain();
  const origin = `https://${domain}`;

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
    console.log("Cleared previous dist/");
  }

  console.log(`Exporting web bundle (origin: ${origin})...`);
  execFileSync(
    "pnpm",
    ["exec", "expo", "export", "--platform", "web"],
    {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        EXPO_PUBLIC_DOMAIN: domain,
        EXPO_PUBLIC_REPL_ID: process.env.REPL_ID || process.env.EXPO_PUBLIC_REPL_ID || "",
        CI: "1",
      },
    },
  );

  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    console.error("ERROR: dist/index.html not found after export");
    process.exit(1);
  }

  console.log("Build complete! Deploy to:", origin);
}

main();
