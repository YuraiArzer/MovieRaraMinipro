const API_KEY = '9de11eafacf7ae4b2bf2febc50a2d7ac';
const BASE_URL = 'https://api.themoviedb.org/3';

// ตัวแปรเก็บข้อมูล
let currentMovies = [];
let currentCategory = '';
let likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || [];

// องค์ประกอบหน้าเว็บ
const elements = {
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
  category: document.getElementById('category'),
  randomBtn: document.getElementById('random-movie'),
  movieDetails: document.getElementById('movie-details'),
  likeBtn: document.getElementById('like-btn'),
  shareBtn: document.getElementById('share-btn'),
  recommendedGrid: document.querySelector('.recommended-grid'),
  likedGrid: document.querySelector('.liked-grid'),
  featuredGrid: document.querySelector('.featured-grid'),
};

// ฟังก์ชันหลัก
async function getRandomMovie() {
  currentCategory = elements.category.value;
  
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${currentCategory}&language=th-TH&page=1`
    );
    const data = await response.json();
    currentMovies = shuffleArray(data.results);
    
    if (currentMovies.length === 0) {
      showError('ไม่พบหนังในหมวดหมู่นี้');
      return;
    }

    const mainMovie = currentMovies[0];
    displayMainMovie(mainMovie);
    displayRecommendedMovies(currentMovies.slice(1, 21)); // แสดง 20 เรื่อง
    displayFeaturedMovies(); // แสดงหนังแนะนำประจำสัปดาห์
  } catch (error) {
    showError('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
}

// แสดงหนังหลัก
function displayMainMovie(movie) {
  const html = `
    <div class="movie-details-container">
      <div class="movie-poster">
        <img src="${getPosterUrl(movie)}" alt="${movie.title}">
      </div>
      <div class="movie-info">
        <h2>${movie.title}</h2>
        <div class="rating-box">
          <i class="fas fa-star"></i>
          <span>${movie.vote_average}/10</span>
        </div>
        <div class="synopsis-box">
          <h3>เรื่องย่อ</h3>
          <p>${movie.overview || generateSynopsis(movie)}</p>
        </div>
      </div>
    </div>
  `;
  elements.movieDetails.innerHTML = html;
}

// สร้างเรื่องย่ออัตโนมัติ
function generateSynopsis(movie) {
  const genres = movie.genre_ids.map((id) => {
    switch (id) {
      case 28: return 'แอคชัน';
      case 12: return 'ผจญภัย';
      case 16: return 'แอนิเมชัน';
      case 35: return 'คอมเมดี้';
      case 80: return 'อาชญากรรม';
      case 18: return 'ดราม่า';
      case 10751: return 'ครอบครัว';
      case 14: return 'แฟนตาซี';
      case 27: return 'สยองขวัญ';
      case 878: return 'ไซไฟ';
      case 53: return 'ระทึกขวัญ';
      default: return '';
    }
  }).filter((genre) => genre !== '').join(', ');

  return `เรื่องราวของ ${movie.title} เป็นหนัง${genres} ที่เต็มไปด้วยความตื่นเต้นและความสนุกสนาน ไม่ควรพลาด!`;
}

// แสดงหนังแนะนำ
function displayRecommendedMovies(movies) {
  elements.recommendedGrid.innerHTML = movies
    .map(
      (movie) => `
      <div class="movie-card" data-id="${movie.id}">
        <img src="${getPosterUrl(movie)}" alt="${movie.title}">
        <h4>${movie.title}</h4>
        <div class="rating-box">
          <i class="fas fa-star"></i>
          <span>${movie.vote_average}</span>
        </div>
      </div>
    `
    )
    .join('');

  // เพิ่ม Event ให้หนังแนะนำ
  document.querySelectorAll('.movie-card').forEach((card) => {
    card.addEventListener('click', async () => {
      const movieId = card.dataset.id;
      const movie = await getMovieDetails(movieId);
      displayMainMovie(movie);
    });
  });
}

// แสดงหนังแนะนำประจำสัปดาห์
async function displayFeaturedMovies() {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=th-TH&page=1`
    );
    const data = await response.json();
    const featuredMovies = data.results.slice(0, 10); // แสดง 10 เรื่อง

    elements.featuredGrid.innerHTML = featuredMovies
      .map(
        (movie) => `
        <div class="movie-card" data-id="${movie.id}">
          <img src="${getPosterUrl(movie)}" alt="${movie.title}">
          <h4>${movie.title}</h4>
          <div class="rating-box">
            <i class="fas fa-star"></i>
            <span>${movie.vote_average}</span>
          </div>
        </div>
      `
      )
      .join('');

    // เพิ่ม Event ให้หนังแนะนำประจำสัปดาห์
    document.querySelectorAll('.featured-grid .movie-card').forEach((card) => {
      card.addEventListener('click', async () => {
        const movieId = card.dataset.id;
        const movie = await getMovieDetails(movieId);
        displayMainMovie(movie);
      });
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงหนังแนะนำประจำสัปดาห์:', error);
  }
}

