// data/tickers.js — lista estática de tickers com metadados
// Atualizada manualmente conforme necessário

const TICKERS = [
  // BANCOS
  { code: 'BBAS3', name: 'Banco do Brasil S.A.', sector: 'Bancos', subsector: 'Bancos Diversificados', segment: 'Novo Mercado' },
  { code: 'ITUB4', name: 'Itaú Unibanco Holding S.A.', sector: 'Bancos', subsector: 'Bancos Diversificados', segment: 'Nível 1' },
  { code: 'SANB11', name: 'Santander Brasil S.A.', sector: 'Bancos', subsector: 'Bancos Diversificados', segment: 'Nível 2' },
  { code: 'BBDC4', name: 'Bradesco S.A.', sector: 'Bancos', subsector: 'Bancos Diversificados', segment: 'Nível 1' },
  { code: 'BRSR6', name: 'Banrisul S.A.', sector: 'Bancos', subsector: 'Bancos Regionais', segment: 'Nível 1' },

  // ENERGIA
  { code: 'PETR4', name: 'Petrobras S.A. PN', sector: 'Energia', subsector: 'Petróleo e Gás', segment: 'Nível 2' },
  { code: 'PETR3', name: 'Petrobras S.A. ON', sector: 'Energia', subsector: 'Petróleo e Gás', segment: 'Nível 2' },
  { code: 'PRIO3', name: 'PRIO S.A.', sector: 'Energia', subsector: 'Petróleo e Gás', segment: 'Novo Mercado' },
  { code: 'CSAN3', name: 'Cosan S.A.', sector: 'Energia', subsector: 'Petróleo e Gás', segment: 'Novo Mercado' },
  { code: 'EGIE3', name: 'Engie Brasil Energia', sector: 'Energia', subsector: 'Energia Elétrica', segment: 'Novo Mercado' },
  { code: 'TAEE11', name: 'Taesa', sector: 'Energia', subsector: 'Energia Elétrica', segment: 'Nível 2' },
  { code: 'ENGI11', name: 'Energisa', sector: 'Energia', subsector: 'Energia Elétrica', segment: 'Nível 2' },

  // MINERAÇÃO / COMMODITIES
  { code: 'VALE3', name: 'Vale S.A.', sector: 'Mineração', subsector: 'Minerais Metálicos', segment: 'Novo Mercado' },
  { code: 'CSNA3', name: 'CSN S.A.', sector: 'Siderurgia', subsector: 'Siderurgia', segment: 'Novo Mercado' },
  { code: 'GGBR4', name: 'Gerdau S.A.', sector: 'Siderurgia', subsector: 'Siderurgia', segment: 'Nível 1' },
  { code: 'USIM5', name: 'Usiminas', sector: 'Siderurgia', subsector: 'Siderurgia', segment: 'Nível 1' },

  // TECNOLOGIA
  { code: 'WEGE3', name: 'WEG S.A.', sector: 'Tecnologia', subsector: 'Máquinas e Equipamentos', segment: 'Novo Mercado' },
  { code: 'TOTS3', name: 'Totvs S.A.', sector: 'Tecnologia', subsector: 'Software', segment: 'Novo Mercado' },
  { code: 'INTB3', name: 'Intelbras S.A.', sector: 'Tecnologia', subsector: 'Eletrônicos', segment: 'Novo Mercado' },

  // VAREJO
  { code: 'MGLU3', name: 'Magazine Luiza S.A.', sector: 'Varejo', subsector: 'Varejo', segment: 'Novo Mercado' },
  { code: 'LREN3', name: 'Lojas Renner S.A.', sector: 'Varejo', subsector: 'Varejo de Roupas', segment: 'Novo Mercado' },
  { code: 'VIVA3', name: 'Vivara S.A.', sector: 'Varejo', subsector: 'Varejo de Joias', segment: 'Novo Mercado' },
  { code: 'ARZZ3', name: 'Arezzo S.A.', sector: 'Varejo', subsector: 'Varejo de Calçados', segment: 'Novo Mercado' },

  // CONSUMO
  { code: 'ABEV3', name: 'Ambev S.A.', sector: 'Consumo', subsector: 'Bebidas', segment: 'Nível 1' },
  { code: 'JBSS3', name: 'JBS S.A.', sector: 'Consumo', subsector: 'Alimentos', segment: 'Novo Mercado' },
  { code: 'MRFG3', name: 'Marfrig S.A.', sector: 'Consumo', subsector: 'Alimentos', segment: 'Novo Mercado' },
  { code: 'BEEF3', name: 'Minerva S.A.', sector: 'Consumo', subsector: 'Alimentos', segment: 'Novo Mercado' },

  // SAÚDE
  { code: 'RDOR3', name: "Rede D'Or São Luiz", sector: 'Saúde', subsector: 'Hospitais', segment: 'Novo Mercado' },
  { code: 'HAPV3', name: 'Hapvida S.A.', sector: 'Saúde', subsector: 'Planos de Saúde', segment: 'Novo Mercado' },
  { code: 'FLRY3', name: 'Fleury S.A.', sector: 'Saúde', subsector: 'Diagnósticos', segment: 'Novo Mercado' },

  // CONSTRUÇÃO / IMÓVEIS
  { code: 'EZTC3', name: 'EZTEC Empreend.', sector: 'Construção', subsector: 'Incorporação', segment: 'Novo Mercado' },
  { code: 'CYRE3', name: 'Cyrela S.A.', sector: 'Construção', subsector: 'Incorporação', segment: 'Novo Mercado' },
  { code: 'MRVE3', name: 'MRV Engenharia', sector: 'Construção', subsector: 'Incorporação', segment: 'Novo Mercado' },

  // LOCAÇÃO / SERVIÇOS
  { code: 'RENT3', name: 'Localiza Rent a Car', sector: 'Serviços', subsector: 'Locação', segment: 'Novo Mercado' },
  { code: 'MOVI3', name: 'Movida Participações', sector: 'Serviços', subsector: 'Locação', segment: 'Novo Mercado' },
  { code: 'PSSA3', name: 'Porto Seguro S.A.', sector: 'Seguros', subsector: 'Seguros', segment: 'Novo Mercado' },
];

// Tickers da homepage (mais acessados)
const FEATURED_TICKERS = [
  'BBAS3', 'PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'MGLU3', 'RENT3', 'RDOR3'
];

// Índices para a barra superior
const INDICES = [
  { code: '^BVSP', label: 'Ibovespa' },
  { code: 'BRL=X', label: 'USD/BRL' },
];

function findTicker(code) {
  return TICKERS.find(t => t.code === code.toUpperCase()) || null;
}

function searchTickers(query) {
  const q = query.toUpperCase();
  return TICKERS.filter(t =>
    t.code.startsWith(q) || t.name.toUpperCase().includes(q)
  ).slice(0, 10);
}

function getTickersBySector(sector) {
  return TICKERS.filter(t => t.sector === sector);
}

module.exports = { TICKERS, FEATURED_TICKERS, INDICES, findTicker, searchTickers, getTickersBySector };
