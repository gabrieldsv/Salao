// Declare o supabaseClient globalmente
let supabaseClient;

// Função para inicializar o Supabase e carregar a página
window.onload = function() {
    const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';

    // Inicialize o Supabase
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    if (document.getElementById('dashboard')) {
        atualizarDashboard();
    } else if (document.getElementById('form-agendamento')) {
        // Aplicar máscaras
        if (typeof $ !== 'undefined') {
            $('#telefone').mask('(00) 00000-0000');
            $('#data').mask('00/00/0000');
            $('#horario').mask('00:00');
        } else {
            console.error('jQuery não foi carregado.');
        }

        carregarServicos();
        mostrarAgendamentos();

        document.getElementById('form-agendamento').addEventListener('submit', async function(event) {
            event.preventDefault();

            const editIndex = document.getElementById('edit-index').value;
            const nome = document.getElementById('nome').value;
            const telefone = document.getElementById('telefone').value;
            const data = document.getElementById('data').value;
            const horario = document.getElementById('horario').value;
            const checkboxes = document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]:checked');
            const servicos = Array.from(checkboxes).map(cb => cb.value);
            const recorrencia = parseInt(document.getElementById('recorrencia').value) || 0;

            if (servicos.length === 0) {
                alert('Selecione pelo menos um serviço!');
                return;
            }

            const agendamento = { nome, telefone, data, horario, servicos };

            try {
                if (editIndex === '') {
                    const { error } = await supabaseClient.from('agendamentos').insert([agendamento]);
                    if (error) throw error;

                    if (recorrencia > 0) {
                        let dataBase = new Date(data.split('/').reverse().join('-'));
                        for (let i = 1; i <= recorrencia; i++) {
                            let novaData = new Date(dataBase);
                            novaData.setDate(dataBase.getDate() + (i * 7));
                            let dataFormatada = novaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            const { error: recurrError } = await supabaseClient.from('agendamentos').insert([{ ...agendamento, data: dataFormatada }]);
                            if (recurrError) throw recurrError;
                        }
                    }
                } else {
                    const { error } = await supabaseClient.from('agendamentos').update(agendamento).eq('id', editIndex);
                    if (error) throw error;
                }

                mostrarAgendamentos();
                limparFormulario();
            } catch (error) {
                console.error('Erro ao salvar agendamento:', error.message);
                alert('Erro ao salvar agendamento: ' + error.message);
            }
        });

        document.getElementById('busca').addEventListener('input', function() {
            mostrarAgendamentos(this.value.toLowerCase());
        });

        document.getElementById('btn-adicionar-servico').addEventListener('click', adicionarServico);
    } else if (document.getElementById('detalhes')) {
        mostrarDetalhes();
    }
};

// Função para mostrar agendamentos
async function mostrarAgendamentos(filtro = '') {
    const lista = document.getElementById('agendamentos');
    lista.innerHTML = '';

    const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
    if (error) {
        console.error('Erro ao buscar agendamentos:', error.message);
        return;
    }

    agendamentos.forEach(agendamento => {
        let servicosTexto = agendamento.servicos ? agendamento.servicos.join(', ') : 'Serviço não especificado';
        const textoCompleto = `${agendamento.nome} - ${agendamento.telefone} - ${servicosTexto} - ${agendamento.data} às ${agendamento.horario}`;
        if (filtro === '' || textoCompleto.toLowerCase().includes(filtro)) {
            const item = document.createElement('li');
            item.innerHTML = `${textoCompleto}
                <div>
                    <button class="btn-editar" onclick="editarAgendamento(${agendamento.id})">Editar</button>
                    <button class="btn-excluir" onclick="excluirAgendamento(${agendamento.id})">Excluir</button>
                </div>`;
            lista.appendChild(item);
        }
    });
}

// Função para carregar serviços
async function carregarServicos() {
    const containerCheckboxes = document.getElementById('servicos-checkboxes');
    const listaServicos = document.getElementById('lista-servicos');
    const { data: servicos, error } = await supabaseClient.from('servicos').select('*');
    if (error) {
        console.error('Erro ao buscar serviços:', error.message);
        return;
    }

    containerCheckboxes.innerHTML = '';
    listaServicos.innerHTML = '';

    servicos.forEach(servico => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = servico.nome;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(servico.nome));
        containerCheckboxes.appendChild(label);

        const li = document.createElement('li');
        li.textContent = servico.nome;
        const btnDeletar = document.createElement('button');
        btnDeletar.textContent = 'Deletar';
        btnDeletar.onclick = () => deletarServico(servico.id);
        li.appendChild(btnDeletar);
        listaServicos.appendChild(li);
    });
}

// Função para adicionar serviço
async function adicionarServico() {
    const novoServico = document.getElementById('novo-servico').value.trim();
    if (novoServico === '') return;

    try {
        const { data: existing, error: fetchError } = await supabaseClient.from('servicos').select('*').eq('nome', novoServico);
        if (fetchError) throw fetchError;

        if (!existing.length) {
            const { error: insertError } = await supabaseClient.from('servicos').insert([{ nome: novoServico }]);
            if (insertError) throw insertError;
            carregarServicos();
            document.getElementById('novo-servico').value = '';
        }
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error.message);
        alert('Erro ao adicionar serviço: ' + error.message);
    }
}

