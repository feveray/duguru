import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth");

  return (
    <>
      <Helmet>
        <title>{t("resetPassword.title")} — duGuru</title>
      </Helmet>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 font-display text-3xl font-bold text-[var(--color-headline)]">
            {t("resetPassword.title")}
          </h1>
          <ResetPasswordForm />
        </div>
      </main>
    </>
  );
}
