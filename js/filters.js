const IGNORED_DIRECTORIES = new Set([
    "node_modules",
  ".git",
  ".svn",
  ".hg",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  "coverage",
  "vendor"
]);

// Exact filenames to ignore
const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  ".DS_Store",
  "Thumbs.db"
]);

// Binary / Non-text file extensions to skip
const IGNORED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "bmp", "tiff",
  "mp3", "mp4", "wav", "avi", "mov", "webm",
  "zip", "tar", "gz", "7z", "rar",
  "pdf", "exe", "dll", "so", "dylib", "dmg",
  "woff", "woff2", "ttf", "eot"
]);

//Check if a file path matches any smart filter criteria
export function isIgnoredPath(filePath, customExcludes = []){
    const parts = filePath.split("/");
    const fileName = parts[parts.length - 1];

    //check file extension for known binary formats
    const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
    if(IGNORED_EXTENSIONS.has(extension)){
        return true;
    }

    //check against known ignored filenames
    if(IGNORED_FILES.has(fileName)){
        return true;
    }

    //check against known ignored directories
    if(parts.some(p => IGNORED_DIRECTORIES.has(p))){
        return true;
    }

    //check custom excludes against exact path segments
    for (const exclude of customExcludes) {
        if (parts.includes(exclude)) {
            return true;
        }
    }

    return false;
}

//Filters array of files based on smart filter configuration
export function applySmartFilter(files, excludeString = ""){
    const customExcludes = excludeString.split(",").map(s => s.trim()).filter(Boolean);
    return files.map(file => ({
        ...file,
        included: !file.isBinary && !isIgnoredPath(file.path, customExcludes)
    }));
}