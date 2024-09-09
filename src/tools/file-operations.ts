import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

// Чтение правил из файла .gitignore
function loadGitIgnore(directory: string): any {
    const gitignorePath = path.join(directory, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        return ignore().add(gitignoreContent);
    }
    return ignore();
}

// Рекурсивное чтение файлов с применением правил .gitignore
export function uploadFilesRecursively(directory: string): string[] {
    const ig = loadGitIgnore(directory);
    const files: string[] = [];

    function readDirectory(currentPath: string) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        entries.forEach(entry => {
            const fullPath = path.join(currentPath, entry.name);
            if (ig.ignores(path.relative(directory, fullPath))) {
                return;
            }

            if (entry.isDirectory()) {
                readDirectory(fullPath);
            } else {
                if (fs.statSync(fullPath).size === 0) {
                    return;
                }

                files.push(fullPath);
                console.log('File founded:', fullPath)
            }
        });
    }

    readDirectory(directory);
    return files;
}

// Дополнительные функции, такие как чтение дерева файлов и т.д.
export function readFileTree(directory: string): Record<string, any> {
    const fileTree: Record<string, any> = {};

    fs.readdirSync(directory).forEach((file) => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            fileTree[file] = readFileTree(fullPath);
        } else {
            fileTree[file] = fullPath;
        }
    });

    return fileTree;
}
