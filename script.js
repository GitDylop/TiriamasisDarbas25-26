let pyodide;
let testData;

async function initPython() {
    if (!pyodide) {
        pyodide = await loadPyodide();
    }
}

async function loadJSON() {
    const pathSegments = window.location.pathname.split('/');
    const isSubfolder = pathSegments.length > 3 || window.location.pathname.includes('/pamokos/');
    const prefix = isSubfolder ? '../' : '';
    
    const data = await fetch(`${prefix}src/data/tasks.json`);
    return await data.json();
}

async function loadTaskList(list) {
    let tasks = [];

    if (list === 'gemini') {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } else {
        const data = await loadJSON();
        switch (list) {
            case 'pamokos':
                tasks = data.tutorial;
                break;
            case 'l_praktines':
                tasks = data.basicTasks;
                break;
            case 'n_praktines':
                tasks = data.normalTasks;
                break;
            case 's_praktines':
                tasks = data.hardTasks;
                break;
        }
    }

    const taskListElement = document.getElementById('content');
    if (!taskListElement) return;
    
    taskListElement.innerHTML = "";
    
    tasks.forEach(task => {
        let tagElementsString = '';

        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                tagElementsString += `<div class="tag" color="${tag.color}">${tag.name}</div>`;
            });
        }

        const taskElement = `
            <a class="list-item" href="${list}/uzduotis.html?list=${list}&task=${task.id}">
                <p class="list-item-title">${task.name}</p>
                <p class="list-item-description">${task.desc}</p>
                <p class="list-item-progress" progress="">Neatlikta</p>
                <div class="list-item-taglist">
                    ${tagElementsString}
                </div>
                ${list === 'gemini' ? `<div class="gemini-delete" onclick="deleteTask(event, '${task.id}')">Delete</div>` : ''}
            </a>
        `;

        taskListElement.innerHTML += taskElement;
    });
}

async function loadTask() {
    const params = new URLSearchParams(window.location.search);
    const selectedList = params.get('list') || 'pamokos';
    const pasirinktaUzduotis = params.get('task');
    
    let tasks = [];

    if (selectedList === 'gemini') {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } else {
        const data = await loadJSON();
        switch (selectedList) {
            case 'pamokos':
                tasks = data.tutorial;
                break;
            case 'l_praktines':
                tasks = data.basicTasks;
                break;
            case 'n_praktines':
                tasks = data.normalTasks;
                break;
            case 's_praktines':
                tasks = data.hardTasks;
                break;
        }
    }

    const uzduotis = tasks.find(uzduotis => uzduotis.id === pasirinktaUzduotis);
    
    if (!uzduotis) {
        alert("Užduotis nerasta!");
        return;
    }

    testData = uzduotis.tests;

    const taskElement = document.getElementById('task');
    const codeElement = document.getElementById('code');
    const nameElement = document.getElementById('task-name');

    taskElement.innerHTML = uzduotis.task;
    codeElement.innerText = uzduotis.startCode;
    nameElement.innerText = uzduotis.name;
}

window.deleteTask = function(event, taskId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!confirm("Ar tikrai norite ištrinti šią užduotį?")) {
        return;
    }

    let localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    localTasks = localTasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(localTasks));

    if (typeof loadTaskList === "function") {
        const taskListElement = document.getElementById('tasks-list');
        if (taskListElement) taskListElement.innerHTML = '';
        
        loadTaskList("gemini");
    }
};

async function runPython() {
    await initPython();
    const code = document.getElementById("code").innerText;
    const output = document.getElementById("output");

    pyodide.setStdout({
        batched: (str) => { output.innerText += str + "\n"; }
    });

    pyodide.setStdin({
        stdin: () => window.prompt("Python Input:")
    });

    try {
        await pyodide.runPythonAsync(code);
    } catch (err) {
        output.innerText += "\n[Error]: " + err.message;
    }
}

async function submitPython() {
    await initPython();
    const code = document.getElementById("code").innerText;
    const outputEl = document.getElementById("output");
    
    outputEl.innerHTML += `<b>Pradedami bandymai (${testData.length})...</b><br><br>`;
    let totalPassed = 0;

    for (let i = 0; i < testData.length; i++) {
        const test = testData[i];
        let inputIndex = 0;
        let capturedOutput = [];

        pyodide.setStdout({
            batched: (str) => capturedOutput.push(str.trim())
        });

        pyodide.setStdin({
            stdin: () => {
                const val = test.input[inputIndex];
                inputIndex++;
                return val;
            }
        });

        try {
            await pyodide.runPythonAsync(code);

            let isCorrect = true;
            
            for (let j = 0; j < test.output.length; j++) {
                let expected = test.output[j].toString().trim();
                let received = capturedOutput[j] ? capturedOutput[j].toString().trim() : "";

                let expNum = parseFloat(expected);
                let recNum = parseFloat(received);

                if (!isNaN(expNum) && !isNaN(recNum)) {
                    if (Math.abs(expNum - recNum) > 0.01) {
                        isCorrect = false;
                    }
                }
                else if (expected !== received) {
                    isCorrect = false;
                }
            }

            if (isCorrect && capturedOutput.length === test.output.length) {
                totalPassed++;
                outputEl.innerHTML += `<div style="color: green;">Bandymas ${i+1}: Teisingai</div>`;
            } else {
                outputEl.innerHTML += `<div style="color: red;">Bandymas ${i+1}: Neteisingai<br>
                    <small>Tikėtasi: [${test.output}] | Gavome: [${capturedOutput}]</small></div><br>`;
            }
        } catch (err) {
            outputEl.innerHTML += `<div style="color: orange;">Bandymas ${i+1}: Kažkas nepavyko</div>`;
        }
    }

    if (totalPassed === testData.length) {
        outputEl.innerHTML += `<br><div style="color: green;">Užduotis atlikta</div>`;
    }
}

initPython();

function switchTab(self, parentId) {
    const parent = document.getElementById(parentId);
    const children = parent.querySelector('.f-tab[active]');
    children.toggleAttribute('active');
    self.toggleAttribute('active');
}

function collapse(parentId) {
    const parent = document.getElementById(parentId);
    parent.toggleAttribute('collapsed');
}