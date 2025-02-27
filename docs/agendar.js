<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendamento</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }

        .form-container {
            max-width: 600px;
            margin: 0 auto;
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
        }

        input {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }

        /* Estilo para o modal de serviços (quadrado com rolagem) */
        #servicos-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 300px; /* Largura fixa para um formato mais quadrado */
            max-height: 400px; /* Altura máxima para rolagem */
            z-index: 1000;
            display: none; /* Inicialmente oculto */
        }

        #servicos-modal.show {
            display: block;
        }

        #servicos-modal header {
            background: #4a148c;
            color: white;
            padding: 10px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            font-size: 16px;
        }

        #servicos-modal .close-btn {
            position: absolute;
            right: 10px;
            top: 10px;
            cursor: pointer;
            font-size: 18px;
            color: white;
        }

        #servicos-checkboxes {
            padding: 15px;
            max-height: 300px; /* Altura máxima para rolagem dentro do modal */
            overflow-y: auto; /* Ativa a barra de rolagem vertical */
        }

        #servicos-checkboxes label {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        #servicos-checkboxes input[type="checkbox"] {
            margin-right: 10px;
        }

        #servicos-modal button {
            background-color: #4a148c;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 0 0 10px 10px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
        }

        #servicos-modal button:hover {
            background-color: #6a1b9a;
        }

        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            cursor: pointer;
        }

        button:hover {
            background-color: #45a049;
        }

        /* Botão para abrir o modal */
        .open-modal-btn {
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            border: none;
            cursor: pointer;
            margin-right: 10px;
        }

        .open-modal-btn:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Novo Agendamento</h2>
        <form id="form-agendamento">
            <div class="form-group">
                <label for="nome">Cliente:</label>
                <input type="text" id="nome" required placeholder="Escolher ou Cadastrar Cliente">
            </div>
            <div class="form-group">
                <label for="data">Data:</label>
                <input type="date" id="data" required>
            </div>
            <div class="form-group">
                <label for="horario">Horário:</label>
                <input type="time" id="horario" required>
            </div>
            <div class="form-group">
                <label>Serviços:</label>
                <div id="servicos-selecionados"></div>
                <button type="button" class="open-modal-btn" id="open-modal">Selecionar Serviços</button>
                <button type="button" id="clear-services" style="background-color: #f44336;">Excluir Serviços</button>
            </div>
            <button type="submit">Salvar</button>
        </form>
    </div>

    <!-- Modal de seleção de serviços -->
    <div id="servicos-modal">
        <header>
            Selecionar Serviços
            <span class="close-btn" id="close-modal">×</span>
        </header>
        <div id="servicos-checkboxes">
            <!-- Checkboxes serão inseridos aqui pelo JavaScript -->
        </div>
        <button id="confirm-services">Confirmar</button>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        // Configurações do Supabase
        const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';

        // Inicializa o cliente Supabase
        const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        let selectedServices = [];

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
                checkbox.checked = selectedServices.includes(servico.nome);
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(servico.nome));
                container.appendChild(label);
            });
        }

        // Função para salvar agendamento
        async function salvarAgendamento(event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value;
            const data = document.getElementById('data').value;
            const horario = document.getElementById('horario').value;

            if (selectedServices.length === 0) {
                alert('Selecione pelo menos um serviço!');
                return;
            }

            const { error } = await supabase
                .from('agendamentos')
                .insert([{ nome, data, horario, servicos: selectedServices }]);

            if (error) {
                console.error('Erro ao agendar:', error.message);
                alert('Erro ao agendar.');
            } else {
                alert('Agendamento realizado com sucesso!');
                window.location.href = 'index.html';
            }
        }

        // Função para atualizar serviços selecionados no formulário
        function updateSelectedServices() {
            const container = document.getElementById('servicos-selecionados');
            container.innerHTML = selectedServices.length > 0 
                ? `Serviços selecionados: ${selectedServices.join(', ')}` 
                : 'Nenhum serviço selecionado';
        }

        // Gerenciar o modal
        document.getElementById('open-modal').addEventListener('click', () => {
            document.getElementById('servicos-modal').classList.add('show');
            carregarServicos();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('servicos-modal').classList.remove('show');
        });

        document.getElementById('confirm-services').addEventListener('click', () => {
            selectedServices = Array.from(document.querySelectorAll('#servicos-checkboxes input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            updateSelectedServices();
            document.getElementById('servicos-modal').classList.remove('show');
        });

        document.getElementById('clear-services').addEventListener('click', () => {
            selectedServices = [];
            updateSelectedServices();
        });

        // Configura os eventos ao carregar a página
        window.onload = function() {
            updateSelectedServices();
            document.getElementById('form-agendamento').addEventListener('submit', salvarAgendamento);
        };
    </script>
</body>
</html>
