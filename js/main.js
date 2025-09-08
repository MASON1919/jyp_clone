// 최선호, 진창훈, 이은광 - 개선된 유튜브 자동재생 + 모바일 개선 (음소거 버튼 제거)
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const hero = document.querySelector('.hero');
const detailSections = document.querySelectorAll('.detail-section');
const backToHeroBtns = document.querySelectorAll('.back-to-hero');
const scrollIndicator = document.querySelector('.scroll-indicator');
const pageCounter = document.getElementById('page-counter');
const mobileGuide = document.querySelector('.mobile-touch-guide');
const mobileTitleTrigger = document.querySelector('.mobile-title-trigger');

let index = 0;
let autoSlide;
let isMuted = true; // 항상 음소거 상태 유지
let isDetailView = false;
let isTransitioning = false;
let players = {}; // 유튜브 플레이어 객체들을 저장
let playersReady = {}; // 각 플레이어의 준비 상태 추적
const totalSlides = 5;

// 모바일 감지 함수
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 페이지 카운터 업데이트 함수
function updatePageCounter() {
  const current = index + 1;
  const total = totalSlides;
  if (pageCounter) pageCounter.textContent = `◀${current}/${total}`;
}

// 모바일 가이드 업데이트 함수
function updateMobileGuide() {
  if (mobileTitleTrigger && isMobileDevice()) {
    const currentSlide = slides[index];
    const slideContent = currentSlide?.querySelector('.slide-content h1');
    if (slideContent) {
      mobileTitleTrigger.textContent = slideContent.textContent;
    }
  }
}

// 유튜브 API 준비 완료 콜백
function onYouTubeIframeAPIReady() {
  console.log('YouTube API Ready');
  initializePlayers();
}

// 유튜브 플레이어 초기화
function initializePlayers() {
  slides.forEach((slide, i) => {
    const youtubeId = slide.getAttribute('data-youtube-id');
    if (youtubeId) {
      try {
        players[i] = new YT.Player(`youtube-player-${i}`, {
          height: '100%',
          width: '100%',
          videoId: youtubeId,
          playerVars: {
            'autoplay': 0, // 초기화 시에는 자동재생 하지 않음
            'mute': 1, // 항상 음소거
            'loop': 1,
            'playlist': youtubeId,
            'controls': 0,
            'showinfo': 0,
            'rel': 0,
            'modestbranding': 1,
            'iv_load_policy': 3,
            'fs': 0,
            'cc_load_policy': 0,
            'disablekb': 1,
            'playsinline': 1
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
          }
        });
      } catch (error) {
        console.error(`Error creating player ${i}:`, error);
      }
    }
  });
}

// 플레이어 준비 완료
function onPlayerReady(event) {
  const playerIndex = getPlayerIndex(event.target);
  console.log(`Player ${playerIndex} ready`);
  playersReady[playerIndex] = true;
  
  // 첫 번째 플레이어만 즉시 재생
  if (playerIndex === 0) {
    setTimeout(() => {
      playCurrentVideo();
      updatePageCounter();
      updateMobileGuide();
    }, 500);
  }
}

// 플레이어 상태 변경
function onPlayerStateChange(event) {
  const playerIndex = getPlayerIndex(event.target);
  
  // 동영상 종료 시 다음 슬라이드로 (디테일 뷰가 아닐 때만)
  if (event.data === YT.PlayerState.ENDED && playerIndex === index && !isDetailView) {
    setTimeout(() => {
      nextSlide();
      resetAutoSlide();
    }, 1000);
  }
  
  // 재생 시작 시 로그
  if (event.data === YT.PlayerState.PLAYING) {
    console.log(`Video ${playerIndex} started playing`);
  }
}

// 플레이어 에러 처리
function onPlayerError(event) {
  console.error('YouTube Player Error:', event.data);
}

// 플레이어 인덱스 찾기
function getPlayerIndex(player) {
  for (let i in players) {
    if (players[i] === player) {
      return parseInt(i);
    }
  }
  return -1;
}

