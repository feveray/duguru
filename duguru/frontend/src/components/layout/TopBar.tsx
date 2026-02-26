import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";

/**
 * TopBar — Barra superior do duGuru.
 *
 * Exibida em todas as páginas autenticadas, no topo da viewport.
 * Em mobile serve como header; em desktop, é complementar à Sidebar.
 */
export function TopBar() {
  const { t } = useTranslation("common");
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggle } = useThemeStore();

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 backdrop-blur-sm"
      role="banner"
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-xl font-bold text-[var(--color-headline)] no-underline"
        aria-label={t("appName")}
      >
        <span aria-hidden="true">🔮</span>
        <span>
          <span className="font-light">du</span>Guru
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={t("theme.toggle")}
          className="rounded-full p-2 text-[var(--color-paragraph)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-headline)]"
        >
          {theme === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Avatar / Profile link */}
        {user && (
          <Link
            to="/perfil"
            aria-label={t("nav.profile")}
            aria-current={isActive("/perfil") ? "page" : undefined}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-secondary)] text-xs font-bold text-[var(--color-headline)] no-underline"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
