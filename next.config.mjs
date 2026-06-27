/** @type {import('next').NextConfig} */
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    '@ffmpeg-installer/ffmpeg', 
    '@ffprobe-installer/ffprobe', 
    'fluent-ffmpeg'
  ]
}

export default nextConfig
