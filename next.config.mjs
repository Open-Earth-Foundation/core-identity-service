/** @type {import('next').NextConfig} */
const nextConfig = {
  // Match CityCatalyst so route mapping between the two apps behaves the same.
  trailingSlash: true,
  // Build a self-contained server in .next/standalone so the Docker image does
  // not need the full node_modules.
  output: "standalone",
  // Vendored GDS packages ship as ESM from file: deps; transpile for Next.
  transpilePackages: ["@oef/gds-react", "@oef/gds-tokens"],
};

export default nextConfig;
