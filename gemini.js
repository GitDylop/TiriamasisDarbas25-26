import { GoogleGenAI, Type } from 'https://esm.run/@google/genai';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDT8twjx6EEj-c6VyxP-3qnPfbR_A2lR90" });

const taskSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Short Lithuanian title of the task" },
        desc: { type: Type.STRING, description: "Brief concept summary in Lithuanian" },
        task: { type: Type.STRING, description: "Detailed assignment in Lithuanian. Use inline HTML tags like <span>cmd()</span>, <br>, and <hr>." },
        tags: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Difficulty label: 'Lengvas', 'Vidutinis', or 'Sudėtingas'" },
                    color: { type: Type.STRING, description: "Color associated with difficulty: 'Green', 'Orange', or 'Red'" }
                },
                required: ["name", "color"]
            }
        },
        startCode: { type: Type.STRING, description: "Initial Python code template provided to the student including newlines." },
        tests: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    input: { type: Type.ARRAY, items: { type: Type.STRING } },
                    output: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["input", "output"]
            }
        }
    },
    required: ["name", "desc", "task", "tags", "startCode", "tests"]
};

document.addEventListener("DOMContentLoaded", () => {
    const createBtn = document.getElementById("create-gemini-task-btn");
    const requestArea = document.getElementById("gemini-request-area");

    if (createBtn) {
        createBtn.addEventListener("click", async () => {
            const topicText = requestArea ? requestArea.value.trim() : "";

            const activeTab = document.querySelector(".f-tab[active]");
            const selectedDifficulty = activeTab ? activeTab.innerText.trim() : "Lengvas";

            createBtn.innerText = "Kuriama...";
            createBtn.disabled = true;

            const prompt = `Generate a brand new Python programming assignment for programming students in Lithuanian language. No external libraries are allowed! 
            Topic: ${topicText}
            Difficulty level target: ${selectedDifficulty}`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: taskSchema,
                        temperature: 0.4 
                    }
                });

                const newTask = JSON.parse(response.text);

                if (newTask.startCode) {
                    newTask.startCode = newTask.startCode.replace(/\\n/g, '\n');
                }

                const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
                const nextIdNumber = localTasks.length + 1;
                newTask.id = `tutUzd${nextIdNumber}`;

                localTasks.push(newTask);
                localStorage.setItem('tasks', JSON.stringify(localTasks));

                if (requestArea) requestArea.value = "";
                alert(`Užduotis "${newTask.name}" sėkmingai sukurta!`);

                if (typeof window.loadTaskList === "function") {
                    window.loadTaskList("gemini");
                }

            } catch (error) {
                console.error("Gemini Generation Error:", error);
                alert("Nepavyko susisiekti su dirbtiniu intelektu.");
            } finally {
                createBtn.innerText = "Sukurti";
                createBtn.disabled = false;
            }
        });
    }
});