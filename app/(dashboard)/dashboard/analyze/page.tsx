"use client";

import { useState } from "react";
import { VideoUploadZone } from "@/components/video-upload-zone";
import { AnalysisResults } from "@/components/analysis-results";

export default function AnalyzePage() {
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  return (
    <div className="flex flex-col space-y-8 pb-12">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Video Analiz Motoru</h1>
        <p className="text-muted-foreground">
          Süni zəka dəstəkli analiz ilə videolarınızı təkmilləşdirin və baxış sayınızı artırın.
        </p>
      </div>

      {!isAnalyzed ? (
        <VideoUploadZone onAnalyze={() => setIsAnalyzed(true)} />
      ) : (
        <AnalysisResults />
      )}
    </div>
  );
}
