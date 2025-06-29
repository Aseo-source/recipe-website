// === Dark Mode ===
const darkToggle = document.getElementById("dark-toggle");

function updateToggleLabel() {
  const isDark = document.body.classList.contains("dark");
  darkToggle.textContent = isDark ? "☀️ Change to Light Mode" : "🌙 Change to Dark Mode";
}

function loadDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark");
  updateToggleLabel();
}

darkToggle.addEventListener("click", () => {
  const toggled = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", toggled);
  updateToggleLabel();
});

// === Load Filters ===
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
      const areaFilter = document.getElementById("area-filter");
      const areaPref = document.getElementById("preferred-area");
      data.meals.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.strArea;
        opt.textContent = a.strArea;
        areaFilter.appendChild(opt.cloneNode(true));
        areaPref.appendChild(opt.cloneNode(true));
      });
    });
}

// === Save Profile ===
function saveProfile() {
  const profile = {
    dislikes: document.getElementById("dislikes").value
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .filter(Boolean),
    preferredArea: document.getElementById("preferred-area").value
  };
  localStorage.setItem("userProfile", JSON.stringify(profile));
  loadRandomMeals();
}

// === Profile Filter ===
function passesProfileFilter(meal) {
  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const ingredients = Object.keys(meal)
    .filter(k => k.startsWith("strIngredient") && meal[k])
    .map(k => meal[k].toLowerCase());

  if (profile.preferredArea && meal.strArea !== profile.preferredArea) return false;
  if (profile.dislikes?.some(d => ingredients.includes(d))) return false;

  return true;
}

// === Allergen Detection ===
const allergenMap = {
  dairy: ["milk", "cheese", "cream", "butter", "yogurt"],
  gluten: ["bread", "flour", "pasta", "wheat", "cracker"],
  nuts: ["almond", "peanut", "cashew", "walnut", "hazelnut"],
  eggs: ["egg", "mayonnaise", "custard"],
  shellfish: ["shrimp", "prawn", "crab", "lobster"]
};

function detectAllergens(meal) {
  const ingredients = Object.keys(meal)
    .filter(k => k.startsWith("strIngredient") && meal[k])
    .map(k => meal[k].toLowerCase());

  const found = [];
  for (const [group, triggers] of Object.entries(allergenMap)) {
    if (triggers.some(t => ingredients.includes(t))) {
      found.push(group);
    }
  }
  return found;
}

// === Cuisine Grouping ===
const cuisineGroups = {
  Mediterranean: ["Greek", "Italian", "Spanish", "Moroccan"],
  Asian: ["Chinese", "Japanese", "Thai", "Vietnamese", "Indian"],
  Western: ["American", "British", "Canadian", "French"],
  Latin: ["Mexican", "Brazilian", "Argentinian"]
};

function getCuisineGroup(area) {
  for (const [group, areas] of Object.entries(cuisineGroups)) {
    if (areas.includes(area)) return group;
  }
  return "Other";
}

// === Estimate Complexity ===
function estimateComplexity(meal) {
  const numIngredients = Object.keys(meal)
    .filter(k => k.startsWith("strIngredient") && meal[k])
    .length;

  const instructionLength = meal.strInstructions?.split(" ").length || 0;

  if (numIngredients <= 5 && instructionLength < 100) return "Easy";
  if (numIngredients <= 10 && instructionLength < 200) return "Medium";
  return "Hard";
}

// === Load Random Meals ===
function loadRandomMeals() {
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  const target = 6;
  const collected = [];
  let attempts = 0;
  const maxAttempts = 30;

  function tryFetch() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(res => res.json())
      .then(data => {
        attempts++;
        const meal = data.meals?.[0];
        if (meal && passesProfileFilter(meal)) {
          collected.push(meal);
        }

        if (collected.length < target && attempts < maxAttempts) {
          tryFetch();
        } else {
          if (collected.length === 0) {
            container.innerHTML = "<p>⚠️ No meals match your filters. Try changing your preferences.</p>";
          } else {
            collected.forEach(m => renderMealCard(m, container));
          }
          loading.classList.add("hidden");
        }
      })
      .catch(() => {
        attempts++;
        if (attempts < maxAttempts) {
          tryFetch();
        } else {
          container.innerHTML = "<p>⚠️ Failed to load meals. Check your connection.</p>";
          loading.classList.add("hidden");
        }
      });
  }

  tryFetch();
}

