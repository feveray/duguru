import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../ui/Toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

type FormValues = z.infer<typeof schema>;

type FieldErrors = Partial<Record<keyof FormValues, string>>;

export function LoginForm() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const { toast } = useToast();

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const err of parsed.error.issues) {
        const key = err.path[0] as keyof FormValues;
        fieldErrors[key] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("errors.generic");
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="email"
        type="email"
        label={t("login.email")}
        autoComplete="email"
        value={values.email}
        onChange={(e) => { set("email", e.target.value); }}
        error={errors.email}
        required
      />

      <Input
        id="password"
        type="password"
        label={t("login.password")}
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => { set("password", e.target.value); }}
        error={errors.password}
        required
      />

      <div className="flex justify-end">
        <Link
          to="/esqueci-senha"
          className="text-sm text-[var(--color-link)] hover:underline"
        >
          {t("login.forgotPassword")}
        </Link>
      </div>

      <Button type="submit" variant="primary" loading={loading} className="w-full">
        {t("login.submit")}
      </Button>

      <p className="text-center text-sm text-[var(--color-paragraph)]">
        {t("login.noAccount")}{" "}
        <Link to="/cadastro" className="font-semibold text-[var(--color-link)] hover:underline">
          {t("login.createAccount")}
        </Link>
      </p>
    </form>
  );
}
