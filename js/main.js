import { readDroppedFolder, readInputFolder } from "./fileReader.js";
import { applySmartFilter } from "./filters.js";
import { formatPackage } from "./formatter.js";
import { renderFileList } from "./ui.js";
//state
let loadedFiles = [];

//DOM element references
const dropZone = document.getElementById("drop-zone");
const folderInput = document.getElementById("folder-input");
const fileListContainer = document.getElementById("file-list");
const fileCountBadge = document.getElementById("file-count");
const outputPreview = document.getElementById("output-preview");
const smartFilterCheckbox = document.getElementById("smart-filter");
const includeTreeCheckbox = document.getElementById("include-tree");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const dropOverlay = document.getElementById("drop-overlay");

//processes incoming raw file data and refreshes UI
function handleLoadedFiles(rawFiles){
    if(!rawFiles || rawFiles.length === 0) return;

    const smartFilterActive = smartFilterCheckbox.checked;
    loadedFiles = applySmartFilter(rawFiles, smartFilterActive);

    renderFileList(loadedFiles, fileListContainer, fileCountBadge, updateOutput);
    updateOutput();
}


//Re format output preview and enables/disables action buttons
function updateOutput(){
    const includeTree = includeTreeCheckbox.checked;
    const formattedText = formatPackage(loadedFiles, includeTree);

    outputPreview.textContent = formattedText;

    //enable/disable buttons based on if we have anything to copy or download
    const hasContent = formattedText.trim().length > 0;
    copyBtn.disabled = !hasContent;
    downloadBtn.disabled = !hasContent;
}

//Drag and Drop Events

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
    dropOverlay.classList.add("hidden");
});

dropZone.addEventListener("drop", async(e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    dropOverlay.classList.add("hidden");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
    dropOverlay.classList.add("hidden");
});

dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    dropOverlay.classList.add("hidden");

    if(e.dataTransfer.items){
        const files = await readDroppedFolder(e.dataTransfer.items);
        handleLoadedFiles(files);
    }
});

//FOlder Input Selection
folderInput.addEventListener("change", async (e)=>{
    if(e.target.files.length > 0){
        const files = await readInputFolder(e.target.files);
        handleLoadedFiles(files);
    }
});

//Filter and option Toggles
smartFilterCheckbox.addEventListener("change", () => {
    if(loadedFiles.length>0){
        loadedFiles = applySmartFilter(loadedFiles, smartFilterCheckbox.checked);
        renderFileList(loadedFiles, fileListContainer, fileCountBadge, updateOutput);
        updateOutput();
    }
});

includeTreeCheckbox.addEventListener("change", updateOutput);

//copy to clipboard
copyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(outputPreview.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error("failed to copy text: ", error);
    }
});

//Download as text file
downloadBtn.addEventListener("click", () => {
    const blob = new Blob([outputPreview.value], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
  a.download = "codepack-output.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});



