let selectedBarbershop = "";
let selectedTime = "";
let selectedServices = [];
let totalValue = 0;
let loggedUser = null;

function register() {
  const u = document.getElementById("new-username").value.trim();
  const p = document.getElementById("new-password").value.trim();
  const e = document.getElementById("new-email").value.trim();
  if (!u || !p || !e) {
    alert("Preencha todos os campos.");
    return;
  }
  localStorage.setItem("user", JSON.stringify({ user: u, pass: p, email: e }));
  alert("✅ Cadastro realizado com sucesso!");
  showLogin();
}

function showLogin() {
  document
    .querySelectorAll(".container")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("login-screen").classList.add("active");
  document.getElementById("main-nav").classList.add("hidden");
  document.getElementById("user-menu").classList.add("hidden");
}

function login() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  const st = JSON.parse(localStorage.getItem("user") || "{}");
  if (st.user === u && st.pass === p) {
    loggedUser = u;
    document.getElementById("main-nav").classList.remove("hidden");
    document.getElementById("user-menu").classList.remove("hidden");
    showScreen("barbershop-screen");
    carregarHistoricoNaTelaBarbearia();
  } else {
    alert("❌ Usuário ou senha incorretos");
  }
}

function getUsuarioAtual() {
  const st = JSON.parse(localStorage.getItem("user") || "{}");
  return st.user || loggedUser;
}

function logout() {
  loggedUser = null;
  document.getElementById("user-menu").classList.add("hidden");
  document.getElementById("main-nav").classList.add("hidden");
  showScreen("login-screen");
}

function toggleUserMenu() {
  document.getElementById("user-dropdown").classList.toggle("visible");
}

function showMyAppointments() {
  document.getElementById("user-dropdown").classList.remove("visible");
  carregarAgendamentos();
  showScreen("appointments-screen");
}

function showMyInfo() {
  document.getElementById("user-dropdown").classList.remove("visible");
  const info = JSON.parse(localStorage.getItem("user"));
  alert(`Usuário: ${loggedUser}\nE-mail: ${info.email}`);
}

function showPurchaseHistory() {
  document.getElementById("user-dropdown").classList.remove("visible");
  alert("Histórico de compras ainda não implementado.");
}

window.onload = () => {
  const st = JSON.parse(localStorage.getItem("user") || "{}");
  if (st.user && st.pass) {
    loggedUser = st.user;
    document.getElementById("main-nav").classList.remove("hidden");
    document.getElementById("user-menu").classList.remove("hidden");
    showScreen("barbershop-screen");
    carregarHistoricoNaTelaBarbearia();
  } else {
    showScreen("register-screen");
  }
};

function showScreen(screenId) {
  document
    .querySelectorAll(".container")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");

  if (screenId === "barbershop-screen") {
    carregarHistoricoNaTelaBarbearia();
  }

  if (screenId === "services-screen") {
    carregarServicos();
  }
}

function selectBarbershop(name) {
  selectedBarbershop = name;
  showScreen("services-screen");
  carregarServicos(); // Garante que serviços atualizados apareçam
}

function toggleService(card, name, price) {
  card.classList.toggle("selected");
  const index = selectedServices.findIndex((s) => s.name === name);
  if (index === -1) {
    selectedServices.push({ name, price });
    totalValue += price;
  } else {
    selectedServices.splice(index, 1);
    totalValue -= price;
  }
  updateTotal();
}

function updateTotal() {
  document.getElementById("total-valor").textContent = `Total: R$ ${totalValue
    .toFixed(2)
    .replace(".", ",")}`;
}

function goToCalendar() {
  if (selectedServices.length === 0) {
    alert("Selecione ao menos um serviço antes de continuar.");
    return;
  }
  showScreen("calendar-screen");
  renderTimeSlots();
}

