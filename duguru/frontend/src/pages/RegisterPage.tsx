import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { RegisterForm } from "../components/auth/RegisterForm";

export default function RegisterPage() {
  const { t } = useTranslation("auth");

  return (
    <>
      <Helmet>
        <title>{t("register.title")} — duGuru</title>
        <meta name="description" content="Crie sua conta duGuru gratuitamente e descubra seu mapa astral personalizado." />
        <link rel="canonical" href="https://duguru.app/cadastro" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://duguru.app/cadastro" />
        <meta property="og:title" content="Criar Conta — duGuru" />
        <meta property="og:description" content="Registre-se gratuitamente e obtenha seu mapa astral, horóscopo diário e compatibilidade." />
        <meta property="og:image" content="https://duguru.app/icons/icon.svg" />
      </Helmet>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-headline)]">
            {t("register.title")}
          </h1>
          <p className="mb-8 text-sm text-[var(--color-paragraph)]">
            {t("register.subtitle")}
          </p>
          <RegisterForm />
        </div>
      </main>
    </>
  );
}
