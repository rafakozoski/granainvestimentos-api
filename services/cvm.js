// services/cvm.js — Relatórios RI via API pública CVM / ENET
// Usa a API de consulta do ENET diretamente (mais confiável que o DataStore)

const https = require('https');
const { get, set } = require('../cache');

function cleanCnpj(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}

function formatCnpj(digits) {
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 12000, ...(options || {}) }, (res) => {
      // Segue redirecionamentos simples
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return fetchJson(res.headers.location, options).then(resolve).catch(reject);
      }
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('JSON inválido (' + res.statusCode + '): ' + url.slice(0, 80))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout: ' + url.slice(0, 80))); });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca documentos via CKAN DataStore com CNPJ formatado corretamente
// A CVM indexa o campo CNPJ_CIA com pontuação: "60.872.504/0001-23"
// ─────────────────────────────────────────────────────────────────────────────
async function fetchDocsByTipo(cnpjClean, tipo, label, descricao) {
  const cnpjFmt = formatCnpj(cnpjClean);
  const docs = [];
  const anoAtual = new Date().getFullYear();

  for (let ano = anoAtual; ano >= anoAtual - 3; ano--) {
    // Nome do resource no CKAN (ex: dfp_cia_aberta_2024)
    // Tenta também o padrão com "con" (consolidado) e sem sufixo
    const nomes = [
      `${tipo}_cia_aberta_${ano}`,
      `${tipo}_cia_aberta_con_${ano}`,
    ];

    for (const nome of nomes) {
      try {
        // Busca o resource_id pelo nome
        const pkgUrl = `https://dados.cvm.gov.br/api/3/action/resource_search?query=name:${encodeURIComponent(nome)}&limit=3`;
        const pkg = await fetchJson(pkgUrl);
        const resources = pkg?.result?.results || [];

        for (const resource of resources) {
          if (!resource.id) continue;

          // Query com CNPJ formatado (com pontuação)
          const dsUrl = `https://dados.cvm.gov.br/api/3/action/datastore_search`
            + `?resource_id=${encodeURIComponent(resource.id)}`
            + `&filters=${encodeURIComponent(JSON.stringify({ CNPJ_CIA: cnpjFmt }))}`
            + `&limit=10&sort=DT_REFER%20desc`;

          const ds = await fetchJson(dsUrl);
          const records = ds?.result?.records || [];

          for (const rec of records) {
            const periodo = rec.DT_REFER || rec.DT_INI_EXERC || rec.DT_RECEB || String(ano);

            // Evita duplicatas
            const key = `${label}_${periodo}_${rec.VERSAO || '1'}`;
            if (docs.find(d => d._key === key)) continue;

            let link = rec.LINK_DOC || null;
            if (!link) {
              // Monta link ENET com os campos disponíveis
              if (rec.NUM_SEQ_DOC) {
                link = `https://www.rad.cvm.gov.br/ENET/frmExibirArquivoIPE.aspx`
                     + `?NumeroSequencialDocumento=${rec.NUM_SEQ_DOC}`
                     + `&CodigoTipoDocumento=${rec.COD_TIPO_DOC || ''}`
                     + `&DataApresentacao=${rec.DT_REFER || ''}`
                     + `&NumeroSequencialRegistroCvm=${rec.NUM_SEQ_REGST || ''}`
                     + `&CodigoInstituicao=1`;
              } else {
                link = `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx`
                     + `?CNPJ=${cnpjClean}&CATEG_DOC=${tipo.toUpperCase()}&ANO=${ano}`;
              }
            }

            docs.push({
              _key:    key,
              tipo:    label,
              descricao,
              empresa: rec.DENOM_CIA || rec.NOME_CIA || '',
              periodo: periodo.slice(0, 10),
              versao:  rec.VERSAO || '1',
              link,
              ano,
            });
          }

          if (docs.filter(d => d.tipo === label && d.ano === ano).length > 0) break;
        }
      } catch(e) {
        // silencia falhas individuais por ano/nome
      }

      if (docs.filter(d => d.tipo === label && d.ano === ano).length > 0) break;
    }

    // Se achou docs nesse ano, continua para pegar anos anteriores também (máx 2 anos)
    if (docs.filter(d => d.tipo === label).length >= 3) break;
  }

  return docs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Links diretos ENET — sempre disponíveis
// ─────────────────────────────────────────────────────────────────────────────
function buildEnetLinks(cnpjClean) {
  const base = `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}`;
  return [
    { label: 'Consultar todos os documentos no ENET',  descricao: 'Portal de consulta de documentos da CVM',   link: base },
    { label: 'DFP — Demonstrações Financeiras Anuais', descricao: 'Balanço patrimonial, DRE, fluxo de caixa',  link: base + '&CATEG_DOC=DFP' },
    { label: 'ITR — Informações Trimestrais',           descricao: 'Resultados dos últimos trimestres',          link: base + '&CATEG_DOC=ITR' },
    { label: 'FRE — Formulário de Referência',          descricao: 'Governança, remuneração, fatores de risco',  link: base + '&CATEG_DOC=FRE' },
    { label: 'IPE — Fatos Relevantes e Comunicados',   descricao: 'Avisos, fatos relevantes, atas de reunião',  link: base + '&CATEG_DOC=IPE' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal
// ─────────────────────────────────────────────────────────────────────────────
async function getDocumentsByCnpj(ticker, cnpj) {
  if (!cnpj) return { available: false, reason: 'sem_cnpj', docs: [], enetLinks: [] };

  const cnpjClean = cleanCnpj(cnpj);
  const cacheKey  = `cvm:docs:${cnpjClean}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  const enetLinks = buildEnetLinks(cnpjClean);

  const TIPOS = [
    { tipo: 'dfp', label: 'DFP', descricao: 'Demonstrações Financeiras Anuais' },
    { tipo: 'itr', label: 'ITR', descricao: 'Informações Trimestrais' },
    { tipo: 'fre', label: 'FRE', descricao: 'Formulário de Referência' },
    { tipo: 'ipe', label: 'IPE', descricao: 'Fatos Relevantes e Comunicados' },
  ];

  let allDocs = [];
  try {
    const results = await Promise.allSettled(
      TIPOS.map(({ tipo, label, descricao }) => fetchDocsByTipo(cnpjClean, tipo, label, descricao))
    );
    results.forEach(r => {
      if (r.status === 'fulfilled') allDocs.push(...r.value);
    });

    // Remove campo interno _key antes de retornar
    allDocs = allDocs.map(({ _key, ...rest }) => rest);
    allDocs.sort((a, b) => (b.periodo || '').localeCompare(a.periodo || ''));
  } catch(e) {
    console.warn('[CVM] Erro geral:', e.message);
  }

  const response = {
    available: true,
    ticker,
    cnpj,
    cnpjClean,
    docs: allDocs.slice(0, 30),
    enetLinks,
    updatedAt: new Date().toISOString(),
  };

  set(cacheKey, response, 6 * 60 * 60); // cache 6h
  return response;
}

module.exports = { getDocumentsByCnpj, cleanCnpj };