// === Search Meals ===
function searchMeals(query) {
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
    .then(res => res.json())
    .then(data => {
      loading.classList.add("hidden");
      const meals = data.meals?.filter(passesProfileFilter) || [];
      if (meals.length) {
        meals.forEach(m => renderMealCard(m, container));
      } else {
        container.innerHTML = `<p>No results for "<strong>${query}</strong>".</p>`;
      }
    });
}

// === Apply Category/Area Filters ===
function applyFilters() {
  const category = document.getElementById("category-filter").value;
  const area = document.getElementById("area-filter").value;
  const container = document.getElementById("meal-container");
  const loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  let url = "";
  if (category) {
    url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
  } else if (area) {
    url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`;
  } else {
    loadRandomMeals();
    return;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const filtered = data.meals || [];
      let loaded = 0;
      const toRender = [];

      filtered.forEach(entry => {
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${entry.idMeal}`)
          .then(res => res.json())
          .then(full => {
            loaded++;
            const meal = full.meals?.[0];
            if (meal && passesProfileFilter(meal)) {
              toRender.push(meal);
            }
            if (loaded === filtered.length) {
              if (toRender.length) {
                toRender.slice(0, 6).forEach(m => renderMealCard(m, container));
              } else {
                container.innerHTML = "<p>⚠️ No meals matched your filter & profile.</p>";
              }
              loading.classList.add("hidden");
            }
          });
      });
    });
}

// === Favorites ===
function toggleFavorite(meal) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const exists = favs.some(m => m.idMeal === meal.idMeal);
  const updated = exists
    ? favs.filter(m => m.idMeal !== meal.idMeal)
    : [...favs, meal];
  localStorage.setItem("favorites", JSON.stringify(updated));
  renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById("favorites-container");
  container.innerHTML = "";
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs.forEach(m => renderMealCard(m, container));
}

// === Meal Card Rendering ===
function renderMealCard(meal, container) {
  const card = document.createElement("div");
  card.className = "meal-card";

  const allergens = detectAllergens(meal);
  const group = getCuisineGroup(meal.strArea);
  const complexity = estimateComplexity(meal);

 // Determine complexity badge class
  let complexityClass = "badge";
  if (complexity === "Easy") complexityClass += " success";
  else if (complexity === "Medium") complexityClass += " info";
  else complexityClass += " danger";

  // Render allergens as badges
  const allergenBadges = allergens.map(a =>
    `<span class="badge danger">${a}</span>`
  ).join(" ");

  card.innerHTML = `
    <button class="favorite-btn" data-id="${meal.idMeal}">❤️</button>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
    <h3>${meal.strMeal}</h3>
    <div>
      <span class="badge info">${group} Cuisine</span>
      <span class="${complexityClass}">${complexity}</span>
    </div>
    ${allergens.length ? `<div><strong>Allergens:</strong> ${allergenBadges}</div>` : ""}
  `;

  card.addEventListener("click", function (e) {
    if (e.target.classList.contains("favorite-btn")) {
      e.stopPropagation();
      toggleFavorite(meal);
    } else {
      window.location.href = "recipe.html?id=" + meal.idMeal;
    }
  });

  container.appendChild(card);
}

// === DOM Ready ===
document.addEventListener("DOMContentLoaded", () => {
  loadDarkMode();
  loadFilters();
  loadRandomMeals();
  renderFavorites();

  document.getElementById("intro-screen").addEventListener("click", function () {
    this.classList.add("fade-out");
  });

  document.getElementById("refresh-btn").addEventListener("click", loadRandomMeals);
  document.getElementById("save-profile").addEventListener("click", saveProfile);
  document.getElementById("apply-filters").addEventListener("click", applyFilters);
  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("category-filter").value = "";
    document.getElementById("area-filter").value = "";
    loadRandomMeals();
  });

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
});