const puppeteer = require('puppeteer')
const readline = require('readline') // Add this line to import readline

// Initialize readline interface to capture user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Function to fetch email and password from Flask API
const getEmailPasswordFromAPI = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/getemailpassword')
    const data = await response.json()

    if (response.ok) {
      const { email, password } = data
      return {
        email: email !== 'No valid email found' ? email : null,
        password: password !== 'No valid password found' ? password : null,
      }
    } else {
      throw new Error('Error fetching credentials')
    }
  } catch (error) {
    console.error('Error in getEmailPasswordFromAPI:', error.message)
    return null // Handle error and return null
  }
}

// Random time generator
function getRandomTime(min = 7000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Puppeteer Sign-in Function
const SignInFunction = async (page) => {
  const credentials = await getEmailPasswordFromAPI() // Fetch credentials from API

  if (!credentials || !credentials.email || !credentials.password) {
    console.log('Invalid credentials. Cannot sign in.')
    return
  }

  // Perform sign-in with fetched credentials
  await hitUrl(page, credentials)
}

// Function to perform sign-in using Puppeteer
const hitUrl = async (page, credentials) => {
  try {
    const { email, password } = credentials

    // Captcha page handling (if any)
    const linkSelector = 'div.a-column.a-span6.a-span-last.a-text-right a' // Adjust the selector if needed
    const selectedLink = await page
      .waitForSelector(linkSelector, { timeout: 10000 })
      .catch(() => null)

    if (selectedLink) {
      const randomTime = getRandomTime()
      await new Promise((resolve) => setTimeout(resolve, randomTime))
      await page.click(linkSelector)
      await page.waitForNavigation({ waitUntil: 'networkidle2' })
    }

    // Navigate to Amazon's sign-in page
    const signInSelector = '.nav-action-signin-button'
    const href = await page.$eval(signInSelector, (element) => element.href)
    console.log('Sign-In href:', href)

    await page.goto(href, { waitUntil: 'networkidle2' })

    // Enter email
    const emailSelector = '#ap_email'
    await page.type(emailSelector, email, { delay: 700 })

    // Submit email form
    const formSelector = '.auth-validate-form'
    await page.$eval(formSelector, (form) => form.submit())

    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    // Enter password
    const passwordSelector = '#ap_password'
    await page.type(passwordSelector, password, { delay: 700 })

    // Submit password form
    const passwordFormSelector =
      '.auth-validate-form.auth-real-time-validation.a-spacing-none'
    await page.$eval(passwordFormSelector, (form) => form.submit())

    await page.waitForNavigation({ waitUntil: 'networkidle2' })
  } catch (error) {
    console.log('Error during sign-in:', error.message)
  }
}

// Function to search for an item
const SearchFunction = async (page) => {
  const response = await fetch('http://127.0.0.1:5000/getproduct')
  const data = await response.json()

  // let userSearchInput = await askQuestion('Enter the name of the item: ');
  let userSearchInput = data.product
  const searchInputSelector = '#twotabsearchtextbox'
  await page.evaluate(
    (selector) => (document.querySelector(selector).value = ''),
    searchInputSelector
  )
  await page.type(searchInputSelector, userSearchInput, { delay: 700 })

  const searchFormSelector = '#nav-search-bar-form'
  await page.$eval(searchFormSelector, (form) => form.submit())

  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  console.log('Search completed for:', userSearchInput)
}

// Function to add an item to cart
const AddToCartFunction = async (page) => {
  try {
    let addedToCart = false

    const initialCartCount = await page.$eval(
      '#nav-cart-count',
      (el) => parseInt(el.innerText.trim()) || 0
    )
    console.log('Initial Cart Count:', initialCartCount)

    for (let i = 0; i <= 10; i++) {
      if (addedToCart) {
        break
      }

      const buttonSelector = `#a-autoid-${i}-announce`
      try {
        await page.waitForSelector(buttonSelector, { timeout: 2000 })
        await page.click(buttonSelector)
        console.log(
          `Clicked Add to Cart button with selector: ${buttonSelector}`
        )

        await sleep(3000)

        const updatedCartCount = await page.$eval(
          '#nav-cart-count',
          (el) => parseInt(el.innerText.trim()) || 0
        )
        console.log('Updated Cart Count:', updatedCartCount)

        if (updatedCartCount > initialCartCount) {
          console.log('Item added to cart successfully!')
          addedToCart = true
        } else {
          console.log('Item not added to cart, retrying with next button...')
        }
      } catch (error) {
        console.log(`Error clicking button ${buttonSelector}:`, error.message)
      }
    }

    if (!addedToCart) {
      throw new Error(
        'Failed to add item to cart after trying all available options.'
      )
    }
  } catch (error) {
    console.error('Error in AddToCartFunction:', error.message)
    throw error
  }
}

// Function to view cart
const ViewCartFunction = async (page) => {
  try {
    let cartSelector = '#nav-cart'
    let href = await page.$eval(cartSelector, (element) => element.href)

    if (!href) {
      cartSelector = '#nav-button-cart'
      href = await page.$eval(cartSelector, (element) => element.href)
    }

    await page.goto(href, { waitUntil: 'networkidle2' })
  } catch (error) {
    console.log(error)
  }
}

// Function to sign out
const SignOutFunction = async (page) => {
  try {
    const signOutSelector = '#nav-item-signout'
    const href = await page.$eval(signOutSelector, (element) => element.href)
    await page.goto(href, { waitUntil: 'networkidle2' })
  } catch (error) {
    console.log(error)
  }
}

// Helper function for sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const askQuestion = (query) => {
  return new Promise((resolve) =>
    rl.question(query, (answer) => resolve(answer))
  )
}

// Function to take user input and perform actions accordingly
const takeUserInputInfinite = async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://www.amazon.com', { waitUntil: 'networkidle2' })

  while (true) {
    // const response = await fetch('http://127.0.0.1:5000/getuserprompt')
    // const data = await response.json()

    let userPrompt = await askQuestion(
      'Enter action to perform (1: Sign in, 2: Search, 3: Add to cart, 4: View cart, 5: Sign out, exit to close): '
    )

    if (userPrompt === 'exit') {
      break
    }

    if (userPrompt === '1') {
      await SignInFunction(page)
    } else if (userPrompt === '2') {
      await SearchFunction(page)
    } else if (userPrompt === '3') {
      await AddToCartFunction(page)
    } else if (userPrompt === '4') {
      await ViewCartFunction(page)
    } else if (userPrompt === '5') {
      await SignOutFunction(page)
    }
  }

  setTimeout(async () => {
    await browser.close()
  }, 10000)
}

takeUserInputInfinite()
