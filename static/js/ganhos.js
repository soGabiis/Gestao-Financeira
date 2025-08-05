const tabela = document.getElementById("tabela-ganhos").querySelector("tbody");
const form = document.getElementById("form-ganho");
const ctx = document.getElementById("grafico-ganhos").getContext("2d");
let graficoGanhos;

function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function carregarGanhos() {
  try {
    const res = await fetch("/api/dados");
    const data = await res.json();
    const ganhos = data.ganhos || [];

    tabela.innerHTML = "";

    ganhos.forEach(ganho => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ganho.nome}</td>
        <td>${formatarReais(ganho.valor)}</td>
        <td>${ganho.data}</td>
        <td><button class="btn btn-sm btn-danger btn-remover">Remover</button></td>
      `;
      tr.querySelector(".btn-remover").addEventListener("click", () => removerGanho(ganho));
      tabela.appendChild(tr);
    });

    atualizarGrafico(ganhos);
  } catch (error) {
    console.error("Erro ao carregar ganhos:", error);
  }
}

async function adicionarGanho(event) {
  event.preventDefault();

  const nome = document.getElementById("nomeGanho").value.trim();
  const valor = parseFloat(document.getElementById("valorGanho").value);
  const data = document.getElementById("dataGanho").value;

  if (!nome || isNaN(valor) || valor <= 0 || !data) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  try {
    const res = await fetch("/api/adicionar_ganho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, valor, data })
    });
    const json = await res.json();
    if (res.ok) {
      alert("Ganho adicionado com sucesso!");
      form.reset();
      carregarGanhos();
    } else {
      alert(json.mensagem || "Erro ao adicionar ganho.");
    }
  } catch (error) {
    alert("Erro ao adicionar ganho.");
    console.error(error);
  }
}

async function removerGanho(ganho) {
  if (!confirm(`Remover ganho "${ganho.nome}" de R$ ${ganho.valor.toFixed(2)}?`)) return;

  try {
    const res = await fetch("/api/remover_ganho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ganho)
    });
    const json = await res.json();
    if (res.ok) {
      alert("Ganho removido!");
      carregarGanhos();
    } else {
      alert(json.mensagem || "Erro ao remover ganho.");
    }
  } catch (error) {
    alert("Erro ao remover ganho.");
    console.error(error);
  }
}

function atualizarGrafico(ganhos) {
  if (graficoGanhos) graficoGanhos.destroy();

  graficoGanhos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ganhos.map(g => g.nome),
      datasets: [{
        label: "Valor (R$)",
        data: ganhos.map(g => g.valor),
        backgroundColor: "#198754"
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

form.addEventListener("submit", adicionarGanho);
window.addEventListener("load", carregarGanhos);
