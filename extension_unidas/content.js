// Este script vai rodar invisível DENTRO do site da Unidas.
// Ele tem acesso direto ao HTML da página.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "syncReservas") {
    
    // TODO: Aqui vamos localizar a tabela de Reservas no HTML e extrair: "Grupo e Quantidade"
    // Ex: const rows = document.querySelectorAll('table.reservas tr'); ...
    console.log("[Batycar] Iniciando raspagem de Reservas na tela...");
    
    verifyAndSend({
      tipo: 'reservas',
      data: [
        { category: "B", count: 12 },
        { category: "CA", count: 4 }
      ]
    }, sendResponse);
    
    return true; // Mantém a porta de comunicação aberta até a Promise resolver
  }

  if (request.action === "syncPatio") {
    
    // TODO: Localizar a tabela de DI, LV, NO, CQ na Unidas e agrupar as contagens
    console.log("[Batycar] Iniciando raspagem de Pátio na tela...");

    verifyAndSend({
      tipo: 'patio',
      data: [
        { status: "di", category: "B", count: 5 },
        { status: "lv", category: "CA", count: 2 },
        { status: "no", category: "AM", count: 1 }
      ]
    }, sendResponse);

    return true;
  }
});

function verifyAndSend(payload, sendResponse) {
  // Envia os dados extraídos para o Background Worker jogar pro Supabase
  chrome.runtime.sendMessage(
    { action: "sendToSupabase", payload: payload },
    (response) => {
      sendResponse(response);
    }
  );
}
