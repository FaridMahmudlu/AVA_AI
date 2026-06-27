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
import { InstagramConnectButton } from "@/components/instagram-connect-button";

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
        {/* Instagram Connection via Apify */}
        <InstagramConnectButton variant="profile" />

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
