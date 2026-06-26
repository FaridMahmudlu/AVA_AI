import { getSession } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function ProfilePage() {
  const user = (await getSession()) as any;
  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Hesap bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Üyelik: {format(new Date(user.createdAt), "d MMMM yyyy", { locale: tr })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            instagramConnected={!!(user as any).instagramAccessToken}
            defaultValues={{
              username: user.username,
              socialMediaUsername: user.socialMediaUsername ?? "",
              fieldOfInterest: user.fieldOfInterest ?? "",
              profession: user.profession ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
