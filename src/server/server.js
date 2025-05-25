const http = require('http');
const fs = require('fs');
const path = require('path');

// Mapeamento de extensões de arquivo para tipos MIME
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Cache para o favicon
let faviconCache = null;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Tratamento especial para favicon
    if (req.url === '/favicon.ico') {
        if (faviconCache) {
            res.writeHead(200, {
                'Content-Type': 'image/x-icon',
                'Cache-Control': 'public, max-age=31536000' // Cache por 1 ano
            });
            res.end(faviconCache);
            return;
        }
    }

    // Normalizar URL para evitar directory traversal
    let filePath = path.normalize(req.url);
    
    // Remover possíveis query strings
    filePath = filePath.split('?')[0];

    // Se a URL raiz for solicitada, servir index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Adicionar o diretório public ao caminho
    filePath = path.join(__dirname, '../../public', filePath);

    // Obter a extensão do arquivo
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Ler e servir o arquivo
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Arquivo não encontrado
                console.error(`Arquivo não encontrado: ${filePath}`);
                res.writeHead(404);
                res.end('Arquivo não encontrado');
            } else {
                // Erro do servidor
                console.error(`Erro ao ler arquivo: ${error.code}`);
                res.writeHead(500);
                res.end(`Erro do servidor: ${error.code}`);
            }
        } else {
            // Cache do favicon quando ele for lido pela primeira vez
            if (req.url === '/favicon.ico') {
                faviconCache = content;
            }

            // Configurar headers sem cache para desenvolvimento
            const headers = {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };

            // Sucesso - enviar o arquivo
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    console.log('Para encerrar o servidor, pressione Ctrl+C');
}); 