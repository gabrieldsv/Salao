window.onload = function() {
    $('#telefone').mask('(00) 00000-0000');
    $('#data').mask('00/00/0000');
    $('#horario').mask('00:00');

    carregarServicos();
    mostrarAgendamentos();
    atualizarDashboard();

    document.getElementById('form-agendamento').addEventListener('submit', function(event) {
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

        let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];

        const adicionarAgendamento = (dataAgendamento) => {
            const agendamento = {
                nome: nome,
                telefone: telefone,
                data: dataAgendamento,
                horario: horario,
                servicos: servicos
            };
            if (editIndex === '') {
                agendamentos.push(agendamento);
            } else {
                agendamentos[editIndex] = agendamento;
            }
        };

        adicionarAgendamento(data);

        if (recorrencia > 0) {
            let dataBase = new Date(data.split('/').reverse().join('-'));
            for (let i = 1; i <= recorrencia; i++) {
                let novaData = new Date(dataBase);
                novaData.setDate(dataBase.getDate() + (i * 7));
                let dataFormatada = novaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                adicionarAgendamento(dataFormatada);
            }
        }

        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        mostrarAgendamentos();
        atualizarDashboard();
        limparFormulario();
    });

    document.getElementById('busca').addEventListener('input', function() {
        mostrarAgendamentos(this.value.toLowerCase());
    });
};

function mostrarAgendamentos(filtro = '') {
    const lista = document.getElementById('agendamentos');
    lista.innerHTML = '';

    const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
    
    agendamentos.forEach((agendamento, index) => {
        let servicosTexto = '';
        if (agendamento.servicos && Array.isArray(agendamento.servicos)) {
            servicosTexto = agendamento.servicos.join(', ');
        } else if (agendamento.servico) {
            servicosTexto = agendamento.servico;
        } else {
            servicosTexto = 'Serviço não especificado';
        }

        const textoCompleto = `${agendamento.nome} - ${agendamento.telefone} - ${servicosTexto} - ${agendamento.data} às ${agendamento.horario}`;
        if (filtro === '' || textoCompleto.toLowerCase().includes(filtro)) {
            const item = document.createElement('li');
            item.innerHTML = `${textoCompleto}
                <div>
                    <button class="btn-editar" onclick="editarAgendamento(${index})">Editar</button>
                    <button class="btn-excluir" onclick="excluirAgendamento(${index})">Excluir</button>
                </div>`;
            lista.appendChild(item);
        }
    });
}

function atualizarDashboard() {
    const hoje = new Date('2025-02-22'); // Data fixa para teste (substitua por new Date() em produção)
    const hojeStr = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const proximaSegunda = new Date(hoje);
    proximaSegunda.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7 || 7));
    const fimSemanaQueVem = new Date(proximaSegunda);
    fimSemanaQueVem.setDate(proximaSegunda.getDate() + 6);

    const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
    
    const listaHoje = document.getElementById('agendamentos-hoje');
    const listaSemana = document.getElementById('agendamentos-semana');
    listaHoje.innerHTML = '';
    listaSemana.innerHTML = '';

    agendamentos.forEach(agendamento => {
        let servicosTexto = agendamento.servicos ? agendamento.servicos.join(', ') : agendamento.servico || 'Serviço não especificado';
        const dataAgendamento = new Date(agendamento.data.split('/').reverse().join('-'));
        
        const item = document.createElement('li');
        item.textContent = `${agendamento.nome} - ${servicosTexto} - ${agendamento.horario}`;

        if (agendamento.data === hojeStr) {
            listaHoje.appendChild(item.cloneNode(true));
        }
        
        if (dataAgendamento >= proximaSegunda && dataAgendamento <= fimSemanaQueVem) {
            listaSemana.appendChild(item.cloneNode(true));
        }
    });
}

function carregarServicos() {
    const containerCheckboxes = document.getElementById('servicos-checkboxes');
    const listaServicos = document.getElementById('lista-servicos');
    let servicos = JSON.parse(localStorage.getItem('servicos')) || ['Corte de Cabelo', 'Coloração', 'Manicure', 'Pedicure'];

    containerCheckboxes.innerHTML = '';
    listaServicos.innerHTML = '';

    servicos.forEach(servico => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = servico;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(servico));
        containerCheckboxes.appendChild(label);

        const li = document.createElement('li');
        li.textContent = servico;
        const btnDeletar = document.createElement('button');
        btnDeletar.textContent = 'Deletar';
        btnDeletar.onclick = () => deletarServico(servico);
        li.appendChild(btnDeletar);
        listaServicos.appendChild(li);
    });
}

function adicionarServico() {
    const novoServico = document.getElementById('novo-servico').value.trim();
    if (novoServico === '') return;

    let servicos = JSON.parse(localStorage.getItem('servicos')) || [];
    if (!servicos.includes(novoServico)) {
        servicos.push(novoServico);
        localStorage.setItem('servicos', JSON.stringify(servicos));
        carregarServicos();
        document.getElementById('novo-servico').value = '';
    }
}

function deletarServico(servico) {
    let servicos = JSON.parse(localStorage.getItem('servicos')) || [];
    servicos = servicos.filter(s => s !== servico);
    localStorage.setItem('servicos', JSON.stringify(servicos));
    carregarServicos();
}

function editarAgendamento(index) {
    const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
    const agendamento = agendamentos[index];

    document.getElementById('edit-index').value = index;
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
}

function excluirAgendamento(index) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
        agendamentos.splice(index, 1);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        mostrarAgendamentos();
        atualizarDashboard();
    }
}

function limparFormulario() {
    document.getElementById('form-agendamento').reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('form-title').textContent = 'Novo Agendamento';
    document.getElementById('btn-salvar').textContent = 'Cadastrar';
}