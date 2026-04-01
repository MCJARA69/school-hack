import puppeteer from 'puppeteer'
import type { Assignment } from './types.js'

export async function scrapeSchoology(username: string, password: string): Promise<Assignment[]> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  page.setDefaultTimeout(60000)

  try {
    await page.goto('https://app.schoology.com/login', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#edit-mail', { timeout: 30000 })
    await page.type('#edit-mail', username)
    await page.type('#edit-pass', password)
    await page.click('#edit-submit')
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })

    // Check for login failure
    const errorEl = await page.$('.messages.error')
    if (errorEl) {
      throw new Error('Invalid username or password')
    }

    // Navigate to upcoming events
    await page.goto('https://app.schoology.com/home?filter=upcoming', { waitUntil: 'domcontentloaded' })

    const assignments: Assignment[] = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.s-edge-feed-item, .event-row, [data-item-type]'))
      return items.map((el) => {
        const title = el.querySelector('.title, .event-title, h3')?.textContent?.trim() ?? 'Untitled'
        const subject = el.querySelector('.course-title, .course-name')?.textContent?.trim() ?? 'Unknown'
        const dueDateText = el.querySelector('.due-date, .event-date, time')?.textContent?.trim() ?? ''
        const typeText = title.toLowerCase()

        let type: 'exam' | 'homework' | 'quiz' = 'homework'
        if (typeText.includes('exam') || typeText.includes('test')) type = 'exam'
        else if (typeText.includes('quiz')) type = 'quiz'

        // Deterministic ID so it survives re-scrapes
        const idSource = `${subject}|${title}|${dueDateText}`
        const id = btoa(idSource).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
        return { id, subject, type, title, dueDate: dueDateText, topic: title }
      }).filter(a => a.subject !== 'Unknown')
    })

    return assignments
  } finally {
    await browser.close()
  }
}
