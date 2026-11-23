-- Tabela para configurações globais do app (versão, mensagens, etc.)
CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT,
  versao VARCHAR(20),
  forcar_atualizacao BOOLEAN DEFAULT FALSE,
  mensagem TEXT,
  url_download TEXT,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserindo a configuração inicial de versão
INSERT INTO configuracoes (
  chave,
  versao,
  forcar_atualizacao,
  mensagem,
  url_download
) VALUES (
  'versao_app',
  '0.0.0',
  FALSE,
  'Uma nova versão está disponível! Atualize para ter as novas funcionalidades.',
  'https://play.google.com/store/apps/details?id=com.appoio.app'
) ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (qualquer usuário logado pode ler)
CREATE POLICY "Allow authenticated read on configuracoes"
  ON configuracoes FOR SELECT
  TO authenticated
  USING (true);

-- Política para escrita (apenas service_role, via dashboard)
CREATE POLICY "Allow service_role full access on configuracoes"
  ON configuracoes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);