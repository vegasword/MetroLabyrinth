document.addEventListener('DOMContentLoaded', function() {
  const socket = io();

  const messageForm = document.getElementById('sendMessageForm');
  const messageInput = document.getElementById('messageInput');
  const messagesContainer = document.querySelector('.messages');

  messageForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message !== '') {
      sendMessage(message);
      appendMessage('Me', message); //TODO: Username from localStorage
        messageInput.value = '';
        messagesContainer.scrollTo(0, messagesContainer.scrollHeight)
    }
  });

  socket.on('message', function(data) {
    appendMessage('Other User', data.message);
    scrollToBottom();
  });

  socket.on('chat message', function(sender, message) {
    appendMessage(sender, message);
    scrollToBottom();
  });

  function sendMessage(message) {
    const clientOffset = Date.now().toString();
    socket.emit('chat message', message, clientOffset);
  }

  function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messagesContainer.appendChild(messageElement);
  }
});
