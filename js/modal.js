const posts = document.querySelectorAll(".artist-card");
const modal = document.getElementById("myModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalImg = document.getElementById("modalImg");
const closeBtn = document.getElementById("closeBtn");

// 게시물 클릭 → 모달 열기
posts.forEach(post => {
    post.addEventListener("click", () => {
        modalTitle.textContent = post.dataset.name;
        modalContent.textContent = post.dataset.content;
        modal.classList.add("show");

        const img = post.querySelector("img");
        modalImg.src = img.src;
        modalImg.alt = img.alt;
    });
});

// 닫기 버튼
closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
});

// 배경 클릭 시 닫기
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
});