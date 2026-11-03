const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nucleo = html.match(/<script id="nucleo">([\s\S]*?)<\/script>/)[1];
const contexto = vm.createContext({});
vm.runInContext(nucleo, contexto);
const { siguienteFase, formatearTiempo, resumirHoy, historialACSV } = contexto;

test("alterna concentración y descanso corto", () => {
  assert.strictEqual(siguienteFase("trabajo", 1), "descanso");
  assert.strictEqual(siguienteFase("descanso", 1), "trabajo");
  assert.strictEqual(siguienteFase("largo", 4), "trabajo");
});

test("da un descanso largo cada cuatro sesiones", () => {
  assert.strictEqual(siguienteFase("trabajo", 4), "largo");
  assert.strictEqual(siguienteFase("trabajo", 8), "largo");
  assert.strictEqual(siguienteFase("trabajo", 5), "descanso");
});

test("saltar antes de completar sesiones no da descanso largo", () => {
  assert.strictEqual(siguienteFase("trabajo", 0), "descanso");
});

test("formatea el tiempo y nunca muestra valores negativos", () => {
  assert.strictEqual(formatearTiempo(1500), "25:00");
  assert.strictEqual(formatearTiempo(59.2), "01:00");
  assert.strictEqual(formatearTiempo(5), "00:05");
  assert.strictEqual(formatearTiempo(-3), "00:00");
});

test("exporta el historial a CSV", () => {
  const fin = Date.UTC(2026, 10, 3, 18, 30);
  assert.strictEqual(historialACSV([]), "fin,minutos\r\n");
  assert.strictEqual(
    historialACSV([{ fin: fin, minutos: 25 }]),
    "fin,minutos\r\n2026-11-03T18:30:00.000Z,25\r\n"
  );
});

test("el resumen cuenta solo las sesiones de hoy", () => {
  const ahora = new Date(2026, 10, 3, 18).getTime();
  const ayer = new Date(2026, 10, 2, 18).getTime();
  const resultado = resumirHoy(
    [{ fin: ahora - 1000, minutos: 25 }, { fin: ahora - 2000, minutos: 25 }, { fin: ayer, minutos: 25 }],
    ahora
  );
  assert.strictEqual(resultado.sesiones, 2);
  assert.strictEqual(resultado.minutos, 50);
});
