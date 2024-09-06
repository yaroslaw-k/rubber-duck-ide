// src/tools/supportedFileTypes.ts

export const SUPPORTED_FILE_TYPES: Record<string, string> = {
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.html': 'text/html',
    '.java': 'text/x-java',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.php': 'text/x-php',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.py': 'text/x-python', // both 'text/x-python' and 'text/x-script.python' are valid for .py
    '.rb': 'text/x-ruby',
    '.tex': 'text/x-tex',
    '.ts': 'application/typescript',
    '.txt': 'text/plain',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xml': 'text/xml',
};
