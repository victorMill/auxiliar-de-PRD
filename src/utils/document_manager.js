const fs = require('fs').promises;
const path = require('path');

class DocumentManager {
    constructor() {
        this.rulesPath = path.join(__dirname, '../../public/data/rules_matrix.json');
        this.typesPath = path.join(__dirname, '../../public/data/document_types.json');
    }

    async loadData() {
        try {
            const [rulesData, typesData] = await Promise.all([
                fs.readFile(this.rulesPath, 'utf8'),
                fs.readFile(this.typesPath, 'utf8')
            ]);
            this.rules = JSON.parse(rulesData);
            this.types = JSON.parse(typesData);
        } catch (error) {
            throw new Error(`Erro ao carregar dados: ${error.message}`);
        }
    }

    async saveData() {
        try {
            await Promise.all([
                fs.writeFile(this.rulesPath, JSON.stringify(this.rules, null, 2)),
                fs.writeFile(this.typesPath, JSON.stringify(this.types, null, 2))
            ]);
        } catch (error) {
            throw new Error(`Erro ao salvar dados: ${error.message}`);
        }
    }

    validateRule(rule) {
        if (!rule.descricao || typeof rule.descricao !== 'string') {
            throw new Error('Regra deve ter uma descrição válida');
        }
        if (!rule.condicoes || typeof rule.condicoes !== 'object') {
            throw new Error('Regra deve ter condições válidas');
        }

        // Validar campos das condições
        for (const [campo, valor] of Object.entries(rule.condicoes)) {
            if (!this.types.campos_disponiveis[campo]) {
                throw new Error(`Campo "${campo}" não está definido em campos_disponiveis`);
            }

            if (Array.isArray(valor)) {
                valor.forEach(v => {
                    if (v.startsWith('!')) {
                        const realValue = v.substring(1);
                        if (!this.types.campos_disponiveis[campo].valores.includes(realValue)) {
                            throw new Error(`Valor "${realValue}" não é válido para o campo "${campo}"`);
                        }
                    } else if (!this.types.campos_disponiveis[campo].valores.includes(v)) {
                        throw new Error(`Valor "${v}" não é válido para o campo "${campo}"`);
                    }
                });
            } else if (typeof valor === 'object') {
                if (this.types.campos_disponiveis[campo].tipo !== 'numero') {
                    throw new Error(`Campo "${campo}" não suporta condições numéricas`);
                }
            }
        }
    }

    async addDocument(codigo, nome, descricao, validade, campos_relacionados, norma = "") {
        await this.loadData();

        // Validar campos relacionados
        campos_relacionados.forEach(campo => {
            if (!this.types.campos_disponiveis[campo]) {
                throw new Error(`Campo "${campo}" não está definido em campos_disponiveis`);
            }
        });

        // Adicionar ao document_types.json
        this.types.tipos_documentos[codigo] = {
            nome,
            descricao,
            validade,
            campos_relacionados,
            norma
        };

        // Adicionar ao rules_matrix.json
        this.rules.documentos[codigo] = {
            nome,
            regras: []
        };

        await this.saveData();
    }

    async addRule(codigoDocumento, regra) {
        await this.loadData();

        if (!this.rules.documentos[codigoDocumento]) {
            throw new Error(`Documento "${codigoDocumento}" não encontrado`);
        }

        this.validateRule(regra);
        this.rules.documentos[codigoDocumento].regras.push(regra);
        await this.saveData();
    }

    async removeDocument(codigo) {
        await this.loadData();
        delete this.types.tipos_documentos[codigo];
        delete this.rules.documentos[codigo];
        await this.saveData();
    }

    async removeRule(codigoDocumento, indiceRegra) {
        await this.loadData();
        if (!this.rules.documentos[codigoDocumento]) {
            throw new Error(`Documento "${codigoDocumento}" não encontrado`);
        }
        this.rules.documentos[codigoDocumento].regras.splice(indiceRegra, 1);
        await this.saveData();
    }

    async listDocuments() {
        await this.loadData();
        return this.types.tipos_documentos;
    }

    async listRules(codigoDocumento) {
        await this.loadData();
        if (!this.rules.documentos[codigoDocumento]) {
            throw new Error(`Documento "${codigoDocumento}" não encontrado`);
        }
        return this.rules.documentos[codigoDocumento].regras;
    }
}

module.exports = DocumentManager; 