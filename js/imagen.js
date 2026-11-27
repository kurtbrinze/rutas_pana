/* Dibuja la imagen del resumen igual al formato de Excel que se manda por WhatsApp. */
(function (root) {
  'use strict';
  const AZUL = '#4472C4', BANDA = '#D9E1F2', LINEA = '#8EA9DB';
  const FUENTE = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';

  function dibujar(res, escala = 2) {
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    const F = (peso, tam) => peso + ' ' + tam + 'px ' + FUENTE;
    const TAM = 15, ALTO = 24, PADX = 7;
    x.font = F('bold', TAM);
    const anchoTxt = (t, bold) => { x.font = F(bold ? 'bold' : 'normal', TAM); return x.measureText(String(t)).width; };
    const fmt = (v) => v ? String(v) : '';
    // Anchos: primera columna = nombre más largo; las demás = el mayor entre encabezado y valores.
    let w0 = Math.max(anchoTxt(res.etiqueta, true), anchoTxt('Total', true), ...res.filas.map((f) => anchoTxt(f.nombre))) + PADX * 2 + 24;
    const ws = res.cols.map((col, j) => Math.max(46, anchoTxt(col, true) + PADX * 2 + 6,
      ...res.filas.map((f) => anchoTxt(fmt(f.vals[j])) + PADX * 2), anchoTxt(res.totales[j], true) + PADX * 2));
    const anchoTabla = w0 + ws.reduce((a, b) => a + b, 0);
    const TIT = 34, M = 6;
    const W = Math.ceil(anchoTabla + M * 2), H = Math.ceil(TIT + ALTO * (res.filas.length + 2) + M + 4);
    c.width = W * escala; c.height = H * escala;
    x.scale(escala, escala);
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
    x.textBaseline = 'middle';
    // Título
    x.fillStyle = '#000'; x.font = F('bold', 21); x.textAlign = 'center';
    x.fillText(res.titulo, W / 2, TIT / 2 + 2);
    let y = TIT;
    const colX = (j) => M + w0 + ws.slice(0, j).reduce((a, b) => a + b, 0);
    // Encabezado
    x.fillStyle = AZUL; x.fillRect(M, y, anchoTabla, ALTO);
    x.fillStyle = '#FFFFFF'; x.font = F('bold', TAM); x.textAlign = 'left';
    x.fillText(res.etiqueta, M + PADX, y + ALTO / 2 + 1);
    res.cols.forEach((col, j) => x.fillText(col, colX(j) + PADX, y + ALTO / 2 + 1));
    y += ALTO;
    // Filas
    res.filas.forEach((f, i) => {
      x.fillStyle = i % 2 === 0 ? BANDA : '#FFFFFF'; x.fillRect(M, y, anchoTabla, ALTO);
      x.fillStyle = '#000'; x.font = F('normal', TAM); x.textAlign = 'center';
      x.fillText(f.nombre, M + w0 / 2, y + ALTO / 2 + 1);
      f.vals.forEach((v, j) => { if (v) x.fillText(fmt(v), colX(j) + ws[j] / 2, y + ALTO / 2 + 1); });
      x.strokeStyle = LINEA; x.lineWidth = 1;
      x.beginPath(); x.moveTo(M, y + ALTO - 0.5); x.lineTo(M + anchoTabla, y + ALTO - 0.5); x.stroke();
      y += ALTO;
    });
    // Total
    x.strokeStyle = AZUL; x.lineWidth = 1;
    x.beginPath(); x.moveTo(M, y + 0.5); x.lineTo(M + anchoTabla, y + 0.5); x.moveTo(M, y + 2.5); x.lineTo(M + anchoTabla, y + 2.5); x.stroke();
    x.fillStyle = '#000'; x.font = F('bold', TAM); x.textAlign = 'left';
    x.fillText('Total', M + PADX, y + ALTO / 2 + 2);
    x.textAlign = 'center';
    res.totales.forEach((v, j) => x.fillText(String(v), colX(j) + ws[j] / 2, y + ALTO / 2 + 2));
    // Bordes verticales finos como en la tabla de Excel
    x.strokeStyle = 'rgba(142,169,219,.55)'; x.lineWidth = 1;
    for (let j = 0; j <= res.cols.length; j++) {
      const xx = Math.round(j === 0 ? M + w0 : colX(j)) + 0.5;
      x.beginPath(); x.moveTo(xx, TIT + ALTO); x.lineTo(xx, y); x.stroke();
    }
    x.strokeStyle = LINEA; x.strokeRect(M + 0.5, TIT + 0.5, anchoTabla - 1, y + ALTO - TIT - 1);
    return c;
  }

  const aBlob = (canvas, tipo = 'image/png', q = 0.95) => new Promise((ok, mal) => canvas.toBlob((b) => b ? ok(b) : mal(new Error('No se pudo crear la imagen.')), tipo, q));

  async function copiar(canvas) {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Este navegador no deja copiar imágenes. Usa “Descargar imagen”.');
    const blob = await aBlob(canvas, 'image/png');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }

  /** Igual que Cálculo de Producción: abre el menú Compartir del sistema (ahí se elige WhatsApp).
      Si el equipo no lo tiene, copia la imagen; si tampoco se puede, la descarga. */
  async function compartir(canvas, nombre, titulo) {
    const blob = await aBlob(canvas, 'image/jpeg', 0.95);
    const file = new File([blob], nombre, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: titulo || nombre }); return 'compartido'; }
      catch (err) { if (err && err.name === 'AbortError') return 'cancelado'; }
    }
    try { await copiar(canvas); return 'copiado'; } catch (_) {}
    await descargar(canvas, nombre);
    return 'descargado';
  }

  async function descargar(canvas, nombre) {
    const blob = await aBlob(canvas, 'image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  root.Imagen = { dibujar, copiar, compartir, descargar };
})(window);
