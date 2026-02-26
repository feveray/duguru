import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";

/**
 * Sidebar — Menu lateral visível apenas em ≥ 1024 px.
 *
 * Exibe 5 itens de navegação + avatar + nome do usuário.
 * a11y: role="navigation", aria-label="Menu lateral".
 */
export function Sidebar() {
  const { t } = useTranslation("common");
  const user = useAuthStore((s) => s.user);

  const items: { to: string; label: string; icon: string }[] = [
    { to: "/",                label: t("nav.home"),          icon: "🏠" },
    { to: "/mapa-natal",      label: t("nav.chart"),         icon: "🌌" },
    { to: "/horoscopo",       label: t("nav.horoscope"),     icon: "⭐" },
    { to: "/compatibilidade", label: t("nav.compatibility"), icon: "💫" },
    { to: "/perfil",          label: t("nav.profile"),       icon: "👤" },
  ];

  return (
    <aside
      role="navigation"
      aria-label={t("nav.sidebarLabel", "Menu lateral")}
      className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-[var(--color-main)] lg:bg-[var(--color-bg)] lg:min-h-dvh"
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[var(--color-main)]">
        <span className="text-3xl" aria-hidden="true">🔮</span>
        <span className="font-display text-xl font-bold text-[var(--color-headline)]">
          <span className="font-light">du</span>Guru
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                isActive
                  ? "bg-[var(--color-highlight)] bg-opacity-15 text-[var(--color-highlight)]"
                  : "text-[var(--color-paragraph)] hover:bg-[var(--color-main)] hover:text-[var(--color-headline)]",
              ].join(" ")
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="flex items-center gap-3 border-t border-[var(--color-main)] px-4 py-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={t("nav.avatarAlt", { name: user.name })}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-highlight)] text-sm font-bold text-[var(--color-bg)]"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-headline)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--color-paragraph)]">{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
