// Data Store
const store = {
tasks: [],
categories: [
{ id: "default", name: "Uncategorized", color: "#9b87f5" },
{ id: "work", name: "Work", color: "#9b87f5" },
{ id: "personal", name: "Personal", color: "#6E59A5" }
],
classes: [
{ id: "important", name: "Important", color: "#f97316" },
{ id: "urgent", name: "Urgent", color: "#ea384c" }
],
activeCategory: null,
activeTask: null,
filters: {
search: "",
completed: null,
priority: null
},
sort: {
field: "order",
direction: "asc"
}
};

// Load data from localStorage
const loadData = () => {
const savedTasks = localStorage.getItem("tasks");
if (savedTasks) {
try {
store.tasks = JSON.parse(savedTasks).map(task => ({
    ...task,
    createdAt: new Date(task.createdAt),
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined
}));
} catch (error) {
console.error("Error parsing tasks:", error);
}
}

const savedCategories = localStorage.getItem("categories");
if (savedCategories) {
store.categories = JSON.parse(savedCategories);
}

const savedClasses = localStorage.getItem("customClasses");
if (savedClasses) {
store.classes = JSON.parse(savedClasses);
}
};

// Save data to localStorage
const saveData = () => {
localStorage.setItem("tasks", JSON.stringify(store.tasks));
localStorage.setItem("categories", JSON.stringify(store.categories));
localStorage.setItem("customClasses", JSON.stringify(store.classes));
};

// Generate UUID
const generateId = () => {
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
const r = Math.random() * 16 | 0;
const v = c === 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
};

// Toast Notification
const showToast = (title, message) => {
const toastContainer = document.getElementById("toastContainer");

const toast = document.createElement("div");
toast.className = "toast";
toast.innerHTML = `
<div class="toast-content">
<div class="toast-title">${title}</div>
<div class="toast-message">${message}</div>
</div>
<button class="toast-close">
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
</button>
`;

toastContainer.appendChild(toast);

const closeBtn = toast.querySelector(".toast-close");
closeBtn.addEventListener("click", () => {
toast.remove();
});

setTimeout(() => {
toast.remove();
}, 3000);
};

// Task Management
const addTask = (task) => {
const newTask = {
...task,
id: generateId(),
createdAt: new Date(),
order: store.tasks.length,
classIds: task.classIds || []
};

store.tasks.push(newTask);
saveData();
renderTasks();
updateStats();

showToast("Task created", `"${newTask.title}" has been added to your tasks`);
};

const updateTask = (taskId, updatedFields) => {
store.tasks = store.tasks.map(task =>
task.id === taskId ? { ...task, ...updatedFields } : task
);

saveData();
renderTasks();
updateStats();
};

const deleteTask = (taskId) => {
const taskToDelete = store.tasks.find(task => task.id === taskId);
store.tasks = store.tasks.filter(task => task.id !== taskId);

saveData();
renderTasks();
updateStats();

if (taskToDelete) {
showToast("Task deleted", `"${taskToDelete.title}" has been removed`);
}
};

const toggleTaskCompletion = (taskId) => {
const task = store.tasks.find(task => task.id === taskId);
if (task) {
task.completed = !task.completed;
saveData();
renderTasks();
updateStats();
}
};

const setActiveTask = (taskId) => {
store.activeTask = store.tasks.find(task => task.id === taskId) || null;
const focusModeBtn = document.getElementById("focusModeBtn");

if (store.activeTask) {
focusModeBtn.classList.remove("hidden");
} else {
focusModeBtn.classList.add("hidden");
}
};

// Category Management
const addCategory = (category) => {
const newCategory = {
...category,
id: generateId()
};

store.categories.push(newCategory);
saveData();
renderCategories();

showToast("Category created", `"${newCategory.name}" category has been created`);
};

const updateCategory = (categoryId, updatedFields) => {
store.categories = store.categories.map(category =>
category.id === categoryId ? { ...category, ...updatedFields } : category
);

saveData();
renderCategories();
renderTasks();
};

