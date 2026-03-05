// server.js — servidor principal da API GranaInvestimentos
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// SEGURANÇA
// ─────────────────────────────────────────────
app.use(helmet());

// Rate limiting — evita abuso da API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,                  // máx 200 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api', limiter);

// ─────────────────────────────────────────────
// CORS — permite só o seu domínio em produção
// ─────────────────────────────────────────────
const allowedOrigins = [
  'https://granainvestimentos.com.br',
  'https://www.granainvestimentos.com.br',
  'https://mercado.granainvestimentos.com.br',
  'https://analitica.granainvestimentos.com.br',
  'https://radar.granainvestimentos.com.br',
  // desenvolvimento local
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: apps mobile, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Em desenvolvimento, permite tudo
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error(`Origin ${origin} não permitida pelo CORS`));
  },
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────────
// MIDDLEWARES
// ─────────────────────────────────────────────
app.use(compression()); // Gzip nas respostas
app.use(express.json());

// Cache headers HTTP para o CDN/browser
app.use('/api', (req, res, next) => {
  // Rotas de cotação: cache curto
  if (req.path.startsWith('/quote') || req.path.startsWith('/ticker')) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 min
  }
  // Notícias: cache médio
  else if (req.path.startsWith('/news')) {
    res.set('Cache-Control', 'public, max-age=900'); // 15 min
  }
  // Dados estáticos: cache longo
  else if (req.path.startsWith('/tickers') || req.path.startsWith('/sectors')) {
    res.set('Cache-Control', 'public, max-age=86400'); // 24h
  }
  next();
});

// ─────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────
app.use('/api', routes);

// Rota raiz — documentação básica
app.get('/', (req, res) => {
  res.json({
    name: 'GranaInvestimentos API',
    version: '1.0.0',
    endpoints: {
      'GET /api/health':             'Status do servidor',
      'GET /api/home':               'Dados da homepage (tickers + notícias)',
      'GET /api/quote/:ticker':      'Cotação e indicadores (ex: BBAS3 ou BBAS3,PETR4)',
      'GET /api/history/:ticker':    'Histórico de preços (?range=1mo&interval=1d)',
      'GET /api/dividends/:ticker':  'Histórico de dividendos',
      'GET /api/news/:ticker':       'Notícias de um ativo (?limit=10)',
      'GET /api/news':               'Notícias gerais de mercado (?limit=20)',
      'GET /api/ticker/:ticker':     'Dados completos de um ativo',
      'GET /api/search?q=BB':        'Busca de tickers para autocomplete',
      'GET /api/tickers':            'Lista de todos os ativos (?sector=Bancos)',
      'GET /api/sectors':            'Lista de setores',
    },
  });
});

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 GranaInvestimentos API rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   BRAPI Token: ${process.env.BRAPI_TOKEN ? '✓ configurado' : '✗ NÃO configurado'}`);
  console.log(`   Acesse: http://localhost:${PORT}\n`);
});

module.exports = app;
