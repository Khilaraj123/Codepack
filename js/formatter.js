import { buildAsciiTree } from "./fileTree.js";

// Generates only the Directory Tree output
export function formatTree(files) {
    const activeFiles = files.filter(f => f.included && !f.isBinary);
    const paths = activeFiles.map(f => f.path);
    return buildAsciiTree(paths)
}


//Generates only the concatenated File Contents output
export function formatContent(files) {
    const activeFiles = files.filter(f => f.included && !f.isBinary);
    let output = "";

    for (const file of activeFiles) {
        output += `================================================\n`;
        output += `File: ${file.path}\n`;
        output += `================================================\n`;
        output += `${file.content || "(empty file)"}\n\n`;
    }

    return output;
}

export function formatPackage(files, includeTree = true) {
    let output = "";

    if (includeTree) {
        output += "Directory structure:\n";
        output += formatTree(files);
        output += "\n\n" + "=".repeat(48) + "\n\n";
    }

    output += formatContent(files);
    return output;
}