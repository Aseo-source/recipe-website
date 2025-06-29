var darkToggle = document.getElementById("dark-toggle");

function updateToggleLabel() {
  var isDark = document.body.classList.contains("dark");
  darkToggle.textContent = isDark ? "☀️ Change to Light Mode" : "🌙 Change to Dark Mode";
}

function loadDarkMode() {
  var isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
    document.body.classList.add("dark");
  }
  updateToggleLabel();
}

darkToggle.addEventListener("click", function () {
  var isNowDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isNowDark);
  updateToggleLabel();
});

function loadFilters() {
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var cat = document.getElementById("category-filter");
      data.meals.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.strCategory;
        opt.textContent = c.strCategory;
        cat.appendChild(opt);
      });
    });

  fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var area = document.getElementById("area-filter");
      var pref = document.getElementById("preferred-area");
      data.meals.forEach(function (a) {
        var opt = document.createElement("option");
        opt.value = a.strArea;
        opt.textContent = a.strArea;
        area.appendChild(opt.cloneNode(true));
        pref.appendChild(opt.cloneNode(true));
      });
    });
}

function loadRandomMeals() {
  var container = document.getElementById("meal-container");
  var loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  var count = 0;
  var attempts = 0;
  var target = 6;
  var maxAttempts = target * 6;
  var collected = [];

  function tryLoad() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        attempts++;
        var meal = data.meals && data.meals[0];
        if (meal && passesProfileFilter(meal)) {
          collected.push(meal);
          count++;
        }

        if (count < target && attempts < maxAttempts) {
          tryLoad();
        } else if (collected.length === 0) {
          fetchFallbackMeals();
        } else {
          collected.forEach(function (meal) {
            renderMealCard(meal, container);
          });
          loading.classList.add("hidden");
        }
      })
      .catch(function () {
        attempts++;
        if (attempts >= maxAttempts) {
          loading.classList.add("hidden");
          container.innerHTML = "<p>⚠️ Failed to load meals. Try again later.</p>";
        } else {
          tryLoad();
        }
      });
  }

  tryLoad();
}

function fetchFallbackMeals() {
  var container = document.getElementById("meal-container");
  var loading = document.getElementById("loading");
  var fallbackCount = 6;
  var fetched = 0;
  var meals = [];

  function fetchOne() {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var meal = data.meals && data.meals[0];
        if (meal) meals.push(meal);
        fetched++;
        if (fetched < fallbackCount) {
          fetchOne();
        } else {
          container.innerHTML = "";
          meals.forEach(function (m) {
            renderMealCard(m, container);
          });
          loading.classList.add("hidden");
        }
      });
  }

  fetchOne();
}
function renderMealCard(meal, container) {
  var card = document.createElement("div");
  card.className = "meal-card";
  card.innerHTML =
    '<button class="favorite-btn" data-id="' + meal.idMeal + '">❤️</button>' +
    '<img src="' + meal.strMealThumb + '" alt="' + meal.strMeal + '" />' +
    '<h3>' + meal.strMeal + '</h3>';

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

function passesProfileFilter(meal) {
  var profile = JSON.parse(localStorage.getItem("userProfile")) || {};
  var ingredients = Object.keys(meal)
    .filter(function (k) { return k.startsWith("strIngredient") && meal[k]; })
    .map(function (k) { return meal[k].toLowerCase(); });

  if (profile.vegetarian && meal.strCategory !== "Vegetarian") return false;
  if (profile.vegan && meal.strCategory !== "Vegan") return false;
  if (profile.preferredArea && meal.strArea !== profile.preferredArea) return false;
  if (profile.dislikes && profile.dislikes.some(function (d) {
    return ingredients.includes(d);
  })) return false;

  return true;
}

function saveProfile() {
  var profile = {
    vegetarian: document.getElementById("vegetarian-pref").checked,
    vegan: document.getElementById("vegan-pref").checked,
    dislikes: document.getElementById("dislikes").value
      .toLowerCase()
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean),
    preferredArea: document.getElementById("preferred-area").value
  };
  localStorage.setItem("userProfile", JSON.stringify(profile));
  loadRandomMeals();
}
function searchMeals(query) {
  var container = document.getElementById("meal-container");
  var loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + query)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      loading.classList.add("hidden");
      if (data.meals) {
        data.meals.filter(passesProfileFilter).forEach(function (meal) {
          renderMealCard(meal, container);
        });
      } else {
        container.innerHTML = '<p>No results for "<strong>' + query + '</strong>".</p>';
      }
    });
}

function applyFilters() {
  var category = document.getElementById("category-filter").value;
  var area = document.getElementById("area-filter").value;
  var container = document.getElementById("meal-container");
  var loading = document.getElementById("loading");
  container.innerHTML = "";
  loading.classList.remove("hidden");

  var url = "";
  if (category) {
    url = "https://www.themealdb.com/api/json/v1/1/filter.php?c=" + category;
  } else if (area) {
    url = "https://www.themealdb.com/api/json/v1/1/filter.php?a=" + area;
  } else {
    loadRandomMeals();
    return;
  }

  fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var results = (data.meals || []).slice(0, 10);
      var loaded = 0;
      results.forEach(function (item) {
        fetch("https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + item.idMeal)
          .then(function (res) { return res.json(); })
          .then(function (full) {
            loaded++;
            var meal = full.meals && full.meals[0];
            if (meal && passesProfileFilter(meal)) {
              renderMealCard(meal, container);
            }
            if (loaded === results.length) {
              loading.classList.add("hidden");
            }
          });
      });
    });
}

function toggleFavorite(meal) {
  var favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  var exists = favs.find(function (m) { return m.idMeal === meal.idMeal; });
  if (exists) {
    var updated = favs.filter(function (m) { return m.idMeal !== meal.idMeal; });
    localStorage.setItem("favorites", JSON.stringify(updated));
  } else {
    favs.push(meal);
    localStorage.setItem("favorites", JSON.stringify(favs));
  }
  renderFavorites();
}

function renderFavorites() {
  var container = document.getElementById("favorites-container");
  container.innerHTML = "";
  var favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs.forEach(function (meal) {
    renderMealCard(meal, container);
  });
}
document.addEventListener("DOMContentLoaded", function () {
  loadDarkMode();
  loadFilters();
  loadRandomMeals();
  renderFavorites();

  document.getElementById("refresh-btn").addEventListener("click", loadRandomMeals);

  document.getElementById("search-btn").addEventListener("click", function () {
    var q = document.getElementById("search-input").value.trim();
    if (q) searchMeals(q);
  });

  document.getElementById("search-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var q = e.target.value.trim();
      if (q) searchMeals(q);
    }
  });

  document.getElementById("apply-filters").addEventListener("click", applyFilters);

  document.getElementById("clear-filters").addEventListener("click", function () {
    document.getElementById("category-filter").value = "";
    document.getElementById("area-filter").value = "";
    loadRandomMeals();
  });

  document.getElementById("save-profile").addEventListener("click", saveProfile);
});
