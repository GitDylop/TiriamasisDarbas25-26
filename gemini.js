import { GoogleGenAI, Type } from 'https://esm.run/@google/genai';

const obfuscatedKey = "QUl6YVN5Q0ZXNVo4bl8yZktWR3FiX1Roc1Q2ZjdXdG1Yd2VvTExJ";
const cleanKey = atob(obfuscatedKey);

const ai = new GoogleGenAI({ apiKey: cleanKey });

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
        },
        answer: { type: Type.STRING, description: "A full working code for the task, not a snippet - full. The one you can paste anywhere and everything's there." }
    },
    required: ["name", "desc", "task", "tags", "startCode", "tests", "answer"]
};

document.addEventListener("DOMContentLoaded", () => {
    const createBtn = document.getElementById("create-gemini-task-btn");
    const requestArea = document.getElementById("gemini-request-area");

    if (createBtn) {
        createBtn.addEventListener("click", async () => {
            const activeTTab = document.getElementById('islandTheme').querySelector(".f-tab[active]");
            const topicText = activeTTab ? activeTTab.innerText.trim() : "Random";

            const additionalText = requestArea ? requestArea.value.trim() : "";

            const activeDTab = document.getElementById('islandDiff').querySelector(".f-tab[active]");
            const selectedDifficulty = activeDTab ? activeDTab.innerText.trim() : "Lengvas";

            createBtn.innerText = "Kuriama...";
            createBtn.disabled = true;

            const prompt = `Generate a brand new Python programming assignment for programming students in Lithuanian language. No external libraries are allowed! For input you use input() and leave it empty and for output you use print, no additional funtions required! If there's a theme it should get a second tag with the tag's name being the theme (Random is not a theme). 'Pamokos' should carefully describe how to solve the task and which functions to use. Easy questions should only use input/output, variables and basic conditions; Hard are all in but still duable for intermediate programmer. Medium is something in between. Easy, Medium and Hard questions do not require explanation on which funtions to use.
            Topic: ${topicText}
            Difficulty level target: ${selectedDifficulty}
            Additional settings: ${additionalText}`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
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
                newTask.id = `geminiUzd${nextIdNumber}`;

                localTasks.push(newTask);
                localStorage.setItem('tasks', JSON.stringify(localTasks));

                if (requestArea) requestArea.value = "";
                alert(`Užduotis "${newTask.name}" sėkmingai sukurta!`);

                if (typeof window.loadTaskList === "function") {
                    window.loadTaskList("gemini");
                }

            } catch (error) {
                console.error("Gemini Generation Error:", error);
                alert("Nepavyko susisiekti su dirbtiniu intelektu. Bandykite dar kartą.");
            } finally {
                createBtn.innerText = "Sukurti";
                createBtn.disabled = false;
            }
        });
    }
});