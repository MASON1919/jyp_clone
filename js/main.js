// 최선호, 진창훈, 이은광
const slides = document.querySelectorAll('.slide');
const videos = document.querySelectorAll('.slide video');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const soundBtn = document.getElementById('soundToggle');
const hero = document.querySelector('.hero');
const detailSections = document.querySelectorAll('.detail-section');
const backToHeroBtns = document.querySelectorAll('.back-to-hero');
const scrollIndicator = document.querySelector('.scroll-indicator');

let index = 0;
let autoSlide;
let isMuted = true;
let isDetailView = false;
let isTransitioning = false; // 전환 중 중복 방지

function showSlide(i) {
  // 모든 슬라이드 숨기기
  slides.forEach((slide) => {
    slide.classList.remove('active');
    const video = slide.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  // 현재 슬라이드만 활성화
  const activeSlide = slides[i];
  const activeVideo = videos[i];
  if (activeSlide) activeSlide.classList.add('active');
  if (activeVideo) {
    activeVideo.muted = isMuted;
    const playPromise = activeVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }
}

function nextSlide() {
  if (isTransitioning) return;
  index = (index + 1) % slides.length;
  showSlide(index);
}

function prevSlide() {
  if (isTransitioning) return;
  index = (index - 1 + slides.length) % slides.length;
  showSlide(index);
}

// 음소거/음소거 해제 기능
function toggleSound() {
  isMuted = !isMuted;
  videos.forEach(video => {
    video.muted = isMuted;
  });
  if (soundBtn) soundBtn.textContent = isMuted ? '🔇' : '🔊';
}

// 디테일 섹션 표시 (스크롤 다운)
function showDetailSection(sectionId) {
  if (isTransitioning || isDetailView) return;
  
  isTransitioning = true;
  isDetailView = true;
  clearInterval(autoSlide);

  // 모든 디테일 섹션 숨기기
  detailSections.forEach(section => {
    section.classList.remove('active');
  });

  // 선택된 섹션만 표시
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // 전환 완료 후 플래그 해제
  setTimeout(() => {
    isTransitioning = false;
  }, 800);

  // 스크롤을 맨 위로
  window.scrollTo(0, 0);
}

// 히어로 섹션으로 돌아가기 (스크롤 업)
function backToHero() {
  if (isTransitioning || !isDetailView) return;
  
  isTransitioning = true;
  isDetailView = false;

  // 모든 디테일 섹션 숨기기
  detailSections.forEach(section => {
    section.classList.remove('active');
  });

  // 현재 슬라이드 다시 표시 및 재생
  showSlide(index);

  // 전환 완료 후 자동 슬라이드 재시작
  setTimeout(() => {
    isTransitioning = false;
    startAutoSlide();
  }, 800);

  // 스크롤을 맨 위로
  window.scrollTo(0, 0);
}

// 이벤트 리스너
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (!isDetailView && !isTransitioning) {
      nextSlide();
      resetAutoSlide();
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (!isDetailView && !isTransitioning) {
      prevSlide();
      resetAutoSlide();
    }
  });
}

if (soundBtn) soundBtn.addEventListener('click', toggleSound);

// 돌아가기 버튼 이벤트 (복수 요소 지원)
backToHeroBtns.forEach(btn => {
  btn.addEventListener('click', backToHero);
});

// 스크롤 이벤트 - 방향별 처리
let scrollTimeout;
let lastScrollTime = 0;
const scrollDelay = 300; // 스크롤 딜레이 (밀리초)

