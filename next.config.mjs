import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default withSentryConfig(nextConfig, {
  org: "plan-growth",
  project: "plan-growth",
  silent: true,
  widenClientFileUpload: false,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
})
