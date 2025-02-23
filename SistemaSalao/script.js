// Declare o supabaseClient globalmente
let supabaseClient;

window.onload = function() {
    // Inicializa o Supabase com as chaves do config.js
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Verifica a sessão do usuário
    checkUserSession();

    if (document.getElementById('dashboard')) {
        atualizarDashboard();
    } else if (document.getElementById('form-agendamento')) {
        if (typeof $ !== 'undefined') {
            $('#telefone').mask('(00) 0 0000-0000');
        } else {
            console.error('jQuery não foi carregado.');
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
        const userNameElements = document.querySelectorAll('#user-name');
        userNameElements.forEach(element => {
            element.textContent = `👤 ${user.email.split('@')[0]}`;
        });
    } else if (!document.getElementById('form-login') && !document.getElementById('form-registro')) {
        window.location.href = 'login.html';
    }
}

// Função para carregar serviços
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

// Função para salvar agendamento
async function salvarAgendamento(event) {
    event.preventDefault();
    const editIndex = document.getElementById('edit-index').value;
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const data = document.getElementById('data').value; // Formato YYYY-MM-DD
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
        if (window.location.pathname.includes('index.html')) {
            atualizarDashboard();
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error.message);
        alert('Erro ao salvar agendamento: ' + error.message);
    }
}

// Função para adicionar serviço
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
        alert('Erro ao adicionar serviço: ' + error.message);
    }
}

// Função para abrir modal
function abrirModal() {
    document.getElementById('modal-servico').style.display = 'block';
}

// Função para fechar modal
function fecharModal() {
    document.getElementById('modal-servico').style.display = 'none';
}

// Função para configurar o modal
function configurarModal() {
    const modal = document.getElementById('modal-servico');
    const spanFechar = document.getElementsByClassName('close')[0];
    spanFechar.onclick = fecharModal;
    window.onclick = function(event) {
        if (event.target === modal) {
            fecharModal();
        }
    };
}

// Função para limpar formulário
function limparFormulario() {
    document.getElementById('form-agendamento').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = 'Novo Agendamento';
    document.getElementById('btn-salvar').textContent = 'Salvar';
}

// Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
function formatarData(data) {
    const partes = data.split('-');
    if (partes.length === 3) {
        const [ano, mes, dia] = partes;
        return `${dia}/${mes}/${ano}`;
    }
    return data; // Retorna como está se não puder formatar
}

// Função para atualizar dashboard
async function atualizarDashboard() {
    try {
        // Busca todos os agendamentos
        const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
        if (error) throw error;

        // Logs para depuração
        console.log('Total de agendamentos carregados:', agendamentos.length);
        console.log('Dados brutos dos agendamentos:', agendamentos);

        // Verificar se os agendamentos existem e têm dados válidos
        if (!agendamentos || agendamentos.length === 0) {
            console.warn('Nenhum agendamento encontrado no Supabase.');
        }

        // Ordenar agendamentos por data e hora
        agendamentos.sort((a, b) => {
            const dataA = new Date(`${a.data}T${a.horario}`);
            const dataB = new Date(`${b.data}T${b.horario}`);
            return dataA - dataB;
        });

        console.log('Agendamentos ordenados:', agendamentos);

        // Atualizar total de agendamentos
        const totalAgendamentosElement = document.getElementById('total-agendamentos');
        if (totalAgendamentosElement) {
            totalAgendamentosElement.textContent = agendamentos.length;
        } else {
            console.error('Elemento total-agendamentos não encontrado.');
        }

        // Exibir todos os agendamentos
        const listaTodos = document.getElementById('todos-agendamentos-lista');
        if (!listaTodos) {
            console.error('Elemento todos-agendamentos-lista não encontrado.');
            return;
        }

        listaTodos.innerHTML = '';
        agendamentos.forEach(agendamento => {
            console.log('Processando agendamento:', agendamento);

            // Verificar se os campos existem e são válidos
            const nome = agendamento.nome || 'Nome não informado';
            const data = agendamento.data || 'Data não informada';
            const horario = agendamento.horario || 'Horário não informado';
            const servicos = Array.isArray(agendamento.servicos) ? agendamento.servicos.join(', ') : 'Serviços não informados';

            // Formatar a data para DD/MM/YYYY
            const dataFormatada = formatarData(data);

            const li = document.createElement('li');
            li.innerHTML = `${dataFormatada} - ${horario} - ${nome} - ${servicos}
                            <div>
                                <button class="edit-btn" onclick="editarAgendamento(${agendamento.id})">Editar</button>
                                <button class="delete-btn" onclick="excluirAgendamento(${agendamento.id})">Excluir</button>
                            </div>`;
            listaTodos.appendChild(li);
        });

        if (agendamentos.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Nenhum agendamento encontrado.';
            listaTodos.appendChild(li);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error.message);
        alert('Erro ao carregar dashboard: ' + error.message);
    }
}

