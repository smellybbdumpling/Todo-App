const STORAGE_KEY = "coursework.todo-app.items";

const state = {
    todos: [],
    filter: "all",
    query: "",
    editingId: null,
    expandedId: null
};

const titleOptions = [
    "为灵感立序，给生活写实。",
    "今日的回声，未来的序章。",
    "把兵荒马乱，整理成诗。",
    "打勾，是给心安上的锚。",
    "事有始终，心有从容。",
    "让每一件小事，都找到它的回响。"
];

const titlePlaceholderOptions = [
    "写点待办… 别假装没看见",
    "比如：买牛奶，不然胃要辣哭了",
    "这次一定能做完（大概）",
    "先写标题，吹过的牛也要记下",
    "有啥破事，扔进来就行"
];

const notesPlaceholderOptions = [
    "（小声说：细节也可以很离谱）",
    "比如：记得带脑子、钥匙和微笑",
    "备注一下，免得回头骂自己",
    "这里写“不写也没关系”，你敢吗",
    "给未来的你留个惊喜（或惊吓）"
];

const elements = {
    form: document.querySelector("#todo-form"),
    titleInput: document.querySelector("#todo-title"),
    notesInput: document.querySelector("#todo-notes"),
    formError: document.querySelector("#form-error"),
    searchInput: document.querySelector("#todo-search"),
    filterTabs: Array.from(document.querySelectorAll(".filter-tab")),
    clearCompleted: document.querySelector("#clear-completed"),
    totalCount: document.querySelector("#total-count"),
    activeCount: document.querySelector("#active-count"),
    completedCount: document.querySelector("#completed-count"),
    todoList: document.querySelector("#todo-list"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyCopy: document.querySelector("#empty-copy"),
    template: document.querySelector("#todo-template"),
    toast: document.querySelector("#toast"),
    clockCard: document.querySelector(".clock-card"),
    currentDay: document.querySelector("#current-day"),
    currentDate: document.querySelector("#current-date"),
    currentTime: document.querySelector("#current-time")
};

let toastTimer = null;
let clockGlowFrame = null;
let clockGlowLeaveTimer = null;
let clockRippleTimer = null;

function loadTodos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        state.todos = Array.isArray(parsed) ? parsed : [];
    } catch {
        state.todos = [];
        showToast("本地数据读取失败，已使用空列表");
    }
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function createTodo(title, notes) {
    return {
        id: createId(),
        title,
        notes,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function createId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalize(value) {
    return value.trim().replace(/\s+/g, " ");
}

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function updateDateLabel() {
    const now = new Date();
    elements.currentDay.textContent = new Intl.DateTimeFormat("zh-CN", {
        weekday: "long"
    }).format(now);
    elements.currentDate.textContent = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(now);
    elements.currentTime.textContent = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(now);
}

function updateRandomTitle() {
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    document.title = "Todo App";
    document.querySelector("#app-title").textContent = title;
}

function pickRandom(options) {
    return options[Math.floor(Math.random() * options.length)];
}

function updateRandomPlaceholders() {
    elements.titleInput.placeholder = pickRandom(titlePlaceholderOptions);
    elements.notesInput.placeholder = pickRandom(notesPlaceholderOptions);
}

function getFilteredTodos() {
    const query = state.query.toLowerCase();
    return state.todos.filter((todo) => {
        const matchesFilter =
            state.filter === "all" ||
            (state.filter === "active" && !todo.completed) ||
            (state.filter === "completed" && todo.completed);
        const matchesQuery =
            !query ||
            todo.title.toLowerCase().includes(query) ||
            todo.notes.toLowerCase().includes(query);
        return matchesFilter && matchesQuery;
    });
}

function updateEmptyState(visibleCount) {
    elements.emptyState.hidden = visibleCount > 0;
    if (visibleCount > 0) {
        return;
    }

    if (state.todos.length === 0) {
        elements.emptyTitle.textContent = "暂无待办";
        elements.emptyCopy.textContent = "添加第一条任务，开始整理今天的事项。";
        return;
    }

    const hasQuery = Boolean(state.query);
    const filterLabel = state.filter === "active" ? "进行中" : state.filter === "completed" ? "已完成" : "全部";
    elements.emptyTitle.textContent = hasQuery ? "没有匹配结果" : `没有${filterLabel}任务`;
    elements.emptyCopy.textContent = hasQuery
        ? "换一个关键词，或切换状态筛选后再试。"
        : "切换其他状态，或添加新的待办。";
}

function setHighlightedText(element, text) {
    element.replaceChildren();
    if (!state.query) {
        element.textContent = text;
        return;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = state.query.toLowerCase();
    let cursor = 0;
    let index = lowerText.indexOf(lowerQuery, cursor);

    while (index !== -1) {
        if (index > cursor) {
            element.append(document.createTextNode(text.slice(cursor, index)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = text.slice(index, index + state.query.length);
        element.append(mark);
        cursor = index + state.query.length;
        index = lowerText.indexOf(lowerQuery, cursor);
    }

    if (cursor < text.length) {
        element.append(document.createTextNode(text.slice(cursor)));
    }
}

function updateStats() {
    const total = state.todos.length;
    const completed = state.todos.filter((todo) => todo.completed).length;
    const active = total - completed;

    elements.totalCount.textContent = total;
    elements.activeCount.textContent = active;
    elements.completedCount.textContent = completed;
    elements.clearCompleted.disabled = completed === 0;
}

function render() {
    updateStats();
    elements.todoList.replaceChildren();

    elements.filterTabs.forEach((tab) => {
        const isActive = tab.dataset.filter === state.filter;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-pressed", String(isActive));
    });

    const todos = getFilteredTodos();
    updateEmptyState(todos.length);

    todos.forEach((todo) => {
        elements.todoList.appendChild(renderTodo(todo));
    });
}

function renderTodo(todo) {
    const fragment = elements.template.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const checkAction = fragment.querySelector(".check-action");
    const title = fragment.querySelector(".todo-title");
    const detail = fragment.querySelector(".todo-detail");
    const detailTitle = fragment.querySelector(".detail-title");
    const detailNotes = fragment.querySelector(".detail-notes");
    const detailNotesBlock = fragment.querySelector(".detail-notes-block");
    const time = fragment.querySelector(".todo-detail time");
    const detailAction = fragment.querySelector(".detail-action");
    const editAction = fragment.querySelector(".edit-action");
    const deleteAction = fragment.querySelector(".delete-action");
    const editForm = fragment.querySelector(".edit-form");
    const editTitle = fragment.querySelector(".edit-title");
    const editNotes = fragment.querySelector(".edit-notes");
    const cancelEdit = fragment.querySelector(".cancel-edit");

    item.dataset.id = todo.id;
    item.classList.toggle("is-completed", todo.completed);
    setHighlightedText(title, todo.title);
    setHighlightedText(detailTitle, todo.title);
    setHighlightedText(detailNotes, todo.notes);
    detailNotesBlock.classList.toggle("is-empty", !todo.notes);
    time.textContent = `更新于 ${formatTime(todo.updatedAt)}`;
    checkAction.setAttribute("aria-label", todo.completed ? "标记为进行中" : "标记为已完成");

    const isEditing = state.editingId === todo.id;
    const isExpanded = state.expandedId === todo.id || isEditing;
    detail.hidden = !isExpanded || isEditing;
    editForm.hidden = !isEditing;
    detailAction.textContent = isExpanded && !isEditing ? "收起详情" : "查看详情";
    detailAction.setAttribute("aria-expanded", String(isExpanded && !isEditing));
    editTitle.value = todo.title;
    editNotes.value = todo.notes;

    checkAction.addEventListener("click", () => toggleTodo(todo.id));
    detailAction.addEventListener("click", () => toggleDetail(todo.id));
    editAction.addEventListener("click", () => startEditing(todo.id));
    deleteAction.addEventListener("click", () => deleteTodo(todo.id));
    cancelEdit.addEventListener("click", () => cancelEditing());
    editForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveEdit(todo.id, editTitle.value, editNotes.value);
    });

    return fragment;
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("is-visible");
    }, 2200);
}

function addTodo(event) {
    event.preventDefault();
    const title = normalize(elements.titleInput.value);
    const notes = normalize(elements.notesInput.value);

    if (!title) {
        elements.formError.textContent = "请输入待办标题";
        elements.titleInput.focus();
        return;
    }

    elements.formError.textContent = "";
    state.todos.unshift(createTodo(title, notes));
    saveTodos();
    render();
    elements.form.reset();
    elements.titleInput.focus();
    showToast("已添加待办");
}

function toggleTodo(id) {
    const todo = state.todos.find((item) => item.id === id);
    if (!todo) {
        return;
    }
    todo.completed = !todo.completed;
    todo.updatedAt = new Date().toISOString();
    saveTodos();
    render();
    showToast(todo.completed ? "已标记为完成" : "已恢复为进行中");
}

function toggleDetail(id) {
    state.editingId = null;
    state.expandedId = state.expandedId === id ? null : id;
    render();
}

function startEditing(id) {
    state.editingId = id;
    state.expandedId = id;
    render();
    const item = elements.todoList.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const input = item?.querySelector(".edit-title");
    input?.focus();
    input?.select();
}

function cancelEditing() {
    state.editingId = null;
    state.expandedId = null;
    render();
}

function saveEdit(id, rawTitle, rawNotes) {
    const title = normalize(rawTitle);
    const notes = normalize(rawNotes);

    if (!title) {
        showToast("标题不能为空");
        return;
    }

    const todo = state.todos.find((item) => item.id === id);
    if (!todo) {
        return;
    }

    todo.title = title;
    todo.notes = notes;
    todo.updatedAt = new Date().toISOString();
    state.editingId = null;
    state.expandedId = null;
    saveTodos();
    render();
    showToast("已保存修改");
}

function deleteTodo(id) {
    state.todos = state.todos.filter((todo) => todo.id !== id);
    if (state.editingId === id) {
        state.editingId = null;
    }
    if (state.expandedId === id) {
        state.expandedId = null;
    }
    saveTodos();
    render();
    showToast("已删除待办");
}

function clearCompleted() {
    const before = state.todos.length;
    state.todos = state.todos.filter((todo) => !todo.completed);
    const removed = before - state.todos.length;
    state.editingId = null;
    state.expandedId = null;
    saveTodos();
    render();
    showToast(`已清除 ${removed} 条完成项`);
}

function bindClockGlow() {
    const card = elements.clockCard;
    if (!card) {
        return;
    }

    if (window.matchMedia("(hover: hover)").matches) {
        card.addEventListener("pointermove", (event) => {
            window.clearTimeout(clockGlowLeaveTimer);
            card.classList.add("is-lit");
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;

            window.cancelAnimationFrame(clockGlowFrame);
            clockGlowFrame = window.requestAnimationFrame(() => {
                card.style.setProperty("--glow-x", `${x.toFixed(2)}%`);
                card.style.setProperty("--glow-y", `${y.toFixed(2)}%`);
            });
        });

        card.addEventListener("pointerleave", () => {
            window.cancelAnimationFrame(clockGlowFrame);
            card.classList.remove("is-pressed");
            card.classList.remove("is-lit");
            clockGlowLeaveTimer = window.setTimeout(() => {
                card.style.setProperty("--glow-x", "50%");
                card.style.setProperty("--glow-y", "50%");
            }, 300);
        });
    }

    card.addEventListener("pointerdown", () => {
        window.clearTimeout(clockGlowLeaveTimer);
        card.classList.add("is-lit", "is-pressed");
    });

    card.addEventListener("pointerup", () => {
        card.classList.remove("is-pressed");
    });

    card.addEventListener("click", () => {
        window.clearTimeout(clockRippleTimer);
        card.classList.remove("is-rippling");
        void card.offsetWidth;
        card.classList.add("is-rippling");
        clockRippleTimer = window.setTimeout(() => {
            card.classList.remove("is-rippling");
        }, 260);
    });

    card.addEventListener("selectstart", (event) => {
        event.preventDefault();
    });
}

function bindEvents() {
    elements.form.addEventListener("submit", addTodo);
    elements.titleInput.addEventListener("input", () => {
        if (elements.formError.textContent) {
            elements.formError.textContent = "";
        }
    });
    elements.searchInput.addEventListener("input", (event) => {
        state.query = event.target.value.trim();
        render();
    });
    elements.filterTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            state.filter = tab.dataset.filter;
            state.editingId = null;
            state.expandedId = null;
            render();
        });
    });
    elements.clearCompleted.addEventListener("click", clearCompleted);
    bindClockGlow();
}

function init() {
    updateRandomTitle();
    updateRandomPlaceholders();
    updateDateLabel();
    window.setInterval(updateDateLabel, 1000);
    loadTodos();
    bindEvents();
    render();
}

init();
