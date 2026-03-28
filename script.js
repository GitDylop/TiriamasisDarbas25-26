let pyodide;
let testData;

async function initPython() {
    if (!pyodide) {
        pyodide = await loadPyodide();
        console.log("Python Ready!");
    }
}

async function loadJSON() {
    const data = await fetch('./src/data/tasks.json');
    return await data.json();
}

async function loadTaskList() {
    const data = await loadJSON();
    const tasks = data.basicTasks;
    const taskListElement = document.getElementById('content');

    tasks.forEach(task => {
        console.log(task);
        const taskElement = `
            <a class="list-item" href="${'uzduotis.html?task=' + task.id}">
                <p class="list-item-title">${task.name}</p>
                <p class="list-item-description">${task.desc}</p>
                <p class="list-item-progress" progress="">Neatlikta</p>
                <div class="list-item-taglist">
                    <div class="tag" color="Green">Lengvas</div>
                </div>
            </a>
        `

        taskListElement.innerHTML += taskElement;
    });
}

async function loadTask() {
    const params = new URLSearchParams(window.location.search);
    const pasirinktaUzduotis = params.get('task');
    const data = await loadJSON();
    const uzduotis = data.basicTasks.find(uzduotis => uzduotis.id === pasirinktaUzduotis);
    testData = uzduotis.tests;

    const taskElement = document.getElementById('task');
    const codeElement = document.getElementById('code');
    const nameElement = document.getElementById('task-name');

    taskElement.innerText = uzduotis.task;
    codeElement.innerText = uzduotis.startCode;
    nameElement.innerText = uzduotis.name;
}

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