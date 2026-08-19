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
        const keys = Object.keys(node).sort((a, b) => {
            const aIsDir = node[a] !== null;
            const bIsDir = node[b] !== null;
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
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
