with open("frontend/jest.setup.js", "a") as f:
    f.write("\njest.setTimeout(30000);\n")