// Função para editar agendamento
async function editarAgendamento(id) {
    try {
        const { data: agendamento, error } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('edit-index').value = id;
        document.getElementById('nome').value = agendamento.nome;
        document.getElementById('telefone').value = agendamento.telefone;
        document.getElementById('data').value = agendamento.data; // Mantém YYYY-MM-DD para o input
        document.getElementById('horario').value = agendamento.horario;

        const checkboxes = document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = agendamento.servicos.includes(cb.value);
        });

        document.getElementById('form-title').textContent = 'Editar Agendamento';
        document.getElementById('btn-salvar').textContent = 'Atualizar';
        window.location.href = 'agendar.html';
    } catch (error) {
        console.error('Erro ao editar agendamento:', error.message);
        alert('Erro ao editar agendamento: ' + error.message);
    }
}

// Função para excluir agendamento
async function excluirAgendamento(id) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
            if (error) throw error;
            alert('Agendamento excluído com sucesso!');
            atualizarDashboard();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error.message);
            alert('Erro ao excluir agendamento: ' + error.message);
        }
    }
}

// Função para mostrar detalhes
async function mostrarDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    const lista = document.getElementById('lista-detalhes');
    const titulo = document.getElementById('titulo-detalhes');
    lista.innerHTML = '';

    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];
    const proximaSegunda = new Date();
    proximaSegunda.setDate(proximaSegunda.getDate() + ((1 + 7 - proximaSegunda.getDay()) % 7 || 7));
    const fimSemanaQueVem = new Date(proximaSegunda);
    fimSemanaQueVem.setDate(proximaSegunda.getDate() + 6);
    const inicioMes = new Date(proximaSegunda.getFullYear(), proximaSegunda.getMonth(), 1);
    const fimMes = new Date(proximaSegunda.getFullYear(), proximaSegunda.getMonth() + 1, 0);

    try {
        const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
        if (error) throw error;

        let filteredAgendamentos = [];
        switch (categoria) {
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
                    const dataAgendamento = new Date(a.data);
                    return dataAgendamento >= proximaSegunda && dataAgendamento <= fimSemanaQueVem;
                });
                titulo.textContent = 'Agendamentos da Próxima Semana';
                break;
            case 'mes':
                filteredAgendamentos = agendamentos.filter(a => {
                    const dataAgendamento = new Date(a.data);
                    return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
                });
                titulo.textContent = 'Agendamentos deste Mês';
                break;
            default:
                filteredAgendamentos = agendamentos;
                titulo.textContent = 'Todos os Agendamentos';
        }

        filteredAgendamentos.forEach(agendamento => {
            let servicosTexto = agendamento.servicos ? agendamento.servicos.join(', ') : 'Serviço não especificado';
            const dataFormatada = formatarData(agendamento.data); // Formatar para DD/MM/YYYY
            const item = document.createElement('li');
            item.textContent = `${agendamento.nome} - ${agendamento.telefone} - ${servicosTexto} - ${dataFormatada} às ${agendamento.horario}`;
            lista.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error.message);
        alert('Erro ao carregar detalhes: ' + error.message);
    }
}

// Função para login
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
        alert('Erro ao fazer login: ' + error.message);
    }
}

// Função para registro
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
        alert('Erro ao registrar: ' + error.message);
    }
}