const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const path = require("path");

// Carregar variáveis do .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Servir arquivos estáticos

// Autenticação com a conta de serviço Google
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "service-account.json"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// Armazenamento simples em memória (melhor usar banco de dados real)
let agendamentos = [];

// Função para criar evento no Google Calendar
async function criarEvento(nome, servicos, horario, email) {
  const calendar = google.calendar({
    version: "v3",
    auth: await auth.getClient(),
  });

  const start = new Date(horario);
  const end = new Date(start.getTime() + 30 * 60000); // +30 minutos

  const evento = {
    summary: `Agendamento: ${nome}`,
    description: `Serviços: ${servicos.join(", ")}\nEmail: ${email}`,
    start: {
      dateTime: start.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  };

  const res = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: evento,
  });

  console.log("✅ Evento criado:", res.data.htmlLink);
  return res.data.htmlLink;
}

// Rota para criar agendamento
app.post("/agendamento", async (req, res) => {
  try {
    const {
      usuario,
      email,
      telefone,
      whatsapp,
      servicos,
      data,
      hora,
      barbearia,
    } = req.body;

    // Verificar se horário já ocupado
    const existente = agendamentos.find(
      (a) => a.data === data && a.hora === hora && a.barbearia === barbearia
    );
    if (existente) {
      return res.json({ status: "erro", mensagem: "Horário já agendado." });
    }

    // Monta string ISO com fuso de Brasília
    const horario = `${data}T${hora}:00-03:00`;

    // Cria evento no Google Calendar
    const link = await criarEvento(usuario, servicos, horario, email);

    // Armazena localmente para bloquear horário
    agendamentos.push({
      data,
      hora,
      barbearia,
      usuario,
      email,
      telefone,
      whatsapp,
      servicos,
      link,
    });

    res.json({ status: "ok", message: "Evento criado com sucesso", link });
  } catch (err) {
    console.error("❌ Erro ao criar evento:", err);
    res.status(500).json({ status: "erro", message: err.message });
  }
});

// Rota para obter horários disponíveis
app.get("/horarios", (req, res) => {
  const { data, barbearia } = req.query;

  // Horários padrão das 09:00 às 18:30
  const horarios = [];
  for (let h = 9; h <= 18; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Horários ocupados
  const ocupados = agendamentos
    .filter((a) => a.data === data && a.barbearia === barbearia)
    .map((a) => a.hora);

  // Filtra horários disponíveis
  const disponiveis = horarios.filter((h) => !ocupados.includes(h));

  res.json(disponiveis);
});

// Rota para deletar (cancelar) agendamento
app.delete("/agendamento", (req, res) => {
  const { data, hora, barbearia, usuario } = req.body;

  const index = agendamentos.findIndex(
    (a) =>
      a.data === data &&
      a.hora === hora &&
      a.barbearia === barbearia &&
      a.usuario === usuario
  );

  if (index === -1) {
    return res.json({
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    });
  }

  agendamentos.splice(index, 1);
  res.json({ status: "ok", mensagem: "Agendamento removido." });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
