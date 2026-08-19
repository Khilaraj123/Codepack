// Worker instance
let worker;
function getWorker(onProgress) {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    // We override onmessage here because there's only one job running at a time
    worker.onmessage = (e) => {
        const { type, done, total } = e.data;
        if (type === 'progress' && onProgress) {
            onProgress(done, total);
        }
    };
    return worker;
}

// Recursively traverse and collect File objects (without reading contents)
async function collectFiles(entry, currentPath = "") {
    const fileObjects = [];
    if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        fileObjects.push({ file, path: fullPath });
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = [];
        let batch;
        do {
            batch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
            entries.push(...batch);
        } while (batch.length > 0);

        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        for (const childEntry of entries) {
            const childFiles = await collectFiles(childEntry, newPath);
            fileObjects.push(...childFiles);
        }
    }
    return fileObjects;
}

function processWithWorker(fileObjects, onProgress) {
    return new Promise((resolve) => {
        const w = getWorker(onProgress);
        
        // Listen for the final 'done' message for this specific job
        const listener = (e) => {
            if (e.data.type === 'done') {
                w.removeEventListener('message', listener);
                resolve(e.data.files);
            }
        };
        w.addEventListener('message', listener);
        
        w.postMessage({ files: fileObjects });
    });
}

//Handles Drag and Drop dataTransfer items
export async function readDroppedFolder(items, onProgress) {
    const fileObjects = [];
    for (const item of items) {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
            const entryFiles = await collectFiles(entry);
            fileObjects.push(...entryFiles);
        }
    }
    return processWithWorker(fileObjects, onProgress);
}

//Handles standard <input type="file" webkitdirectory> selection
export async function readInputFolder(fileList, onProgress) {
    const fileObjects = [];
    for (const file of fileList) {
        const path = file.webkitRelativePath || file.name;
        fileObjects.push({ file, path });
    }
    return processWithWorker(fileObjects, onProgress);
}
