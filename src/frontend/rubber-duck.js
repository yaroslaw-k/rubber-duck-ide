const socket = io();
const messagesDiv = document.getElementById('messages');
const initializationDiv = document.getElementById('initialization');
const pathInputDiv = document.getElementById('path-input');
const threadInputDiv = document.getElementById('thread-input');

let assistantResponseBuffer = ''; // Для объединения ответа ассистента
let assistantMessagePre = null; // Ссылка на текущее сообщение ассистента

socket.on('manager-initialized', (assistantId, vectorStoreExists) => {
    initializationDiv.style.display = 'none';
    if (!vectorStoreExists) {
        pathInputDiv.style.display = 'block';
    } else {
        threadInputDiv.style.display = 'block';
    }
});

socket.on('assistant-created', assistantId => {
    displayMessage('Assistant created with ID: ' + assistantId, 'assistant');
    threadInputDiv.style.display = 'block';
    pathInputDiv.style.display = 'none';
});

socket.on('files-uploaded', vectorStoreId => {
    displayMessage('Files uploaded with Vector Store ID: ' + vectorStoreId, 'assistant');
    threadInputDiv.style.display = 'block';
    // initializationDiv.style.display = 'none';
});

// Обработка сообщений с сервера
socket.on('message', (role, content) => {
    if (role === 'assistant') {
        if (!assistantMessagePre) {
            assistantMessagePre = document.createElement('pre');
            assistantMessagePre.classList.add('message', 'assistant');
            messagesDiv.appendChild(assistantMessagePre);
        }
        assistantResponseBuffer += content; // Добавляем новые данные в буфер
        assistantMessagePre.textContent = `assistant: ${assistantResponseBuffer}`; // Обновляем текст сообщения
    } else {
        displayMessage(content, role); // Для пользователя отображаем сразу
    }
});

// Конец потока сообщений от ассистента
socket.on('message-end', () => {
    assistantMessagePre = null; // Сбрасываем ссылку, чтобы следующее сообщение было новым
    assistantResponseBuffer = ''; // Очищаем буфер
});

function startSession() {
    socket.emit('start-session');
    initializationDiv.style.display = 'block';
}

function initializeProject() {
    const directory = document.getElementById('directoryInput').value;
    const vectorStorePath = 'vectorStoreId.json';
    socket.emit('initialize-project', directory, vectorStorePath);
    pathInputDiv.style.display = 'none';
    initializationDiv.style.display = 'block';
}

function createThread() {
    const promptText = document.getElementById('promptInput').value;
    displayMessage(promptText, 'user'); // Отображаем сообщение пользователя сразу
    socket.emit('create-thread', promptText);
}

function displayMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(role);
    messageDiv.textContent = `${role}: ${content}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Скроллим вниз для новых сообщений
}

// Начало сессии при загрузке страницы
window.onload = startSession;
