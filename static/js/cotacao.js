const API_KEY = '7X59MZVIQDZODHJ7';
const API_URL = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=';

export async function buscarCotacao(ticker, spinnerElement, resultadoElement) {
  resultadoElement.innerHTML = "";
  spinnerElement.classList.remove("d-none");

  let symbol = ticker.toUpperCase();
  if (!symbol.endsWith(".SA")) {
    symbol += ".SA";
  }

  try {
    const response = await fetch(`${API_URL}${symbol}&apikey=${API_KEY}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    const globalQuote = data["Global Quote"];
    if (!globalQuote || Object.keys(globalQuote).length === 0) {
      throw new Error("Ticker não encontrado na API");
    }

    const valorStr = globalQuote["05. price"];
    const variacaoStr = globalQuote["10. change percent"];

    const valor = parseFloat(valorStr);
    const variacao = variacaoStr ? variacaoStr.trim() : "0%";

    if (isNaN(valor)) {
      throw new Error("Cotação inválida recebida");
    }

    resultadoElement.innerHTML = `
      <span>Valor: R$ ${valor.toFixed(2)}</span>
      <br/>
      <span style="color:${variacao.startsWith("-") ? "red" : "green"}">Variação: ${variacao}</span>
    `;

    return { valor, variacao };
  } catch (error) {
    console.error("Erro ao buscar cotação:", error);
    resultadoElement.innerHTML = `<span class="text-danger">Erro: ${error.message}</span>`;
    return null;
  } finally {
    spinnerElement.classList.add("d-none");
  }
}

// Nova função para atualizar várias cotações sem spinner/resultado
export async function atualizarCotacoesAutomatica(investimentos) {
  const resultados = [];

  for (const inv of investimentos) {
    let symbol = inv.nome.toUpperCase();
    if (!symbol.endsWith(".SA")) {
      symbol += ".SA";
    }

    try {
      const response = await fetch(`${API_URL}${symbol}&apikey=${API_KEY}`);

      if (!response.ok) {
        console.warn(`Erro HTTP ao atualizar ${symbol}: ${response.status}`);
        resultados.push({ nome: inv.nome, valor: inv.valor, erro: true });
        continue;
      }

      const data = await response.json();
      const globalQuote = data["Global Quote"];
      if (!globalQuote || Object.keys(globalQuote).length === 0) {
        console.warn(`Ticker não encontrado na API: ${symbol}`);
        resultados.push({ nome: inv.nome, valor: inv.valor, erro: true });
        continue;
      }

      const valorStr = globalQuote["05. price"];
      const valor = parseFloat(valorStr);
      if (isNaN(valor)) {
        console.warn(`Cotação inválida para ${symbol}`);
        resultados.push({ nome: inv.nome, valor: inv.valor, erro: true });
        continue;
      }

      resultados.push({ nome: inv.nome, valor, erro: false });
    } catch (error) {
      console.error(`Erro ao atualizar ${symbol}:`, error);
      resultados.push({ nome: inv.nome, valor: inv.valor, erro: true });
    }
  }

  return resultados;
}
