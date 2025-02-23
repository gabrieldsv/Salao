// Configurações do Supabase
const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para carregar dados do dashboard
async function carregarDashboard() {
    try {
        // Busca agendamentos
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*');

        if (error) throw error;

        // Filtra agendamentos por período
        const hoje = new Date().toLocaleDateString('pt-BR');
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        const amanhaStr = amanha.toLocaleDateString('pt-BR');

        const agendamentosHoje = agendamentos.filter(a => a.data === hoje);
        const agendamentosAmanha = agendamentos.filter(a => a.data === amanhaStr);
        const agendamentosSemana = agendamentos.filter(a => {
            const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
            const hoje = new Date();
            const fimSemana = new Date(hoje);
            fimSemana.setDate(hoje.getDate() + 7);
            return dataAgendamento >= hoje && dataAgendamento <= fimSemana;
        });
        const agendamentosMes = agendamentos.filter(a => {
            const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
            const hoje = new Date();
            return dataAgendamento.getMonth() === hoje.getMonth() && dataAgendamento.getFullYear() === hoje.getFullYear();
        });

        // Atualiza os cards
        document.getElementById('agendamentos-hoje').textContent = agendamentosHoje.length;
        document.getElementById('agendamentos-amanha').textContent = agendamentosAmanha.length;
        document.getElementById('agendamentos-semana').textContent = agendamentosSemana.length;
        document.getElementById('agendamentos-mes').textContent = agendamentosMes.length;

        // Atualiza os gráficos
        atualizarGraficos(agendamentos);
    } catch (error) {
        console.error('Erro ao carregar dados:', error.message);
        alert('Erro ao carregar dados do dashboard.');
    }
}

// Função para atualizar os gráficos
function atualizarGraficos(agendamentos) {
    // Agrupa agendamentos por dia da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const agendamentosPorDia = diasSemana.map(dia => {
        return agendamentos.filter(a => {
            const data = new Date(a.data.split('/').reverse().join('-'));
            return diasSemana[data.getDay()] === dia;
        }).length;
    });

    // Gráfico de Agendamentos por Dia
    const agendamentosCtx = document.getElementById('agendamentosChart').getContext('2d');
    new Chart(agendamentosCtx, {
        type: 'line',
        data: {
            labels: diasSemana,
            datasets: [{
                label: 'Agendamentos',
                data: agendamentosPorDia,
                backgroundColor: 'rgba(255, 111, 97, 0.2)',
                borderColor: 'rgba(255, 111, 97, 1)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Agrupa agendamentos por serviço
    const servicos = {};
    agendamentos.forEach(a => {
        a.servicos.forEach(servico => {
            if (servicos[servico]) {
                servicos[servico]++;
            } else {
                servicos[servico] = 1;
            }
        });
    });

    const servicosLabels = Object.keys(servicos);
    const servicosData = Object.values(servicos);

    // Gráfico de Serviços Mais Populares
    const servicosCtx = document.getElementById('servicosChart').getContext('2d');
    new Chart(servicosCtx, {
        type: 'bar',
        data: {
            labels: servicosLabels,
            datasets: [{
                label: 'Serviços',
                data: servicosData,
                backgroundColor: 'rgba(255, 111, 97, 0.5)',
                borderColor: 'rgba(255, 111, 97, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }