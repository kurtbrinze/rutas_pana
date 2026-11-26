# Resumen Rutas Supermercados · Rinze Studio

App web (HTML estático, sin compilación) que lee el crudo de Excel del sistema de la panadería y:

- **Resumen**: arma la imagen de rutas AM y PM con el mismo formato de Excel para WhatsApp (copiar al portapapeles o descargar).
  - AM = líneas del crudo de hoy verificadas hoy (o sin verificar).
  - PM = crudo con fecha de mañana.
  - Lo verificado ayer (carga PM de ayer) no se vuelve a reportar.
  - Filtro: todos los clientes de la ruta o solo supermercados.
- **Cadenas**: Cadena × Clave y Tienda × Clave, con totales por fila y columna.
- **Cambios**: por clave, ruta y cliente, con % sobre la venta normal.
- **Verificación**: vales, líneas, unidades y ventana de trabajo por verificadora.
- **Historial**: cortes guardados en OneDrive (`Hx\Historial`), tendencia diaria y pronóstico por clave.
- **Configuración**: rutas, claves, cadenas, verificadoras y carpetas (Hx y Backup).

## Carpetas

- `Hx`: `Historial\AAAA-MM-DD_AM.json`, `Cadenas\`, `Cambios\`, `Verificacion\`, `Pronostico\`.
- `Backup`: `Config\config_*.json` y `Crudos\AAAA-MM-DD\`.

Usa la API de acceso a archivos (Chrome / Edge en PC). Dentro de un marco (Centro de Control embebido) el navegador no deja elegir carpetas: abrir en pestaña propia.

## Estructura

```
index.html
css/app.css
js/config.js     parámetros por defecto y guardado local
js/core.js       lectura del crudo, clasificación AM/PM y cálculos
js/imagen.js     dibujo de la imagen del resumen
js/carpetas.js   carpetas de OneDrive (File System Access + IndexedDB)
js/ui.js         pantallas
js/vendor/xlsx.full.min.js  SheetJS 0.18.5
```

Al publicar una versión nueva, subir `VERSION` en `js/ui.js`.