const deleteCategory = (categoryId) => {
const categoryToDelete = store.categories.find(cat => cat.id === categoryId);

if (categoryId === "default") {
showToast("Error", "Cannot delete the default category");
return;
}

store.categories = store.categories.filter(category => category.id !== categoryId);

// Update tasks with this category
store.tasks = store.tasks.map(task =>
task.categoryId === categoryId ? { ...task, categoryId: "default" } : task
);

if (store.activeCategory === categoryId) {
store.activeCategory = null;
}

saveData();
renderCategories();
renderTasks();

if (categoryToDelete) {
showToast("Category deleted", `"${categoryToDelete.name}" category has been removed`);
}
};

const setActiveCategory = (categoryId) => {
store.activeCategory = categoryId;
renderCategories();
renderTasks();
};

// Class Management
const addClass = (classObj) => {
const newClass = {
...classObj,
id: generateId()
};

store.classes.push(newClass);
saveData();
renderClasses();

showToast("Class created", `"${newClass.name}" class has been created`);
};

const updateClass = (classId, updatedFields) => {
store.classes = store.classes.map(classObj =>
classObj.id === classId ? { ...classObj, ...updatedFields } : classObj
);

saveData();
renderClasses();
renderTasks();
};

const deleteClass = (classId) => {
const classToDelete = store.classes.find(cls => cls.id === classId);

store.classes = store.classes.filter(classObj => classObj.id !== classId);

// Remove this class from all tasks
store.tasks = store.tasks.map(task => ({
...task,
classIds: task.classIds.filter(id => id !== classId)
}));

saveData();
renderClasses();
renderTasks();

if (classToDelete) {
showToast("Class deleted", `"${classToDelete.name}" class has been removed`);
}
};

// Render Functions
const renderCategories = () => {
const categoryList = document.getElementById("categoryList");
const taskCategorySelect = document.getElementById("taskCategory");

// Clear existing categories
categoryList.innerHTML = "";
if (taskCategorySelect) {
taskCategorySelect.innerHTML = "";
}

// All categories option
const allCategoriesItem = document.createElement("div");
allCategoriesItem.className = `category-item ${store.activeCategory === null ? "active" : ""}`;
allCategoriesItem.innerHTML = `
<div class="category-name">
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
All Categories
</div>
`;
allCategoriesItem.addEventListener("click", () => setActiveCategory(null));
categoryList.appendChild(allCategoriesItem);

// Render each category
store.categories.forEach(category => {
// Add to category list
const categoryItem = document.createElement("div");
categoryItem.className = `category-item ${store.activeCategory === category.id ? "active" : ""}`;
categoryItem.innerHTML = `
<div class="category-name">
<span class="category-color" style="background-color: ${category.color};"></span>
${category.name}
</div>
<div class="category-actions">
${category.id !== "default" ? `
    <button class="icon delete-category" data-id="${category.id}">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
` : ''}
</div>
`;
categoryItem.addEventListener("click", (e) => {
if (!e.target.closest(".edit-category") && !e.target.closest(".delete-category")) {
    setActiveCategory(category.id);
}
});
categoryList.appendChild(categoryItem);

// Add to task form select
if (taskCategorySelect) {
const option = document.createElement("option");
option.value = category.id;
option.textContent = category.name;
taskCategorySelect.appendChild(option);
}
});

// Add event listeners for edit and delete
document.querySelectorAll(".edit-category").forEach(button => {
button.addEventListener("click", (e) => {
e.stopPropagation();
const categoryId = button.getAttribute("data-id");
// Edit category functionality would go here
console.log("Edit category", categoryId);
});
});

document.querySelectorAll(".delete-category").forEach(button => {
button.addEventListener("click", (e) => {
e.stopPropagation();
const categoryId = button.getAttribute("data-id");
showDeleteConfirmation("category", categoryId);
});
});
};

