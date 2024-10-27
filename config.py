# config.py

import os
import re
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    URL_PASSWORD = os.getenv('URL_PASSWORD')
    API_ACCESS_TOKEN = os.getenv('API_ACCESS_TOKEN')
    AUTHORIZED_DOMAIN = os.getenv('AUTHORIZED_DOMAIN')
    MODE = os.getenv('MODE', 'Production')  # Default para 'Production' se não definido

    if MODE == 'Test':
        # Variáveis fixas para teste
        AUTHORIZED_DOMAIN = 'app.huchat.com.br'
        API_ACCESS_TOKEN = 'aSeKZMuuNknEf1yqUsFKPHwF'
        ACCOUNT_ID = '1'
        INBOX_ID = '2'
    else:
        # Validar AUTHORIZED_DOMAIN
        @staticmethod
        def validar_dominio(dominio):
            if not dominio:
                raise ValueError("AUTHORIZED_DOMAIN não pode ser vazio")
            dominio = dominio.strip()
            dominio = re.sub(r'^https?://', '', dominio)
            dominio = re.sub(r'/.*$', '', dominio)
            padrao = r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(padrao, dominio):
                raise ValueError(f"AUTHORIZED_DOMAIN inválido: {dominio}")
            return dominio

        AUTHORIZED_DOMAIN = validar_dominio.__func__(AUTHORIZED_DOMAIN)

    BASE_URL = f"https://{AUTHORIZED_DOMAIN}"
