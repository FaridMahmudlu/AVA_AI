"use client";

import { useState, useRef } from "react";
import { UploadCloud, Link as LinkIcon, Video, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface VideoUploadZoneProps {
  topic: string;
  setTopic: (topic: string) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function VideoUploadZone({ topic, setTopic, onFileSelect, isLoading }: VideoUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.includes("video")) {
      setError("Lütfen geçerli bir video dosyası yükleyin (MP4, MOV).");
      return;
    }
    onFileSelect(file);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!link.trim()) {
      setError("Lütfen geçerli bir video linki girin.");
      return;
    }
    setError("Link ile yükleme şu an yapım aşamasındadır. Lütfen cihazınızdan video seçin.");
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Videonuzu Analiz Edin
        </h2>
        <p className="text-muted-foreground text-lg">
          Videonuzu sürükleyip bırakın veya cihazınızdan seçin.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <Input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Video konusu veya ana fikri... (İsteğe bağlı)"
          className="w-full h-12 shadow-sm border-muted-foreground/20 focus-visible:ring-blue-500 transition-all text-base"
          disabled={isLoading}
        />
      </div>

      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-all duration-300 ease-out group cursor-pointer",
          dragActive ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-muted-foreground/25 hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardContent className="p-12 flex flex-col items-center justify-center space-y-6 text-center z-10 relative">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
            {isLoading ? (
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-xl">Videonuzu buraya bırakın veya tıklayın</h3>
            <p className="text-sm text-muted-foreground">
              MP4, MOV formatlarında maksimum 100MB
            </p>
          </div>

          <div className="flex items-center w-full max-w-xs gap-4 my-4" onClick={(e) => e.stopPropagation()}>
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Veya Link İle
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleLinkSubmit} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-sm items-center space-x-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="url" 
                placeholder="Video linkini yapıştırın..." 
                className="pl-9 h-12 shadow-sm border-muted-foreground/20 focus-visible:ring-blue-500 transition-all"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg">
              Yükle
            </Button>
          </form>
        </CardContent>
      </Card>

      <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {[
          { title: "Detaylı Metrikler", desc: "Süni zəka ilə 40 fərqli parametr üzrə dərin təhlil." },
          { title: "Saniyə Əsaslı Rəy", desc: "Videonuzun hansı saniyəsində nə etməli olduğunuzu kəşf edin." },
          { title: "Alqoritm Dostu", desc: "Tövsiyələrlə izlənmə potensialınızı maksimuma çatdırın." }
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
            <Video className="w-6 h-6 text-indigo-500 mb-3" />
            <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
            <p className="text-xs text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
