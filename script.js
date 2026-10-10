class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.storageKey = 'bohese-startmenu-todos';
        this.legacyStorageKey = 'todos';
        this.searchEngines = {
            google: 'https://www.google.com/search?q=',
            bing: 'https://www.bing.com/search?q=',
            yandex: 'https://yandex.com/search/?text=',
            baidu: 'https://www.baidu.com/s?wd='
        };

        this.cacheElements();
        this.loadTodos();
        this.bindEvents();
        this.updateDate();
        this.render();
    }

    cacheElements() {
        this.elements = {
            searchForm: document.getElementById('searchForm'),
            searchEngine: document.getElementById('searchEngine'),
            searchInput: document.getElementById('searchInput'),
            todoForm: document.getElementById('todoForm'),
            todoInput: document.getElementById('todoInput'),
            prioritySelect: document.getElementById('prioritySelect'),
            toggleTodoBtn: document.getElementById('toggleTodoBtn'),
            todoContent: document.getElementById('todoContent'),
            todoList: document.getElementById('todoList'),
            emptyState: document.getElementById('emptyState'),
            emptySubtitle: document.getElementById('emptySubtitle'),
            statsText: document.getElementById('statsText'),
            clearCompletedBtn: document.getElementById('clearCompletedBtn'),
            currentDate: document.getElementById('currentDate')
        };
    }

    bindEvents() {
        this.elements.searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.search();
        });
        this.elements.todoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.addTodo();
        });
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', () => this.setFilter(button.dataset.filter));
        });
        this.elements.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.elements.toggleTodoBtn.addEventListener('click', () => this.toggleTodoPanel());
        this.elements.todoList.addEventListener('click', (event) => this.handleTodoClick(event));

        document.addEventListener('keydown', (event) => {
            const tagName = document.activeElement?.tagName;
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) ||
                document.activeElement?.isContentEditable;
            if (event.key === '/' && !isTyping) {
                event.preventDefault();
                this.elements.searchInput.focus();
            }
        });
    }

    toggleTodoPanel() {
        const expanded = this.elements.todoContent.classList.toggle('collapsed') === false;
        this.elements.toggleTodoBtn.classList.toggle('collapsed', !expanded);
        this.elements.toggleTodoBtn.setAttribute('aria-expanded', String(expanded));
        this.elements.toggleTodoBtn.querySelector('.toggle-text').textContent = expanded ? '折叠' : '展开';
    }

    search() {
        const query = this.elements.searchInput.value.trim();
        const engine = this.elements.searchEngine.value;
        if (!query) {
            this.showNotification('请先输入搜索内容', 'warning');
            this.elements.searchInput.focus();
            return;
        }

        const url = `${this.searchEngines[engine]}${encodeURIComponent(query)}`;
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
            this.showNotification('浏览器拦截了新窗口，请允许弹窗后重试', 'warning');
            return;
        }
        this.elements.searchInput.value = '';
    }

    updateDate() {
        this.elements.currentDate.textContent = new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        }).format(new Date());
    }

    addTodo() {
        const text = this.elements.todoInput.value.trim();
        if (!text) {
            this.showNotification('请先输入任务内容', 'warning');
            this.elements.todoInput.focus();
            return;
        }

        this.todos.unshift({
            id: this.createId(), text, completed: false,
            priority: this.elements.prioritySelect.value,
            createdAt: new Date().toISOString()
        });
        this.saveTodos();
        this.render();
        this.elements.todoInput.value = '';
        this.elements.todoInput.focus();
        this.showNotification('任务已添加', 'success');
    }

    createId() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    handleTodoClick(event) {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;
        if (actionButton.dataset.action === 'toggle') this.toggleTodo(actionButton.dataset.id);
        if (actionButton.dataset.action === 'delete') this.deleteTodo(actionButton.dataset.id);
    }

    toggleTodo(id) {
        const todo = this.todos.find((item) => item.id === id);
        if (!todo) return;
        todo.completed = !todo.completed;
        this.saveTodos();
        this.render();
        if (todo.completed) this.showNotification('任务已完成', 'success');
    }

    deleteTodo(id) {
        if (!this.todos.some((item) => item.id === id)) return;
        this.todos = this.todos.filter((item) => item.id !== id);
        this.saveTodos();
        this.render();
        this.showNotification('任务已删除', 'info');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        if (this.currentFilter === 'active') return this.todos.filter((todo) => !todo.completed);
        if (this.currentFilter === 'completed') return this.todos.filter((todo) => todo.completed);
        return this.todos;
    }

    clearCompleted() {
        const completedCount = this.todos.filter((todo) => todo.completed).length;
        if (!completedCount || !window.confirm(`确定要删除 ${completedCount} 个已完成的任务吗？`)) return;
        this.todos = this.todos.filter((todo) => !todo.completed);
        this.saveTodos();
        this.render();
        this.showNotification(`已删除 ${completedCount} 个任务`, 'success');
    }

    getPriorityText(priority) {
        return { high: '高', medium: '中', low: '低' }[priority] || '中';
    }

    formatTime(isoString) {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '时间未知';
        const diff = Math.max(0, Date.now() - date.getTime());
        if (diff < 60000) return '刚才';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        this.elements.todoList.replaceChildren(...filteredTodos.map((todo) => this.createTodoElement(todo)));
        this.elements.todoList.hidden = filteredTodos.length === 0;
        this.elements.emptyState.hidden = filteredTodos.length !== 0;
        if (this.currentFilter === 'completed') {
            this.elements.emptySubtitle.textContent = '还没有已完成的任务';
        } else if (this.currentFilter === 'active') {
            this.elements.emptySubtitle.textContent = '太棒了！所有任务都已完成！';
        } else {
            this.elements.emptySubtitle.textContent = '添加第一个任务吧！';
        }
        this.updateStats();
    }

    createTodoElement(todo) {
        const item = document.createElement('li');
        item.className = `todo-item${todo.completed ? ' completed' : ''}`;

        const checkbox = document.createElement('button');
        checkbox.type = 'button';
        checkbox.className = `todo-checkbox${todo.completed ? ' checked' : ''}`;
        checkbox.dataset.action = 'toggle';
        checkbox.dataset.id = todo.id;
        checkbox.setAttribute('aria-label', todo.completed ? '标记为未完成' : '标记为完成');
        checkbox.setAttribute('aria-pressed', String(todo.completed));
        checkbox.textContent = todo.completed ? '✓' : '';

        const priority = document.createElement('span');
        priority.className = `priority-badge priority-${todo.priority}`;
        priority.textContent = this.getPriorityText(todo.priority);

        const content = document.createElement('div');
        content.className = 'todo-item-content';
        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;
        const time = document.createElement('time');
        time.className = 'todo-time';
        time.dateTime = todo.createdAt;
        time.textContent = this.formatTime(todo.createdAt);
        content.append(text, time);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-btn';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.id = todo.id;
        deleteButton.setAttribute('aria-label', `删除任务：${todo.text}`);
        deleteButton.textContent = '×';
        item.append(checkbox, priority, content, deleteButton);
        return item;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter((todo) => todo.completed).length;
        const active = total - completed;
        this.elements.statsText.textContent = total
            ? `共 ${total} 个任务 · ${active} 个未完成 · ${completed} 个已完成`
            : '还没有任务';
        this.elements.clearCompletedBtn.hidden = completed === 0;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'status');
        notification.textContent = message;
        document.body.append(notification);
        window.setTimeout(() => {
            notification.classList.add('is-leaving');
            window.setTimeout(() => notification.remove(), 220);
        }, 2800);
    }

    saveTodos() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
        } catch (error) {
            console.warn('无法保存待办：', error);
        }
    }

    loadTodos() {
        try {
            const saved = localStorage.getItem(this.storageKey) ?? localStorage.getItem(this.legacyStorageKey);
            const parsed = saved ? JSON.parse(saved) : [];
            this.todos = Array.isArray(parsed) ? parsed.map((todo) => this.normalizeTodo(todo)).filter(Boolean) : [];
        } catch (error) {
            console.warn('无法读取待办：', error);
            this.todos = [];
        }
    }

    normalizeTodo(todo) {
        if (!todo || typeof todo !== 'object' || typeof todo.text !== 'string') return null;
        return {
            id: String(todo.id || this.createId()),
            text: todo.text.trim().slice(0, 200),
            completed: Boolean(todo.completed),
            priority: ['low', 'medium', 'high'].includes(todo.priority) ? todo.priority : 'medium',
            createdAt: typeof todo.createdAt === 'string' ? todo.createdAt : new Date().toISOString()
        };
    }
}

window.app = new TodoApp();

