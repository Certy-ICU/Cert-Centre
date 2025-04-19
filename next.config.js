/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: [
      "utfs.io",
            "picsum.photos",
      "img.clerk.com",
      "images.clerk.dev"
    ]
  }
}

module.exports = nextConfig
