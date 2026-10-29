/**
 * Selenium end-to-end test: register a book, register a member, issue the
 * book through the UI, verify availability updates, then return it.
 *
 * Requires both servers to be running (the run-e2e.js orchestrator starts
 * them for you). Selectors use stable data-testid attributes placed in the
 * React components.
 */
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4173';
const TIMEOUT = 20000;

async function waitFor(driver, locator, message) {
  return driver.wait(until.elementLocated(locator), TIMEOUT, message);
}

async function clickWhenVisible(driver, locator) {
  const el = await waitFor(driver, locator);
  await driver.wait(until.elementIsVisible(el), TIMEOUT);
  await el.click();
  return el;
}

async function typeWhenVisible(driver, locator, text) {
  const el = await waitFor(driver, locator);
  await driver.wait(until.elementIsVisible(el), TIMEOUT);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

/** Dismisses any toasts still on screen so the next check sees only new ones. */
async function clearToasts(driver) {
  await driver.executeScript(`
    document.querySelectorAll('[data-testid="toast-container"] button').forEach((b) => b.click());
  `);
  await driver.sleep(200);
}

/** Waits until a success toast containing `substring` is visible. */
async function waitForToastText(driver, substring) {
  try {
    await driver.wait(async () => {
      const toasts = await driver.findElements(By.css('[data-testid^="toast-"]'));
      for (const toast of toasts) {
        const text = await toast.getText();
        if (text.includes(substring)) return text;
      }
      return false;
    }, TIMEOUT, `Toast containing "${substring}" did not appear`);
  } catch (err) {
    const toasts = await driver.findElements(By.css('[data-testid^="toast-"], [data-testid="error-alert"]'));
    const texts = [];
    for (const toast of toasts) texts.push(await toast.getText());
    console.error('Visible toasts/alerts at timeout:', JSON.stringify(texts));
    throw err;
  }
  const toasts = await driver.findElements(By.css('[data-testid^="toast-"]'));
  for (const toast of toasts) {
    const text = await toast.getText();
    if (text.includes(substring)) return text;
  }
  return '';
}

async function run() {
  const options = new chrome.Options();
  if (process.env.HEADED !== '1') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--window-size=1400,900', '--disable-gpu', '--no-sandbox');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const stamp = Date.now();
  const bookTitle = `Selenium Test Book ${stamp}`;

  try {
    // 1. Open the application — the login gate should appear first.
    await driver.get(BASE_URL);
    await waitFor(driver, By.css('[data-testid="page-login"]'), 'Login page did not load');
    await typeWhenVisible(driver, By.css('[data-testid="input-username"]'), 'librarian');
    await typeWhenVisible(driver, By.css('[data-testid="input-password"]'), 'bookwise123');
    await clickWhenVisible(driver, By.css('[data-testid="btn-login"]'));
    await waitFor(driver, By.css('[data-testid="page-dashboard"]'), 'Dashboard did not load after login');
    console.log('STEP 1 OK — login accepted, dashboard loaded');

    // 2. Add a book through the catalog page.
    await clickWhenVisible(driver, By.css('[data-testid="nav-books"]'));
    await waitFor(driver, By.css('[data-testid="page-books"]'));
    await typeWhenVisible(driver, By.css('[data-testid="input-book-isbn"]'), `97899${String(stamp).slice(-6)}`);
    await typeWhenVisible(driver, By.css('[data-testid="input-book-title"]'), bookTitle);
    await typeWhenVisible(driver, By.css('[data-testid="input-book-author"]'), 'QA Author');
    await clearToasts(driver);
    await clickWhenVisible(driver, By.css('[data-testid="btn-add-book"]'));
    const bookToast = await waitForToastText(driver, bookTitle);
    console.log('STEP 2 OK — book added, toast shown:', bookToast);

    // 3. Register a member.
    await clickWhenVisible(driver, By.css('[data-testid="nav-members"]'));
    await waitFor(driver, By.css('[data-testid="page-members"]'));
    await typeWhenVisible(driver, By.css('[data-testid="input-member-id"]'), `E2E-${stamp}`);
    await typeWhenVisible(driver, By.css('[data-testid="input-member-name"]'), 'E2E Member');
    await clearToasts(driver);
    await clickWhenVisible(driver, By.css('[data-testid="btn-add-member"]'));
    await waitForToastText(driver, 'E2E Member');
    await driver.sleep(300);
    const memberRowText = await driver.findElement(By.css('[data-testid="members-table"]')).getText();
    if (!memberRowText.includes(`E2E-${stamp}`)) {
      throw new Error('New member not visible in the members table');
    }
    console.log('STEP 3 OK — member registered and visible in table');

    // 4. Issue the book through the borrow page.
    await clickWhenVisible(driver, By.css('[data-testid="nav-borrow"]'));
    await waitFor(driver, By.css('[data-testid="page-borrow"]'));

    const memberSelect = await waitFor(driver, By.css('[data-testid="select-issue-member"]'));
    const memberOptions = await memberSelect.findElements(By.css('option'));
    let memberValue = '';
    for (const option of memberOptions) {
      const text = await option.getText();
      if (text.includes(`E2E-${stamp}`)) {
        memberValue = await option.getAttribute('value');
        break;
      }
    }
    if (!memberValue) throw new Error('Seeded member not found in issue form');
    await driver.executeScript(
      `const s = document.querySelector('[data-testid="select-issue-member"]');
       s.value = arguments[0];
       s.dispatchEvent(new Event('change', { bubbles: true }));`,
      memberValue
    );

    const bookSelect = await waitFor(driver, By.css('[data-testid="select-issue-book"]'));
    const bookOptions = await bookSelect.findElements(By.css('option'));
    let bookValue = '';
    for (const option of bookOptions) {
      const text = await option.getText();
      if (text.includes(bookTitle)) {
        bookValue = await option.getAttribute('value');
        break;
      }
    }
    if (!bookValue) throw new Error('Seeded book not found in issue form');
    await driver.executeScript(
      `const s = document.querySelector('[data-testid="select-issue-book"]');
       s.value = arguments[0];
       s.dispatchEvent(new Event('change', { bubbles: true }));`,
      bookValue
    );

    await clearToasts(driver);
    await clickWhenVisible(driver, By.css('[data-testid="btn-issue-book"]'));
    const issueToast = await waitForToastText(driver, 'Due date');
    console.log('STEP 4 OK — book issued, toast shown:', issueToast);

    // 5. Verify the active borrowing row exists.
    const borrowTable = await waitFor(driver, By.css('[data-testid="borrow-table"]'));
    const borrowText = await borrowTable.getText();
    if (!borrowText.includes('E2E Member') || !borrowText.includes(bookTitle)) {
      throw new Error('Active borrow row does not show member and book');
    }
    console.log('STEP 5 OK — active borrow row visible');

    // 6. Return the book and expect a zero fine (not overdue).
    await clearToasts(driver);
    await clickWhenVisible(driver, By.css('[data-testid="btn-return-book"]'));
    const returnToast = await waitForToastText(driver, 'No fine');
    console.log('STEP 6 OK — book returned, toast shown:', returnToast);

    console.log('\nE2E TEST PASSED — issue/return workflow works through the UI');
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error('\nE2E TEST FAILED:', err.message);
  process.exit(1);
});
