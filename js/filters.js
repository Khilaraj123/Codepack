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
export function isIgnoredPath(filePath){
    const parts = filePath.split("/");

    //Check directory names in path
    for(const part of parts){
        if(IGNORED_DIRECTORIES.has(part)){
            return true;
        }
    }

    const fileName = parts[parts.length - 1];

    //check exact filename matches
    if(IGNORED_FILES.has(fileName)){
        return true;
    }

    //check file extension
    const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
    if(IGNORED_EXTENSIONS.has(extension)){
        return true;
    }

    return false;
}

//Filters array of files based on smart filter configuration
export function applySmartFilter(files, enabled = true){
    return files.map(file => ({
        ...file,
        included: enabled ? !isIgnoredPath(file.path) && !file.isBinary : !file.isBinary
    }));
}