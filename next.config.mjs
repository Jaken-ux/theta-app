/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Force the apex domain — every www.thetasimplified.com request
      // gets a server-side 301 to the matching path on thetasimplified.com.
      // Runs at the edge before any page renders so Google never has the
      // chance to index the www variant. Belt + braces with the per-page
      // canonical tags in src/app/layout.tsx and per-page `alternates`.
      //
      // We use `statusCode: 301` rather than `permanent: true` (which is
      // 308 in Next.js) so older crawlers and clients that don't fully
      // implement 308 still see a permanent redirect.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.thetasimplified.com" }],
        destination: "https://thetasimplified.com/:path*",
        statusCode: 301,
      },
      // Vercel auto-aliases the production deployment to *.vercel.app and
      // marks it as a "Production" domain in the dashboard, which means
      // Google can discover and index the same content under two hosts —
      // the same duplicate-canonical issue we just fixed for www. Match
      // only the named production alias; preview-deploy URLs like
      // theta-simplified-git-<branch>.vercel.app stay reachable for QA.
      {
        source: "/:path*",
        has: [{ type: "host", value: "theta-simplified.vercel.app" }],
        destination: "https://thetasimplified.com/:path*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
