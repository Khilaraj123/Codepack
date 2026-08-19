//func to render file list with checkboxes for toggling inclusion
export function renderFileList(loadedFiles, fileListContainer, updateOutput){
    fileListContainer.innerHTML = "";

    if(loadedFiles.length === 0){
        fileListContainer.innerHTML = '<p class="placeholder-text">No Folder loaded yet.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    loadedFiles.forEach((file, index)=>{
        const item = document.createElement("div");
        item.className = `file-item ${file.included ? "" : "excluded"}`;

        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";
        label.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = file.included;
        checkbox.disabled = file.isBinary;

        checkbox.addEventListener("change", () => {
            loadedFiles[index].included = checkbox.checked;
            item.classList.toggle("excluded", !checkbox.checked);
            if (typeof updateOutput === 'function') {
                updateOutput();
            }
        });

        const pathSpan = document.createElement("span");
        pathSpan.textContent = file.path;
        if(file.isBinary){
            pathSpan.textContent += " (binary - skipped)";
            pathSpan.style.color = "#888";
        }

        label.appendChild(checkbox);
        label.appendChild(pathSpan);
        item.appendChild(label);
        fragment.appendChild(item);
    });
    fileListContainer.appendChild(fragment);
}
