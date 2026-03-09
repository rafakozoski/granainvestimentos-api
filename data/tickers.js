// data/tickers.js — lista completa de ativos com CNPJ para integração CVM

const TICKERS = [

  // ─────────────────────────────────────────────
  // AÇÕES
  // ─────────────────────────────────────────────

  // Bancos
  { code: 'BBAS3',  name: 'Banco do Brasil S.A.',         type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Novo Mercado', cnpj: '00.000.000/0001-91' },
  { code: 'ITUB4',  name: 'Itaú Unibanco Holding S.A.',   type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 1',      cnpj: '60.872.504/0001-23' },
  { code: 'ITUB3',  name: 'Itaú Unibanco Holding ON',     type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 1',      cnpj: '60.872.504/0001-23' },
  { code: 'BBDC4',  name: 'Bradesco S.A. PN',             type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 1',      cnpj: '60.746.948/0001-12' },
  { code: 'BBDC3',  name: 'Bradesco S.A. ON',             type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 1',      cnpj: '60.746.948/0001-12' },
  { code: 'SANB11', name: 'Santander Brasil S.A.',         type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 2',      cnpj: '90.400.888/0001-42' },
  { code: 'BRSR6',  name: 'Banrisul S.A.',                 type: 'acao', sector: 'Bancos',      subsector: 'Bancos Regionais',         segment: 'Nível 1',      cnpj: '92.702.067/0001-96' },
  { code: 'BMGB4',  name: 'Banco BMG S.A.',                type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Básico',       cnpj: '61.186.680/0001-74' },
  { code: 'ABCB4',  name: 'Banco ABC Brasil S.A.',         type: 'acao', sector: 'Bancos',      subsector: 'Bancos Diversificados',    segment: 'Nível 2',      cnpj: '28.195.667/0001-06' },
  { code: 'BPAC11', name: 'BTG Pactual',                   type: 'acao', sector: 'Bancos',      subsector: 'Bancos de Investimento',   segment: 'Novo Mercado', cnpj: '30.306.294/0001-45' },
  { code: 'ITSA4',  name: 'Itaúsa S.A. PN',               type: 'acao', sector: 'Bancos',      subsector: 'Holdings Financeiras',     segment: 'Nível 1',      cnpj: '61.532.644/0001-15' },
  { code: 'ITSA3',  name: 'Itaúsa S.A. ON',               type: 'acao', sector: 'Bancos',      subsector: 'Holdings Financeiras',     segment: 'Nível 1',      cnpj: '61.532.644/0001-15' },
  { code: 'BEES3',  name: 'Banestes S.A. ON',             type: 'acao', sector: 'Bancos',      subsector: 'Bancos Regionais',         segment: 'Básico',       cnpj: '28.127.603/0001-78' },
  { code: 'BEES4',  name: 'Banestes S.A. PN',             type: 'acao', sector: 'Bancos',      subsector: 'Bancos Regionais',         segment: 'Básico',       cnpj: '28.127.603/0001-78' },

  // Energia Elétrica
  { code: 'EGIE3',  name: 'Engie Brasil Energia S.A.',    type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '02.474.103/0001-19' },
  { code: 'TAEE11', name: 'Taesa',                         type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 2',      cnpj: '07.859.971/0001-30' },
  { code: 'ENGI11', name: 'Energisa S.A.',                 type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 2',      cnpj: '00.864.214/0001-06' },
  { code: 'CPFE3',  name: 'CPFL Energia S.A.',             type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '02.429.144/0001-93' },
  { code: 'CMIG4',  name: 'Cemig PN',                      type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 1',      cnpj: '17.155.730/0001-64' },
  { code: 'CMIG3',  name: 'Cemig ON',                      type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 1',      cnpj: '17.155.730/0001-64' },
  { code: 'NEOE3',  name: 'Neoenergia S.A.',               type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '01.083.200/0001-18' },
  { code: 'AURE3',  name: 'Auren Energia S.A.',            type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '22.262.115/0001-07' },
  { code: 'ELET3',  name: 'Eletrobras ON',                 type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 1',      cnpj: '00.001.180/0001-26' },
  { code: 'ELET6',  name: 'Eletrobras PNB',                type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 1',      cnpj: '00.001.180/0001-26' },
  { code: 'TRPL4',  name: 'ISA CTEEP PN',                  type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Nível 1',      cnpj: '02.998.609/0001-27' },
  { code: 'EQTL3',  name: 'Equatorial Energia S.A.',       type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '03.220.438/0001-73' },
  { code: 'ENEV3',  name: 'Eneva S.A.',                    type: 'acao', sector: 'Energia',     subsector: 'Energia Elétrica',         segment: 'Novo Mercado', cnpj: '04.328.tvdb/0001-00' },

  // Petróleo e Gás
  { code: 'PETR4',  name: 'Petrobras PN',                  type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Nível 2',      cnpj: '33.000.167/0001-01' },
  { code: 'PETR3',  name: 'Petrobras ON',                  type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Nível 2',      cnpj: '33.000.167/0001-01' },
  { code: 'PRIO3',  name: 'PRIO S.A.',                     type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '10.629.105/0001-68' },
  { code: 'RECV3',  name: 'PetroRecôncavo S.A.',           type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '03.342.704/0001-30' },
  { code: 'RRRP3',  name: '3R Petroleum S.A.',             type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '12.091.809/0001-55' },
  { code: 'CSAN3',  name: 'Cosan S.A.',                    type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '50.746.577/0001-15' },
  { code: 'UGPA3',  name: 'Ultrapar Participações S.A.',   type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '33.256.439/0001-39' },
  { code: 'VBBR3',  name: 'Vibra Energia S.A.',            type: 'acao', sector: 'Petróleo',    subsector: 'Petróleo e Gás',           segment: 'Novo Mercado', cnpj: '08.284.191/0001-10' },

  // Mineração e Siderurgia
  { code: 'VALE3',  name: 'Vale S.A.',                     type: 'acao', sector: 'Mineração',   subsector: 'Minerais Metálicos',       segment: 'Novo Mercado', cnpj: '33.592.510/0001-54' },
  { code: 'CSNA3',  name: 'CSN S.A.',                      type: 'acao', sector: 'Mineração',   subsector: 'Siderurgia',               segment: 'Novo Mercado', cnpj: '33.042.730/0001-04' },
  { code: 'GGBR4',  name: 'Gerdau S.A. PN',                type: 'acao', sector: 'Mineração',   subsector: 'Siderurgia',               segment: 'Nível 1',      cnpj: '33.611.500/0001-19' },
  { code: 'GGBR3',  name: 'Gerdau S.A. ON',                type: 'acao', sector: 'Mineração',   subsector: 'Siderurgia',               segment: 'Nível 1',      cnpj: '33.611.500/0001-19' },
  { code: 'GOAU4',  name: 'Metalúrgica Gerdau PN',         type: 'acao', sector: 'Mineração',   subsector: 'Siderurgia',               segment: 'Nível 1',      cnpj: '92.690.783/0001-09' },
  { code: 'USIM5',  name: 'Usiminas PNA',                  type: 'acao', sector: 'Mineração',   subsector: 'Siderurgia',               segment: 'Nível 1',      cnpj: '60.894.730/0001-05' },
  { code: 'CMIN3',  name: 'CSN Mineração S.A.',            type: 'acao', sector: 'Mineração',   subsector: 'Minerais Metálicos',       segment: 'Novo Mercado', cnpj: '41.387.912/0001-60' },

  // Tecnologia
  { code: 'WEGE3',  name: 'WEG S.A.',                      type: 'acao', sector: 'Tecnologia',  subsector: 'Máquinas e Equipamentos',  segment: 'Novo Mercado', cnpj: '84.429.695/0001-11' },
  { code: 'TOTS3',  name: 'Totvs S.A.',                    type: 'acao', sector: 'Tecnologia',  subsector: 'Software',                 segment: 'Novo Mercado', cnpj: '53.113.791/0001-22' },
  { code: 'INTB3',  name: 'Intelbras S.A.',                type: 'acao', sector: 'Tecnologia',  subsector: 'Eletrônicos',              segment: 'Novo Mercado', cnpj: '82.901.000/0001-27' },
  { code: 'POSI3',  name: 'Positivo Tecnologia S.A.',      type: 'acao', sector: 'Tecnologia',  subsector: 'Hardware',                 segment: 'Novo Mercado', cnpj: '81.243.735/0001-48' },
  { code: 'LWSA3',  name: 'Locaweb S.A.',                  type: 'acao', sector: 'Tecnologia',  subsector: 'Software',                 segment: 'Novo Mercado', cnpj: '10.327.598/0001-01' },
  { code: 'CASH3',  name: 'Méliuz S.A.',                   type: 'acao', sector: 'Tecnologia',  subsector: 'Fintech',                  segment: 'Novo Mercado', cnpj: '15.312.674/0001-61' },

  // Varejo
  { code: 'MGLU3',  name: 'Magazine Luiza S.A.',           type: 'acao', sector: 'Varejo',      subsector: 'Varejo',                   segment: 'Novo Mercado', cnpj: '47.960.950/0001-21' },
  { code: 'LREN3',  name: 'Lojas Renner S.A.',             type: 'acao', sector: 'Varejo',      subsector: 'Varejo de Roupas',         segment: 'Novo Mercado', cnpj: '92.754.738/0001-62' },
  { code: 'ARZZ3',  name: 'Arezzo S.A.',                   type: 'acao', sector: 'Varejo',      subsector: 'Varejo de Calçados',       segment: 'Novo Mercado', cnpj: '16.590.234/0001-76' },
  { code: 'VIVA3',  name: 'Vivara S.A.',                   type: 'acao', sector: 'Varejo',      subsector: 'Varejo de Joias',          segment: 'Novo Mercado', cnpj: '17.590.361/0001-74' },
  { code: 'SOMA3',  name: 'Grupo Soma S.A.',               type: 'acao', sector: 'Varejo',      subsector: 'Varejo de Roupas',         segment: 'Novo Mercado', cnpj: '29.002.956/0001-31' },
  { code: 'PETZ3',  name: 'Petz S.A.',                     type: 'acao', sector: 'Varejo',      subsector: 'Varejo Pet',               segment: 'Novo Mercado', cnpj: '20.722.127/0001-07' },
  { code: 'SBFG3',  name: 'SBF Group (Centauro)',          type: 'acao', sector: 'Varejo',      subsector: 'Varejo Esportivo',         segment: 'Novo Mercado', cnpj: '09.358.108/0001-25' },

  // Consumo / Alimentos
  { code: 'ABEV3',  name: 'Ambev S.A.',                    type: 'acao', sector: 'Consumo',     subsector: 'Bebidas',                  segment: 'Nível 1',      cnpj: '07.526.557/0001-00' },
  { code: 'JBSS3',  name: 'JBS S.A.',                      type: 'acao', sector: 'Consumo',     subsector: 'Alimentos',                segment: 'Novo Mercado', cnpj: '02.916.265/0001-60' },
  { code: 'MRFG3',  name: 'Marfrig S.A.',                  type: 'acao', sector: 'Consumo',     subsector: 'Alimentos',                segment: 'Novo Mercado', cnpj: '03.853.896/0001-40' },
  { code: 'BRFS3',  name: 'BRF S.A.',                      type: 'acao', sector: 'Consumo',     subsector: 'Alimentos',                segment: 'Novo Mercado', cnpj: '01.838.723/0001-27' },
  { code: 'SMTO3',  name: 'São Martinho S.A.',             type: 'acao', sector: 'Consumo',     subsector: 'Açúcar e Álcool',          segment: 'Novo Mercado', cnpj: '51.466.860/0001-56' },

  // Saúde
  { code: 'RDOR3',  name: 'Rede D\'Or São Luiz S.A.',      type: 'acao', sector: 'Saúde',       subsector: 'Hospitais',                segment: 'Novo Mercado', cnpj: '06.047.087/0001-39' },
  { code: 'HAPV3',  name: 'Hapvida S.A.',                  type: 'acao', sector: 'Saúde',       subsector: 'Planos de Saúde',          segment: 'Novo Mercado', cnpj: '63.755.892/0001-32' },
  { code: 'FLRY3',  name: 'Fleury S.A.',                   type: 'acao', sector: 'Saúde',       subsector: 'Diagnósticos',             segment: 'Novo Mercado', cnpj: '60.840.055/0001-31' },
  { code: 'DASA3',  name: 'Diagnósticos da América S.A.',  type: 'acao', sector: 'Saúde',       subsector: 'Diagnósticos',             segment: 'Novo Mercado', cnpj: '61.486.650/0001-83' },
  { code: 'PARD3',  name: 'Instituto Hermes Pardini S.A.', type: 'acao', sector: 'Saúde',       subsector: 'Diagnósticos',             segment: 'Novo Mercado', cnpj: '17.040.518/0001-15' },

  // Imóveis / Construção
  { code: 'CYRE3',  name: 'Cyrela Brazil Realty S.A.',     type: 'acao', sector: 'Imóveis',     subsector: 'Incorporação',             segment: 'Novo Mercado', cnpj: '73.178.600/0001-18' },
  { code: 'MRVE3',  name: 'MRV Engenharia S.A.',           type: 'acao', sector: 'Imóveis',     subsector: 'Incorporação',             segment: 'Novo Mercado', cnpj: '08.343.492/0001-20' },
  { code: 'EVEN3',  name: 'Even Construtora S.A.',         type: 'acao', sector: 'Imóveis',     subsector: 'Incorporação',             segment: 'Novo Mercado', cnpj: '43.470.serviços/0001-00' },
  { code: 'EZTC3',  name: 'EZTEC S.A.',                    type: 'acao', sector: 'Imóveis',     subsector: 'Incorporação',             segment: 'Novo Mercado', cnpj: '08.312.229/0001-73' },
  { code: 'TEND3',  name: 'Construtora Tenda S.A.',        type: 'acao', sector: 'Imóveis',     subsector: 'Incorporação',             segment: 'Novo Mercado', cnpj: '71.476.527/0001-35' },
  { code: 'MULT3',  name: 'Multiplan S.A.',                type: 'acao', sector: 'Imóveis',     subsector: 'Shoppings',                segment: 'Nível 2',      cnpj: '07.816.890/0001-10' },
  { code: 'IGTI11', name: 'Iguatemi S.A.',                 type: 'acao', sector: 'Imóveis',     subsector: 'Shoppings',                segment: 'Novo Mercado', cnpj: '51.218.147/0001-93' },
  { code: 'BRML3',  name: 'BR Malls S.A.',                 type: 'acao', sector: 'Imóveis',     subsector: 'Shoppings',                segment: 'Novo Mercado', cnpj: '06.977.751/0001-49' },

  // Logística / Infraestrutura
  { code: 'RENT3',  name: 'Localiza Rent a Car S.A.',      type: 'acao', sector: 'Logística',   subsector: 'Locação de Veículos',      segment: 'Novo Mercado', cnpj: '16.670.085/0001-55' },
  { code: 'CCRO3',  name: 'CCR S.A.',                      type: 'acao', sector: 'Logística',   subsector: 'Concessões',               segment: 'Novo Mercado', cnpj: '02.846.056/0001-97' },
  { code: 'ECOR3',  name: 'EcoRodovias S.A.',              type: 'acao', sector: 'Logística',   subsector: 'Concessões',               segment: 'Novo Mercado', cnpj: '04.149.985/0001-37' },
  { code: 'TIMS3',  name: 'TIM S.A.',                      type: 'acao', sector: 'Logística',   subsector: 'Telecomunicações',         segment: 'Novo Mercado', cnpj: '02.421.421/0001-11' },
  { code: 'VIVT3',  name: 'Telefônica Brasil S.A.',        type: 'acao', sector: 'Logística',   subsector: 'Telecomunicações',         segment: 'Novo Mercado', cnpj: '02.558.157/0001-62' },

  // Seguros / Financeiro
  { code: 'BBSE3',  name: 'BB Seguridade S.A.',            type: 'acao', sector: 'Seguros',     subsector: 'Seguros',                  segment: 'Novo Mercado', cnpj: '17.344.597/0001-94' },
  { code: 'IRBR3',  name: 'IRB Brasil RE S.A.',            type: 'acao', sector: 'Seguros',     subsector: 'Resseguros',               segment: 'Novo Mercado', cnpj: '33.376.989/0001-91' },
  { code: 'PSSA3',  name: 'Porto Seguro S.A.',             type: 'acao', sector: 'Seguros',     subsector: 'Seguros',                  segment: 'Novo Mercado', cnpj: '61.198.164/0001-60' },
  { code: 'B3SA3',  name: 'B3 S.A.',                       type: 'acao', sector: 'Financeiro',  subsector: 'Bolsas de Valores',        segment: 'Novo Mercado', cnpj: '09.346.601/0001-25' },
  { code: 'XPBR31', name: 'XP Inc.',                       type: 'acao', sector: 'Financeiro',  subsector: 'Corretoras',               segment: 'Básico',       cnpj: '33.775.974/0001-04' },

  // Agronegócio
  { code: 'AGRO3',  name: 'BrasilAgro S.A.',               type: 'acao', sector: 'Agronegócio', subsector: 'Agricultura',              segment: 'Novo Mercado', cnpj: '07.628.528/0001-59' },
  { code: 'SLCE3',  name: 'SLC Agrícola S.A.',             type: 'acao', sector: 'Agronegócio', subsector: 'Agricultura',              segment: 'Novo Mercado', cnpj: '89.096.457/0001-46' },
  { code: 'TTEN3',  name: 'Terra Santa Agro S.A.',         type: 'acao', sector: 'Agronegócio', subsector: 'Agricultura',              segment: 'Novo Mercado', cnpj: '05.799.312/0001-20' },

  // Educação
  { code: 'COGN3',  name: 'Cogna Educação S.A.',           type: 'acao', sector: 'Educação',    subsector: 'Ensino',                   segment: 'Novo Mercado', cnpj: '02.800.026/0001-40' },
  { code: 'YDUQ3',  name: 'Yduqs Participações S.A.',      type: 'acao', sector: 'Educação',    subsector: 'Ensino',                   segment: 'Novo Mercado', cnpj: '08.807.432/0001-10' },
  { code: 'SEER3',  name: 'Ser Educacional S.A.',          type: 'acao', sector: 'Educação',    subsector: 'Ensino',                   segment: 'Novo Mercado', cnpj: '13.755.785/0001-36' },

  // Saneamento
  { code: 'SAPR11', name: 'Sanepar',                       type: 'acao', sector: 'Saneamento',  subsector: 'Saneamento',               segment: 'Nível 2',      cnpj: '76.484.013/0001-45' },
  { code: 'SBSP3',  name: 'Sabesp S.A.',                   type: 'acao', sector: 'Saneamento',  subsector: 'Saneamento',               segment: 'Novo Mercado', cnpj: '43.776.517/0001-80' },
  { code: 'CSMG3',  name: 'Copasa MG S.A.',                type: 'acao', sector: 'Saneamento',  subsector: 'Saneamento',               segment: 'Novo Mercado', cnpj: '17.345.003/0001-33' },

  // Papel e Celulose
  { code: 'SUZB3',  name: 'Suzano S.A.',                   type: 'acao', sector: 'Papel',       subsector: 'Papel e Celulose',         segment: 'Novo Mercado', cnpj: '16.404.287/0001-55' },
  { code: 'KLBN11', name: 'Klabin S.A.',                   type: 'acao', sector: 'Papel',       subsector: 'Papel e Celulose',         segment: 'Nível 2',      cnpj: '89.637.490/0001-45' },

  // ─────────────────────────────────────────────
  // FIIs
  // ─────────────────────────────────────────────

  { code: 'HGLG11', name: 'CSHG Logística FII',            type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '11.728.688/0001-47' },
  { code: 'BRCO11', name: 'Bresco Logística FII',          type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '32.274.163/0001-59' },
  { code: 'BTLG11', name: 'BTG Pactual Logística FII',     type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '16.524.000/0001-86' },
  { code: 'LVBI11', name: 'VBI Logístico FII',             type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '30.818.263/0001-09' },
  { code: 'PATL11', name: 'Pátria Logística FII',          type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '26.502.794/0001-85' },
  { code: 'XPLG11', name: 'XP Log FII',                    type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '26.502.794/0001-85' },
  { code: 'GARE11', name: 'Guardian Real Estate FII',      type: 'fii',  sector: 'FIIs', subsector: 'Logística',          segment: 'FII', cnpj: '36.198.957/0001-07' },
  { code: 'HGRE11', name: 'CSHG Real Estate FII',          type: 'fii',  sector: 'FIIs', subsector: 'Lajes Corporativas', segment: 'FII', cnpj: '09.072.017/0001-29' },
  { code: 'BRCR11', name: 'BC Fund FII',                   type: 'fii',  sector: 'FIIs', subsector: 'Lajes Corporativas', segment: 'FII', cnpj: '11.026.627/0001-44' },
  { code: 'PVBI11', name: 'VBI Prime Properties FII',      type: 'fii',  sector: 'FIIs', subsector: 'Lajes Corporativas', segment: 'FII', cnpj: '34.628.756/0001-09' },
  { code: 'JSRE11', name: 'JS Real Estate FII',            type: 'fii',  sector: 'FIIs', subsector: 'Lajes Corporativas', segment: 'FII', cnpj: '08.205.435/0001-86' },
  { code: 'XPML11', name: 'XP Malls FII',                  type: 'fii',  sector: 'FIIs', subsector: 'Shoppings',          segment: 'FII', cnpj: '28.757.546/0001-00' },
  { code: 'HSML11', name: 'HSI Malls FII',                 type: 'fii',  sector: 'FIIs', subsector: 'Shoppings',          segment: 'FII', cnpj: '29.641.226/0001-53' },
  { code: 'VISC11', name: 'Vinci Shopping Centers FII',    type: 'fii',  sector: 'FIIs', subsector: 'Shoppings',          segment: 'FII', cnpj: '17.554.274/0001-30' },
  { code: 'MALL11', name: 'Malls Brasil Plural FII',       type: 'fii',  sector: 'FIIs', subsector: 'Shoppings',          segment: 'FII', cnpj: '28.516.330/0001-79' },
  { code: 'HGBS11', name: 'Hedge Brasil Shopping FII',     type: 'fii',  sector: 'FIIs', subsector: 'Shoppings',          segment: 'FII', cnpj: '08.431.747/0001-06' },
  { code: 'MXRF11', name: 'Maxi Renda FII',                type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '97.521.225/0001-25' },
  { code: 'KNCR11', name: 'Kinea Rendimentos FII',         type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '15.490.834/0001-03' },
  { code: 'IRDM11', name: 'Iridium Recebíveis FII',        type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '19.541.921/0001-63' },
  { code: 'CPTS11', name: 'Capitânia Securities II FII',   type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '15.417.081/0001-01' },
  { code: 'HGCR11', name: 'CSHG Recebíveis Imobiliários',  type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '11.160.521/0001-22' },
  { code: 'KNIP11', name: 'Kinea Índice de Preços FII',    type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '26.494.704/0001-26' },
  { code: 'RBRY11', name: 'RBR Rendimento High Grade FII', type: 'fii',  sector: 'FIIs', subsector: 'Papel',              segment: 'FII', cnpj: '31.238.107/0001-30' },
  { code: 'BCFF11', name: 'BC Fundo de Fundos FII',        type: 'fii',  sector: 'FIIs', subsector: 'Fundo de Fundos',    segment: 'FII', cnpj: '13.182.478/0001-49' },
  { code: 'RBRF11', name: 'RBR Alpha Fundo de Fundos',     type: 'fii',  sector: 'FIIs', subsector: 'Fundo de Fundos',    segment: 'FII', cnpj: '28.264.191/0001-07' },
  { code: 'HFOF11', name: 'Hedge Fundo de Fundos FII',     type: 'fii',  sector: 'FIIs', subsector: 'Fundo de Fundos',    segment: 'FII', cnpj: '28.054.014/0001-08' },
  { code: 'MGFF11', name: 'Mogno Fundo de Fundos FII',     type: 'fii',  sector: 'FIIs', subsector: 'Fundo de Fundos',    segment: 'FII', cnpj: '30.400.766/0001-12' },
  { code: 'RZTR11', name: 'Riza Terrax FII',               type: 'fii',  sector: 'FIIs', subsector: 'Rural',              segment: 'FII', cnpj: '37.541.878/0001-86' },

  // ─────────────────────────────────────────────
  // ETFs — sem CNPJ (não publicam na CVM como CIA aberta)
  // ─────────────────────────────────────────────

  { code: 'BOVA11', name: 'iShares Ibovespa ETF',          type: 'etf',  sector: 'ETFs', subsector: 'Índice',          segment: 'ETF', cnpj: null },
  { code: 'SMAL11', name: 'iShares Small Cap ETF',         type: 'etf',  sector: 'ETFs', subsector: 'Small Caps',      segment: 'ETF', cnpj: null },
  { code: 'IVVB11', name: 'iShares S&P 500 ETF',           type: 'etf',  sector: 'ETFs', subsector: 'Internacional',   segment: 'ETF', cnpj: null },
  { code: 'HASH11', name: 'Hashdex Nasdaq Crypto ETF',     type: 'etf',  sector: 'ETFs', subsector: 'Cripto',          segment: 'ETF', cnpj: null },
  { code: 'QBTC11', name: 'QR Bitcoin ETF',                type: 'etf',  sector: 'ETFs', subsector: 'Cripto',          segment: 'ETF', cnpj: null },
  { code: 'BITH11', name: 'iShares Bitcoin ETF',           type: 'etf',  sector: 'ETFs', subsector: 'Cripto',          segment: 'ETF', cnpj: null },
  { code: 'DEFI11', name: 'Hashdex DeFi ETF',              type: 'etf',  sector: 'ETFs', subsector: 'Cripto',          segment: 'ETF', cnpj: null },
  { code: 'DIVO11', name: 'iShares Dividendos ETF',        type: 'etf',  sector: 'ETFs', subsector: 'Dividendos',      segment: 'ETF', cnpj: null },
  { code: 'FIND11', name: 'iShares Financeiro ETF',        type: 'etf',  sector: 'ETFs', subsector: 'Setorial',        segment: 'ETF', cnpj: null },
  { code: 'MATB11', name: 'iShares Materiais Básicos ETF', type: 'etf',  sector: 'ETFs', subsector: 'Setorial',        segment: 'ETF', cnpj: null },
  { code: 'GOLD11', name: 'Trend Ouro ETF',                type: 'etf',  sector: 'ETFs', subsector: 'Commodities',     segment: 'ETF', cnpj: null },
  { code: 'NASD11', name: 'Trend Nasdaq 100 ETF',          type: 'etf',  sector: 'ETFs', subsector: 'Internacional',   segment: 'ETF', cnpj: null },
  { code: 'XINA11', name: 'iShares MSCI China ETF',        type: 'etf',  sector: 'ETFs', subsector: 'Internacional',   segment: 'ETF', cnpj: null },
  { code: 'AGRI11', name: 'Itaú Agronegócio ETF',          type: 'etf',  sector: 'ETFs', subsector: 'Setorial',        segment: 'ETF', cnpj: null },

  // ─────────────────────────────────────────────
  // BDRs — sem CNPJ (empresa estrangeira)
  // ─────────────────────────────────────────────

  { code: 'AAPL34', name: 'Apple Inc.',              type: 'bdr',  sector: 'BDRs', subsector: 'Tecnologia',        segment: 'BDR', cnpj: null },
  { code: 'MSFT34', name: 'Microsoft Corp.',         type: 'bdr',  sector: 'BDRs', subsector: 'Tecnologia',        segment: 'BDR', cnpj: null },
  { code: 'AMZO34', name: 'Amazon.com Inc.',         type: 'bdr',  sector: 'BDRs', subsector: 'E-commerce',        segment: 'BDR', cnpj: null },
  { code: 'GOGL34', name: 'Alphabet (Google)',       type: 'bdr',  sector: 'BDRs', subsector: 'Tecnologia',        segment: 'BDR', cnpj: null },
  { code: 'NVDC34', name: 'NVIDIA Corp.',            type: 'bdr',  sector: 'BDRs', subsector: 'Semicondutores',    segment: 'BDR', cnpj: null },
  { code: 'TSLA34', name: 'Tesla Inc.',              type: 'bdr',  sector: 'BDRs', subsector: 'Veículos Elétricos',segment: 'BDR', cnpj: null },
  { code: 'META34', name: 'Meta Platforms Inc.',     type: 'bdr',  sector: 'BDRs', subsector: 'Redes Sociais',     segment: 'BDR', cnpj: null },
  { code: 'NFLX34', name: 'Netflix Inc.',            type: 'bdr',  sector: 'BDRs', subsector: 'Streaming',         segment: 'BDR', cnpj: null },
  { code: 'BERK34', name: 'Berkshire Hathaway',      type: 'bdr',  sector: 'BDRs', subsector: 'Holdings',          segment: 'BDR', cnpj: null },
  { code: 'JPMC34', name: 'JPMorgan Chase',          type: 'bdr',  sector: 'BDRs', subsector: 'Bancos',            segment: 'BDR', cnpj: null },
  { code: 'VISA34', name: 'Visa Inc.',               type: 'bdr',  sector: 'BDRs', subsector: 'Pagamentos',        segment: 'BDR', cnpj: null },
  { code: 'MSTR34', name: 'MasterCard Inc.',         type: 'bdr',  sector: 'BDRs', subsector: 'Pagamentos',        segment: 'BDR', cnpj: null },
  { code: 'COKE34', name: 'Coca-Cola Co.',           type: 'bdr',  sector: 'BDRs', subsector: 'Bebidas',           segment: 'BDR', cnpj: null },
  { code: 'JNJB34', name: 'Johnson & Johnson',       type: 'bdr',  sector: 'BDRs', subsector: 'Saúde',             segment: 'BDR', cnpj: null },
  { code: 'PFIZ34', name: 'Pfizer Inc.',             type: 'bdr',  sector: 'BDRs', subsector: 'Farmacêutico',      segment: 'BDR', cnpj: null },
  { code: 'WMT34',  name: 'Walmart Inc.',            type: 'bdr',  sector: 'BDRs', subsector: 'Varejo',            segment: 'BDR', cnpj: null },
  { code: 'EXXO34', name: 'Exxon Mobil Corp.',       type: 'bdr',  sector: 'BDRs', subsector: 'Petróleo',          segment: 'BDR', cnpj: null },
  { code: 'DISB34', name: 'Walt Disney Co.',         type: 'bdr',  sector: 'BDRs', subsector: 'Entretenimento',    segment: 'BDR', cnpj: null },

  // ─────────────────────────────────────────────
  // CRIPTOS — sem CNPJ
  // ─────────────────────────────────────────────

  { code: 'BTC-USD',   name: 'Bitcoin',    type: 'cripto', sector: 'Criptos', subsector: 'Prova de Trabalho',  segment: 'Cripto', cnpj: null },
  { code: 'ETH-USD',   name: 'Ethereum',   type: 'cripto', sector: 'Criptos', subsector: 'Smart Contracts',    segment: 'Cripto', cnpj: null },
  { code: 'SOL-USD',   name: 'Solana',     type: 'cripto', sector: 'Criptos', subsector: 'Smart Contracts',    segment: 'Cripto', cnpj: null },
  { code: 'BNB-USD',   name: 'BNB',        type: 'cripto', sector: 'Criptos', subsector: 'Exchange Token',     segment: 'Cripto', cnpj: null },
  { code: 'XRP-USD',   name: 'XRP',        type: 'cripto', sector: 'Criptos', subsector: 'Pagamentos',         segment: 'Cripto', cnpj: null },
  { code: 'ADA-USD',   name: 'Cardano',    type: 'cripto', sector: 'Criptos', subsector: 'Smart Contracts',    segment: 'Cripto', cnpj: null },
  { code: 'AVAX-USD',  name: 'Avalanche',  type: 'cripto', sector: 'Criptos', subsector: 'Smart Contracts',    segment: 'Cripto', cnpj: null },
  { code: 'DOT-USD',   name: 'Polkadot',   type: 'cripto', sector: 'Criptos', subsector: 'Interoperabilidade', segment: 'Cripto', cnpj: null },
  { code: 'LINK-USD',  name: 'Chainlink',  type: 'cripto', sector: 'Criptos', subsector: 'Oráculos',           segment: 'Cripto', cnpj: null },
  { code: 'MATIC-USD', name: 'Polygon',    type: 'cripto', sector: 'Criptos', subsector: 'Layer 2',            segment: 'Cripto', cnpj: null },
];

const FEATURED_TICKERS = ['BBAS3','PETR4','VALE3','ITUB4','WEGE3','MGLU3','RENT3','RDOR3'];

const TICKERS_BY_TYPE = {
  acao:   TICKERS.filter(t => t.type === 'acao'),
  fii:    TICKERS.filter(t => t.type === 'fii'),
  etf:    TICKERS.filter(t => t.type === 'etf'),
  bdr:    TICKERS.filter(t => t.type === 'bdr'),
  cripto: TICKERS.filter(t => t.type === 'cripto'),
};

function findTicker(code) {
  return TICKERS.find(t => t.code === code.toUpperCase()) || null;
}

function searchTickers(query, type = null) {
  const q = query.toUpperCase();
  return TICKERS
    .filter(t => (!type || t.type === type) &&
      (t.code.startsWith(q) || t.name.toUpperCase().includes(q)))
    .slice(0, 10);
}

function getTickersBySector(sector) {
  return TICKERS.filter(t => t.sector === sector);
}

function getTickersByType(type) {
  return TICKERS_BY_TYPE[type] || [];
}

module.exports = { TICKERS, FEATURED_TICKERS, TICKERS_BY_TYPE, findTicker, searchTickers, getTickersBySector, getTickersByType };
