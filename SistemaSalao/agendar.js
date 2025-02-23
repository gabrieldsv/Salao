// Configurações do Supabase
const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';

// Inicializa o cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para carregar serviços
async function carregarServicos() {
    const { data: servicos, error } = await supabase
        .from('servicos')
        .select('*');

    if (error) {
        console.error('Erro ao carregar serviços:', error.message);
        return;
    }

    const container = document.getElementById('servicos-checkboxes');
    container.innerHTML = ''; // Limpa o container antes de adicionar os checkboxes

    servicos.forEach(servico => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = servico.nome;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(servico.nome));
        container.appendChild(label);
    });
}

// Função para salvar agendamento
async function salvarAgendamento(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const servicos = Array.from(document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (servicos.length === 0) {
        alert('Selecione pelo menos um serviço!');
        return;
    }

    const { error } = await supabase
        .from('agendamentos')
        .insert([{ nome, telefone, data, horario, servicos }]);

    if (error) {
        console.error('Erro ao agendar:', error.message);
        alert('Erro ao agendar.');
    } else {
        alert('Agendamento realizado com sucesso!');
        window.location.href = 'index.html';
    }
}

// Configura os eventos ao carregar a página
window.onload = function() {
    carregarServicos();
    document.getElementById('form-agendamento').addEventListener('submit', salvarAgendamento);
};