// 현재 동영상 재생
function playCurrentVideo() {
  if (!players[index] || !playersReady[index]) {
    console.log(`Player ${index} not ready yet, retrying...`);
    // 플레이어가 준비되지 않았으면 잠시 후 재시도
    setTimeout(() => playCurrentVideo(), 500);
    return;
  }

  try {
    // 항상 음소거 상태 유지
    players[index].mute();
    
    // 동영상 재생
    players[index].playVideo();
    console.log(`Playing video ${index}`);
    
    // 재생 상태 확인
    setTimeout(() => {
      const state = players[index].getPlayerState();
      console.log(`Video ${index} state after play attempt:`, state);
      if (state !== YT.PlayerState.PLAYING) {
        console.log(`Retrying play for video ${index}`);
        players[index].playVideo();
      }
    }, 1000);
  } catch (error) {
    console.error(`Error playing video ${index}:`, error);
  }
}

// 모든 동영상 정지
function stopAllVideos() {
  Object.keys(players).forEach(i => {
    if (players[i] && playersReady[i]) {
      try {
        players[i].pauseVideo();
      } catch (error) {
        console.error(`Error stopping video ${i}:`, error);
      }
    }
  });
}

function showSlide(i) {
  if (isTransitioning) return;
  
  isTransitioning = true;
  
  // 모든 슬라이드 숨기기 및 동영상 정지
  slides.forEach((slide, idx) => {
    slide.classList.remove('active');
  });
  
  stopAllVideos();

  // 현재 슬라이드만 활성화
  const activeSlide = slides[i];
  if (activeSlide) {
    activeSlide.classList.add('active');
    
    // 잠시 후 현재 동영상 재생 (트랜지션 완료 후)
    setTimeout(() => {
      playCurrentVideo();
      isTransitioning = false;
    }, 300);
  } else {
    isTransitioning = false;
  }
  
  // 페이지 카운터 및 모바일 가이드 업데이트
  updatePageCounter();
  updateMobileGuide();
}

function nextSlide() {
  if (isTransitioning) return;
  index = (index + 1) % totalSlides;
  console.log(`Next slide: ${index}`);
  showSlide(index);
}

function prevSlide() {
  if (isTransitioning) return;
  index = (index - 1 + totalSlides) % totalSlides;
  console.log(`Previous slide: ${index}`);
  showSlide(index);
}

// 디테일 섹션 표시 (스크롤 다운 또는 모바일 터치)
function showDetailSection(sectionId) {
  if (isTransitioning || isDetailView) return;
  
  console.log(`Showing detail section: ${sectionId}`);
  isTransitioning = true;
  isDetailView = true;
  clearInterval(autoSlide);

  // 현재 동영상 정지
  stopAllVideos();

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
    console.log('Detail section transition complete');
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
  setTimeout(() => {
    showSlide(index);
    // 전환 완료 후 자동 슬라이드 재시작
    setTimeout(() => {
      startAutoSlide();
    }, 1000);
  }, 100);

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

// 모바일 터치 가이드 클릭 이벤트
if (mobileTitleTrigger) {
  mobileTitleTrigger.addEventListener('click', () => {
    if (!isDetailView && !isTransitioning && isMobileDevice()) {
      const currentSlide = slides[index];
      const sectionId = currentSlide?.getAttribute('data-section');
      if (sectionId) {
        showDetailSection(sectionId);
      }
    }
  });
}

// 돌아가기 버튼 이벤트
backToHeroBtns.forEach(btn => {
  btn.addEventListener('click', backToHero);
});

// 스크롤 이벤트 - 방향별 처리 (데스크톱만)
let scrollTimeout;
let lastScrollTime = 0;
const scrollDelay = 300;

window.addEventListener('wheel', (e) => {
  // 모바일에서는 스크롤 이벤트 무시
  if (isMobileDevice()) return;
  
  e.preventDefault();
  
  const currentTime = Date.now();
  
  if (currentTime - lastScrollTime < scrollDelay) return;
  lastScrollTime = currentTime;
  
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
    if (!isDetailView && scrollIndicator && !isMobileDevice()) {
      scrollIndicator.style.opacity = '1';
    }
  }, 2000);
}, { passive: false });

