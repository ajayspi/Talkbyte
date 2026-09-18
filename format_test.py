with open("backend/tests/unit/test_restaurant_create.py", "r") as f:
    content = f.read()

# format file correctly for flake8
content = content.replace("def test_restaurant_create_allows_valid_fields():", "\n\ndef test_restaurant_create_allows_valid_fields():")
content = content.replace("def test_restaurant_create_rejects_extra_fields():", "\n\ndef test_restaurant_create_rejects_extra_fields():")
content = content.replace("rest_create = RestaurantCreate(name=\"Secure Burger\", phone_number=\"+15551234567\")", "rest_create = RestaurantCreate(\n        name=\"Secure Burger\", phone_number=\"+15551234567\"\n    )")
content = content.replace("RestaurantCreate(name=\"Hacker Pizza\", active=True, plan_id=\"enterprise\")", "RestaurantCreate(\n            name=\"Hacker Pizza\", active=True, plan_id=\"enterprise\"\n        )")

with open("backend/tests/unit/test_restaurant_create.py", "w") as f:
    f.write(content)
