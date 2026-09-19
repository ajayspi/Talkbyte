with open('backend/app/api/restaurants.py', 'r') as f:
    content = f.read()

# Add import
import_stmt = "from app.models.restaurant import RestaurantCreate\n"
content = content.replace("from app.db.supabase import get_restaurant_by_id, get_db\n", "from app.db.supabase import get_restaurant_by_id, get_db\n" + import_stmt)

# Update signature
content = content.replace("async def create_restaurant(body: dict):", "async def create_restaurant(body: RestaurantCreate):")

# Update execution
content = content.replace("result = await db.table(\"restaurants\").insert(body).execute()", "result = await db.table(\"restaurants\").insert(body.model_dump(exclude_unset=True)).execute()")

with open('backend/app/api/restaurants.py', 'w') as f:
    f.write(content)
