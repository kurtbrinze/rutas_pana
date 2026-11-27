/* Pantallas y eventos. */
(function () {
  'use strict';
  const VERSION = 'V.9';
  const C = window.Core, K = window.Carpetas, IMG = window.Imagen;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = (v) => Math.round(v || 0).toLocaleString('en-US');
  const pct = (v) => v == null ? '—' : v.toFixed(v < 1 ? 2 : 1) + '%';
  const ico = {
    copy: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    down: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    save: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 11v5"/><path d="m9.5 13.5 2.5 2.5 2.5-2.5"/></svg>',
    file: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="stroke:var(--rz-ok,#4ADE80);margin-top:2px"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg>',
    up: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
    dn: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    del: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
    filtro: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/></svg>',
    wa: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z"/><path d="M9 9.5c.3 1.8 1.7 3.6 3.6 4.5l1.2-1.1 2 .9-.4 1.6c-3.4.2-7-3.3-6.9-6.7l1.6-.4.9 2z"/></svg>',
    izq: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    der: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    xls: '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>'
  };

  let cfg = window.Config.cargar();
  const S = {
    tab: 'resumen', archivos: [], est: null, turno: 'AM', solo: false, canvas: null, modo: 'whatsapp',
    // De dónde salen los datos de Cadenas, Cambios y Verificación: 'vivo' (crudos cargados) o la fecha de un cierre.
    fuente: 'vivo', cierres: { lista: null, cache: {} },
    cad: { vista: 'cadena', cadena: '*', carga: 'Todo', tipo: 'Normal', otros: true },
    camb: { carga: 'Todo' }, verJ: 'dia', cfgSec: 'rutas',
    // Filtros compartidos por Cadenas y Cambios (vacío = todos).
    filtros: { rutas: new Set(), cadenas: new Set(), tiendas: new Set(), claves: new Set() }, fAbierto: null,
    hist: { indice: null, turno: 'Ambos', ruta: '*', clave: '*', soloImg: true, dow: null, fTurno: 'Ambos' }
  };

  /* ---------- utilidades ---------- */
  let tt;
  function toast(msg, kind) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast on ' + (kind || '');
    clearTimeout(tt); tt = setTimeout(() => { t.className = 'toast'; }, kind === 'bad' ? 6000 : 3200);
  }
  function guardarCfg(recalcular = true) {
    window.Config.guardar(cfg);
    if (recalcular && S.archivos.length) S.est = C.clasificar(S.archivos, cfg);
    if (recalcular) S.cierres.cache = {};
  }
  const fechaTxt = (d) => C.fechaCorta(d);
  const hoyTxt = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()); };

  /* ---------- archivos ---------- */
  async function cargarArchivos(lista) {
    const files = [...lista].filter((f) => /\.xls[xm]?$/i.test(f.name));
    if (!files.length) { toast('Elige archivos de Excel del sistema (.xlsx).', 'bad'); return; }
    const msgs = [];
    for (const f of files) {
      try {
        const a = C.leerLibro(new Uint8Array(await f.arrayBuffer()), f.name, window.XLSX);
        a.file = f; a.cargado = Date.now(); a.generado = f.lastModified || null;
        /* Un crudo nuevo reemplaza al que tenga la misma fecha (o el mismo nombre). */
        const viejo = S.archivos.find((x) => x.fecha === a.fecha || x.nombre === a.nombre);
        S.archivos = S.archivos.filter((x) => x.fecha !== a.fecha && x.nombre !== a.nombre).concat(a).sort((x, y) => x.fecha.localeCompare(y.fecha));
        const uN = ultimoMov(a), uV = viejo ? ultimoMov(viejo) : null;
        if (viejo) {
          const igual = uV && uN.d === uV.d && uN.m === uV.m && viejo.lineas.length === a.lineas.length;
          msgs.push(`Crudo del ${fechaTxt(a.fecha)} reemplazado: ${viejo.lineas.length} → ${a.lineas.length} líneas, último movimiento ${C.hora(uV ? uV.m : 0)} → ${C.hora(uN.m)}${igual ? '. Trae los mismos datos que el anterior.' : '.'}`);
        } else msgs.push(`Cargado el crudo del ${fechaTxt(a.fecha)}: ${a.lineas.length} líneas, último movimiento ${C.hora(uN.m)}.`);
      } catch (e) { toast(e.message, 'bad'); }
    }
    if (msgs.length) setTimeout(() => toast(msgs.join(' '), 'ok'), 50);
    if (!S.archivos.length) return;
    S.est = C.clasificar(S.archivos, cfg);
    S.turno = S.est.hayAM ? 'AM' : 'PM';
    // Después de la 1 de la tarde lo normal es que sea el cierre del día.
    // (o si el crudo de hoy se generó después de esa hora, aunque su último movimiento sea de antes).
    const genHoy = Math.max(0, ...S.archivos.filter((x) => x.fecha === S.est.corteDia).map((x) => x.generado || 0));
    const tarde = genHoy && diaDe(genHoy) === S.est.corteDia && new Date(genHoy).getHours() >= 13;
    S.modo = S.est.corteMin >= 13 * 60 || tarde ? 'cierre' : 'whatsapp';
    S.fuente = 'vivo';
    pintar();
    avisarCentro();
    guardarSesion();
  }

  /** Último Fecha Grabado / Verificado Fecha del crudo (no es la hora en que se generó el archivo). */
  function ultimoMov(a) {
    return a.lineas.reduce((m, l) => { for (const f of [l.grabado, l.verif]) if (f && (f.d > m.d || (f.d === m.d && f.m > m.m))) m = f; return m; }, { d: '', m: 0 });
  }
  const horaDe = (ms) => ms ? new Date(ms).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '';
  const diaDe = (ms) => { if (!ms) return ''; const d = new Date(ms), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
  function quitarArchivo(i) {
    const a = S.archivos[i]; if (!a) return;
    S.archivos.splice(i, 1);
    S.est = S.archivos.length ? C.clasificar(S.archivos, cfg) : null;
    S.cierres.cache = {};
    guardarSesion(); pintar(); avisarCentro();
    toast('Quitado: ' + a.nombre);
  }

  /* ---------- sesión: lo último cargado sigue ahí al volver a abrir la app ---------- */
  const SES_DB = 'rutas_pana_sesion';
  function sesDB() { return new Promise((ok, mal) => { const r = indexedDB.open(SES_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); }); }
  async function guardarSesion() {
    try {
      const db = await sesDB();
      const datos = S.archivos.length ? { archivos: S.archivos.map((a) => ({ nombre: a.nombre, fecha: a.fecha, cargado: a.cargado || null, generado: a.generado || (a.file && a.file.lastModified) || null, lineas: a.lineas.map((l) => { const o = Object.assign({}, l); delete o.cad; return o; }), file: a.file || null })), modo: S.modo, solo: S.solo, guardado: Date.now() } : null;
      await new Promise((ok) => { const t = db.transaction('s', 'readwrite'); datos ? t.objectStore('s').put(datos, 'vivo') : t.objectStore('s').delete('vivo'); t.oncomplete = ok; t.onerror = ok; });
    } catch (_) { /* sin IndexedDB solo se pierde la sesión */ }
  }
  async function leerSesion() {
    try {
      const db = await sesDB();
      return await new Promise((ok) => { const r = db.transaction('s').objectStore('s').get('vivo'); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
    } catch (_) { return null; }
  }

  /* ---------- cierres guardados en Hx\Cierres ---------- */
  const NOMBRE_CIERRE = /^(\d{4}-\d{2}-\d{2})\.json$/;
  async function dirCierres(pedir) {
    const hx = await K.obtener('hx', pedir);
    return hx ? K.subcarpeta(hx, 'Cierres') : null;
  }
  async function listarCierres(pedir) {
    const dir = await dirCierres(pedir);
    if (!dir) return null;
    S.cierres.lista = (await K.listar(dir, '.json')).map((n) => (n.match(NOMBRE_CIERRE) || [])[1]).filter(Boolean).sort();
    return S.cierres.lista;
  }
  async function abrirCierre(dia, pedir = true) {
    if (!S.cierres.cache[dia]) {
      const dir = await dirCierres(pedir);
      if (!dir) throw new Error('Sin acceso a la carpeta Hx.');
      S.cierres.cache[dia] = C.estDesdeCierre(await K.leerJSON(dir, dia + '.json'), cfg);
    }
    S.fuente = dia;
    return S.cierres.cache[dia];
  }
  /** Datos que usan Cadenas, Cambios y Verificación. */
  const datos = () => S.fuente === 'vivo' ? S.est : S.cierres.cache[S.fuente] || null;

  async function leerIndice(dir) { try { return await K.leerJSON(dir, '_indice.json'); } catch (_) { return { version: 1, dias: {} }; } }
  async function reconstruirIndice() {
    const dir = await dirCierres(true); if (!dir) throw new Error('Sin acceso a la carpeta Hx.');
    const ind = { version: 1, dias: {} };
    for (const n of await K.listar(dir, '.json')) {
      const m = n.match(NOMBRE_CIERRE); if (!m) continue;
      try { ind.dias[m[1]] = C.indiceDia(await K.leerJSON(dir, n)); } catch (_) {}
    }
    await K.escribir(dir, '_indice.json', JSON.stringify(ind));
    S.hist.indice = ind;
    return ind;
  }

  async function guardarCierre() {
    const E = S.est; if (!E) return;
    const dir = await dirCierres(true).catch(() => null);
    if (!dir) { toast('Primero elige la carpeta Hx en Configuración › Carpetas.', 'bad'); S.cfgSec = 'carpetas'; irA('config'); return; }
    const d = C.deteccion(E, cfg), avisos = [];
    /* La hora que importa es cuándo se generó el crudo de hoy, no su último movimiento. */
    const deHoy = S.archivos.filter((a) => a.fecha === E.corteDia);
    const gen = Math.max(0, ...deHoy.map((a) => a.generado || (a.file && a.file.lastModified) || 0));
    const genMin = gen && diaDe(gen) === E.corteDia ? new Date(gen).getHours() * 60 + new Date(gen).getMinutes() : null;
    if (genMin != null ? genMin < 13 * 60 : E.corteMin < 13 * 60) {
      avisos.push(genMin != null
        ? 'El crudo de hoy se generó a las ' + horaDe(gen) + ': ¿seguro que ya cerró la operación?'
        : 'El último movimiento de los crudos es de las ' + C.hora(E.corteMin) + ' y no sé a qué hora se generaron: ¿es el crudo del cierre?');
    }
    if (!E.hayPM) avisos.push('No cargaste el crudo de mañana: las cargas de la tarde no quedarán en el cierre.');
    if (d.sinVerifLineas) avisos.push(d.sinVerifLineas + ' líneas sin verificar (rutas ' + d.sinVerifRutas.join(', ') + ').');
    if (avisos.length && !confirm('Antes de guardar el cierre del ' + fechaTxt(E.corteDia) + ':\n\n• ' + avisos.join('\n• ') + '\n\n¿Guardar de todos modos?')) return;
    const nombre = E.corteDia + '.json';
    if (await K.existe(dir, nombre) && !confirm('Ya hay un cierre del ' + fechaTxt(E.corteDia) + '. ¿Reemplazarlo con estos crudos?')) return;
    const foto = C.fotoCierre(E, S.archivos);
    await K.escribir(dir, nombre, JSON.stringify(foto));
    const ind = await leerIndice(dir);
    ind.dias[foto.dia] = C.indiceDia(foto);
    await K.escribir(dir, '_indice.json', JSON.stringify(ind));
    S.hist.indice = ind; S.cierres.lista = null; delete S.cierres.cache[foto.dia];
    if (cfg.carpetas.copiarCrudos) {
      try {
        const bk = await K.obtener('backup');
        if (bk) { const cd = await K.subcarpeta(bk, 'Crudos/' + E.corteDia); for (const a of S.archivos) if (a.file) await K.escribir(cd, a.nombre, a.file); }
      } catch (_) { /* el respaldo de crudos es opcional */ }
    }
    toast('Cierre del ' + fechaTxt(E.corteDia) + ' guardado en Hx\\Cierres\\' + nombre, 'ok');
  }

  /* Resumen del día para la tarjeta del Centro de Control ({ v, app, actualizado, datos }).
     Desde /apps/rutas/ (mismo sitio) va en localStorage; además se manda por postMessage. */
  let ultimoInsight = null;
  function avisarCentro() {
    const E = S.est; if (!E) return;
    const tot = (t) => { const r = C.resumen(E, cfg, t, false); return r.filas.length ? { fecha: r.fecha, rutas: r.filas.length, unidades: r.totales.reduce((a, b) => a + b, 0) } : null; };
    const d = C.deteccion(E, cfg);
    ultimoInsight = { v: 1, app: 'rutas', actualizado: new Date().toISOString(), datos: {
      corteDia: E.corteDia, corteHora: C.hora(E.corteMin), am: E.hayAM ? tot('AM') : null, pm: E.hayPM ? tot('PM') : null,
      cambios: C.cambios(E, cfg, 'Todo').total, sinVerif: d.sinVerifLineas } };
    try { localStorage.setItem('cc.insight.rutas', JSON.stringify(ultimoInsight)); } catch (_) {}
    try { if (window.parent !== window) window.parent.postMessage({ tipo: 'cc:insight', id: 'rutas', insight: ultimoInsight }, '*'); } catch (_) {}
  }
  function reiniciar() {
    S.archivos = []; S.est = null; S.canvas = null; S.turno = 'AM';
    guardarSesion();
    pintar(); toast('Listo para cargar nuevos archivos.');
  }

  /* ---------- exportar a Excel ---------- */
  async function exportar(sub, nombre, hojas, filtros) {
    const wb = window.XLSX.utils.book_new();
    if (filtros && filtros.length) hojas = hojas.concat([{ nombre: 'Filtros', aoa: [['Filtro', 'Valores']].concat(filtros) }]);
    hojas.forEach((h) => window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(h.aoa), h.nombre.slice(0, 31)));
    const datos = window.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    try {
      const hx = await K.obtener('hx');
      if (hx) {
        const d = await K.subcarpeta(hx, sub);
        await K.escribir(d, nombre, new Blob([datos]));
        toast('Guardado en Hx\\' + sub + '\\' + nombre, 'ok');
        return;
      }
    } catch (e) { /* sigue con la descarga */ }
    K.descargar(nombre, new Blob([datos]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    toast('Descargado: ' + nombre + ' (elige la carpeta Hx en Configuración para guardarlo directo).');
  }

  /* ================= RESUMEN ================= */
  function vResumen() {
    const v = $('#v-resumen');
    if (!S.est) {
      v.innerHTML = `
        <div class="card pad" style="max-width:820px;margin:20px auto">
          <button type="button" class="drop big" data-act="abrir" id="dropZone">
            <svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:36px;height:36px;stroke:url(#gr)"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>
            <b>Arrastra aquí los crudos del sistema</b>
            <span class="muted">El de hoy (rutas AM) y el de mañana (rutas PM). Puedes cargar uno o los dos.</span>
          </button>
          <p class="dim" style="font-size:12px;line-height:1.6;margin:14px 4px 0">La app reconoce cada archivo por la columna Fecha. Lo verificado hoy es AM, el crudo de mañana es PM y lo verificado ayer (la carga PM de ayer) no se vuelve a reportar.</p>
        </div>`;
      return;
    }
    const E = S.est, d = C.deteccion(E, cfg);
    const res = C.resumen(E, cfg, S.turno, S.solo);
    const tabs = [];
    if (E.hayAM) tabs.push(['AM', 'Rutas AM · ' + fechaTxt(E.amFecha)]);
    if (E.hayPM) tabs.push(['PM', 'Rutas PM · ' + fechaTxt(E.pmFecha)]);
    if (!tabs.some((t) => t[0] === S.turno) && tabs.length) S.turno = tabs[0][0];
    const archivos = S.archivos.map((a, i) => {
      const esPM = a.fecha > E.corteDia;
      const ult = ultimoMov(a), gen = a.generado || (a.file && a.file.lastModified);
      return `<div class="file">${ico.file}<div style="min-width:0;flex:1">
        <div class="tag">${esPM ? 'MAÑANA · RUTAS PM' : a.fecha === E.corteDia ? 'HOY · RUTAS AM' : 'FECHA ANTERIOR'}</div>
        <div class="nm">${esc(a.nombre)}</div>
        <table class="fmeta"><tbody>
          <tr><td>Fecha del crudo</td><td>${esc(fechaTxt(a.fecha))} · ${n0(a.lineas.length)} líneas</td></tr>
          <tr><td>Generado</td><td>${gen ? esc((diaDe(gen) !== diaDe(Date.now()) ? fechaTxt(diaDe(gen)) + ' ' : '') + horaDe(gen)) : '—'}</td></tr>
          <tr><td>Cargado aquí</td><td>${a.cargado ? esc(horaDe(a.cargado)) : 'sesión anterior'}</td></tr>
          <tr><td title="Último Fecha Grabado o Verificado Fecha que trae el crudo">Último movimiento</td><td>${C.hora(ult.m)}</td></tr>
        </tbody></table></div>
        <button type="button" class="btn sm ghost" data-act="quitarArchivo" data-v="${i}" title="Quitar este archivo" aria-label="Quitar ${esc(a.nombre)}">✕</button></div>`;
    }).join('');
    const det = [
      ['Rutas AM en la imagen', d.amRutas, 'var(--g)'],
      ['Rutas PM en la imagen', d.pmRutas, 'var(--g)'],
      ['Cargadas ayer en la tarde (no se reportan)', d.ayerRutas, 'var(--tx2)'],
      ['Rutas fuera de la imagen (Configuración)', d.fueraRutas, 'var(--tx2)'],
      ['Líneas AM sin verificar', d.sinVerifLineas, d.sinVerifLineas ? 'var(--warn)' : 'var(--tx2)']
    ].map(([l, n, c]) => `<div class="det"><span>${l}</span><b style="color:${c}">${n}</b></div>`).join('');
    const avisos = [];
    if (d.sinVerifLineas) avisos.push(`<div class="info warn">Sin verificar todavía: rutas ${d.sinVerifRutas.map(esc).join(', ')}. Se cuentan como AM.</div>`);
    if (d.nuevas.length) avisos.push(`<div class="info warn">Rutas que no están en Configuración: ${d.nuevas.map((r) => esc(r.ruta + ' ' + r.nombre)).join(', ')}. <button type="button" class="btn sm" data-act="agregarNuevas" style="margin-top:8px">Agregarlas (fuera de la imagen)</button></div>`);
    if (d.ambos.length) avisos.push(`<div class="info">Con carga AM y PM: rutas ${d.ambos.map(esc).join(', ')}. Cada carga sale en su imagen.</div>`);

    v.innerHTML = `
      <div class="row">
        <aside class="side">
          <div class="card pad stack">
            <div style="display:flex;align-items:center;gap:8px"><h2 style="flex:1">Archivos del sistema</h2>
              <button type="button" class="btn sm ghost" data-act="limpiarArchivos" title="Quita todos los crudos cargados">Limpiar</button></div>
            ${archivos}
            <button type="button" class="drop" data-act="abrir" id="dropZone">Arrastra otro crudo aquí o haz clic para buscarlo</button>
          </div>
          <div class="card pad stack">
            <h2>Tipo de carga</h2>
            <div class="seg full" role="group" aria-label="Tipo de carga">
              <button type="button" data-act="modo" data-v="whatsapp" class="${S.modo === 'whatsapp' ? 'on' : ''}">Corte para WhatsApp</button>
              <button type="button" data-act="modo" data-v="cierre" class="${S.modo === 'cierre' ? 'on' : ''}">Cierre del día</button>
            </div>
            <p class="dim" style="margin:0;font-size:12px;line-height:1.5">${S.modo === 'whatsapp' ? 'Solo para armar y mandar la imagen. No se guarda nada.' : 'Se guarda como el registro del día en Hx\\Cierres y alimenta Cadenas, Cambios, Verificación e Historial.'}</p>
          </div>
          <div class="card pad stack">
            <h2>Clientes incluidos</h2>
            <div class="seg full" role="group" aria-label="Clientes incluidos">
              <button type="button" data-act="solo" data-v="0" class="${S.solo ? '' : 'on'}">Todos los de la ruta</button>
              <button type="button" data-act="solo" data-v="1" class="${S.solo ? 'on' : ''}">Solo supermercados</button>
            </div>
            <p class="dim" style="margin:0;font-size:12px;line-height:1.5">${S.solo ? 'Solo clientes de cadenas marcadas como supermercado en Configuración.' : 'Suma todo lo que lleva la ruta, como el reporte de Excel.'}</p>
          </div>
          <div class="card pad" style="display:flex;flex-direction:column;gap:4px">
            <h2 style="margin-bottom:6px">Detección automática</h2>
            ${det}
            <div class="stack" style="margin-top:10px">${avisos.join('')}
              <div class="info">Corte: ${esc(fechaTxt(E.corteDia))} ${C.hora(E.corteMin)}. AM = verificado hoy · PM = crudo de mañana · lo verificado ayer se descarta.</div>
            </div>
          </div>
        </aside>
        <div class="mainc">
          <div class="bar" style="margin:0">
            <div class="seg" role="tablist" aria-label="Turno">${tabs.map(([t, l]) => `<button type="button" role="tab" data-act="turno" data-v="${t}" class="${S.turno === t ? 'on' : ''}">${l}</button>`).join('')}</div>
            <div class="right">
              ${S.modo === 'cierre' ? `<button type="button" class="btn pri" data-act="cierre">${ico.save} Guardar cierre del ${esc(fechaTxt(E.corteDia))}</button>
              <button type="button" class="btn" data-act="whatsapp">${ico.wa} Enviar por WhatsApp</button>` : `<button type="button" class="btn pri" data-act="whatsapp">${ico.wa} Enviar por WhatsApp</button>`}
              <button type="button" class="btn" data-act="descargar">${ico.down} Descargar imagen</button>
            </div>
          </div>
          <div class="card pad stack">
            <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px" class="muted"><span>Vista previa — así sale la imagen</span>
              <span class="mono dim" style="margin-left:auto">${res.filas.length} rutas · ${res.cols.length} claves con cantidad</span></div>
            <div class="preview" id="preview">${res.filas.length ? '' : '<div class="empty" style="background:var(--s1);color:var(--tx2)"><b>No hay rutas para esta imagen</b>Revisa en Configuración qué rutas y claves van en la imagen.</div>'}</div>
          </div>
          <div class="card pad" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <h2 style="margin-right:6px">Rutas en esta imagen</h2>
            <div class="chips">${res.filas.map((f) => `<span class="chip"><b>${esc(f.ruta)}</b>${esc(f.nombre)}</span>`).join('')}</div>
            <span class="dim" style="font-size:12px;margin-left:auto">Columnas y filas en cero se ocultan solas</span>
          </div>
        </div>
      </div>`;
    if (res.filas.length) {
      S.canvas = IMG.dibujar(res, 2);
      S.canvas.style.width = (S.canvas.width / 2) + 'px';
      $('#preview').appendChild(S.canvas);
    } else S.canvas = null;
    S.res = res;
  }

  /* ---------- filtros de Cadenas y Cambios ---------- */
  const FIL = [['rutas', 'Rutas'], ['cadenas', 'Cadenas'], ['tiendas', 'Tiendas'], ['claves', 'Ítems']];
  const llaveDe = {
    rutas: (l) => l.ruta,
    cadenas: (l) => (l.cad ? l.cad.nombre : 'Otros clientes'),
    tiendas: (l) => l.cliente || l.clienteNombre,
    claves: (l) => l.codigo
  };
  const hayFiltros = () => FIL.some(([k]) => S.filtros[k].size);
  /** Líneas que pasan los filtros (menos el indicado, para armar las opciones en cascada). */
  function filtrarLineas(D, excepto) {
    const F = S.filtros;
    return D.lineas.filter((l) => FIL.every(([k]) => k === excepto || !F[k].size || F[k].has(llaveDe[k](l))));
  }
  const datosFiltrados = (D) => hayFiltros() ? { ...D, lineas: filtrarLineas(D) } : D;
  function opcionesFiltro(D, k) {
    const m = new Map();
    filtrarLineas(D, k).forEach((l) => {
      if (l.clase !== 'AM' && l.clase !== 'PM') return;
      const key = llaveDe[k](l);
      let o = m.get(key);
      if (!o) {
        const desc = k === 'claves' ? ((cfg.claves.find((c) => c.codigo === key) || {}).descripcion || l.descripcion || '') : '';
        o = { key, u: 0, label: k === 'rutas' ? key + ' ' + (l.rutaNombre || '') : k === 'tiendas' ? l.clienteNombre : key,
          sub: k === 'tiendas' ? (l.cad ? l.cad.nombre : 'Otros clientes') : desc };
        m.set(key, o);
      }
      o.u += l.cantidad;
    });
    S.filtros[k].forEach((key) => { if (!m.has(key)) m.set(key, { key, u: 0, label: key, sub: 'sin datos este día' }); });
    const ops = [...m.values()];
    if (k === 'rutas') ops.sort((a, b) => a.key.localeCompare(b.key, 'es', { numeric: true }));
    else if (k === 'cadenas') { const pos = {}; cfg.cadenas.forEach((c, i) => { pos[c.nombre] = i; }); ops.sort((a, b) => (pos[a.key] ?? 1e6) - (pos[b.key] ?? 1e6)); }
    else if (k === 'claves') { const pos = {}; cfg.claves.forEach((c, i) => { pos[c.codigo] = i; }); ops.sort((a, b) => (pos[a.key] ?? 1e6) - (pos[b.key] ?? 1e6) || b.u - a.u); }
    else ops.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    return ops;
  }
  function etiquetaFiltro(D, k, nombre) {
    const sel = S.filtros[k];
    if (!sel.size) return nombre + ': todas';
    if (sel.size === 1) { const key = [...sel][0]; const o = opcionesFiltro(D, k).find((x) => x.key === key); return nombre + ': ' + (o ? (k === 'rutas' ? key : o.label) : key); }
    return nombre + ': ' + sel.size;
  }
  function barraFiltros(D) {
    const pops = FIL.map(([k, nombre]) => {
      const abierto = S.fAbierto === k, n = S.filtros[k].size;
      let pop = '';
      if (abierto) {
        const ops = opcionesFiltro(D, k);
        pop = `<div class="pop" role="dialog" aria-label="Filtrar ${nombre.toLowerCase()}">
          <input type="search" data-fbusca placeholder="Buscar ${nombre.toLowerCase()}…" aria-label="Buscar">
          <div class="pacts"><button type="button" class="btn sm ghost" data-act="fLimpiar" data-k="${k}">Todas</button><button type="button" class="btn sm ghost" data-act="fVisibles" data-k="${k}">Marcar las visibles</button><button type="button" class="btn sm pri" data-act="fCerrar">Aplicar</button></div>
          <div class="plista">${ops.map((o) => `<label class="op" data-txt="${esc((o.label + ' ' + o.sub + ' ' + o.key).toLowerCase())}"><input type="checkbox" data-fk="${k}" value="${esc(o.key)}" ${S.filtros[k].has(o.key) ? 'checked' : ''}><span class="ol">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span><span class="ou">${n0(o.u)}</span></label>`).join('') || '<div class="dim" style="padding:10px">Sin opciones con los otros filtros.</div>'}</div>
          <div class="dim" style="font-size:11px;padding:6px 10px 2px">Sin marcar ninguna = todas. Las unidades respetan los otros filtros.</div>
        </div>`;
      }
      return `<div class="msel ${n ? 'act' : ''}"><button type="button" class="btn" data-act="fAbrir" data-k="${k}" aria-expanded="${abierto}">${ico.filtro} ${esc(etiquetaFiltro(D, k, nombre))} ${ico.dn}</button>${pop}</div>`;
    }).join('');
    return `<div class="filtros">${pops}${hayFiltros() ? `<button type="button" class="btn sm ghost" data-act="fQuitar">Quitar filtros</button>` : ''}</div>`;
  }
  const textoFiltros = (D) => FIL.filter(([k]) => S.filtros[k].size).map(([k, n]) => [n, [...S.filtros[k]].map((key) => { const o = opcionesFiltro(D, k).find((x) => x.key === key); return o ? o.label : key; }).join(', ')]);

  /* ================= CADENAS ================= */
  /** Barra para elegir de dónde salen los datos: los crudos cargados o un cierre guardado. */
  function barraFuente() {
    const L = S.cierres.lista, vivo = S.fuente === 'vivo';
    const idx = L && !vivo ? L.indexOf(S.fuente) : -1;
    const D = datos();
    let detalle = '';
    if (vivo && S.est) detalle = `Crudos cargados · corte ${esc(fechaTxt(S.est.corteDia))} ${C.hora(S.est.corteMin)}`;
    else if (vivo) detalle = 'No hay crudos cargados';
    else if (D) detalle = `Cierre guardado · corte ${C.hora(D.corteMin)}${D.guardado ? ' · guardado ' + new Date(D.guardado).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}`;
    return `<div class="card fuente">
      <span class="lbl">Datos</span>
      <div class="seg" role="group" aria-label="Origen de los datos">
        <button type="button" data-act="fuenteVivo" class="${vivo ? 'on' : ''}">Crudos cargados</button>
        <button type="button" data-act="fuenteCierres" class="${vivo ? '' : 'on'}">Cierres guardados</button>
      </div>
      ${!vivo && L ? `<div class="nav-dia">
        <button type="button" class="btn sm icon" data-act="diaMover" data-d="-1" ${idx <= 0 ? 'disabled' : ''} aria-label="Día anterior">${ico.izq}</button>
        <select data-fuente aria-label="Día">${L.slice().reverse().map((d) => `<option value="${d}" ${d === S.fuente ? 'selected' : ''}>${esc(C.fechaCorta(d))} ${d.slice(0, 4)}</option>`).join('')}</select>
        <button type="button" class="btn sm icon" data-act="diaMover" data-d="1" ${idx < 0 || idx >= L.length - 1 ? 'disabled' : ''} aria-label="Día siguiente">${ico.der}</button>
      </div>` : ''}
      <span class="det-f">${detalle}</span>
    </div>`;
  }
  const sinDatos = () => S.fuente === 'vivo'
    ? `<div class="card empty"><b>No hay crudos cargados</b>Cárgalos en Resumen, o abre un cierre guardado con “Cierres guardados”.</div>`
    : `<div class="card empty"><b>No se pudo abrir el cierre</b>Revisa el acceso a la carpeta Hx.</div>`;
  function matrizHTML(m, primera, extra) {
    if (!m.filas.length) return '<div class="empty">No hay líneas con estos filtros.</div>';
    const cab = `<tr><th>${primera}</th>${extra ? '<th>CADENA</th>' : ''}${m.cols.map((c) => `<th class="n">${esc(c)}</th>`).join('')}<th class="n tc">TOTAL</th></tr>`;
    const max = Math.max(1, ...m.filas.flatMap((f) => f.vals));
    const filas = m.filas.map((f) => `<tr><td>${esc(f.nombre)}</td>${extra ? `<td class="dim">${esc(f.cadena || '')}</td>` : ''}${f.vals.map((v) => v ? `<td class="n" style="background:rgba(229,231,235,${(0.03 + 0.28 * v / max).toFixed(3)})">${n0(v)}</td>` : '<td class="n z">·</td>').join('')}<td class="n tc">${n0(f.total)}</td></tr>`).join('');
    const tot = `<tr class="tot"><td>Total</td>${extra ? '<td></td>' : ''}${m.totales.map((v) => `<td class="n">${n0(v)}</td>`).join('')}<td class="n tc">${n0(m.total)}</td></tr>`;
    return `<div class="tw"><table class="t"><thead>${cab}</thead><tbody>${filas}${tot}</tbody></table></div>`;
  }
  function vCadenas() {
    const v = $('#v-cadenas');
    const D0 = datos();
    if (!D0) { v.innerHTML = barraFuente() + sinDatos(); return; }
    const D = datosFiltrados(D0);
    const f = { ...S.cad, cadena: '*' };
    const m = C.matrizCadenas(D, cfg, f);
    const kp = C.matrizCadenas(D, cfg, { ...f, vista: 'cadena', otros: false });
    const cargaTxt = { Todo: 'AM + PM', AM: 'Solo AM', PM: 'Solo PM' }[f.carga];
    v.innerHTML = barraFuente() + barraFiltros(D0) + `
      <div class="bar">
        <div class="seg" role="tablist" aria-label="Vista">
          <button type="button" data-act="vista" data-v="cadena" class="${f.vista === 'cadena' ? 'on' : ''}">Cadena × Clave</button>
          <button type="button" data-act="vista" data-v="tienda" class="${f.vista === 'tienda' ? 'on' : ''}">Tienda × Clave</button>
        </div>
        <label class="fld">Carga<select data-f="carga">${[['Todo', 'AM + PM'], ['AM', 'Solo AM'], ['PM', 'Solo PM']].map(([k, l]) => `<option value="${k}" ${k === f.carga ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="fld">Tipo<select data-f="tipo">${['Normal', 'Cambios', 'Reposición', 'Todo'].map((t) => `<option ${t === f.tipo ? 'selected' : ''} value="${t}">${t === 'Normal' ? 'Venta normal' : t}</option>`).join('')}</select></label>
        <label class="chk" style="height:38px"><input type="checkbox" data-f="otros" ${f.otros ? 'checked' : ''}> Incluir otros clientes</label>
        <div class="right"><button type="button" class="btn" data-act="expCad">${ico.xls} Exportar a Excel</button></div>
      </div>
      <div class="kpis">${kp.filas.map((r) => `<div class="kpi"><div class="l">${esc(r.nombre)}</div><div class="v">${n0(r.total)}</div><div class="s">${r.tiendas} tiendas</div></div>`).join('')}</div>
      <div class="card">
        <div class="hd"><h3>${f.vista === 'cadena' ? 'Unidades por cadena y clave' : 'Unidades por tienda y clave'}</h3>
          <span class="note">${cargaTxt} · ${f.tipo === 'Normal' ? 'venta normal' : f.tipo.toLowerCase()} · corte ${esc(fechaTxt(D.corteDia))} ${C.hora(D.corteMin)}</span></div>
        ${matrizHTML(m, f.vista === 'cadena' ? 'CADENA' : 'TIENDA', f.vista === 'tienda')}
      </div>`;
    S.matriz = m;
  }
  function aoaMatriz(m, primera) {
    return [[primera].concat(m.cols, 'TOTAL')].concat(m.filas.map((f) => [f.nombre].concat(f.vals, f.total))).concat([['Total'].concat(m.totales, m.total)]);
  }

  /* ================= CAMBIOS ================= */
  function vCambios() {
    const v = $('#v-cambios');
    const D0 = datos();
    if (!D0) { v.innerHTML = barraFuente() + sinDatos(); return; }
    const D = datosFiltrados(D0);
    const r = C.cambios(D, cfg, S.camb.carga);
    const maxU = Math.max(1, ...r.porClave.map((x) => x.u));
    const w = (p) => p != null && p >= 2.5 ? 'color:var(--warn)' : 'color:var(--tx2)';
    v.innerHTML = barraFuente() + barraFiltros(D0) + `
      <div class="bar">
        <h1 class="t">Cambios despachados</h1>
        <span class="dim" style="font-size:13px;align-self:center">corte ${esc(fechaTxt(D.corteDia))} ${C.hora(D.corteMin)}</span>
        <div class="seg" role="tablist" aria-label="Carga">${[['Todo', 'AM + PM'], ['AM', 'Solo AM'], ['PM', 'Solo PM']].map(([k, l]) => `<button type="button" data-act="cCarga" data-v="${k}" class="${S.camb.carga === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="right"><button type="button" class="btn" data-act="expCamb">${ico.xls} Exportar a Excel</button></div>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="l">Unidades en cambios</div><div class="v">${n0(r.total)}</div></div>
        <div class="kpi"><div class="l">Sobre la venta normal</div><div class="v" style="color:var(--warn)">${r.pct == null ? '—' : r.pct.toFixed(2) + '%'}</div><div class="s">${n0(r.normal)} u. normales</div></div>
        <div class="kpi"><div class="l">Rutas con cambios</div><div class="v">${r.rutas}</div></div>
        <div class="kpi"><div class="l">Clientes con cambios</div><div class="v">${r.clientes}</div></div>
      </div>
      ${!r.total ? '<div class="card empty"><b>Sin cambios</b>No hay líneas de tipo Cambios en esta carga.</div>' : `
      <div class="row">
        <div class="card" style="flex:1 1 480px;min-width:0">
          <div class="hd"><h3>Por clave</h3><span class="note">Barra = unidades de cambio · % sobre lo despachado normal de esa clave</span></div>
          <div class="tw"><table class="t"><thead><tr><th>CLAVE</th><th style="width:45%"></th><th class="n">CAMBIOS</th><th class="n">NORMAL</th><th class="n">%</th></tr></thead><tbody>
          ${r.porClave.map((x) => `<tr><td class="mono" style="color:var(--c)">${esc(x.codigo)}</td><td><div class="barra"><i style="width:${Math.round(x.u / maxU * 100)}%"></i></div></td><td class="n">${n0(x.u)}</td><td class="n dim">${n0(x.normal)}</td><td class="n" style="${w(x.pct)}">${pct(x.pct)}</td></tr>`).join('')}
          <tr class="tot"><td>Total</td><td></td><td class="n">${n0(r.total)}</td><td class="n">${n0(r.normal)}</td><td class="n">${pct(r.pct)}</td></tr>
          </tbody></table></div>
        </div>
        <div style="flex:1 1 440px;min-width:0;display:flex;flex-direction:column;gap:16px">
          <div class="card"><div class="hd"><h3>Por ruta</h3></div>
            <div class="tw"><table class="t"><thead><tr><th>RUTA</th><th class="n">CAMBIOS</th><th class="n">CLIENTES</th><th class="n">% DE SU VENTA</th></tr></thead><tbody>
            ${r.porRuta.map((x) => `<tr><td><span class="mono" style="color:var(--g);margin-right:8px">${esc(x.ruta)}</span>${esc(x.nombre)}</td><td class="n">${n0(x.u)}</td><td class="n dim">${x.clientes}</td><td class="n" style="${w(x.pct)}">${pct(x.pct)}</td></tr>`).join('')}
            <tr class="tot"><td>Total</td><td class="n">${n0(r.total)}</td><td class="n">${r.clientes}</td><td class="n">${pct(r.pct)}</td></tr></tbody></table></div></div>
          <div class="card"><div class="hd"><h3>Por cliente</h3></div>
            <div class="tw" style="max-height:420px;overflow:auto"><table class="t"><thead><tr><th>CLIENTE</th><th>RUTA</th><th class="n">CAMBIOS</th></tr></thead><tbody>
            ${r.porCliente.map((x) => `<tr><td>${esc(x.cliente)}<div class="dim" style="font-size:11px">${esc(x.cadena)}</div></td><td class="dim">${esc(x.ruta + ' ' + x.rutaNombre)}</td><td class="n">${n0(x.u)}</td></tr>`).join('')}
            <tr class="tot"><td>Total</td><td></td><td class="n">${n0(r.total)}</td></tr></tbody></table></div></div>
        </div>
      </div>`}`;
    S.cambiosR = r;
  }

  /* ================= VERIFICACIÓN ================= */
  function vVerif() {
    const v = $('#v-verif');
    const D = datos();
    if (!D) { v.innerHTML = barraFuente() + sinDatos(); return; }
    const hoy = D.corteDia, ayer = C.sumarDias(hoy, -1);
    const hayAyer = D.lineas.some((l) => l.clase === 'AYER' && l.verif);
    if (S.verJ === 'ayer' && !hayAyer) S.verJ = 'dia';
    const J = { dia: [hoy, null], AM: [hoy, 'AM'], PM: [hoy, 'PM'], ayer: [ayer, 'AYER'] }[S.verJ] || [hoy, null];
    const dia = J[0];
    const r = C.verificacion(D, cfg, J[0], J[1]);
    S.verifR = r;
    let tl = '';
    if (r.filas.length) {
      const ini = Math.floor(r.ini / 30) * 30, fin = Math.max(ini + 60, Math.ceil((r.fin + 1) / 30) * 30);
      const pos = (m) => ((m - ini) / (fin - ini) * 100).toFixed(2) + '%';
      const marcas = []; for (let m = ini; m <= fin; m += 30) marcas.push(C.hora(m));
      tl = `<div class="card pad stack">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:baseline"><h3 style="margin:0;font-size:15px">Línea de tiempo</h3><span class="dim" style="font-size:12px">Cada marca es un vale verificado</span></div>
        <div class="tl"><span></span><div class="eje">${marcas.map((m) => `<span>${m}</span>`).join('')}</div>
        ${r.filas.map((f) => `<span style="font-size:13px;font-weight:500">${esc(f.nombre)}</span><div class="pista"><div class="banda" style="left:${pos(f.ini)};width:calc(${pos(f.fin)} - ${pos(f.ini)} + 2px)"></div>${f.marcas.map((m) => `<div class="marca" style="left:${pos(m)}" title="${C.hora(m)}"></div>`).join('')}</div>`).join('')}
        </div>
        <p class="dim" style="margin:4px 0 0;font-size:12px;line-height:1.5">El sistema guarda una hora por vale, no por línea: las líneas por hora son un promedio de la ventana de trabajo.</p></div>`;
    }
    v.innerHTML = barraFuente() + `
      <div class="bar">
        <h1 class="t">Carga de verificación</h1>
        <div class="seg" role="tablist" aria-label="Jornada">
          <button type="button" data-act="verJ" data-v="dia" class="${S.verJ === 'dia' ? 'on' : ''}">Todo el ${esc(fechaTxt(hoy))}</button>
          <button type="button" data-act="verJ" data-v="AM" class="${S.verJ === 'AM' ? 'on' : ''}">Mañana · carga AM</button>
          <button type="button" data-act="verJ" data-v="PM" class="${S.verJ === 'PM' ? 'on' : ''}">Tarde · carga PM</button>
          ${hayAyer ? `<button type="button" data-act="verJ" data-v="ayer" class="${S.verJ === 'ayer' ? 'on' : ''}">Tarde del ${esc(fechaTxt(ayer))}</button>` : ''}
        </div>
        <div class="right"><button type="button" class="btn" data-act="expVer">${ico.xls} Exportar a Excel</button></div>
      </div>
      ${!r.filas.length ? '<div class="card empty"><b>Sin verificaciones en esta jornada</b>No hay líneas verificadas en esta jornada.</div>' : `
      <div class="card" style="margin-bottom:16px"><div class="tw"><table class="t"><thead><tr><th>VERIFICADORA</th><th class="n">VALES</th><th class="n">LÍNEAS</th><th class="n">UNIDADES</th><th class="n">RUTAS</th><th>VENTANA</th><th class="n">LÍNEAS / HORA</th></tr></thead><tbody>
        ${r.filas.map((f) => `<tr><td><b style="font-weight:600">${esc(f.nombre)}</b><div class="mono dim" style="font-size:11px">usuario ${esc(f.codigo)}</div></td><td class="n">${f.vales}</td><td class="n">${n0(f.lineas)}</td><td class="n">${n0(f.u)}</td><td class="n dim">${f.rutas}</td><td class="mono dim">${C.hora(f.ini)} – ${C.hora(f.fin)}</td><td class="n" style="color:var(--g)">${f.lph ?? '—'}</td></tr>`).join('')}
        <tr class="tot"><td>Total</td><td class="n">${r.tot.vales}</td><td class="n">${n0(r.tot.lineas)}</td><td class="n">${n0(r.tot.u)}</td><td></td><td class="mono">${C.hora(r.ini)} – ${C.hora(r.fin)}</td><td></td></tr>
      </tbody></table></div></div>${tl}`}`;
  }

  /* ================= HISTORIAL ================= */
  async function leerHistorial(pedir) {
    const dir = await dirCierres(pedir);
    if (!dir) return false;
    S.hist.indice = await leerIndice(dir);
    return true;
  }
  function graficaSVG(pts) {
    if (pts.length < 2) return `<div class="empty" style="border:1px dashed var(--line2);border-radius:10px"><b>Se dibuja con al menos 2 cortes</b>Hay ${pts.length} con estos filtros.</div>`;
    const W = 900, H = 240, P = { l: 56, r: 44, t: 14, b: 34 };
    const max = Math.max(...pts.map((p) => p.u)) * 1.1 || 1;
    const x = (i) => P.l + i * (W - P.l - P.r) / (pts.length - 1);
    const y = (u) => P.t + (H - P.t - P.b) * (1 - u / max);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(max * k));
    const paso = Math.max(1, Math.ceil(pts.length / 12));
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Unidades por fecha">
      ${ticks.map((t) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--rz-card-borde,#262A32)"/><text x="${P.l - 8}" y="${y(t) + 4}" fill="var(--rz-tx3,#6B7280)" font-size="11" text-anchor="end" font-family="JetBrains Mono">${n0(t)}</text>`).join('')}
      <polyline fill="none" stroke="url(#gr)" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p, i) => x(i) + ',' + y(p.u)).join(' ')}"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.u)}" r="3.5" fill="var(--rz-bg,#0D0F12)" stroke="var(--rz-tx,#F3F4F6)" stroke-width="2"><title>${p.fecha}: ${n0(p.u)}</title></circle>${i % paso === 0 ? `<text x="${x(i)}" y="${H - 12}" fill="var(--rz-tx3,#6B7280)" font-size="11" text-anchor="middle">${esc(C.fechaCorta(p.fecha))}</text>` : ''}`).join('')}
    </svg>`;
  }
  /* ---------- carga histórica ---------- */
  async function cargarHistorico(file) {
    toast('Leyendo ' + file.name + '…');
    try {
      const a = C.leerLibro(new Uint8Array(await file.arrayBuffer()), file.name, window.XLSX);
      a.file = file;
      const dias = C.dividirPorDia([a], cfg);
      let existentes = [];
      try { existentes = (await listarCierres(true)) || []; } catch (_) {}
      const ex = new Set(existentes);
      S.hist.pre = { archivo: a, dias: dias.map((d) => ({ ...d, existe: ex.has(d.dia), incluir: d.completo && !ex.has(d.dia) })) };
      toast(file.name + ': ' + dias.length + ' días encontrados. Revisa la lista y guarda.', 'ok');
    } catch (e) { toast(e.message, 'bad'); }
    vHist();
  }
  function previaHistorica() {
    const P = S.hist.pre; if (!P) return '';
    const n = P.dias.filter((d) => d.incluir).length;
    return `<div class="card">
      <div class="hd"><h3>Carga histórica · ${esc(P.archivo.nombre)}</h3><span class="note">${n} de ${P.dias.length} días marcados</span>
        <div style="margin-left:auto;display:flex;gap:8px"><button type="button" class="btn sm ghost" data-act="histCancelar">Cancelar</button>
        <button type="button" class="btn sm pri" data-act="histGuardar" ${n ? '' : 'disabled'}>${ico.save} Guardar ${n} cierre${n === 1 ? '' : 's'}</button></div></div>
      <div class="tw" style="max-height:460px;overflow:auto"><table class="t"><thead><tr><th></th><th>DÍA</th><th class="n">LÍNEAS AM</th><th class="n">UNID. AM</th><th class="n">LÍNEAS PM</th><th class="n">UNID. PM</th><th class="n">SIN VERIFICAR</th><th>NOTA</th></tr></thead><tbody>
      ${P.dias.map((d, i) => `<tr><td><input type="checkbox" data-hpre="${i}" ${d.incluir ? 'checked' : ''} aria-label="Incluir ${esc(d.dia)}"></td>
        <td><b style="font-weight:600">${esc(C.fechaCorta(d.dia))}</b> <span class="dim">${d.dia.slice(0, 4)}</span></td>
        <td class="n">${n0(d.am.lineas)}</td><td class="n">${n0(d.am.u)}</td><td class="n">${n0(d.pm.lineas)}</td><td class="n">${n0(d.pm.u)}</td>
        <td class="n ${d.sinVerif ? '' : 'dim'}">${n0(d.sinVerif)}</td>
        <td style="white-space:normal;font-size:12px">${d.nota ? `<span style="color:var(--warn)">${esc(d.nota)}</span>` : ''}${d.existe ? `${d.nota ? ' · ' : ''}<span style="color:var(--c)">Ya hay cierre: se reemplaza si lo marcas</span>` : ''}</td></tr>`).join('')}
      <tr class="tot"><td></td><td>Total marcado</td>${['am', 'pm'].map((k) => `<td class="n">${n0(P.dias.filter((d) => d.incluir).reduce((s, d) => s + d[k].lineas, 0))}</td><td class="n">${n0(P.dias.filter((d) => d.incluir).reduce((s, d) => s + d[k].u, 0))}</td>`).join('')}<td class="n">${n0(P.dias.filter((d) => d.incluir).reduce((s, d) => s + d.sinVerif, 0))}</td><td></td></tr>
      </tbody></table></div>
      <p class="dim" style="margin:0;padding:10px 18px;font-size:12px;line-height:1.5">Mañana = lo de la fecha del día; tarde = lo verificado ese día para el día siguiente (el sábado, para el lunes). Los días incompletos quedan sin marcar.</p>
    </div>`;
  }
  async function guardarHistorico() {
    const P = S.hist.pre; if (!P) return;
    const sel = P.dias.filter((d) => d.incluir);
    const dir = await dirCierres(true).catch(() => null);
    if (!dir) { toast('Primero elige la carpeta Hx en Configuración › Carpetas.', 'bad'); return; }
    const reemplaza = sel.filter((d) => d.existe).length;
    if (!confirm('Se guardarán ' + sel.length + ' cierres en Hx\\Cierres' + (reemplaza ? ', reemplazando ' + reemplaza + ' que ya existen' : '') + '. ¿Continuar?')) return;
    const ind = await leerIndice(dir);
    let i = 0;
    for (const d of sel) {
      const foto = C.fotoCierre(d.est, [P.archivo]);
      await K.escribir(dir, d.dia + '.json', JSON.stringify(foto));
      ind.dias[d.dia] = C.indiceDia(foto);
      delete S.cierres.cache[d.dia];
      toast('Guardando cierres… ' + (++i) + ' de ' + sel.length);
    }
    await K.escribir(dir, '_indice.json', JSON.stringify(ind));
    if (cfg.carpetas.copiarCrudos && P.archivo.file) {
      try { const bk = await K.obtener('backup'); if (bk) { const cd = await K.subcarpeta(bk, 'Crudos/historico'); await K.escribir(cd, P.archivo.nombre, P.archivo.file); } } catch (_) {}
    }
    S.hist.indice = ind; S.cierres.lista = null; S.hist.pre = null;
    toast(sel.length + ' cierres guardados en el historial.', 'ok');
    vHist();
  }

  async function vHist() {
    const v = $('#v-hist');
    const st = await K.estado('hx');
    if (st.estado === 'sin') {
      v.innerHTML = `<div class="card empty"><b>Elige la carpeta Hx</b>Los cierres del día se guardan en OneDrive: ${esc(cfg.carpetas.hx)}\\Cierres<br><br><button type="button" class="btn pri" data-act="irCarpetas">Ir a Configuración › Carpetas</button></div>`;
      return;
    }
    if (!S.hist.indice) {
      let ok = false;
      if (st.estado === 'ok') { try { ok = await leerHistorial(false); } catch (_) {} }
      if (!ok) { v.innerHTML = `<div class="card empty"><b>Dar acceso a la carpeta Hx</b>El navegador pide confirmar el permiso cada vez que se abre la app.<br><br><button type="button" class="btn pri" data-act="leerHist">Abrir historial</button></div>`; return; }
    }
    const H = S.hist, dias = Object.values(H.indice.dias || {}).sort((a, b) => a.dia.localeCompare(b.dia));
    const rutasImg = new Set(cfg.rutas.filter((r) => r.enImagen).map((r) => r.ruta));
    const fRutas = H.soloImg ? rutasImg : null;
    const nombresR = Object.assign({}, ...dias.map((x) => x.rutas || {}));
    const rutas = Object.keys(nombresR).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const claves = [...new Set(dias.flatMap((x) => x.agg.map((r) => r[2])))];
    const pts = C.tendencia(dias, { turno: H.turno, ruta: H.ruta, clave: H.clave, rutas: fRutas });
    if (H.dow == null) { const ult = dias[dias.length - 1]; H.dow = ult ? (C.partes(ult.dia).dow + 1) % 7 : 1; }
    const pr = C.pronostico(dias, cfg, { turno: H.fTurno, dow: +H.dow, n: 4, rutas: fRutas });
    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const sel = (f, ops, val) => `<select data-h="${f}">${ops.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    v.innerHTML = `
      <div class="row">
        <aside class="side">
          <div class="card pad stack">
            <h2>Cierres guardados (${dias.length})</h2>
            <div class="stack" style="max-height:560px;overflow:auto">
            ${dias.length ? dias.slice().reverse().map((x) => `<div class="file" style="align-items:center">
                <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600">${esc(C.fechaCorta(x.dia))} ${x.dia.slice(0, 4)}</div>
                <div class="dim" style="font-size:12px">Corte ${esc(x.corteHora || '')} · AM ${n0(x.am)} · PM ${n0(x.pm)} · cambios ${n0(x.cambios)}</div></div>
                <button type="button" class="btn sm" data-act="verCierre" data-v="${x.dia}">Ver datos</button></div>`).join('') : '<div class="dim" style="font-size:13px;line-height:1.5">Todavía no hay cierres. Al terminar la operación, carga los crudos en Resumen, elige “Cierre del día” y guárdalo.</div>'}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-act="leerHist">Volver a leer</button><button type="button" class="btn sm ghost" data-act="reindex" title="Vuelve a calcular el índice leyendo todos los cierres">Reconstruir índice</button></div>
          </div>
          <div class="card pad stack">
            <h2>Carga histórica</h2>
            <p class="dim" style="margin:0;font-size:12px;line-height:1.5">Un crudo con varios días (por ejemplo del 2 al 25) se reparte en un cierre por día de operación. Antes de guardar ves la lista de días.</p>
            <button type="button" class="btn" data-act="histCargar">${ico.down} Cargar crudo de varios días</button>
          </div>
        </aside>
        <div class="mainc">${previaHistorica()}
          <div class="card pad stack">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
              <h3 style="margin:0;font-size:15px;align-self:center">Tendencia diaria</h3>
              <label class="fld" style="margin-left:auto">Carga${sel('turno', [['Ambos', 'AM + PM'], ['AM', 'AM'], ['PM', 'PM']], H.turno)}</label>
              <label class="fld">Ruta${sel('ruta', [['*', 'Todas']].concat(rutas.map((r) => [r, r + ' ' + (nombresR[r] || '')])), H.ruta)}</label>
              <label class="fld">Clave${sel('clave', [['*', 'Todas']].concat(claves.map((c) => [c, c])), H.clave)}</label>
              <label class="chk" style="height:38px"><input type="checkbox" data-h="soloImg" ${H.soloImg ? 'checked' : ''}> Solo rutas de la imagen</label>
            </div>
            ${graficaSVG(pts)}
            <p class="dim" style="margin:0;font-size:12px">Unidades de venta normal por día de operación (sin cambios), según los cierres guardados.</p>
          </div>
          <div class="card">
            <div class="hd" style="align-items:flex-end">
              <h3>Pronóstico para producción</h3>
              <span class="note">Promedio de ${pr.fechas.length || 0} cierre(s) de ${DIAS[H.dow].toLowerCase()} · máx. 4</span>
              <label class="fld" style="margin-left:auto">Día${sel('dow', DIAS.map((d, i) => [i, d]), H.dow)}</label>
              <label class="fld">Carga${sel('fTurno', [['Ambos', 'AM + PM'], ['AM', 'AM'], ['PM', 'PM']], H.fTurno)}</label>
              <button type="button" class="btn sm" data-act="expPron" style="align-self:flex-end">${ico.xls} Excel</button>
            </div>
            ${pr.filas.length ? `<div class="tw"><table class="t"><thead><tr><th>CLAVE</th><th class="n">PROMEDIO</th><th class="n">ÚLTIMO</th><th class="n">TENDENCIA</th><th class="n">PARRILLAS</th>${pr.fechas.map((d) => `<th class="n">${esc(C.fechaCorta(d))}</th>`).join('')}</tr></thead><tbody>
              ${pr.filas.map((x) => `<tr><td class="mono" style="color:var(--c)">${esc(x.codigo)}</td><td class="n" style="color:var(--g)">${n0(x.prom)}</td><td class="n">${n0(x.ult)}</td><td class="n" style="color:${x.tend == null ? 'var(--tx3)' : x.tend >= 0 ? 'var(--g)' : 'var(--warn)'}">${x.tend == null ? '—' : (x.tend >= 0 ? '+' : '') + x.tend.toFixed(0) + '%'}</td><td class="n">${x.parrillas ?? '—'}</td>${x.serie.map((s) => `<td class="n dim">${n0(s)}</td>`).join('')}</tr>`).join('')}
              <tr class="tot"><td>Total</td><td class="n">${n0(pr.filas.reduce((s, x) => s + x.prom, 0))}</td><td class="n">${n0(pr.filas.reduce((s, x) => s + x.ult, 0))}</td><td></td><td class="n">${n0(pr.filas.reduce((s, x) => s + (x.parrillas || 0), 0))}</td>${pr.fechas.map((_, j) => `<td class="n">${n0(pr.filas.reduce((s, x) => s + x.serie[j], 0))}</td>`).join('')}</tr>
            </tbody></table></div>` : `<div class="empty">Todavía no hay cierres de ${DIAS[H.dow].toLowerCase()} para esta carga.</div>`}
          </div>
        </div>
      </div>`;
    S.pron = pr;
  }

  /* ================= CONFIGURACIÓN ================= */
  const sw = (on, attrs) => `<button type="button" class="sw" role="switch" aria-checked="${on ? 'true' : 'false'}" ${attrs}></button>`;
  const mover = (sec, i) => `<span style="display:inline-flex;gap:2px"><button type="button" class="btn sm icon ghost" data-act="mover" data-sec="${sec}" data-i="${i}" data-d="-1" aria-label="Subir">${ico.up}</button><button type="button" class="btn sm icon ghost" data-act="mover" data-sec="${sec}" data-i="${i}" data-d="1" aria-label="Bajar">${ico.dn}</button></span>`;
  const borrar = (sec, i) => `<button type="button" class="btn sm icon ghost danger" data-act="borrar" data-sec="${sec}" data-i="${i}" aria-label="Quitar">${ico.del}</button>`;
  const inp = (sec, i, k, val, ph, extra) => `<input type="text" data-sec="${sec}" data-i="${i}" data-k="${k}" value="${esc(val)}" placeholder="${esc(ph || '')}" ${extra || ''}>`;

  async function vConfig() {
    const v = $('#v-config');
    const secs = [['rutas', 'Rutas'], ['claves', 'Claves de producto'], ['cadenas', 'Cadenas'], ['verificadoras', 'Verificadoras'], ['carpetas', 'Carpetas OneDrive']];
    const s = S.cfgSec;
    const nombresDatos = S.est ? C.deteccion(S.est, cfg).nombres : {};
    let cuerpo = '', titulo = '', ayuda = '', agregar = true;
    if (s === 'rutas') {
      titulo = 'Rutas'; ayuda = 'Qué rutas entran a la imagen, en qué orden y con qué nombre. Las demás siguen contando en Cadenas, Cambios y Verificación.';
      cuerpo = `<table class="t cfg"><thead><tr><th>ORDEN</th><th>RUTA</th><th>NOMBRE EN EL SISTEMA</th><th>NOMBRE EN LA IMAGEN</th><th>TURNO</th><th>EN LA IMAGEN</th><th></th></tr></thead><tbody>
        ${cfg.rutas.map((r, i) => `<tr><td>${mover('rutas', i)}</td><td style="width:90px">${inp('rutas', i, 'ruta', r.ruta, '', 'style="width:80px;min-width:0" class="mono"')}</td>
          <td class="muted">${esc(nombresDatos[r.ruta] || r.nombreSistema || '—')}</td>
          <td>${inp('rutas', i, 'nombreImagen', r.nombreImagen, nombresDatos[r.ruta] || r.nombreSistema)}</td>
          <td><select data-sec="rutas" data-i="${i}" data-k="turno">${[['auto', 'Automático'], ['AM', 'Solo AM'], ['PM', 'Solo PM']].map(([k, l]) => `<option value="${k}" ${r.turno === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
          <td>${sw(r.enImagen, `data-act="toggle" data-sec="rutas" data-i="${i}" data-k="enImagen" aria-label="Ruta ${esc(r.ruta)} en la imagen"`)}</td><td>${borrar('rutas', i)}</td></tr>`).join('')}
      </tbody></table>`;
    } else if (s === 'claves') {
      titulo = 'Claves de producto'; ayuda = 'Columnas de la imagen en este orden. Las unidades por parrilla y bolsa se usan en el pronóstico.';
      cuerpo = `<table class="t cfg"><thead><tr><th>ORDEN</th><th>CLAVE</th><th>DESCRIPCIÓN</th><th>U / PARRILLA</th><th>U / BOLSA</th><th>EN LA IMAGEN</th><th></th></tr></thead><tbody>
        ${cfg.claves.map((c, i) => `<tr><td>${mover('claves', i)}</td><td style="width:110px">${inp('claves', i, 'codigo', c.codigo, '', 'style="width:96px;min-width:0" class="mono"')}</td>
          <td>${inp('claves', i, 'descripcion', c.descripcion)}</td>
          <td><input type="number" min="0" data-sec="claves" data-i="${i}" data-k="parrilla" value="${esc(c.parrilla)}"></td>
          <td><input type="number" min="0" data-sec="claves" data-i="${i}" data-k="bolsa" value="${esc(c.bolsa)}"></td>
          <td>${sw(c.enImagen, `data-act="toggle" data-sec="claves" data-i="${i}" data-k="enImagen" aria-label="Clave ${esc(c.codigo)} en la imagen"`)}</td><td>${borrar('claves', i)}</td></tr>`).join('')}
      </tbody></table>`;
    } else if (s === 'cadenas') {
      titulo = 'Cadenas de supermercado'; ayuda = 'Se reconocen por palabras en el nombre del cliente, separadas por coma. La primera regla que coincide gana: deja las más específicas arriba.';
      const cuenta = {};
      if (S.est) { const vistos = {}; S.est.lineas.forEach((l) => { if (l.cad) { (vistos[l.cad.nombre] = vistos[l.cad.nombre] || new Set()).add(l.clienteNombre); } }); Object.keys(vistos).forEach((k) => { cuenta[k] = vistos[k].size; }); }
      cuerpo = `<table class="t cfg"><thead><tr><th>PRIORIDAD</th><th>CADENA</th><th>PALABRAS CLAVE</th><th class="n">CLIENTES EN EL CRUDO</th><th>ES SUPERMERCADO</th><th></th></tr></thead><tbody>
        ${cfg.cadenas.map((c, i) => `<tr><td>${mover('cadenas', i)}</td><td>${inp('cadenas', i, 'nombre', c.nombre)}</td><td>${inp('cadenas', i, 'claves', c.claves, 'PALABRA, OTRA PALABRA')}</td>
          <td class="n">${S.est ? (cuenta[c.nombre] || 0) : '—'}</td>
          <td>${sw(c.esSuper, `data-act="toggle" data-sec="cadenas" data-i="${i}" data-k="esSuper" aria-label="${esc(c.nombre)} es supermercado"`)}</td><td>${borrar('cadenas', i)}</td></tr>`).join('')}
      </tbody></table>`;
    } else if (s === 'verificadoras') {
      titulo = 'Verificadoras'; ayuda = 'El crudo solo trae el código de usuario (Verificado Usuario). Ponle nombre a cada código.';
      const conocidos = new Set(cfg.verificadoras.map((x) => x.codigo));
      const enDatos = S.est ? [...new Set(S.est.lineas.map((l) => l.verifUsuario).filter(Boolean))].filter((c) => !conocidos.has(c)) : [];
      cuerpo = `<table class="t cfg"><thead><tr><th>CÓDIGO</th><th>NOMBRE</th><th>ACTIVA</th><th></th></tr></thead><tbody>
        ${cfg.verificadoras.map((x, i) => `<tr><td style="width:120px">${inp('verificadoras', i, 'codigo', x.codigo, '0000', 'style="width:100px;min-width:0" class="mono"')}</td><td>${inp('verificadoras', i, 'nombre', x.nombre)}</td>
          <td>${sw(x.activa, `data-act="toggle" data-sec="verificadoras" data-i="${i}" data-k="activa" aria-label="Activa"`)}</td><td>${borrar('verificadoras', i)}</td></tr>`).join('')}
      </tbody></table>
      ${enDatos.length ? `<div class="info warn" style="margin:12px 18px">Códigos en el crudo sin nombre: ${enDatos.map(esc).join(', ')}. <button type="button" class="btn sm" data-act="agregarVerif">Agregarlos</button></div>` : ''}`;
    } else {
      titulo = 'Carpetas de OneDrive'; ayuda = 'Hx guarda el historial y los reportes, cada uno en su subcarpeta. Backup guarda respaldos de la configuración y copia de los crudos.'; agregar = false;
      const filas = [];
      for (const [k, l, sub] of [['hx', 'Reportería (Hx)', 'Historial · Cadenas · Cambios · Verificacion · Pronostico'], ['backup', 'Respaldo (Backup)', 'Config · Crudos']]) {
        const st = await K.estado(k);
        const est = st.estado === 'ok' ? `<span style="color:var(--g)">Conectada: ${esc(st.nombre)}</span>` : st.estado === 'pedir' ? `<span style="color:var(--warn)">Elegida (${esc(st.nombre)}), falta dar permiso</span>` : '<span class="dim">Sin elegir</span>';
        filas.push(`<tr><td><b style="font-weight:600">${l}</b><div class="dim" style="font-size:11px">${sub}</div></td>
          <td>${inp('carpetas', 0, k, cfg.carpetas[k], '', 'style="min-width:340px"')}</td><td>${est}</td>
          <td><div style="display:flex;gap:6px"><button type="button" class="btn sm" data-act="elegir" data-k="${k}">Elegir carpeta</button>${st.estado === 'pedir' ? `<button type="button" class="btn sm" data-act="permiso" data-k="${k}">Dar permiso</button>` : ''}</div></td></tr>`);
      }
      cuerpo = `<table class="t cfg"><thead><tr><th>CARPETA</th><th>RUTA EN ONEDRIVE (REFERENCIA)</th><th>ESTADO</th><th></th></tr></thead><tbody>${filas.join('')}</tbody></table>
        <div class="stack" style="padding:14px 18px">
          <label class="chk"><input type="checkbox" data-act="copiarCrudos" ${cfg.carpetas.copiarCrudos ? 'checked' : ''}> Al guardar en historial, copiar los crudos a Backup\\Crudos\\&lt;fecha&gt;</label>
          ${!K.soporta() ? '<div class="info warn">Este navegador no permite elegir carpetas. Usa Chrome o Edge en la PC; mientras tanto, los reportes se descargan.</div>' : ''}
          ${K.embebida ? '<div class="info warn">La app está abierta dentro del Centro de Control. Los navegadores no dejan elegir carpetas dentro de un marco: abre la app en su propia pestaña para conectar Hx y Backup.</div>' : ''}
          <div class="dim" style="font-size:12px;line-height:1.5">Al elegir, navega hasta la carpeta indicada. El navegador no deja leer la ruta completa; el texto de la izquierda es solo de referencia.</div>
        </div>`;
    }
    v.innerHTML = `
      <div class="bar">
        <div class="seg" role="tablist" aria-label="Secciones">${secs.map(([k, l]) => `<button type="button" data-act="sec" data-v="${k}" class="${s === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="right">
          <button type="button" class="btn" data-act="respaldar">${ico.save} Respaldar en Backup</button>
          <button type="button" class="btn" data-act="importar">Importar respaldo</button>
          <button type="button" class="btn ghost" data-act="iniciales">Valores iniciales</button>
        </div>
      </div>
      <div class="card">
        <div class="hd"><h3>${titulo}</h3><span class="note">${ayuda}</span>
          ${agregar ? `<button type="button" class="btn sm" data-act="agregar" style="margin-left:auto;color:var(--g)">+ Agregar fila</button>` : ''}</div>
        <div class="tw">${cuerpo}</div>
      </div>
      <p class="dim" style="font-size:12px;margin:10px 4px">Los cambios se guardan solos en este navegador.</p>`;
  }

  const nuevos = {
    rutas: () => ({ ruta: '', nombreSistema: '', nombreImagen: '', turno: 'auto', enImagen: true }),
    claves: () => ({ codigo: '', descripcion: '', parrilla: '', bolsa: '', enImagen: true }),
    cadenas: () => ({ nombre: 'Nueva cadena', claves: '', esSuper: true }),
    verificadoras: () => ({ codigo: '', nombre: '', activa: true })
  };

  async function respaldar() {
    const nombre = 'config_' + hoyTxt() + '.json';
    const datos = JSON.stringify(cfg, null, 2);
    try {
      const bk = await K.obtener('backup');
      if (bk) { const d = await K.subcarpeta(bk, 'Config'); await K.escribir(d, nombre, datos); toast('Respaldo guardado en Backup\\Config\\' + nombre, 'ok'); return; }
    } catch (_) {}
    K.descargar(nombre, datos, 'application/json');
    toast('Respaldo descargado (elige la carpeta Backup para guardarlo directo).');
  }

  /* ---------- navegación y eventos ---------- */
  async function irA(t) {
    S.tab = t;
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'v-' + t));
    // Sin crudos cargados, los módulos abren solos el último cierre guardado (si ya hay permiso a Hx).
    if (['cadenas', 'cambios', 'verif'].includes(t) && S.fuente === 'vivo' && !S.est) {
      try {
        const L = await listarCierres(false);
        if (L && L.length) await abrirCierre(L[L.length - 1], false);
      } catch (_) { /* sin permiso: se queda la barra para elegir */ }
    }
    pintar();
  }
  function pintar() {
    ({ resumen: vResumen, cadenas: vCadenas, cambios: vCambios, verif: vVerif, hist: vHist, config: vConfig })[S.tab]();
  }

  async function onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    try {
      switch (a) {
        case 'abrir': $('#fileInput').click(); break;
        case 'quitarArchivo': quitarArchivo(Number(b.dataset.v)); break;
        case 'limpiarArchivos': if (confirm('¿Quitar todos los crudos cargados? No borra ningún cierre guardado.')) reiniciar(); break;
        case 'solo': S.solo = b.dataset.v === '1'; vResumen(); break;
        case 'turno': S.turno = b.dataset.v; vResumen(); break;
        case 'whatsapp': {
          if (!S.canvas) return toast('No hay imagen para enviar.', 'bad');
          const r = await IMG.compartir(S.canvas, 'Resumen ' + S.turno + ' ' + S.res.fecha + '.jpg', S.res.titulo);
          if (r === 'compartido') toast('Imagen enviada.', 'ok');
          else if (r === 'copiado') toast('Este equipo no tiene el menú de compartir: la imagen quedó copiada, pégala en WhatsApp con Ctrl+V.');
          else if (r === 'descargado') toast('Este equipo no tiene el menú de compartir: la imagen se descargó.');
          break;
        }
        case 'copiar':
          if (!S.canvas) return toast('No hay imagen para copiar.', 'bad');
          await IMG.copiar(S.canvas); toast('Imagen copiada. Pégala en WhatsApp con Ctrl+V.', 'ok'); break;
        case 'descargar':
          if (!S.canvas) return toast('No hay imagen.', 'bad');
          await IMG.descargar(S.canvas, 'Resumen ' + S.turno + ' ' + S.res.fecha + '.jpg'); break;
        case 'cierre': await guardarCierre(); break;
        case 'modo': S.modo = b.dataset.v; vResumen(); guardarSesion(); break;
        case 'agregarNuevas': {
          const d = C.deteccion(S.est, cfg);
          d.nuevas.forEach((r) => cfg.rutas.push({ ruta: r.ruta, nombreSistema: r.nombre, nombreImagen: '', turno: 'auto', enImagen: false }));
          guardarCfg(); vResumen(); toast('Rutas agregadas en Configuración, fuera de la imagen.', 'ok'); break;
        }
        case 'vista': S.cad.vista = b.dataset.v; vCadenas(); break;
        case 'fAbrir': S.fAbierto = S.fAbierto === b.dataset.k ? null : b.dataset.k; pintar(); if (S.fAbierto) { const i = $('.view.on [data-fbusca]'); if (i) i.focus(); } break;
        case 'fCerrar': S.fAbierto = null; pintar(); break;
        case 'fLimpiar': S.filtros[b.dataset.k].clear(); S.fAbierto = null; pintar(); break;
        case 'fVisibles': $$('.view.on .plista .op').forEach((op) => { if (op.style.display !== 'none') { const c = op.querySelector('input'); c.checked = true; S.filtros[b.dataset.k].add(c.value); } }); break;
        case 'fQuitar': FIL.forEach(([k]) => S.filtros[k].clear()); S.fAbierto = null; pintar(); break;
        case 'expCad': {
          const f = S.cad, m = S.matriz;
          const base = (f.vista === 'cadena' ? 'Cadenas x Clave' : 'Tiendas x Clave') + (hayFiltros() ? ' (filtrado)' : '');
          await exportar('Cadenas', base + ' ' + datos().corteDia + ' ' + f.carga + '.xlsx', [{ nombre: f.vista === 'cadena' ? 'Cadena x Clave' : 'Tienda x Clave', aoa: aoaMatriz(m, f.vista === 'cadena' ? 'Cadena' : 'Tienda') }], textoFiltros(datos()));
          break;
        }
        case 'cCarga': S.camb.carga = b.dataset.v; vCambios(); break;
        case 'expCamb': {
          const r = S.cambiosR;
          await exportar('Cambios', 'Cambios ' + datos().corteDia + ' ' + S.camb.carga + (hayFiltros() ? ' (filtrado)' : '') + '.xlsx', [
            { nombre: 'Por clave', aoa: [['Clave', 'Cambios', 'Normal', '%']].concat(r.porClave.map((x) => [x.codigo, x.u, x.normal, x.pct == null ? '' : +x.pct.toFixed(2)])).concat([['Total', r.total, r.normal, r.pct == null ? '' : +r.pct.toFixed(2)]]) },
            { nombre: 'Por ruta', aoa: [['Ruta', 'Nombre', 'Cambios', 'Clientes', '% de su venta']].concat(r.porRuta.map((x) => [x.ruta, x.nombre, x.u, x.clientes, x.pct == null ? '' : +x.pct.toFixed(2)])).concat([['Total', '', r.total, r.clientes, r.pct == null ? '' : +r.pct.toFixed(2)]]) },
            { nombre: 'Por cliente', aoa: [['Cliente', 'Cadena', 'Ruta', 'Nombre ruta', 'Cambios']].concat(r.porCliente.map((x) => [x.cliente, x.cadena, x.ruta, x.rutaNombre, x.u])).concat([['Total', '', '', '', r.total]]) }
          ], textoFiltros(datos()));
          break;
        }
        case 'verJ': S.verJ = b.dataset.v; vVerif(); break;
        case 'fuenteVivo': S.fuente = 'vivo'; pintar(); break;
        case 'fuenteCierres': {
          const L = await listarCierres(true);
          if (!L) { toast('Elige la carpeta Hx en Configuración › Carpetas para ver los cierres.', 'bad'); return; }
          if (!L.length) { toast('Todavía no hay cierres guardados.', 'bad'); return; }
          await abrirCierre(S.fuente !== 'vivo' && L.includes(S.fuente) ? S.fuente : L[L.length - 1]);
          pintar(); break;
        }
        case 'diaMover': {
          const L = S.cierres.lista || [], j = L.indexOf(S.fuente) + (+b.dataset.d);
          if (j < 0 || j >= L.length) return;
          await abrirCierre(L[j]); pintar(); break;
        }
        case 'verCierre': await listarCierres(true); await abrirCierre(b.dataset.v); irA('cadenas'); break;
        case 'histCargar': $('#histInput').click(); break;
        case 'histCancelar': S.hist.pre = null; vHist(); break;
        case 'histGuardar': await guardarHistorico(); break;
        case 'reindex': await reconstruirIndice(); toast('Índice del historial reconstruido.', 'ok'); vHist(); break;
        case 'expVer': {
          const r = S.verifR;
          await exportar('Verificacion', 'Verificacion ' + r.dia + '.xlsx', [{ nombre: 'Verificadoras', aoa: [['Código', 'Nombre', 'Vales', 'Líneas', 'Unidades', 'Rutas', 'Inicio', 'Fin', 'Líneas por hora']]
            .concat(r.filas.map((f) => [f.codigo, f.nombre, f.vales, f.lineas, f.u, f.rutas, C.hora(f.ini), C.hora(f.fin), f.lph ?? ''])).concat([['Total', '', r.tot.vales, r.tot.lineas, r.tot.u, '', C.hora(r.ini), C.hora(r.fin), '']]) }]);
          break;
        }
        case 'irCarpetas': S.cfgSec = 'carpetas'; irA('config'); break;
        case 'leerHist': S.hist.indice = null; if (await leerHistorial(true)) vHist(); else toast('No se dio permiso a la carpeta Hx.', 'bad'); break;
        case 'expPron': {
          const pr = S.pron; if (!pr || !pr.filas.length) return toast('No hay pronóstico para exportar.', 'bad');
          await exportar('Pronostico', 'Pronostico ' + ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][S.hist.dow] + ' ' + S.hist.fTurno + ' ' + hoyTxt() + '.xlsx', [{ nombre: 'Pronóstico', aoa: [['Clave', 'Promedio', 'Último', 'Tendencia %', 'Parrillas'].concat(pr.fechas)]
            .concat(pr.filas.map((x) => [x.codigo, x.prom, x.ult, x.tend == null ? '' : Math.round(x.tend), x.parrillas ?? ''].concat(x.serie))) }]);
          break;
        }
        case 'sec': S.cfgSec = b.dataset.v; vConfig(); break;
        case 'toggle': { const o = cfg[b.dataset.sec][+b.dataset.i]; o[b.dataset.k] = !o[b.dataset.k]; guardarCfg(); b.setAttribute('aria-checked', o[b.dataset.k] ? 'true' : 'false'); break; }
        case 'mover': {
          const arr = cfg[b.dataset.sec], i = +b.dataset.i, j = i + (+b.dataset.d);
          if (j < 0 || j >= arr.length) return;
          [arr[i], arr[j]] = [arr[j], arr[i]]; guardarCfg(); vConfig(); break;
        }
        case 'borrar': {
          const arr = cfg[b.dataset.sec], o = arr[+b.dataset.i];
          const nm = o.ruta || o.codigo || o.nombre || 'esta fila';
          if (!confirm('¿Quitar ' + nm + '?')) return;
          arr.splice(+b.dataset.i, 1); guardarCfg(); vConfig(); break;
        }
        case 'agregar': cfg[S.cfgSec].push(nuevos[S.cfgSec]()); guardarCfg(false); await vConfig(); { const ins = $$('#v-config tbody tr:last-child input[type=text]'); if (ins[0]) ins[0].focus(); } break;
        case 'agregarVerif': {
          const conocidos = new Set(cfg.verificadoras.map((x) => x.codigo));
          [...new Set(S.est.lineas.map((l) => l.verifUsuario).filter(Boolean))].filter((c) => !conocidos.has(c)).sort()
            .forEach((c) => cfg.verificadoras.push({ codigo: c, nombre: 'Usuario ' + c, activa: true }));
          guardarCfg(); vConfig(); break;
        }
        case 'elegir': await K.elegir(b.dataset.k); S.hist.indice = null; S.cierres = { lista: null, cache: {} }; toast('Carpeta conectada.', 'ok'); vConfig(); break;
        case 'permiso': await K.obtener(b.dataset.k, true); vConfig(); break;
        case 'copiarCrudos': cfg.carpetas.copiarCrudos = b.checked; guardarCfg(false); break;
        case 'respaldar': await respaldar(); break;
        case 'importar': $('#cfgInput').click(); break;
        case 'iniciales':
          if (!confirm('¿Volver a la configuración inicial? Se pierden rutas, claves, cadenas y nombres que hayas cambiado. (Respalda antes si lo necesitas.)')) return;
          { const carpetas = cfg.carpetas; cfg = window.Config.inicial(); cfg.carpetas = carpetas; }
          guardarCfg(); vConfig(); toast('Configuración inicial restaurada.', 'ok'); break;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.error(err); toast(err.message || String(err), 'bad');
    }
  }

  async function onChange(e) {
    const t = e.target;
    if (t.matches('[data-fk]')) {
      const set = S.filtros[t.dataset.fk];
      t.checked ? set.add(t.value) : set.delete(t.value);
      const btn = t.closest('.msel').querySelector('[data-act=fAbrir]');
      const nombre = FIL.find(([k]) => k === t.dataset.fk)[1];
      btn.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) n.textContent = ' ' + nombre + ': ' + (set.size ? set.size : 'todas') + ' '; });
      return;
    }
    if (t.matches('[data-fuente]')) {
      try { await abrirCierre(t.value); } catch (err) { toast(err.message, 'bad'); }
      pintar(); return;
    }
    if (t.matches('#v-cadenas [data-f]')) {
      const k = t.dataset.f; S.cad[k] = t.type === 'checkbox' ? t.checked : t.value;
      if (k === 'otros' && !t.checked && S.cad.cadena === 'Otros clientes') S.cad.cadena = '*';
      vCadenas(); return;
    }
    if (t.matches('[data-hpre]')) { S.hist.pre.dias[+t.dataset.hpre].incluir = t.checked; vHist(); return; }
    if (t.matches('#v-hist [data-h]')) {
      const k = t.dataset.h; S.hist[k] = t.type === 'checkbox' ? t.checked : t.value; vHist(); return;
    }
    if (t.matches('#v-config [data-sec][data-k]')) {
      const sec = t.dataset.sec, k = t.dataset.k;
      let val = t.value;
      if (sec === 'carpetas') { cfg.carpetas[k] = val; guardarCfg(false); return; }
      if (k === 'ruta' || k === 'codigo') val = val.trim();
      if (sec === 'verificadoras' && k === 'codigo' && /^\d+$/.test(val)) { val = val.padStart(4, '0'); t.value = val; }
      cfg[sec][+t.dataset.i][k] = val;
      guardarCfg(sec === 'cadenas' || sec === 'rutas');
    }
  }

  async function importarCfg(file) {
    try {
      const nuevo = window.Config.completar(JSON.parse(await file.text()));
      if (!confirm('¿Reemplazar la configuración actual con "' + file.name + '"?')) return;
      cfg = nuevo; guardarCfg(); vConfig(); toast('Configuración importada.', 'ok');
    } catch (e) { toast('No pude leer ese respaldo: ' + e.message, 'bad'); }
  }

  /* Instalación como app (PWA) */
  let avisoInstalar = null;
  function instalacion() {
    const b = $('#btnInstalar');
    const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); avisoInstalar = e; if (!instalada) b.hidden = false; });
    window.addEventListener('appinstalled', () => { b.hidden = true; avisoInstalar = null; toast('Rutas Súper quedó instalada.', 'ok'); });
    b.addEventListener('click', async () => {
      if (!avisoInstalar) return;
      avisoInstalar.prompt();
      try { await avisoInstalar.userChoice; } catch (_) {}
      avisoInstalar = null; b.hidden = true;
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  function iniciar() {
    $('#ver').textContent = VERSION;
    instalacion();
    leerSesion().then((ses) => {
      if (!ses || !ses.archivos || !ses.archivos.length || S.archivos.length) return;
      S.archivos = ses.archivos; S.modo = ses.modo || 'whatsapp'; S.solo = !!ses.solo;
      S.est = C.clasificar(S.archivos, cfg);
      S.turno = S.est.hayAM ? 'AM' : 'PM';
      pintar(); avisarCentro();
      toast('Se recuperaron los crudos del ' + fechaTxt(S.est.corteDia) + ' ' + C.hora(S.est.corteMin) + '.');
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.tipo === 'cc:resumen' && ultimoInsight) { try { e.source.postMessage({ tipo: 'cc:insight', id: 'rutas', insight: ultimoInsight }, '*'); } catch (_) {} }
    });
    $$('.tabs button').forEach((b) => b.addEventListener('click', () => irA(b.dataset.tab)));
    $('#btnReiniciar').addEventListener('click', reiniciar);
    $('#app').addEventListener('click', onClick);
    $('#app').addEventListener('change', onChange);
    // Buscar dentro de un filtro sin volver a dibujar la lista
    $('#app').addEventListener('input', (e) => {
      if (!e.target.matches('[data-fbusca]')) return;
      const q = e.target.value.trim().toLowerCase();
      $$('.view.on .plista .op').forEach((op) => { op.style.display = !q || op.dataset.txt.includes(q) ? '' : 'none'; });
    });
    // Clic fuera de un filtro abierto: se aplica y se cierra
    document.addEventListener('click', (e) => {
      if (S.fAbierto && !e.target.closest('.msel')) { S.fAbierto = null; if (!e.target.closest('[data-act]') || e.target.closest('.tabs')) pintar(); }
    }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.fAbierto) { S.fAbierto = null; pintar(); } });
    $('#fileInput').addEventListener('change', (e) => { cargarArchivos(e.target.files); e.target.value = ''; });
    $('#histInput').addEventListener('change', (e) => { if (e.target.files[0]) cargarHistorico(e.target.files[0]); e.target.value = ''; });
    $('#cfgInput').addEventListener('change', (e) => { if (e.target.files[0]) importarCfg(e.target.files[0]); e.target.value = ''; });
    // Arrastrar y soltar en cualquier parte de la app
    let cnt = 0;
    window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { cnt++; const z = $('#dropZone'); if (z) z.classList.add('over'); } });
    window.addEventListener('dragleave', () => { cnt = Math.max(0, cnt - 1); if (!cnt) { const z = $('#dropZone'); if (z) z.classList.remove('over'); } });
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault(); cnt = 0; const z = $('#dropZone'); if (z) z.classList.remove('over');
      if (e.dataTransfer && e.dataTransfer.files.length) { if (S.tab !== 'resumen') irA('resumen'); cargarArchivos(e.dataTransfer.files); }
    });
    pintar();
  }
  iniciar();
})();
