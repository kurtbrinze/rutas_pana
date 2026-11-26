/* Lectura del crudo del sistema de la panadería, clasificación AM / PM
   y todos los cálculos. No toca la pantalla: se puede probar aparte. */
(function (root) {
  'use strict';

  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  const up = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  // Nombre de columna normalizado → campo.
  const COLS = {
    serie: 'serie', req: 'requerimientovale', tipo: 'tiporequerimiento', fecha: 'fecha',
    tipoFactura: 'tipofactura', formaPago: 'formapago', cliente: 'cliente', clienteNombre: 'clientenombre',
    gln: 'gln', tienda: 'storenumber', ruta: 'ruta', rutaNombre: 'rutanombre', vale: 'vale',
    serieFactura: 'seriefactura', factura: 'factura', oc: 'ordencompra', usuario: 'usuario',
    grabado: 'fechagrabado', verifUsuario: 'verificadousuario', verif: 'verificadofecha',
    codigo: 'codigoqsystems', descripcion: 'descripcion', cantidad: 'cantidad',
    montoVenta: 'montoventa', montoFactura: 'montofactura'
  };
  const REQUERIDAS = ['fecha', 'ruta', 'rutaNombre', 'codigo', 'cantidad', 'clienteNombre'];

  /* Fechas: el crudo trae números de serie de Excel; si viene texto, se intenta
     dd/mm/aaaa hh:mm. Devuelve { d: 'AAAA-MM-DD', m: minutos del día } o null. */
  function fechaDe(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && isFinite(v) && v > 1) {
      const dt = new Date(Math.round((v - 25569) * 86400000));
      return { d: dt.toISOString().slice(0, 10), m: dt.getUTCHours() * 60 + dt.getUTCMinutes() };
    }
    if (v instanceof Date && !isNaN(v)) {
      const p = (n) => String(n).padStart(2, '0');
      return { d: v.getFullYear() + '-' + p(v.getMonth() + 1) + '-' + p(v.getDate()), m: v.getHours() * 60 + v.getMinutes() };
    }
    const s = String(v).trim();
    let r = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (r) {
      const y = r[3].length === 2 ? '20' + r[3] : r[3];
      return { d: y + '-' + r[2].padStart(2, '0') + '-' + r[1].padStart(2, '0'), m: r[4] ? (+r[4]) * 60 + (+r[5]) : 0 };
    }
    r = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (r) return { d: r[1] + '-' + r[2] + '-' + r[3], m: r[4] ? (+r[4]) * 60 + (+r[5]) : 0 };
    return null;
  }

  const codigoUsuario = (v) => {
    if (v == null || v === '') return '';
    const s = String(v).trim();
    return /^\d+(\.0+)?$/.test(s) ? String(parseInt(s, 10)).padStart(4, '0') : s;
  };
  const rutaDe = (v) => {
    if (v == null || v === '') return '';
    const s = String(v).trim();
    return /^\d+(\.0+)?$/.test(s) ? String(parseInt(s, 10)) : s;
  };
  const tipoDe = (v) => {
    const n = norm(v);
    if (n.includes('cambio')) return 'Cambios';
    if (n.includes('repos')) return 'Reposición';
    if (n.includes('normal')) return 'Normal';
    return String(v ?? '').replace(/^[\s-]+|[\s-]+$/g, '') || 'Normal';
  };
  const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };

  /** Lee una hoja (matriz de filas) del crudo. */
  function leerFilas(filas, nombreArchivo) {
    let hi = -1, idx = null;
    for (let i = 0; i < Math.min(filas.length, 20); i++) {
      const n = (filas[i] || []).map(norm);
      if (n.includes('ruta') && n.includes('cantidad')) {
        hi = i; idx = {};
        for (const [k, c] of Object.entries(COLS)) { const j = n.indexOf(c); if (j >= 0) idx[k] = j; }
        break;
      }
    }
    if (hi < 0) throw new Error('"' + nombreArchivo + '" no parece un crudo del sistema: no encuentro las columnas Ruta y Cantidad.');
    const falta = REQUERIDAS.filter((k) => idx[k] == null);
    if (falta.length) throw new Error('A "' + nombreArchivo + '" le faltan columnas: ' + falta.join(', '));
    const g = (f, k) => (idx[k] == null ? null : f[idx[k]]);
    const lineas = [];
    for (let i = hi + 1; i < filas.length; i++) {
      const f = filas[i]; if (!f) continue;
      const fecha = fechaDe(g(f, 'fecha'));
      const ruta = rutaDe(g(f, 'ruta'));
      const codigo = String(g(f, 'codigo') ?? '').trim();
      if (!fecha || !ruta || !codigo) continue;       // fila de totales u otra basura
      lineas.push({
        archivo: nombreArchivo,
        fecha: fecha.d,
        tipo: tipoDe(g(f, 'tipo')),
        tipoFactura: String(g(f, 'tipoFactura') ?? '').trim(),
        cliente: String(g(f, 'cliente') ?? '').trim(),
        clienteNombre: String(g(f, 'clienteNombre') ?? '').trim().replace(/\s+/g, ' '),
        tienda: String(g(f, 'tienda') ?? '').trim(),
        ruta, rutaNombre: String(g(f, 'rutaNombre') ?? '').trim(),
        vale: String(g(f, 'vale') ?? '').trim(),
        factura: String(g(f, 'factura') ?? '').trim(),
        oc: String(g(f, 'oc') ?? '').trim(),
        usuario: codigoUsuario(g(f, 'usuario')),
        grabado: fechaDe(g(f, 'grabado')),
        verifUsuario: codigoUsuario(g(f, 'verifUsuario')),
        verif: fechaDe(g(f, 'verif')),
        codigo,
        descripcion: String(g(f, 'descripcion') ?? '').trim(),
        cantidad: num(g(f, 'cantidad')),
        monto: num(g(f, 'montoFactura'))
      });
    }
    if (!lineas.length) throw new Error('"' + nombreArchivo + '" no tiene líneas con fecha y ruta.');
    // Fecha del archivo: la más repetida en la columna Fecha.
    const cuenta = {};
    lineas.forEach((l) => { cuenta[l.fecha] = (cuenta[l.fecha] || 0) + 1; });
    const fechaArchivo = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
    return { nombre: nombreArchivo, fecha: fechaArchivo, lineas };
  }

  /** Lee un archivo de Excel (ArrayBuffer) con SheetJS. */
  function leerLibro(buffer, nombreArchivo, XLSX) {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
    let ultimoError = null;
    for (const n of wb.SheetNames) {
      const filas = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null });
      try { return leerFilas(filas, nombreArchivo); } catch (e) { ultimoError = e; }
    }
    throw ultimoError || new Error('No pude leer "' + nombreArchivo + '".');
  }

  const sumarDias = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

  /** Cadena de un cliente según las reglas (la primera que coincide gana). */
  function cadenaDe(nombre, cadenas) {
    const n = up(nombre);
    for (const c of cadenas) {
      const claves = String(c.claves || '').split(',').map((s) => up(s).trim()).filter(Boolean);
      if (claves.some((k) => n.includes(k))) return { nombre: c.nombre, esSuper: !!c.esSuper };
    }
    return null;
  }

  /* Clasifica cada línea:
     - PM: la fecha del crudo es posterior al día del corte (carga de la tarde, sale mañana).
     - AM: fecha = día del corte y se verificó hoy (o aún no se verifica).
     - AYER: fecha = día del corte pero se verificó ayer: es la carga PM de ayer, ya reportada.
     - ANTERIOR: fechas viejas, se ignoran.
     El día del corte es el más reciente que aparece en Fecha Grabado / Verificado Fecha. */
  function clasificar(archivos, cfg) {
    const todas = archivos.flatMap((a) => a.lineas);
    let corteDia = '';
    let corteMin = 0;
    for (const l of todas) for (const f of [l.grabado, l.verif]) {
      if (!f) continue;
      if (f.d > corteDia) { corteDia = f.d; corteMin = f.m; } else if (f.d === corteDia && f.m > corteMin) corteMin = f.m;
    }
    if (!corteDia) corteDia = archivos.map((a) => a.fecha).sort()[0];
    let pmFecha = null;
    for (const l of todas) {
      if (l.fecha > corteDia) { l.clase = 'PM'; if (!pmFecha || l.fecha < pmFecha) pmFecha = l.fecha; }
      else if (l.fecha === corteDia) l.clase = (l.verif && l.verif.d < corteDia) ? 'AYER' : 'AM';
      else l.clase = 'ANTERIOR';
      l.sinVerif = !l.verif;
      l.cad = cadenaDe(l.clienteNombre, cfg.cadenas);
    }
    // Si hay varias fechas futuras, sólo la más cercana es la PM de hoy.
    todas.forEach((l) => { if (l.clase === 'PM' && l.fecha !== pmFecha) l.clase = 'ANTERIOR'; });
    return { lineas: todas, corteDia, corteMin, amFecha: corteDia, pmFecha, hayAM: todas.some((l) => l.clase === 'AM'), hayPM: !!pmFecha };
  }

  const nombreRutaDatos = (lineas) => {
    const m = {};
    lineas.forEach((l) => { if (l.rutaNombre) m[l.ruta] = l.rutaNombre; });
    return m;
  };

  /** Tabla del resumen para la imagen. */
  function resumen(est, cfg, turno, soloSuper) {
    const ls = est.lineas.filter((l) => l.clase === turno && (!soloSuper || (l.cad && l.cad.esSuper)));
    const nombres = nombreRutaDatos(est.lineas);
    const sum = {};
    ls.forEach((l) => { const k = l.ruta + '|' + l.codigo; sum[k] = (sum[k] || 0) + l.cantidad; });
    const excluye = turno === 'AM' ? 'PM' : 'AM';
    const clavesOn = cfg.claves.filter((c) => c.enImagen);
    let filas = cfg.rutas.filter((r) => r.enImagen && r.turno !== excluye).map((r) => {
      const vals = clavesOn.map((c) => sum[r.ruta + '|' + c.codigo] || 0);
      return { ruta: r.ruta, nombre: (r.nombreImagen || '').trim() || nombres[r.ruta] || r.nombreSistema || ('Ruta ' + r.ruta), vals };
    }).filter((f) => f.vals.some((v) => v));
    const colOn = clavesOn.map((c, j) => filas.some((f) => f.vals[j]));
    const cols = clavesOn.filter((_, j) => colOn[j]).map((c) => c.codigo);
    filas = filas.map((f) => ({ ...f, vals: f.vals.filter((_, j) => colOn[j]) }));
    const totales = cols.map((_, j) => filas.reduce((s, f) => s + f.vals[j], 0));
    const fecha = turno === 'AM' ? est.amFecha : est.pmFecha;
    return { turno, fecha, cols, filas, totales, titulo: tituloResumen(fecha), etiqueta: 'RUTAS ' + turno };
  }

  const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function partes(d) { const t = new Date(d + 'T12:00:00Z'); return { dow: t.getUTCDay(), dia: t.getUTCDate(), mes: t.getUTCMonth(), anio: t.getUTCFullYear() }; }
  function tituloResumen(d) {
    if (!d) return 'RUTAS SUPERMERCADOS';
    const p = partes(d);
    return 'RUTAS SUPERMERCADOS RUTAS ' + DIAS[p.dow] + ' ' + String(p.dia).padStart(2, '0') + ' ' + MESES[p.mes];
  }
  const fechaCorta = (d) => { if (!d) return ''; const p = partes(d); return DIAS_C[p.dow] + ' ' + p.dia + ' ' + MESES_L[p.mes].slice(0, 3); };
  const hora = (m) => m == null ? '' : String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  /** Lo que la app detectó, para el panel de la izquierda. */
  function deteccion(est, cfg) {
    const enCfg = new Set(cfg.rutas.map((r) => r.ruta));
    const enImg = (t) => new Set(cfg.rutas.filter((r) => r.enImagen && r.turno !== (t === 'AM' ? 'PM' : 'AM')).map((r) => r.ruta));
    const rutas = (c) => new Set(est.lineas.filter((l) => l.clase === c).map((l) => l.ruta));
    const am = rutas('AM'), pm = rutas('PM'), ayer = rutas('AYER');
    const iAM = enImg('AM'), iPM = enImg('PM');
    const amIn = [...am].filter((r) => iAM.has(r)), pmIn = [...pm].filter((r) => iPM.has(r));
    const fuera = new Set([...am].filter((r) => !iAM.has(r)).concat([...pm].filter((r) => !iPM.has(r))));
    const nombres = nombreRutaDatos(est.lineas);
    const nuevas = [...new Set([...am, ...pm, ...ayer])].filter((r) => !enCfg.has(r)).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      .map((r) => ({ ruta: r, nombre: nombres[r] || '' }));
    const ambos = amIn.filter((r) => pm.has(r));
    const sinVerif = est.lineas.filter((l) => l.clase === 'AM' && l.sinVerif);
    return {
      amRutas: amIn.length, pmRutas: pmIn.length, ayerRutas: ayer.size, fueraRutas: fuera.size,
      sinVerifLineas: sinVerif.length, sinVerifRutas: [...new Set(sinVerif.map((l) => l.ruta))],
      nuevas, ambos, nombres
    };
  }

  /* ---------- Matrices con totales ---------- */
  function ordenClaves(codigos, cfg) {
    const pos = {}; cfg.claves.forEach((c, i) => { pos[c.codigo] = i; });
    return [...codigos].sort((a, b) => (pos[a] ?? 1e6) - (pos[b] ?? 1e6) || a.localeCompare(b));
  }
  function filtrarLineas(est, f) {
    return est.lineas.filter((l) => (f.carga === 'AM' ? l.clase === 'AM' : f.carga === 'PM' ? l.clase === 'PM' : (l.clase === 'AM' || l.clase === 'PM'))
      && (f.tipo === 'Todo' || !f.tipo || l.tipo === f.tipo));
  }
  /** Cadena × Clave o Tienda × Clave, con totales por fila y por columna. */
  function matrizCadenas(est, cfg, f) {
    let ls = filtrarLineas(est, f);
    const OTROS = 'Otros clientes';
    if (!f.otros) ls = ls.filter((l) => l.cad);
    if (f.vista === 'tienda' && f.cadena && f.cadena !== '*') ls = ls.filter((l) => (l.cad ? l.cad.nombre : OTROS) === f.cadena);
    const filaDe = (l) => f.vista === 'tienda' ? l.clienteNombre : (l.cad ? l.cad.nombre : OTROS);
    const m = {}, cods = new Set(), tiendas = {};
    ls.forEach((l) => {
      const r = filaDe(l); cods.add(l.codigo);
      (m[r] = m[r] || {})[l.codigo] = (m[r][l.codigo] || 0) + l.cantidad;
      (tiendas[r] = tiendas[r] || new Set()).add(l.cliente || l.clienteNombre);
      if (f.vista === 'tienda') tiendas[r].cad = l.cad ? l.cad.nombre : OTROS;
    });
    const cols = ordenClaves(cods, cfg).filter((c) => Object.values(m).some((r) => r[c]));
    let filas = Object.keys(m).map((r) => {
      const vals = cols.map((c) => m[r][c] || 0);
      return { nombre: r, vals, total: vals.reduce((a, b) => a + b, 0), tiendas: tiendas[r].size, cadena: tiendas[r].cad };
    });
    if (f.vista === 'tienda') filas.sort((a, b) => b.total - a.total);
    else {
      const pos = {}; cfg.cadenas.forEach((c, i) => { pos[c.nombre] = i; });
      filas.sort((a, b) => (pos[a.nombre] ?? 1e6) - (pos[b.nombre] ?? 1e6));
    }
    filas = filas.filter((x) => x.total);
    const totales = cols.map((_, j) => filas.reduce((s, x) => s + x.vals[j], 0));
    return { cols, filas, totales, total: totales.reduce((a, b) => a + b, 0) };
  }

  /** Cambios por clave, ruta y cliente. */
  function cambios(est, cfg, carga) {
    const base = filtrarLineas(est, { carga, tipo: 'Todo' });
    const ch = base.filter((l) => l.tipo === 'Cambios');
    const nor = base.filter((l) => l.tipo === 'Normal');
    const agrupa = (ls, key) => { const m = {}; ls.forEach((l) => { const k = key(l); m[k] = (m[k] || 0) + l.cantidad; }); return m; };
    const chC = agrupa(ch, (l) => l.codigo), noC = agrupa(nor, (l) => l.codigo);
    const chR = agrupa(ch, (l) => l.ruta), noR = agrupa(nor, (l) => l.ruta);
    const nombres = nombreRutaDatos(est.lineas);
    const pct = (a, b) => b ? a / b * 100 : null;
    const porClave = ordenClaves(Object.keys(chC), cfg).map((c) => ({ codigo: c, u: chC[c], normal: noC[c] || 0, pct: pct(chC[c], noC[c]) }))
      .sort((a, b) => b.u - a.u);
    const cliR = {}; ch.forEach((l) => { (cliR[l.ruta] = cliR[l.ruta] || new Set()).add(l.cliente || l.clienteNombre); });
    const porRuta = Object.keys(chR).map((r) => ({ ruta: r, nombre: nombres[r] || '', u: chR[r], clientes: cliR[r].size, normal: noR[r] || 0, pct: pct(chR[r], noR[r]) }))
      .sort((a, b) => b.u - a.u);
    const chK = {}; ch.forEach((l) => { const k = l.clienteNombre + '|' + l.ruta; const o = chK[k] = chK[k] || { cliente: l.clienteNombre, ruta: l.ruta, rutaNombre: nombres[l.ruta] || '', cadena: l.cad ? l.cad.nombre : 'Otros clientes', u: 0 }; o.u += l.cantidad; });
    const porCliente = Object.values(chK).sort((a, b) => b.u - a.u);
    const totalCh = ch.reduce((s, l) => s + l.cantidad, 0), totalNo = nor.reduce((s, l) => s + l.cantidad, 0);
    return { porClave, porRuta, porCliente, total: totalCh, normal: totalNo, pct: pct(totalCh, totalNo), rutas: porRuta.length, clientes: new Set(ch.map((l) => l.cliente || l.clienteNombre)).size };
  }

  /** Trabajo de cada verificadora en una jornada (día de verificación). */
  function verificacion(est, cfg, dia, clase) {
    const ls = est.lineas.filter((l) => l.verif && l.verif.d === dia && (!clase || l.clase === clase));
    const nombres = {}; cfg.verificadoras.forEach((v) => { nombres[v.codigo] = v.nombre; });
    const m = {};
    ls.forEach((l) => {
      const k = l.verifUsuario || '?';
      const o = m[k] = m[k] || { codigo: k, nombre: nombres[k] || ('Usuario ' + k), vales: new Map(), lineas: 0, u: 0, rutas: new Set(), ini: 1e9, fin: -1 };
      o.lineas++; o.u += l.cantidad; o.rutas.add(l.ruta);
      o.vales.set(l.vale || (l.ruta + '@' + l.verif.m), l.verif.m);
      o.ini = Math.min(o.ini, l.verif.m); o.fin = Math.max(o.fin, l.verif.m);
    });
    const filas = Object.values(m).map((o) => {
      const horas = (o.fin - o.ini) / 60;
      return { codigo: o.codigo, nombre: o.nombre, vales: o.vales.size, lineas: o.lineas, u: o.u, rutas: o.rutas.size,
        ini: o.ini, fin: o.fin, lph: horas >= 1 / 6 ? Math.round(o.lineas / horas) : null, marcas: [...new Set(o.vales.values())].sort((a, b) => a - b) };
    }).sort((a, b) => b.lineas - a.lineas);
    const tot = { vales: filas.reduce((s, f) => s + f.vales, 0), lineas: filas.reduce((s, f) => s + f.lineas, 0), u: filas.reduce((s, f) => s + f.u, 0) };
    return { dia, filas, tot, ini: Math.min(...filas.map((f) => f.ini)), fin: Math.max(...filas.map((f) => f.fin)) };
  }

  /* ---------- Cierre del día ----------
     El cierre es el registro oficial del día de operación D: lo que se cargó en la
     mañana (AM, crudo con fecha D) y en la tarde (PM, crudo con fecha D+1).
     Lo verificado ayer (AYER) pertenece al cierre anterior y no se guarda. */
  const CAMPOS = ['clase', 'fecha', 'tipo', 'cliente', 'clienteNombre', 'tienda', 'ruta', 'vale', 'verifUsuario', 'verifD', 'verifM', 'codigo', 'cantidad', 'monto'];
  function fotoCierre(est, archivos) {
    const ls = est.lineas.filter((l) => l.clase === 'AM' || l.clase === 'PM');
    const nombres = nombreRutaDatos(est.lineas), rutas = {};
    ls.forEach((l) => { rutas[l.ruta] = nombres[l.ruta] || ''; });
    return {
      app: 'rutas_pana', tipo: 'cierre', version: 2, dia: est.corteDia, corteHora: hora(est.corteMin), pmFecha: est.pmFecha,
      guardado: new Date().toISOString(), archivos: archivos.map((a) => a.nombre), rutas, campos: CAMPOS,
      lineas: ls.map((l) => [l.clase, l.fecha, l.tipo, l.cliente, l.clienteNombre, l.tienda, l.ruta, l.vale, l.verifUsuario,
        l.verif ? l.verif.d : '', l.verif ? l.verif.m : null, l.codigo, l.cantidad, l.monto])
    };
  }
  /** Reconstruye los datos de un cierre guardado para que los módulos lo usen igual que unos crudos. */
  function estDesdeCierre(f, cfg) {
    const ix = {}; (f.campos || CAMPOS).forEach((k, i) => { ix[k] = i; });
    const lineas = f.lineas.map((r) => {
      const g = (k) => r[ix[k]];
      const vd = g('verifD');
      return { clase: g('clase'), fecha: g('fecha'), tipo: g('tipo'), cliente: g('cliente'), clienteNombre: g('clienteNombre'), tienda: g('tienda'),
        ruta: g('ruta'), rutaNombre: (f.rutas || {})[g('ruta')] || '', vale: g('vale'), verifUsuario: g('verifUsuario'),
        verif: vd ? { d: vd, m: g('verifM') } : null, sinVerif: !vd, codigo: g('codigo'), cantidad: g('cantidad'), monto: g('monto'),
        cad: cadenaDe(g('clienteNombre'), cfg.cadenas) };
    });
    const [h, m] = String(f.corteHora || '0:0').split(':').map(Number);
    return { lineas, corteDia: f.dia, corteMin: (h || 0) * 60 + (m || 0), amFecha: f.dia, pmFecha: f.pmFecha,
      hayAM: lineas.some((l) => l.clase === 'AM'), hayPM: lineas.some((l) => l.clase === 'PM'), fuente: 'cierre', guardado: f.guardado };
  }
  /** Resumen liviano de un cierre para el índice del historial (venta normal por clase, ruta y clave). */
  function indiceDia(f) {
    const ix = {}; (f.campos || CAMPOS).forEach((k, i) => { ix[k] = i; });
    const m = {}; let cambios = 0, am = 0, pm = 0;
    f.lineas.forEach((r) => {
      const u = r[ix.cantidad];
      if (r[ix.tipo] === 'Cambios') { cambios += u; return; }
      if (r[ix.clase] === 'AM') am += u; else pm += u;
      const k = r[ix.clase] + '|' + r[ix.ruta] + '|' + r[ix.codigo];
      m[k] = (m[k] || 0) + u;
    });
    return { dia: f.dia, corteHora: f.corteHora, guardado: f.guardado, rutas: f.rutas || {}, am, pm, cambios,
      agg: Object.entries(m).map(([k, u]) => k.split('|').concat(u)) };
  }

  /** Unidades por día de operación para la tendencia. f: { turno: 'Ambos'|'AM'|'PM', ruta, clave, rutas: Set|null } */
  function tendencia(dias, f) {
    return dias.slice().sort((a, b) => a.dia.localeCompare(b.dia)).map((d) => {
      let u = 0;
      d.agg.forEach(([cl, r, c, n]) => { if ((f.turno === 'Ambos' || cl === f.turno) && (f.ruta === '*' || r === f.ruta) && (f.clave === '*' || c === f.clave) && (!f.rutas || f.rutas.has(r))) u += n; });
      return { fecha: d.dia, u };
    });
  }

  /** Pronóstico por clave: promedio de los últimos N cierres del mismo día de la semana. */
  function pronostico(dias, cfg, f) {
    const sel = dias.filter((d) => partes(d.dia).dow === f.dow).sort((a, b) => a.dia.localeCompare(b.dia)).slice(-(f.n || 4));
    const fechas = sel.map((d) => d.dia);
    const porFecha = sel.map((d) => {
      const t = {};
      d.agg.forEach(([cl, r, c, n]) => { if ((f.turno === 'Ambos' || cl === f.turno) && (!f.rutas || f.rutas.has(r))) t[c] = (t[c] || 0) + n; });
      return t;
    });
    const cods = new Set(); porFecha.forEach((t) => Object.keys(t).forEach((c) => cods.add(c)));
    const ux = {}; cfg.claves.forEach((c) => { ux[c.codigo] = c; });
    const filas = ordenClaves(cods, cfg).map((c) => {
      const serie = porFecha.map((t) => t[c] || 0);
      const prom = serie.reduce((a, b) => a + b, 0) / (serie.length || 1);
      const ult = serie[serie.length - 1] || 0;
      const par = ux[c] && +ux[c].parrilla ? Math.ceil(prom / +ux[c].parrilla) : null;
      return { codigo: c, prom: Math.round(prom), ult, tend: prom ? (ult - prom) / prom * 100 : null, parrillas: par, serie };
    }).filter((x) => x.prom > 0).sort((a, b) => b.prom - a.prom);
    return { fechas, filas };
  }

  root.Core = { norm, up, fechaDe, leerFilas, leerLibro, clasificar, cadenaDe, resumen, deteccion, matrizCadenas, cambios, verificacion,
    fotoCierre, estDesdeCierre, indiceDia, tendencia, pronostico, sumarDias, tituloResumen, fechaCorta, hora, partes, MESES_L, DIAS_C };
})(typeof window !== 'undefined' ? window : globalThis);
