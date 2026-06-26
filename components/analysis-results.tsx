"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Info, TrendingUp, Volume2, Camera, MessageSquare, Copy, X, Loader2, Film } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

interface AnalysisResultsProps {
  score: number | null;
  caption: string | null;
  sections: { key: string; title: string; content: string }[];
  result: string;
  isLoading: boolean;
  videoFile: File | null;
  frames: string[];
  clearVideo: () => void;
  onAnalyze: () => void;
}

export function AnalysisResults({ score, caption, sections, result, isLoading, videoFile, frames, clearVideo, onAnalyze }: AnalysisResultsProps) {
  const [captionCopied, setCaptionCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const copyCaption = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 1200);
    } catch {}
  };

  const scoreLabel = score === null ? "" : score >= 80 ? "Güclü" : score >= 60 ? "Orta" : "Zəif";

  function niceTextBlock(text: string) {
    const t = (text || "").trim();
    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^(\-|\d+\.)\s+/.test(l));
    if (isList) {
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
          {lines.map((l, i) => (
            <li key={`${i}-${l.slice(0, 12)}`}>
              {l.replace(/^(\-|\d+\.)\s+/, "")}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {t || "-"}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analiz Nəticələri</h2>
          <p className="text-muted-foreground mt-1">Süni zəka tərəfindən çıxarılan detallı performans rəyləri.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Ümumi Xal</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {score !== null ? score : "-"}
              </span>
              <span className="text-xl text-muted-foreground font-medium">/100</span>
            </div>
            {score !== null && <p className={`text-xs font-bold mt-1 ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{scoreLabel}</p>}
          </div>
        </div>
      </div>

      {/* Video Status Card */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-800">
          {frames.map((frame, i) => (
            <div key={i} className="h-16 w-28 shrink-0 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
              <img src={frame} alt="kare" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Film className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{videoFile?.name}</p>
              <p className="text-xs text-slate-500">{(videoFile?.size ? (videoFile.size / (1024 * 1024)).toFixed(1) : 0)} MB • {frames.length} kadr çıxarıldı</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!result && !isLoading && (
               <Button onClick={onAnalyze} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                 Analizi Başlat
               </Button>
            )}
            <Button variant="ghost" onClick={clearVideo} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <X className="h-4 w-4 mr-2" /> İmtina
            </Button>
          </div>
        </div>
      </div>

      {isLoading && !result && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500 animate-pulse">VİDEO SÜNİ ZƏKA İLƏ ANALİZ EDİLİR...</span>
        </div>
      )}

      {(result || isLoading) && (
        <div className="space-y-6">
          <Alert className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div className="flex items-center justify-between">
              <AlertTitle className="text-indigo-800 dark:text-indigo-300 font-bold text-base">Video Xülasəsi və Başlıq Tövsiyəsi</AlertTitle>
              {caption && (
                <Button variant="ghost" size="sm" onClick={copyCaption} className="h-7 px-3 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700">
                  <Copy className="h-3 w-3 mr-1.5" /> {captionCopied ? "Kopyalandı" : "Kopyala"}
                </Button>
              )}
            </div>
            <AlertDescription className="text-indigo-700 dark:text-indigo-400/80 mt-2 text-sm">
              {caption || "Xülasə yaradılır..."}
            </AlertDescription>
          </Alert>

          {result && sections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.filter(s => s.key !== "score" && s.key !== "raw").map((s) => (
                <Card key={s.key} className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
                  <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b py-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      {s.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {niceTextBlock(s.content)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
