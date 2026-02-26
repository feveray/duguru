import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "../ui/Toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { BirthPlaceInput } from "../auth/BirthPlaceInput";
import { api } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import type { GeocodingResult } from "../../services/geocodingService";

const schema = z.object({
  name: z.string().min(2).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  birthCity: z.string().min(1),
  birthCountry: z.string().min(1),
  birthLat: z.number(),
  birthLon: z.number(),
  timezone: z.string().min(1),
  houseSystem: z.enum(["P", "K", "W", "E", "C"]),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

interface ProfileData {
  name: string;
  birthDate: string;
  birthTime?: string | null;
  birthCity: string;
  birthCountry: string;
  birthLat: number;
  birthLon: number;
  timezone: string;
  houseSystem: string;
}

interface Props {
  initialData: ProfileData;
}

export function ProfileForm({ initialData }: Props) {
  const { t } = useTranslation("profile");
  const { toast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [values, setValues] = useState<FormValues>({
    name: initialData.name,
    birthDate: typeof initialData.birthDate === "string"
      ? initialData.birthDate.substring(0, 10)
      : "",
    birthTime: initialData.birthTime ?? null,
    birthCity: initialData.birthCity,
    birthCountry: initialData.birthCountry,
    birthLat: initialData.birthLat,
    birthLon: initialData.birthLon,
    timezone: initialData.timezone,
    houseSystem: (initialData.houseSystem as "P" | "K" | "W" | "E" | "C") ?? "P",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [noTime, setNoTime] = useState(!initialData.birthTime);

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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      ...values,
      birthTime: noTime ? null : values.birthTime,
    });

    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const err of parsed.error.issues) {
        const k = err.path[0] as keyof FormValues;
        if (!fe[k]) fe[k] = err.message;
      }
      setErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const res = await api.patch<{ user: { name: string; email: string; avatarUrl?: string | null; sunSign?: string | null; ascendant?: string | null; onboardingDone: boolean } }>(
        "/profile",
        parsed.data,
      );
      if (user) {
        setUser({ ...user, ...res.data.user });
      }
      toast(t("form.saved"), "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("form.saveError");
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="name"
        label={t("form.name")}
        value={values.name}
        onChange={(e) => { set("name", e.target.value); }}
        error={errors.name}
        required
      />

      <Input
        id="birthDate"
        type="date"
        label={t("form.birthDate")}
        value={values.birthDate}
        onChange={(e) => { set("birthDate", e.target.value); }}
        error={errors.birthDate}
        required
      />

      <div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-paragraph)] mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noTime}
            onChange={(e) => { setNoTime(e.target.checked); }}
            className="rounded border-[var(--color-border)] accent-[var(--color-button)]"
          />
          {t("form.noTime")}
        </label>
        {!noTime && (
          <Input
            id="birthTime"
            type="time"
            label={t("form.birthTime")}
            value={values.birthTime ?? ""}
            onChange={(e) => { set("birthTime", e.target.value); }}
            error={errors.birthTime}
          />
        )}
      </div>

      <BirthPlaceInput
        onSelect={handlePlaceSelect}
        error={errors.birthCity}
      />

      <div>
        <label
          htmlFor="houseSystem"
          className="mb-1 block text-sm font-medium text-[var(--color-paragraph)]"
        >
          {t("form.houseSystem")}
        </label>
        <select
          id="houseSystem"
          value={values.houseSystem}
          onChange={(e) => { set("houseSystem", e.target.value as FormValues["houseSystem"]); }}
          className="input-base"
        >
          <option value="P">{t("form.houses.placidus")}</option>
          <option value="K">{t("form.houses.koch")}</option>
          <option value="W">{t("form.houses.wholeSigns")}</option>
          <option value="E">{t("form.houses.equal")}</option>
          <option value="C">{t("form.houses.campanus")}</option>
        </select>
      </div>

      <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
        {t("form.save")}
      </Button>
    </form>
  );
}