const renderClasses = () => {
const classList = document.getElementById("classList");
classList.innerHTML = "";

store.classes.forEach(classObj => {
const classItem = document.createElement("div");
classItem.className = "class-badge";
classItem.style.backgroundColor = `${classObj.color}20`;
classItem.style.color = classObj.color;
classItem.innerHTML = `
${classObj.name}
<button class="icon delete-class" data-id="${classObj.id}">
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
</button>
`;
classList.appendChild(classItem);
});

// Add event listeners for delete
document.querySelectorAll(".delete-class").forEach(button => {
button.addEventListener("click", () => {
const classId = button.getAttribute("data-id");
showDeleteConfirmation("class", classId);
});
});

// Update task form classes
updateTaskFormClasses();
};

const updateTaskFormClasses = () => {
const taskClassesContainer = document.getElementById("taskClassesContainer");
if (taskClassesContainer) {
taskClassesContainer.innerHTML = "";

store.classes.forEach(classObj => {
const classBadge = document.createElement("div");
classBadge.className = "class-badge";
classBadge.dataset.id = classObj.id;
classBadge.style.backgroundColor = `${classObj.color}20`;
classBadge.style.color = classObj.color;
classBadge.textContent = classObj.name;
classBadge.addEventListener("click", () => {
    classBadge.classList.toggle("selected");
    classBadge.style.backgroundColor = classBadge.classList.contains("selected")
        ? classObj.color
        : `${classObj.color}20`;
    classBadge.style.color = classBadge.classList.contains("selected")
        ? "white"
        : classObj.color;
});
taskClassesContainer.appendChild(classBadge);
});
}
};

