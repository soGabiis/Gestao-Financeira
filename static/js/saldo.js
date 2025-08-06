document.addEventListener("DOMContentLoaded", () => {
  inicializar();
});

function inicializar() {
  carregarDados()
    .then(data => {
      montarFiltroPeriodo();
      aplicarFiltro(data, "mes_atual");
      configurarCliqueAlerta();  // Configura o clique no alerta para abrir modal
    })
    .catch(() => {
      mostrarErro("Erro ao carregar dados. Tente novamente mais tarde.");
    });
}

// Busca dados da API
async function carregarDados() {
  const res = await fetch("/api/dados");
  if (!res.ok) throw new Error("Falha ao carregar dados");
  return await res.json();
}

// Cria filtro de período
function montarFiltroPeriodo() {
  const container = document.createElement("div");
  container.className = "btn-group mb-3";

  const opcoes = [
    { id: "7_dias", label: "Últimos 7 dias" },
    { id: "30_dias", label: "Últimos 30 dias" },
    { id: "mes_atual", label: "Mês Atual" },
    { id: "ano_atual", label: "Ano Atual" },
    { id: "todos", label: "Todos" }
  ];

  opcoes.forEach(opcao => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary";
    btn.textContent = opcao.label;
    btn.dataset.periodo = opcao.id;
    btn.onclick = () => {
      const botoes = container.querySelectorAll("button");
      botoes.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      carregarDados().then(data => aplicarFiltro(data, opcao.id));
    };
    container.appendChild(btn);
  });

  container.querySelector("button[data-periodo='mes_atual']").classList.add("active");

  const containerPai = document.querySelector(".container > h1");
  containerPai.insertAdjacentElement("afterend", container);
}

// Aplica filtro e atualiza visualizações
function aplicarFiltro(data, periodo) {
  const ganhos = filtrarPorPeriodo(data.ganhos || [], periodo);
  const gastos = filtrarPorPeriodo(data.gastos || [], periodo);
  const investimentos = filtrarPorPeriodo(data.investimentos || [], periodo);

  const somaGanhos = somaValores(ganhos);
  const somaGastos = somaValores(gastos);
  const somaInvestimentos = somaValores(investimentos);
  
  atualizarCardSaldo(somaGanhos, somaGastos, somaInvestimentos);


  atualizarGraficoInterativo(ganhos, gastos, investimentos);
  atualizarAlertasComplexos(ganhos, gastos, investimentos, somaGanhos, somaGastos, somaInvestimentos);
  mostrarDicas(somaGanhos, somaGastos, somaInvestimentos);

  // Armazena os dados atuais para o modal
  window.dadosModal = { ganhos, gastos, investimentos, somaGanhos, somaGastos, somaInvestimentos };
}

// Filtra itens pela data conforme o período
function filtrarPorPeriodo(lista, periodo) {
  const hoje = new Date();
  const dataLimite = new Date(hoje);

  switch (periodo) {
    case "7_dias":
      dataLimite.setDate(hoje.getDate() - 7);
      break;
    case "30_dias":
      dataLimite.setDate(hoje.getDate() - 30);
      break;
    case "mes_atual":
      dataLimite.setDate(1);
      break;
    case "ano_atual":
      dataLimite.setMonth(0, 1);
      break;
    case "todos":
      return lista;
    default:
      return lista;
  }

  return lista.filter(item => {
    if (!item.data) return false;
    const d = new Date(item.data);
    return d >= dataLimite && d <= hoje;
  });
}

function somaValores(lista) {
  return lista.reduce((soma, item) => soma + Number(item.valor || 0), 0);
}

function atualizarGraficoInterativo(ganhos, gastos, investimentos) {
  const ctx = document.getElementById('graficoSaldo').getContext('2d');

  if (window.graficoSaldoAtual) {
    window.graficoSaldoAtual.destroy();
  }

  window.graficoSaldoAtual = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ganhos', 'Gastos', 'Investimentos'],
      datasets: [{
        label: 'Valor em R$',
        data: [somaValores(ganhos), somaValores(gastos), somaValores(investimentos)],
        backgroundColor: ['#198754', '#dc3545', '#0d6efd']
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => formatarReais(context.parsed.y)
          }
        }
      }
    }
  });
}

function atualizarAlertasComplexos(ganhosArr, gastosArr, invArr, ganhos, gastos, investimentos) {
  const alertaDiv = document.getElementById("alertas");
  alertaDiv.style.display = "block";

  const ganhoUltimos7 = somaValores(filtrarPorPeriodo(ganhosArr, "7_dias"));
  const gastoUltimos7 = somaValores(filtrarPorPeriodo(gastosArr, "7_dias"));

  let texto = "";
  let classe = "";

  if (ganhos === 0) {
    classe = "alert-warning";
    texto = "Você ainda não registrou seus ganhos. Registre para melhor controle financeiro.";
  } else if (gastos > ganhos) {
    classe = "alert-danger";
    texto = "🚨 Atenção! Você está gastando mais do que ganha. Reveja seus gastos.";
  } else if (gastos >= ganhos * 0.9) {
    classe = "alert-warning";
    texto = "⚠️ Seus gastos estão muito próximos dos ganhos. Cuidado para não apertar seu orçamento.";
  } else if (investimentos < ganhos * 0.1) {
    classe = "alert-info";
    texto = "💡 Invista ao menos 10% dos seus ganhos para garantir um futuro financeiro saudável.";
  } else {
    classe = "alert-success";
    texto = "🎉 Ótimo! Você está controlando bem suas finanças e investindo com sabedoria.";
  }

  if (gastoUltimos7 > gastos / 4) {
    texto += " Seus gastos na última semana foram relativamente altos, fique atento.";
  } else {
    texto += " Seus gastos na última semana estão sob controle.";
  }

  alertaDiv.className = `alert ${classe}`;
  alertaDiv.textContent = texto;
}

