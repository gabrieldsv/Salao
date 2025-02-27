<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendamento de Serviços</title>
    <style>
        #servicos-checkboxes {
            max-height: 200px; /* Define a altura máxima do container */
            overflow-y: auto; /* Adiciona a barra de rolagem vertical */
            border: 1px solid #ccc; /* Adiciona uma borda para melhor visualização */
            padding: 10px;
            margin-bottom: 20px;
        }
        label {
            display: block; /* Faz com que cada label ocupe uma linha */
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>Agendamento de Serviços</h1>
    <form id="form-agendamento">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" required><br><br>

        <label for="telefone">Telefone:</label>
        <input type="text" id="telefone" required><br><br>

        <label for="data">Data:</label>
        <input type="date" id="data" required><br><br>

        <label for="horario">Horário:</label>
        <input type="time" id="horario" required><br><br>

        <div id="servicos-checkboxes">
            <!-- Checkboxes dos serviços serão carregados aqui -->
        </div>

        <button type="submit">Agendar</button>
    </form>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
    <script>
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
    </script>
</body>
</html>
