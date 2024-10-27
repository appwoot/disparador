// script.js

let accountId;
let isTestMode = window.MODE === 'Test';
let isSending = false;  // Flag para controlar o envio
let sendMessagesTimeout;  // Variável para o timeout
let cancelSending = false;  // Flag para cancelar o envio

if (isTestMode) {
    // Usar o account_id fixo no modo de teste
    accountId = window.ACCOUNT_ID || '1';
    fetchInboxesAndLabels();
} else {
    // Listener para eventos do Chatwoot apenas no modo de produção
    window.addEventListener("message", function(event) {
        if (!isJSONValid(event.data)) {
            console.warn("Dados recebidos não são JSON válidos.");
            return;
        }

        let eventData;
        try {
            eventData = JSON.parse(event.data);
        } catch (e) {
            console.error("Erro ao parsear o JSON recebido:", e);
            return;
        }

        if (eventData && eventData.data && eventData.data.conversation) {
            const conversation = eventData.data.conversation;
            accountId = conversation.account_id;
            if (!accountId) {
                console.error('Account ID não encontrado nos dados do evento.');
                return;
            }

            // Verificar o domínio autorizado com o domínio do thumbnail
            if (conversation.meta && conversation.meta.sender) {
                const thumbnail = conversation.meta.sender.thumbnail;
                if (thumbnail) {
                    const thumbnailUrl = new URL(thumbnail);
                    const thumbnailDomain = thumbnailUrl.hostname;

                    // Comparar com AUTHORIZED_DOMAIN
                    if (thumbnailDomain !== window.AUTHORIZED_DOMAIN) {
                        console.warn("Domínio não autorizado. Acesso negado.");
                        window.location.href = '/acesso_negado';
                        return;
                    }
                } else {
                    console.warn("Thumbnail não encontrado.");
                    window.location.href = '/acesso_negado';
                    return;
                }
            } else {
                console.warn("Dados do sender não encontrados.");
                window.location.href = '/acesso_negado';
                return;
            }

            // Obter as caixas de entrada e marcadores
            fetchInboxesAndLabels();
        }
    });
}

// Função para validar JSON
function isJSONValid(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Funções para buscar dados das caixas de entrada e marcadores
function fetchInboxesAndLabels() {
    if (!accountId) {
        console.error('Account ID não definido.');
        return;
    }

    fetch(`/api/inboxes_labels?account_id=${accountId}`)
        .then(response => response.json())
        .then(data => {
            populateInboxes(data.inboxes);
            populateLabels(data.labels);
        })
        .catch(error => {
            console.error('Erro ao obter as caixas de entrada e marcadores:', error);
        });
}

// Funções para popular as opções de inboxes e labels
function populateInboxes(inboxes) {
    const inboxSelect = document.getElementById('inbox');
    inboxSelect.innerHTML = '<option value="">Selecione uma caixa de entrada</option>';
    inboxes.forEach(inbox => {
        const option = document.createElement('option');
        option.value = inbox.id;
        option.textContent = inbox.name;
        inboxSelect.appendChild(option);
    });
}

function populateLabels(labels) {
    const tagSelect = document.getElementById('tag');
    tagSelect.innerHTML = '<option value="">Selecione um marcador</option>';
    labels.forEach(label => {
        const option = document.createElement('option');
        option.value = label.title;
        option.classList.add('select-option');

        const colorDot = document.createElement('span');
        colorDot.classList.add('color-dot');
        colorDot.style.backgroundColor = label.color || '#000';

        const labelText = document.createElement('span');
        labelText.textContent = label.title;

        // Limpar o conteúdo padrão do option
        option.textContent = '';

        // Adicionar a bolinha e o texto ao option
        option.appendChild(colorDot);
        option.appendChild(labelText);

        tagSelect.appendChild(option);
    });
}

// Listeners para mudanças nos campos de seleção
document.getElementById('inbox').addEventListener('change', function() {
    checkFormAndFetchContacts();
});

document.getElementById('tag').addEventListener('change', function() {
    checkFormAndFetchContacts();
});

function checkFormAndFetchContacts() {
    const inbox = document.getElementById('inbox').value;
    const tag = document.getElementById('tag').value;

    if (inbox && tag && accountId) {
        fetchContacts(tag);
    }
}

// Função para obter contatos
function fetchContacts(labelTitle) {
    fetch(`/api/contacts?account_id=${accountId}&label_title=${encodeURIComponent(labelTitle)}`)
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => {
            console.error('Erro ao obter os contatos:', error);
        });
}

