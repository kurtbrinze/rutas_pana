# Resumen Rutas Supermercados · Rinze Studio

App web (HTML estático, sin compilación) que lee el crudo de Excel del sistema de la panadería y:

- **Resumen**: arma la imagen de rutas AM y PM con el mismo formato de Excel y la manda con “Enviar por WhatsApp” (menú Compartir del sistema, igual que Cálculo de Producción; si el equipo no lo tiene, la copia o la descarga).
  - AM = líneas del crudo de hoy verificadas hoy (o sin verificar).
  - PM = crudo con fecha de mañana.
  - Lo verificado ayer (carga PM de ayer) no se vuelve a reportar.
  - Filtro: todos los clientes de la ruta o solo supermercados.
- **Cadenas**: Cadena × Clave y Tienda × Clave, con totales por fila y columna.
- **Filtros** (Cadenas y Cambios, compartidos): rutas, cadenas, tiendas e ítems, en cascada; se exportan en una hoja “Filtros”.
- **Cambios**: por clave, ruta y cliente, con % sobre la venta normal.
- **Verificación**: vales, líneas, unidades y ventana de trabajo por verificadora.
- **Corte para WhatsApp vs. cierre del día**: el corte de la mañana (10:00–10:30) solo sirve para la imagen; no se guarda. Al terminar la operación se cargan los crudos otra vez y se guarda el **cierre del día** (`Hx\Cierres\AAAA-MM-DD.json`), que es el registro oficial: AM del día + cargas de la tarde (crudo de mañana).
- **Navegar entre días**: Cadenas, Cambios y Verificación tienen la barra “Datos” para elegir entre los crudos cargados o cualquier cierre guardado (flechas día anterior / siguiente).
- **Historial**: lista de cierres, tendencia diaria y pronóstico por clave, leídos de `Hx\Cierres\_indice.json`.
- **Carga histórica** (Historial): un crudo de varios días se reparte en un cierre por día de operación (lo verificado antes de su fecha es la carga PM del día en que se verificó; el sábado carga para el lunes). Vista previa por día; los días incompletos quedan sin marcar.
- **Sesión**: los últimos crudos cargados se recuperan al volver a abrir la app (hasta “Empezar de nuevo”).
- **Configuración**: rutas, claves, cadenas, verificadoras y carpetas (Hx y Backup).

## Carpetas

- `Hx`: `Cierres\AAAA-MM-DD.json` + `Cierres\_indice.json`, `Cadenas\`, `Cambios\`, `Verificacion\`, `Pronostico\`.
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

## Instalación y Centro de Control

- Se instala como app con el botón “Instalar app” (Chrome / Edge). Nombre corto **Rutas Súper**, icono propio (camión con barras) e `id` propio en el manifiesto, para no confundirse con las otras apps de Rinze.
- En el Centro de Control se sirve desde `/apps/rutas/` (mismo sitio del centro), para que pueda elegir las carpetas Hx y Backup estando embebida. Las carpetas y la configuración se guardan por sitio: dentro del centro hay que elegirlas una vez.
