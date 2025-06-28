window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generate').addEventListener('click', () => {
    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
      .then(res => res.json())
      .then(data => {
        const meal = data.meals[0];

        document.getElementById('meal-container').innerHTML = `
          <h2>${meal.strMeal}</h2>
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}" width="300" />
          <p>${meal.strInstructions}</p>
        `;
      })
      .catch(error => {
        document.getElementById('meal-container').innerHTML = `<p>Something went wrong. Try again!</p>`;
        console.error(error);
      });
  });
});