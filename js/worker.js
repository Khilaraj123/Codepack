async function readFileContent(file) {
    try {
        const buffer = await file.slice(0, 1000).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        let nonPrintable = 0;
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
                nonPrintable++;
            }
        }
        
        if (bytes.length > 0 && (nonPrintable / bytes.length > 0.1)) {
            return null;
        }
        return await file.text();
    } catch (error) {
        return null;
    }
}

self.addEventListener('message', async (e) => {
    const { files } = e.data;
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const { file, path } = files[i];
        
        const MAX_SIZE = 1000000; // 1MB size guard to prevent worker from crashing on huge files
        if (file.size > MAX_SIZE) {
            results.push({
                path: path,
                name: file.name,
                size: file.size,
                content: null,
                isBinary: true
            });
        } else {
            const content = await readFileContent(file);
            results.push({
                path: path,
                name: file.name,
                size: file.size,
                content: content || "",
                isBinary: content === null
            });
        }

        // Send progress updates frequently to keep UI responsive
        if (i % 10 === 0) {
            self.postMessage({ type: 'progress', done: i + 1, total: files.length });
        }
    }
    // Final progress and done message
    self.postMessage({ type: 'progress', done: files.length, total: files.length });
    self.postMessage({ type: 'done', files: results });
});
