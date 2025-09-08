import '../node_modules/masonry-layout/dist/masonry.pkgd.min.js';
import '../node_modules/imagesloaded/imagesloaded.pkgd.min.js';

const API_KEY = 'YGoLLp5rX1beGpR045tJm1MzjPzvLqsrblsMyKuXVfbSYC7FvNNtcfG9';
const container = document.getElementById('image-container');
const searchInput = document.getElementById('search-query');
const searchButton = document.getElementById('search-button');
const loader = document.getElementById('loader');


const msnry = new Masonry(container, {
    itemSelector: '.gallery-item',
    percentPosition: true,
    gutter: 15
});

let currentPage = 1;
let currentQuery = '';
let isLoading = false;

async function startNewSearch() {
    const query = searchInput.value.trim();
    if (query === '') {
        alert('검색어를 입력해주세요.');
        return;
    }

    container.innerHTML = ''; 
    msnry.reloadItems();
    msnry.layout();
    
    currentPage = 1;
    currentQuery = query;
    searchInput.value = '';
    observer.observe(loader);
    
    await displayImages();
}

async function displayImages() {
    if (isLoading) return;
    isLoading = true;
    loader.classList.add('visible');

    try {
        const url = `https://api.pexels.com/v1/search?query=${currentQuery}&per_page=20&page=${currentPage}`;
        const response = await fetch(url, { headers: { Authorization: API_KEY } });
        if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);
        const data = await response.json();

        if (data.photos.length === 0 && currentPage > 1) {
            loader.textContent = '더 이상 이미지가 없습니다.';
            observer.disconnect();
        } else {
            appendImages(data.photos);
            currentPage++;
        }
    } catch (error) {
        console.error('API 호출 실패:', error);
        loader.textContent = '이미지를 불러오지 못했습니다.';
    } finally {
        isLoading = false;
        if (currentPage > 1) loader.classList.remove('visible');
    }
}

function appendImages(photos) {
    if (photos.length === 0 && currentPage === 1) {
        container.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    const newItems = [];
    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        const img = document.createElement('img');
        img.src = photo.src.medium;
        img.alt = photo.alt;
        item.appendChild(img);
        fragment.appendChild(item);
        newItems.push(item);
    });

    container.appendChild(fragment);

    msnry.appended(newItems);

    imagesLoaded(newItems).on('progress', function() {
        msnry.layout();
    });
}

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading) {
        displayImages();
    }
}, {
    threshold: 0.8
});

observer.observe(loader);

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') startNewSearch();
});
searchButton.addEventListener('click', startNewSearch);

async function initialLoad() {
    currentQuery = 'landscape';
    await displayImages();
}
initialLoad();