import { buscarCotacao, atualizarCotacoesAutomatica } from "./cotacao.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-investimento");
  const tabela = document.getElementById("tabela-investimentos").querySelector("tbody");
  const resultadoCotacao = document.getElementById("resultado-cotacao");
  const spinner = document.getElementById("spinner-cotacao");

  carregarInvestimentos();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = form.nome.value.toUpperCase().trim();
    const tipo = form.tipo.value;
    const quantidade = parseFloat(form.quantidade.value);

    if (!nome || !quantidade || quantidade <= 0) {
      resultadoCotacao.innerHTML = `<span class="text-danger">Preencha todos os campos corretamente.</span>`;
      return;
    }

    try {
      const resultado = await buscarCotacao(nome, spinner, resultadoCotacao);

      if (!resultado || !resultado.valor) {
        resultadoCotacao.innerHTML = `<span class="text-danger">Não foi possível obter a cotação. Verifique o ticker.</span>`;
        return;
      }

      const valorTotal = parseFloat((resultado.valor * quantidade).toFixed(2));
      const novoInvestimento = { nome, tipo, quantidade, valor: valorTotal };

      await fetch("/api/adicionar_investimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoInvestimento)
      });

      form.reset();
      resultadoCotacao.innerHTML = "";
      carregarInvestimentos();
    } catch (erro) {
      console.error("Erro ao adicionar investimento:", erro);
      resultadoCotacao.innerHTML = `<span class="text-danger">Erro ao processar o investimento.</span>`;
    }
  });

  async function carregarInvestimentos() {
    try {
      const res = await fetch("/api/dados");
      const data = await res.json();
      let investimentos = data.investimentos || [];

      // Atualiza cotações automaticamente
      const cotacoesAtualizadas = await atualizarCotacoesAutomatica(investimentos);

      cotacoesAtualizadas.forEach(cot => {
        if (!cot.erro) {
          const inv = investimentos.find(i => i.nome === cot.nome);
          if (inv) {
            inv.valor = parseFloat((cot.valor * inv.quantidade).toFixed(2));
          }
        }
      });

      tabela.innerHTML = "";
      investimentos.forEach(inv => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${inv.nome}</td>
          <td>${inv.tipo}</td>
          <td>${inv.quantidade}</td>
          <td>R$ ${inv.valor.toFixed(2)}</td>
          <td>
            <button class="btn btn-danger btn-sm btn-remover" data-nome="${inv.nome}" data-tipo="${inv.tipo}">
              Remover
            </button>
          </td>
        `;
        tabela.appendChild(tr);
      });

      // Remover event listener antigo e adicionar um novo para evitar múltiplos handlers
      tabela.removeEventListener("click", handleRemoverClick);
      tabela.addEventListener("click", handleRemoverClick);

      desenharGraficoInvestimentos(investimentos);
    } catch (error) {
      console.error("Erro ao carregar investimentos:", error);
      tabela.innerHTML = `<tr><td colspan="5" class="text-danger">Erro ao carregar investimentos</td></tr>`;
    }
  }

  async function handleRemoverClick(e) {
    if (e.target.classList.contains("btn-remover")) {
      const btn = e.target;
      const nome = btn.dataset.nome;
      const tipo = btn.dataset.tipo;

      if (confirm(`Tem certeza que deseja remover o investimento ${nome} (${tipo})?`)) {
        try {
          const res = await fetch("/api/remover_investimento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, tipo })
          });
          const json = await res.json();
          if (res.ok && json.status === "sucesso") {
            alert(`Investimento ${nome} removido com sucesso!`);
            carregarInvestimentos();
          } else {
            alert(json.mensagem || "Erro ao remover investimento.");
          }
        } catch (error) {
          console.error("Erro ao remover investimento:", error);
          alert("Erro ao processar a remoção.");
        }
      }
    }
  }

  function desenharGraficoInvestimentos(investimentos) {
    const ctx = document.getElementById("grafico-investimentos").getContext("2d");
    if (window.graficoInvestimentos) window.graficoInvestimentos.destroy();

    window.graficoInvestimentos = new Chart(ctx, {
      type: "bar",
      data: {
        labels: investimentos.map(i => i.nome),
        datasets: [{
          label: "Valor Total (R$)",
          data: investimentos.map(i => i.valor),
          backgroundColor: "#0d6efd"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
});

// Filtros de período e atualização dos gráficos
document.addEventListener('DOMContentLoaded', () => {
  const selectPeriodo = document.getElementById('filtroPeriodo');
  selectPeriodo.addEventListener('change', () => {
    atualizarGraficosComFiltro(selectPeriodo.value);
  });

  atualizarGraficosComFiltro(selectPeriodo.value);
});

function atualizarGraficosComFiltro(periodo) {
  fetch('/api/dados')
    .then(res => res.json())
    .then(dados => {
      const dadosFiltrados = filtrarPorPeriodo(dados, periodo);
      atualizarGraficoInvestimentos(dadosFiltrados.investimentos);
      atualizarGraficoGastos(dadosFiltrados.gastos);
    });
}

function filtrarPorPeriodo(dados, periodo) {
  if (periodo === 'todos') return dados;

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  const filtrar = (lista) => lista.filter(item => {
    const data = new Date(item.data || agora);
    return (
      (periodo === 'anual' && data.getFullYear() === anoAtual) ||
      (periodo === 'mensal' && data.getFullYear() === anoAtual && data.getMonth() === mesAtual)
    );
  });

  return {
    investimentos: filtrar(dados.investimentos || []),
    gastos: filtrar(dados.gastos || []),
    fixos: dados.fixos || {}
  };
}

function atualizarGraficoInvestimentos(investimentos) {
  const ctx = document.getElementById("grafico-investimentos").getContext("2d");
  if (window.graficoInvestimentos) window.graficoInvestimentos.destroy();

  window.graficoInvestimentos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: investimentos.map(i => i.nome),
      datasets: [{
        label: "Valor Total (R$)",
        data: investimentos.map(i => i.valor),
        backgroundColor: "#0d6efd"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function atualizarGraficoGastos(gastos) {
  const ctx = document.getElementById("grafico-gastos").getContext("2d");
  if (window.graficoGastos) window.graficoGastos.destroy();

  window.graficoGastos = new Chart(ctx, {
    type: "pie",
    data: {
      labels: gastos.map(g => g.nome),
      datasets: [{
        data: gastos.map(g => g.valor),
        backgroundColor: gastos.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`)
      }]
    },
    options: {
      responsive: true
    }
  });
}
