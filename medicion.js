/* Medición con consentimiento (GA4 + píxel de Meta) y origen de cada WhatsApp.
   Nada se carga ni se guarda en cookies hasta que el visitante pulsa «Aceptar».
   Para activar el píxel de Meta, poner su ID en PIXEL. */
(() => {
  const GA = 'G-58WX551YKL';
  const PIXEL = '2166538794271971';
  const CLAVE = 'consentimiento-medicion';

  // Origen de la visita: utm_source, fbclid/gclid o el sitio de procedencia. Se recuerda durante la sesión.
  const ORIGENES = {
    instagram: 'Instagram', facebook: 'Facebook', meta_ads: 'un anuncio de Facebook o Instagram', marketplace: 'Facebook Marketplace',
    tiktok: 'TikTok', youtube: 'YouTube', x: 'X', twitter: 'X', google: 'Google', google_ads: 'un anuncio de Google',
    whatsapp: 'WhatsApp', email: 'un correo', wallapop: 'Wallapop', dossier: 'el dossier'
  };
  const leerOrigen = () => {
    const q = new URLSearchParams(location.search);
    let o = (q.get('utm_source') || '').toLowerCase();
    if (!o && q.get('fbclid')) o = 'facebook';
    if (!o && q.get('gclid')) o = 'google_ads';
    if (!o && document.referrer) {
      const h = (() => { try { return new URL(document.referrer).hostname; } catch { return ''; } })();
      if (/instagram\./.test(h)) o = 'instagram';
      else if (/facebook\.|fb\.com/.test(h)) o = 'facebook';
      else if (/tiktok\./.test(h)) o = 'tiktok';
      else if (/youtube\.|youtu\.be/.test(h)) o = 'youtube';
      else if (/(^|\.)x\.com|t\.co$|twitter\./.test(h)) o = 'x';
      else if (/google\./.test(h)) o = 'google';
    }
    try {
      if (o) sessionStorage.setItem('origen', o); else o = sessionStorage.getItem('origen') || '';
    } catch {}
    return o;
  };
  const origen = leerOrigen();

  // El mensaje de WhatsApp lleva al final de dónde vino la persona, para saber qué canal funciona.
  window.origenWhatsApp = () => ORIGENES[origen] ? ` (Os vi en ${ORIGENES[origen]}.)` : '';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  let activo = false;

  const activar = () => {
    if (activo) return; activo = true;
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA);
    if (PIXEL) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', PIXEL); fbq('track', 'PageView'); fbq('track', 'ViewContent', { content_name: 'Technogym Kinesis Personal Heritage', value: 5300, currency: 'EUR' });
    }
  };

  // Evento de contacto: lo llama la página al abrir WhatsApp. Sin consentimiento no se envía nada.
  window.medirContacto = (ubicacion) => {
    if (!activo) return;
    gtag('event', 'click_whatsapp', { ubicacion, origen: origen || 'directo' });
    gtag('event', 'generate_lead', { currency: 'EUR', value: 5300, ubicacion });
    if (window.fbq) fbq('track', 'Contact', { content_name: 'Technogym Kinesis Personal Heritage' });
  };

  const guardar = v => { try { localStorage.setItem(CLAVE, v); } catch {} };
  const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };

  const aviso = () => {
    if (document.getElementById('aviso-cookies')) return;
    const d = document.createElement('div');
    d.id = 'aviso-cookies';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Cookies de medición');
    d.innerHTML = `<p>Usamos cookies de medición (Google Analytics y Meta) solo si nos das permiso, para saber cuántas personas ven esta página y desde dónde llegan. <a href="legal.html#cookies">Más información</a></p>
      <div class="aviso-botones"><button type="button" data-v="no">Rechazar</button><button type="button" data-v="si">Aceptar</button></div>`;
    d.addEventListener('click', e => {
      const v = e.target.dataset && e.target.dataset.v; if (!v) return;
      guardar(v); d.remove(); if (v === 'si') activar();
    });
    document.body.appendChild(d);
  };

  const css = document.createElement('style');
  css.textContent = `#aviso-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:200;max-width:620px;margin:0 auto;padding:18px 20px;border-radius:14px;
    background:#1B1612;border:1px solid rgba(207,183,135,.35);color:#F5F1EA;font:300 15px/1.5 Jost,"Helvetica Neue",sans-serif;box-shadow:0 20px 60px -20px rgba(0,0,0,.8)}
    #aviso-cookies a{color:#CFB787;text-decoration:underline}
    #aviso-cookies .aviso-botones{display:flex;gap:10px;margin-top:12px}
    #aviso-cookies button{flex:1;padding:12px 16px;border-radius:100px;border:1px solid rgba(245,241,234,.4);background:transparent;color:#F5F1EA;font:400 15px Jost,sans-serif;cursor:pointer}
    #aviso-cookies button[data-v=si]{background:transparent}`;
  document.head.appendChild(css);

  window.configurarCookies = () => { guardar(''); aviso(); };

  const v = leer();
  if (v === 'si') activar();
  else if (v !== 'no') (document.readyState === 'loading' ? addEventListener('DOMContentLoaded', aviso) : aviso());
})();
