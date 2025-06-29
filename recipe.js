// Get ID from URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
  .then(res => res.json())
  .then(data => {
    const meal = data.meals[0];
    const container = document.getElementById("recipe-container");

    const ingredients = Object.keys(meal)
      .filter(k => k.startsWith("strIngredient") && meal[k])
      .map((_, i) => {
        const ing = meal["strIngredient" + (i + 1)];
        const amt = meal["strMeasure" + (i + 1)];
        return ing ? `<li>${ing} - ${amt || ""}</li>` : "";
      }).join("");

    container.innerHTML = `
      <h1>${meal.strMeal}</h1>
      <img src="${meal.strMealThumb}" style="width:100%; border-radius:10px;" />
      <h3>Ingredients:</h3>
      <ul>${ingredients}</ul>
      <h3>Instructions:</h3>
      <p>${meal.strInstructions}</p>
    `;
  });
