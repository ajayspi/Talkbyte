import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1080})
        await page.goto("http://localhost:3000/admin")
        await asyncio.sleep(2)
        # Click Infrastructure tab in the Admin panel
        await page.click("text=Infrastructure")
        await asyncio.sleep(2)
        await page.screenshot(path="final_dashboard2.png", full_page=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
