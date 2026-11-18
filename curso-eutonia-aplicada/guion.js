(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sonido y música: todo sintetizado en el navegador, sin archivos ----------
     «Feel the Miracle», tema para piano en re mayor y compás de tres. El motivo sigue el ritmo de las palabras:
     una nota larga (Feel), una corta (the) y tres que suben (Mi-ra-cle). Forma: introducción, A, B, A' y coda. */
  const NOTAS = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99];   // una campana por sesión, en la misma tonalidad
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = n => { const m = n.match(/^([A-G])(#?)(\d)$/); return 440 * 2 ** ((SEMI[m[1]] + (m[2] ? 1 : 0) + (m[3] - 4) * 12 - 9) / 12); };
  const ACORDES = {            // bajo en el primer tiempo, acorde en el segundo
    G: ['G2', ['B3', 'D4', 'F#4']], D: ['D2', ['A3', 'C#4', 'F#4']], Em: ['E2', ['G3', 'B3', 'D4']], As: ['A2', ['G3', 'D4', 'E4']],
    A: ['A2', ['G3', 'C#4', 'E4']], Bm: ['B2', ['A3', 'D4', 'F#4']], D9: ['D2', ['A3', 'E4', 'F#4']],
  };
  const COMPASES = [           // [acorde, melodía «nota:tiempos»]; «-» es silencio
    ['G', ''], ['D', ''], ['G', ''], ['D', ''],
    ['G', 'F#5:2 E5:1'], ['D', 'D5:1 E5:1 A5:4'], ['G', ''], ['D', '-:2 F#5:1'], ['Em', 'G5:2 F#5:1'], ['As', 'E5:1 D5:1 E5:1'], ['D', 'F#5:3'], ['D', ''],
    ['Bm', 'B5:2 A5:1'], ['G', 'F#5:2 D5:1'], ['Em', 'E5:1 G5:1 B5:1'], ['A', 'A5:3'], ['Bm', 'B5:1 D6:1 C#6:1'], ['G', 'B5:2 F#5:1'], ['As', 'E5:3'], ['A', 'E5:2'],
    ['G', 'F#5:2 E5:1'], ['D', 'D5:1 E5:1 A5:4'], ['G', ''], ['D', '-:2 F#5:1'], ['Em', 'G5:2 F#5:1'], ['As', 'E5:1 D5:1 C#5:1'], ['D9', 'D5:3'], ['D9', '-:1 A5:3'],
    ['G', 'F#4:2 E4:1'], ['D', 'D4:1 E4:1 A4:4'], ['G', ''], ['D9', ''],
  ];
  const PULSO = .92;
  // cada compás con su tempo: respira al final de cada frase y se va deteniendo en la coda
  const pulsoDe = i => PULSO * (i >= 28 ? 1 + (i - 27) * .08 : i % 4 === 3 ? 1.05 : 1);
  const duracionTema = () => COMPASES.reduce((a, _, i) => a + 3 * pulsoDe(i), 0);

  function sala(ctx, destino) {          // eco largo y oscuro: dos retardos que hacen de sala
    const b = ctx.createGain(); b.connect(destino);
    [[.31, .46], [.47, .4]].forEach(([seg, vuelta]) => {
      const d = ctx.createDelay(1.5), g = ctx.createGain(), f = ctx.createBiquadFilter();
      d.delayTime.value = seg; g.gain.value = vuelta; f.type = 'lowpass'; f.frequency.value = 1500;
      b.connect(d); d.connect(f); f.connect(g); g.connect(d); f.connect(destino);
    });
    return b;
  }
  function colchon(ctx, b) {             // un acorde abierto de re que respira por debajo
    const filtro = ctx.createBiquadFilter(), nivel = ctx.createGain(); filtro.type = 'lowpass'; filtro.frequency.value = 700; filtro.Q.value = .4; filtro.connect(nivel); nivel.connect(b);
    [73.42, 110, 146.83, 220, 329.63].forEach((f, i) => [-5, 5].forEach(des => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = des;
      g.gain.value = .02 / (1 + i * .22); lfo.frequency.value = .04 + i * .017 + (des > 0 ? .01 : 0); lg.gain.value = g.gain.value * .8;
      lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(filtro); o.start(); lfo.start();
    }));
    return nivel;
  }
  function tecla(ctx, b, f, vol, t, largo = 5.5) {          // piano apagado
    const g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(Math.min(2400 + f * 2, 6000), t); fl.frequency.exponentialRampToValueAtTime(420 + f * .6, t + 1.8);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .016); g.gain.exponentialRampToValueAtTime(vol * .34, t + .45); g.gain.exponentialRampToValueAtTime(.0001, t + largo);
    [['triangle', 1, 1], ['sine', 2, .26], ['sine', 3.01, .07]].forEach(([tipo, mult, peso]) => {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = tipo; o.frequency.value = f * mult; o.detune.value = (Math.random() - .5) * 5; og.gain.value = peso;
      o.connect(og); og.connect(fl); o.start(t); o.stop(t + largo + .1);
    });
    fl.connect(g); g.connect(b);
  }
  function campanaEn(ctx, b, f, vol, t, largo) {
    [[1, 1], [2.756, .22], [5.4, .07]].forEach(([mult, peso]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * peso, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + largo / mult ** .5);
      o.connect(g); g.connect(b); o.start(t); o.stop(t + largo + .1);
    });
  }
  function programar(ctx, b, t0, pasada) {                  // escribe una pasada entera del tema en el reloj del audio
    let t = t0;
    COMPASES.forEach(([acorde, mel], i) => {
      const p = pulsoDe(i), hum = () => (Math.random() - .5) * .022, [bajo, notas] = ACORDES[acorde], fin = i === COMPASES.length - 1;
      tecla(ctx, b, hz(bajo), .078, t + hum(), fin ? 11 : 6);
      notas.forEach((n, k) => tecla(ctx, b, hz(n), .03, t + p + k * (fin ? .11 : .035) + hum(), fin ? 10 : 5));
      let u = 0;
      mel && mel.split(' ').forEach(x => {
        const [n, d] = x.split(':');
        if (n !== '-') {
          tecla(ctx, b, hz(n), (u === 0 ? .125 : .1) * (i >= 28 ? .8 : 1), t + u * p + hum(), 3 + d * 1.7);
          if (pasada % 2 === 1 && i >= 12 && i < 20) campanaEn(ctx, b, hz(n) * 2, .026, t + u * p + .02, 3);     // en la segunda vuelta, la parte central lleva campanas
        }
        u += +d;
      });
      t += 3 * p;
    });
    return t - t0;
  }

  let ac = null, salida = null, bus = null, suena = false, pasadaG = null, reloj = null, nPasada = 0;
  function armarSonido() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    salida = ac.createGain(); salida.gain.value = 0; salida.connect(ac.destination);
    bus = sala(ac, salida); colchon(ac, bus);
  }
  function campana(f, vol = .12, cuando = 0, largo = 3.2) { if (suena) campanaEn(ac, bus, f, vol, ac.currentTime + cuando, largo); }
  const arpegio = (notas, paso = .16, vol = .07) => notas.forEach((f, i) => campana(f, vol, i * paso, 4));
  function tocar() {
    if (!suena) return;
    pasadaG = ac.createGain(); pasadaG.connect(bus);
    reloj = setTimeout(tocar, (programar(ac, pasadaG, ac.currentTime + 1.2, nPasada++) + 8) * 1000);
  }
  function alternarSonido() {
    if (!ac) armarSonido();
    suena = !suena; ac.resume();
    salida.gain.cancelScheduledValues(ac.currentTime); salida.gain.setTargetAtTime(suena ? .9 : 0, ac.currentTime, suena ? .6 : .25);
    document.getElementById('sonido').setAttribute('aria-pressed', suena);
    const inv = document.getElementById('invita'); inv.textContent = suena ? 'Suena «Feel the Miracle»' : 'Escuchar la página'; inv.classList.toggle('ya', suena);
    clearTimeout(reloj); if (pasadaG) { pasadaG.disconnect(); pasadaG = null; }
    if (suena) { nPasada = 0; reloj = setTimeout(tocar, 500); }
  }
  document.getElementById('sonido').addEventListener('click', alternarSonido);
  document.getElementById('invita').addEventListener('click', alternarSonido);
  document.querySelectorAll('.boton').forEach(b => b.addEventListener('pointerenter', () => campana(880, .04, 0, 2)));
  // el tema como archivo: lo mismo que suena, calculado de una vez (lo usa la herramienta que lo exporta a audio)
  window.temaWAV = async () => {
    const sr = 44100, d = duracionTema(), total = 2 + d + 10, ctx = new OfflineAudioContext(1, Math.ceil(sr * total), sr), out = ctx.createGain();
    out.gain.value = .9; out.connect(ctx.destination);
    const b = sala(ctx, out), col = colchon(ctx, b);
    col.gain.setValueAtTime(0, 0); col.gain.linearRampToValueAtTime(1, 3); col.gain.setValueAtTime(1, 2 + d); col.gain.linearRampToValueAtTime(0, total - 1);
    out.gain.setValueAtTime(.9, 2 + d + 3); out.gain.linearRampToValueAtTime(0, total - .2);
    programar(ctx, b, 2, 0);
    const x = (await ctx.startRendering()).getChannelData(0), n = x.length, v = new DataView(new ArrayBuffer(44 + n * 2));
    const txt = (o, s) => [...s].forEach((c, k) => v.setUint8(o + k, c.charCodeAt(0)));
    txt(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); txt(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); txt(36, 'data'); v.setUint32(40, n * 2, true);
    let pico = 0; for (let k = 0; k < n; k++) pico = Math.max(pico, Math.abs(x[k]));
    const gana = Math.min(.89 / (pico || 1), 4); for (let k = 0; k < n; k++) v.setInt16(44 + k * 2, Math.max(-1, Math.min(1, x[k] * gana)) * 32767, true);
    const u8 = new Uint8Array(v.buffer); let bin = ''; for (let k = 0; k < u8.length; k += 32768) bin += String.fromCharCode.apply(null, u8.subarray(k, k + 32768));
    return btoa(bin);
  };

  /* ---------- aparecer al entrar en pantalla, y pausar las escenas que no se ven ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('en');
    const svg = e.target.matches('.escena') && e.target.querySelector('svg');
    if (svg) {
      e.target.classList.toggle('en', e.isIntersecting); e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations();
      if (e.isIntersecting) { const n = +e.target.closest('.sesion').id.slice(1) - 1; campana(NOTAS[n], .06); campana(NOTAS[n] / 2, .03, .05, 4); }
    }
  }), { threshold: .18 });
  document.querySelectorAll('.ver').forEach(el => io.observe(el));

  /* ---------- el emblema de Milagro se pinta solo (y de nuevo con cada clic) ---------- */
  const sello = document.getElementById('sello'), banderin = document.getElementById('banderin'); let finSello = null, ciclo = null;
  function pintarSello(campanas = true) {
    sello.classList.remove('pinta', 'borra'); banderin.classList.remove('cae', 'recoge'); void sello.getBoundingClientRect(); sello.classList.add('pinta'); banderin.classList.add('cae');
    clearTimeout(finSello); if (campanas) finSello = setTimeout(() => arpegio([587.33, 880, 1174.66], .22, .035), 3500);
    // cada diez segundos se desvanece y se vuelve a pintar (solo si la portada está a la vista)
    clearTimeout(ciclo);
    const otraVez = () => { ciclo = setTimeout(() => {
      if (document.hidden || !visible) return otraVez();
      sello.classList.add('borra'); banderin.classList.add('recoge'); ciclo = setTimeout(() => pintarSello(false), 700);
    }, 10000); };
    otraVez();
  }
  if (quieto) { sello.classList.add('pinta'); banderin.classList.add('cae'); } else setTimeout(pintarSello, 1300);
  sello.addEventListener('click', () => pintarSello());

  /* ---------- el círculo de ocho ---------- */
  const g = document.getElementById('colchonetas');
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 - Math.PI / 2, x = 200 + Math.cos(a) * 150, y = 200 + Math.sin(a) * 150;
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', x - 15); r.setAttribute('y', y - 34); r.setAttribute('width', 30); r.setAttribute('height', 68); r.setAttribute('rx', 4);
    r.setAttribute('transform', `rotate(${a * 180 / Math.PI + 90} ${x} ${y})`); r.setAttribute('class', 'col'); r.style.transitionDelay = (i * .13) + 's';
    g.appendChild(r);
  }

  /* ---------- héroe: el trazo del tono (la tensión que se calma) ---------- */
  const c = document.getElementById('tono'), x = c.getContext('2d');
  let W, H, dpr, visible = true, toques = [];
  const medir = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  medir(); addEventListener('resize', medir);
  new IntersectionObserver(e => visible = e[0].isIntersecting).observe(c);
  c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); toques.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }); if (toques.length > 14) toques.shift(); });
  const N = 34, t0 = performance.now();
  const suave = v => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
  function pinta(ahora) {
    requestAnimationFrame(pinta);
    if (!visible) return;
    const t = (ahora - t0) / 1000;
    x.clearRect(0, 0, W, H);
    x.lineJoin = 'round';
    toques = toques.filter(p => ahora - p.t < 2600);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), y0 = H * (.1 + .8 * u), centro = 1 - Math.abs(u - .46) * 1.7;
      x.beginPath();
      for (let px = -10; px <= W + 10; px += 7) {
        const v = px / W;
        // la calma nace en el centro y se extiende hacia los bordes
        let calma = quieto ? 1 : suave((t - .6) / 6.5 * 1.7 - Math.abs(v - .58) * 1.25);
        let agita = 0;
        for (const p of toques) { const d2 = (px - p.x) ** 2 + (y0 - p.y) ** 2; agita += Math.exp(-d2 / 26000) * Math.exp(-(ahora - p.t) / 900); }
        const tension = (1 - calma) + Math.min(agita, 1) * .8;
        const onda = Math.sin(v * 5.2 + t * .42 + u * 4.6) * (10 + 20 * Math.max(centro, 0)) + Math.sin(v * 2.1 - t * .27 + u * 9) * 9;
        const ruido = Math.sin(px * .29 + i * 7.1 + t * 11) * Math.sin(px * .113 + t * 6.3 + i * 3.3) + .6 * Math.sin(px * .71 + i * 1.9 - t * 17);
        const y = y0 + onda + ruido * 26 * tension;
        px === -10 ? x.moveTo(px, y) : x.lineTo(px, y);
      }
      const a = .07 + .34 * Math.max(centro, 0) ** 2;
      x.strokeStyle = i % 5 === 2 ? `rgba(245,241,234,${a * .9})` : `rgba(201,182,228,${a})`;
      x.lineWidth = i % 5 === 2 ? 1.3 : 1;
      x.stroke();
    }
  }
  requestAnimationFrame(pinta);

  /* ---------- promesa: la línea que se calma al avanzar ---------- */
  const trazo = document.getElementById('trazo'), caja = document.getElementById('linea');
  const P = 240, semilla = Array.from({ length: P }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1);
  function linea(ahora) {
    requestAnimationFrame(linea);
    const r = caja.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const k = quieto ? 1 : suave((vh * .92 - r.top) / (vh * .62)), t = ahora / 1000;
    let pts = '';
    for (let i = 0; i < P; i++) {
      const v = i / (P - 1), local = suave(k * 1.9 - (1 - v) * .0 - v * .9 + .0);   // se calma de izquierda a derecha, y entera al final
      const tension = (1 - local) * (1 - v * .15);
      const jag = (semilla[i] * 2) * 78 + Math.sin(i * 1.7 + t * 9) * 16;
      const calma = Math.sin(v * 9 - t * .9) * 30 * (0.55 + .45 * Math.sin(v * 3.1 + t * .3));
      pts += (v * 1400).toFixed(1) + ',' + (110 + jag * tension + calma * (1 - tension * .8)).toFixed(1) + ' ';
    }
    trazo.setAttribute('points', pts);
  }
  requestAnimationFrame(linea);

  /* ---------- el lema: «Feel the Miracle» ocurre, no aparece ----------
     Polvo de luz en la oscuridad; dos latidos en el centro (sentir); un pincel de luz cruza la pantalla y va
     escribiendo el lema con ese polvo; al terminar, la luz florece y el lema queda respirando. Al rato se suelta
     hacia arriba, vuelve a ser onda (el trazo del tono) y todo ocurre otra vez. */
  const mc = document.getElementById('milagro'), m = mc.getContext('2d');
  const PRELUDIO = 1900, PINTURA = 3800, QUIETA = 9000, ONDA = 2600, NIV = 12;
  const TINTA_C = Array.from({ length: NIV + 1 }, (_, k) => `rgba(245,241,234,${(k / NIV).toFixed(3)})`), TINTA_L = Array.from({ length: NIV + 1 }, (_, k) => `rgba(201,182,228,${(k / NIV).toFixed(3)})`);
  let MW = 0, MH = 0, parts = [], puntos = [], fase = -1, cambio = 0, veLema = false, raton = null, x0 = 0, x1 = 1, finPintura = 0, tArp = null;
  function muestrea(texto) {
    const o = document.createElement('canvas'); o.width = MW; o.height = MH;
    const g = o.getContext('2d'); let fs = Math.min(MW * .15, MH * .36);
    const fuente = () => g.font = `italic 300 ${fs}px "Cormorant Garamond", "Cormorant", Georgia, serif`;
    fuente(); const w = g.measureText(texto).width; if (w > MW * .9) { fs *= MW * .9 / w; fuente(); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(texto, MW / 2, MH * .47);
    const d = g.getImageData(0, 0, MW, MH).data, pts = [], paso = Math.max(2, Math.round(MW / 820));
    for (let y = 0; y < MH; y += paso) for (let x2 = 0; x2 < MW; x2 += paso) if (d[(y * MW + x2) * 4 + 3] > 120) pts.push([x2 + Math.random() * paso - paso / 2, y + Math.random() * paso - paso / 2]);
    for (let k = pts.length - 1; k > 0; k--) { const q = Math.random() * (k + 1) | 0; [pts[k], pts[q]] = [pts[q], pts[k]]; }
    return pts;
  }
  function prepararLema() {
    const d = Math.min(devicePixelRatio || 1, 2); MW = mc.clientWidth; MH = mc.clientHeight; mc.width = MW * d; mc.height = MH * d; m.setTransform(d, 0, 0, d, 0, 0);
    puntos = muestrea('Feel the Miracle');
    parts = Array.from({ length: Math.min(puntos.length, 11000) }, (_, k) => ({ x: Math.random() * MW, y: Math.random() * MH, vx: 0, vy: 0, tx: 0, ty: 0, s: Math.random() * 6.28, k: .6 + Math.random() * .8, c: k % 5 === 0, act: true, on: 0, nace: 0 }));
    ola();
  }
  function ola() { parts.forEach(p => { p.act = true; p.tx = Math.random() * MW; p.ty = MH * .47 + Math.sin(p.tx / MW * 9 + p.s * .15) * MH * .07 + (Math.random() - .5) * 16; }); }
  function latido(cuando) {
    if (!suena) return;
    const t = ac.currentTime + cuando, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(74, t); o.frequency.exponentialRampToValueAtTime(41, t + .3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + .7);
  }
  function escribe() {
    const ahora = performance.now(); x0 = Infinity; x1 = -Infinity;
    parts.forEach((p, k) => { const q = puntos[k % puntos.length]; p.tx = q[0]; p.ty = q[1]; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); });
    parts.forEach(p => { p.act = quieto; p.on = ahora + PRELUDIO + (p.tx - x0) / (x1 - x0) * PINTURA + Math.random() * 260; });
    finPintura = ahora + PRELUDIO + PINTURA + 350;
    latido(.15); latido(.78);
    clearTimeout(tArp); tArp = setTimeout(() => arpegio((fase / 2) % 2 ? [369.99, 587.33, 739.99, 1174.66] : [293.66, 440, 587.33, 880, 1174.66], .19, .06), PRELUDIO + PINTURA + 250);
  }
  mc.parentElement.addEventListener('pointermove', e => { const r = mc.getBoundingClientRect(); raton = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  mc.parentElement.addEventListener('pointerleave', () => raton = null);
  new IntersectionObserver(e => { veLema = e[0].isIntersecting; if (veLema && fase < 0) { fase = 0; cambio = performance.now(); escribe(); } }, { threshold: .35 }).observe(mc);
  const luz = (x2, y, r, rgb, a) => { const g = m.createRadialGradient(x2, y, 0, x2, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); m.fillStyle = g; m.fillRect(x2 - r, y - r, r * 2, r * 2); };
  function lema(ahora) {
    requestAnimationFrame(lema);
    if (!veLema && fase >= 0) return;
    const t = ahora / 1000, dt = ahora - cambio, texto = fase >= 0 && fase % 2 === 0, cx = MW / 2, cy = MH * .47;
    if (fase >= 0 && !quieto) {
      if (texto && dt > PRELUDIO + PINTURA + QUIETA) { fase++; cambio = ahora; ola(); parts.forEach(p => { p.vx += (Math.random() - .5) * 6; p.vy -= Math.random() * 9; }); }      // se suelta hacia arriba
      else if (!texto && dt > ONDA) { fase++; cambio = ahora; escribe(); }
    }
    m.globalCompositeOperation = 'source-over'; m.fillStyle = 'rgba(16,16,16,.3)'; m.fillRect(0, 0, MW, MH);
    m.globalCompositeOperation = 'lighter';
    // sentir: dos latidos que salen del centro
    let pulso = 0;
    if (texto && !quieto) for (const b of [150, 780]) {
      const u = (dt - b) / 1000;
      if (u > 0 && u < 1) { pulso = Math.max(pulso, (1 - u) ** 2); m.strokeStyle = `rgba(201,182,228,${.55 * (1 - u)})`; m.lineWidth = 1.5; m.beginPath(); m.arc(cx, cy, 12 + u * MW * .17, 0, 6.2832); m.stroke(); }
    }
    if (texto && !quieto && dt < PRELUDIO) luz(cx, cy, 50 + pulso * 90, '245,241,234', Math.min(1, dt / 300) * (1 - dt / PRELUDIO) * (.2 + .55 * pulso));
    // el pincel de luz que escribe
    const av = texto ? (dt - PRELUDIO) / PINTURA : -1, px = x0 + (x1 - x0) * av, py = cy + Math.sin(av * 11) * MH * .018;
    if (av > 0 && av < 1 && !quieto) { luz(px, py, 110, '201,182,228', .22); luz(px, py, 26, '255,255,255', .7); }
    // el milagro: la luz florece al terminar y se apaga despacio
    const flor = texto && ahora > finPintura ? Math.max(0, 1 - (ahora - finPintura) / 2200) : 0;
    if (flor > 0) luz(cx, cy, MW * (.62 - flor * .25), '201,182,228', .16 * flor);
    for (const p of parts) {
      if (!p.act) {
        if (texto && ahora >= p.on) { p.act = true; p.nace = ahora; p.x = px + (Math.random() - .5) * 14; p.y = py + (Math.random() - .5) * 14; p.vx = (Math.random() - .5) * 6; p.vy = (Math.random() - .5) * 6; }
        else {                                                                    // polvo que flota, y que se enciende con cada latido
          p.x += Math.sin(t * .3 + p.s) * .16; p.y += Math.cos(t * .23 + p.s * 1.7) * .12 - .04; if (p.y < -4) p.y = MH + 4;
          m.fillStyle = TINTA_L[Math.round((.1 + .35 * pulso) * NIV)]; m.fillRect(p.x, p.y, 1.1, 1.1); continue;
        }
      }
      let ax = (p.tx - p.x) * .014 * p.k, ay = (p.ty - p.y) * .014 * p.k;
      ax += Math.sin(p.y * .021 + t * 1.1 + p.s) * (texto ? .018 : .09); ay += Math.cos(p.x * .017 - t * .9 + p.s) * (texto ? .018 : .16);
      if (!texto) p.tx += .25, p.tx > MW + 20 && (p.tx = -20, p.x = -20);
      if (raton) { const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy; if (d2 < 12000) { const f = (1 - d2 / 12000) * 1.4, d = Math.sqrt(d2) + .01; ax += dx / d * f; ay += dy / d * f; } }
      p.vx = (p.vx + ax) * .875; p.vy = (p.vy + ay) * .875; p.x += p.vx; p.y += p.vy;
      const joven = texto && ahora - p.nace < 700;
      let b = joven ? 1 : (p.c ? .88 : .74);
      if (texto && !joven) b = Math.min(1, b * (.7 + .3 * Math.sin(t * 1.15 - p.tx * .006)) + flor * .35);      // respira: una ola de luz lo recorre
      m.fillStyle = (p.c || joven ? TINTA_C : TINTA_L)[Math.round(b * NIV)];
      const lado = joven ? 2.3 : p.c ? 1.9 : 1.5; m.fillRect(p.x, p.y, lado, lado);
    }
  }
  (document.fonts && document.fonts.load ? document.fonts.load('italic 300 80px "Cormorant Garamond"').catch(() => 0) : Promise.resolve()).then(() => { prepararLema(); requestAnimationFrame(lema); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { prepararLema(); if (fase >= 0) { fase = 0; cambio = performance.now(); escribe(); } }, 250); });
})();
