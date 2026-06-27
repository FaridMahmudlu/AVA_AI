import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, generateText } from "ai";
import { getPrompts, renderTemplate } from "@/lib/prompts";
import { extractMetadata, extractAudio, extractAudioMetrics, extractFrames } from "@/lib/video-processor";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import OpenAI from "openai";

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
const openai = createOpenAI({ apiKey: openaiApiKey });
const anthropic = createAnthropic({ apiKey: anthropicApiKey });
const openaiClient = new OpenAI({ apiKey: openaiApiKey });

export const maxDuration = 300; // 5 minutes max on Vercel

export async function POST(req: Request) {
  let tempVideoPath = "";
  let tempAudioPath = "";
  let tempFramesDir = "";

  try {
    const formData = await req.formData();
    const topic = formData.get("topic") as string || "";
    const modelSelection = formData.get("model") as string || "gemini-2.0-flash";
    const videoFile = formData.get("video") as File;

    if (!videoFile) {
      return Response.json({ error: "No video file provided" }, { status: 400 });
    }

    // 1. Save video to temp storage
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const uniqueId = crypto.randomBytes(16).toString("hex");
    tempVideoPath = path.join(os.tmpdir(), `video_${uniqueId}.mp4`);
    tempAudioPath = path.join(os.tmpdir(), `audio_${uniqueId}.mp3`);
    tempFramesDir = path.join(os.tmpdir(), `frames_${uniqueId}`);
    
    fs.writeFileSync(tempVideoPath, buffer);

    // 2. Parallel Processing (FFmpeg + Whisper + Vision)
    
    // A. Technical Metadata & Audio Extraction
    const metadataPromise = extractMetadata(tempVideoPath);
    const audioMetricsPromise = extractAudioMetrics(tempVideoPath);
    
    // B. Whisper Transcription
    const transcriptPromise = extractAudio(tempVideoPath, tempAudioPath).then(async (audioPath) => {
      if (!openaiApiKey) return "Whisper API Key eksik. Transkript alınamadı.";
      try {
        const response = await openaiClient.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: "whisper-1",
        });
        return response.text;
      } catch (err) {
        console.error("Whisper Hatası:", err);
        return "Ses analizi başarsız.";
      }
    });

    // C. Frame Extraction
    const framesPromise = extractFrames(tempVideoPath, tempFramesDir, 2);

    // Wait for FFmpeg & Whisper tasks to finish
    const [metadata, audioMetrics, transcript, framePaths] = await Promise.all([
      metadataPromise,
      audioMetricsPromise,
      transcriptPromise,
      framesPromise,
    ]);

    // D. Fetch Instagram Context
    let instagramContext = "";
    try {
      const user = await getSession();
      if (user?.instagramProfileData) {
        const data = user.instagramProfileData as any;
        let contextParts = [
          `Instagram Kullanıcı Adı: @${data.username}`,
          `Takipçi Sayısı: ${data.followersCount}`,
        ];
        if (data.biography) contextParts.push(`Biyografi: ${data.biography}`);
        if (data.recentPosts?.length > 0) {
          contextParts.push(`\nSon Paylaşımların Metinleri (Dil Parmak İzi analizi için):`);
          data.recentPosts.slice(0, 10).forEach((post: any, i: number) => {
            if (post.caption) contextParts.push(`[Post ${i + 1}]: ${post.caption.trim()}`);
          });
        }
        instagramContext = contextParts.join("\n");
      }
    } catch (e) {
      console.error("Instagram context alinirken hata:", e);
    }

    // 3. Prepare AI Prompt with Rich Data
    const prompts = await getPrompts();
    
    let richPrompt = renderTemplate(prompts.analyze.template, {
      topic,
      transcript,
      intervalSec: 2,
      instagramContext
    });

    // Inject FFmpeg Metadata into the prompt manually before sending
    richPrompt += `\n\n=== OTOMATİK SİSTEM VERİLERİ (FFMPEG & VİSİON) ===\n`;
    richPrompt += `[Teknik] Çözünürlük: ${metadata.resolution} (${metadata.aspectRatio})\n`;
    richPrompt += `[Teknik] FPS: ${metadata.fps}, Bitrate: ${metadata.bitrate}\n`;
    richPrompt += `[Teknik] Süre: ${metadata.duration} sn, Codec: ${metadata.codec}\n`;
    richPrompt += `[Ses] LUFS Seviyesi: ${audioMetrics.lufs} LUFS\n`;
    richPrompt += `[Ses] Sessizlik (Silence) Dönemleri: ${audioMetrics.silencePeriods.length} kez sessizlik tespit edildi.\n`;
    richPrompt += `====================================================\n`;

    // 4. Read Frames as Base64 for the Model
    const imageContents = framePaths.map((framePath) => {
      const imgBuffer = fs.readFileSync(framePath);
      return {
        type: "image" as const,
        image: imgBuffer.toString("base64"),
        mimeType: "image/jpeg"
      };
    });

    // 5. Select Model Based on User's Choice
    let selectedModel;
    if (modelSelection.startsWith("gpt")) {
      selectedModel = openai(modelSelection); // e.g. gpt-4o
    } else if (modelSelection.startsWith("claude")) {
      selectedModel = anthropic(modelSelection); // e.g. claude-3-5-sonnet-20240620
    } else {
      selectedModel = google(modelSelection); // e.g. gemini-2.5-flash
    }

    // 6. Execute Final AI Synthesis
    const result = streamText({
      model: selectedModel as any,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: richPrompt },
            ...imageContents,
          ],
        },
      ],
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Analyze v2 Hatası:", error);
    return Response.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 });
  } finally {
    // Cleanup Temp Files
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (tempAudioPath && fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
      if (tempFramesDir && fs.existsSync(tempFramesDir)) fs.rmSync(tempFramesDir, { recursive: true, force: true });
    } catch (e) {
      console.error("Temp file cleanup failed:", e);
    }
  }
}
