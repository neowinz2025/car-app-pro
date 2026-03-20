document.addEventListener('DOMContentLoaded', async () => {
  const statusCard = document.getElementById('status-card');
  const actionButtons = document.getElementById('action-buttons');
  const btnSyncReservas = document.getElementById('btn-sync-reservas');
  const btnSyncPatio = document.getElementById('btn-sync-patio');

  // Checar se a aba atual é do frotagerencial.unidas.com.br
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url && tab.url.includes("frotagerencial.unidas.com.br")) {
    statusCard.className = "bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-sm";
    statusCard.innerHTML = `
      <p class="font-medium text-green-800">Conectado à Unidas</p>
      <p class="text-green-600 text-xs mt-1">Pronto para extrair relatórios da tela.</p>
    `;
    actionButtons.style.display = 'block';
  } else {
    statusCard.className = "bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm";
    statusCard.innerHTML = `
      <p class="font-medium text-red-800">Aba incorreta</p>
      <p class="text-red-600 text-xs mt-1">Abra este menu apenas no site <br/>frotagerencial.unidas.com.br</p>
    `;
    return;
  }

  // Ações de Sincronização
  btnSyncReservas.addEventListener('click', () => {
    btnSyncReservas.innerText = "Sincronizando...";
    btnSyncReservas.disabled = true;
    
    // Manda mensagem para o Content Script executar a raspagem
    chrome.tabs.sendMessage(tab.id, { action: "syncReservas" }, (response) => {
      btnSyncReservas.innerText = "Sincronizar [Reservas]";
      btnSyncReservas.disabled = false;
      if (chrome.runtime.lastError || !response || !response.success) {
        alert("Erro ao ler tabela de reservas. Você está na página certa?");
      } else {
        alert("Reservas enviadas para o Batycar com sucesso!");
      }
    });
  });

  btnSyncPatio.addEventListener('click', () => {
    btnSyncPatio.innerText = "Sincronizando...";
    btnSyncPatio.disabled = true;
    
    // Manda mensagem para o Content Script executar a raspagem
    chrome.tabs.sendMessage(tab.id, { action: "syncPatio" }, (response) => {
      btnSyncPatio.innerText = "Sincronizar [Pátio]";
      btnSyncPatio.disabled = false;
      if (chrome.runtime.lastError || !response || !response.success) {
        alert("Erro ao ler tabela de Pátio. Você está na página certa?");
      } else {
        alert("Pátio (DI/LV/NO/CQ) enviado para o Batycar com sucesso!");
      }
    });
  });
});
