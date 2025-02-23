// Importa o Supabase e inicializa o cliente
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configurações do Supabase
const SUPABASE_URL = 'https://zxxgjzqohbdtuofyenmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqenFvaGJkdHVvZnllbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTEyOTIsImV4cCI6MjA1NTgyNzI5Mn0.bnOyPVj0xTVI1YgZDNGm54-Pl72MoOjcqBLVg1K3kl0';

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Adiciona o evento de submit ao formulário de login
document.getElementById('form-login').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    // Faz o login com e-mail e senha
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        alert('Erro ao fazer login: ' + error.message);
    } else {
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html'; // Redireciona para a página principal
    }
});