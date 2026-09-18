with open("backend/app/api/restaurants.py", "r") as f:
    content = f.read()

content = content.replace("router = APIRouter()\n\n@router.get(\"/{restaurant_id}\")", "router = APIRouter()\n\n\n@router.get(\"/{restaurant_id}\")")

with open("backend/app/api/restaurants.py", "w") as f:
    f.write(content)
