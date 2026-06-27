import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";
import { promisify } from "util";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface VideoMetadata {
  resolution: string;
  aspectRatio: string;
  fps: number;
  bitrate: number;
  duration: number;
  codec: string;
  sizeBytes: number;
}

export interface AudioMetrics {
  lufs: number;
  silencePeriods: Array<{ start: number; end: number; duration: number }>;
}

const ffprobeAsync = promisify<string, ffmpeg.FfprobeData>(ffmpeg.ffprobe);

/**
 * Extracts metadata using ffprobe.
 */
export async function extractMetadata(filePath: string): Promise<VideoMetadata> {
  const data = await ffprobeAsync(filePath);
  const stream = data.streams.find((s: ffmpeg.FfprobeStream) => s.codec_type === "video") || data.streams[0];
  const format = data.format;

  const width = stream?.width || 1080;
  const height = stream?.height || 1920;
  const duration = Number(format.duration) || 0;
  const sizeBytes = Number(format.size) || 0;
  const bitrate = Number(format.bit_rate) || 0;
  const codec = stream?.codec_name || "unknown";

  // Parse FPS
  let fps = 30;
  if (stream?.r_frame_rate) {
    const [num, den] = stream.r_frame_rate.split("/").map(Number);
    if (den > 0) {
      fps = Math.round(num / den);
    }
  }

  return {
    resolution: `${width}x${height}`,
    aspectRatio: `${width}:${height}`,
    fps,
    bitrate,
    duration,
    codec,
    sizeBytes,
  };
}

/**
 * Extracts frames at a specific interval.
 */
export async function extractFrames(
  filePath: string,
  outputDir: string,
  intervalSec: number = 2
): Promise<string[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([`-vf fps=1/${intervalSec}`])
      .output(path.join(outputDir, "frame_%03d.jpg"))
      .on("end", () => {
        const files = fs.readdirSync(outputDir);
        resolve(
          files
            .filter((f) => f.startsWith("frame_") && f.endsWith(".jpg"))
            .map((f) => path.join(outputDir, f))
        );
      })
      .on("error", (err: Error) => {
        reject(err);
      })
      .run();
  });
}

/**
 * Extracts audio track from video as an MP3 file.
 */
export async function extractAudio(filePath: string, outputPath: string): Promise<string> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioQuality(4) // Variable bitrate quality (0-9, 4 is decent)
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err: Error) => reject(err));
  });
}

/**
 * Extracts advanced audio metrics (LUFS and Silences).
 */
export async function extractAudioMetrics(filePath: string): Promise<AudioMetrics> {
  return new Promise((resolve, reject) => {
    let lufs = -14; // Default fallback
    const silencePeriods: Array<{ start: number; end: number; duration: number }> = [];

    ffmpeg(filePath)
      .noVideo()
      .audioFilters("ebur128", "silencedetect=noise=-30dB:d=1")
      .format("null")
      .output("-")
      .on("stderr", (line: string) => {
        // Parse EBUR128 LUFS
        const lufsMatch = line.match(/I:\s+([-0-9.]+)\s+LUFS/);
        if (lufsMatch) {
          lufs = parseFloat(lufsMatch[1]);
        }

        // Parse Silence
        const silenceEndMatch = line.match(/silence_end:\s+([0-9.]+)\s+\|\s+silence_duration:\s+([0-9.]+)/);

        if (silenceEndMatch) {
          const end = parseFloat(silenceEndMatch[1]);
          const duration = parseFloat(silenceEndMatch[2]);
          const start = end - duration;
          silencePeriods.push({ start, end, duration });
        }
      })
      .on("end", () => {
        resolve({ lufs, silencePeriods });
      })
      .on("error", (err: Error) => {
        reject(err);
      })
      .run();
  });
}
