// Declare o supabaseClient globalmente
let supabaseClient;
let todosAgendamentos = []; // Armazena todos os agendamentos para filtros

window.onload = function() {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    checkUserSession();
    if (document.getElementById('dashboard')) {
        atualizarDashboard();
    } else if (document.getElementById('form-agendamento')) {
        if (typeof $ !== 'undefined') {
            $('#telefone').mask('(00) 0 0000-0000');
        }
        carregarServicos();
        configurarModal();
        document.getElementById('form-agendamento').addEventListener('submit', salvarAgendamento);
        document.getElementById('btn-adicionar-servico').addEventListener('click', abrirModal);
        document.getElementById('form-novo-servico').addEventListener('submit', adicionarServico);
    } else if (document.getElementById('detalhes')) {
        mostrarDetalhes();
    } else if (document.getElementById('form-login')) {
        document.getElementById('form-login').addEventListener('submit', login);
    } else if (document.getElementById('form-registro')) {
        document.getElementById('form-registro').addEventListener('submit', registrar);
    }
};

// Função para verificar a sessão do usuário
async function checkUserSession() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        document.querySelectorAll('#user-name').forEach(el => el.textContent = `👤 ${user.email.split('@')[0]}`);
    } else if (!document.getElementById('form-login') && !document.getElementById('form-registro')) {
        window.location.href = 'login.html';
    }
}

// Função para atualizar o dashboard
async function atualizarDashboard() {
    try {
        const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
        if (error) throw error;

        todosAgendamentos = agendamentos;
        atualizarCards(agendamentos);
        atualizarGraficos(agendamentos);
        filtrarTabela('todos');
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error.message);
        alert('Erro ao carregar dashboard.');
    }
}

// Função para atualizar os cards
function atualizarCards(agendamentos) {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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

    document.getElementById('agendamentos-hoje').textContent = agendamentosHoje.length;
    document.getElementById('agendamentos-amanha').textContent = agendamentosAmanha.length;
    document.getElementById('agendamentos-semana').textContent = agendamentosSemana.length;
    document.getElementById('agendamentos-mes').textContent = agendamentosMes.length;
}

// Função para atualizar os gráficos
function atualizarGraficos(agendamentos) {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const agendamentosPorDia = diasSemana.map(dia => {
        return agendamentos.filter(a => {
            const data = new Date(a.data.split('/').reverse().join('-'));
            return diasSemana[data.getDay()] === dia;
        }).length;
    });

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
        options: { scales: { y: { beginAtZero: true } } }
    });

    const servicos = {};
    agendamentos.forEach(a => a.servicos.forEach(s => servicos[s] = (servicos[s] || 0) + 1));
    const servicosLabels = Object.keys(servicos);
    const servicosData = Object.values(servicos);

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
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Função para formatar data para comparação
function formatarDataParaComparacao(dataStr) {
    return new Date(dataStr.split('/').reverse().join('-'));
}

// Função para filtrar a tabela
function filtrarTabela(periodo = document.getElementById('filtro-periodo').value) {
    const busca = document.getElementById('busca-agendamento').value.toLowerCase();
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const inicioSemana = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(inicioSemana.getDate() + 7);

    let filtered = todosAgendamentos;
    if (periodo === 'hoje') filtered = filtered.filter(a => a.data === hoje);
    else if (periodo === 'amanha') filtered = filtered.filter(a => a.data === amanhaStr);
    else if (periodo === 'semana') filtered = filtered.filter(a => {
        const dataAgendamento = formatarDataParaComparacao(a.data);
        return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    });

    if (busca) {
        filtered = filtered.filter(a => 
            a.nome.toLowerCase().includes(busca) || 
            a.servicos.some(s => s.toLowerCase().includes(busca))
        );
    }

    const tbody = document.getElementById('agendamentos-tbody');
    tbody.innerHTML = '';
    filtered.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.data}</td>
            <td>${a.horario}</td>
            <td>${a.nome}</td>
            <td>${a.servicos.join(', ')}</td>
            <td>
                <button class="edit-btn" onclick="editarAgendamento(${a.id})">Editar</button>
                <button class="delete-btn" onclick="excluirAgendamento(${a.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funções para agendamento
