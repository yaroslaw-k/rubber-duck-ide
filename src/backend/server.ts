import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ProjectManager } from '../manager';
import path from "path";

const app = express();
const server = createServer(app);
const io = new Server(server);

const manager = new ProjectManager();

io.on('connection', (socket) => {
    socket.on('start-session', async () => {
        await manager.initializeAssistant();
        const vectorStoreExists = !!manager.getVectorStoreId();
        socket.emit('manager-initialized', manager.getAssistantId(), vectorStoreExists);
    });

    socket.on('initialize-project', async (directory, vectorStorePath) => {
        await manager.loadProject(directory, vectorStorePath);
        socket.emit('files-uploaded', manager.getVectorStoreId());
    });

    socket.on('create-thread', async (prompt) => {
        await manager.initializeThread();

        await manager.addMessage(prompt, (role, content) => {
            socket.emit('message', role, content);
        });
        socket.emit('message-end');
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Маршрут для обслуживания статических файлов (фронтенд)
app.use(express.static(path.join(__dirname, '../frontend')));
