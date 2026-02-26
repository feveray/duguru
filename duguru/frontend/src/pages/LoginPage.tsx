import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/auth/LoginForm";

export default function LoginPage() {
  const { t } = useTranslation("auth");

  return (
    <>
      <Helmet>
        <title>{t("login.title")} — duGuru</title>
        <meta name="description" content="Entre na sua conta duGuru e acesse seu mapa astral, horóscopo e compatibilidade." />
        <link rel="canonical" href="https://duguru.app/login" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://duguru.app/login" />
        <meta property="og:title" content="Entrar — duGuru" />
        <meta property="og:description" content="Entre na sua conta duGuru para acessar seu mapa astral e horóscopo personalizado." />
        <meta property="og:image" content="https://duguru.app/icons/icon.svg" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-headline)]">
            {t("login.title")}
          </h1>
          <p className="mb-8 text-sm text-[var(--color-paragraph)]">
            {t("login.subtitle")}
          </p>
          <LoginForm />
        </div>
      </main>
    </>
  );
}
