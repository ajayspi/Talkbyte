with open("frontend/src/components/restaurant/MenuTab.tsx", "r") as f:
    content = f.read()

content = content.replace("""  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'All Items') return false;
    if (activeCategory.includes('Pizzas') && item.category === 'Pizzas') return false;
    if (activeCategory.includes('Sides') && item.category === 'Sides') return false;
    if (activeCategory.includes('Drinks') && item.category === 'Drinks') return false;
    if (activeCategory.includes('Desserts') && item.category === 'Desserts') return false;
    return false;
  });""", """  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'All Items') return true;
    if (activeCategory.includes('Pizzas') && item.category === 'Pizzas') return true;
    if (activeCategory.includes('Sides') && item.category === 'Sides') return true;
    if (activeCategory.includes('Drinks') && item.category === 'Drinks') return true;
    if (activeCategory.includes('Desserts') && item.category === 'Desserts') return true;
    return false;
  });""")

with open("frontend/src/components/restaurant/MenuTab.tsx", "w") as f:
    f.write(content)
