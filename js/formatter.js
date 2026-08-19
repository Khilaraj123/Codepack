import { buildAsciiTree } from "./fileTree.js";

//combines file contents into a single formatted string with separators
export function formatPackage(files, includeTree = true){
    const activeFiles = files.filter(f => f.included && !f.isBinary);
    const paths = activeFiles.map(f => f.path);

    let output = "";

    //Directory Tree Section
    if(includeTree && paths.length > 0){
        output += "========================================\n";
        output += "📁 Project Directory Tree:\n";
        output += "========================================\n\n";
        output += buildAsciiTree(paths);
        output += "\n\n";
    }

    //File contents Section
    output += "========================================\n";
    output += "📁 File Contents:\n";
    output += "========================================\n\n";
    
    for(const file of activeFiles){
        output += `=====================================\n`;
        output += `📁 Path: ${file.path}\n`;
        output += `=====================================\n`;
        output += `${file.content || "(empty file)"}\n\n`;
    }

    return output;
}