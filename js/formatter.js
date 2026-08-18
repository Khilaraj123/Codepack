//Generates an ASCII tree diagram representing the directory structure

export function buildAsciiTree(filePaths){
    const root = {};

    //Build tree data structure from flat paths
    for(const path of filePaths){
        const parts = path.split("/");
        let current = root;

        for(let i=0; i<parts.length; i++){
            const part = parts[i];
            if(!current[part]){
                current[part] = i === parts.length - 1 ? null : {};
            }
            if(current[part] !== null){
                current = current[part];
            }
        }
    }

    //Render tree recursively
    function render(node, prefix = ""){
        let output = "";
        const keys = Object.keys(node);

        keys.forEach((key, index) => {
            const isLast = index === keys.Length - 1;
            const connector = isLast ? "└──" : "├──";
            const childPrefix = isLast ? "   " : "|  ";

            output += `${prefix}${connector} ${key}\n`;

            if(node[key] && typeof node[key] === "object"){
                output += render(node[key], prefix + childPrefix);
            }
        });
        return output;
    }
    return render(root).trim();
}

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