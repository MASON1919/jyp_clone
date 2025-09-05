function initializeMenu() {
    const navbarOriginal = document.getElementById('navbar-original');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerBtn2 = document.getElementById('hamburger-btn2');
    const fullScreenMenu = document.getElementById('full-screen-menu');
    const fullScreenBackground = document.getElementById('full-screen-background');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const hamburgerIcon2 = document.getElementById('hamburger-icon2');
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html')) {
        document.body.classList.add('white-text-page');
        hamburgerIcon.classList.add('on-index');
        hamburgerIcon2.classList.add('on-index');
    }

    
    hamburgerIcon.addEventListener('click', () => {
        hamburgerIcon.classList.toggle('active');
        hamburgerIcon2.classList.toggle('active');
        fullScreenMenu.classList.toggle('active');
        fullScreenMenu.classList.toggle('opened');
        fullScreenBackground.classList.toggle('active');
        navbarOriginal.classList.toggle('display-none');
    });

    
    hamburgerIcon2.addEventListener('click', () => {
        hamburgerIcon.classList.toggle('active');
        hamburgerIcon2.classList.toggle('active');
        fullScreenMenu.classList.toggle('active');
        fullScreenMenu.classList.toggle('opened');
        fullScreenBackground.classList.toggle('active');
        navbarOriginal.classList.toggle('display-none');
    });
}

async function loadMenu() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    try {
        const response = await fetch('navbar.html');
        const menuHtml = await response.text();
        headerPlaceholder.innerHTML = menuHtml;
        initializeMenu();

    } catch (error) {
        console.error('메뉴를 불러오는 중 오류가 발생했습니다:', error);
    }
}
document.addEventListener('DOMContentLoaded', loadMenu);