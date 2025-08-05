const tabela = document.getElementById("tabela-gastos").querySelector("tbody");
const form = document.getElementById("form-gasto");
const ctx = document.getElementById("grafico-gastos").getContext("2d");
let graficoGastos;

function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function carregarGastos() {
  try {
    const res = await fetch("/api/dados");
    const data = await res.json();
    const gastos = data.gastos || [];

    tabela.innerHTML = "";

    gastos.forEach(gasto => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${gasto.nome}</td>
        <td>${formatarReais(gasto.valor)}</td>
        <td>${gasto.data}</td>
        <td><button class="btn btn-sm btn-danger btn-remover">Remover</button></td>
      `;
      tr.querySelector(".btn-remover").addEventListener("click", () => removerGasto(gasto));
      tabela.appendChild(tr);
    });

    atualizarGrafico(gastos);
  } catch (error) {
    console.error("Erro ao carregar gastos:", error);
    alert("Erro ao carregar gastos.");
  }
}

async function adicionarGasto(event) {
  event.preventDefault();

  const nome = document.getElementById("nomeGasto").value.trim();
  const valor = parseFloat(document.getElementById("valorGasto").value);
  const data = document.getElementById("dataGasto").value;

  if (!nome || isNaN(valor) || valor <= 0 || !data) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  try {
    const res = await fetch("/api/adicionar_gasto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, valor, data }),
    });
    const json = await res.json();
    if (res.ok) {
      alert("Gasto adicionado com sucesso!");
      form.reset();
      carregarGastos();
    } else {
      alert(json.mensagem || "Erro ao adicionar gasto.");
    }
  } catch (error) {
    alert("Erro ao adicionar gasto.");
    console.error(error);
  }
}

async function removerGasto(gasto) {
  if (!confirm(`Remover gasto "${gasto.nome}" de R$ ${gasto.valor.toFixed(2)}?`)) return;

  try {
    const res = await fetch("/api/remover_gasto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: gasto.nome, data: gasto.data }),  // só nome e data
    });
    const json = await res.json();
    if (res.ok) {
      alert("Gasto removido!");
      carregarGastos();
    } else {
      alert(json.mensagem || "Erro ao remover gasto.");
    }
  } catch (error) {
    alert("Erro ao remover gasto.");
    console.error(error);
  }
}

function atualizarGrafico(gastos) {
  if (graficoGastos) graficoGastos.destroy();

  graficoGastos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: gastos.map(g => g.nome),
      datasets: [{
        label: "Valor (R$)",
        data: gastos.map(g => g.valor),
        backgroundColor: "#dc3545",
      }],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

form.addEventListener("submit", adicionarGasto);
window.addEventListener("load", carregarGastos);
