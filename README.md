# Disparador de Mensagens para Chatwoot

![{469C4475-6ABB-4332-B01D-00351A87502B}](https://github.com/user-attachments/assets/ea8cfe7d-8b33-4dc6-9bf2-456606b14763)

Este é um projeto simplificado de disparo de mensagens em massa, desenvolvido para integração direta com o Chatwoot via Dashboard App e implementado para rodar de forma leve e eficiente. Essa versão é oferecida gratuitamente, permitindo o envio de mensagens para múltiplos contatos de uma vez, definindo um intervalo personalizado entre cada envio.

## Recursos

- **Envio em Massa**: Configure mensagens para serem enviadas a múltiplos contatos em uma única ação.
- **Intervalo Personalizado**: Defina o intervalo mínimo e máximo, em segundos, para que o envio de cada mensagem ocorra de forma randomizada.
- **Integração Direta com Chatwoot**: O projeto é integrado com o Chatwoot, bastando apenas fornecer a URL da sua aplicação e o token de acesso.

## Como Funciona

O disparador usa variáveis pré-configuradas para o `account_id`, `inbox_id` e `api_access_token`, permitindo o envio direto de mensagens ao Chatwoot sem a necessidade de configuração complexa.

### Modo de Teste

Este projeto possui um **Modo de Teste** que, quando ativado, usa valores padrão para `account_id`, `inbox_id`, e `api_access_token`, facilitando a configuração e o desenvolvimento local. Para habilitar o Modo de Teste, basta definir a variável `MODE=Test` no arquivo `.env`.

## Pré-requisitos

- Python 3.9+
- Flask e dependências (instaladas automaticamente com os requisitos)
- Conta no Chatwoot com acesso API
- Configuração das variáveis `.env` como descrito abaixo

## Instalação e Configuração

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/appwoot/disparador.git
   cd disparador
   ```

2. **Crie um ambiente virtual e instale as dependências:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Ativar ambiente virtual
   pip install -r requirements.txt
   ```

3. **Configuração do .env:**

   Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis de configuração:

   ```plaintext
   ACCESS_TOKEN=seu_token_de_acesso_chatwoot
   AUTHORIZED_DOMAIN=dominio.autorizado.com.br
   MODE=Test
   ```

4. **Execute o servidor:**

   ```bash
   flask run
   ```

   O servidor estará disponível em `http://localhost:5000`.

## Estrutura do Projeto

- `app.py`: Inicializa o aplicativo Flask e define as rotas principais.
- `config.py`: Configurações de ambiente e validações.
- `static/css/style.css`: Estilos do projeto.
- `static/js/script.js`: Script de manipulação da interface e de controle do envio de mensagens.
- `templates/index.html`: Página principal do disparador de mensagens.

## Integração com o Chatwoot

Para usar o disparador no Chatwoot, insira a URL do projeto diretamente no Chatwoot como uma aplicação externa, permitindo o acesso direto ao disparador a partir da interface de suporte.

## Kanban App para Chatwoot

Esse projeto pode funcionar muito bem em conjunto com o **Dashboard App Kanban**, uma solução visual de gerenciamento de tarefas desenvolvida para ser incorporada ao Chatwoot, permitindo um acompanhamento visual e detalhado de cada cliente e tarefa. Acesse o **[Kanban App](https://appwoot.com/kanban-app/)** para mais informações.

![appwoot-kanban](https://github.com/user-attachments/assets/e2392902-836c-44ce-a175-216b9769e1f4)

![tags-appwoot (1)](https://github.com/user-attachments/assets/c8e9fc34-0f58-4b0e-b90e-bb56e2c6ee48)
