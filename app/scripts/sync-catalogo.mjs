#!/usr/bin/env node
// Copia docs/brain/acoes/acoes.json (fonte de verdade) para
// app/src/dominio/catalogo/acoes.json e grava o sha256 do conteúdo em acoes.hash.
// O teste catalogo.test.ts falha se a cópia estiver dessincronizada do brain.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url)); // app/scripts
const origem = resolve(aqui, '../../docs/brain/acoes/acoes.json');
const destinoDir = resolve(aqui, '../src/dominio/catalogo');
const destino = resolve(destinoDir, 'acoes.json');
const arquivoHash = resolve(destinoDir, 'acoes.hash');

const conteudo = readFileSync(origem);
const hash = createHash('sha256').update(conteudo).digest('hex');

mkdirSync(destinoDir, { recursive: true });
writeFileSync(destino, conteudo);
writeFileSync(arquivoHash, `${hash}\n`);

const json = JSON.parse(conteudo.toString('utf8'));
console.log(
  `Catálogo sincronizado: ${json.acoes.length} ações, ${json.medidas.length} medidas, ${Object.keys(json.variaveis).length} variáveis.`,
);
console.log(`sha256 ${hash}`);
