import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * BottomNav — Barra de navegação inferior para dispositivos móveis (< 1024 px).
 *
 * 5 destinos: Home, Mapa Astral, Horóscopo, Compatibilidade, Perfil.
 * Item ativo exibe `--color-highlight`.
 * a11y: role="navigation", aria-label, aria-current="page".
 */
export function BottomNav() {
  const { t } = useTranslation("common");

  const items: { to: string; label: string; icon: string }[] = [
    { to: "/",                label: t("nav.home"),          icon: "🏠" },
    { to: "/mapa-natal",      label: t("nav.chart"),         icon: "🌌" },
    { to: "/horoscopo",       label: t("nav.horoscope"),     icon: "⭐" },
    { to: "/compatibilidade", label: t("nav.compatibility"), icon: "💫" },
    { to: "/perfil",          label: t("nav.profile"),       icon: "👤" },
  ];

  return (
    <nav
      role="navigation"
      aria-label={t("nav.ariaLabel")}
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-[var(--color-main)] bg-[var(--color-bg)] lg:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          aria-label={item.label}
          className={({ isActive }) =>
            [
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors min-h-[44px]",
              isActive
                ? "text-[var(--color-highlight)] font-semibold"
                : "text-[var(--color-paragraph)] hover:text-[var(--color-headline)]",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
              <span className={isActive ? "text-[var(--color-highlight)]" : ""}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
