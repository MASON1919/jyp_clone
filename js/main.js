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
let userInteracted = false; // 사용자 상호작용 여부 추적
let forceAutoplay = false; // 강제 자동재생 플래그
const totalSlides = 5;

// 모바일 감지 함수
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 사용자 상호작용 감지 및 자동재생 활성화
function enableUserInteraction() {
  if (!userInteracted) {
    userInteracted = true;
    forceAutoplay = true;
    console.log('🎬 User interaction detected - enabling full autoplay');
    
    // 모든 플레이어에 자동재생 권한 부여
    Object.keys(players).forEach(i => {
      if (players[i] && playersReady[i]) {
        try {
          players[i].mute(); // 확실히 음소거
        } catch (error) {
          console.error(`Error muting player ${i}:`, error);
        }
      }
    });
    
    // 현재 활성 슬라이드의 비디오 즉시 재생
    setTimeout(() => {
      playCurrentVideo();
    }, 100);
  }
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
  console.log('🎯 YouTube API Ready');
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
            'autoplay': 1, // 모든 플레이어에 자동재생 설정
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
            'playsinline': 1,
            'enablejsapi': 1,
            'start': 0 // 처음부터 시작
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
          }
        });
        console.log(`🎥 Player ${i} initialized with video ID: ${youtubeId}`);
      } catch (error) {
        console.error(`❌ Error creating player ${i}:`, error);
      }
    }
  });
}

// 플레이어 준비 완료
function onPlayerReady(event) {
  const playerIndex = getPlayerIndex(event.target);
  console.log(`✅ Player ${playerIndex} ready`);
  playersReady[playerIndex] = true;
  
  // 모든 플레이어를 음소거로 설정
  try {
    event.target.mute();
    console.log(`🔇 Player ${playerIndex} muted`);
  } catch (error) {
    console.error(`❌ Error muting player ${playerIndex}:`, error);
  }
  
  // 첫 번째 플레이어는 즉시 재생 시도
  if (playerIndex === 0) {
    setTimeout(() => {
      playCurrentVideo();
      updatePageCounter();
      updateMobileGuide();
      startAutoSlide();
    }, 500);
  } else {
    // 다른 플레이어들은 일시정지 상태로 대기
    setTimeout(() => {
      try {
        event.target.pauseVideo();
      } catch (error) {
        console.error(`Error pausing player ${playerIndex}:`, error);
      }
    }, 100);
  }
}

// 플레이어 상태 변경
function onPlayerStateChange(event) {
  const playerIndex = getPlayerIndex(event.target);
  const stateNames = {
    [-1]: 'UNSTARTED',
    [0]: 'ENDED',
    [1]: 'PLAYING',
    [2]: 'PAUSED',
    [3]: 'BUFFERING',
    [5]: 'CUED'
  };
  
  console.log(`🎬 Player ${playerIndex} state: ${stateNames[event.data] || event.data}`);
  
  // 동영상 종료 시 다음 슬라이드로 (디테일 뷰가 아닐 때만)
  if (event.data === YT.PlayerState.ENDED && playerIndex === index && !isDetailView) {
    console.log(`🎬 Video ${playerIndex} ended, moving to next slide`);
    setTimeout(() => {
      nextSlide();
      resetAutoSlide();
    }, 1000);
  }
  
  // 재생 시작 시
  if (event.data === YT.PlayerState.PLAYING) {
    console.log(`▶️ Video ${playerIndex} started playing`);
    userInteracted = true;
    forceAutoplay = true;
  }
  
  // 현재 활성 슬라이드가 일시정지되면 즉시 재시작 시도
  if (event.data === YT.PlayerState.PAUSED && playerIndex === index && !isDetailView && !isTransitioning) {
    console.log(`⚠️ Active video ${playerIndex} paused unexpectedly, attempting restart`);
    setTimeout(() => {
      if (players[playerIndex] && playersReady[playerIndex]) {
        try {
          players[playerIndex].mute();
          players[playerIndex].playVideo();
          console.log(`🔄 Restarted video ${playerIndex}`);
        } catch (error) {
          console.error(`❌ Error restarting video ${playerIndex}:`, error);
        }
      }
    }, 1000);
  }
}

