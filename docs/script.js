// Declare o supabaseClient e outras variáveis globalmente
let supabaseClient;
let todosAgendamentos = [];
let todosServicos = [];
let todosClientes = [];
let servicosChartInstance = null; // Armazena a instância do gráfico

window.onload = function() {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    checkUserSession();
    if (document.getElementById('dashboard')) {
        carregarDashboard();
    } else if (document.getElementById('form-agendamento')) {
        if (typeof $ !== 'undefined') {
            $('#novo-telefone').mask('(00) 0 0000-0000');
        }
        carregarServicos();
        carregarClientes();
        configurarModal();
        document.getElementById('form-agendamento').addEventListener('submit', salvarAgendamento);
        document.getElementById('btn-adicionar-servico').addEventListener('click', () => abrirModal('add'));
        document.getElementById('btn-excluir-servico').addEventListener('click', () => abrirModal('delete'));
        document.getElementById('form-novo-servico').addEventListener('submit', adicionarServico);
        document.getElementById('form-excluir-servico').addEventListener('submit', excluirServico);
        document.getElementById('form-novo-cliente').addEventListener('submit', cadastrarCliente);
    } else if (document.getElementById('detalhes-tbody')) {
        carregarDetalhes();
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

// Função para carregar o dashboard com retry apenas para o Supabase
async function carregarDashboard() {
    let tentativas = 0;
    const maxTentativas = 3;
    let agendamentos;

    while (tentativas < maxTentativas) {
        try {
            console.log(`Tentativa ${tentativas + 1} de carregar os agendamentos...`);
            const { data, error } = await supabaseClient.from('agendamentos').select('*');
            if (error) throw error;
            console.log('Agendamentos carregados com sucesso:', data);
            agendamentos = data || [];
            break;
        } catch (error) {
            tentativas++;
            console.error(`Tentativa ${tentativas} falhou:`, error.message);
            if (tentativas === maxTentativas) {
                console.error('Todas as tentativas falharam. Detalhes do erro:', error);
                alert('Erro persistente ao carregar os agendamentos do Supabase.');
                agendamentos = [];
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    todosAgendamentos = agendamentos;
    atualizarCards(todosAgendamentos);
    try {
        atualizarGraficos(todosAgendamentos);
    } catch (error) {
        console.error('Erro ao atualizar o gráfico:', error.message);
        alert('Erro ao renderizar o gráfico.');
    }
    filtrarTabela();
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
    const servicos = {};
    agendamentos.forEach(a => a.servicos.forEach(s => servicos[s] = (servicos[s] || 0) + 1));
    const servicosLabels = Object.keys(servicos);
    const servicosData = Object.values(servicos);

    const servicosCtx = document.getElementById('servicosChart').getContext('2d');
    if (servicosChartInstance) {
        servicosChartInstance.destroy();
    }
    servicosChartInstance = new Chart(servicosCtx, {
        type: 'bar',
        data: {
            labels: servicosLabels,
            datasets: [{
                label: 'Serviços',
                data: servicosData,
                backgroundColor: 'rgba(98, 0, 234, 0.5)',
                borderColor: '#6200EA',
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

// Função para filtrar a tabela no dashboard
function filtrarTabela() {
    const periodo = document.getElementById('filtro-periodo').value;
    const busca = document.getElementById('busca-agendamento').value.toLowerCase();
    const tbody = document.getElementById('agendamentos-tbody');
    tbody.innerHTML = '';

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const inicioSemana = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(inicioSemana.getDate() + 7);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    let filteredAgendamentos = todosAgendamentos;
    switch (periodo) {
        case 'hoje':
            filteredAgendamentos = todosAgendamentos.filter(a => a.data === hoje);
            break;
        case 'amanha':
            filteredAgendamentos = todosAgendamentos.filter(a => a.data === amanhaStr);
            break;
        case 'semana':
            filteredAgendamentos = todosAgendamentos.filter(a => {
                const dataAgendamento = formatarDataParaComparacao(a.data);
                return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
            });
            break;
        case 'mes':
            filteredAgendamentos = todosAgendamentos.filter(a => {
                const dataAgendamento = formatarDataParaComparacao(a.data);
                return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
            });
            break;
        default:
            filteredAgendamentos = todosAgendamentos;
    }

    if (busca) {
        filteredAgendamentos = filteredAgendamentos.filter(a => 
            a.nome.toLowerCase().includes(busca) || 
            a.servicos.some(s => s.toLowerCase().includes(busca))
        );
    }

    filteredAgendamentos.forEach(a => {
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

// Funções para clientes
async function carregarClientes() {
    const { data: clientes, error } = await supabaseClient.from('cadastros').select('*');
    if (error) {
        console.error('Erro ao carregar clientes:', error.message);
        return;
    }
    todosClientes = clientes;
    const select = document.getElementById('clientes-lista');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nome} - ${cliente.telefone}`;
        select.appendChild(option);
    });
}

async function cadastrarCliente(event) {
    event.preventDefault();
    const nome = document.getElementById('novo-nome').value.trim();
    const telefone = document.getElementById('novo-telefone').value.trim();
    if (!nome || !telefone) {
        alert('Preencha todos os campos!');
        return;
    }

    try {
        const { data, error } = await supabaseClient.from('cadastros').insert([{ nome, telefone }]).select();
        if (error) throw error;
        alert('Cliente cadastrado com sucesso!');
        document.getElementById('form-novo-cliente').reset();
        fecharModalClientes();
        await carregarClientes();
        selecionarClienteAutomaticamente(data[0].id);
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error.message);
        alert('Erro ao cadastrar cliente.');
    }
}

function abrirModalClientes() {
    document.getElementById('modal-clientes').classList.add('active');
    document.getElementById('escolher-cliente').style.display = 'none';
    document.getElementById('form-novo-cliente').style.display = 'none';
}

function fecharModalClientes() {
    document.getElementById('modal-clientes').classList.remove('active');
}

function mostrarEscolherCliente() {
    document.getElementById('escolher-cliente').style.display = 'block';
    document.getElementById('form-novo-cliente').style.display = 'none';
}

function mostrarCadastrarCliente() {
    document.getElementById('escolher-cliente').style.display = 'none';
    document.getElementById('form-novo-cliente').style.display = 'block';
}

function selecionarCliente() {
    const clienteId = document.getElementById('clientes-lista').value;
    if (!clienteId) {
        alert('Selecione um cliente!');
        return;
    }
    selecionarClienteAutomaticamente(clienteId);
    fecharModalClientes();
}

function selecionarClienteAutomaticamente(clienteId) {
    const cliente = todosClientes.find(c => c.id == clienteId);
    if (cliente) {
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-selecionado').textContent = `${cliente.nome} - ${cliente.telefone}`;
    }
}

// Funções para agendamento
async function carregarServicos() {
    const container = document.getElementById('servicos-checkboxes');
    const { data: servicos, error } = await supabaseClient.from('servicos').select('*');
    if (error) {
        console.error('Erro ao carregar serviços:', error.message);
        return;
    }
    todosServicos = servicos;
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

    const selectExcluir = document.getElementById('servico-excluir');
    selectExcluir.innerHTML = '<option value="">Selecione um serviço</option>';
    servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = servico.nome;
        selectExcluir.appendChild(option);
    });
}

function formatarDataParaSupabase(dataInput) {
    const [ano, mes, dia] = dataInput.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function salvarAgendamento(event) {
    event.preventDefault();
    const editIndex = document.getElementById('edit-index').value;
    const clienteId = document.getElementById('cliente-id').value;
    const dataInput = document.getElementById('data').value;
    const data = formatarDataParaSupabase(dataInput);
    const horario = document.getElementById('horario').value;
    const servicos = Array.from(document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!clienteId) {
        alert('Selecione ou cadastre um cliente!');
        return;
    }
    if (servicos.length === 0) {
        alert('Selecione pelo menos um serviço!');
        return;
    }

    const cliente = todosClientes.find(c => c.id == clienteId);
    const agendamento = { cliente_id: parseInt(clienteId), nome: cliente.nome, telefone: cliente.telefone, data, horario, servicos };

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
        if (window.location.pathname.includes('index.html')) carregarDashboard();
        else if (window.location.pathname.includes('detalhes.html')) carregarDetalhes();
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

async function excluirServico(event) {
    event.preventDefault();
    const servicoId = document.getElementById('servico-excluir').value;
    if (!servicoId) {
        alert('Selecione um serviço para excluir!');
        return;
    }

    try {
        const { error } = await supabaseClient.from('servicos').delete().eq('id', servicoId);
        if (error) throw error;
        alert('Serviço excluído com sucesso!');
        fecharModal();
        carregarServicos();
    } catch (error) {
        console.error('Erro ao excluir serviço:', error.message);
        alert('Erro ao excluir serviço.');
    }
}

function abrirModalServicos() {
    document.getElementById('modal-selecionar-servicos').classList.add('active');
}

function fecharModalServicos() {
    document.getElementById('modal-selecionar-servicos').classList.remove('active');
}

function abrirModal(mode) {
    const modal = document.getElementById('modal-servico');
    const title = document.getElementById('modal-title');
    const formAdd = document.getElementById('form-novo-servico');
    const formDelete = document.getElementById('form-excluir-servico');
    
    if (mode === 'add') {
        title.textContent = 'Adicionar Novo Serviço';
        formAdd.style.display = 'block';
        formDelete.style.display = 'none';
    } else {
        title.textContent = 'Excluir Serviço';
        formAdd.style.display = 'none';
        formDelete.style.display = 'block';
    }
    modal.classList.add('active');
}

function fecharModal() {
    document.getElementById('modal-servico').classList.remove('active');
}

function configurarModal() {
    const modalServico = document.getElementById('modal-servico');
    const modalClientes = document.getElementById('modal-clientes');
    window.onclick = function(event) {
        if (event.target === modalServico) fecharModal();
        if (event.target === modalClientes) fecharModalClientes();
    };
}

function limparFormulario() {
    document.getElementById('form-agendamento').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = 'Novo Agendamento';
    document.getElementById('btn-salvar').textContent = 'Salvar';
    document.getElementById('cliente-id').value = '';
    document.getElementById('cliente-selecionado').textContent = 'Nenhum cliente selecionado';
    document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
}

async function editarAgendamento(id) {
    try {
        const { data: agendamento, error } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('edit-nome').value = agendamento.nome;
        document.getElementById('edit-telefone').value = agendamento.telefone;
        const dataFormatted = agendamento.data.split('/').reverse().join('-');
        document.getElementById('edit-data').value = dataFormatted;
        document.getElementById('edit-horario').value = agendamento.horario;

        const modal = document.getElementById('modal-editar-agendamento');
        modal.classList.add('active');

        document.getElementById('form-editar-agendamento').onsubmit = async function(event) {
            event.preventDefault();
            const nome = document.getElementById('edit-nome').value;
            const telefone = document.getElementById('edit-telefone').value;
            const dataInput = document.getElementById('edit-data').value;
            const data = formatarDataParaSupabase(dataInput);
            const horario = document.getElementById('edit-horario').value;

            const { error } = await supabaseClient.from('agendamentos').update({ nome, telefone, data, horario }).eq('id', id);
            if (error) throw error;

            alert('Agendamento atualizado com sucesso!');
            modal.classList.remove('active');
            if (window.location.pathname.includes('index.html')) carregarDashboard();
            else if (window.location.pathname.includes('detalhes.html')) carregarDetalhes();
        };
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
            if (window.location.pathname.includes('index.html')) carregarDashboard();
            else if (window.location.pathname.includes('detalhes.html')) carregarDetalhes();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error.message);
            alert('Erro ao excluir agendamento.');
        }
    }
}

// Função para carregar os dados iniciais da página detalhes
async function carregarDetalhes() {
    try {
        const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
        if (error) throw error;

        todosAgendamentos = agendamentos;
        const urlParams = new URLSearchParams(window.location.search);
        const filtro = urlParams.get('filtro');
        if (filtro) {
            document.getElementById('filtro-periodo').value = filtro;
        }
        filtrarDetalhes();
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error.message);
        alert('Erro ao carregar detalhes.');
    }
}

// Função para filtrar os detalhes na tabela
function filtrarDetalhes() {
    const periodo = document.getElementById('filtro-periodo').value;
    const busca = document.getElementById('busca-detalhes').value.toLowerCase();
    const tbody = document.getElementById('detalhes-tbody');
    tbody.innerHTML = '';

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const inicioSemana = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(inicioSemana.getDate() + 7);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    let filteredAgendamentos = todosAgendamentos;
    switch (periodo) {
        case 'hoje':
            filteredAgendamentos = todosAgendamentos.filter(a => a.data === hoje);
            break;
        case 'amanha':
            filteredAgendamentos = todosAgendamentos.filter(a => a.data === amanhaStr);
            break;
        case 'semana':
            filteredAgendamentos = todosAgendamentos.filter(a => {
                const dataAgendamento = formatarDataParaComparacao(a.data);
                return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
            });
            break;
        case 'mes':
            filteredAgendamentos = todosAgendamentos.filter(a => {
                const dataAgendamento = formatarDataParaComparacao(a.data);
                return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
            });
            break;
        default:
            filteredAgendamentos = todosAgendamentos;
    }

    if (busca) {
        filteredAgendamentos = filteredAgendamentos.filter(a => 
            a.nome.toLowerCase().includes(busca) || 
            a.servicos.some(s => s.toLowerCase().includes(busca))
        );
    }

    filteredAgendamentos.forEach(a => {
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

// Função para toggle da sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}