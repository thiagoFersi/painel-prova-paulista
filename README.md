# Painel Prova Paulista e Alura

Dashboard por escola com a Prova Paulista (TEC) e a avaliação Alura, por bimestre.

## Como abrir no VS Code
1. Abra a pasta `painel-prova-paulista-alura` no VS Code (Arquivo > Abrir Pasta).
2. Instale a extensão **Live Server** e clique em **Go Live**, no canto inferior direito. Também funciona dando dois cliques em `index.html`.

## Estrutura
- `index.html`: estrutura da página (filtros, cards, gráficos, tabela e aba de upload).
- `css/style.css`: cores, tipografia e layout. As cores ficam nas variáveis do início do arquivo.
- `js/data.js`: dados da planilha original (48 escolas, 3 bimestres).
- `js/app.js`: cálculos, gráficos, tabela e leitura do Excel.
- `exemplo/`: a planilha original, para testar a aba **Atualizar dados**.

## Como atualizar com o 4º bimestre
**Pela página:** aba **Atualizar dados**, escolha o `.xlsx` e clique em **Aplicar ao painel**. Os dados ficam salvos no navegador.
O arquivo precisa ter as abas **Dados** (colunas "Escolas PP 4 BIM", "Total Alunos", "(%) Participação", "(%) Acertos", "TEC") e **Avaliações** (blocos "1ª AVALIAÇÃO - 4º BIM" e "2ª AVALIAÇÃO - 4º BIM"), com os mesmos nomes de escola nas duas.

**Pelo código:** edite `js/data.js` (aumente `nb` e acrescente os valores em `pp`, `alu` e `idx` de cada escola).

## Internet
A página usa a fonte IBM Plex Sans (Google Fonts) e a biblioteca SheetJS (cdnjs). Sem internet, a fonte cai para a padrão do sistema e a aba de upload não lê planilhas.
Para usar offline, baixe `xlsx.full.min.js` (https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js), salve em `js/` e troque o `src` da tag `<script>` no `index.html` para `js/xlsx.full.min.js`.
