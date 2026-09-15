// Gera public/icones/icone-192.png e icone-512.png a partir de public/icone.svg.
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(raiz, 'public', 'icone.svg'));
const destino = path.join(raiz, 'public', 'icones');
await mkdir(destino, { recursive: true });

for (const tamanho of [192, 512]) {
  const arquivo = path.join(destino, `icone-${tamanho}.png`);
  await sharp(svg).resize(tamanho, tamanho).png().toFile(arquivo);
  console.log(`gerado ${path.relative(raiz, arquivo)}`);
}
