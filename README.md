# Checklist de Documentos BNB

Verificador de documentos necessários para operações do BNB.

## Descrição

Esta aplicação web auxilia na verificação dos documentos necessários para operações do Banco do Nordeste do Brasil (BNB), baseando-se em diversos parâmetros como fonte de recursos, porte da empresa, status do CADIN, e finalidade da operação.

## Acesso Online

A aplicação está disponível online através do GitHub Pages:
[https://milhomem.github.io/checklist_documentos_prd](https://milhomem.github.io/checklist_documentos_prd)

## Desenvolvimento Local

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (normalmente vem com Node.js)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/milhomem/checklist_documentos_prd.git
   cd checklist_documentos_prd
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

4. Abra [http://localhost:8080](http://localhost:8080) no seu navegador.

## Deployment

Para fazer deploy da aplicação no GitHub Pages:

1. Certifique-se de que todas as alterações estão commitadas e pushed para o GitHub.

2. Execute o comando de deploy:
   ```bash
   npm run deploy
   ```

3. Aguarde alguns minutos até que o GitHub Pages atualize o site.

## Estrutura do Projeto

```
checklist_documentos_prd/
├── css/
│   └── styles.css
├── data/
│   ├── document_types.json
│   ├── normas.json
│   └── rules_matrix.json
├── js/
│   └── script.js
├── index.html
├── favicon.ico
└── README.md
```

## Licença

ISC 