"use client";

import { useState, useEffect, useCallback } from "react";
import { Instagram, Loader2, CheckCircle2, RefreshCw, Unlink, X, Users, ImageIcon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface InstagramProfile {
  fullName: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
  biography: string;
}

interface ConnectionStatus {
  connected: boolean;
  username?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  profile?: InstagramProfile | null;
}

interface InstagramConnectButtonProps {
  /** Render as a compact pill for the navbar */
  variant?: "navbar" | "profile";
  className?: string;
}

export function InstagramConnectButton({
  variant = "navbar",
  className,
}: InstagramConnectButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    if (!username.trim()) {
      setError("Lütfen Instagram kullanıcı adınızı girin.");
      return;
    }

    setConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bağlantı sırasında bir hata oluştu.");
        return;
      }

      setSuccessMessage("Instagram hesabınız başarıyla bağlandı!");
      setUsername("");
      await fetchStatus();

      // Close dialog after short delay
      setTimeout(() => {
        setDialogOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch {
      setError("Ağ hatası. Lütfen tekrar deneyin.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/instagram/disconnect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bağlantı kesilirken hata oluştu.");
        return;
      }

      setStatus({ connected: false });
      setSuccessMessage("Bağlantı kaldırıldı.");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch {
      setError("Ağ hatası. Lütfen tekrar deneyin.");
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Güncelleme sırasında hata oluştu.");
        return;
      }

      setSuccessMessage("Veriler güncellendi!");
      await fetchStatus();
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch {
      setError("Ağ hatası. Lütfen tekrar deneyin.");
    } finally {
      setSyncing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      </div>
    );
  }

  /* ── Navbar Variant ── */
  if (variant === "navbar") {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              "group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95",
              status.connected
                ? "bg-gradient-to-r from-pink-50 to-violet-50 text-pink-700 border border-pink-200/50 hover:border-pink-300 hover:shadow-sm"
                : "bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:from-pink-600 hover:to-violet-700 shadow-sm hover:shadow-md hover:shadow-pink-500/20",
              className
            )}
          >
            <Instagram
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12",
                status.connected ? "text-pink-600" : "text-white"
              )}
            />
            {status.connected ? (
              <span className="hidden sm:inline">@{status.username}</span>
            ) : (
              <span className="hidden sm:inline">Instagram</span>
            )}
            {status.connected && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
        </DialogTrigger>
        {renderDialogContent()}
      </Dialog>
    );
  }

  /* ── Profile Variant ── */
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  status.connected ? "bg-emerald-500" : "bg-pink-500 animate-pulse"
                }`}
              />
              Instagram Bağlantısı
            </h3>
            <p className="text-xs text-slate-400">
              {status.connected
                ? `@${status.username} hesabı bağlı`
                : "Hesabınızı bağlayarak verilerinizi analiz edin."}
            </p>
          </div>
          <DialogTrigger asChild>
            {status.connected ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 cursor-pointer hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Bağlı
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white border-0 hover:text-white font-medium text-xs rounded-full px-4"
              >
                Hesabı Bağla
              </Button>
            )}
          </DialogTrigger>
        </div>

        {/* Profile stats when connected */}
        {status.connected && status.profile && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-lg bg-white dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
              <Users className="h-4 w-4 text-blue-500 mb-1" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatNumber(status.profile.followersCount)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Takipçi</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
              <ImageIcon className="h-4 w-4 text-emerald-500 mb-1" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatNumber(status.profile.postsCount)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Gönderi</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
              <Heart className="h-4 w-4 text-pink-500 mb-1" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatNumber(status.profile.followsCount)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Takip</span>
            </div>
          </div>
        )}

        {/* Actions when connected */}
        {status.connected && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 text-xs"
            >
              {syncing ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1.5" />
              )}
              {syncing ? "Güncelleniyor..." : "Verileri Güncelle"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={connecting}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Unlink className="h-3 w-3 mr-1.5" />
              Bağlantıyı Kaldır
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
        {successMessage && (
          <p className="text-xs text-emerald-600 font-medium">{successMessage}</p>
        )}
      </div>
      {renderDialogContent()}
    </Dialog>
  );

  function renderDialogContent() {
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-violet-600">
              <Instagram className="h-4 w-4 text-white" />
            </div>
            {status.connected ? "Instagram Hesabınız" : "Instagram Hesabınızı Bağlayın"}
          </DialogTitle>
          <DialogDescription>
            {status.connected
              ? "Bağlı hesabınızı yönetin veya verilerinizi güncelleyin."
              : "Açık (public) Instagram kullanıcı adınızı girerek hesabınızı bağlayın."}
          </DialogDescription>
        </DialogHeader>

        {status.connected ? (
          <div className="space-y-4">
            {/* Connected profile card */}
            {status.profile && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
                {status.profile.profilePicUrl && (
                  <img
                    src={status.profile.profilePicUrl}
                    alt={status.username || ""}
                    className="h-12 w-12 rounded-full object-cover border-2 border-pink-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    @{status.username}
                    {status.profile.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {status.profile.fullName}
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-slate-400">
                      <strong className="text-slate-600">{formatNumber(status.profile.followersCount)}</strong> Takipçi
                    </span>
                    <span className="text-[10px] text-slate-400">
                      <strong className="text-slate-600">{formatNumber(status.profile.postsCount)}</strong> Gönderi
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncing ? "Güncelleniyor..." : "Verileri Güncelle"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={connecting}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Kaldır
              </Button>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center font-medium">{error}</p>
            )}
            {successMessage && (
              <p className="text-xs text-emerald-600 text-center font-medium">{successMessage}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Instagram Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                  @
                </span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  placeholder="kullaniciadi"
                  className="pl-8 h-11"
                  disabled={connecting}
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Sadece açık (public) hesaplar bağlanabilir.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting || !username.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white h-11 font-semibold"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Bağlanıyor...
                </>
              ) : (
                <>
                  <Instagram className="h-4 w-4 mr-2" />
                  Hesabı Bağla
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-800">
                <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{successMessage}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    );
  }
}
