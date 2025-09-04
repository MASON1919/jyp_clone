// 최선호, 진창훈, 이은광
document.addEventListener('DOMContentLoaded', () => {
    const navbarOriginal = document.getElementById('navbar-original');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerBtn2 = document.getElementById('hamburger-btn2');
    const fullScreenMenu = document.getElementById('full-screen-menu');
    const fullScreenBackground = document.getElementById('full-screen-background');
    /*const logo = document.getElementById('logo');
    const container = document.getElementById('container');
    const header = document.getElementById('header');*/

    hamburgerBtn.addEventListener('click', () => {
        fullScreenMenu.classList.toggle('active');
        fullScreenMenu.classList.toggle('opened');
        fullScreenBackground.classList.toggle('active');
        navbarOriginal.classList.toggle('display-none');
    });
    hamburgerBtn2.addEventListener('click', () => {
        fullScreenMenu.classList.toggle('active');
        fullScreenMenu.classList.toggle('opened');
        fullScreenBackground.classList.toggle('active');
        navbarOriginal.classList.toggle('display-none');
    });
});