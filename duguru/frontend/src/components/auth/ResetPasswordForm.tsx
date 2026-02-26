import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "../ui/Toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { resetPassword } from "../../services/authService";

const schema = z.object({
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres.")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Deve conter ao menos um número."),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

export function ResetPasswordForm() {
  const { t } = useTranslation("auth");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <p role="alert" className="text-[var(--color-error)]">
        {t("resetPassword.invalidLink")}
      </p>
    );
  }

  function set(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const err of parsed.error.issues) {
        const k = err.path[0] as keyof FieldErrors;
        if (!fe[k]) fe[k] = err.message;
      }
      setErrors(fe);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, parsed.data.password);
      setDone(true);
      setTimeout(() => { navigate("/login"); }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errors.generic");
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-xl bg-[var(--color-tertiary)] p-6 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">✅</p>
        <p className="font-semibold text-[var(--color-headline)]">
          {t("resetPassword.successTitle")}
        </p>
        <p className="mt-1 text-sm text-[var(--color-paragraph)]">
          {t("resetPassword.redirecting")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="password"
        type="password"
        label={t("resetPassword.password")}
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => { set("password", e.target.value); }}
        error={errors.password}
        hint={t("register.passwordHint")}
        required
      />

      <Input
        id="confirmPassword"
        type="password"
        label={t("resetPassword.confirmPassword")}
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => { set("confirmPassword", e.target.value); }}
        error={errors.confirmPassword}
        required
      />

      <Button type="submit" variant="primary" loading={loading} className="w-full">
        {t("resetPassword.submit")}
      </Button>
    </form>
  );
}
