// Load filters
function loadFilters() {
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then(res => res.json())
    .then(data => {
      const cat = document.getElementById("category-filter");
      data.meals.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.strCategory;
        opt.textContent = c.strCategory;
        cat.appendChild(opt);
      });
    });

  fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list")
    .then(res => res.json())
    .then(data => {
      const area = document.getElementById("area-filter");
      const pref = document.getElementById("preferred-area");
      data.meals.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.strArea;
        opt.textContent = a.strArea;
        area.appendChild(opt.cloneNode(true));
        pref.appendChild(opt.cloneNode(true));
      });
    });
}

// Load meals with filtering and loading animation
function loadRandomMeals() {
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  let count = 0;
  let attempts = 0;
  const target = 6;

  function tryLoad() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(res => res.json())
      .then(data => {
        const meal = data.meals[0];
        attempts++;

        if (passesProfileFilter(meal)) {
          renderMealCard(meal, container);
          count++;
        }

        if (count < target && attempts < target * 3) {
          tryLoad();
        } else {
          loading.classList.add("hidden");
        }
      })
      .catch(() => {
        attempts++;
        if (attempts >= target * 3) loading.classList.add("hidden");
      });
  }

  tryLoad();
}

// Render meal card with redirect to recipe page
function renderMealCard(meal, container) {
  const card = document.createElement("div");
  card.className = "meal-card";
  card.innerHTML = `
    <button class="favorite-btn" data-id="${meal.idMeal}">❤️</button>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
    <h3>${meal.strMeal}</h3>
  `;

  card.addEventListener("click", e => {
    if (e.target.classList.contains("favorite-btn")) {
      e.stopPropagation();
      toggleFavorite(meal);
    } else {
      window.location.href = `recipe.html?id=${meal.idMeal}`;
    }
  });

  container.appendChild(card);
}

// Check if a meal passes the user's profile filters
function passesProfileFilter(meal) {
  const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
  const ingredients = Object.keys(meal)
    .filter(k => k.startsWith("strIngredient") && meal[k])
    .map(k => meal[k].toLowerCase());

  if (profile.vegetarian && meal.strCategory !== "Vegetarian") return false;
  if (profile.vegan && meal.strCategory !== "Vegan") return false;
  if (profile.preferredArea && meal.strArea !== profile.preferredArea) return false;
  if (profile.dislikes && profile.dislikes.some(d => ingredients.includes(d))) return false;

  return true;
}

// Save user profile preferences
function saveProfile() {
  const profile = {
    vegetarian: document.getElementById("vegetarian-pref").checked,
    vegan: document.getElementById("vegan-pref").checked,
    dislikes: document.getElementById("dislikes").value.toLowerCase().split(",").map(s => s.trim()),
    preferredArea: document.getElementById("preferred-area").value
  };
  localStorage.setItem("userProfile", JSON.stringify(profile));
  loadRandomMeals();
}

// Search for meals by name
function searchMeals(query) {
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
    .then(res => res.json())
    .then(data => {
      loading.classList.add("hidden");
      if (data.meals) {
        data.meals.filter(passesProfileFilter).forEach(meal => {
          renderMealCard(meal, container);
        });
      } else {
        container.innerHTML = `<p>No results found for "<strong>${query}</strong>".</p>`;
      }
    });
}

// Filter meals by category or area
function applyFilters() {
  const category = document.getElementById("category-filter").value;
  const area = document.getElementById("area-filter").value;
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  let url = "";
  if (category) url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
  else if (area) url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`;
  else return loadRandomMeals();

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const results = data.meals.slice(0, 10);
      let loaded = 0;
      results.forEach(item => {
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${item.idMeal}`)
          .then(res => res.json())
          .then(full => {
            loaded++;
            const meal = full.meals[0];
            if (passesProfileFilter(meal)) {
              renderMealCard(meal, container);
            }
            if (loaded === results.length) loading.classList.add("hidden");
          });
      });
    });
}

// Toggle a meal as favorite
function toggleFavorite(meal) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const exists = favs.find(m => m.idMeal === meal.idMeal);
  if (exists) {
    const updated = favs.filter(m => m.idMeal !== meal.idMeal);
    localStorage.setItem("favorites", JSON.stringify(updated));
  } else {
    favs.push(meal);
    localStorage.setItem("favorites", JSON.stringify(favs));
  }
  renderFavorites();
}

// Render favorites list
function renderFavorites() {
  const container = document.getElementById("favorites-container");
  container.innerHTML = "";
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs.forEach(meal => renderMealCard(meal, container));
}

// Dark mode toggle
document.getElementById("dark-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadDarkMode();
  loadFilters();
  loadRandomMeals();
  renderFavorites();

  document.getElementById("refresh-btn").addEventListener("click", loadRandomMeals);
  document.getElementById("search-btn").addEventListener("click", () => {
    const q = document.getElementById("search-input").value.trim();
    if (q) searchMeals(q);
  });
  document.getElementById("search-input").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const q = e.target.value.trim();
      if (q) searchMeals(q);
    }
  });
  document.getElementById("apply-filters").addEventListener("click", applyFilters);
  document.getElementById("save-profile").addEventListener("click", saveProfile);
});



