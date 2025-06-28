function loadRandomMeals() {
  const container = document.getElementById("meal-container");
  container.innerHTML = "";

  const numRecipes = 6;
  for (let i = 0; i < numRecipes; i++) {
    fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      .then(res => res.json())
      .then(data => {
        const meal = data.meals[0];

        const card = document.createElement("div");
        card.classList.add("meal-card");

        card.innerHTML = `
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
          <h3>${meal.strMeal}</h3>
        `;

        container.appendChild(card);
      })
      .catch(err => console.error("Error fetching meal:", err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadRandomMeals();

  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadRandomMeals();
    });
  }
});