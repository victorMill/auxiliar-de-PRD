#!/usr/bin/env node
const DocumentManager = require('./document_manager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manager = new DocumentManager();

function pergunta(texto) {
    return new Promise((resolve) => {
        rl.question(texto, resolve);
    });
}

async function menuPrincipal() {
    console.log('\n=== Gerenciador de Documentos e Regras ===');
    console.log('1. Listar Documentos');
    console.log('2. Adicionar Documento');
    console.log('3. Remover Documento');
    console.log('4. Gerenciar Regras');
    console.log('5. Sair');

    const opcao = await pergunta('\nEscolha uma opção: ');

    switch (opcao) {
        case '1':
            await listarDocumentos();
            break;
        case '2':
            await adicionarDocumento();
            break;
        case '3':
            await removerDocumento();
            break;
        case '4':
            await menuRegras();
            break;
        case '5':
            rl.close();
            return;
        default:
            console.log('Opção inválida!');
    }

    await menuPrincipal();
}

async function listarDocumentos() {
    try {
        const documentos = await manager.listDocuments();
        console.log('\nDocumentos cadastrados:');
        for (const [codigo, doc] of Object.entries(documentos)) {
            console.log(`\nCódigo: ${codigo}`);
            console.log(`Nome: ${doc.nome}`);
            console.log(`Descrição: ${doc.descricao}`);
            console.log(`Validade: ${doc.validade}`);
            console.log(`Campos relacionados: ${doc.campos_relacionados.join(', ')}`);
            console.log(`Norma: ${doc.norma || 'Não especificada'}`);
        }
    } catch (error) {
        console.error('Erro ao listar documentos:', error.message);
    }
}

async function adicionarDocumento() {
    try {
        const codigo = await pergunta('Código do documento: ');
        const nome = await pergunta('Nome do documento: ');
        const descricao = await pergunta('Descrição: ');
        const validade = await pergunta('Validade: ');
        const campos = await pergunta('Campos relacionados (separados por vírgula): ');
        const norma = await pergunta('Norma (pressione Enter se não houver): ');
        
        await manager.addDocument(
            codigo,
            nome,
            descricao,
            validade,
            campos.split(',').map(c => c.trim()),
            norma
        );
        
        console.log('Documento adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar documento:', error.message);
    }
}

async function removerDocumento() {
    try {
        const documentos = await manager.listDocuments();
        console.log('\nDocumentos disponíveis:');
        Object.keys(documentos).forEach(codigo => {
            console.log(`- ${codigo}`);
        });

        const codigo = await pergunta('\nCódigo do documento a remover: ');
        await manager.removeDocument(codigo);
        console.log('Documento removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover documento:', error.message);
    }
}

async function menuRegras() {
    console.log('\n=== Gerenciamento de Regras ===');
    console.log('1. Listar Regras de um Documento');
    console.log('2. Adicionar Regra');
    console.log('3. Remover Regra');
    console.log('4. Voltar');

    const opcao = await pergunta('\nEscolha uma opção: ');

    switch (opcao) {
        case '1':
            await listarRegras();
            break;
        case '2':
            await adicionarRegra();
            break;
        case '3':
            await removerRegra();
            break;
        case '4':
            return;
        default:
            console.log('Opção inválida!');
    }

    await menuRegras();
}

async function listarRegras() {
    try {
        const codigo = await pergunta('Código do documento: ');
        const regras = await manager.listRules(codigo);
        
        console.log('\nRegras do documento:');
        regras.forEach((regra, index) => {
            console.log(`\nRegra ${index + 1}:`);
            console.log(`Descrição: ${regra.descricao}`);
            console.log('Condições:');
            Object.entries(regra.condicoes).forEach(([campo, valor]) => {
                console.log(`  ${campo}: ${JSON.stringify(valor)}`);
            });
        });
    } catch (error) {
        console.error('Erro ao listar regras:', error.message);
    }
}

async function adicionarRegra() {
    try {
        const codigo = await pergunta('Código do documento: ');
        const descricao = await pergunta('Descrição da regra: ');
        console.log('\nDigite as condições no formato JSON (exemplo: {"campo": ["valor1", "valor2"]})');
        const condicoesStr = await pergunta('Condições: ');
        
        const regra = {
            descricao,
            condicoes: JSON.parse(condicoesStr)
        };

        await manager.addRule(codigo, regra);
        console.log('Regra adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar regra:', error.message);
    }
}

async function removerRegra() {
    try {
        const codigo = await pergunta('Código do documento: ');
        const regras = await manager.listRules(codigo);
        
        console.log('\nRegras disponíveis:');
        regras.forEach((regra, index) => {
            console.log(`${index + 1}. ${regra.descricao}`);
        });

        const indice = parseInt(await pergunta('\nNúmero da regra a remover: ')) - 1;
        await manager.removeRule(codigo, indice);
        console.log('Regra removida com sucesso!');
    } catch (error) {
        console.error('Erro ao remover regra:', error.message);
    }
}

// Iniciar o programa
console.log('Bem-vindo ao Gerenciador de Documentos e Regras!');
menuPrincipal().catch(console.error); 