document.getElementById('mass-message-form').addEventListener('submit', function(event) {
    event.preventDefault();

    if (isSending) {
        alert('O envio já está em andamento.');
        return;
    }

    const inbox = document.getElementById('inbox').value;
    const tag = document.getElementById('tag').value;
    const message = document.getElementById('message').value;
    const intervaloMinimo = parseInt(document.getElementById('intervalo-minimo').value);
    const intervaloMaximo = parseInt(document.getElementById('intervalo-maximo').value);

    if (!inbox || !tag || !message || isNaN(intervaloMinimo) || isNaN(intervaloMaximo)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    if (intervaloMinimo > intervaloMaximo) {
        alert('O intervalo mínimo não pode ser maior que o máximo.');
        return;
    }

    startSendingMessages(inbox, tag, message, intervaloMinimo, intervaloMaximo);
});

// Função para iniciar o envio das mensagens
function startSendingMessages(inboxId, labelTitle, messageContent, minInterval, maxInterval) {
    // Obter os contatos novamente
    fetch(`/api/contacts?account_id=${accountId}&label_title=${encodeURIComponent(labelTitle)}`)
        .then(response => response.json())
        .then(data => {
            const contacts = data.contacts;
            const totalContacts = contacts.length;
            let sentMessages = 0;

            isSending = true;
            cancelSending = false;

            const sendMessageRecursive = function(index) {
                if (cancelSending || index >= contacts.length) {
                    isSending = false;
                    if (cancelSending) {
                        appendLog('Envio cancelado pelo usuário.');
                    } else {
                        appendLog('Envio concluído.');
                    }
                    return;
                }

                const contact = contacts[index];

                sendMessageToContact(contact, messageContent)
                    .then(() => {
                        sentMessages++;
                        updateSentMessages(sentMessages);
                        updateSuccessRate(sentMessages, totalContacts);
                        appendLog(`Mensagem enviada para ${contact.name || contact.email || contact.phone_number}`);
                    })
                    .catch(error => {
                        appendLog(`Erro ao enviar mensagem para ${contact.name || contact.email || contact.phone_number}: ${error}`);
                    })
                    .finally(() => {
                        const randomInterval = getRandomInterval(minInterval, maxInterval) * 1000; // Converter para milissegundos
                        sendMessagesTimeout = setTimeout(() => {
                            sendMessageRecursive(index + 1);
                        }, randomInterval);
                    });
            };

            sendMessageRecursive(0);
        })
        .catch(error => {
            console.error('Erro ao obter os contatos:', error);
        });
}

// Função para cancelar o envio
document.getElementById('cancel-button').addEventListener('click', function() {
    if (isSending) {
        cancelSending = true;
        clearTimeout(sendMessagesTimeout);
    } else {
        alert('Nenhum envio em andamento para ser cancelado.');
    }
});

// Função para gerar um intervalo aleatório entre min e max
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para enviar mensagem a um contato
function sendMessageToContact(contact, messageContent) {
    return new Promise((resolve, reject) => {
        const conversationId = contact.conversation_id;
        if (!conversationId) {
            reject('conversation_id não encontrado para o contato');
            return;
        }

        const body = {
            account_id: accountId,
            conversation_id: conversationId,
            message: messageContent
        };

        fetch(`/api/send_message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => {
            if (response.ok) {
                resolve();
            } else {
                response.text().then(text => {
                    reject(text);
                });
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}


// Função para adicionar logs
function appendLog(message) {
    const logArea = document.getElementById('log');
    logArea.innerHTML += `${message}<br>`;
    logArea.scrollTop = logArea.scrollHeight;
}

// Função para limpar o log
function clearLog() {
    const logArea = document.getElementById('log');
    logArea.innerHTML = '';
}
