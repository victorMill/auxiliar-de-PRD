/**
 * Checklist de Documentos BNB - Main Application Script
 * 
 * Este arquivo contém toda a lógica principal da aplicação de verificação
 * de documentos necessários para operações do BNB.
 * 
 * Estrutura do código:
 * 1. Variáveis Globais
 * 2. Funções de Inicialização
 * 3. Funções de Manipulação de Formulário
 * 4. Funções de Validação
 * 5. Funções de Persistência (LocalStorage)
 * 6. Funções de UI/UX
 * 7. Funções de Impressão
 * 8. Função Principal de Verificação
 */

// ============================================================================
// 1. VARIÁVEIS GLOBAIS
// ============================================================================

/** Armazena as regras de documentos carregadas do JSON */
let regrasDocumentos = null;

/** Armazena os tipos de documentos e suas descrições */
let tiposDocumentos = null;

/** Armazena as informações das normas */
let normasData = null;

/** URLs para o modal de CND */
let currentCNDUrlPF = '';
let currentCNDUrlPJ = '';
let cndModal = null;

// ============================================================================
// 2. FUNÇÕES DE INICIALIZAÇÃO
// ============================================================================

/**
 * Carrega os dados necessários dos arquivos JSON com cache
 * @returns {Promise<void>}
 */
async function carregarRegras() {
  try {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      console.log('Using cached data');
      [regrasDocumentos, tiposDocumentos, normasData] = cachedData;
      return;
    }

    // If no cache, load from files
    console.log('Loading data from files');
    const [regrasResponse, tiposResponse, normasResponse] = await Promise.all([
      fetch('data/rules_matrix.json'),
      fetch('data/document_types.json'),
      fetch('data/normas.json')
    ]);

    // Check if any request failed
    if (!regrasResponse.ok || !tiposResponse.ok || !normasResponse.ok) {
      throw new Error('Falha ao carregar um ou mais arquivos de dados');
    }

    const [regras, tipos, normas] = await Promise.all([
      regrasResponse.json(),
      tiposResponse.json(),
      normasResponse.json()
    ]);

    // Validate data structure
    if (!validateDataStructure(regras, tipos, normas)) {
      throw new Error('Estrutura de dados inválida');
    }

    // Update global variables
    regrasDocumentos = regras;
    tiposDocumentos = tipos;
    normasData = normas;

    // Cache the data
    cacheData([regras, tipos, normas]);

  } catch (erro) {
    console.error('Erro ao carregar os dados:', erro);
    throw new Error('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Validates the structure of loaded data
 * @param {Object} regras - Rules matrix data
 * @param {Object} tipos - Document types data
 * @param {Object} normas - Normas data
 * @returns {boolean} - Whether the data structure is valid
 */
function validateDataStructure(regras, tipos, normas) {
  // Check rules matrix structure
  if (!regras?.documentos || typeof regras.documentos !== 'object') {
    console.error('Invalid rules matrix structure');
    return false;
  }

  // Check document types structure
  if (!tipos?.tipos_documentos || typeof tipos.tipos_documentos !== 'object') {
    console.error('Invalid document types structure');
    return false;
  }

  // Check normas structure
  if (!normas?.normas || typeof normas.normas !== 'object') {
    console.error('Invalid normas structure');
    return false;
  }

  return true;
}

/**
 * Gets cached data from localStorage
 * @returns {Array|null} - Cached data array or null if no valid cache
 */
function getCachedData() {
  try {
    const cacheTimestamp = localStorage.getItem('dataTimestamp');
    if (!cacheTimestamp || isNaN(cacheTimestamp)) {
      return null;
    }

    // Check if cache is older than 24 hours
    const now = Date.now();
    if (now - parseInt(cacheTimestamp) > 24 * 60 * 60 * 1000) {
      clearCache();
      return null;
    }

    const cachedRegras = JSON.parse(localStorage.getItem('regrasDocumentos'));
    const cachedTipos = JSON.parse(localStorage.getItem('tiposDocumentos'));
    const cachedNormas = JSON.parse(localStorage.getItem('normasData'));

    if (!cachedRegras || !cachedTipos || !cachedNormas) {
      clearCache();
      return null;
    }

    return [cachedRegras, cachedTipos, cachedNormas];
  } catch (error) {
    console.error('Error reading cache:', error);
    clearCache();
    return null;
  }
}

/**
 * Caches the data in localStorage
 * @param {Array} data - Array containing [regras, tipos, normas]
 */
function cacheData(data) {
  try {
    localStorage.setItem('regrasDocumentos', JSON.stringify(data[0]));
    localStorage.setItem('tiposDocumentos', JSON.stringify(data[1]));
    localStorage.setItem('normasData', JSON.stringify(data[2]));
    localStorage.setItem('dataTimestamp', Date.now().toString());
  } catch (error) {
    console.error('Error caching data:', error);
    clearCache();
  }
}

/**
 * Clears all cached data
 */
function clearCache() {
  localStorage.removeItem('regrasDocumentos');
  localStorage.removeItem('tiposDocumentos');
  localStorage.removeItem('normasData');
  localStorage.removeItem('dataTimestamp');
}

/**
 * Inicializa a aplicação quando a página carrega
 */
document.addEventListener('DOMContentLoaded', async function() {
    await carregarRegras();
    
    setTimeout(() => {
        const form = document.getElementById('formDocumentos');
        if (form) {
            createResetButton();
            initializeFormValidation();
            initializeAutoSave();
            loadSavedData();
            
            // Inicializa o modal de CND
            const modalElement = document.getElementById('cndModal');
            if (modalElement) {
                cndModal = new bootstrap.Modal(modalElement);
            }

            // Gerencia troca de abas
            document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('shown.bs.tab', function (e) {
                    if (e.relatedTarget && e.relatedTarget.getAttribute('href') === '#checklists') {
                        const resultadoDiv = document.getElementById('resultado');
                        if (resultadoDiv) {
                            resultadoDiv.innerHTML = '';
                        }
                    }
                });
            });
        }
    }, 100);
});

