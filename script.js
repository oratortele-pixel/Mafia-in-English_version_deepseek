// КОНФИГУРАЦИЯ - ЗАМЕНИТЕ ЭТУ ССЫЛКУ НА СВОЮ!
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ38ipgxTj31l34K_2bklFDdCe3oIt_pI6tGEZWOixLLF8vpHQv0ZzDnZYBALdwMfTHAxXhVF0So5Ty/pub?output=csv';

// Глобальные переменные
let stories = []; // Массив для хранения всех историй
let currentStoryIndex = 0; // Индекс текущей отображаемой истории

// Функция для загрузки данных из Google Sheets
async function loadStories() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const csvData = await response.text();

        // Простая парсилка CSV (для вашего формата с 4 колонками сработает)
        const rows = csvData.split('\n').slice(1); // Пропускаем заголовок
        stories = rows.map(row => {
            // Упрощенное разбиение строки CSV
            const [date, title, imageURL, story] = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(field => field.trim().replace(/^"|"$/g, ''));
            return { date, title, imageURL, story };
        }).filter(story => story.title); // Фильтруем пустые строки

        // Сортируем по дате, новые сверху (предполагаем формат ГГГГ-ММ-ДД)
        stories.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Заполняем выпадающий список
        populateArchiveDropdown();
        // Показываем первую историю
        showStory(0);
        // Обновляем состояние кнопок навигации
        updateNavigation();

    } catch (error) {
        console.error('Error loading stories:', error);
        document.getElementById('storyViewer').innerHTML = '<p class="loader">Failed to load the stories. Meow?</p>';
    }
}

// Функция для заполнения выпадающего списка
function populateArchiveDropdown() {
    const dropdown = document.getElementById('archiveDropdown');
    // Очищаем все опции, кроме первой ("Select a story...")
    dropdown.innerHTML = '<option value="">Select a story...</option>';

    stories.forEach((story, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = story.title;
        dropdown.appendChild(option);
    });

    // Назначаем обработчик события
    dropdown.onchange = function() {
        const selectedIndex = parseInt(this.value);
        if (!isNaN(selectedIndex)) {
            showStory(selectedIndex);
        }
    };
}

// Функция для отображения истории по индексу
function showStory(index) {
    const viewer = document.getElementById('storyViewer');
    if (index >= 0 && index < stories.length) {
        currentStoryIndex = index;
        const story = stories[index];

        viewer.innerHTML = `
            <h2 class="story-title">${story.title}</h2>
            ${story.imageURL ? `<img src="${story.imageURL}" alt="${story.title}" class="story-image" onerror="this.style.display='none'">` : ''}
            <div class="story-text">${story.story}</div>
        `;
    } else {
        viewer.innerHTML = '<p class="loader">Story not found.</p>';
    }
    // После отрисовки обновляем кнопки и выбор в dropdown
    updateNavigation();
    updateDropdownSelection();
}

// Обновляет состояние кнопок "Next/Previous"
function updateNavigation() {
    document.getElementById('prevBtn').disabled = currentStoryIndex === 0;
    document.getElementById('nextBtn').disabled = currentStoryIndex === stories.length - 1;
}

// Обновляет выбранный пункт в выпадающем списке
function updateDropdownSelection() {
    const dropdown = document.getElementById('archiveDropdown');
    dropdown.value = currentStoryIndex;
}

// Функции для кнопок навигации
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentStoryIndex > 0) {
        showStory(currentStoryIndex - 1);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentStoryIndex < stories.length - 1) {
        showStory(currentStoryIndex + 1);
    }
});

// Функция для кнопок "Поделиться"
function share(platform) {
    const currentStory = stories[currentStoryIndex];
    const currentUrl = encodeURIComponent(window.location.href + '?story=' + currentStoryIndex); // Простая реализация ссылки
    const text = encodeURIComponent(`Check out this story: "${currentStory.title}" from Minsk Mafia!`);

    let shareUrl;
    switch (platform) {
        case 'Telegram':
            shareUrl = `https://t.me/share/url?url=${currentUrl}&text=${text}`;
            break;
        case 'WhatsApp':
            shareUrl = `https://wa.me/?text=${text}%20${currentUrl}`;
            break;
        case 'Other':
            navigator.clipboard.writeText(window.location.href + '?story=' + currentStoryIndex).then(() => {
                alert('Link copied to clipboard!');
            });
            return; // Прерываем, т.к. не нужно открывать новое окно
        default:
            return;
    }
    window.open(shareUrl, '_blank');
}

// Загружаем истории сразу после загрузки скрипта
loadStories();
