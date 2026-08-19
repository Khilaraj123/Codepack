import * as fflate from 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js';

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
    const { type } = e.data;

    if (type === 'local') {
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
        self.postMessage({ type: 'progress', done: files.length, total: files.length });
        self.postMessage({ type: 'done', files: results });
    
    } else if (type === 'unzip') {
        const { buffer, subpath } = e.data;
        const u8 = new Uint8Array(buffer);
        
        fflate.unzip(u8, (err, unzipped) => {
            if (err) {
                self.postMessage({ type: 'error', error: err.message });
                return;
            }
            
            const results = [];
            const entries = Object.keys(unzipped);
            let done = 0;
            const total = entries.length;

            for (const rawPath of entries) {
                done++;
                const fileData = unzipped[rawPath];
                
                // Skip directories (fflate represents them as zero-length files ending in '/')
                if (fileData.length === 0 && rawPath.endsWith('/')) {
                     if (done % 100 === 0) self.postMessage({ type: 'progress', done, total });
                     continue;
                }

                // The archive includes a root folder e.g. "repo-branch/". We should strip it.
                const parts = rawPath.split('/');
                parts.shift(); // remove root folder
                const path = parts.join('/');
                
                if (!path) {
                    if (done % 100 === 0) self.postMessage({ type: 'progress', done, total });
                    continue;
                }

                // Apply subpath filter if present
                if (subpath) {
                    if (!(path.startsWith(subpath + "/") || path === subpath)) {
                         if (done % 100 === 0) self.postMessage({ type: 'progress', done, total });
                         continue;
                    }
                }

                const size = fileData.length;
                const name = parts[parts.length - 1];

                // Binary check
                let isBinary = false;
                const MAX_SIZE = 1000000;
                
                if (size > MAX_SIZE) {
                    isBinary = true;
                } else {
                    let nonPrintable = 0;
                    const checkLen = Math.min(size, 1000);
                    for (let i = 0; i < checkLen; i++) {
                        const b = fileData[i];
                        if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
                            nonPrintable++;
                        }
                    }
                    if (checkLen > 0 && (nonPrintable / checkLen > 0.1)) {
                        isBinary = true;
                    }
                }

                let content = "";
                if (!isBinary) {
                    try {
                        content = new TextDecoder("utf-8").decode(fileData);
                    } catch (e) {
                        isBinary = true;
                        content = null;
                    }
                } else {
                    content = null;
                }

                results.push({
                    path,
                    name,
                    size,
                    content: content || "",
                    isBinary
                });

                if (done % 100 === 0) {
                    self.postMessage({ type: 'progress', done, total });
                }
            }
            
            self.postMessage({ type: 'progress', done: total, total });
            self.postMessage({ type: 'done', files: results });
        });
    } else if (type === 'github-fetch') {
        const { owner, repo, branch, files } = e.data;
        const results = [];
        let index = 0;
        const batchSize = 10;
        let loadedCount = 0;

        async function next() {
            if (index >= files.length) return;
            const item = files[index++];
            
            const MAX_SIZE = 1000000;
            if (item.size > MAX_SIZE) {
                loadedCount++;
                results.push({
                    path: item.path,
                    name: item.path.split("/").pop(),
                    content: null,
                    isBinary: true,
                    size: item.size || 0
                });
                return next();
            }

            const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;

            try {
                const res = await fetch(fileUrl);
                const content = res.ok ? await res.text() : null;
                results.push({
                    path: item.path,
                    name: item.path.split("/").pop(),
                    content: content || "",
                    isBinary: content === null,
                    size: item.size || 0
                });
            } catch (err) {
                results.push({
                    path: item.path,
                    name: item.path.split("/").pop(),
                    content: null,
                    isBinary: true,
                    size: item.size || 0
                });
            }
            
            loadedCount++;
            if (loadedCount % 10 === 0) {
                self.postMessage({ type: 'progress', done: loadedCount, total: files.length });
            }
            return next();
        }

        const workers = Array.from({ length: Math.min(batchSize, files.length) }, () => next());
        await Promise.all(workers);
        self.postMessage({ type: 'progress', done: files.length, total: files.length });
        self.postMessage({ type: 'done', files: results });
    }
});