// ============================================================================
// 3. FUNÇÕES DE MANIPULAÇÃO DE FORMULÁRIO
// ============================================================================

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formata um input para moeda brasileira (R$)
 * @param {HTMLInputElement} input - O elemento input a ser formatado
 */
function formatarMoeda(input) {
  // Remove any non-digit characters except comma
  let valor = input.value.replace(/[^\d,]/g, '').replace(',', '.');
  
  // If empty or invalid, clear the field
  if (!valor || isNaN(parseFloat(valor))) {
    input.value = '';
    return;
  }
  
  // Convert to number and format
  valor = (parseFloat(valor) / 100).toFixed(2);
  
  // Format to Brazilian currency
  valor = valor.replace('.', ',');
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  input.value = 'R$ ' + valor;
}

// Create debounced version of formatarMoeda
const formatarMoedaDebounced = debounce(formatarMoeda, 300);

/**
 * Obtém todos os valores do formulário
 * @returns {Object} Objeto com os valores dos campos
 */
function obterValoresFormulario() {
  const rendaValue = document.getElementById("renda").value;
  let rendaParsed = 0;
  if (rendaValue) {
    rendaParsed = parseFloat(
      rendaValue
        .replace("R$ ", "")
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  return {
    fonte: document.getElementById("fonte").value.toLowerCase(),
    cadin: document.getElementById("cadin").value.toLowerCase(),
    programa: document.getElementById("programa").value.toLowerCase(),
    porte: document.getElementById("porte").value.toLowerCase(),
    renda: rendaParsed,
    mao_de_obra: document.getElementById("mao_de_obra").value.toLowerCase(),
    comin: document.getElementById("comin").value.toLowerCase(),
    atualizacao: document.getElementById("atualizacao").value.toLowerCase(),
    finalidade: document.getElementById("finalidade").value.toLowerCase(),
    garantia_hipotecaria: document.getElementById("garantia_hipotecaria").value.toLowerCase(),
    conta_corrente: document.getElementById("conta_corrente").value.toLowerCase()
  };
}

// ============================================================================
// 4. FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Verifica se uma condição específica é atendida
 * @param {Object} condicao - A condição a ser verificada
 * @param {Object} valores - Os valores do formulário
 * @returns {boolean} true se a condição é atendida (documento NÃO é necessário)
 */
function verificarCondicao(condicao, valores) {
  console.log('Verificando condição:', condicao, 'com valores:', valores);
  
  for (const [campo, requisitos] of Object.entries(condicao)) {
    const valorCampo = valores[campo];
    console.log(`Verificando campo ${campo}:`, { requisitos, valorCampo });

    if (valorCampo === undefined || valorCampo === null) {
      console.log(`Campo ${campo} não existe ou é nulo - condição não atendida`);
      return false;
    }

    if (typeof requisitos === 'object' && !Array.isArray(requisitos)) {
      // Verifica condições numéricas
      if ('maximo' in requisitos && (isNaN(valorCampo) || valorCampo > requisitos.maximo)) {
        console.log(`Valor ${valorCampo} acima do limite ${requisitos.maximo}`);
        return false;
      }
      if ('minimo' in requisitos && (isNaN(valorCampo) || valorCampo < requisitos.minimo)) {
        console.log(`Valor ${valorCampo} abaixo do mínimo ${requisitos.minimo}`);
        return false;
      }
    } else if (Array.isArray(requisitos) && !requisitos.includes(valorCampo)) {
      console.log(`Valor ${valorCampo} não está na lista:`, requisitos);
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// 5. FUNÇÕES DE PERSISTÊNCIA (LocalStorage)
// ============================================================================

// Create and add reset button
function createResetButton() {
    const verifyButton = document.querySelector('.btn-verificar');
    if (!verifyButton) {
        console.error('Verify button not found');
        return null;
    }

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'btn btn-outline-secondary me-3';
    resetButton.innerHTML = '<i class="fas fa-undo me-2"></i>Limpar Formulário';
    
    resetButton.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar todos os campos?')) {
            const form = document.getElementById('formDocumentos');
            form.reset();
            localStorage.removeItem('formData');
            clearValidationStyles();
            
            // Clear results
            const resultadoDiv = document.getElementById('resultado');
            if (resultadoDiv) {
                resultadoDiv.innerHTML = '';
            }
            
            // Clear parameters
            const parametrosDiv = document.getElementById('parametros-consulta');
            if (parametrosDiv) {
                parametrosDiv.innerHTML = '';
            }
            
            // Reset renda field formatting
            const rendaField = document.getElementById('renda');
            if (rendaField) {
                rendaField.value = '';
            }
        }
    });

    const buttonContainer = verifyButton.parentElement;
    buttonContainer.insertBefore(resetButton, verifyButton);
    
    return resetButton;
}

// Initialize form validation
function initializeFormValidation() {
    const form = document.getElementById('formDocumentos');
    const fields = form.querySelectorAll('select, input');

    fields.forEach(field => {
        if (field.id === 'renda') {
            field.addEventListener('input', () => formatarMoedaDebounced(field));
        }
        field.addEventListener('change', () => validateField(field));
        field.addEventListener('blur', () => validateField(field));
    });
}

// Validate individual field
function validateField(field) {
    let isValid = true;
    const formGroup = field.closest('.form-group');
    const feedback = formGroup.querySelector('.invalid-feedback') || createFeedbackElement(formGroup);

    if (field.id === 'renda') {
        const valor = field.value.replace(/[^\d,]/g, '').replace(',', '.');
        isValid = valor !== '' && !isNaN(parseFloat(valor));
        if (!isValid) {
            feedback.textContent = 'Por favor, insira um valor válido';
        }
    } else {
        isValid = field.value.trim() !== '';
        if (!isValid) {
            feedback.textContent = 'Este campo é obrigatório';
        }
    }

    if (!isValid) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
    } else {
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
        feedback.textContent = '';
    }

    return isValid;
}

// Create feedback element for validation messages
function createFeedbackElement(formGroup) {
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    formGroup.appendChild(feedback);
    return feedback;
}

// Clear validation styles
function clearValidationStyles() {
    const form = document.getElementById('formDocumentos');
    const fields = form.querySelectorAll('.form-control, .form-select');
    fields.forEach(field => {
        field.classList.remove('is-valid', 'is-invalid');
        const feedback = field.closest('.form-group').querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    });
}

// Initialize auto-save functionality
function initializeAutoSave() {
    const form = document.getElementById('formDocumentos');
    const fields = form.querySelectorAll('select, input');
    
    fields.forEach(field => {
        field.addEventListener('change', () => saveFormData());
    });
}

// Save form data to localStorage
function saveFormData() {
    const form = document.getElementById('formDocumentos');
    const formData = {};
    
    form.querySelectorAll('select, input').forEach(field => {
        formData[field.id] = field.value;
    });
    
    localStorage.setItem('formData', JSON.stringify(formData));
    showSaveNotification();
}

// Load saved form data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
        const formData = JSON.parse(savedData);
        const form = document.getElementById('formDocumentos');
        
        Object.keys(formData).forEach(fieldId => {
            const field = form.querySelector(`#${fieldId}`);
            if (field) {
                field.value = formData[fieldId];
                validateField(field);
            }
        });
    }
}