// Função para deletar serviço
async function deletarServico(id) {
    try {
        const { error } = await supabaseClient.from('servicos').delete().eq('id', id);
        if (error) throw error;
        carregarServicos();
    } catch (error) {
        console.error('Erro ao deletar serviço:', error.message);
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
        document.getElementById('data').value = agendamento.data;
        document.getElementById('horario').value = agendamento.horario;

        const checkboxes = document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = agendamento.servicos.includes(cb.value);
        });

        document.getElementById('recorrencia').value = 0;
        document.getElementById('form-title').textContent = 'Editar Agendamento';
        document.getElementById('btn-salvar').textContent = 'Salvar Alterações';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao editar agendamento:', error.message);
    }
}

// Função para excluir agendamento
async function excluirAgendamento(id) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
            if (error) throw error;
            mostrarAgendamentos();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error.message);
        }
    }
}

// Função para limpar formulário
function limparFormulario() {
    document.getElementById('form-agendamento').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = 'Novo Agendamento';
    document.getElementById('btn-salvar').textContent = 'Cadastrar';
}

// Função para atualizar dashboard (simplificada para exemplo)
async function atualizarDashboard() {
    const hoje = new Date('2025-02-22'); // Substitua por new Date() em produção
    const hojeStr = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const proximaSegunda = new Date(hoje);
    proximaSegunda.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7 || 7));
    const fimSemanaQueVem = new Date(proximaSegunda);
    fimSemanaQueVem.setDate(proximaSegunda.getDate() + 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
    if (error) {
        console.error('Erro ao buscar agendamentos:', error.message);
        return;
    }

    const listaHoje = document.getElementById('agendamentos-hoje');
    const listaAmanha = document.getElementById('agendamentos-amanha');
    const listaSemana = document.getElementById('agendamentos-semana');
    const listaMes = document.getElementById('agendamentos-mes');
    listaHoje.innerHTML = '';
    listaAmanha.innerHTML = '';
    listaSemana.innerHTML = '';
    listaMes.innerHTML = '';

    const agendamentosHoje = agendamentos.filter(a => a.data === hojeStr);
    const agendamentosAmanha = agendamentos.filter(a => a.data === amanhaStr);
    const agendamentosSemana = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
        return dataAgendamento >= proximaSegunda && dataAgendamento <= fimSemanaQueVem;
    });
    const agendamentosMes = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
        return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
    });

    function renderizarLista(listaElemento, agendamentosLista, botaoId) {
        listaElemento.innerHTML = '';
        agendamentosLista.slice(0, 5).forEach(agendamento => {
            let servicosTexto = agendamento.servicos ? agendamento.servicos.join(', ') : 'Serviço não especificado';
            const item = document.createElement('li');
            item.textContent = `${agendamento.nome} - ${servicosTexto} - ${agendamento.horario}`;
            listaElemento.appendChild(item);
        });
        const botao = document.getElementById(botaoId);
        if (agendamentosLista.length > 5) {
            botao.style.display = 'block';
        } else {
            botao.style.display = 'none';
        }
    }

    renderizarLista(listaHoje, agendamentosHoje, 'mostrar-mais-hoje');
    renderizarLista(listaAmanha, agendamentosAmanha, 'mostrar-mais-amanha');
    renderizarLista(listaSemana, agendamentosSemana, 'mostrar-mais-semana');
    renderizarLista(listaMes, agendamentosMes, 'mostrar-mais-mes');
}

// Função para mostrar detalhes (simplificada para exemplo)
async function mostrarDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    const lista = document.getElementById('lista-detalhes');
    const titulo = document.getElementById('titulo-detalhes');
    lista.innerHTML = '';

    const hoje = new Date('2025-02-22'); // Substitua por new Date() em produção
    const hojeStr = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const amanhaStr = amanha.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const proximaSegunda = new Date(hoje);
    proximaSegunda.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7 || 7));
    const fimSemanaQueVem = new Date(proximaSegunda);
    fimSemanaQueVem.setDate(proximaSegunda.getDate() + 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const { data: agendamentos, error } = await supabaseClient.from('agendamentos').select('*');
    if (error) {
        console.error('Erro ao buscar agendamentos:', error.message);
        return;
    }

    let filteredAgendamentos = [];
    switch (categoria) {
        case 'hoje':
            filteredAgendamentos = agendamentos.filter(a => a.data === hojeStr);
            titulo.textContent = 'Agendamentos de Hoje';
            break;
        case 'amanha':
            filteredAgendamentos = agendamentos.filter(a => a.data === amanhaStr);
            titulo.textContent = 'Agendamentos de Amanhã';
            break;
        case 'semana':
            filteredAgendamentos = agendamentos.filter(a => {
                const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
                return dataAgendamento >= proximaSegunda && dataAgendamento <= fimSemanaQueVem;
            });
            titul.textContent = 'Agendamentos da Semana que Vem';
            break;
        case 'mes':
            filteredAgendamentos = agendamentos.filter(a => {
                const dataAgendamento = new Date(a.data.split('/').reverse().join('-'));
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
        const item = document.createElement('li');
        item.textContent = `${agendamento.nome} - ${agendamento.telefone} - ${servicosTexto} - ${agendamento.data} às ${agendamento.horario}`;
        lista.appendChild(item);
    });
}