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
                <p class="list-item-progress" progress="${task.progress === "Atlikta" ? "done" : (task.progress === "Pradėta" ? "in-progress" : "")}">${task.progress}</p>
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

    const taskElement = document.getElementById('task');
    const codeElement = document.getElementById('code');
    const nameElement = document.getElementById('task-name');

    taskElement.innerText = uzduotis.task;
    codeElement.innerText = uzduotis.startCode;
    nameElement.innerText = uzduotis.name;
}