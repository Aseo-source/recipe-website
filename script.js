document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("meal-container");
  container.innerHTML = "";

  const numRecipes = 6; // Number of meals to show

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
      .catch(error => {
        console.error("Error fetching meal:", error);
      });
  }
});