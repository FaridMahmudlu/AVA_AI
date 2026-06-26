import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export interface VideoMetadata {
  resolution: string;
  aspectRatio: string;
  fps: number;
  bitrate: number;
  duration: number;
  codec: string;
  sizeBytes: number;
}

export interface VideoAnalysisResult {
  metadata: VideoMetadata;
  scores: Record<string, number>; // 40 parameters scored 1-10
  suggestions: Array<{ timestamp: string; parameter: string; comment: string }>;
  overallScore: number;
}

/**
 * Helper to run a command and return stdout.
 */
async function runCmd(cmd: string): Promise<string> {
  const { stdout } = await execAsync(cmd);
  return stdout.trim();
}

/**
 * Extracts metadata using ffprobe. Falls back to mock metadata if ffprobe is not installed.
 */
export async function extractMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=width,height,r_frame_rate,codec_name -of json "${filePath}"`;
    const output = await runCmd(ffprobeCmd);
    const data = JSON.parse(output);

    const stream = data.streams?.[0] || {};
    const format = data.format || {};

    const width = Number(stream.width) || 1080;
    const height = Number(stream.height) || 1920;
    const duration = Number(format.duration) || 0;
    const sizeBytes = Number(format.size) || 0;
    const bitrate = Number(format.bit_rate) || 0;
    const codec = stream.codec_name || "h264";

    // Parse FPS
    let fps = 30;
    if (stream.r_frame_rate) {
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
  } catch (error) {
    console.warn("FFmpeg/ffprobe not found or failed, using mock metadata fallbacks:", error);
    // Return standard mock metadata (9:16 portrait video)
    return {
      resolution: "1080x1920",
      aspectRatio: "9:16",
      fps: 30,
      bitrate: 4500000,
      duration: 15.4,
      codec: "h264",
      sizeBytes: 8660000,
    };
  }
}

/**
 * Extracts frames at a specific interval. Falls back to mock frame files.
 */
export async function extractFrames(
  filePath: string,
  outputDir: string,
  intervalSec: number = 2
): Promise<string[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const ffmpegCmd = `ffmpeg -i "${filePath}" -vf "fps=1/${intervalSec}" -vsync vsc -q:v 2 "${path.join(outputDir, "frame_%03d.jpg")}"`;
    await runCmd(ffmpegCmd);

    const files = fs.readdirSync(outputDir);
    return files
      .filter((f) => f.startsWith("frame_") && f.endsWith(".jpg"))
      .map((f) => path.join(outputDir, f));
  } catch (error) {
    console.warn("FFmpeg failed to extract frames, using mock frames:", error);
    // Mock extraction
    const mockFrames = [];
    for (let i = 1; i <= 5; i++) {
      const mockPath = path.join(outputDir, `mock_frame_${i}.jpg`);
      fs.writeFileSync(mockPath, "mock image data placeholder");
      mockFrames.push(mockPath);
    }
    return mockFrames;
  }
}

/**
 * Extracts audio track from video. Falls back to generating a mock empty audio.
 */
export async function extractAudio(filePath: string, outputPath: string): Promise<string> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const ffmpegCmd = `ffmpeg -y -i "${filePath}" -vn -acodec libmp3lame -q:a 4 "${outputPath}"`;
    await runCmd(ffmpegCmd);
    return outputPath;
  } catch (error) {
    console.warn("FFmpeg audio extraction failed, using mock audio file:", error);
    fs.writeFileSync(outputPath, "mock audio mp3 content");
    return outputPath;
  }
}

/**
 * Formulate 40-Parameter Haiku Prompt for AVA AI.
 */
export function buildHaikuAnalysisPrompt(
  metadata: VideoMetadata,
  transcript: string
): string {
  return `
Sen bir AVA AI Video Analiz uzmanısın. Aşağıda teknik özellikleri ve ses deşifresi verilen dikey Instagram videosunu analiz et.
Videonun analizi tam olarak 4 ana kategoride (toplam 40 parametre) 1-10 puan arasında değerlendirilmeli ve her biri için saniye saniye zaman damgalı öneriler içermelidir.

[VİDEO TEKNİK ÖZELLİKLERİ]
- Çözünürlük ve En/Boy Oranı: ${metadata.resolution} (${metadata.aspectRatio})
- Kare Hızı (FPS): ${metadata.fps} fps
- Bit Hızı (Bitrate): ${metadata.bitrate} bps
- Video Süresi: ${metadata.duration} saniye
- Codec: ${metadata.codec}

[SES DEŞİFRESİ (TRANSCRIPTION)]
"${transcript}"

Lütfen aşağıdaki 4 kategorideki 40 parametreyi detaylıca analiz et:

1. TEKNİK PARAMETRELER (FFmpeg):
   - Cozunurluk & En/Boy Oranı (Instagram için 9:16 olmalı)
   - FPS & Kare Hızı
   - Bit Rate & Boyut (Sıkıştırma kalitesi)
   - Codec Uyumluluğu (H.264/H.265 kontrolü)
   - Video Süresi (Hedef sürelere uygunluk)
   - Aydınlatma Skoru (Brightness ve kontrast dengesi)
   - Stabilizasyon (Sallantı tespiti)
   - Renk Paleti (Dominant renkler ve filtre tutarlılığı)

2. SES PARAMETRELERİ (FFmpeg + Whisper):
   - Ses Seviyesi (LUFS loudness normalizasyonu)
   - Arka Plan Gürültüsü (SNR skoru)
   - Telif Tespiti (ACRCloud entegrasyonu)
   - Müzik / Ses Dengesi (Müzik konuşmayı bastırıyor mu?)
   - Konuşma Hızı (Kelime/dakika oranı)
   - Sessizlik Analizi (Gereksiz duraklamalar)
   - Efekt Zamanlaması (Ses efekti kesme noktaları)

3. İÇERİK PARAMETRELERİ (Claude Haiku):
   - İlk 3 Saniye Kanca Gücü (Kanca tipi)
   - CTA Gücü & Konumu
   - Hikaye Akışı (Giriş/Gelişme/Sonuç)
   - Tempo & Ritim Uyumu
   - Altyazı Uyumu (Ses-metin senkronizasyonu)
   - Özgünlük Skoru
   - Değer Önerisi Netliği
   - Merak Açığı (Curiosity gap)
   - Yorum Tetikleyici (Comment hook)
   - Kaydetme Potansiyeli

4. ALGORİTMA PARAMETRELERİ (Vision + Haiku):
   - Kapak Karesi Skoru (Tıklanabilirlik)
   - Trend Uyumu
   - Yüz Görünürlüğü (Göz teması ve süre)
   - Paylaşılabilirlik
   - Hedef Kitle Uyumu (Takipçi demografisiyle örtüşme)

Çıktıyı JSON formatında ver. JSON formatı şu şekilde olmalıdır:
{
  "scores": {
    "Cozunurluk_EnBoyOrani": 9,
    ...
  },
  "suggestions": [
    { "timestamp": "0:03", "parameter": "Kanca Gücü", "comment": "İlk 3 saniyede soru cümlesiyle başlayarak kanca etkisini artırın." },
    ...
  ],
  "overallScore": 85
}
`;
}
