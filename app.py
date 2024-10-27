# app.py

import os
import re
import json
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify, abort
from functools import wraps

app = Flask(__name__)

app.config.from_object('config.Config')

# Função para obter o api_access_token
def get_api_access_token(account_id):
    if app.config.get('MODE') == 'Test':
        return app.config.get('API_ACCESS_TOKEN')
    # Lógica para obter o token em produção
    return app.config.get('API_ACCESS_TOKEN')

def get_account_id():
    if app.config.get('MODE') == 'Test':
        return app.config.get('ACCOUNT_ID', '1')
    account_id = request.args.get('account_id')
    return account_id

def require_url_password(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if app.config.get('MODE') == 'Test':
            return f(*args, **kwargs)
        password = request.args.get('URL_PASSWORD')
        if not password or password != app.config['URL_PASSWORD']:
            return redirect(url_for('acesso_negado'))
        return f(*args, **kwargs)
    return decorated_function

def check_authorized_domain(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if app.config.get('MODE') == 'Test':
            return f(*args, **kwargs)
        authorized_domain = app.config.get('AUTHORIZED_DOMAIN')
        if not authorized_domain:
            app.logger.warning("AUTHORIZED_DOMAIN não está definido.")
            abort(403, description="Acesso não autorizado: domínio não configurado.")
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@require_url_password
@check_authorized_domain
def index():
    authorized_domain = app.config['AUTHORIZED_DOMAIN']
    mode = app.config.get('MODE', 'Production')
    context = {'authorized_domain': authorized_domain, 'mode': mode}
    if mode == 'Test':
        context.update({
            'account_id': app.config.get('ACCOUNT_ID', '1'),
            'inbox_id': app.config.get('INBOX_ID', '2'),
        })
    return render_template('index.html', **context)

@app.route('/acesso_negado')
def acesso_negado():
    return render_template('acesso_negado.html')

@app.route('/api/inboxes_labels', methods=['GET'])
def get_inboxes_labels():
    account_id = get_account_id()
    if not account_id:
        return jsonify({'error': 'account_id é obrigatório'}), 400

    api_access_token = get_api_access_token(account_id)
    if not api_access_token:
        return jsonify({'error': 'API access token não encontrado para este account_id'}), 400

    headers = {
        'Content-Type': 'application/json',
        'api_access_token': api_access_token
    }

    base_url = app.config['BASE_URL']

    # Obter caixas de entrada
    inboxes_response = requests.get(f'{base_url}/api/v1/accounts/{account_id}/inboxes', headers=headers)
    if inboxes_response.status_code != 200:
        return jsonify({'error': 'Erro ao obter as caixas de entrada'}), 500

    inboxes = inboxes_response.json()['payload']

    # Obter marcadores
    labels_response = requests.get(f'{base_url}/api/v1/accounts/{account_id}/labels', headers=headers)
    if labels_response.status_code != 200:
        return jsonify({'error': 'Erro ao obter os marcadores'}), 500

    labels = labels_response.json()['payload']

    return jsonify({'inboxes': inboxes, 'labels': labels})

# Rota para obter contatos por marcador
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    account_id = get_account_id()
    label_title = request.args.get('label_title')

    if not account_id or not label_title:
        return jsonify({'error': 'account_id e label_title são obrigatórios'}), 400

    api_access_token = get_api_access_token(account_id)
    if not api_access_token:
        return jsonify({'error': 'API access token não encontrado para este account_id'}), 400

    headers = {
        'Content-Type': 'application/json',
        'api_access_token': api_access_token
    }

    base_url = app.config['BASE_URL']

    # Obter conversas com o marcador
    conversations_response = requests.get(f'{base_url}/api/v1/accounts/{account_id}/conversations?labels={label_title}', headers=headers)
    if conversations_response.status_code != 200:
        return jsonify({'error': 'Erro ao obter as conversas'}), 500

    conversations = conversations_response.json().get('data', {}).get('payload', [])

    contacts = []
    for conversation in conversations:
        contact = conversation.get('meta', {}).get('sender', {})
        # Incluir conversation_id
        contact['conversation_id'] = conversation.get('id')
        contacts.append(contact)

    return jsonify({'contacts': contacts})

# Rota para enviar mensagem a um contato
@app.route('/api/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    account_id = data.get('account_id')
    conversation_id = data.get('conversation_id')
    message = data.get('message')

    if not account_id or not conversation_id or not message:
        return jsonify({'error': 'account_id, conversation_id e message são obrigatórios'}), 400

    api_access_token = get_api_access_token(account_id)
    if not api_access_token:
        return jsonify({'error': 'API access token não encontrado para este account_id'}), 400

    headers = {
        'Content-Type': 'application/json',
        'api_access_token': api_access_token
    }

    base_url = app.config['BASE_URL']

    # Enviar mensagem
    body = {
        'content': message,
        'message_type': 1,  # 1 para outgoing
        'private': False
    }

    send_message_response = requests.post(f'{base_url}/api/v1/accounts/{account_id}/conversations/{conversation_id}/messages', headers=headers, json=body)
    if send_message_response.status_code not in [200, 201]:
        return jsonify({'error': 'Erro ao enviar a mensagem'}), 500

    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
