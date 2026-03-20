// Serviço de fundo do Chrome que se comunica com seu banco de dados Supabase

const SUPABASE_URL = "SUA_URL_DO_SUPABASE_AQUI";
const SUPABASE_KEY = "SUA_CHAVE_ANON_DO_SUPABASE_AQUI";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToSupabase") {
    
    // request.payload contém os JSONs raspados da tela lá do content.js
    const payload = request.payload;
    console.log("[Background] Recebendo dados para envio: ", payload);

    // TODO: Adicionar lógica HTTP (fetch) para a API Rest do Supabase Batycar API 
    // inserindo na tabela `daily_file_uploads` e `daily_file_rows`.
    
    // Simulando o delay de uma requisição de banco de dados...
    setTimeout(() => {
        sendResponse({ success: true, message: "Dados salvos no Supabase." });
    }, 1000);

    return true; // Retorna true pra falar pro Chrome que a resposta é assíncrona
  }
});
