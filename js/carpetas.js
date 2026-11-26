/* Carpetas de OneDrive (Hx y Backup) con la API de acceso a archivos del navegador.
   El permiso se recuerda en IndexedDB; el navegador puede pedir confirmarlo al volver a abrir. */
(function (root) {
  'use strict';
  const DB = 'rutas_pana', STORE = 'carpetas';
  const soporta = () => typeof window.showDirectoryPicker === 'function';
  const embebida = (() => { try { return window.self !== window.top; } catch (_) { return true; } })();

  function abrirDB() {
    return new Promise((ok, mal) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
    });
  }
  async function guardarHandle(k, h) { const db = await abrirDB(); return new Promise((ok, mal) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(h, k); t.oncomplete = ok; t.onerror = () => mal(t.error); }); }
  async function leerHandle(k) { try { const db = await abrirDB(); return await new Promise((ok) => { const r = db.transaction(STORE).objectStore(STORE).get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch (_) { return null; } }

  const cache = {};
  /** Estado de una carpeta: 'sin' (no elegida), 'pedir' (hay que confirmar permiso), 'ok'. */
  async function estado(k) {
    const h = cache[k] || await leerHandle(k);
    if (!h) return { estado: 'sin' };
    cache[k] = h;
    let p = 'prompt';
    try { p = await h.queryPermission({ mode: 'readwrite' }); } catch (_) {}
    return { estado: p === 'granted' ? 'ok' : 'pedir', nombre: h.name };
  }
  async function elegir(k) {
    if (!soporta()) throw new Error('Este navegador no permite elegir carpetas. Usa Chrome o Edge en la PC.');
    const h = await window.showDirectoryPicker({ id: 'rutas_' + k, mode: 'readwrite' });
    cache[k] = h; await guardarHandle(k, h);
    return h.name;
  }
  /** Devuelve la carpeta lista para usar; si hace falta, pide permiso (necesita un clic del usuario). */
  async function obtener(k, pedir = true) {
    const h = cache[k] || await leerHandle(k);
    if (!h) return null;
    cache[k] = h;
    let p = await h.queryPermission({ mode: 'readwrite' });
    if (p !== 'granted' && pedir) p = await h.requestPermission({ mode: 'readwrite' });
    return p === 'granted' ? h : null;
  }
  async function subcarpeta(dir, ruta) {
    let d = dir;
    for (const parte of ruta.split('/').filter(Boolean)) d = await d.getDirectoryHandle(parte, { create: true });
    return d;
  }
  async function existe(dir, nombre) { try { await dir.getFileHandle(nombre); return true; } catch (_) { return false; } }
  async function escribir(dir, nombre, datos) {
    const fh = await dir.getFileHandle(nombre, { create: true });
    const w = await fh.createWritable();
    await w.write(datos); await w.close();
  }
  async function leerJSON(dir, nombre) { const fh = await dir.getFileHandle(nombre); return JSON.parse(await (await fh.getFile()).text()); }
  async function listar(dir, ext) {
    const out = [];
    for await (const [nombre, h] of dir.entries()) if (h.kind === 'file' && (!ext || nombre.toLowerCase().endsWith(ext))) out.push(nombre);
    return out.sort();
  }

  /** Descarga normal, para cuando no hay carpeta. */
  function descargar(nombre, datos, tipo) {
    const blob = datos instanceof Blob ? datos : new Blob([datos], { type: tipo || 'application/octet-stream' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  root.Carpetas = { soporta, embebida, estado, elegir, obtener, subcarpeta, existe, escribir, leerJSON, listar, descargar };
})(window);
