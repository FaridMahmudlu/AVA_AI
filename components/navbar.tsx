"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  LogOut,
  Instagram,
  Sparkles,
  BarChart3,
  Video,
  MessageSquareText,
  ChevronDown,
  Home,
  Settings,
  Zap,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AvalabsLogo from "@/public/avalabs.png";
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { InstagramConnectButton } from "@/components/instagram-connect-button";


type SessionUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

const NAV_SECTIONS = [
  { id: "features", label: "Hizmetler" },
  { id: "how-it-works", label: "Nasıl Çalışır" },
  { id: "pricing", label: "Paketler" },
];

const TOOL_LINKS = [
  {
    href: "/demo/plan",
    icon: <MessageSquareText className="h-4 w-4" />,
    label: "İçerik Oluştur",
    desc: "Senaryo, hook ve diyalog hazırlayın",
    color: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50",
  },
  {
    href: "/demo/analyze",
    icon: <BarChart3 className="h-4 w-4" />,
    label: "Video Skorla",
    desc: "Videonuzu yükleyin, puan alın",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
  },
  {
    href: "/demo",
    icon: <Video className="h-4 w-4" />,
    label: "Fikir Havuzu",
    desc: "Hazır video fikirleri keşfedin",
    color: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-50",
  },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const isLoggedIn = isSignedIn;
  const username = user?.username || user?.firstName || "Kullanıcı";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatarFallback = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      if (!user) {
        const sections = NAV_SECTIONS.map((s) => ({ id: s.id, el: document.getElementById(s.id) }));
        let current = "";
        for (const s of sections) {
          if (s.el) { const r = s.el.getBoundingClientRect(); if (r.top <= 120 && r.bottom > 120) current = s.id; }
        }
        setActiveSection(current);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoggedIn]);
  const isActive = (href: string) => href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const openTools = () => {
    if (toolsTimeout.current) clearTimeout(toolsTimeout.current);
    setToolsOpen(true);
  };
  const closeTools = () => {
    toolsTimeout.current = setTimeout(() => setToolsOpen(false), 150);
  };

  /* ═══════════════════════════════════════════
     LOGGED-IN NAVBAR
     ═══════════════════════════════════════════ */
  if (isLoggedIn) {
    return (
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrolled
            ? "bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
            : "bg-white/50 backdrop-blur-xl border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* ── Left: Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <Image
                src={AvalabsLogo}
                alt="Avalabs"
                width={72}
                height={72}
                className="h-9 w-9 object-contain transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-white transition-transform duration-300 group-hover:scale-125" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Avalabs
            </span>
          </Link>

          {/* ── Center: Navigation ── */}
          <div className="hidden items-center lg:flex">
            <div className="flex items-center rounded-full bg-slate-100/60 p-1 gap-0.5 border border-slate-200/40">
              {/* Kontrol Paneli */}
              <Link
                href="/dashboard"
                className={`group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                  isActive("/dashboard")
                    ? "text-slate-900 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                {isActive("/dashboard") && (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/50 -z-10 animate-in fade-in zoom-in-95 duration-300" />
                )}
                <LayoutDashboard className="relative z-10 h-3.5 w-3.5 transition-transform duration-300" />
                <span className="relative z-10">Kontrol Paneli</span>
              </Link>

              {/* AI Araçları */}
              <div
                className="relative"
                onMouseEnter={openTools}
                onMouseLeave={closeTools}
              >
                <button
                  type="button"
                  className={`group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                    toolsOpen || ["/demo", "/demo/plan", "/demo/analyze"].some((p) => isActive(p))
                      ? "text-slate-900 scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  {(toolsOpen || ["/demo", "/demo/plan", "/demo/analyze"].some((p) => isActive(p))) && (
                    <span className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/50 -z-10 animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  <Sparkles className={`relative z-10 h-3.5 w-3.5 transition-all duration-300 ${toolsOpen ? "text-primary rotate-12" : ""}`} />
                  <span className="relative z-10">AI Araçları</span>
                  <ChevronDown className={`relative z-10 h-3 w-3 transition-transform duration-300 ${toolsOpen ? "rotate-180" : ""}`} />
                </button>

                {/* ── Dropdown with bridge area ── */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-300 ease-out ${
                    toolsOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
                  }`}
                >
                  <div className={`w-80 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ${toolsOpen ? "translate-y-0 scale-100" : "-translate-y-3 scale-95"}`}>
                    <div className="px-3 py-2 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Yapay Zeka Araçları</p>
                    </div>
                    {TOOL_LINKS.map((t, i) => (
                      <Link
                        key={t.href}
                        href={t.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-slate-50 group/t"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-sm transition-all duration-300 group-hover/t:scale-110 group-hover/t:shadow-md group-hover/t:rotate-3`}>
                          {t.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                            <ArrowUpRight className="h-3 w-3 text-slate-300 transition-all duration-200 group-hover/t:text-slate-500 group-hover/t:translate-x-0.5 group-hover/t:-translate-y-0.5" />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{t.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sosyal Medya */}
              <Link
                href="/info"
                className={`group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                  isActive("/info")
                    ? "text-slate-900 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                {isActive("/info") && (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/50 -z-10 animate-in fade-in zoom-in-95 duration-300" />
                )}
                <Instagram className="relative z-10 h-3.5 w-3.5 transition-transform duration-300" />
                <span className="relative z-10">Sosyal Medya</span>
              </Link>
            </div>
          </div>

          {/* ── Right: Instagram + Pro CTA + Profile ── */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* Instagram Connect */}
            <InstagramConnectButton variant="navbar" />

            {/* Pro upgrade */}
            <Link
              href="/#pricing"
              className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.8),transparent_60%)]" />
              <Zap className="h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">Pro&apos;ya Yükselt</span>
            </Link>

            {/* Profile pill */}
            <UserButton />
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="text-slate-700 lg:hidden active:scale-75 transition-all duration-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="relative h-5 w-5">
              <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}`} />
              <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50"}`} />
            </div>
          </button>
        </nav>

        {/* ── Mobile menu (logged-in) ── */}
        <div
          className={`overflow-hidden border-t bg-white/95 backdrop-blur-2xl lg:hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            mobileOpen ? "max-h-[700px] opacity-100 border-slate-200" : "max-h-0 opacity-0 border-transparent"
          }`}
        >
          <div className="flex flex-col px-6 py-5">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 p-3 mb-4">
              <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2">
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-blue-600 text-white font-bold">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-800">{username}</p>
                <p className="text-[11px] text-slate-400">{email}</p>
              </div>
            </div>

            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${isActive("/dashboard") ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <LayoutDashboard className="h-4 w-4" /> Kontrol Paneli
            </Link>

            <p className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">AI Araçları</p>
            {TOOL_LINKS.map((t) => (
              <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-all duration-200">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white`}>{t.icon}</div>
                <div><p className="font-medium text-slate-700">{t.label}</p><p className="text-[11px] text-slate-400">{t.desc}</p></div>
              </Link>
            ))}

            <Link href="/info" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${isActive("/info") ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <Instagram className="h-4 w-4" /> Sosyal Medya
            </Link>

            <p className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Instagram</p>
            <div className="px-3">
              <InstagramConnectButton variant="profile" />
            </div>

            <div className="my-3 h-px bg-slate-100" />
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl"><Settings className="h-4 w-4" /> Hesap Bilgilerim</Link>
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl"><Home className="h-4 w-4" /> Ana Sayfaya Dön</Link>
            <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex w-full items-center gap-3 px-3 py-3 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><LogOut className="h-4 w-4" /> Oturumu Kapat</button>

            <div className="mt-3">
              <Link href="/#pricing" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg active:scale-[0.97]">
                <Crown className="h-4 w-4" /> Pro&apos;ya Yükselt
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  /* ═══════════════════════════════════════════
     GUEST NAVBAR (matches logged-in layout)
     ═══════════════════════════════════════════ */
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        scrolled
          ? "bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
          : "bg-white/50 backdrop-blur-xl border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* ── Left: Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative">
            <Image
              src={AvalabsLogo}
              alt="Avalabs"
              width={72}
              height={72}
              className="h-9 w-9 object-contain transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Avalabs
          </span>
        </Link>

        {/* ── Center: Navigation (pill-style, same as logged-in) ── */}
        <div className="hidden items-center lg:flex">
          <div className="flex items-center rounded-full bg-slate-100/60 p-1 gap-0.5 border border-slate-200/40">
            {/* Kontrol Paneli */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                isActive("/dashboard")
                  ? "bg-white text-slate-900 shadow-[0_1px_6px_rgba(0,0,0,0.08)] scale-[1.02]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 transition-transform duration-300" />
              Kontrol Paneli
            </Link>

            {/* AI Araçları */}
            <div
              className="relative"
              onMouseEnter={openTools}
              onMouseLeave={closeTools}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                  toolsOpen || ["/demo", "/demo/plan", "/demo/analyze"].some((p) => isActive(p))
                    ? "bg-white text-slate-900 shadow-[0_1px_6px_rgba(0,0,0,0.08)] scale-[1.02]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                <Sparkles className={`h-3.5 w-3.5 transition-all duration-300 ${toolsOpen ? "text-primary rotate-12" : ""}`} />
                AI Araçları
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${toolsOpen ? "rotate-180" : ""}`} />
              </button>

              {/* ── Dropdown with bridge area ── */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-300 ease-out ${
                  toolsOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
                }`}
              >
                <div className={`w-80 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ${toolsOpen ? "translate-y-0 scale-100" : "-translate-y-3 scale-95"}`}>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Yapay Zeka Araçları</p>
                  </div>
                  {TOOL_LINKS.map((t, i) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-slate-50 group/t"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-sm transition-all duration-300 group-hover/t:scale-110 group-hover/t:shadow-md group-hover/t:rotate-3`}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                          <ArrowUpRight className="h-3 w-3 text-slate-300 transition-all duration-200 group-hover/t:text-slate-500 group-hover/t:translate-x-0.5 group-hover/t:-translate-y-0.5" />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{t.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sosyal Medya */}
            <Link
              href="/info"
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
                isActive("/info")
                  ? "bg-white text-slate-900 shadow-[0_1px_6px_rgba(0,0,0,0.08)] scale-[1.02]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <Instagram className="h-3.5 w-3.5 transition-transform duration-300" />
              Sosyal Medya
            </Link>
          </div>
        </div>

        {/* ── Right: Auth buttons ── */}
        <div className="hidden items-center gap-3 lg:flex">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 rounded-full text-[13px] transition-all duration-300 hover:scale-[1.03]">
              Giriş Yap
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/20 shadow-sm cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Sparkles className="h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">Hemen Dene</span>
            </button>
          </SignUpButton>
        </div>

        {/* Mobile toggle */}
        <button type="button" className="text-slate-700 lg:hidden active:scale-75 transition-all duration-300" onClick={() => setMobileOpen(!mobileOpen)}>
          <div className="relative h-5 w-5">
            <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}`} />
            <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50"}`} />
          </div>
        </button>
      </nav>

      {/* ── Mobile menu (guest, matching logged-in style) ── */}
      <div className={`overflow-hidden border-t bg-white/95 backdrop-blur-2xl lg:hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? "max-h-[600px] opacity-100 border-slate-200" : "max-h-0 opacity-0 border-transparent"}`}>
        <div className="flex flex-col px-6 py-5">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${isActive("/dashboard") ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
            <LayoutDashboard className="h-4 w-4" /> Kontrol Paneli
          </Link>

          <p className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">AI Araçları</p>
          {TOOL_LINKS.map((t) => (
            <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-all duration-200">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white`}>{t.icon}</div>
              <div><p className="font-medium text-slate-700">{t.label}</p><p className="text-[11px] text-slate-400">{t.desc}</p></div>
            </Link>
          ))}

          <Link href="/info" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${isActive("/info") ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
            <Instagram className="h-4 w-4" /> Sosyal Medya
          </Link>

          <div className="my-3 h-px bg-slate-100" />
          <div className="flex flex-col gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="justify-start text-slate-500 w-full" onClick={() => setMobileOpen(false)}>
                Giriş Yap
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 w-full cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" /> Hemen Dene
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </header>
  );
}
