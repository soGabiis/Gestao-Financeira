# 💰 Gestão Financeira

Aplicativo de controle financeiro pessoal para computador, desenvolvido com **Python (Flask)** no backend e **HTML, CSS, Bootstrap, JavaScript e JSON** no frontend. A ferramenta permite gerenciar **ganhos, gastos e investimentos**, com visualização gráfica e integração de dados em tempo real via **API Alpha Vantage**.

---

## 📌 Funcionalidades

- ✅ Cadastro e visualização de:
  - **Ganhos fixos e variáveis**
  - **Gastos por categoria**
  - **Investimentos com cotação atualizada**
- ✅ Armazenamento local dos dados em `JSON`
- ✅ Interface responsiva com **Bootstrap 5**
- ✅ Integração com a **API Alpha Vantage** para consulta de ações e FIIs
- ✅ Cálculo automático do saldo atual
- ✅ Gráfico de **pizza** mostrando proporção de gastos por categoria
- ✅ Alertas personalizados (ex: "Você gastou mais do que ganhou este mês")

---

## 📊 Páginas

| Página | Descrição |
|--------|-----------|
| `index.html` | Cards com resumo financeiro (ganhos, gastos, saldo e investimentos) |
| `gastos.html` | Cadastro, listagem e edição de gastos |
| `ganhos.html` | Cadastro, listagem e edição de ganhos |
| `investimentos.html` | Gerenciamento de ações e FIIs com valores em tempo real |
| `saldo.html` | Gráfico de pizza e alertas personalizados |

---

## 🚧 Funcionalidades futuras

- [ ] Gráfico de **barras comparando últimos 6 meses**
- [ ] **Simulador de juros compostos**
- [ ] Sistema de **login e cadastro de usuário**
- [ ] Migração para banco de dados (SQLite, PostgreSQL etc.)
- [ ] Dark Mode

---

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Python 3, Flask
- **Persistência**: JSON local
- **Gráficos**: Chart.js
- **API**: [Alpha Vantage](https://www.alphavantage.co/)

---

## 📦 Como executar o projeto localmente

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/gestao-financeira.git
cd gestao-financeira
```

2. **Crie e ative um ambiente virtual (opcional)**
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure sua chave da API Alpha Vantage**
- No arquivo `cotacao.js`, substitua `YOUR_API_KEY` pela sua chave pessoal gratuita disponível em [https://www.alphavantage.co/](https://www.alphavantage.co/).

5. **Execute a aplicação**
```bash
python app.py
```

6. Acesse no navegador: `http://localhost:5000`

---

## 📁 Estrutura do projeto

```
gestao-financeira/
├── app.py
├── requirements.txt
├── data/
│   └── dados.json
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── investimentos.js
│       └── cotacao.js
├── templates/
│   ├── index.html
│   ├── ganhos.html
│   ├── gastos.html
│   ├── investimentos.html
│   └── saldo.html
```

---

## 🧠 Créditos

Projeto desenvolvido por Gabriel Souza como parte de um projeto de estudos e portfólio pessoal.