function onDateSelected() {
  const dataInput = document.getElementById("data-agendamento");
  const data = dataInput.value;

  if (data) {
    const [ano, mes, dia] = data.split("-");
    const diaSemana = new Date(ano, mes - 1, dia).getDay();
    if (diaSemana === 0) {
      alert("Domingo não está disponível para agendamento.");
      dataInput.value = "";
      document.getElementById("horarios-section").style.display = "none";
      selectedTime = "";
      return;
    }

    document.getElementById("horarios-section").style.display = "block";
    renderTimeSlots();
  } else {
    document.getElementById("horarios-section").style.display = "none";
    selectedTime = "";
  }
}

function renderTimeSlots() {
  const container = document.getElementById("time-slots");
  container.innerHTML = "";

  const data = document.getElementById("data-agendamento").value;
  if (!data || !selectedBarbershop) {
    container.innerHTML = "Selecione uma data e uma barbearia.";
    return;
  }

  const horarios = JSON.parse(
    localStorage.getItem("horariosDisponiveis") || "[]"
  );

  const disponiveis = horarios
    .filter((h) => h.data === data && h.barbearia === selectedBarbershop)
    .map((h) => h.hora);

  if (disponiveis.length === 0) {
    container.innerHTML = "Nenhum horário disponível para essa data.";
    selectedTime = "";
    return;
  }

  disponiveis.forEach((time) => {
    const div = document.createElement("div");
    div.className = "time-slot";
    div.textContent = time;
    div.onclick = () => {
      document
        .querySelectorAll(".time-slot")
        .forEach((el) => el.classList.remove("selected"));
      div.classList.add("selected");
      selectedTime = time;
    };
    container.appendChild(div);
  });
}

function goToConfirmation() {
  if (!selectedTime) {
    alert("Selecione um horário antes de continuar.");
    return;
  }
  showScreen("confirmation-screen");
}

function finalizarAgendamento() {
  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const whatsapp = document.getElementById("whatsapp").checked;
  const email = document.getElementById("email").value;

  if (
    !nome ||
    !telefone ||
    !email ||
    !selectedBarbershop ||
    !selectedTime ||
    selectedServices.length === 0
  ) {
    alert("Preencha todos os campos e selecione barbearia, serviço e horário.");
    return;
  }

  const servicos = selectedServices.map((s) => s.name).join(", ");
  const totalValueFinal = selectedServices.reduce((total, s) => total + s.price, 0);
  const date = document.getElementById("data-agendamento").value;

  fetch("https://wf38fv-3000.csb.app/agendamento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: nome,
      email: email,
      telefone: telefone,
      whatsapp: whatsapp,
      servicos: selectedServices.map((s) => s.name),
      data: date,
      hora: selectedTime,
      barbearia: selectedBarbershop,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "ok") {
        alert(
          `✅ Agendamento realizado com sucesso!\n\nBarbearia: ${selectedBarbershop}\nServiços: ${servicos}\nHorário: ${selectedTime}\nTotal: R$ ${totalValueFinal
            .toFixed(2)
            .replace(".", ",")}`
        );

        // ✅ Remover o horário agendado da lista de horários disponíveis
        const horariosAtuais = JSON.parse(localStorage.getItem("horariosDisponiveis") || "[]");
        const atualizados = horariosAtuais.filter(
          h =>
            !(
              h.data === date &&
              h.hora === selectedTime &&
              h.barbearia === selectedBarbershop
            )
        );
        localStorage.setItem("horariosDisponiveis", JSON.stringify(atualizados));

        // Limpeza de campos e retorno à tela inicial
        selectedBarbershop = "";
        selectedTime = "";
        selectedServices = [];
        totalValue = 0;
        updateTotal();
        document.getElementById("data-agendamento").value = "";
        document.getElementById("horarios-section").style.display = "none";
        showScreen("barbershop-screen");
        carregarHistoricoNaTelaBarbearia();
      } else {
        alert("❌ Erro ao agendar. Tente novamente.");
      }
    })
    .catch((err) => {
      console.error("❌ Erro backend:", err);
      alert("❌ Falha ao conectar com o servidor.");
    });
}

