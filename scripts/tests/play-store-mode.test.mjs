import test from "node:test";
import assert from "node:assert/strict";
import { isPlayStoreMode, getAppRedirectUrl } from "../../src/utils/isPlayStoreMode.js";

function mockBrowser(url, referrer = "") {
  const memory = new Map();
  globalThis.window = {
    location: new URL(url),
    sessionStorage: {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
    },
  };
  globalThis.document = { referrer };
  return { memory, navigate(path) { globalThis.window.location = new URL(path, "https://rumo.nethanel.com.br"); } };
}

test("navegador comum continua com checkout da web", () => {
  mockBrowser("https://rumo.nethanel.com.br/premium");
  assert.equal(isPlayStoreMode(), false);
  assert.equal(getAppRedirectUrl("/dashboard"), "https://rumo.nethanel.com.br/dashboard");
});

test("TWA mantém modo Play entre rotas e no callback Google", () => {
  const app = mockBrowser("https://rumo.nethanel.com.br/?rumo_source=play");
  assert.equal(isPlayStoreMode(), true);
  app.navigate("/premium");
  assert.equal(isPlayStoreMode(), true);
  assert.equal(getAppRedirectUrl("/dashboard"), "https://rumo.nethanel.com.br/dashboard?rumo_source=play");
});

test("TWA reconhece origem do aplicativo Android", () => {
  mockBrowser("https://rumo.nethanel.com.br/dashboard", "android-app://br.com.nethanel.rumo/");
  assert.equal(isPlayStoreMode(), true);
});

test("sessão Android não afeta nova aba web", () => {
  mockBrowser("https://rumo.nethanel.com.br/premium");
  assert.equal(isPlayStoreMode(), false);
});
