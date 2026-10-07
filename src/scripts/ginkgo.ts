// Ginkgo: una hoja dibujada con trazos. Se genera en el build (sin JS en el navegador);
// cada trazo se dibuja con CSS (.trazo) usando su índice --i para escalonarse.
export function ginkgo(venas = 24): string {
  const B = [100, 160], R = 112, A = 1.08;
  const radio = (t: number) =>
    R * (1 - Math.exp(-Math.pow(t / 0.09, 2)) * 0.3 + 0.04 * Math.sin(t * 7 + 0.6) + 0.02 * Math.sin(t * 15));
  const pt = (t: number, r: number) => [B[0] + r * Math.sin(t), B[1] - r * Math.cos(t)];
  const f = (n: number) => n.toFixed(1);
  const izq = pt(-A, radio(-A));
  let borde = `M${B[0]} ${B[1]} Q${B[0] - 40} ${B[1] - 40} ${f(izq[0])} ${f(izq[1])}`;
  for (let t = -A; t <= A + 1e-6; t += 0.03) {
    const p = pt(t, radio(t));
    borde += ` L${f(p[0])} ${f(p[1])}`;
  }
  borde += ` Q${B[0] + 40} ${B[1] - 40} ${B[0]} ${B[1]}`;
  const trazos = [`<path class="trazo" pathLength="1" style="--i:0" stroke-width="1.7" d="${borde}"/>`];
  trazos.push(
    `<path class="trazo" pathLength="1" style="--i:1" stroke-width="1.7" d="M${B[0]} ${B[1]} Q${B[0] - 7} ${B[1] + 32} ${B[0] + 3} ${B[1] + 62}"/>`
  );
  for (let i = 0; i < venas; i++) {
    const t = -A * 0.95 + (2 * A * 0.95 * i) / (venas - 1);
    const ini = pt(t * 0.3, 7), fin = pt(t, radio(t) * 0.965), ctl = pt(t * 0.8, radio(t) * 0.5);
    trazos.push(
      `<path class="trazo" pathLength="1" style="--i:${i + 4}" stroke-width=".75" d="M${f(ini[0])} ${f(ini[1])} Q${f(ctl[0])} ${f(ctl[1])} ${f(fin[0])} ${f(fin[1])}"/>`
    );
  }
  return `<svg viewBox="-10 34 220 192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trazos.join('')}</svg>`;
}
