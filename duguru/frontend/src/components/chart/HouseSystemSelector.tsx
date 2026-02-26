/**
 * frontend/src/components/chart/HouseSystemSelector.tsx
 *
 * Seletor do sistema de casas. Ao mudar, atualiza o chartStore e,
 * se necessario, o perfil do usuario (via profileService.patch).
 * A nova selecao invalida o cache no backend automaticamente.
 */
import { useTranslation } from "react-i18next";
import { useChartStore } from "../../stores/chartStore";

const HOUSE_SYSTEMS = [
  { value: "P", labelKey: "P" },
  { value: "K", labelKey: "K" },
  { value: "W", labelKey: "W" },
  { value: "E", labelKey: "E" },
  { value: "C", labelKey: "C" },
] as const;

interface Props {
  /** Callback chamado quando o usuario troca de sistema (para re-fetch) */
  onChangeSystem?: (system: string) => void;
}

export function HouseSystemSelector({ onChangeSystem }: Props) {
  const { t } = useTranslation("chart");
  const { houseSystem, setHouseSystem } = useChartStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "P" | "K" | "W" | "E" | "C";
    setHouseSystem(value);
    onChangeSystem?.(value);
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="house-system-select"
        className="text-sm font-medium text-[var(--color-text-muted)]"
      >
        {t("houseSystem.label")}
      </label>
      <select
        id="house-system-select"
        value={houseSystem}
        onChange={handleChange}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        {HOUSE_SYSTEMS.map(({ value, labelKey }) => (
          <option key={value} value={value}>
            {t(`houseSystem.${labelKey}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