function carregarHistoricoNaTelaBarbearia() {
  const lista = document.getElementById("barbershop-history-list");
  if (!lista) return;
  lista.innerHTML = "";

  fetch("https://wf38fv-3000.csb.app/agendamentos")
    .then((res) => res.json())
    .then((dados) => {
      const usuarioAtual =
        loggedUser || JSON.parse(localStorage.getItem("user")).user;
      const meusAgendamentos = dados.filter(
        (ag) => ag.usuario === usuarioAtual
      );
      if (meusAgendamentos.length === 0) {
        lista.innerHTML = "<li>Você ainda não tem agendamentos.</li>";
        return;
      }
      meusAgendamentos.forEach((ag) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${ag.barbearia}</strong> - ${ag.data} às ${
          ag.hora
        }<br>Serviços: ${ag.servicos.join(", ")}`;
        lista.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar histórico:", err);
      lista.innerHTML = "<li>Erro ao carregar histórico.</li>";
    });
}

function carregarServicos() {
  const container = document.getElementById("services-list");
  if (!container) return;

  container.innerHTML = "";
  const servicos = JSON.parse(localStorage.getItem("servicos") || "[]");

  if (servicos.length === 0) {
    container.innerHTML = "<p>Nenhum serviço disponível no momento.</p>";
    return;
  }

  servicos.forEach((s) => {
    const div = document.createElement("div");
    div.className = "service-card";
    div.onclick = () => toggleService(div, s.name, s.price);
    div.innerHTML = `
  <img src="${s.img}" alt="${
      s.name
    }" style="width: 80px; height: 80px; border-radius: 8px;" />
  <div><strong>${s.name}</strong><br />R$ ${s.price
      .toFixed(2)
      .replace(".", ",")}</div>
`;

    container.appendChild(div);
  });
}
function gerarHorariosPadraoProximosDias(dias = 30) {
  const horariosExistentes = JSON.parse(localStorage.getItem("horariosDisponiveis") || "[]");
  const horariosExcluidos = JSON.parse(localStorage.getItem("horariosExcluidos") || "[]");
  const novosHorarios = [];

  const barbearia = "Barbearia do João";

  for (let i = 0; i < dias; i++) {
    const dataObj = new Date();
    dataObj.setDate(dataObj.getDate() + i);

    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dia = String(dataObj.getDate()).padStart(2, "0");
    const dataStr = `${ano}-${mes}-${dia}`;

    const diaSemana = dataObj.getDay();
    if (diaSemana === 0) continue; // pula domingo

    const horaInicial = 9;
    const horaFinal = diaSemana === 6 ? 12 : 18;

    for (let h = horaInicial; h < horaFinal; h++) {
      const horariosGerar = [
        `${String(h).padStart(2, "0")}:00`,
        `${String(h).padStart(2, "0")}:30`
      ];

      horariosGerar.forEach((hora) => {
        const jaExiste = horariosExistentes.some(
          (existe) =>
            existe.data === dataStr &&
            existe.hora === hora &&
            existe.barbearia === barbearia
        );

        const estaExcluido = horariosExcluidos.some(
          (excluido) =>
            excluido.data === dataStr &&
            excluido.hora === hora &&
            excluido.barbearia === barbearia
        );

        if (!jaExiste && !estaExcluido) {
          novosHorarios.push({ data: dataStr, hora, barbearia });
        }
      });
    }
  }

  if (novosHorarios.length > 0) {
    const atualizados = [...horariosExistentes, ...novosHorarios];
    localStorage.setItem("horariosDisponiveis", JSON.stringify(atualizados));
  }
}


// Executa automaticamente ao carregar a página
window.addEventListener("load", () => {
  gerarHorariosPadraoProximosDias();
});

document.addEventListener("DOMContentLoaded", () => {
    const datePicker = document.getElementById("datePicker");
    const barbershopSelect = document.getElementById("barbershopSelect");
    const horariosContainer = document.getElementById("horarios");
    const finalizarBtn = document.getElementById("finalizarBtn");
    let selectedTime = null;

    const gerarHorariosPadraoProximosDias = () => {
      const horariosAtuais = JSON.parse(localStorage.getItem("horariosDisponiveis") || "[]");
      const horariosExcluidos = JSON.parse(localStorage.getItem("horariosExcluidos") || "[]");

      const horariosPorDia = [
        "08:00", "09:00", "10:00", "11:00",
        "13:00", "14:00", "15:00", "16:00", "17:00"
      ];

      const barbearias = ["Unidade 1", "Unidade 2"];

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let i = 0; i < 5; i++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() + i);
        const dataFormatada = dataAtual.toISOString().split("T")[0];

        for (const barbearia of barbearias) {
          for (const hora of horariosPorDia) {
            const jaExiste = horariosAtuais.some(
              h => h.data === dataFormatada && h.hora === hora && h.barbearia === barbearia
            );
            const estaExcluido = horariosExcluidos.some(
              h => h.data === dataFormatada && h.hora === hora && h.barbearia === barbearia
            );

            if (!jaExiste && !estaExcluido) {
              horariosAtuais.push({
                data: dataFormatada,
                hora: hora,
                barbearia: barbearia
              });
            }
          }
        }
      }

      localStorage.setItem("horariosDisponiveis", JSON.stringify(horariosAtuais));
    };

    gerarHorariosPadraoProximosDias();

    const renderTimeSlots = () => {
      const date = datePicker.value;
      const selectedBarbershop = barbershopSelect.value;
      const horarios = JSON.parse(localStorage.getItem("horariosDisponiveis") || "[]");

      const disponiveis = horarios
        .filter(h => h.data === date && h.barbearia === selectedBarbershop)
        .map(h => h.hora);

      horariosContainer.innerHTML = "";

      const agora = new Date();
      const hoje = agora.toISOString().split("T")[0];

      const disponiveisFiltrados = disponiveis.filter(hora => {
        if (date !== hoje) return true;
        const [h, m] = hora.split(":").map(Number);
        return h > agora.getHours() || (h === agora.getHours() && m > agora.getMinutes());
      });

      disponiveisFiltrados.forEach(hora => {
        const div = document.createElement("div");
        div.classList.add("time-slot");
        div.textContent = hora;
        div.addEventListener("click", () => {
          document.querySelectorAll(".time-slot").forEach(slot => slot.classList.remove("selected"));
          div.classList.add("selected");
          selectedTime = hora;
        });
        horariosContainer.appendChild(div);
      });
    };

    datePicker.addEventListener("change", renderTimeSlots);
    barbershopSelect.addEventListener("change", renderTimeSlots);

    finalizarBtn.addEventListener("click", async () => {
      if (!selectedTime || !datePicker.value || !barbershopSelect.value) {
        alert("Selecione a data, barbearia e horário.");
        return;
      }

      const date = datePicker.value;
      const selectedBarbershop = barbershopSelect.value;

      try {
        const response = await fetch("https://api.sheetmonkey.io/form/your-form-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: date,
            horario: selectedTime,
            unidade: selectedBarbershop,
          }),
        });

        const data = await response.json();

        if (data.status === "ok") {
          alert("Horário agendado com sucesso!");

          // REMOVE o horário agendado do localStorage
          const horariosAtuais = JSON.parse(localStorage.getItem("horariosDisponiveis") || "[]");
          const atualizados = horariosAtuais.filter(
            h => !(h.data === date && h.hora === selectedTime && h.barbearia === selectedBarbershop)
          );
          localStorage.setItem("horariosDisponiveis", JSON.stringify(atualizados));

          renderTimeSlots();
        } else {
          alert("Erro ao agendar horário.");
        }
      } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao agendar horário.");
      }
    });

    // Inicialização
    const hoje = new Date().toISOString().split("T")[0];
    datePicker.value = hoje;
    renderTimeSlots();
  });

