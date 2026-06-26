"use client";

import * as React from "react";
import { extractAnalyzeCaption, extractScore, parseAnalyzeOutput } from "@/lib/ai-output";
import { VideoUploadZone } from "@/components/video-upload-zone";
import { AnalysisResults } from "@/components/analysis-results";

export function AnalysisPanel() {
  const [topic, setTopic] = React.useState("");
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [frames, setFrames] = React.useState<string[]>([]);
  const [frameBlobs, setFrameBlobs] = React.useState<Blob[]>([]);
  const [result, setResult] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const SANIYE_ARALIGI = 2;
  const MAX_FRAMES = 20;

  const sections = React.useMemo(() => parseAnalyzeOutput(result), [result]);
  const caption = React.useMemo(() => extractAnalyzeCaption(result), [result]);
  const score = React.useMemo(() => extractScore(result), [result]);

  const extractFrames = React.useCallback(
    (file: File) => {
      setExtracting(true);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = url;
      video.muted = true;
      video.preload = "auto";

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const times: number[] = [];
        for (let t = 0; t < duration; t += SANIYE_ARALIGI) {
          times.push(t);
          if (times.length >= MAX_FRAMES) break;
        }

        const capturedFrames: string[] = [];
        const capturedBlobs: Blob[] = [];
        let idx = 0;

        const captureNext = () => {
          if (idx >= times.length) {
            setFrames(capturedFrames);
            setFrameBlobs(capturedBlobs);
            setExtracting(false);
            return;
          }
          video.currentTime = times[idx];
        };

        video.onseeked = () => {
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.min(
            video.videoHeight,
            (640 * video.videoHeight) / video.videoWidth,
          );
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          capturedFrames.push(dataUrl);

          canvas.toBlob(
            (blob) => {
              if (blob) capturedBlobs.push(blob);
              idx++;
              captureNext();
            },
            "image/jpeg",
            0.7,
          );
        };

        captureNext();
      };

      video.onerror = () => {
        setExtracting(false);
      };
    },
    [],
  );

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setResult("");
    setFrames([]);
    setFrameBlobs([]);
    extractFrames(file);
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setFrames([]);
    setFrameBlobs([]);
    setResult("");
  };

  const handleAnalyze = async () => {
    if (frameBlobs.length === 0 || isLoading) return;
    setIsLoading(true);
    setResult("");

    try {
      const formData = new FormData();
      formData.append("topic", topic || "");
      formData.append("intervalSec", String(SANIYE_ARALIGI));
      
      frameBlobs.forEach((blob, i) => {
        formData.append("frames", blob, `frame-${i}.jpg`);
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }));
        throw new Error(errorData.error || "Analiz basarisiz");
      }
      
      if (!response.body) throw new Error("Yanit alinamadi");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            let parsed: any;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }

            if (parsed.type === "text-delta" && parsed.delta) {
              fullContent += parsed.delta;
              setResult(fullContent);
            } else if (parsed.type === "text" && parsed.text) {
              fullContent = parsed.text;
              setResult(fullContent);
            } else if (parsed.type === "error" && parsed.errorText) {
              throw new Error(parsed.errorText);
            }
          }
        }
      }
    } catch (err) {
      setResult(
        `Hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      {!videoFile ? (
        <VideoUploadZone 
          topic={topic} 
          setTopic={setTopic} 
          onFileSelect={handleFileSelect} 
          isLoading={extracting} 
        />
      ) : (
        <AnalysisResults
          score={score}
          caption={caption}
          sections={sections}
          result={result}
          isLoading={isLoading}
          videoFile={videoFile}
          frames={frames}
          clearVideo={clearVideo}
          onAnalyze={handleAnalyze}
        />
      )}
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" />
    </div>
  );
}