window.addEventListener('wheel', (e) => {
  e.preventDefault(); // 기본 스크롤 방지
  
  const currentTime = Date.now();
  
  // 너무 빠른 연속 스크롤 방지
  if (currentTime - lastScrollTime < scrollDelay) return;
  lastScrollTime = currentTime;
  
  // 스크롤 인디케이터 숨기기
  if (scrollIndicator) scrollIndicator.style.opacity = '0';

  clearTimeout(scrollTimeout);

  if (!isDetailView && e.deltaY > 0) {
    // 히어로 섹션에서 아래로 스크롤 -> 디테일 섹션 표시
    const currentSlide = slides[index];
    const sectionId = currentSlide?.getAttribute('data-section');
    if (sectionId) {
      showDetailSection(sectionId);
    }
  } else if (isDetailView && e.deltaY < 0) {
    // 디테일 섹션에서 위로 스크롤 -> 히어로 섹션으로 돌아가기
    backToHero();
  }

  scrollTimeout = setTimeout(() => {
    if (!isDetailView && scrollIndicator) {
      scrollIndicator.style.opacity = '1';
    }
  }, 2000);
}, { passive: false });

// 터치 이벤트 (모바일)
let touchStartY = 0;
let touchEndY = 0;
let lastTouchTime = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const currentTime = Date.now();
  
  // 너무 빠른 연속 터치 방지
  if (currentTime - lastTouchTime < scrollDelay) return;
  lastTouchTime = currentTime;
  
  touchEndY = e.changedTouches[0].clientY;
  handleTouch();
}, { passive: true });

function handleTouch() {
  const touchDiff = touchStartY - touchEndY;

  if (Math.abs(touchDiff) > 50) { // 최소 스와이프 거리
    if (!isDetailView && touchDiff > 0) {
      // 히어로 섹션에서 위로 스와이프 -> 디테일 섹션 표시
      const currentSlide = slides[index];
      const sectionId = currentSlide?.getAttribute('data-section');
      if (sectionId) {
        showDetailSection(sectionId);
      }
    } else if (isDetailView && touchDiff < 0) {
      // 디테일 섹션에서 아래로 스와이프 -> 히어로 섹션으로 돌아가기
      backToHero();
    }
  }
}

function startAutoSlide() {
  if (!isDetailView && !isTransitioning) {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 8000);
  }
}

function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
  if (isDetailView) {
    if (e.key === 'Escape' || e.key === 'ArrowUp') {
      e.preventDefault();
      backToHero();
    }
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
    resetAutoSlide();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextSlide();
    resetAutoSlide();
  } else if (e.key === ' ') {
    e.preventDefault();
    toggleSound();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const currentSlide = slides[index];
    const sectionId = currentSlide?.getAttribute('data-section');
    if (sectionId) {
      showDetailSection(sectionId);
    }
  }
});

// 동영상 로딩 완료 후 초기 실행
window.addEventListener('DOMContentLoaded', () => {
  // 초기 음소거 반영 및 버튼 아이콘 동기화
  videos.forEach(v => { v.muted = isMuted; });
  if (soundBtn) soundBtn.textContent = isMuted ? '🔇' : '🔊';

  // 첫 번째 동영상 재생 준비
  const first = videos[0];
  const init = () => {
    showSlide(index);
    startAutoSlide();
  };
  
  if (first) {
    if (first.readyState >= 2) {
      init();
    } else {
      first.addEventListener('loadeddata', init, { once: true });
    }
  } else {
    // 동영상이 없어도 초기화
    init();
  }

  // 동영상이 끝났을 때 자동으로 다음 슬라이드로 이동
  videos.forEach((video, idx) => {
    video.addEventListener('ended', () => {
      if (idx === index && !isDetailView && !isTransitioning) {
        nextSlide();
        resetAutoSlide();
      }
    });
  });

  // 마우스 호버 시 자동 슬라이드 일시정지
  if (hero) {
    hero.addEventListener('mouseenter', () => {
      if (!isDetailView) {
        clearInterval(autoSlide);
      }
    });

    hero.addEventListener('mouseleave', () => {
      if (!isDetailView) {
        startAutoSlide();
      }
    });
  }

  // 스크롤 인디케이터 초기 표시
  setTimeout(() => {
    if (!isDetailView && scrollIndicator) {
      scrollIndicator.style.opacity = '1';
    }
  }, 2000);
});