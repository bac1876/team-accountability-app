import { chromium } from "playwright";

async function testAccountabilityApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log("Starting comprehensive test of accountability app...");
  
  try {
    await page.goto("https://communitynwa.com");
    await page.waitForLoadState("networkidle");
    
    console.log("Attempting login as Brian...");
    
    const emailInput = page.locator("input[type=\"email\"]");
    const passwordInput = page.locator("input[type=\"password\"]");
    const loginButton = page.locator("button[type=\"submit\"]");
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill("brian@searchnwa.com");
      await passwordInput.fill("Lbbc#2245");
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log("Login attempted");
    } else {
      console.log("No login form found");
    }
    
    await page.screenshot({ path: "login-state.png", fullPage: true });
    console.log("Current URL:", page.url());
    
    // Test navigation and features
    console.log("Testing navigation...");
    const navItems = await page.locator("nav a, button").allTextContents();
    console.log("Navigation items found:", navItems);
    
    // Test Commitments
    console.log("Testing Commitments feature...");
    const commitmentsLink = page.locator("text=Commitments");
    if (await commitmentsLink.isVisible({ timeout: 3000 })) {
      await commitmentsLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "commitments-page.png", fullPage: true });
      console.log("Commitments page accessed");
    } else {
      console.log("Commitments link not found");
    }
    
    // Test Goals
    console.log("Testing Goals feature...");
    const goalsLink = page.locator("text=Goals");
    if (await goalsLink.isVisible({ timeout: 3000 })) {
      await goalsLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "goals-page.png", fullPage: true });
      console.log("Goals page accessed");
    } else {
      console.log("Goals link not found");
    }
    
    // Test Phone Calls
    console.log("Testing Phone Calls feature...");
    const phoneLink = page.locator("text=Phone Calls");
    if (await phoneLink.isVisible({ timeout: 3000 })) {
      await phoneLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "phone-calls-page.png", fullPage: true });
      console.log("Phone Calls page accessed");
    } else {
      console.log("Phone Calls link not found");
    }
    
    await page.screenshot({ path: "final-test-state.png", fullPage: true });
    
  } catch (error) {
    console.error("Test error:", error.message);
  }
  
  await browser.close();
  console.log("Test completed - check screenshot files for results");
}

testAccountabilityApp();
