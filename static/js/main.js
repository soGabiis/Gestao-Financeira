let graficoAtual = null;

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/dados")
    .then(res => res.json())
    .then(data => {
      const ganhos = data.fixos?.ganhos || 0;
      const gastos = somaValores(data.gastos || []);
      const investimentos = somaValores(data.investimentos || []);
      const saldo = ganhos - gastos + investimentos;

      document.getElementById("ganhos").textContent = formatarReais(ganhos);
      document.getElementById("gastos").textContent = formatarReais(gastos);
      document.getElementById("investimentos").textContent = formatarReais(investimentos);
      document.getElementById("saldo").textContent = formatarReais(saldo);

      document.querySelectorAll(".card-clickable").forEach(card => {
        const tipo = card.dataset.tipo;

        card.addEventListener("click", () => {
          if (tipo === "investimentos") {
            window.location.href = "/investimentos";
            return;
          }

          const overlay = card.querySelector(".overlay");
          const canvas = overlay.querySelector("canvas");

          document.querySelectorAll(".overlay").forEach(o => {
            if (o !== overlay) o.classList.add("d-none");
          });

          overlay.classList.toggle("d-none");

          if (!overlay.classList.contains("d-none")) {
            desenharGrafico(tipo, canvas, "pie", data);
          }

          overlay.querySelectorAll(".tipo-btn").forEach(btn => {
            btn.onclick = () => {
              const formato = btn.dataset.formato;
              desenharGrafico(tipo, canvas, formato, data);
            };
          });
        });
      });
    });
});

function somaValores(lista) {
  return lista.reduce((soma, item) => soma + Number(item.valor || 0), 0);
}

function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function desenharGrafico(tipo, canvas, formato, data) {
  if (graficoAtual) graficoAtual.destroy();

  let valores = [];
  let labels = [];

  if (tipo === "ganhos") {
    valores = [data.fixos.ganhos];
    labels = ["Ganhos Fixos"];
  } else if (tipo === "gastos") {
    valores = data.gastos.map(g => g.valor);
    labels = data.gastos.map(g => g.nome);
  } else if (tipo === "investimentos") {
    valores = data.investimentos.map(i => i.valor);
    labels = data.investimentos.map(i => i.nome);
  } else if (tipo === "saldo") {
    const ganhos = data.fixos.ganhos;
    const gastos = somaValores(data.gastos);
    const investimentos = somaValores(data.investimentos);
    valores = [ganhos, -gastos, investimentos];
    labels = ["Ganhos", "Gastos", "Investimentos"];
  }

  graficoAtual = new Chart(canvas, {
    type: formato,
    data: {
      labels,
      datasets: [{
        label: "R$",
        data: valores,
        backgroundColor: ["#198754", "#dc3545", "#0d6efd", "#6c757d", "#ffc107", "#20c997"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: formato !== "bar"
        }
      }
    }
  });
}
