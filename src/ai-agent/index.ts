import OpenAI from "openai";
import fs from 'fs';
import {uploadFilesRecursively} from '../tools/file-operations';
import path from 'path';
import dotenv from 'dotenv';
import {Text} from "openai/resources/beta/threads";
import {SUPPORTED_FILE_TYPES} from "../tools/supported-file-types";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Создание ассистента
export async function createAssistant(): Promise<string> {
    const assistant = await openai.beta.assistants.create({
        name: "Project Assistant",
        instructions: "You are a helpful assistant for managing project. You have attached a tool for searching in all project files that included in git, questions to you will be related to these files . You can help with all kind of tech and non-tech tasks.",
        model: "gpt-4o",
        tools: [{type: "file_search"}],
    });

    return assistant.id;
}

// Загрузка файлов и создание векторного хранилища
export async function uploadProjectFiles(directory: string, vectorStorePath: string): Promise<string> {
    const filePaths: string[] = uploadFilesRecursively(directory);
    const files = filePaths
        .filter(filePath => {
            const ext = path.extname(filePath).toLowerCase(); // Не удаляем точку
            return Object.keys(SUPPORTED_FILE_TYPES).includes(ext);
        })
        .map(filePath => fs.createReadStream(filePath));

    if (files.length === 0) {
        throw new Error('No supported files found in the directory');
    }

    let vectorStoreId;
    if (fs.existsSync(vectorStorePath)) {
        // Загрузка уже существующего векторного хранилища
        vectorStoreId = fs.readFileSync(vectorStorePath, 'utf-8');
    } else {
        // Создание нового векторного хранилища
        const vectorStore = await openai.beta.vectorStores.create({
            name: "Project Files",
        });
        console.log('Vector store created:', vectorStore.id);
        console.log('Uploading files to vector store, this may take a while...');
        await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {files});
        vectorStoreId = vectorStore.id;
        console.log('Files uploaded to vector store:', vectorStoreId);

        fs.writeFileSync(vectorStorePath, vectorStoreId);
    }

    return vectorStoreId;
}


// Обновление ассистента для использования векторного хранилища
export async function updateAssistantWithVectorStore(assistantId: string, vectorStoreId: string): Promise<void> {
    try {
        await openai.beta.assistants.update(assistantId, {
            tool_resources: {
                file_search: {vector_store_ids: [vectorStoreId]}
            },
        });
        console.log(`Assistant ${assistantId} updated with vector store ${vectorStoreId}`);
    } catch (error) {
        console.error('Failed to update assistant with vector store:', error);
    }
}


// Создание треда
export async function createThread(): Promise<string> {
    const thread = await openai.beta.threads.create();
    return thread.id;
}

// Добавление сообщения в тред
export async function addMessageToThread(threadId: string, content: string): Promise<void> {
    await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
    });
}

// Запуск ассистента и получение ответа
export async function runAssistant(
    threadId: string,
    assistantId: string,
    callback: (role: string, content: string) => void
): Promise<void> {

    let assistantResponseBuffer = ''; // Буфер для ответа ассистента

    const run = openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
    });

    return new Promise<void>((resolve, reject) => {
        console.log('Assistant is ready to run');
        run
            .on('textCreated', (text: Text) => {
                assistantResponseBuffer += text.value || '';
                // emits first text delta
                console.log('textCreated:', text.value);
            })
            // @ts-ignore
            .on('textDelta', (textDelta: { value: string }) => {
                assistantResponseBuffer += textDelta.value || '';
                callback('assistant', textDelta.value || '');
            })
            .on('toolCallCreated', (toolCall: { type: string }) => {
                callback('assistant', `Tool call: ${toolCall.type} `);
            })
            .on('toolCallDelta', (toolCallDelta: any) => {
                //code interpreter disabled in this project for now
                // if (toolCallDelta.type === 'code_interpreter') {
                //     const codeInterpreter = toolCallDelta.code_interpreter;
                //     if (codeInterpreter && codeInterpreter.input) {
                //         assistantResponseBuffer += codeInterpreter.input;
                //     }
                //     if (codeInterpreter && codeInterpreter.outputs) {
                //         codeInterpreter.outputs.forEach((output: any) => {
                //             if (output.type === "logs") {
                //                 assistantResponseBuffer += output.logs;
                //             }
                //         });
                //     }
                // }
            })
            .on('end', () => {
                console.log('Stream end', assistantResponseBuffer);
                resolve();
            })
            .on('error', (error: any) => {
                console.error('Stream error:', error);
                callback('assistant', 'An error occurred while running the assistant')
                reject(error);
            });
    });
}