// 터치 이벤트 (모바일) - 스와이프 네비게이션만
let touchStartY = 0;
let touchStartX = 0;
let touchEndY = 0;
let touchEndX = 0;
let lastTouchTime = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (!isMobileDevice()) return;
  
  const currentTime = Date.now();
  
  if (currentTime - lastTouchTime < scrollDelay) return;
  lastTouchTime = currentTime;
  
  touchEndY = e.changedTouches[0].clientY;
  touchEndX = e.changedTouches[0].clientX;
  handleTouch();
}, { passive: true });

function handleTouch() {
  const touchDiffY = touchStartY - touchEndY;
  const touchDiffX = touchStartX - touchEndX;

  // 수직 스와이프가 수평 스와이프보다 클 때만 처리
  if (Math.abs(touchDiffY) > Math.abs(touchDiffX) && Math.abs(touchDiffY) > 50) {
    if (isDetailView && touchDiffY < 0) {
      // 디테일 섹션에서 아래로 스와이프 -> 히어로 섹션으로 돌아가기
      backToHero();
    }
  }
  
  // 수평 스와이프 - 슬라이드 네비게이션
  if (Math.abs(touchDiffX) > Math.abs(touchDiffY) && Math.abs(touchDiffX) > 50 && !isDetailView) {
    if (touchDiffX > 0) {
      // 오른쪽 스와이프 -> 다음 슬라이드
      nextSlide();
      resetAutoSlide();
    } else {
      // 왼쪽 스와이프 -> 이전 슬라이드
      prevSlide();
      resetAutoSlide();
    }
  }
}

function startAutoSlide() {
  if (!isDetailView && !isTransitioning) {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => {
      if (!isDetailView && !isTransitioning) {
        nextSlide();
      }
    }, 15000);
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
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const currentSlide = slides[index];
    const sectionId = currentSlide?.getAttribute('data-section');
    if (sectionId) {
      showDetailSection(sectionId);
    }
  }
});

// 페이지 가시성 변경 시 처리 (탭 전환 등)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 페이지가 숨겨질 때 모든 동영상 정지
    stopAllVideos();
    clearInterval(autoSlide);
  } else {
    // 페이지가 다시 보일 때 현재 동영상 재생
    if (!isDetailView) {
      setTimeout(() => {
        playCurrentVideo();
        startAutoSlide();
      }, 500);
    }
  }
});

// 화면 크기 변경 시 처리
window.addEventListener('resize', () => {
  updateMobileGuide();
  
  // 모바일에서 데스크톱으로 변경되거나 그 반대일 때 UI 업데이트
  if (scrollIndicator) {
    if (isMobileDevice()) {
      scrollIndicator.style.display = 'none';
    } else {
      scrollIndicator.style.display = 'block';
      if (!isDetailView) {
        scrollIndicator.style.opacity = '1';
      }
    }
  }
  
  if (mobileGuide) {
    if (isMobileDevice()) {
      mobileGuide.style.display = 'block';
    } else {
      mobileGuide.style.display = 'none';
    }
  }
});

// 초기화 및 이벤트 설정
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  
  // 초기 페이지 카운터 설정
  updatePageCounter();
  
  // 초기 모바일 가이드 설정
  updateMobileGuide();

  // 유튜브 API 로딩 확인 및 초기화
  if (typeof YT !== 'undefined' && YT.Player) {
    console.log('YouTube API already loaded');
    initializePlayers();
  } else {
    console.log('Waiting for YouTube API...');
    // API 로딩 대기
    let checkCount = 0;
    const checkAPI = setInterval(() => {
      checkCount++;
      if (typeof YT !== 'undefined' && YT.Player) {
        console.log('YouTube API loaded after waiting');
        clearInterval(checkAPI);
        initializePlayers();
      } else if (checkCount > 20) { // 10초 후 포기
        console.error('YouTube API failed to load');
        clearInterval(checkAPI);
      }
    }, 500);
  }

  

  // 초기 UI 상태 설정
  if (isMobileDevice()) {
    if (scrollIndicator) scrollIndicator.style.display = 'none';
    if (mobileGuide) mobileGuide.style.display = 'block';
  } else {
    if (mobileGuide) mobileGuide.style.display = 'none';
    // 스크롤 인디케이터 초기 표시
    setTimeout(() => {
      if (!isDetailView && scrollIndicator) {
        scrollIndicator.style.opacity = '1';
      }
    }, 2000);
  }

});