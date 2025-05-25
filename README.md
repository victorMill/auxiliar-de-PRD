# Checklist de Documentos

Sistema para verificação de documentos necessários baseado em regras de negócio do BNB.

## Descrição

Este sistema verifica quais documentos são necessários com base em diversos parâmetros como fonte de recursos, programa, porte da empresa, etc. O sistema usa um conjunto de regras de dispensa para determinar quando um documento NÃO é necessário.

## Estrutura do Projeto

```
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   └── data/
│       ├── rules_matrix.json
│       └── document_types.json
├── src/
│   └── utils/
│       ├── document_manager.js
│       └── cli.js
```

## Regras de Negócio

O arquivo `rules_matrix.json` contém as regras de DISPENSA de documentos. Importante: as regras definem quando um documento NÃO é necessário, nunca o contrário.

## Configuração

1. Clone o repositório
2. Copie `.env.example` para `.env` e ajuste as configurações
3. Execute `npm install`
4. Execute `npm start`

## Uso do CLI

O sistema inclui uma ferramenta CLI para gerenciar documentos e regras:

```bash
node src/utils/cli.js
```

## Documentos Suportados

- CND (Certidão Negativa de Débitos)
- CRF (Certificado de Regularidade do FGTS)
- CNDT (Certidão Negativa de Débitos Trabalhistas)
- Declaração de Não Empregador
- Autorização de Débito em Conta

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request 