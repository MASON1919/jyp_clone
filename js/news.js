const API_KEY = '___';

const url = `https://newsapi.org/v2/everything?q=Apple&from=2025-08-07&sortBy=popularity&apiKey=${API_KEY}`;

async function getNews() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP 에러! 상태: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("뉴스를 불러오는 중 오류가 발생했습니다:", error);
    document.getElementById('news-board').textContent = "뉴스 기사를 불러오는데 실패했습니다.";
  }
}
getNews();