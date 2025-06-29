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

function loadRandomMeals() {
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  let count = 0;
  let attempts = 0;
  const target = 6;
  const maxAttempts = target * 6;
  const collected = [];

  function tryLoad() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(res => res.json())
      .then(data => {
        attempts++;
        const meal = data.meals?.[0];
        if (meal && passesProfileFilter(meal)) {
          collected.push(meal);
          count++;
        }

        if (count < target && attempts < maxAttempts) {
          tryLoad();
        } else {
          loading.classList.add("hidden");
          if (collected.length === 0) {
            fetchFallbackMeals(); // fallback to unfiltered meals
          } else {
            collected.forEach(meal => renderMealCard(meal, container));
          }
        }
      })
      .catch(() => {
        attempts++;
        if (attempts >= maxAttempts) {
          loading.classList.add("hidden");
          container.innerHTML = `<p style="text-align:center;">⚠️ Failed to fetch meals. Please check your internet connection.</p>`;
        } else {
          tryLoad();
        }
      });
  }

  tryLoad();
}

function fetchFallbackMeals() {
  const container = document.getElementById("meal-container");
  const fallbackCount = 6;
  let fetched = 0;
  const meals = [];

  function fetchOne() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(res => res.json())
      .then(data => {
        const meal = data.meals?.[0];
        if (meal) meals.push(meal);
        fetched++;
        if (fetched < fallbackCount) {
          fetchOne();
        } else {
          container.innerHTML = "";
          meals.forEach(m => renderMealCard(m, container));
        }
      });
  }

  fetchOne();
}

// ... keep all other existing functions unchanged (renderMealCard, applyFilters, saveProfile, etc.)

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
  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("category-filter").value = "";
    document.getElementById("area-filter").value = "";
    loadRandomMeals();
  });
  document.getElementById("save-profile").addEventListener("click", saveProfile);
});




