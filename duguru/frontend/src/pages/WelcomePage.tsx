import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

/**
 * WelcomePage — Tela de boas-vindas (pública).
 * Exibe logo, mascote e botões de acesso/cadastro.
 * (Implementação completa: T049)
 */
export default function WelcomePage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>duGuru — Astrologia Pessoal</title>
        <meta name="description" content="Descubra seu mapa astral, horóscopo personalizado e compatibilidade com base em cálculos astronômicos reais." />
        <link rel="canonical" href="https://duguru.app/boas-vindas" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://duguru.app/boas-vindas" />
        <meta property="og:title" content="duGuru — Astrologia Pessoal" />
        <meta property="og:description" content="Mapa astral detalhado, horóscopo diário personalizado e compatibilidade entre signos. Grátis e baseado em cálculos astronômicos reais." />
        <meta property="og:image" content="https://duguru.app/icons/icon.svg" />
        <meta property="og:locale" content="pt_BR" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="duGuru — Astrologia Pessoal" />
        <meta name="twitter:description" content="Mapa astral detalhado, horóscopo personalizado e compatibilidade. Grátis." />
        <meta name="twitter:image" content="https://duguru.app/icons/icon.svg" />
      </Helmet>

      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[var(--color-bg)] px-6 py-12 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-7xl" aria-hidden="true">🔮</span>
          <h1 className="font-display text-4xl font-bold text-[var(--color-headline)]">
            <span className="font-light">du</span>Guru
          </h1>
          <p className="text-[var(--color-paragraph)]">
            Astrologia pessoal feita para você
          </p>
        </div>

        {/* Mascote placeholder */}
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full bg-[var(--color-tertiary)] text-7xl"
          role="img"
          aria-label="Mascote duGuru"
        >
          👽
        </div>

        {/* Actions */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link to="/cadastro" className="btn-primary text-center block w-full">
            {t("auth.register.submit")}
          </Link>
          <Link to="/login" className="btn-secondary text-center block w-full">
            {t("auth.login.title")}
          </Link>
        </div>
      </main>
    </>
  );
}