// Configura clique no alerta para abrir modal com sugestões detalhadas
function configurarCliqueAlerta() {
  const alertaDiv = document.getElementById("alertas");
  alertaDiv.style.cursor = "pointer";

  alertaDiv.onclick = () => {
    if (!window.dadosModal) return;

    const modalBody = document.getElementById("modalSugestoesConteudo");
    modalBody.innerHTML = gerarConteudoSugestoes(window.dadosModal);
    
    // Abre modal bootstrap
    const modalElement = document.getElementById("modalSugestoes");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  };
}

// Gera conteúdo HTML detalhado para o modal baseado nos dados atuais
function gerarConteudoSugestoes({ ganhos, gastos, investimentos, somaGanhos, somaGastos, somaInvestimentos }) {
  let conteudo = `<p><strong>Ganhos totais:</strong> ${formatarReais(somaGanhos)}</p>`;
  conteudo += `<p><strong>Gastos totais:</strong> ${formatarReais(somaGastos)}</p>`;
  conteudo += `<p><strong>Investimentos totais:</strong> ${formatarReais(somaInvestimentos)}</p>`;

  conteudo += "<hr><h6>Análise detalhada:</h6>";

  if (somaGanhos === 0) {
    conteudo += "<p>Você ainda não registrou ganhos. Comece registrando seus ganhos para ter um controle melhor.</p>";
  } else {
    if (somaGastos > somaGanhos) {
      conteudo += "<p style='color:red;'>Você está gastando mais do que ganha. Considere reduzir despesas e revisar seu orçamento.</p>";
    } else if (somaGastos >= somaGanhos * 0.9) {
      conteudo += "<p style='color:orange;'>Seus gastos estão muito próximos dos ganhos. Tome cuidado para não apertar seu orçamento.</p>";
    } else {
      conteudo += "<p style='color:green;'>Você está mantendo os gastos controlados em relação aos ganhos. Excelente!</p>";
    }

    if (somaInvestimentos < somaGanhos * 0.1) {
      conteudo += "<p>Recomendo investir ao menos 10% dos seus ganhos para garantir um futuro financeiro saudável.</p>";
    } else {
      conteudo += "<p>Continue investindo regularmente para aumentar seu patrimônio.</p>";
    }
  }

  conteudo += "<hr><h6>Dicas específicas:</h6>";
  conteudo += "<ul>";
  if (somaGanhos === 0) {
    conteudo += "<li>Registre seus ganhos para começar a controlar suas finanças.</li>";
  } else {
    if (somaGastos > somaGanhos) {
      conteudo += "<li>Reduza seus gastos para evitar endividamento.</li>";
    } else if (somaGastos >= somaGanhos * 0.9) {
      conteudo += "<li>Tente controlar melhor seus gastos para evitar apertos financeiros.</li>";
    } else {
      conteudo += "<li>Mantenha seus gastos abaixo dos seus ganhos para ter folga financeira.</li>";
    }

    if (somaInvestimentos < somaGanhos * 0.1) {
      conteudo += "<li>Invista ao menos 10% dos seus ganhos para garantir seu futuro.</li>";
    } else {
      conteudo += "<li>Continue investindo para aumentar seu patrimônio.</li>";
    }
  }
  conteudo += "<li>Considere criar uma reserva de emergência para imprevistos.</li>";
  conteudo += "<li>Evite gastos supérfluos para aumentar sua capacidade de poupar.</li>";
  conteudo += "</ul>";

  return conteudo;
}

function mostrarDicas(ganhos, gastos, investimentos) {
  const lista = document.getElementById("dicasList");
  lista.innerHTML = "";

  if (ganhos === 0) {
    lista.innerHTML = "<li>Registre seus ganhos para começar a controlar suas finanças.</li>";
    return;
  }

  if (gastos > ganhos) {
    lista.innerHTML += "<li>Reduza seus gastos para evitar endividamento.</li>";
  } else if (gastos >= ganhos * 0.9) {
    lista.innerHTML += "<li>Tente controlar melhor seus gastos para evitar apertos financeiros.</li>";
  } else {
    lista.innerHTML += "<li>Mantenha seus gastos abaixo dos seus ganhos para ter folga financeira.</li>";
  }

  if (investimentos < ganhos * 0.1) {
    lista.innerHTML += "<li>Invista ao menos 10% dos seus ganhos para garantir seu futuro.</li>";
  } else {
    lista.innerHTML += "<li>Continue investindo regularmente para aumentar seu patrimônio.</li>";
  }

  lista.innerHTML += "<li>Considere criar uma reserva de emergência para imprevistos.</li>";
  lista.innerHTML += "<li>Evite gastos supérfluos para aumentar sua capacidade de poupar.</li>";
}

function mostrarErro(mensagem) {
  const alertaDiv = document.getElementById("alertas");
  alertaDiv.style.display = "block";
  alertaDiv.className = "alert alert-danger";
  alertaDiv.textContent = mensagem;
}

function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizarCardSaldo(ganhos, gastos, investimentos) {
  const saldo = ganhos - gastos + investimentos;
  const cardSaldo = document.getElementById("valorSaldo");

  if (cardSaldo) {
    cardSaldo.textContent = formatarReais(saldo);
  }
}
