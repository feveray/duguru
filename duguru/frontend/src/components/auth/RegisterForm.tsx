import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../ui/Toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { BirthPlaceInput } from "./BirthPlaceInput";
import type { GeocodingResult } from "../../services/geocodingService";

/* ─── Schema de validação ─────────────────────────────────────── */

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail inválido."),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres.")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Deve conter ao menos um número."),
  birthDate: z.string().min(1, "Data de nascimento obrigatória."),
  birthTime: z.string().optional(),
  birthCity: z.string().min(1, "Local de nascimento obrigatório."),
  birthCountry: z.string().min(1),
  birthLat: z.number(),
  birthLon: z.number(),
  timezone: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

/* ─── Componente ─────────────────────────────────────────────── */

export function RegisterForm() {
  const { t } = useTranslation("auth");
  const { register } = useAuth();
  const { toast } = useToast();

  const [values, setValues] = useState<Partial<FormValues>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [noTime, setNoTime] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handlePlaceSelect(place: GeocodingResult) {
    setValues((prev) => ({
      ...prev,
      birthCity: place.city,
      birthCountry: place.country,
      birthLat: place.lat,
      birthLon: place.lon,
      timezone: place.timezone,
    }));
    setErrors((prev) => { const { birthCity: _bc, ...rest } = prev; return rest; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      ...values,
      birthTime: noTime ? undefined : values.birthTime,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const err of parsed.error.issues) {
        const key = err.path[0] as keyof FormValues;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        ...parsed.data,
        birthTime: noTime ? null : (parsed.data.birthTime ?? null),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errors.generic");
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="name"
        label={t("register.name")}
        autoComplete="name"
        value={values.name ?? ""}
        onChange={(e) => { set("name", e.target.value); }}
        error={errors.name}
        required
      />

      <Input
        id="email"
        type="email"
        label={t("register.email")}
        autoComplete="email"
        value={values.email ?? ""}
        onChange={(e) => { set("email", e.target.value); }}
        error={errors.email}
        required
      />

      <Input
        id="password"
        type="password"
        label={t("register.password")}
        autoComplete="new-password"
        value={values.password ?? ""}
        onChange={(e) => { set("password", e.target.value); }}
        error={errors.password}
        hint={t("register.passwordHint")}
        required
      />

      <Input
        id="birthDate"
        type="date"
        label={t("register.birthDate")}
        value={values.birthDate ?? ""}
        onChange={(e) => { set("birthDate", e.target.value); }}
        error={errors.birthDate}
        required
      />

      {/* Horário de nascimento */}
      <div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-paragraph)] mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noTime}
            onChange={(e) => { setNoTime(e.target.checked); }}
            className="rounded border-[var(--color-border)] accent-[var(--color-button)]"
          />
          {t("register.noTime")}
        </label>
        {!noTime && (
          <Input
            id="birthTime"
            type="time"
            label={t("register.birthTime")}
            value={values.birthTime ?? ""}
            onChange={(e) => { set("birthTime", e.target.value); }}
            error={errors.birthTime}
          />
        )}
      </div>

      {/* Local de nascimento com autocomplete */}
      <BirthPlaceInput
        onSelect={handlePlaceSelect}
        error={errors.birthCity}
      />

      <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
        {t("register.submit")}
      </Button>

      <p className="text-center text-sm text-[var(--color-paragraph)]">
        {t("register.hasAccount")}{" "}
        <Link to="/login" className="font-semibold text-[var(--color-link)] hover:underline">
          {t("register.login")}
        </Link>
      </p>
    </form>
  );
}