// 플레이어 에러 처리
function onPlayerError(event) {
  console.error('❌ YouTube Player Error:', event.data);
  const playerIndex = getPlayerIndex(event.target);
  
  // 에러 발생 시 재초기화 시도
  setTimeout(() => {
    if (playerIndex === index) {
      console.log(`🔄 Attempting to recover player ${playerIndex}`);
      playCurrentVideo();
    }
  }, 2000);
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

// 현재 동영상 재생 - 강화된 버전
function playCurrentVideo() {
  if (!players[index] || !playersReady[index]) {
    console.log(`⏳ Player ${index} not ready yet, retrying in 1 second...`);
    setTimeout(() => playCurrentVideo(), 1000);
    return;
  }

  const player = players[index];
  
  try {
    console.log(`🎬 Attempting to play video ${index}`);
    
    // 1. 강제 음소거
    player.mute();
    
    // 2. 비디오를 처음부터 시작
    player.seekTo(0, true);
    
    // 3. 현재 상태 확인
    const currentState = player.getPlayerState();
    console.log(`📊 Current state of player ${index}: ${currentState}`);
    
    // 4. 재생 시도
    player.playVideo();
    
    // 5. 첫 번째 재생 상태 확인 (1초 후)
    setTimeout(() => {
      const state1 = player.getPlayerState();
      console.log(`📊 Video ${index} state after 1s: ${state1}`);
      
      if (state1 !== YT.PlayerState.PLAYING && state1 !== YT.PlayerState.BUFFERING) {
        console.log(`🔄 First retry for video ${index}`);
        player.mute();
        player.seekTo(0, true);
        player.playVideo();
        
        // 6. 두 번째 재생 상태 확인 (2초 후)
        setTimeout(() => {
          const state2 = player.getPlayerState();
          console.log(`📊 Video ${index} state after 2s retry: ${state2}`);
          
          if (state2 !== YT.PlayerState.PLAYING && state2 !== YT.PlayerState.BUFFERING) {
            console.log(`🔄 Second retry for video ${index}`);
            player.mute();
            player.seekTo(0, true);
            player.playVideo();
            
            // 7. 최종 재생 상태 확인 (3초 후)
            setTimeout(() => {
              const state3 = player.getPlayerState();
              console.log(`📊 Video ${index} final state: ${state3}`);
              
              if (state3 !== YT.PlayerState.PLAYING && state3 !== YT.PlayerState.BUFFERING) {
                console.log(`🔄 Final retry for video ${index} with loadVideoById`);
                // 마지막 수단: 비디오 재로드
                const youtubeId = slides[index].getAttribute('data-youtube-id');
                if (youtubeId) {
                  player.loadVideoById({
                    videoId: youtubeId,
                    startSeconds: 0
                  });
                  setTimeout(() => {
                    player.mute();
                    player.playVideo();
                  }, 1000);
                }
              }
            }, 3000);
          }
        }, 2000);
      }
    }, 1000);
    
  } catch (error) {
    console.error(`❌ Error playing video ${index}:`, error);
  }
}

// 모든 동영상 정지
function stopAllVideos() {
  console.log('⏹️ Stopping all videos');
  Object.keys(players).forEach(i => {
    if (players[i] && playersReady[i]) {
      try {
        const currentState = players[i].getPlayerState();
        if (currentState === YT.PlayerState.PLAYING || currentState === YT.PlayerState.BUFFERING) {
          players[i].pauseVideo();
          console.log(`⏸️ Stopped video ${i}`);
        }
      } catch (error) {
        console.error(`❌ Error stopping video ${i}:`, error);
      }
    }
  });
}

function showSlide(i) {
  if (isTransitioning) {
    console.log('⚠️ Transition in progress, ignoring slide change');
    return;
  }
  
  isTransitioning = true;
  console.log(`🎯 Transitioning to slide ${i} from slide ${index}`);
  
  // 이전 인덱스 저장
  const previousIndex = index;
  index = i;
  
  // 1. 모든 슬라이드 비활성화
  slides.forEach((slide, idx) => {
    slide.classList.remove('active');
  });
  
  // 2. 모든 동영상 정지
  stopAllVideos();

  // 3. 새 슬라이드 활성화
  const activeSlide = slides[i];
  if (activeSlide) {
    activeSlide.classList.add('active');
    console.log(`✅ Activated slide ${i}`);
    
    // 4. 잠시 대기 후 새 동영상 재생
    setTimeout(() => {
      console.log(`🎬 Starting playback for slide ${i}`);
      playCurrentVideo();
      isTransitioning = false;
      console.log(`✅ Transition to slide ${i} complete`);
    }, 300);
  } else {
    console.error(`❌ Slide ${i} not found`);
    isTransitioning = false;
  }
  
  // 5. UI 업데이트
  updatePageCounter();
  updateMobileGuide();
}

function nextSlide() {
  if (isTransitioning) {
    console.log('⚠️ Cannot go to next slide - transition in progress');
    return;
  }
  
  const newIndex = (index + 1) % totalSlides;
  console.log(`➡️ Moving to next slide: ${newIndex}`);
  showSlide(newIndex);
}

function prevSlide() {
  if (isTransitioning) {
    console.log('⚠️ Cannot go to previous slide - transition in progress');
    return;
  }
  
  const newIndex = (index - 1 + totalSlides) % totalSlides;
  console.log(`⬅️ Moving to previous slide: ${newIndex}`);
  showSlide(newIndex);
}

// 디테일 섹션 표시 (스크롤 다운 또는 모바일 터치)
function showDetailSection(sectionId) {
  if (isTransitioning || isDetailView) return;
  
  console.log(`📄 Showing detail section: ${sectionId}`);
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
    console.log('✅ Detail section transition complete');
  }, 800);

  // 스크롤을 맨 위로
  window.scrollTo(0, 0);
}

