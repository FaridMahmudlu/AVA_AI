import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Video,
  FileVideo,
  TrendingUp,
  Coins,
  Crown,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
  BarChart3,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

function StatusBadge({ status }: { status: string }) {
  const normStatus = status.toLowerCase();
  if (normStatus === "completed" || normStatus === "tamamlandı") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200/50">
        <CheckCircle2 className="h-3 w-3" /> Tamamlandı
      </span>
    );
  }
  if (normStatus === "processing" || normStatus === "işleniyor") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-200/50">
        <Clock className="h-3 w-3 animate-pulse" /> İşleniyor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
      <AlertCircle className="h-3 w-3" /> {status}
    </span>
  );
}

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  const [videoCount, recentVideos] = await Promise.all([
    prisma.video.count({ where: { ownerId: user.id } }),
    prisma.video.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        originalFilename: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 p-8 text-white shadow-lg shadow-blue-900/10 sm:p-10">
        {/* Decorative background blur */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Tekrar Hoş Geldin, {user.username} 👋
            </h1>
            <p className="mt-2 text-blue-100/90 text-sm sm:text-base max-w-xl">
              İçerik üretim sürecini hızlandır ve videolarının etkileşimini artır. Yeni bir analize başlamaya hazır mısın?
            </p>
          </div>
          <Link 
            href="/dashboard/analyze" 
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-md transition-all hover:bg-slate-50 hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <Play className="h-4 w-4 fill-current" /> Yeni Analiz Başlat
          </Link>
        </div>
      </div>

      {/* ── Stat Cards Grid (4 columns on large devices) ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1 */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Toplam Video</p>
              <p className="text-2xl font-bold text-slate-900">{videoCount}</p>
            </div>
          </div>
        </div>

        {/* Stat 2 (Mocked) */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ortalama Skor</p>
              <p className="text-2xl font-bold text-slate-900">85<span className="text-sm font-normal text-slate-400">/100</span></p>
            </div>
          </div>
        </div>

        {/* Stat 3 (Mocked) */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Kalan Kredi</p>
              <p className="text-2xl font-bold text-slate-900">10<span className="text-sm font-normal text-slate-400">/10</span></p>
            </div>
          </div>
        </div>

        {/* Stat 4 (Mocked) */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Aktif Plan</p>
              <p className="text-2xl font-bold text-slate-900">Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area (2cols list + 1col tools) ── */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        
        {/* Left Column: Recent Videos */}
        <div className="lg:col-span-2">
          <div className="flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Son Analizler</h2>
                <p className="text-sm text-slate-500 mt-1">Sisteme yüklediğiniz en son videoların durumu.</p>
              </div>
              <Link href="/dashboard/analyze" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-blue-700">
                Tümünü Gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="flex-1 p-0">
              {recentVideos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-4 ring-8 ring-slate-50/50">
                    <FileVideo className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Henüz video yüklemediniz</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm">
                    Yapay zeka analizini test etmek ve kanalınızı büyütmek için hemen ilk videonuzu ekleyin.
                  </p>
                  <Link 
                    href="/dashboard/analyze" 
                    className="mt-6 flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-md"
                  >
                    Videonuzu Yükleyin <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentVideos.map((v) => (
                    <li key={v.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 transition-colors hover:bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-105">
                          <Video className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {v.originalFilename}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(v.createdAt), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                        <StatusBadge status={v.status} />
                        <Link href={`/dashboard/analyze`} className="text-sm font-medium text-primary hover:underline">
                          Detaylar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {recentVideos.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-center sm:hidden">
                <Link href="/dashboard/analyze" className="text-sm font-semibold text-primary">Tüm Videoları Gör</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Tools */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Hızlı Araçlar</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Sık kullanılanlara anında erişin.</p>
            
            <div className="flex gap-3 flex-col">
              <Link href="/demo/plan" className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Senaryo Oluştur</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Yeni bir kurgu planla</p>
                </div>
              </Link>

              <Link href="/dashboard/analyze" className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Video Skorla</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Videonuzu analiz edin</p>
                </div>
              </Link>
              
              <Link href="/profile" className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:border-purple-200 hover:bg-purple-50/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-transform group-hover:scale-110">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Profil Analizi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Hesabınızı denetleyin</p>
                </div>
              </Link>
            </div>
            
            <div className="mt-6 rounded-xl bg-slate-900 p-5 text-white">
              <h3 className="font-bold">Yardıma mı ihtiyacınız var?</h3>
              <p className="text-sm mt-1 text-slate-300 opacity-90">Kullanım kılavuzu ve ipuçlarına göz atın.</p>
              <Link href="/info" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-300">
                Dokümantasyon <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
