from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

CAMINHO_DADOS = 'data/dados.json'

# Inicializa o arquivo de dados, se necessário, e garante chaves
def carregar_dados():
    if not os.path.exists(CAMINHO_DADOS):
        dados_iniciais = {
            "ganhos": [],
            "investimentos": [],
            "gastos": [],
            "fixos": {"ganhos": 0, "gastos": 0}
        }
        salvar_dados(dados_iniciais)
    with open(CAMINHO_DADOS, 'r', encoding='utf-8') as f:
        dados = json.load(f)
    # Garante chaves essenciais
    if "ganhos" not in dados:
        dados["ganhos"] = []
    if "investimentos" not in dados:
        dados["investimentos"] = []
    if "gastos" not in dados:
        dados["gastos"] = []
    if "fixos" not in dados:
        dados["fixos"] = {"ganhos": 0, "gastos": 0}
    return dados

def salvar_dados(dados):
    with open(CAMINHO_DADOS, 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

# Rotas das páginas
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ganhos')
def ganhos():
    return render_template('ganhos.html')

@app.route('/gastos')
def gastos():
    return render_template('gastos.html')

@app.route('/investimentos')
def investimentos():
    return render_template('investimentos.html')

@app.route('/saldo')
def saldo():
    return render_template('saldo.html')


# API para pegar todos os dados
@app.route('/api/dados')
def dados():
    dados = carregar_dados()
    return jsonify(dados)

# API Ganhos
@app.route('/api/adicionar_ganho', methods=['POST'])
def adicionar_ganho():
    dados = carregar_dados()
    novo = request.get_json()

    nome = novo.get('nome', '').strip()
    valor = novo.get('valor')
    data = novo.get('data') or datetime.today().strftime('%Y-%m-%d')

    if not nome or valor is None:
        return jsonify({"status": "erro", "mensagem": "Campos obrigatórios faltando"}), 400

    if "ganhos" not in dados:
        dados["ganhos"] = []

    dados['ganhos'].append({
        "nome": nome,
        "valor": valor,
        "data": data
    })
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['ganhos']})

@app.route('/api/remover_ganho', methods=['POST'])
def remover_ganho():
    dados = carregar_dados()
    payload = request.get_json()
    nome = payload.get('nome', '').strip()
    data = payload.get('data')

    if not nome or not data:
        return jsonify({"status": "erro", "mensagem": "Nome e data são obrigatórios"}), 400

    dados['ganhos'] = [g for g in dados.get('ganhos', []) if not (g['nome'] == nome and g['data'] == data)]
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['ganhos']})

# API Investimentos
@app.route('/api/adicionar_investimento', methods=['POST'])
def adicionar_investimento():
    dados = carregar_dados()
    novo = request.get_json()

    nome = novo.get('nome', '').upper()
    tipo = novo.get('tipo')
    quantidade = novo.get('quantidade')
    valor = novo.get('valor')
    data = novo.get('data') or datetime.today().strftime('%Y-%m-%d')

    if not nome or not tipo or quantidade is None or valor is None:
        return jsonify({"status": "erro", "mensagem": "Campos obrigatórios faltando"}), 400

    encontrado = False
    for inv in dados['investimentos']:
        if inv['nome'] == nome and inv['tipo'] == tipo:
            inv['quantidade'] += quantidade
            inv['valor'] += valor
            inv['data'] = data
            encontrado = True
            break

    if not encontrado:
        dados['investimentos'].append({
            "nome": nome,
            "tipo": tipo,
            "quantidade": quantidade,
            "valor": valor,
            "data": data
        })

    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['investimentos']})

@app.route('/api/remover_investimento', methods=['POST'])
def remover_investimento():
    dados = carregar_dados()
    payload = request.get_json()
    nome = payload.get('nome', '').upper()
    tipo = payload.get('tipo')

    if not nome or not tipo:
        return jsonify({"status": "erro", "mensagem": "Nome e tipo são obrigatórios"}), 400

    dados['investimentos'] = [inv for inv in dados['investimentos'] if not (inv['nome'] == nome and inv['tipo'] == tipo)]
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['investimentos']})

# API Gastos
@app.route('/api/adicionar_gasto', methods=['POST'])
def adicionar_gasto():
    dados = carregar_dados()
    novo = request.get_json()

    nome = novo.get('nome', '').strip()
    valor = novo.get('valor')
    data = novo.get('data') or datetime.today().strftime('%Y-%m-%d')

    if not nome or valor is None:
        return jsonify({"status": "erro", "mensagem": "Campos obrigatórios faltando"}), 400

    dados['gastos'].append({
        "nome": nome,
        "valor": valor,
        "data": data
    })
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['gastos']})

@app.route('/api/atualizar_gasto', methods=['POST'])
def atualizar_gasto():
    dados = carregar_dados()
    payload = request.get_json()

    nome = payload.get('nome', '').strip()
    valor = payload.get('valor')

    if not nome or valor is None:
        return jsonify({"status": "erro", "mensagem": "Campos obrigatórios faltando"}), 400

    for g in dados['gastos']:
        if g['nome'].lower() == nome.lower():
            g['valor'] = valor
            salvar_dados(dados)
            return jsonify({"status": "sucesso", "dados": dados['gastos']})

    return jsonify({"status": "erro", "mensagem": "Gasto não encontrado"}), 404

@app.route('/api/remover_gasto', methods=['POST'])
def remover_gasto():
    dados = carregar_dados()
    payload = request.get_json()
    nome = payload.get('nome', '').strip()
    data = payload.get('data')

    if not nome or not data:
        return jsonify({"status": "erro", "mensagem": "Nome e data são obrigatórios"}), 400

    dados['gastos'] = [g for g in dados['gastos'] if not (g['nome'] == nome and g['data'] == data)]
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['gastos']})

@app.route('/api/atualizar_gastos', methods=['POST'])
def atualizar_gastos():
    dados = carregar_dados()
    payload = request.get_json()
    novos_gastos = payload.get('dados')

    if not isinstance(novos_gastos, list):
        return jsonify({"status": "erro", "mensagem": "Formato inválido para gastos"}), 400

    dados['gastos'] = novos_gastos
    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['gastos']})

# API Fixos
@app.route('/api/atualizar_fixos', methods=['POST'])
def atualizar_fixos():
    dados = carregar_dados()
    payload = request.get_json()

    ganhos = payload.get('ganhos')
    gastos = payload.get('gastos')

    if ganhos is None or gastos is None:
        return jsonify({"status": "erro", "mensagem": "Campos obrigatórios faltando"}), 400

    dados['fixos']['ganhos'] = ganhos
    dados['fixos']['gastos'] = gastos

    salvar_dados(dados)
    return jsonify({"status": "sucesso", "dados": dados['fixos']})

if __name__ == '__main__':
    app.run(debug=True)
