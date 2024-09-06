import fs from 'fs';
import path from 'path';
import { createAssistant, uploadProjectFiles, createThread, addMessageToThread, runAssistant, updateAssistantWithVectorStore } from '../ai-agent';

interface ProjectManagerConfig {
    assistantId?: string;
    vectorStoreId?: string;
}

const CONFIG_FILE_PATH = path.resolve(__dirname, 'project-config.json');

export class ProjectManager {
    private config: ProjectManagerConfig;
    private threadId: string | undefined;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): ProjectManagerConfig {
        if (fs.existsSync(CONFIG_FILE_PATH)) {
            const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
            return JSON.parse(rawData) as ProjectManagerConfig;
        } else {
            return {};
        }
    }

    private saveConfig(): void {
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2));
    }

    async initializeAssistant(): Promise<void> {
        if (!this.config.assistantId) {
            this.config.assistantId = await createAssistant();
            this.saveConfig();
        }
    }

    async loadProject(directory: string, vectorStorePath: string): Promise<void> {
        if (!this.config.vectorStoreId) {
            this.config.vectorStoreId = await uploadProjectFiles(directory, vectorStorePath);
            await updateAssistantWithVectorStore(this.config.assistantId as string, this.config.vectorStoreId);
            this.saveConfig();
        }
    }

    async initializeThread(): Promise<void> {
        if (!this.threadId) {
            this.threadId = await createThread();
        }
    }

    async addMessage(content: string, callback: (role: string, content: string) => void): Promise<void> {
        if (!this.threadId) {
            throw new Error('Thread not initialized');
        }
        await addMessageToThread(this.threadId, content);
        await runAssistant(this.threadId, this.config.assistantId as string, callback);
    }

    getAssistantId(): string | undefined {
        return this.config.assistantId;
    }

    getVectorStoreId(): string | undefined {
        return this.config.vectorStoreId;
    }
}
