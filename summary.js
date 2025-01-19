const { GoogleGenerativeAI } = require('@google/generative-ai')
const apiKey = 'AIzaSyDsnji0oAd08VrQ5a-0VQSQnCP9ts0gsns'
const genAI = new GoogleGenerativeAI(apiKey)

const fs = require('fs')
const cheerio = require('cheerio')
const axios = require('axios')

// Path to the HTML file
const filePath = 'Amazon_landing_page.html'

// Read the HTML file using fs
fs.readFile(filePath, 'utf-8', (err, htmlContent) => {
  if (err) {
    console.error('Error reading file:', err)
    return
  }

  // Load HTML into cheerio for parsing
  const $ = cheerio.load(htmlContent)

  // Extract text from <p>, <h1>, <h2>, etc.
  let extractedText = ''
  const tags = ['p', 'h1', 'h2', 'h3', 'input', 'button', 'a', 'span'] // Customize the tags to extract
  tags.forEach((tag) => {
    $(tag).each((index, element) => {
      extractedText += $(element).text() + ' '
    })
  })

  get_summary(extractedText)
})


async function get_summary(summarized_text) {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Tailor this reponse such as you are explaining a blind person what is available on the website, directly give me the summary dont add any intro such as this is the summary, explain him in each section what is the list of products available: ${summarized_text}`

  const result = await model.generateContent(prompt)

  const response = JSON.stringify(
    result.response.candidates[0].content.parts[0].text
  )

  // Save the response to a file
  fs.writeFile('summary_response.txt', response, (err) => {
    if (err) {
      console.error('Error writing to file:', err)
    } else {
      console.log('Response saved to summary_response.txt')
    }
  })
  await sendToFlaskAPI(response)
}

async function sendToFlaskAPI(summaryText) {
  const flaskApiUrl = 'http://localhost:5000/texttospeech' // Replace with your Flask API URL

  try {
    const response = await axios.post(flaskApiUrl, {
      summary: summaryText,
    })

    console.log('Text successfully sent to Flask API:', response.data)
  } catch (error) {
    console.error(
      'Failed to send text to Flask API:',
      error.response ? error.response.data : error.message
    )
  }
}