// Show save notification
function showSaveNotification() {
    // Remove existing notification if present
    const existingNotification = document.querySelector('.save-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.innerHTML = '<i class="fas fa-check-circle me-2"></i>Dados salvos automaticamente';
    
    document.body.appendChild(notification);

    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Show error notification
function showErrorNotification(message) {
    const existingNotification = document.querySelector('.error-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================================================
// 6. FUNÇÕES DE UI/UX
// ============================================================================

// Function to show CND options modal
function showCNDOptions(urlPF, urlPJ) {
    try {
        currentCNDUrlPF = urlPF;
        currentCNDUrlPJ = urlPJ;
        
        // Initialize modal if not already initialized
        if (!cndModal) {
            const modalElement = document.getElementById('cndModal');
            if (modalElement) {
                cndModal = new bootstrap.Modal(modalElement);
            } else {
                console.error('Modal element not found');
                showErrorNotification('Erro ao abrir o modal. Por favor, tente novamente.');
                return;
            }
        }
        
        cndModal.show();
    } catch (error) {
        console.error('Error showing CND modal:', error);
        showErrorNotification('Erro ao abrir o modal. Por favor, tente novamente.');
    }
}

// Function to open selected CND link
function openCNDLink(type) {
    try {
        const url = type === 'pf' ? currentCNDUrlPF : currentCNDUrlPJ;
        if (!url) {
            throw new Error('URL not found for type: ' + type);
        }
        window.open(url, '_blank');
        if (cndModal) {
            cndModal.hide();
        }
    } catch (error) {
        console.error('Error opening CND link:', error);
        showErrorNotification('Erro ao abrir o link. Por favor, tente novamente.');
    }
}

// ============================================================================
// 7. FUNÇÕES DE IMPRESSÃO
// ============================================================================

// Função para imprimir documentos
window.imprimirDocumentos = function() {
  // First, find all required elements
  const resultado = document.getElementById('resultado');
  if (!resultado) {
    console.error('Elemento #resultado não encontrado');
    alert('Erro ao preparar impressão: elemento #resultado não encontrado');
    return;
  }

  const documentList = resultado.querySelector('.document-list');
  if (!documentList) {
    console.error('Elemento .document-list não encontrado');
    alert('Erro ao preparar impressão: elemento .document-list não encontrado');
    return;
  }
  
  if (!documentList.children.length) {
    alert('Por favor, verifique os documentos antes de imprimir.');
    return;
  }

  // Find print-specific elements
  const printHeader = document.getElementById('print-header');
  if (!printHeader) {
    console.error('Elemento #print-header não encontrado');
    alert('Erro ao preparar impressão: elemento #print-header não encontrado');
    return;
  }

  const parametrosDiv = document.getElementById('parametros-consulta');
  if (!parametrosDiv) {
    console.error('Elemento #parametros-consulta não encontrado');
    alert('Erro ao preparar impressão: elemento #parametros-consulta não encontrado');
    return;
  }

  try {
    // Clear any existing content in parametros-consulta
    parametrosDiv.innerHTML = '';
    
    // Show print header
    printHeader.style.display = 'block';
    
    // Get form values and create parameters summary
    const valores = obterValoresFormulario();
    const parametrosHTML = [];
    
    const labels = {
      fonte: 'Fonte',
      cadin: 'CADIN',
      programa: 'Programa',
      porte: 'Porte',
      renda: 'Renda',
      mao_de_obra: 'Emprego Mão de Obra',
      comin: 'COMIN',
      atualizacao: 'Atualização',
      finalidade: 'Finalidade',
      garantia_hipotecaria: 'Garantia Hipotecária',
      conta_corrente: 'Possui Conta Corrente'
    };

    for (const [key, value] of Object.entries(valores)) {
      if (value) {
        let displayValue = value;
        if (key === 'renda' && value > 0) {
          displayValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else if (typeof value === 'string') {
          displayValue = value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
        }
        parametrosHTML.push(`<strong>${labels[key]}:</strong> ${displayValue}`);
      }
    }

    // Add parameters to the div
    if (parametrosHTML.length > 0) {
      parametrosDiv.innerHTML = parametrosHTML.join(' | ');
    } else {
      parametrosDiv.innerHTML = '<em>Nenhum parâmetro selecionado</em>';
    }

    // Add current date to the print header
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataDiv = document.createElement('div');
    dataDiv.className = 'print-date';
    dataDiv.innerHTML = `<strong>Data da Consulta:</strong> ${dataAtual}`;
    parametrosDiv.appendChild(document.createElement('br'));
    parametrosDiv.appendChild(dataDiv);

    // Add print event listener to handle cleanup
    const cleanupAfterPrint = () => {
      printHeader.style.display = 'none';
      parametrosDiv.innerHTML = '';
      window.removeEventListener('afterprint', cleanupAfterPrint);
    };

    window.addEventListener('afterprint', cleanupAfterPrint);

    // Print the page
    window.print();

  } catch (error) {
    console.error('Erro ao preparar impressão:', error);
    alert('Ocorreu um erro ao preparar a impressão. Por favor, tente novamente.');
    printHeader.style.display = 'none';
    parametrosDiv.innerHTML = '';
  }
};

// ============================================================================
// 8. FUNÇÃO PRINCIPAL DE VERIFICAÇÃO
// ============================================================================

// Função principal para verificar documentos necessários
async function verificarDocumentos(event) {
  event.preventDefault();
  
  const form = document.getElementById('formDocumentos');
  const fields = form.querySelectorAll('select, input');
  let isValid = true;

  // Validate all fields
  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  if (!isValid) {
    return;
  }

  // Show loading state
  const button = document.querySelector('.btn-verificar');
  const resultadoDiv = document.getElementById('resultado');
  const originalText = button.innerHTML;
  
  try {
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
    button.disabled = true;
    resultadoDiv.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Verificando documentos necessários...</p>
      </div>
    `;

    // Ensure CND modal exists
    if (!document.getElementById('cndModal')) {
      const modal = document.createElement('div');
      modal.id = 'cndModal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Escolha o tipo de CND</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="d-grid gap-2">
                <button onclick="openCNDLink('pf')" class="btn btn-lg" style="background-color: var(--primary-color); color: white;">
                  <i class="fas fa-user me-2"></i> Pessoa Física
                </button>
                <button onclick="openCNDLink('pj')" class="btn btn-lg" style="background-color: var(--secondary-color); color: white;">
                  <i class="fas fa-building me-2"></i> Pessoa Jurídica
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Carregar regras se ainda não foram carregadas
    if (!regrasDocumentos || !tiposDocumentos) {
      await carregarRegras();
    }

    if (!regrasDocumentos || !regrasDocumentos.documentos || !tiposDocumentos || !tiposDocumentos.tipos_documentos) {
      throw new Error('Erro ao carregar as regras dos documentos. Por favor, verifique sua conexão e tente novamente.');
    }

    const valores = obterValoresFormulario();
    resultadoDiv.innerHTML = '<div class="document-list"></div>';
    const documentList = resultadoDiv.querySelector('.document-list');

    // Add error boundary for document processing
    try {
      for (const [docId, docInfo] of Object.entries(regrasDocumentos.documentos)) {
        let documentoNecessario = true;
        let regraAplicada = null;

        // Verificar todas as regras do documento
        for (const regra of docInfo.regras) {
          const regraAtende = verificarCondicao(regra.condicoes, valores);
          if (regraAtende) {
            documentoNecessario = false;
            regraAplicada = regra;
            break;
          }
        }

        if (documentoNecessario) {
          const docElement = document.createElement('div');
          docElement.className = 'document-item';
          
          const docContent = document.createElement('div');
          
          // Header com título e links
          const headerDiv = document.createElement('div');
          headerDiv.className = 'document-header';
          
          const titleDiv = document.createElement('div');
          
          const title = document.createElement('h3');
          title.className = 'document-title';
          title.textContent = docInfo.nome;
          titleDiv.appendChild(title);
          
          // Se o documento é necessário, mostramos sua descrição
          const docType = tiposDocumentos.tipos_documentos[docId];
          if (docType && docType.descricao) {
            const description = document.createElement('div');
            description.className = 'document-description';
            description.textContent = docType.descricao;
            titleDiv.appendChild(description);
          }
          
          headerDiv.appendChild(titleDiv);
          
          // Links section
          const linksDiv = document.createElement('div');
          linksDiv.style.display = 'flex';
          linksDiv.style.gap = '1rem';
          linksDiv.style.alignItems = 'flex-start';
          
          if (docId === 'CND') {
            const linkButton = document.createElement('button');
            linkButton.className = 'btn-link';
            linkButton.innerHTML = `<i class="fas fa-external-link-alt"></i> ${docType.link_text || 'Emitir Certidão'}`;
            linkButton.onclick = () => showCNDOptions(
              docType.modelo_url_pf || 'https://servicos.receita.fazenda.gov.br/Servicos/certidao/CNDConjuntaInter/InformaNICertidao.asp?tipo=2',
              docType.modelo_url_pj || 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir'
            );
            linksDiv.appendChild(linkButton);
          } else if (docType && docType.modelo_url) {
            const modeloLink = document.createElement('a');
            modeloLink.href = docType.modelo_url;
            modeloLink.className = 'document-link';
            modeloLink.target = '_blank';
            modeloLink.innerHTML = `<i class="fas fa-external-link-alt"></i> ${docType.link_text || 'Acessar modelo'}`;
            linksDiv.appendChild(modeloLink);
          }
          
          if (docType && docType.norma_url) {
            const normaLink = document.createElement('a');
            normaLink.href = docType.norma_url;
            normaLink.className = 'norma-link';
            normaLink.target = '_blank';
            normaLink.innerHTML = '<i class="fas fa-book"></i> Norma';
            linksDiv.appendChild(normaLink);
          }
          
          headerDiv.appendChild(linksDiv);
          docContent.appendChild(headerDiv);
          
          // Adicionar informações adicionais
          if (docType && docType.norma) {
            const normaDiv = document.createElement('div');
            normaDiv.className = 'document-norma';
            
            const normaIcon = document.createElement('i');
            normaIcon.className = 'fas fa-book';
            normaDiv.appendChild(normaIcon);
            
            const normaInfo = normasData?.normas?.[docType.norma];
            
            if (normaInfo) {
              const normaLink = document.createElement('a');
              normaLink.href = normaInfo.url;
              normaLink.target = '_blank';
              normaLink.className = 'norma-link';
              normaLink.textContent = `Norma ${docType.norma}`;
              
              if (normaInfo.titulo) {
                normaLink.title = normaInfo.titulo;
              }
              
              normaDiv.appendChild(normaLink);
            } else {
              const normaText = document.createElement('span');
              normaText.textContent = `Norma ${docType.norma}`;
              normaDiv.appendChild(normaText);
            }
            
            docContent.appendChild(normaDiv);
          }

          if (docType && docType.validade) {
            const validadeDiv = document.createElement('div');
            validadeDiv.className = 'document-validade';
            
            const validadeIcon = document.createElement('i');
            validadeIcon.className = 'fas fa-clock';
            validadeDiv.appendChild(validadeIcon);
            
            const validadeText = document.createElement('span');
            validadeText.textContent = `Validade: ${docType.validade}`;
            validadeDiv.appendChild(validadeText);
            
            docContent.appendChild(validadeDiv);
          }

          if (docType && docType.observacao) {
            const observacaoDiv = document.createElement('div');
            observacaoDiv.className = 'document-observacao';
            
            const observacaoIcon = document.createElement('i');
            observacaoIcon.className = 'fas fa-info-circle me-2';
            observacaoDiv.appendChild(observacaoIcon);
            
            const observacaoText = document.createElement('span');
            observacaoText.textContent = docType.observacao;
            observacaoDiv.appendChild(observacaoText);
            
            docContent.appendChild(observacaoDiv);
          }
          
          docElement.appendChild(docContent);
          documentList.appendChild(docElement);
        }
      }
    } catch (docError) {
      console.error('Erro ao processar documentos:', docError);
      throw new Error('Erro ao processar os documentos. Por favor, tente novamente.');
    }

    if (!documentList.hasChildNodes()) {
      resultadoDiv.innerHTML = '<div class="alert alert-info">Nenhum documento necessário para os critérios selecionados.</div>';
    }

  } catch (error) {
    console.error('Erro ao verificar documentos:', error);
    resultadoDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        ${error.message || 'Ocorreu um erro ao verificar os documentos. Por favor, tente novamente.'}
      </div>
    `;
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

/**
 * GUIA DE MANUTENÇÃO
 * 
 * Para adicionar um novo tipo de documento:
 * 1. Adicione o documento em data/document_types.json com suas propriedades
 * 2. Adicione as regras do documento em data/rules_matrix.json
 * 3. Se necessário, adicione a norma relacionada em data/normas.json
 * 
 * Para modificar a lógica de verificação:
 * 1. A função verificarCondicao() contém a lógica principal
 * 2. Cada documento pode ter múltiplas regras em rules_matrix.json
 * 3. Se TODAS as condições de uma regra são atendidas, o documento NÃO é necessário
 * 
 * Para modificar a aparência:
 * 1. Os estilos estão em css/styles.css
 * 2. A estrutura HTML está em index.html
 * 3. As classes CSS seguem um padrão BEM-like (Block Element Modifier)
 * 
 * Arquivos principais:
 * - index.html: Estrutura da página
 * - css/styles.css: Estilos
 * - js/script.js: Este arquivo (lógica principal)
 * - data/document_types.json: Tipos de documentos
 * - data/rules_matrix.json: Regras de verificação
 * - data/normas.json: Informações das normas
 */