const renderTasks = () => {
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

// Filter tasks
let filteredTasks = store.tasks;

// Filter by category
if (store.activeCategory) {
filteredTasks = filteredTasks.filter(task => task.categoryId === store.activeCategory);
}

// Filter by search
if (store.filters.search) {
filteredTasks = filteredTasks.filter(task =>
task.title.toLowerCase().includes(store.filters.search.toLowerCase())
);
}

// Filter by completion status
if (store.filters.completed !== null) {
filteredTasks = filteredTasks.filter(task => task.completed === store.filters.completed);
}

// Filter by priority
if (store.filters.priority) {
filteredTasks = filteredTasks.filter(task => task.priority === store.filters.priority);
}

// Sort tasks
filteredTasks.sort((a, b) => {
const direction = store.sort.direction === "asc" ? 1 : -1;

if (store.sort.field === "order") {
return (a.order - b.order) * direction;
}

if (store.sort.field === "title") {
if (!a.title || !b.title) return 0;
return a.title.localeCompare(b.title) * direction;
}

if (store.sort.field === "dueDate") {
if (!a.dueDate && !b.dueDate) return 0;
if (!a.dueDate) return direction;
if (!b.dueDate) return -direction;

return ((new Date(a.dueDate)).getTime() - (new Date(b.dueDate)).getTime()) * direction;
}

if (store.sort.field === "priority") {
const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
const priorityA = priorityOrder[a.priority] || 0;
const priorityB = priorityOrder[b.priority] || 0;

return (priorityA - priorityB) * direction;
}

return 0;
});

// Clear existing tasks
taskList.innerHTML = "";

// Show empty state if no tasks
if (filteredTasks.length === 0) {
emptyState.classList.remove("hidden");
} else {
emptyState.classList.add("hidden");

// Render each task
filteredTasks.forEach((task, index) => {
const category = store.categories.find(cat => cat.id === task.categoryId);
const taskClasses = store.classes.filter(cls => task.classIds && task.classIds.includes(cls.id));

const isTaskDueSoon = task.dueDate &&
    (new Date(task.dueDate).getTime() - new Date().getTime()) > 0 &&
    (new Date(task.dueDate).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

const isTaskOverdue = task.dueDate && new Date(task.dueDate) < new Date();

const taskItem = document.createElement("div");
taskItem.className = `task-item ${task.priority ? 'priority-' + task.priority : ''}`;
taskItem.dataset.id = task.id;
taskItem.draggable = true;
taskItem.innerHTML = `
<div class="task-drag-handle">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
</div>

<div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
    ${task.completed ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    ` : ''}
</div>

<div class="task-content">
    <div class="task-title ${task.completed ? 'completed' : ''}" data-id="${task.id}">${task.title}</div>
    
    <div class="task-badges">
    ${category ? `
        <span class="task-badge" style="background-color: ${category.color}20; color: ${category.color};">
        ${category.name}
        </span>
    ` : ''}
    
    ${taskClasses.map(cls => `
        <span class="task-badge" style="background-color: ${cls.color}20; color: ${cls.color};">
        ${cls.name}
        </span>
    `).join('')}
    
    ${task.priority ? `
        <span class="task-badge" style="background-color: ${task.priority === 'high' ? '#fecaca' :
            task.priority === 'medium' ? '#fef3c7' :
                '#dbeafe'
        }; color: ${task.priority === 'high' ? '#dc2626' :
            task.priority === 'medium' ? '#d97706' :
                '#2563eb'
        };">
        ${task.priority}
        </span>
    ` : ''}
    </div>
    
    ${task.dueDate ? `
    <div class="task-date ${isTaskDueSoon ? 'due-soon' : ''} ${isTaskOverdue ? 'overdue' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${isTaskOverdue ? 'Overdue: ' : 'Due: '}
        ${formatDate(new Date(task.dueDate))}
    </div>
    ` : ''}
</div>

<div class="task-actions">
    
    <button class="icon delete-task" data-id="${task.id}">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
</div>
`;
taskList.appendChild(taskItem);
});

// Add event listeners
document.querySelectorAll(".task-checkbox").forEach(checkbox => {
checkbox.addEventListener("click", () => {
    const taskId = checkbox.getAttribute("data-id");
    toggleTaskCompletion(taskId);
});
});

document.querySelectorAll(".task-title").forEach(title => {
title.addEventListener("click", () => {
    const taskId = title.getAttribute("data-id");
    setActiveTask(taskId);
});
});

document.querySelectorAll(".edit-task").forEach(button => {
button.addEventListener("click", () => {
    const taskId = button.getAttribute("data-id");
    // Edit task functionality would go here
    console.log("Edit task", taskId);
});
});

document.querySelectorAll(".delete-task").forEach(button => {
button.addEventListener("click", () => {
    const taskId = button.getAttribute("data-id");
    showDeleteConfirmation("task", taskId);
});
});

// Setup drag and drop
setupDragAndDrop();
}
};

const setupDragAndDrop = () => {
const taskItems = document.querySelectorAll(".task-item");
const taskList = document.getElementById("taskList");

let draggedItem = null;

taskItems.forEach(item => {
// Drag start
item.addEventListener("dragstart", function () {
draggedItem = this;
setTimeout(() => {
    this.classList.add("dragging");
}, 0);
});

// Drag end
item.addEventListener("dragend", function () {
this.classList.remove("dragging");
draggedItem = null;
});

// Drag over
item.addEventListener("dragover", function (e) {
e.preventDefault();
if (draggedItem === this) return;

const mouseY = e.clientY;
const thisRect = this.getBoundingClientRect();
const offset = mouseY - thisRect.top;
const isAfter = offset > thisRect.height / 2;

if (isAfter) {
    taskList.insertBefore(draggedItem, this.nextSibling);
} else {
    taskList.insertBefore(draggedItem, this);
}

updateTaskOrder();
});
});

// Allow dropping on the task list itself
taskList.addEventListener("dragover", function (e) {
e.preventDefault();

const mouseY = e.clientY;
const items = [...this.querySelectorAll(".task-item:not(.dragging)")];

if (items.length === 0) return;

const closestTask = items.reduce((closest, task) => {
const box = task.getBoundingClientRect();
const offset = mouseY - box.top - box.height / 2;

if (offset < 0 && offset > closest.offset) {
    return { offset, element: task };
} else {
    return closest;
}
}, { offset: Number.NEGATIVE_INFINITY, element: null });

if (closestTask.element) {
this.insertBefore(draggedItem, closestTask.element);
} else {
this.appendChild(draggedItem);
}

updateTaskOrder();
});
};

const updateTaskOrder = () => {
const taskItems = document.querySelectorAll(".task-item");
const taskIds = [...taskItems].map(item => item.dataset.id);

// Update order in store
taskIds.forEach((id, index) => {
const task = store.tasks.find(t => t.id === id);
if (task) {
task.order = index;
}
});

saveData();
};

const updateStats = () => {
const totalTasksCount = document.getElementById("totalTasksCount");
const completedTasksCount = document.getElementById("completedTasksCount");
const pendingTasksCount = document.getElementById("pendingTasksCount");
const progressBar = document.getElementById("progressBar");
const progressPercentage = document.getElementById("progressPercentage");

const total = store.tasks.length;
const completed = store.tasks.filter(task => task.completed).length;
const pending = total - completed;
const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

totalTasksCount.textContent = total;
completedTasksCount.textContent = completed;
pendingTasksCount.textContent = pending;
progressBar.style.width = `${percentage}%`;
progressPercentage.textContent = `${percentage}%`;
};

// Date Picker
const setupDatePicker = () => {
const datePickerTrigger = document.getElementById("datePickerTrigger");
const datePickerCalendar = document.getElementById("datePickerCalendar");
const selectedDateDisplay = document.getElementById("selectedDateDisplay");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const currentMonth = document.getElementById("currentMonth");
const calendarDays = document.getElementById("calendarDays");

let selectedDate = null;
let currentDate = new Date();

const monthNames = [
"January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
];

// Toggle calendar
datePickerTrigger.addEventListener("click", () => {
datePickerCalendar.classList.toggle("hidden");
renderCalendar();
});

// Close calendar when clicking outside
document.addEventListener("click", (e) => {
if (!datePickerTrigger.contains(e.target) &&
!datePickerCalendar.contains(e.target)) {
datePickerCalendar.classList.add("hidden");
}
});

// Navigate months
prevMonth.addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() - 1);
renderCalendar();
});

nextMonth.addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() + 1);
renderCalendar();
});

// Render calendar
const renderCalendar = () => {
// Update header
currentMonth.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

// Clear days
calendarDays.innerHTML = "";

// Get first day of month and number of days
const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

// Add empty cells for days before first day of month
for (let i = 0; i < firstDay; i++) {
const emptyDay = document.createElement("div");
emptyDay.className = "day empty";
calendarDays.appendChild(emptyDay);
}

// Add days of month
for (let day = 1; day <= daysInMonth; day++) {
const dayElement = document.createElement("div");
dayElement.className = "day";
dayElement.textContent = day;

const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

// Check if this day is selected
if (selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear()) {
    dayElement.classList.add("selected");
}

// Check if this day is today
const today = new Date();
if (date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()) {
    dayElement.classList.add("today");
}

// Add click event
dayElement.addEventListener("click", () => {
    selectedDate = date;
    selectedDateDisplay.textContent = formatDate(selectedDate);
    datePickerCalendar.classList.add("hidden");
    renderCalendar();
});

calendarDays.appendChild(dayElement);
}
};

// Initial render
renderCalendar();
};

// Date formatter
const formatDate = (date) => {
if (!date) return "";

const options = { year: 'numeric', month: 'short', day: 'numeric' };
return date.toLocaleDateString('en-US', options);
};

// Delete confirmation
const showDeleteConfirmation = (itemType, itemId) => {
const modal = document.getElementById("deleteConfirmModal");
const confirmText = document.getElementById("deleteConfirmText");
const confirmBtn = document.getElementById("confirmDeleteBtn");

let itemName = "";

if (itemType === "task") {
const task = store.tasks.find(task => task.id === itemId);
itemName = task ? task.title : "this task";
confirmText.textContent = `Are you sure you want to delete the task "${itemName}"?`;
} else if (itemType === "category") {
const category = store.categories.find(cat => cat.id === itemId);
itemName = category ? category.name : "this category";
confirmText.textContent = `Are you sure you want to delete the category "${itemName}"? All tasks will be moved to Uncategorized.`;
} else if (itemType === "class") {
const classObj = store.classes.find(cls => cls.id === itemId);
itemName = classObj ? classObj.name : "this class";
confirmText.textContent = `Are you sure you want to delete the class "${itemName}"?`;
}

modal.classList.remove("hidden");

// Set up confirm button
confirmBtn.onclick = () => {
if (itemType === "task") {
deleteTask(itemId);
} else if (itemType === "category") {
deleteCategory(itemId);
} else if (itemType === "class") {
deleteClass(itemId);
}

modal.classList.add("hidden");
};
};

// Focus Timer
const setupFocusTimer = () => {
const focusTimerModal = document.getElementById("focusTimerModal");
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const closeFocusTimer = document.getElementById("closeFocusTimer");
const focusTaskTitle = document.getElementById("focusTaskTitle");

let timerMinutes = 25;
let timerSeconds = 0;
let timerInterval = null;
let isPaused = true;

// Update timer display
const updateTimerDisplay = () => {
const formattedMinutes = String(timerMinutes).padStart(2, "0");
const formattedSeconds = String(timerSeconds).padStart(2, "0");
timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
};

// Start timer
const startTimer = () => {
if (isPaused) {
isPaused = false;
startTimerBtn.classList.add("hidden");
pauseTimerBtn.classList.remove("hidden");

timerInterval = setInterval(() => {
    if (timerSeconds === 0) {
        if (timerMinutes === 0) {
            // Timer complete
            clearInterval(timerInterval);
            isPaused = true;
            startTimerBtn.classList.remove("hidden");
            pauseTimerBtn.classList.add("hidden");

            // Play sound or notification
            showToast("Timer Complete", "Your focus session is complete!");

            // Reset timer
            timerMinutes = 25;
            timerSeconds = 0;
            updateTimerDisplay();
            return;
        }

        timerMinutes--;
        timerSeconds = 59;
    } else {
        timerSeconds--;
    }

    updateTimerDisplay();
}, 1000);
}
};

// Pause timer
const pauseTimer = () => {
if (!isPaused) {
clearInterval(timerInterval);
isPaused = true;
startTimerBtn.classList.remove("hidden");
pauseTimerBtn.classList.add("hidden");
}
};

// Reset timer
const resetTimer = () => {
clearInterval(timerInterval);
isPaused = true;
timerMinutes = 25;
timerSeconds = 0;
updateTimerDisplay();
startTimerBtn.classList.remove("hidden");
pauseTimerBtn.classList.add("hidden");
};

// Setup event listeners
startTimerBtn.addEventListener("click", startTimer);
pauseTimerBtn.addEventListener("click", pauseTimer);
resetTimerBtn.addEventListener("click", resetTimer);
closeFocusTimer.addEventListener("click", () => {
focusTimerModal.classList.add("hidden");
pauseTimer();
});

// Show focus timer
const showFocusTimer = () => {
if (store.activeTask) {
focusTaskTitle.textContent = `Focus on: ${store.activeTask.title}`;
resetTimer();
focusTimerModal.classList.remove("hidden");
} else {
showToast("No Task Selected", "Please select a task to focus on");
}
};

// Return public methods
return {
showFocusTimer
};
};

// Modal Management
const setupModals = () => {
// Get all modals
const modals = document.querySelectorAll(".modal-overlay");

// Close modal on close button click
document.querySelectorAll(".modal-close, .close-modal").forEach(button => {
button.addEventListener("click", () => {
const modal = button.closest(".modal-overlay");
if (modal) modal.classList.add("hidden");
});
});

// Close modal on outside click
modals.forEach(modal => {
modal.addEventListener("click", (e) => {
if (e.target === modal) {
    modal.classList.add("hidden");
}
});
});
};

// Tab Management
const setupTabs = () => {
const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
tab.addEventListener("click", () => {
const tabId = tab.getAttribute("data-tab");

// Hide all tab contents
document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.remove("active");
});

// Deactivate all tabs
tabs.forEach(t => {
    t.classList.remove("active");
});

// Activate current tab and content
tab.classList.add("active");
document.getElementById(`${tabId}Tab`).classList.add("active");
});
});
};

// Dropdown Management
const setupDropdowns = () => {
// Priority filter dropdown
const priorityFilterBtn = document.getElementById("priorityFilterBtn");
const priorityDropdown = document.getElementById("priorityDropdown");

priorityFilterBtn.addEventListener("click", (e) => {
e.stopPropagation();
priorityDropdown.classList.toggle("hidden");
sortDropdown.classList.add("hidden");
});

document.querySelectorAll("#priorityDropdown .dropdown-item").forEach(item => {
item.addEventListener("click", () => {
const priority = item.getAttribute("data-priority");
store.filters.priority = priority === "all" ? null : priority;
priorityDropdown.classList.add("hidden");
renderTasks();
});
});

// Sort dropdown
const sortBtn = document.getElementById("sortBtn");
const sortDropdown = document.getElementById("sortDropdown");

sortBtn.addEventListener("click", (e) => {
e.stopPropagation();
sortDropdown.classList.toggle("hidden");
priorityDropdown.classList.add("hidden");
});

document.querySelectorAll("#sortDropdown .dropdown-item").forEach(item => {
item.addEventListener("click", () => {
const sortField = item.getAttribute("data-sort");

if (store.sort.field === sortField) {
    // Toggle direction if same field
    store.sort.direction = store.sort.direction === "asc" ? "desc" : "asc";
} else {
    store.sort.field = sortField;
    store.sort.direction = "asc";
}

sortDropdown.classList.add("hidden");
renderTasks();
});
});

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
priorityDropdown.classList.add("hidden");
sortDropdown.classList.add("hidden");
});
};

// Color picker management
const setupColorPickers = () => {
// Category color picker
const colorOptions = document.querySelectorAll("#colorOptions .color-option");
const customColorOption = document.getElementById("customColorOption");
const customColorGroup = document.getElementById("customColorGroup");
const customColor = document.getElementById("customColor");
const customColorPreview = document.getElementById("customColorPreview");

let selectedColor = "#9b87f5";
let isCustomColor = false;

colorOptions.forEach(option => {
option.addEventListener("click", () => {
// Skip custom color option
if (option === customColorOption) {
    isCustomColor = true;
    customColorGroup.classList.remove("hidden");
    colorOptions.forEach(opt => opt.classList.remove("selected"));
    option.classList.add("selected");
    return;
}

isCustomColor = false;
customColorGroup.classList.add("hidden");
colorOptions.forEach(opt => opt.classList.remove("selected"));
option.classList.add("selected");
selectedColor = option.getAttribute("data-color");
});
});

customColor.addEventListener("input", () => {
selectedColor = customColor.value;
customColorPreview.style.backgroundColor = selectedColor;
});

// Class color picker
const classColorOptions = document.querySelectorAll("#classColorOptions .color-option");
const customClassColorOption = document.getElementById("customClassColorOption");
const customClassColorGroup = document.getElementById("customClassColorGroup");
const customClassColor = document.getElementById("customClassColor");
const customClassColorPreview = document.getElementById("customClassColorPreview");

let selectedClassColor = "#f97316";
let isCustomClassColor = false;

classColorOptions.forEach(option => {
option.addEventListener("click", () => {
// Skip custom color option
if (option === customClassColorOption) {
    isCustomClassColor = true;
    customClassColorGroup.classList.remove("hidden");
    classColorOptions.forEach(opt => opt.classList.remove("selected"));
    option.classList.add("selected");
    return;
}

isCustomClassColor = false;
customClassColorGroup.classList.add("hidden");
classColorOptions.forEach(opt => opt.classList.remove("selected"));
option.classList.add("selected");
selectedClassColor = option.getAttribute("data-color");
});
});

customClassColor.addEventListener("input", () => {
selectedClassColor = customClassColor.value;
customClassColorPreview.style.backgroundColor = selectedClassColor;
});

// Return methods to get selected colors
return {
getCategoryColor: () => isCustomColor ? customColor.value : selectedColor,
getClassColor: () => isCustomClassColor ? customClassColor.value : selectedClassColor
};
};

// Form Management
const setupForms = () => {
const colorPickers = setupColorPickers();

// New Task Form
const newTaskForm = document.getElementById("newTaskForm");
newTaskForm.addEventListener("submit", (e) => {
e.preventDefault();

const title = document.getElementById("taskTitle").value;
const description = document.getElementById("taskDescription").value;
const categoryId = document.getElementById("taskCategory").value;
const priority = document.getElementById("taskPriority").value;

// Get selected date
const selectedDateDisplay = document.getElementById("selectedDateDisplay");
const dueDate = selectedDateDisplay.textContent === "No due date"
? null
: new Date(selectedDateDisplay.textContent);

// Get selected classes
const selectedClassBadges = document.querySelectorAll("#taskClassesContainer .class-badge.selected");
const classIds = [...selectedClassBadges].map(badge => badge.dataset.id);

addTask({
title,
description,
completed: false,
categoryId,
dueDate,
priority: priority || undefined,
classIds
});

// Reset form
newTaskForm.reset();
document.getElementById("selectedDateDisplay").textContent = "No due date";
document.getElementById("newTaskModal").classList.add("hidden");
});

// New Category Form
const newCategoryForm = document.getElementById("newCategoryForm");
newCategoryForm.addEventListener("submit", (e) => {
e.preventDefault();

const name = document.getElementById("categoryName").value;
const color = colorPickers.getCategoryColor();

addCategory({ name, color });

// Reset form
newCategoryForm.reset();
document.getElementById("newCategoryModal").classList.add("hidden");
});

// New Class Form
const newClassForm = document.getElementById("newClassForm");
newClassForm.addEventListener("submit", (e) => {
e.preventDefault();

const name = document.getElementById("className").value;
const color = colorPickers.getClassColor();

addClass({ name, color });

// Reset form
newClassForm.reset();
document.getElementById("newClassModal").classList.add("hidden");
});
};

// Filter button management
const setupFilterButtons = () => {
const showAllTasksBtn = document.getElementById("showAllTasksBtn");
const showActiveTasksBtn = document.getElementById("showActiveTasksBtn");
const showCompletedTasksBtn = document.getElementById("showCompletedTasksBtn");
const searchInput = document.getElementById("searchInput");

showAllTasksBtn.addEventListener("click", () => {
store.filters.completed = null;
updateFilterButtonsUI();
renderTasks();
});

showActiveTasksBtn.addEventListener("click", () => {
store.filters.completed = false;
updateFilterButtonsUI();
renderTasks();
});

showCompletedTasksBtn.addEventListener("click", () => {
store.filters.completed = true;
updateFilterButtonsUI();
renderTasks();
});

searchInput.addEventListener("input", () => {
store.filters.search = searchInput.value;
renderTasks();
});

const updateFilterButtonsUI = () => {
showAllTasksBtn.className = store.filters.completed === null ? "primary" : "outline";
showActiveTasksBtn.className = store.filters.completed === false ? "primary" : "outline";
showCompletedTasksBtn.className = store.filters.completed === true ? "primary" : "outline";
};
};

// Main buttons
const setupMainButtons = () => {
const newTaskBtn = document.getElementById("newTaskBtn");
const newCategoryBtn = document.getElementById("newCategoryBtn");
const newClassBtn = document.getElementById("newClassBtn");
const focusModeBtn = document.getElementById("focusModeBtn");

const focusTimer = setupFocusTimer();

newTaskBtn.addEventListener("click", () => {
document.getElementById("newTaskModal").classList.remove("hidden");
});

newCategoryBtn.addEventListener("click", () => {
document.getElementById("newCategoryModal").classList.remove("hidden");
});

newClassBtn.addEventListener("click", () => {
document.getElementById("newClassModal").classList.remove("hidden");
});

focusModeBtn.addEventListener("click", () => {
focusTimer.showFocusTimer();
});
};

// Initialize app
const init = () => {
loadData();
renderCategories();
renderClasses();
renderTasks();
updateStats();
setupDatePicker();
setupModals();
setupTabs();
setupDropdowns();
setupForms();
setupFilterButtons();
setupMainButtons();

// Initially hide focus mode button if no active task
const focusModeBtn = document.getElementById("focusModeBtn");
focusModeBtn.classList.add("hidden");
};

// Start the app
document.addEventListener("DOMContentLoaded", init);


