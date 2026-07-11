document.addEventListener("DOMContentLoaded", () => {
    const mindmapBtn = document.getElementById("generate-mindmap-btn");
    if (!mindmapBtn) return;

    mindmapBtn.addEventListener("click", async () => {
        const inputData = document.getElementById("mindmap-input").value;
        const resultContainer = document.getElementById("mindmap-result-container");

        if (resultContainer) {
            resultContainer.removeAttribute("data-processed");
        }

        if (!inputData.trim()) {
            alert("Please enter a brief topic or a single line summary first!");
            return;
        }

        mindmapBtn.innerText = "⏳ Drawing branches...";
        mindmapBtn.disabled = true;
        resultContainer.style.display = "block";
        resultContainer.innerHTML = `<p style="color: #7b7b93; font-size: 14px; text-align: center; margin: 20px 0;">AI is calculating your connections, please wait...</p>`;

        try {
            const response = await fetch("/api/generate-mindmap", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ notes: inputData })
            });

            const data = await response.json();

            if (data.result) {
                let cleanResult = data.result.replace(/```mermaid/g, "").replace(/```/g, "").trim();
                cleanResult = cleanResult.replace(/ & /g, " and ");

                if (!cleanResult.toLowerCase().startsWith("mindmap")) {
                    cleanResult = "mindmap\n" + cleanResult;
                }

                resultContainer.innerHTML = `
                    <div style="background: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                        <h4 style="color: #1e293b; margin-top: 0; margin-bottom: 20px; font-weight: 700; text-align: left;">🎨 Your Visual AI Mind Map:</h4>
                        
                        <style>
                            #mermaid-graph-container .node:nth-child(odd) rect, 
                            #mermaid-graph-container .node:nth-child(odd) circle, 
                            #mermaid-graph-container .node:nth-child(odd) polygon,
                            #mermaid-graph-container .node:nth-child(odd) .mindmap-node rect {
                                fill: #fecaca !important;
                                stroke: #dc3545 !important;
                                stroke-width: 2px !important;
                            }
                            #mermaid-graph-container .node:nth-child(even) rect, 
                            #mermaid-graph-container .node:nth-child(even) circle, 
                            #mermaid-graph-container .node:nth-child(even) polygon,
                            #mermaid-graph-container .node:nth-child(even) .mindmap-node rect {
                                fill: #fef08a !important;
                                stroke: #ca8a04 !important;
                                stroke-width: 2px !important;
                            }
                            #mermaid-graph-container text,
                            #mermaid-graph-container g text,
                            #mermaid-graph-container .mindmap-node text,
                            #mermaid-graph-container tspan {
                                fill: #000000 !important;
                                color: #000000 !important;
                                font-weight: 700 !important;
                                font-opacity: 1 !important;
                            }
                            #mermaid-graph-container .edgePath .path, 
                            #mermaid-graph-container .mindmap-edge {
                                stroke: #64748b !important;
                                stroke-width: 2.5px !important;
                            }
                        </style>

                        <div id="mermaid-graph-container" class="mermaid" style="text-align: left; width: 100%; overflow-x: auto;">${cleanResult}</div>
                    </div>
                `;
                
                const graphDiv = document.getElementById("mermaid-graph-container");
                
                if (graphDiv && typeof mermaid !== 'undefined') {
                    setTimeout(async () => {
                        try {
                            graphDiv.removeAttribute("data-processed");
                            // Using standard render method to cleanly handle layout syntax rejections
                            const { svg } = await mermaid.render('mermaid-svg-render', cleanResult);
                            graphDiv.innerHTML = svg;
                        } catch (mermaidError) {
                            console.error("Mermaid engine caught syntax error:", mermaidError);
                            // Clean fallback so the user interface never freezes up completely
                            graphDiv.innerHTML = `<p style="color: #ef4444; font-size: 14px; padding: 10px;">⚠️ Map layout structure was slightly misaligned by the AI. Please try clicking generate one more time to refresh the layout paths!</p>`;
                            // Remove bad residual elements from the DOM if left behind
                            const badSvg = document.getElementById('mermaid-svg-render');
                            if (badSvg) badSvg.remove();
                        }
                    }, 150);
                }
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