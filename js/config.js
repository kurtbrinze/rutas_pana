/* Parámetros de la app: rutas, claves, cadenas, verificadoras y carpetas.
   Se guardan en este navegador; se pueden respaldar en la carpeta Backup. */
(function (root) {
  'use strict';
  const LLAVE = 'rutas_pana_cfg_v1';

  const ruta = (r, n, turno = 'auto', on = true) => ({ ruta: String(r), nombreSistema: n, nombreImagen: '', turno, enImagen: on });
  const clave = (c, d, par = '', bol = '', on = true) => ({ codigo: c, descripcion: d, parrilla: par, bolsa: bol, enImagen: on });

  function inicial() {
    return {
      version: 1,
      rutas: [
        ruta(411, 'DIEGO VELASQUEZ'), ruta(401, 'ESTUARDO ALVAREZ'), ruta(402, 'EULALIO CAMEY'), ruta(408, 'MARCO VASQUEZ'),
        ruta(404, 'MYNOR MARTINEZ'), ruta(400, 'LUIS ALVARADO'), ruta(405, 'LEONEL HERRERA'), ruta(403, 'ARMANDO GARCIA'),
        ruta(414, 'VILIO MIRANDA'), ruta(409, 'CARLOS CHITAY'), ruta(309, 'ANTONIO MORALES'), ruta(303, 'MANUEL AGUILAR'),
        ruta(416, ''), ruta(406, 'JUAN CARLOS MONTENEGRO'), ruta(103, 'Christians Coter'), ruta(412, 'JUAN QUIROA'),
        ruta(410, 'LUIS PEDROZA supermercados'), ruta(417, 'JUAN GUZMAN'), ruta(415, 'DENNIS RIVAS'), ruta(601, ''),
        ruta(308, 'Carlos Pineda'), ruta(602, ''), ruta(413, 'Carlos Pineda'),
        ruta(407, 'Centro De Transito Fragua', 'auto', false), ruta(307, 'LUIS PEDROZA', 'auto', false),
        ruta(301, 'CRISTOBAL RAYMUNDO', 'auto', false), ruta(304, 'OSCAR PEREZ', 'auto', false), ruta(306, 'WILLIAMS OLIVA', 'auto', false),
        ruta(200, 'Héctor Ayala', 'auto', false), ruta(203, 'Juan Mus', 'auto', false), ruta(204, 'Ernesto Cruz', 'auto', false),
        ruta(310, 'Ruta Zinohe Kastillo', 'auto', false), ruta(502, 'Sucursal Calvario', 'auto', false), ruta(704, 'ERWIN CHUN', 'auto', false),
        ruta(730, 'MANUEL GALICIA', 'auto', false), ruta(900, 'ESPECIALES CAJA I', 'auto', false), ruta(902, 'ESPECIALES III', 'auto', false)
      ],
      claves: [
        clave('5HG7', 'Gigante', 15, 5), clave('6MU1', 'Muffin', 14, ''), clave('6PC4', 'Hamburguesa con ajonjolí (bolsa 6)', 14, 6),
        clave('5CHD', 'Choco Doggy', 20, 5), clave('1CHD', 'Choco Doggy unidad', '', ''), clave('S26', 'Sandwich Gig 630 g', 10, 1),
        clave('5HM4', 'Grande', 15, 5), clave('8PL1', 'Pirujo de leche', '', ''), clave('S19', 'Sandwich Gde 450 g', 12, 1),
        clave('5HC1', 'Normal', 20, 5), clave('5HD2', 'Hot Dog Normal', 18, 5), clave('10HD7', 'Hot Dog Shukos', 7, 10),
        clave('10HR3', 'Hot Dog Rodajado', 10, 10), clave('S13', 'Sandwich Peq 300 g', 18, 1), clave('S25', 'Sandwich Integral', 12, 1),
        clave('S25M', 'Sandwich Integral M', '', ''), clave('MGND', 'Magdalena Navideña domo', 8, 1), clave('MG4D', 'Magdalena grande con domo', '', ''),
        clave('SR16', 'Sandwich 425 g', 12, ''), clave('S16', 'Sandwich 425 g', 12, ''), clave('12WY1', 'Gigante Wimpy', 5, 12),
        clave('S11T', 'S11T', 21, 1), clave('12DCN', 'Domo Cubilete Naranja', '', ''), clave('12MU1', 'Muffin inglés bolsa 12', '', '')
      ],
      cadenas: [
        { nombre: 'Maxi Despensa', claves: 'MAXI DESPENSA', esSuper: true },
        { nombre: 'Despensa Familiar', claves: 'DESPENSA', esSuper: true },
        { nombre: 'La Bodegona', claves: 'BODEGONA', esSuper: true },
        { nombre: 'La Torre', claves: 'TORRE', esSuper: true },
        { nombre: 'Walmart', claves: 'WALMART', esSuper: true },
        { nombre: 'Paiz', claves: 'PAIZ', esSuper: true },
        { nombre: 'Suma', claves: 'SUMA', esSuper: true },
        { nombre: 'Super Fresh', claves: 'SUPER FRESH', esSuper: true }
      ],
      verificadoras: [
        { codigo: '0022', nombre: 'Verificadora 0022', activa: true },
        { codigo: '0025', nombre: 'Verificadora 0025', activa: true },
        { codigo: '0038', nombre: 'Verificadora 0038', activa: true },
        { codigo: '0044', nombre: 'Verificadora 0044', activa: true }
      ],
      carpetas: {
        hx: 'G:\\OneDrive\\Documents\\Panaderia\\Database\\Resumen Rutas\\Hx',
        backup: 'G:\\OneDrive\\Documents\\Panaderia\\Database\\Resumen Rutas\\Backup',
        copiarCrudos: true
      }
    };
  }

  function completar(c) {
    const b = inicial();
    const out = Object.assign({}, b, c || {});
    for (const k of ['rutas', 'claves', 'cadenas', 'verificadoras']) if (!Array.isArray(out[k])) out[k] = b[k];
    out.carpetas = Object.assign({}, b.carpetas, (c && c.carpetas) || {});
    return out;
  }

  function cargar() {
    try { const s = localStorage.getItem(LLAVE); if (s) return completar(JSON.parse(s)); } catch (_) {}
    return inicial();
  }
  function guardar(cfg) { try { localStorage.setItem(LLAVE, JSON.stringify(cfg)); return true; } catch (_) { return false; } }

  root.Config = { inicial, cargar, guardar, completar };
})(typeof window !== 'undefined' ? window : globalThis);
