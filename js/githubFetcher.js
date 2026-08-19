//parses github repo url or slug
export function parseGithubUrl(inputUrl) {
    let url = inputUrl.trim();
    if (!url) return null;

    //strip protocol and domain if present
    url = url.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");

    const parts = url.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    let branch = "main";
    let subpath = "";

    // Handles URLs like /tree/branch-name/sub/folder
    if (parts[2] === "tree" && parts[3]) {
        branch = parts[3];
        subpath = parts.slice(4).join("/");
    }

    return { owner, repo, branch, subpath };
}

export function fetchGithubRepo(owner, repo, branch = "main", subpath = "", token = "", onProgress = null) {
    const headers = {};
    if (token) {
        headers["Authorization"] = `token ${token}`;
    }

    // 1. Fetch file tree metadata from GitHub API
    const treeApiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    return fetch(treeApiUrl, { headers })
        .then(res => {
            if(res.status === 403) {
                throw new Error("GitHub API rate limit exceeded. Add a Personal Access Token or wait a bit.");
            }
            if (res.status === 404) {
                throw new Error("Repository or branch not found. Check if it's private.");
            }
            if (!res.ok) {
                throw new Error(`GitHub API error (${res.status})`);
            }
            return res.json();
        })
        .then(data => {
            if (data.truncated) {
                console.warn("Repo tree is large and was truncated by GitHub API.");
            }

            // Filter for files (blobs), ignore directories (trees)
            let files = data.tree.filter(item => item.type === "blob");

            // Filter by subpath if user provided a specific folder path
            if (subpath) {
                files = files.filter(item => item.path.startsWith(subpath));
            }
            let loadedCount = 0;

            // 2. Fetch contents in parallel batches (5 at a time) to stay fast without hitting browser rate limits
            const fetchBatch = (items, batchSize = 5) => {
                const results = [];
                let index = 0;

                function next() {
                    if (index >= items.length) return Promise.resolve();
                    const item = items[index++];
                    const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;

                    return fetch(fileUrl)
                        .then(res => (res.ok ? res.text() : null))
                        .then(content => {
                            loadedCount++;
                            if (onProgress) {
                                onProgress(loadedCount, items.length);
                            }
                            results.push({
                                path: item.path,
                                name: item.path.split("/").pop(),
                                content: content || "",
                                isBinary: content === null, // null indicates binary or failed fetch
                                size: item.size || 0
                            });
                        })
                        .then(() => next());
                }

                const workers = Array.from({ length: Math.min(batchSize, items.length) }, () => next());
                return Promise.all(workers).then(() => results);
            };

            return fetchBatch(files);
        });
}