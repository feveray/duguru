#!/usr/bin/env node
/**
 * check-i18n.mjs — T126 [INFRA]
 *
 * Verifica que nenhum componente .tsx contém strings hardcoded visíveis ao usuário.
 * Falha com código 1 se encontrar violações (usado no CI).
 *
 * Heurísticas de detecção:
 *  - Texto literal dentro de JSX: <Tag>Texto visível</Tag>
 *  - aria-label com string literal: aria-label="..."
 *  - title com string literal (não t(...)): title="..."
 *  - placeholder com string literal: placeholder="..."
 *
 * Exceções permitidas:
 *  - Strings com apenas símbolos/pontuação/emojis/espaço
 *  - Strings dentro de comentários (// ou {/* })
 *  - Referências a t() e useTranslation
 *  - Nomes de componentes
 */

import { readFileSync } from "fs";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "../src");

// Padrões que indicam strings hardcoded suspeitas em JSX/TSX
const SUSPICIOUS_PATTERNS = [
  // Conteúdo texto direto em JSX (≥ 4 caracteres com letras)
  {
    name: "JSX text content",
    regex: />([A-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{3,}[a-zA-ZÀ-ÿ])</,
    description: "Texto literal com letras dentro de JSX",
  },
  // aria-label com string literal (não usando t())
  {
    name: "aria-label hardcoded",
    regex: /aria-label="([A-ZÀ-ÿa-z][a-zA-ZÀ-ÿ\s]{3,})"/,
    description: 'aria-label="..." hardcoded (use t("..."))',
  },
  // placeholder com string literal
  {
    name: "placeholder hardcoded",
    regex: /placeholder="([A-ZÀ-ÿa-z][a-zA-ZÀ-ÿ\s]{3,})"/,
    description: 'placeholder="..." hardcoded (use t("..."))',
  },
  // title attribute com string literal (≥ 4 letras)
  {
    name: "title hardcoded",
    regex: / title="([A-ZÀ-ÿa-z][a-zA-ZÀ-ÿ\s]{3,})"/,
    description: 'title="..." hardcoded (use t("..."))',
  },
];

// Linhas/padrões que são permitidos (allowlist)
const ALLOWED_PATTERNS = [
  /^\s*\/\/.*$/,              // comentário de linha
  /t\(["'][^"']+["']\)/,     // chamada a t()
  /useTranslation/,           // import/uso de hook i18n
  /import .*/,                // linha de import
  /\/\*.*\*\//,               // comentário bloco em linha
  /(duGuru|duguru)/i,         // nome do produto (marca registrada)
  /^\/\*/,                    // início bloco comentário
  /\*\//,                     // fim bloco comentário
  /\* /,                      // linha de comentário bloco
  /{".*"}/,                   // expressão JSX com string
  /\btrue\b|\bfalse\b/,       // booleans
];

const files = await glob("**/*.tsx", { cwd: SRC_DIR, absolute: true });

/** @type {{ file: string; line: number; pattern: string; content: string }[]} */
const violations = [];

for (const file of files) {
  // Ignora arquivos de teste
  if (file.includes(".test.") || file.includes(".spec.")) continue;

  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const relativePath = path.relative(SRC_DIR, file);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Verifica se linha é permitida
    if (ALLOWED_PATTERNS.some((p) => p.test(line))) continue;

    for (const { name, regex, description } of SUSPICIOUS_PATTERNS) {
      const match = regex.exec(line);
      if (match) {
        violations.push({
          file: relativePath,
          line: i + 1,
          pattern: name,
          content: match[0].slice(0, 80),
          description,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Encontradas ${violations.length} string(s) possivelmente hardcoded:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.pattern}]`);
    console.error(`    → ${v.content}`);
    console.error(`    💡 ${v.description}\n`);
  }
  console.error("Corrija usando as chaves do arquivo src/i18n/messages/pt-BR.json\n");
  process.exit(1);
} else {
  console.log(`✅ i18n lint: OK — ${files.length} arquivos TSX verificados, nenhuma string hardcoded encontrada.`);
}
