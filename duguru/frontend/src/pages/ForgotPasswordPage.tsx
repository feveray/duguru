import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");

  return (
    <>
      <Helmet>
        <title>{t("forgotPassword.title")} — duGuru</title>
      </Helmet>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-headline)]">
            {t("forgotPassword.title")}
          </h1>
          <p className="mb-8 text-sm text-[var(--color-paragraph)]">
            {t("forgotPassword.subtitle")}
          </p>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="font-semibold text-[var(--color-link)] hover:underline">
              {t("forgotPassword.backToLogin")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
