// Get recipe ID from URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Fetch meal details
fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
  .then(res => res.json())
  .then(data => {
    const meal = data.meals[0];
    const container = document.getElementById("recipe-container");

    // Format ingredients
    const ingredients = Object.keys(meal)
      .filter(k => k.startsWith("strIngredient") && meal[k])
      .map((_, i) => {
        const ing = meal["strIngredient" + (i + 1)];
        const amt = meal["strMeasure" + (i + 1)];
        return ing ? `<li>${ing} - ${amt || ""}</li>` : "";
      }).join("");

    // Format instructions into checklist
    const steps = meal.strInstructions
      .split(/(?<=\.)\s+/)
      .filter(step => step.trim())
      .map((step, i) => `
        <li>
          <input type="checkbox" id="step${i}" />
          <label for="step${i}">${step}</label>
        </li>
      `).join("");

    // Render full page
    container.innerHTML = `
      <h1>${meal.strMeal}</h1>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="width:100%; border-radius:10px; margin-top:1rem;" />

      <h3 style="margin-top:2rem;">📝 Ingredients</h3>
      <ul>${ingredients}</ul>

      <h3 style="margin-top:2rem;">📋 Instructions</h3>
      <ul class="instruction-list">${steps}</ul>
    `;
  });
