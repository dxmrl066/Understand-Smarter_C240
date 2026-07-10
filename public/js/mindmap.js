document.addEventListener("DOMContentLoaded", () => {
    const mindmapBtn = document.getElementById("generate-mindmap-btn");
    if (!mindmapBtn) return;

    mindmapBtn.addEventListener("click", async () => {
        const inputData = document.getElementById("mindmap-input").value;
        const fileInput = document.getElementById("mindmap-file");
        const resultContainer = document.getElementById("mindmap-result-container");

        if (!inputData.trim() && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
            alert("Please paste some text notes or choose a .txt file to upload first!");
            return;
        }

        const formData = new FormData();
        // Append file first to make it easier on Multer's stream parser
        if (fileInput && fileInput.files.length > 0) {
            formData.append("notesFile", fileInput.files[0]);
        }
        formData.append("notes", inputData);

        mindmapBtn.innerText = "⏳ Drawing branches...";
        mindmapBtn.disabled = true;
        resultContainer.style.display = "block";
        resultContainer.innerHTML = `<p style="color: #7b7b93; font-size: 14px; text-align: center; margin: 20px 0;">AI is calculating your connections, please wait...</p>`;

        try {
            const response = await fetch("/api/generate-mindmap", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.result) {
                // 1. Strip away any accidental markdown wrapping characters
                let cleanResult = data.result.replace(/```mermaid/g, "").replace(/```/g, "").trim();
                cleanResult = cleanResult.replace(/ & /g, " and ");

                // 2. Clear out the plain text layout and build the graphic container
                resultContainer.innerHTML = `
                    <div style="background: #ffffff; padding: 25px; border-radius: 16px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.01);">
                        <h4 style="color: #4A4A8A; margin-top: 0; margin-bottom: 20px; font-weight: 600; text-align: left;">🎨 Your Visual AI Mind Map:</h4>
                        <div id="mermaid-graph" class="mermaid" style="text-align: left; width: 100%; overflow-x: auto;">
${cleanResult}
                        </div>
                    </div>
                `;
                
                // 3. Immediately trigger the graphic compiler engine
                setTimeout(() => {
                    if (typeof mermaid !== 'undefined') {
                        const graphDiv = document.getElementById("mermaid-graph");
                        graphDiv.removeAttribute("data-processed");
                        try {
                            mermaid.init(undefined, graphDiv);
                        } catch (mermaidError) {
                            console.error("Mermaid parsing failed:", mermaidError);
                        }
                    }
                }, 100); 
            } else {
                throw new Error("Empty result from backend");
            }
        } catch (error) {
            console.error("Frontend visualization failed:", error);
            resultContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center; font-size: 14px;">Error generating graphic map layout.</p>`;
        } finally {
            mindmapBtn.innerText = "✨ Generate Mind Map";
            mindmapBtn.disabled = false;
        }
    });
});