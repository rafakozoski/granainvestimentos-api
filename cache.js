// cache.js — gerenciamento de cache em memória
// Evita bater nas APIs externas a cada requisição

const NodeCache = require('node-cache');

// TTLs em segundos
const TTL = {
  QUOTE: 5 * 60,        // cotação: 5 minutos
  FUNDAMENTALS: 60 * 60, // indicadores: 1 hora
  NEWS: 15 * 60,         // notícias: 15 minutos
  TICKERS_LIST: 24 * 60 * 60, // lista de tickers: 24 horas
};

const cache = new NodeCache({ checkperiod: 120 });

function get(key) {
  return cache.get(key);
}

function set(key, value, ttl) {
  cache.set(key, value, ttl);
}

function del(key) {
  cache.del(key);
}

function stats() {
  return cache.getStats();
}

module.exports = { get, set, del, stats, TTL };
