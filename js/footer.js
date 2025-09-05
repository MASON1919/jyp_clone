async function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;
    try {
        const response = await fetch('footer.html');
        const footerHtml = await response.text();
        footerPlaceholder.innerHTML = footerHtml;
    } catch (error) {
        console.error('메뉴를 불러오는 중 오류가 발생했습니다:', error);
    }
}
document.addEventListener('DOMContentLoaded', loadFooter);