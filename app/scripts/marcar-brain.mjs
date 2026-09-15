// Marca `vira-feature-em: v1` no frontmatter de docs/brain/acoes/<id>.md
// para cada ação de acoes.json que ainda não tem a chave. Idempotente.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const brain = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'brain');
const catalogo = JSON.parse(await readFile(path.join(brain, 'acoes', 'acoes.json'), 'utf8'));

let marcadas = 0;
let jaTinham = 0;
for (const acao of catalogo.acoes) {
  const arquivo = path.join(brain, 'acoes', `${acao.id}.md`);
  const texto = await readFile(arquivo, 'utf8');
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    console.error(`sem frontmatter: ${acao.id}.md`);
    process.exitCode = 1;
    continue;
  }
  if (/^vira-feature-em:/m.test(m[1])) {
    jaTinham++;
    continue;
  }
  const novo = texto.replace(m[0], `---\n${m[1]}\nvira-feature-em: v1\n---\n`);
  await writeFile(arquivo, novo);
  marcadas++;
}
console.log(`${marcadas} nota(s) marcada(s), ${jaTinham} já tinha(m) vira-feature-em`);
