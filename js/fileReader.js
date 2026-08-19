async function readEntry(entry, currentPath = "") {
    const files = [];

    if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
            entry.file(resolve, reject);
        });

        const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        const content = await readFileContent(file);

        files.push({
            path: fullPath,
            name: file.name,
            size: file.size,
            content: content,
            isBinary: content === null
        });
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = [];
        let batch;
        do {
            batch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
            entries.push(...batch);
        } while (batch.length > 0);
        ;

        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        for (const childEntry of entries) {
            const childFiles = await readEntry(childEntry, newPath);
            files.push(...childFiles);
        }
    }
    return files;
}

//Read file contents safely as text; marks binary files as null
async function readFileContent(file) {
    try {
        //Attempt reading first 1000 bytes to check if file is binary
        const buffer = await file.slice(0, 1000).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Check for non-printable control characters
        let nonPrintable = 0;
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
                nonPrintable++;
            }
        }
        
        // If more than 10% of characters are non-printable, consider it binary
        if (bytes.length > 0 && (nonPrintable / bytes.length > 0.1)) {
            return null;
        }
        //Not binary -> Read as UTF-8
        return await file.text();
    } catch (error) {
        console.warn(`Failed to read file ${file.name}:`, error);
        return null; //Treat as binary on error
    }
}

//Handles Drag and Drop dataTransfer items
export async function readDroppedFolder(items) {
    const files = [];
    for (const item of items) {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
            const entryFiles = await readEntry(entry);
            files.push(...entryFiles);
        }
    }
    return files;
}

//Handles standard <input type="file" webkitdirectory> selection
export async function readInputFolder(fileList) {
    const files = [];
    for (const file of fileList) {
        const path = file.webkitRelativePath || file.name;
        const content = await readFileContent(file);

        files.push({
            path: path,
            name: file.name,
            size: file.size,
            content: content,
            isBinary: content === null
        });
    }
    return files;
}
