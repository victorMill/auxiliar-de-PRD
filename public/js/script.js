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

// Carregar as regras do arquivo JSON
async function carregarRegras() {
  try {
    const [respostaRegras, respostaTipos] = await Promise.all([
      fetch('/data/rules_matrix.json'),
      fetch('/data/document_types.json')
    ]);

    if (!respostaRegras.ok || !respostaTipos.ok) {
      throw new Error('Erro ao carregar os dados');
    }

    regrasDocumentos = await respostaRegras.json();
    tiposDocumentos = await respostaTipos.json();
  } catch (erro) {
    console.error('Erro ao carregar os dados:', erro);
    showErrorNotification('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');
  }
}

// Função para obter os valores dos campos do formulário
function obterValoresFormulario() {
  return {
    fonte: document.getElementById("fonte").value.toLowerCase(),
    cadin: document.getElementById("cadin").value.toLowerCase(),
    programa: document.getElementById("programa").value.toLowerCase(),
    porte: document.getElementById("porte").value.toLowerCase(),
    renda: parseFloat(
      document
        .getElementById("renda")
        .value.replace("R$ ", "")
        .replace(/\./g, "")
        .replace(",", ".")
    ),
    mao_de_obra: document.getElementById("mao_de_obra").value.toLowerCase(),
    comin: document.getElementById("comin").value.toLowerCase(),
    atualizacao: document.getElementById("atualizacao").value.toLowerCase(),
    finalidade: document.getElementById("finalidade").value.toLowerCase(),
    garantia_real: document.getElementById("garantia_real").value.toLowerCase(),
    conta_corrente: document.getElementById("conta_corrente").value.toLowerCase()
  };
}

