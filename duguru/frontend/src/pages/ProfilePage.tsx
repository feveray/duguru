import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ProfileForm } from "../components/profile/ProfileForm";
import { AvatarUpload } from "../components/profile/AvatarUpload";
import { SkeletonAvatar, SkeletonCard } from "../components/ui/Skeleton";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  birthDate: string;
  birthTime?: string | null;
  birthCity: string;
  birthCountry: string;
  birthLat: number;
  birthLon: number;
  timezone: string;
  houseSystem: string;
  sunSign?: string | null;
  ascendant?: string | null;
  onboardingDone: boolean;
}

export default function ProfilePage() {
  const { t } = useTranslation("profile");
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { canInstall, promptInstall } = usePWAInstall();

  useEffect(() => {
    api.get<{ user: ProfileData }>("/profile")
      .then((res) => { setProfile(res.data.user); })
      .catch(() => { /* handled by interceptor */ })
      .finally(() => { setLoading(false); });
  }, []);

  return (
    <>
      <Helmet>
        <title>{t("title")} — duGuru</title>
      </Helmet>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-[var(--color-headline)]">
          {t("title")}
        </h1>

        {loading ? (
          <div className="flex flex-col items-center gap-6">
            <SkeletonAvatar size="6rem" />
            <SkeletonCard />
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-8">
            <AvatarUpload currentAvatarUrl={user?.avatarUrl ?? profile.avatarUrl} />
            <ProfileForm initialData={profile} />
          </div>
        ) : (
          <p className="text-[var(--color-error)]">{t("form.saveError")}</p>
        )}

        {/* PWA Install Button — visível apenas quando o navegador suporta instalação */}
        {canInstall && (
          <div className="mt-6 rounded-xl border border-[var(--color-main)] bg-[var(--color-main)] p-4">
            <p className="mb-3 text-sm text-[var(--color-paragraph)]">
              {t("pwaInstallHint")}
            </p>
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-button)] px-4 py-2 text-sm font-semibold text-[var(--color-button-text)] transition-opacity hover:opacity-90 min-h-[44px]"
            >
              <span aria-hidden="true">📲</span>
              {t("installApp")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