// เลื่อนหนังแนะนำ
function scrollRecommended(direction) {
  const grid = elements.recommendedGrid;
  const scrollAmount = 300;
  if (direction === 'left') {
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// แสดงหนังที่ชอบ
function displayLikedMovies() {
  elements.likedGrid.innerHTML = likedMovies
    .map(
      (movie) => `
      <div class="movie-card" data-id="${movie.id}">
        <button class="remove-btn" onclick="removeLikedMovie(${movie.id})"><i class="fas fa-times"></i></button>
        <img src="${getPosterUrl(movie)}" alt="${movie.title}">
        <h4>${movie.title}</h4>
        <div class="rating-box">
          <i class="fas fa-star"></i>
          <span>${movie.vote_average}</span>
        </div>
      </div>
    `
    )
    .join('');
}

// เพิ่มหนังที่ชอบ
function addLikedMovie(movie) {
  if (!likedMovies.some((m) => m.id === movie.id)) {
    likedMovies.push(movie);
    localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
    displayLikedMovies();
    alert('บันทึกหนังเรียบร้อย!');
  }
}

// ลบหนังที่ชอบ
function removeLikedMovie(movieId) {
  likedMovies = likedMovies.filter((movie) => movie.id !== movieId);
  localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
  displayLikedMovies();
}

// ค้นหาหนัง
async function searchMovie(query) {
  if (!query) return;

  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=th-TH`
    );
    const data = await response.json();
    currentMovies = data.results;

    if (currentMovies.length === 0) {
      showError('ไม่พบหนังที่คุณค้นหา');
      return;
    }

    const mainMovie = currentMovies[0];
    displayMainMovie(mainMovie);
    displayRecommendedMovies(currentMovies.slice(1, 21)); // แสดง 20 เรื่อง
  } catch (error) {
    showError('เกิดข้อผิดพลาดในการค้นหา');
  }
}

// ฟังก์ชันช่วยเหลือ
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function getPosterUrl(movie) {
  return movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
}

async function getMovieDetails(movieId) {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=th-TH`
  );
  return await response.json();
}

function showError(message) {
  elements.movieDetails.innerHTML = `<div class="error">${message}</div>`;
}

// Event Listeners
elements.randomBtn.addEventListener('click', getRandomMovie);
elements.likeBtn.addEventListener('click', () => {
  const movieTitle = document.querySelector('.movie-info h2')?.innerText;
  if (movieTitle) {
    const movie = currentMovies.find((m) => m.title === movieTitle);
    if (movie) addLikedMovie(movie);
  }
});
elements.shareBtn.addEventListener('click', () => {
  const movieTitle = document.querySelector('.movie-info h2')?.innerText || 'หนังสนุกๆ';
  const shareUrl = window.location.href;
  navigator.clipboard.writeText(`ดูหนัง "${movieTitle}" บน MovieRaRa: ${shareUrl}`);
  alert('คัดลอกลิงก์ไปแชร์แล้ว!');
});
elements.searchBtn.addEventListener('click', () => {
  const query = elements.searchInput.value.trim();
  if (query) searchMovie(query);
});
elements.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = elements.searchInput.value.trim();
    if (query) searchMovie(query);
  }
});

// โหลดหนังที่ชอบเมื่อเปิดหน้าเว็บ
displayLikedMovies();