<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendamento</title>
    <style>
        /* Estilo básico para o formulário e o container de serviços */
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

        /* Estilo para o container de checkboxes com barra de rolagem */
        #servicos-checkboxes {
            max-height: 200px; /* Altura máxima antes da rolagem */
            overflow-y: auto; /* Ativa a barra de rolagem vertical */
            border: 1px solid #ccc; /* Borda para visualização */
            padding: 10px;
            background-color: #f9f9f9;
        }

        #servicos-checkboxes label {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        #servicos-checkboxes input[type="checkbox"] {
            width: auto; /* Reseta a largura do checkbox */
            margin-right: 10px;
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
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Agendar Serviço</h2>
        <form id="form-agendamento">
            <div class="form-group">
                <label for="nome">Nome:</label>
                <input type="text" id="nome" required>
            </div>
            <div class="form-group">
                <label for="telefone">Telefone:</label>
                <input type="tel" id="telefone" required>
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
                <div id="servicos-checkboxes">
                    <!-- Checkboxes serão inseridos aqui pelo JavaScript -->
                </div>
            </div>
            <button type="submit">Agendar</button>
        </form>
    </div>

    <!-- Inclua a biblioteca Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        // Configurações do Supabase
        const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';

        // Inicializa o cliente Supabase
        const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    </script>
</body>
</html>
