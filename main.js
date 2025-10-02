const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.querySelector('ul');
const allFilter = document.getElementById('allFilter');
const activeFilter = document.getElementById('activeFilter');
const completedFilter = document.getElementById('completedFilter');


// Silme sesi için audio nesnesini oluştur
const deleteSound = new Audio('sounds/delete-sound.mp3');
const addSound = new Audio('sounds/add-sound.mp3');
// Sesi önceden yükle
deleteSound.load();
addSound.load();

// Input boyutunu dinamik olarak ayarlama
function adjustInputWidth() {
    const defaultWidth = 200; // Default genişlik (px)
    const content = taskInput.value;
    
    // Görünmez bir span oluştur ve içeriği ölç
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = window.getComputedStyle(taskInput).font;
    span.textContent = content;
    document.body.appendChild(span);
    
    // Minimum genişliği hesapla (padding dahil)
    const contentWidth = span.getBoundingClientRect().width;
    const newWidth = Math.max(defaultWidth, contentWidth + 40); // 40px ekstra alan için
    
    // Span'i kaldır
    document.body.removeChild(span);
    
    // Input genişliğini ayarla
    taskInput.style.width = newWidth + 'px';
}

// Input değiştiğinde boyutu güncelle
taskInput.addEventListener('input', adjustInputWidth);

// Görevleri kaydetme fonksiyonu
function saveTasks() {
    const allTasks = document.querySelectorAll('li');
    const tasksArray = Array.from(allTasks).map(li => {
        const span = li.querySelector('span');
        const checkBox = li.querySelector('input[type="checkbox"]');
        return { text: span.textContent, completed: checkBox.checked };
    });
    localStorage.setItem('tasks', JSON.stringify(tasksArray));
}

// Görevleri yükleme fonksiyonu
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        createTaskElement(task.text, task.completed);
    });
}

// Görev elementi oluşturma fonksiyonu
function createTaskElement(taskText, completed = false) {
    const li = document.createElement('li');
    li.draggable = true;
    
    // Checkbox oluşturma
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.className = 'checkBox';
    checkBox.checked = completed;
    li.appendChild(checkBox);
    
    // Task metni için span oluşturma
    const span = document.createElement('span');
    span.textContent = taskText;
    li.appendChild(span);

    // Tamamlanma durumuna göre stil uygulama
    if (completed) {
        span.style.textDecoration = 'line-through';
    }

    // Delete butonu oluşturma
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'deleteButton';
    li.appendChild(deleteButton);
    
    // Event listener'ları ekleme
    deleteButton.addEventListener('click', () => {
        // Silme sesini çal
        deleteSound.currentTime = 0; // Sesi baştan başlat
        deleteSound.play();

        // Animasyonu başlatmak için sınıfı ekle
        li.classList.add('fade-out'); 

        // Animasyon tamamlandığında ne olacağını belirle
        li.addEventListener('transitionend', () => {
            li.remove(); // Animasyon bittiğinde öğeyi listeden sil
            saveTasks(); // Değişiklikleri Local Storage'a kaydet
        });
    });
    
    checkBox.addEventListener('change', () => {
        span.style.textDecoration = checkBox.checked ? 'line-through' : 'none';
        saveTasks();
        // Mevcut filtreyi tekrar uygula
        filterTask(currentFilter);
    });
    
    // Sürükleme olayları
    li.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
    });

    li.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        saveTasks();
    });

    // Görev düzenleme özelliği
    span.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = span.textContent;
        input.className = 'editInput';
        li.replaceChild(input, span);
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (input.value.trim() !== '') {
                    span.textContent = input.value.trim();
                    li.replaceChild(span, input);
                    saveTasks();
                } else {
                    alert("Task cannot be empty!");
                }
            }
        });
    });

    taskList.appendChild(li);
}

// Sürükle ve Bırak: 'dragover' olayını tek bir yerde yönetme
taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...taskList.querySelectorAll('li:not(.dragging)')];
    
    const nextSibling = siblings.find(sibling => {
        const rect = sibling.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        return e.clientY < centerY;
    });
    
    if (nextSibling) {
        taskList.insertBefore(draggingItem, nextSibling);
    } else {
        taskList.appendChild(draggingItem);
    }
});

// Add butonu için event listener
addButton.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        alert("Task cannot be empty!");
        return;
    }
    createTaskElement(taskText);
    taskInput.value = '';
    addSound.currentTime = 0; // Sesi baştan başlat
    addSound.play(); // Sesi çal
    saveTasks();
    filterTask(currentFilter); // Mevcut filtreyi uygula
});

// Enter tuşu için event listener
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addButton.click();
    }
});
// Global değişkenler
let currentFilter = 'all';

// Filtreleme fonksiyonu
function filterTask(filterType) {
    currentFilter = filterType;
    const allTasks = document.querySelectorAll('li');
    
    // Önce tüm filtre butonlarından active class'ı kaldır
    [allFilter, activeFilter, completedFilter].forEach(btn => {
        btn.classList.remove('active-filter');
    });
    
    // Tıklanan filtreye active class'ı ekle
    document.getElementById(`${filterType}Filter`).classList.add('active-filter');
    
    allTasks.forEach(li => {
        const checkBox = li.querySelector('input[type="checkbox"]');
        switch(filterType) {
            case 'all':
                li.style.display = 'flex';
                break;
            case 'active':
                li.style.display = checkBox.checked ? 'none' : 'flex';
                break;
            case 'completed':
                li.style.display = checkBox.checked ? 'flex' : 'none';
                break;
            default:
                li.style.display = 'flex';
        }
    });
}

// Filtre butonlarına event listener'ları ekle
allFilter.addEventListener('click', () => filterTask('all'));
activeFilter.addEventListener('click', () => filterTask('active'));
completedFilter.addEventListener('click', () => filterTask('completed'));
// Sayfa yüklendiğinde görevleri yükle ve varsayılan filtreyi uygula
loadTasks();
filterTask('all');