// 히어로 섹션으로 돌아가기 (스크롤 업)
function backToHero() {
  if (isTransitioning || !isDetailView) return;
  
  console.log('🏠 Returning to hero section');
  isTransitioning = true;
  isDetailView = false;

  // 모든 디테일 섹션 숨기기
  detailSections.forEach(section => {
    section.classList.remove('active');
  });

  // 현재 슬라이드 다시 표시 및 재생
  setTimeout(() => {
    showSlide(index);
    // 전환 완료 후 자동 슬라이드 재시작 (비활성화됨)
    // setTimeout(() => {
    //   startAutoSlide();
    // }, 1000);
  }, 100);

  // 스크롤을 맨 위로
  window.scrollTo(0, 0);
}

// 사용자 상호작용 이벤트 리스너들 - 모든 상호작용 감지
const interactionEvents = ['click', 'touchstart', 'touchend', 'keydown', 'mousedown', 'pointerdown'];
interactionEvents.forEach(eventType => {
  document.addEventListener(eventType, enableUserInteraction, { once: true, passive: true });
});

// 추가적인 상호작용 감지 - 비디오 영역 클릭
slides.forEach((slide, i) => {
  slide.addEventListener('click', () => {
    enableUserInteraction();
    if (!isDetailView && !isTransitioning) {
      console.log(`🎯 Slide ${i} clicked`);
      // 현재 슬라이드 클릭 시 재생 강제 시도
      if (i === index) {
        playCurrentVideo();
      }
    }
  });
});

// 이벤트 리스너
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    enableUserInteraction();
    if (!isDetailView && !isTransitioning) {
      nextSlide();
      resetAutoSlide();
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    enableUserInteraction();
    if (!isDetailView && !isTransitioning) {
      prevSlide();
      resetAutoSlide();
    }
  });
}

// 모바일 터치 가이드 클릭 이벤트
if (mobileTitleTrigger) {
  mobileTitleTrigger.addEventListener('click', () => {
    enableUserInteraction();
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
  enableUserInteraction();
  
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

// 터치 이벤트 (모바일) - 스와이프 네비게이션
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
  
  enableUserInteraction();
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
        console.log('⏰ Auto-advancing to next slide');
        nextSlide();
      }
    }, 15000);
    console.log('🔄 Auto-slide started');
  }
}

function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
  enableUserInteraction();
  
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
    console.log('👁️ Page hidden - stopping videos');
    stopAllVideos();
    clearInterval(autoSlide);
  } else {
    console.log('👁️ Page visible - resuming playback');
    if (!isDetailView) {
      setTimeout(() => {
        playCurrentVideo();
        startAutoSlide();
      }, 1000);
    }
  }
});

// 윈도우 포커스 이벤트
window.addEventListener('focus', () => {
  console.log('🎯 Window focused - ensuring playback');
  if (!isDetailView && !isTransitioning) {
    setTimeout(() => {
      playCurrentVideo();
    }, 500);
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
  console.log('🚀 DOM Content Loaded - Initializing');
  
  // 초기 페이지 카운터 설정
  updatePageCounter();
  
  // 초기 모바일 가이드 설정
  updateMobileGuide();

  // 유튜브 API 로딩 확인 및 초기화
  if (typeof YT !== 'undefined' && YT.Player) {
    console.log('✅ YouTube API already loaded');
    initializePlayers();
  } else {
    console.log('⏳ Waiting for YouTube API...');
    // API 로딩 대기
    let checkCount = 0;
    const checkAPI = setInterval(() => {
      checkCount++;
      if (typeof YT !== 'undefined' && YT.Player) {
        console.log('✅ YouTube API loaded after waiting');
        clearInterval(checkAPI);
        initializePlayers();
      } else if (checkCount > 20) { // 10초 후 포기
        console.error('❌ YouTube API failed to load');
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
  
  console.log('🎬 Initialization complete');
});