import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@repo/llm-core"],
  turbopack: {
    root: workspaceRoot
  }
};

export default nextConfig;
