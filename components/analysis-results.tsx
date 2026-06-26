"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Info, TrendingUp, Volume2, Camera, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalysisMetric {
  id: string;
  name: string;
  score: number; // 1 to 10
  description: string;
  timestamp?: string;
  type?: "success" | "warning" | "error" | "info";
}

interface CategoryData {
  id: string;
  title: string;
  icon: React.ReactNode;
  score: number;
  metrics: AnalysisMetric[];
}

const mockData: CategoryData[] = [
  {
    id: "technical",
    title: "Texniki",
    icon: <Camera className="w-4 h-4" />,
    score: 8.5,
    metrics: [
      { id: "t1", name: "Görüntü Kalitesi", score: 9, description: "1080p veya üzeri çözünürlük tespit edildi.", type: "success" },
      { id: "t2", name: "Işıklandırma", score: 7, description: "Yüz bölgesinde hafif gölgelenmeler var.", timestamp: "0:12", type: "warning" },
      { id: "t3", name: "Kamera Stabilitesi", score: 10, description: "Sarsıntı yok, akıcı görüntüler.", type: "success" },
      { id: "t4", name: "Kadro Uyumu", score: 8, description: "Dikey formata (9:16) uygun.", type: "success" },
    ]
  },
  {
    id: "sound",
    title: "Səs",
    icon: <Volume2 className="w-4 h-4" />,
    score: 6.8,
    metrics: [
      { id: "s1", name: "Ses Netliği", score: 6, description: "Arka plan gürültüsü konuşmayı bastırıyor.", timestamp: "0:03", type: "error" },
      { id: "s2", name: "Ses Yüksekliği", score: 8, description: "Genel ses seviyesi uygun.", type: "success" },
      { id: "s3", name: "Müzik Uyumu", score: 5, description: "Seçilen müzik trend değil ve ses seviyesi yüksek.", timestamp: "0:15", type: "warning" },
      { id: "s4", name: "Diksiyon ve Vurgu", score: 9, description: "Kelimeler anlaşılır ve vurgular doğru.", type: "success" },
    ]
  },
  {
    id: "content",
    title: "Məzmun",
    icon: <MessageSquare className="w-4 h-4" />,
    score: 9.2,
    metrics: [
      { id: "c1", name: "Kanca (Hook) Etkisi", score: 10, description: "İlk 3 saniye çok güçlü ve merak uyandırıcı.", timestamp: "0:00", type: "success" },
      { id: "c2", name: "Hikaye Anlatımı", score: 9, description: "Akıcı ve izleyiciyi tutan bir yapı var.", type: "success" },
      { id: "c3", name: "Harekete Geçirici Mesaj (CTA)", score: 8, description: "Videonun sonunda net bir yönlendirme var.", timestamp: "0:45", type: "success" },
      { id: "c4", name: "Özgünlük", score: 9, description: "İçerik konsepti orijinal ve dikkat çekici.", type: "success" },
    ]
  },
  {
    id: "algorithmic",
    title: "Algoritmik",
    icon: <TrendingUp className="w-4 h-4" />,
    score: 7.5,
    metrics: [
      { id: "a1", name: "İzlenme Süresi Potansiyeli", score: 8, description: "Videonun temposu izleyiciyi sıkmıyor.", type: "success" },
      { id: "a2", name: "Etkileşim Tetikleyicileri", score: 6, description: "Yorum yapmaya teşvik eden sorular eksik.", type: "warning" },
      { id: "a3", name: "Trend Uyumu", score: 7, description: "Konu güncel fakat kullanılan ses eski.", type: "warning" },
      { id: "a4", name: "Tekrar İzlenme Olasılığı", score: 9, description: "Eğitici/değer katan içeriği sayesinde kaydedilme oranı yüksek olabilir.", type: "success" },
    ]
  }
];

export function AnalysisResults() {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analiz Nəticələri</h2>
          <p className="text-muted-foreground mt-1">Videonuzun 40 fərqli parametr üzrə detallı analizi.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Ümumi Xal</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                8.0
              </span>
              <span className="text-xl text-muted-foreground font-medium">/10</span>
            </div>
          </div>
        </div>
      </div>

      <Alert className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
        <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <AlertTitle className="text-indigo-800 dark:text-indigo-300">AVA AI Tövsiyəsi</AlertTitle>
        <AlertDescription className="text-indigo-700 dark:text-indigo-400/80">
          Videonuzun ümumi keyfiyyəti çox yaxşıdır! Ancaq <strong>0:03'dəki səs problemi</strong> izləyicilərin qaçmasına səbəb ola bilər. Arxa plan səsini azaldıb, öz səsinizi ön plana çıxarmanız tövsiyə olunur.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 p-1 bg-slate-100/50 dark:bg-slate-900/50">
          {mockData.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              {category.icon}
              <span>{category.title}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.score}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {mockData.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-none shadow-md overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title} Parametrləri</CardTitle>
                      <CardDescription>Bu kateqoriya üzrə detallı performansınız</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{category.score}</span>
                    <span className="text-muted-foreground text-sm">/10</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {category.metrics.map((metric) => (
                    <div key={metric.id} className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-1">{getTypeIcon(metric.type)}</div>
                          <div>
                            <h4 className="font-semibold text-sm leading-none mb-1">{metric.name}</h4>
                            <p className="text-sm text-muted-foreground">{metric.description}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <span className="font-bold text-sm">{metric.score}</span>
                          <span className="text-muted-foreground text-xs">/10</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Progress 
                          value={metric.score * 10} 
                          className="h-1.5 bg-slate-100 dark:bg-slate-800"
                          indicatorClassName={getScoreColor(metric.score)}
                        />
                        
                        {metric.timestamp && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            Zaman: {metric.timestamp}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
