# Estudio de Movimiento — venta de la Kinesis

Página de venta de la Technogym Kinesis Personal Heritage de Milagro Ortiz, publicada con
GitHub Pages en estudiodemovimiento.es.

**Desde el 3-oct-2026 la página está abierta**, sin contraseña, para empezar a mostrarla.
`robots.txt` deja pasar a los rastreadores y apunta a `sitemap.xml`. **Desde el 5-oct-2026 Google
puede indexarla** (`index, follow`; antes llevaba `noindex`) y la página trae datos estructurados
`Product` (precio, estado usado, disponibilidad) para el resultado enriquecido. Si cambia el precio,
cambiarlo también en el bloque `ld+json` y en `lastmod` de `sitemap.xml`.
El WhatsApp de todos los botones es la línea del Estudio, +34 722 814 010.

Fuente: `../venta-v2/`. Para publicar, copiar `index.html`, `og.jpg` (vista previa del enlace, ver `../venta-v2/og/LEEME.md`) y las imágenes que usa a este repo.
Entre el 23-sep y el 3-oct-2026 estuvo cifrada (`contenido.bin` + pantalla de contraseña; ver
commit 2849fc1 y `../venta-v2/publicar/`). Hasta el 23-sep-2026 era la «Serie Consciente» (commit 194aed2).

**Versión en inglés (15-oct-2026):** `en/index.html` y `en/legal.html`, en `estudiodemovimiento.es/en/`, para compradores
de habla inglesa del sur de la isla. Arriba, las dos páginas llevan el selector ES/EN con banderas. Usan las mismas imágenes
(`../img/`) y el mismo `medicion.js`, que lee `<html lang>` y habla el idioma de la página (aviso de cookies, origen del
WhatsApp y el parámetro `idioma` en GA4). La vista previa del enlace en inglés es `og-en.jpg`. Etiquetas `hreflang` en las
dos páginas y en `sitemap.xml`. **Cualquier cambio de texto, precio o estilo hay que hacerlo en las dos páginas.**
