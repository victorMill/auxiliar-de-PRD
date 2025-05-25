# Checklist de Documentos BNB

Verificador de documentos necessários para operações do BNB (Banco do Nordeste do Brasil).

## Descrição

Esta aplicação web auxilia na verificação dos documentos necessários para operações do Banco do Nordeste do Brasil (BNB), baseando-se em diversos parâmetros como fonte de recursos, porte da empresa, status do CADIN, e finalidade da operação.

## Acesso Online

A aplicação está disponível online através do GitHub Pages:
[https://victorMill.github.io/auxiliar-de-PRD](https://victorMill.github.io/auxiliar-de-PRD)

## Estrutura do Projeto

```
auxiliar-de-PRD/
├── css/
│   └── styles.css          # Estilos da aplicação
├── js/
│   └── script.js          # Lógica principal da aplicação
├── data/
│   ├── document_types.json # Definições dos tipos de documentos
│   ├── normas.json        # Informações sobre normas
│   └── rules_matrix.json  # Regras de verificação de documentos
├── .github/
│   └── workflows/         # GitHub Actions workflows
│       └── deploy.yml     # Configuração de deploy
├── index.html            # Página principal
└── README.md            # Este arquivo
```

## Desenvolvimento Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/victorMill/auxiliar-de-PRD.git
   cd auxiliar-de-PRD
   ```

2. Abra o arquivo `index.html` em seu navegador ou use um servidor local:
   ```bash
   # Usando Python
   python -m http.server 8000
   
   # Ou usando Node.js
   npx serve
   ```

3. Acesse `http://localhost:8000` em seu navegador.

## Deploy

O deploy é feito automaticamente para GitHub Pages quando há um push para a branch main.

Para fazer deploy manual:

1. Configure o GitHub Pages no repositório:
   - Vá para Settings > Pages
   - Selecione a branch gh-pages como source
   - Salve as configurações

2. Push suas alterações:
   ```bash
   git add .
   git commit -m "Suas alterações"
   git push origin main
   ```

3. O GitHub Actions irá automaticamente fazer o deploy para GitHub Pages.

## Manutenção

### Adicionando um Novo Documento

1. Em `data/document_types.json`:
   ```json
   {
     "SIGLA_DO_DOCUMENTO": {
       "nome": "Nome do Documento",
       "descricao": "Descrição detalhada",
       "validade": "Período de validade",
       "campos_relacionados": ["campo1", "campo2"],
       "norma": "código da norma",
       "norma_url": "URL da norma",
       "modelo_url": "URL do modelo",
       "link_text": "Texto do link"
     }
   }
   ```

2. Em `data/rules_matrix.json`:
   ```json
   {
     "SIGLA_DO_DOCUMENTO": {
       "nome": "Nome do Documento",
       "regras": [
         {
           "descricao": "Descrição da regra",
           "condicoes": {
             "campo1": ["valor1", "valor2"],
             "campo2": {
               "minimo": 0,
               "maximo": 100
             }
           }
         }
       ]
     }
   }
   ```

3. Se necessário, em `data/normas.json`:
   ```json
   {
     "CODIGO_NORMA": {
       "titulo": "Título da Norma",
       "url": "URL da norma"
     }
   }
   ```

### Modificando Estilos

1. Os estilos estão organizados em seções no arquivo `css/styles.css`
2. Cada seção tem comentários explicativos
3. Use as variáveis CSS definidas no `:root` para manter consistência

### Modificando Lógica

1. A lógica principal está em `js/script.js`
2. O código está organizado em seções com comentários
3. Use as funções auxiliares existentes para manter consistência

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 