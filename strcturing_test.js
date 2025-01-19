const fs = require('fs')
const { JSDOM } = require('jsdom')

// Function to search for an element by its text and return its DOM tree from the <body> tag
function findElementByText(element, searchText) {
  const elementText = element.textContent.trim()

  // Check if the current element contains the search text
  if (elementText === searchText) {
    return element
  }

  // Recursively search through all child elements
  for (const child of element.children) {
    const found = findElementByText(child, searchText)
    if (found) return found
  }

  return null
}

// Function to build a DOM tree from the <body> tag to the found element
function buildDOMTreeToElement(element) {
  const tree = []
  while (element) {
    const elementTag = element.tagName.toLowerCase()
    const elementText = element.textContent.trim() || null
    const attributes = {}

    // Extract attributes of the current element
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value
    }

    // Create a structured representation of the current element
    tree.unshift({
      text: elementText,
      'name of element': elementTag,
      list_of_properties: attributes,
    })

    // Move up to the parent element
    element = element.parentElement
  }

  return tree
}

// Read HTML file
fs.readFile('Amazon_landing_page.html', 'utf8', (err, htmlContent) => {
  if (err) {
    console.error('Error reading file:', err)
    return
  }

  // Parse HTML using jsdom
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document

  // Define the text to search for (e.g., "Sign out")
  const searchText = 'Not Himanshu? Sign Out'

  // Search for the element containing the search text
  const foundElement = findElementByText(document.body, searchText)

  if (foundElement) {
    // Build the DOM tree from <body> to the found element
    const domTree = buildDOMTreeToElement(foundElement)
    console.log(
      'DOM Tree from <body> to the element:',
      JSON.stringify(domTree, null, 2)
    )
  } else {
    console.log(`Element with text "${searchText}" not found.`)
  }
})
