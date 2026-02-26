import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "../ui/Toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { forgotPassword } from "../../services/authService";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
});

export function ForgotPasswordForm() {
  const { t } = useTranslation("auth");
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "");
      return;
    }
    setEmailError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toast(t("errors.generic"), "error");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl bg-[var(--color-tertiary)] p-6 text-center text-[var(--color-paragraph)]"
      >
        <p className="text-2xl mb-2" aria-hidden="true">📬</p>
        <p className="font-semibold text-[var(--color-headline)]">
          {t("forgotPassword.successTitle")}
        </p>
        <p className="mt-1 text-sm">{t("forgotPassword.successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="email"
        type="email"
        label={t("forgotPassword.email")}
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError("");
        }}
        error={emailError}
        required
      />

      <Button type="submit" variant="primary" loading={loading} className="w-full">
        {t("forgotPassword.submit")}
      </Button>
    </form>
  );
}