async function carregarServicos() {
    const container = document.getElementById('servicos-checkboxes');
    const { data: servicos, error } = await supabaseClient.from('servicos').select('*');
    if (error) {
        console.error('Erro ao carregar serviços:', error.message);
        return;
    }
    container.innerHTML = '';
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

function formatarDataParaSupabase(dataInput) {
    const [ano, mes, dia] = dataInput.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function salvarAgendamento(event) {
    event.preventDefault();
    const editIndex = document.getElementById('edit-index').value;
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const dataInput = document.getElementById('data').value;
    const data = formatarDataParaSupabase(dataInput);
    const horario = document.getElementById('horario').value;
    const servicos = Array.from(document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);

    if (servicos.length === 0) {
        alert('Selecione pelo menos um serviço!');
        return;
    }

    const agendamento = { nome, telefone, data, horario, servicos };

    try {
        if (editIndex === '') {
            const { error } = await supabaseClient.from('agendamentos').insert([agendamento]);
            if (error) throw error;
            alert('Agendamento salvo com sucesso!');
        } else {
            const { error } = await supabaseClient.from('agendamentos').update(agendamento).eq('id', editIndex);
            if (error) throw error;
            alert('Agendamento atualizado com sucesso!');
        }
        limparFormulario();
        if (window.location.pathname.includes('index.html')) atualizarDashboard();
        else window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error.message);
        alert('Erro ao salvar agendamento.');
    }
}

async function adicionarServico(event) {
    event.preventDefault();
    const novoServico = document.getElementById('novo-servico').value.trim();
    if (!novoServico) {
        alert('Digite o nome do serviço!');
        return;
    }

    try {
        const { error } = await supabaseClient.from('servicos').insert([{ nome: novoServico }]);
        if (error) throw error;
        alert('Serviço adicionado com sucesso!');
        document.getElementById('novo-servico').value = '';
        fecharModal();
        carregarServicos();
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error.message);
        alert('Erro ao adicionar serviço.');
    }
}

function abrirModal() { document.getElementById('modal-servico').style.display = 'block'; }
function fecharModal() { document.getElementById('modal-servico').style.display = 'none'; }
function configurarModal() {
    const modal = document.getElementById('modal-servico');
    const spanFechar = document.getElementsByClassName('close')[0];
    spanFechar.onclick = fecharModal;
    window.onclick = function(event) { if (event.target === modal) fecharModal(); };
}
function limparFormulario() {
    document.getElementById('form-agendamento').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = 'Novo Agendamento';
    document.getElementById('btn-salvar').textContent = 'Salvar';
}

async function editarAgendamento(id) {
    try {
        const { data: agendamento, error } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('edit-index').value = id;
        document.getElementById('nome').value = agendamento.nome;
        document.getElementById('telefone').value = agendamento.telefone;
        const dataFormatted = agendamento.data.split('/').reverse().join('-');
        document.getElementById('data').value = dataFormatted;
        document.getElementById('horario').value = agendamento.horario;

        const checkboxes = document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = agendamento.servicos.includes(cb.value));

        document.getElementById('form-title').textContent = 'Editar Agendamento';
        document.getElementById('btn-salvar').textContent = 'Atualizar';
        window.location.href = 'agendar.html';
    } catch (error) {
        console.error('Erro ao editar agendamento:', error.message);
        alert('Erro ao editar agendamento.');
    }
}

async function excluirAgendamento(id) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
            if (error) throw error;
            alert('Agendamento excluído com sucesso!');
            atualizarDashboard();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error.message);
            alert('Erro ao excluir agendamento.');
        }
    }
}

async function mostrarDetalhes() {
    const periodo = document.getElementById('filtro-periodo').value;
    const busca = document.getElementById('busca-detalhes').value.toLowerCase();
    const lista = document.getElementById('lista-detalhes');
    const titulo = document.getElementById('titulo-detalhes');
    lista.innerHTML = '';

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const inicioSemana = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(inicioSemana.getDate() + 7);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    try {
        const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
        if (error) throw error;

        let filteredAgendamentos = agendamentos;
        switch (periodo) {
            case 'hoje':
                filteredAgendamentos = agendamentos.filter(a => a.data === hoje);
                titulo.textContent = 'Agendamentos de Hoje';
                break;
            case 'amanha':
                filteredAgendamentos = agendamentos.filter(a => a.data === amanhaStr);
                titulo.textContent = 'Agendamentos de Amanhã';
                break;
            case 'semana':
                filteredAgendamentos = agendamentos.filter(a => {
                    const dataAgendamento = formatarDataParaComparacao(a.data);
                    return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
                });
                titulo.textContent = 'Agendamentos da Semana';
                break;
            case 'mes':
                filteredAgendamentos = agendamentos.filter(a => {
                    const dataAgendamento = formatarDataParaComparacao(a.data);
                    return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
                });
                titulo.textContent = 'Agendamentos do Mês';
                break;
            default:
                filteredAgendamentos = agendamentos;
                titulo.textContent = 'Todos os Agendamentos';
        }

        if (busca) {
            filteredAgendamentos = filteredAgendamentos.filter(a => 
                a.nome.toLowerCase().includes(busca) || 
                a.servicos.some(s => s.toLowerCase().includes(busca))
            );
        }

        filteredAgendamentos.forEach(agendamento => {
            const item = document.createElement('li');
            item.textContent = `${agendamento.nome} - ${agendamento.telefone} - ${agendamento.servicos.join(', ')} - ${agendamento.data} às ${agendamento.horario}`;
            lista.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error.message);
        alert('Erro ao carregar detalhes.');
    }
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        alert('Erro ao fazer login.');
    }
}

async function registrar(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });
        if (error) throw error;
        alert('Registro realizado com sucesso! Verifique seu e-mail para confirmar.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao registrar:', error.message);
        alert('Erro ao registrar.');
    }
}