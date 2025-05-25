// Função para formatar moeda em Reais
function formatarMoeda(input) {
  let valor = input.value.replace(/\D/g, "");
  if (!valor) {
    input.value = "";
    return;
  }
  valor = (parseFloat(valor) / 100).toFixed(2);
  valor = valor.replace(".", ",");
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = "R$ " + valor;
}

// Variável global para armazenar as regras
let regrasDocumentos = null;
let tiposDocumentos = null;
let normasData = null;

// Função para carregar arquivo no ambiente Electron
async function loadFileInElectron(filepath) {
  try {
    const fs = window.require('fs');
    const path = window.require('path');
    const { app } = window.require('@electron/remote');
    
    // Try to load from resources first
    const resourcePath = process.env.NODE_ENV === 'development'
      ? path.join(app.getAppPath(), 'public', filepath)
      : path.join(process.resourcesPath, filepath.replace('data/', ''));
    
    console.log('Tentando carregar arquivo:', resourcePath);
    
    const data = await fs.promises.readFile(resourcePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler arquivo no Electron:', error);
    throw error;
  }
}

// Função para carregar arquivo via fetch (web)
async function loadFileInWeb(filepath) {
  const response = await fetch(filepath);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Carregar as regras do arquivo JSON
async function carregarRegras() {
  try {
    const isElectron = window?.require ? true : false;
    const loadFile = isElectron ? loadFileInElectron : loadFileInWeb;

    [regrasDocumentos, tiposDocumentos, normasData] = await Promise.all([
      loadFile('data/rules_matrix.json'),
      loadFile('data/document_types.json'),
      loadFile('data/normas.json')
    ]);

  } catch (erro) {
    console.error('Erro ao carregar os dados:', erro);
    showErrorNotification('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');
  }
}

// Função para obter os valores dos campos do formulário
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

// Função para verificar se uma condição específica é atendida
function verificarCondicao(condicao, valores) {
  console.log('Verificando condição:', condicao, 'com valores:', valores);
  
  // Se TODAS as condições forem atendidas, o documento NÃO é necessário
  for (const [campo, requisitos] of Object.entries(condicao)) {
    const valorCampo = valores[campo];
    console.log(`Verificando campo ${campo}:`, { requisitos, valorCampo });

    // Se o campo não existe nos valores ou é undefined/null, a condição não é atendida
    if (valorCampo === undefined || valorCampo === null) {
      console.log(`Campo ${campo} não existe ou é nulo - condição não atendida`);
      return false;
    }

    if (typeof requisitos === 'object' && !Array.isArray(requisitos)) {
      // Verificar condições numéricas (ex: renda máxima)
      if ('maximo' in requisitos) {
        if (isNaN(valorCampo) || valorCampo > requisitos.maximo) {
          console.log(`Valor ${valorCampo} acima do limite ${requisitos.maximo} - condição não atendida`);
          return false;
        }
      }
      if ('minimo' in requisitos) {
        if (isNaN(valorCampo) || valorCampo < requisitos.minimo) {
          console.log(`Valor ${valorCampo} abaixo do mínimo ${requisitos.minimo} - condição não atendida`);
          return false;
        }
      }
    } else if (Array.isArray(requisitos)) {
      // Se o valor NÃO está na lista de requisitos, a condição não é atendida
      if (!requisitos.includes(valorCampo)) {
        console.log(`Valor ${valorCampo} não está na lista de valores aceitos:`, requisitos);
        return false;
      }
    }
  }
  
  // Se todas as condições foram atendidas, o documento NÃO é necessário
  console.log('Todas as condições atendidas - documento NÃO é necessário!');
  return true;
}

// Global variables for CND URLs
let currentCNDUrlPF = '';
let currentCNDUrlPJ = '';
let cndModal = null;

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

// Initialize form validation and enhancements when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await carregarRegras();
    
    // Wait a short moment to ensure all elements are rendered
    setTimeout(() => {
        const form = document.getElementById('formDocumentos');
        if (form) {
            createResetButton();
            initializeFormValidation();
            initializeAutoSave();
            loadSavedData();
            
            // Initialize CND modal if it exists
            const modalElement = document.getElementById('cndModal');
            if (modalElement) {
                cndModal = new bootstrap.Modal(modalElement);
            }

            // Handle tab switching
            document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('shown.bs.tab', function (e) {
                    // Clear results when switching away from checklists tab
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
            document.getElementById('formDocumentos').reset();
            localStorage.removeItem('formData');
            clearValidationStyles();
            document.getElementById('resultado').innerHTML = '';
        }
    });

    // Add reset button next to verify button
    const buttonContainer = verifyButton.parentElement;
    buttonContainer.insertBefore(resetButton, verifyButton);
    
    return resetButton;
}

// Initialize form validation
function initializeFormValidation() {
    const form = document.getElementById('formDocumentos');
    const fields = form.querySelectorAll('select, input');

    fields.forEach(field => {
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
        const valor = field.value.replace(/\D/g, '');
        isValid = valor !== '';
    } else {
        isValid = field.value.trim() !== '';
    }

    if (!isValid) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        feedback.textContent = 'Este campo é obrigatório';
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

// Função principal para verificar documentos necessários
async function verificarDocumentos(event) {
  event.preventDefault();
  
  const form = document.getElementById('formDocumentos');
  const fields = form.querySelectorAll('select, input');
  let isValid = true;

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
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
  button.disabled = true;

  try {
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
      throw new Error('Erro ao carregar as regras dos documentos');
    }

    const valores = obterValoresFormulario();
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = '<div class="document-list"></div>';
    const documentList = resultadoDiv.querySelector('.document-list');

    for (const [docId, docInfo] of Object.entries(regrasDocumentos.documentos)) {
      let documentoNecessario = true;
      let regraAplicada = null;

      // Verificar todas as regras do documento
      for (const regra of docInfo.regras) {
        const regraAtende = verificarCondicao(regra.condicoes, valores);
        if (regraAtende) {
          documentoNecessario = false;
          regraAplicada = regra; // Guarda a regra que dispensou o documento
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
        
        // Se o documento é necessário, explicamos o motivo
        const description = document.createElement('div');
        description.className = 'document-description';
        description.textContent = 'Documento necessário para esta operação';
        titleDiv.appendChild(description);
        
        headerDiv.appendChild(titleDiv);
        
        // Links section
        const linksDiv = document.createElement('div');
        linksDiv.style.display = 'flex';
        linksDiv.style.gap = '1rem';
        linksDiv.style.alignItems = 'flex-start';
        
        const docType = tiposDocumentos.tipos_documentos[docId];
        
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

        // Add document description if available
        if (docType && docType.descricao) {
          const descricaoDiv = document.createElement('div');
          descricaoDiv.className = 'document-descricao';
          descricaoDiv.textContent = docType.descricao;
          docContent.appendChild(descricaoDiv);
        }

        // Add observation if available
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

    if (!documentList.hasChildNodes()) {
      resultadoDiv.innerHTML = '<div class="alert alert-info">Nenhum documento necessário para os critérios selecionados.</div>';
    }
  } catch (erro) {
    console.error('Erro ao verificar documentos:', erro);
    showErrorNotification('Ocorreu um erro ao verificar os documentos. Por favor, tente novamente.');
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

