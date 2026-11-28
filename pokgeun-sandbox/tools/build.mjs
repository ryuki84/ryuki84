// src/ 의 파일을 이어 붙여 index.html 을 만들어요.
//   npm run build          → index.html 생성
//   npm run build -- --check → index.html 이 src/ 와 같은지만 확인(다르면 종료 코드 1)
// 게임 코드는 하나의 ES 모듈(최상위 await 사용)이라 실행 중 여러 파일로 나눌 수 없어요.
// 그래서 편집은 src/js/NN-이름.js 에서 하고, 실행·테스트·아티팩트는 합쳐진 index.html 을 써요.
// 파일 이름 앞 번호 순서대로 합쳐요. 파일끼리는 같은 범위(모듈 최상위)를 공유해요.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SRC = path.join(ROOT, 'src');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const parts = fs.readdirSync(path.join(SRC, 'js')).filter(f => /^\d+-[\w-]+\.js$/.test(f)).sort();
const js = parts.map(f => read(path.join('js', f))).join('\n');
const shell = read('shell.html');
for (const m of ['@@CSS@@', '@@JS@@']) if (shell.split(m).length !== 2) throw new Error(`shell.html 에 ${m} 가 정확히 한 번 있어야 해요`);
const out = shell.replace('@@CSS@@', () => read('style.css')).replace('@@JS@@', () => js);
const dst = path.join(ROOT, 'index.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
  if (cur !== out) { console.error('index.html 이 src/ 와 달라요. npm run build 를 실행하세요.'); process.exit(1); }
  console.log(`index.html 최신 (${parts.length}개 파일)`);
} else {
  fs.writeFileSync(dst, out);
  console.log(`index.html 생성 (${parts.length}개 파일, ${out.split('\n').length}줄)`);
}
