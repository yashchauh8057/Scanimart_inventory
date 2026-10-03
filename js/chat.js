(function () {
  const box = document.getElementById('chatBox');
  if (!box) return;
  const messages = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const history = [];
  function addMessage(role, text, sources = []) { const item = document.createElement('div'); item.className = `chat-message ${role}`; item.textContent = text; if (sources.length) { const source = document.createElement('small'); source.textContent = `Sources: ${sources.join(', ')}`; item.appendChild(source); } messages.appendChild(item); messages.scrollTop = messages.scrollHeight; }
  document.getElementById('chatToggle').addEventListener('click', () => { box.classList.toggle('is-open'); if (box.classList.contains('is-open')) input.focus(); });
  document.getElementById('chatClose').addEventListener('click', () => box.classList.remove('is-open'));
  form.addEventListener('submit', async event => { event.preventDefault(); const message = input.value.trim(); if (!message) return; addMessage('user', message); input.value = ''; addMessage('assistant', 'I’m checking Scanimart data…'); const pending = messages.lastElementChild; try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Chat request failed.'); pending.remove(); addMessage('assistant', data.answer, data.sources || []); history.push({ role: 'user', content: message }, { role: 'assistant', content: data.answer }); } catch (error) { pending.textContent = error.message; pending.classList.add('error'); } });
})();
