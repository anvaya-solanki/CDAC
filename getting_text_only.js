const fs = require('fs')
const { JSDOM } = require('jsdom')

// Function to extract all text content from an element and its children
function extractTextContent(element) {
  const textArray = []

  // If the element contains text content, add it to the array
  const elementText = element.textContent.trim()
  if (elementText) {
    textArray.push(elementText)
  }

  // Recursively process the child elements
  for (const child of element.children) {
    textArray.push(...extractTextContent(child))
  }

  return textArray
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

  // Extract all text content from the body of the document
  const allTextContent = extractTextContent(document.body)
  console.log(allTextContent)
})