// Função para verificar se uma condição específica é atendida
function verificarCondicao(condicao, valores) {
  console.log('Verificando condição:', condicao, 'com valores:', valores);
  
  // Se alguma condição NÃO for atendida, o documento é necessário
  for (const [campo, requisitos] of Object.entries(condicao)) {
    const valorCampo = valores[campo];
    console.log(`Verificando campo ${campo}:`, { requisitos, valorCampo });

    // Se o campo não existe nos valores ou é undefined/null, o documento é necessário
    if (valorCampo === undefined || valorCampo === null) {
      console.log(`Campo ${campo} não existe ou é nulo - documento necessário`);
      return true;
    }

    if (typeof requisitos === 'object' && !Array.isArray(requisitos)) {
      // Verificar condições numéricas (ex: renda máxima)
      if ('maximo' in requisitos && (!isNaN(valorCampo) && valorCampo <= requisitos.maximo)) {
        console.log(`Valor ${valorCampo} dentro do limite ${requisitos.maximo} - documento não necessário`);
        return false;
      }
      if ('minimo' in requisitos && (!isNaN(valorCampo) && valorCampo >= requisitos.minimo)) {
        console.log(`Valor ${valorCampo} acima do mínimo ${requisitos.minimo} - documento não necessário`);
        return false;
      }
    } else if (Array.isArray(requisitos)) {
      // Se o valor está na lista de requisitos, o documento NÃO é necessário
      if (requisitos.includes(valorCampo)) {
        console.log(`Valor ${valorCampo} está na lista de dispensas:`, requisitos);
        return false;
      }
    }
  }
  
  // Se todas as condições foram verificadas e nenhuma retornou false,
  // significa que o documento é necessário
  console.log('Nenhuma condição de dispensa atendida - documento necessário!');
  return true;
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
    // Prevent form submission
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
        showErrorNotification('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Show loading state
    const button = document.querySelector('.btn-verificar');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
    button.disabled = true;

    try {
        // Carregar regras se ainda não foram carregadas
        if (!regrasDocumentos) {
            await carregarRegras();
        }

        if (!regrasDocumentos || !regrasDocumentos.documentos) {
            throw new Error('Erro ao carregar as regras dos documentos');
        }

        const valores = obterValoresFormulario();
        console.log('Valores do formulário:', valores);
        
        // Validar valores obrigatórios
        if (isNaN(valores.renda)) {
            valores.renda = 0;
        }

        const documentosNecessarios = [];

        // Verificar cada documento e suas regras
        for (const [codigoDoc, documento] of Object.entries(regrasDocumentos.documentos)) {
            console.log(`\nVerificando documento ${codigoDoc}:`, documento);
            
            if (!documento.regras || !Array.isArray(documento.regras)) {
                console.error(`Regras inválidas para o documento ${codigoDoc}`);
                continue;
            }

            for (const regra of documento.regras) {
                console.log(`\nVerificando regra:`, regra);
                
                if (!regra.condicoes) {
                    console.error(`Condições não definidas para regra em ${codigoDoc}`);
                    continue;
                }

                if (verificarCondicao(regra.condicoes, valores)) {
                    const docInfo = tiposDocumentos.tipos_documentos[codigoDoc];
                    documentosNecessarios.push({
                        nome: documento.nome,
                        descricao: regra.descricao,
                        norma: docInfo.norma,
                        norma_url: docInfo.norma_url,
                        validade: docInfo.validade,
                        modelo_url_pf: docInfo.modelo_url_pf,
                        modelo_url_pj: docInfo.modelo_url_pj,
                        modelo_url: docInfo.modelo_url,
                        isCND: codigoDoc === 'CND'
                    });
                    break;
                }
            }
        }

        // Exibir resultados
        const resultadoDiv = document.getElementById("resultado");
        if (documentosNecessarios.length > 0) {
            resultadoDiv.innerHTML = `
                <h3>Documentos Necessários:</h3>
                <ul class="document-list">
                    ${documentosNecessarios.map(doc => `
                        <li class="document-item">
                            <div class="document-header">
                                <strong>${doc.nome}</strong>
                                ${doc.isCND ? `
                                    <button onclick="showCNDOptions('${doc.modelo_url_pf}', '${doc.modelo_url_pj}')" class="document-link btn-link">
                                        <i class="fas fa-external-link-alt"></i> Emitir CND
                                    </button>
                                ` : doc.modelo_url ? `
                                    <a href="${doc.modelo_url}" target="_blank" class="document-link">
                                        <i class="fas fa-external-link-alt"></i> Acessar modelo/serviço
                                    </a>
                                ` : ''}
                            </div>
                            <br>
                            <small class="document-reason">Motivo: ${doc.descricao}</small>
                            ${doc.norma ? `
                                <br>
                                <small class="document-norma">
                                    Norma: ${doc.norma}
                                    ${doc.norma_url ? `
                                        <a href="${doc.norma_url}" target="_blank" class="norma-link">
                                            <i class="fas fa-book"></i>
                                        </a>
                                    ` : ''}
                                </small>
                            ` : ''}
                            <br>
                            <small class="document-validade">Validade: ${doc.validade}</small>
                        </li>
                    `).join("")}
                </ul>
            `;

            // Add modal to the page if it doesn't exist
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
        } else {
            resultadoDiv.innerHTML = "<p>Nenhum documento necessário para as condições informadas.</p>";
        }
    } catch (erro) {
        console.error('Erro ao verificar documentos:', erro);
        showErrorNotification('Ocorreu um erro ao verificar os documentos. Por favor, tente novamente.');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Global variables for CND URLs
let currentCNDUrlPF = '';
let currentCNDUrlPJ = '';
let cndModal = null;

// Function to show CND options modal
function showCNDOptions(urlPF, urlPJ) {
    currentCNDUrlPF = urlPF;
    currentCNDUrlPJ = urlPJ;
    
    // Initialize modal if not already initialized
    if (!cndModal) {
        cndModal = new bootstrap.Modal(document.getElementById('cndModal'));
    }
    cndModal.show();
}

// Function to open selected CND link
function openCNDLink(type) {
    const url = type === 'pf' ? currentCNDUrlPF : currentCNDUrlPJ;
    window.open(url, '_blank');
    if (cndModal) {
        cndModal.hide();
    }
}

