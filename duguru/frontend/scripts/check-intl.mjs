#!/usr/bin/env node
/**
 * check-intl.mjs — T127 [INFRA]
 *
 * Verifica que todos os usos de datas/horas/números nos fontes TypeScript
 * usam Intl.* com locale explícito ('pt-BR'), não os métodos sem argumento.
 *
 * Padrões proibidos:
 *  - .toLocaleDateString()  sem argumento (deve ser .toLocaleDateString('pt-BR', ...))
 *  - .toLocaleTimeString()  sem argumento
 *  - .toLocaleString()      sem argumento
 *
 * Uso: node scripts/check-intl.mjs
 * Falha com código 1 se encontrar violações (bloqueante no CI).
 */

import { readFileSync } from "fs";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "../src");

// Padrões proibidos: métodos sem argumento de locale
const BANNED_PATTERNS = [
  {
    name: "toLocaleDateString() sem locale",
    regex: /\.toLocaleDateString\(\s*\)/,
    fix: ".toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })",
  },
  {
    name: "toLocaleTimeString() sem locale",
    regex: /\.toLocaleTimeString\(\s*\)/,
    fix: ".toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })",
  },
  {
    name: "toLocaleString() sem locale (em componentes TSX/TS)",
    regex: /\.toLocaleString\(\s*\)/,
    fix: "new Intl.NumberFormat('pt-BR').format(...) ou .toLocaleString('pt-BR')",
  },
];

const files = await glob("**/*.{ts,tsx}", { cwd: SRC_DIR, absolute: true });

/** @type {{ file: string; line: number; pattern: string; fix: string; content: string }[]} */
const violations = [];

for (const file of files) {
  // Ignora arquivos de teste e definições de tipo
  if (file.includes(".test.") || file.includes(".spec.") || file.endsWith(".d.ts")) continue;

  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const relativePath = path.relative(SRC_DIR, file);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Ignora linhas de comentário
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    for (const { name, regex, fix } of BANNED_PATTERNS) {
      if (regex.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          pattern: name,
          fix,
          content: line.trim().slice(0, 100),
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Encontrados ${violations.length} uso(s) de Intl sem locale explícito:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.pattern}`);
    console.error(`    código:  ${v.content}`);
    console.error(`    💡 use:  ${v.fix}\n`);
  }
  console.error("Sempre passe 'pt-BR' como primeiro argumento para garantir formatação consistente.\n");
  process.exit(1);
} else {
  console.log(`✅ Intl check: OK — ${files.length} arquivo(s) verificados, todos usam locale explícito.`);
}
