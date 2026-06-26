"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  username: z.string().min(2, "Kullanıcı adı en az 2 karakter olmalı").max(32),
  socialMediaUsername: z.string().max(100).optional(),
  fieldOfInterest: z.string().max(200).optional(),
  profession: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  instagramConnected: boolean;
  defaultValues: {
    username: string;
    socialMediaUsername: string;
    fieldOfInterest: string;
    profession: string;
  };
};

export function ProfileForm({ defaultValues, instagramConnected }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: defaultValues.username,
      socialMediaUsername: defaultValues.socialMediaUsername,
      fieldOfInterest: defaultValues.fieldOfInterest,
      profession: defaultValues.profession,
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    setSuccess(false);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: values.username,
        socialMediaUsername: values.socialMediaUsername || null,
        fieldOfInterest: values.fieldOfInterest || null,
        profession: values.profession || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      const msg =
        data.error?.username?.[0] ?? data.error ?? "Güncelleme başarısız.";
      setSubmitError(msg);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Instagram Bağlantısı (AVA AI) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${instagramConnected ? "bg-emerald-500" : "bg-pink-500 animate-pulse"}`} />
                Instagram Bağlantısı (AVA AI)
              </h3>
              <p className="text-xs text-slate-400">
                Dil Parmak İzi analizi ve video metrikleri için Instagram hesabınızı bağlayın.
              </p>
            </div>
            {instagramConnected ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
                Bağlı
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/api/auth/instagram";
                }}
                className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white border-0 hover:text-white font-medium text-xs rounded-full px-4"
              >
                Hesabı Bağla
              </Button>
            )}
          </div>
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-primary/50 bg-primary/10">
            <AlertDescription>Profil kaydedildi.</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kullanıcı adı</FormLabel>
              <FormControl>
                <Input placeholder="kullaniciadi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="socialMediaUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sosyal medya kullanıcı adım</FormLabel>
              <FormControl>
                <Input placeholder="@kullaniciadi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fieldOfInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İlgilendiğim alan</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Pazarlama, E-ticaret" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesleğim</FormLabel>
              <FormControl>
                <Input placeholder="Örn: İçerik Üreticisi, Girişimci" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </Form>
  );
}
