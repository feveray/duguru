#!/usr/bin/env node
/**
 * check-bundle-size.mjs — T123 [INFRA]
 *
 * Verifica que o chunk inicial do build Vite (index-*.js ou main-*.js)
 * está dentro do limite aceitável (≤ 150 KB gzip).
 *
 * Uso: node scripts/check-bundle-size.mjs
 * Requer `npm run build` antes de executar.
 *
 * Falha com código 1 se o bundle exceder o limite (bloqueante no CI).
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { createGzip } from "zlib";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import { PassThrough } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist/assets");
const MAX_GZIP_KB = 150;
const MAX_GZIP_BYTES = MAX_GZIP_KB * 1024;

/**
 * Calcula o tamanho gzip de um arquivo.
 * @param {string} filePath
 * @returns {Promise<number>} Tamanho em bytes após compressão gzip
 */
async function getGzipSize(filePath) {
  let size = 0;
  const passThrough = new PassThrough();
  passThrough.on("data", (chunk) => { size += chunk.length; });

  await pipeline(
    createReadStream(filePath),
    createGzip({ level: 9 }),
    passThrough,
  );

  return size;
}

// Procura por chunks de JS na pasta dist/assets
let jsFiles;
try {
  jsFiles = readdirSync(DIST_DIR).filter((f) => f.endsWith(".js"));
} catch {
  console.error(`❌ Pasta dist/assets não encontrada. Execute 'npm run build' primeiro.`);
  process.exit(1);
}

if (jsFiles.length === 0) {
  console.error("❌ Nenhum arquivo JS encontrado em dist/assets.");
  process.exit(1);
}

console.log(`\n📦 Analisando ${jsFiles.length} arquivo(s) JS no bundle...\n`);

// Identifica o maior chunk (provável chunk inicial)
/** @type {{ name: string; rawKb: number; gzipKb: number }[]} */
const results = [];

for (const file of jsFiles) {
  const fullPath = path.join(DIST_DIR, file);
  const rawBytes = statSync(fullPath).size;
  const gzipBytes = await getGzipSize(fullPath);
  results.push({
    name: file,
    rawKb: rawBytes / 1024,
    gzipKb: gzipBytes / 1024,
  });
}

// Ordena por tamanho gzip (maior primeiro)
results.sort((a, b) => b.gzipKb - a.gzipKb);

let hasViolation = false;

for (const { name, rawKb, gzipKb } of results) {
  const isMain = name.startsWith("index") || name.startsWith("main");
  const status = gzipKb > MAX_GZIP_KB && isMain ? "❌" : gzipKb > MAX_GZIP_KB * 0.8 ? "⚠️ " : "✅";
  const flagging = isMain ? " ← chunk inicial" : "";

  console.log(`  ${status} ${name}${flagging}`);
  console.log(`     raw: ${rawKb.toFixed(1)} KB  |  gzip: ${gzipKb.toFixed(1)} KB`);

  if (isMain && gzipKb > MAX_GZIP_KB) {
    hasViolation = true;
    console.error(`\n     ⛔ LIMITE EXCEDIDO: ${gzipKb.toFixed(1)} KB gzip > ${MAX_GZIP_KB} KB permitidos\n`);
  }
}

// Maior chunk total
const largestChunk = results[0];
if (largestChunk && largestChunk.gzipKb > MAX_GZIP_KB) {
  console.log(`\n💡 Dica: Verifique dependências pesadas com 'npx vite-bundle-visualizer' após o build.`);
  console.log(`   Considere code splitting com React.lazy() ou importações dinâmicas.`);
}

if (hasViolation) {
  console.error(`\n❌ Bundle size check FALHOU. O chunk inicial excede ${MAX_GZIP_KB} KB gzip.`);
  process.exit(1);
} else {
  console.log(`\n✅ Bundle size: OK — nenhum chunk inicial excede ${MAX_GZIP_KB} KB gzip.`);
}
