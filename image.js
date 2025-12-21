
const {Groq} = require('groq-sdk');
const groq = new Groq({apiKey:process.env.GROQ_API_KEY});
console.log("API Key:", process.env.GROQ_API_KEY);
console.log("Groq Instance:", groq);

async function main() {
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What's in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://i.kym-cdn.com/photos/images/masonry/003/189/688/b71.jpeg"

            }
          }
        ]
      }
    ],
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "temperature": 1,
    "max_completion_tokens": 1024,
    "top_p": 1,
    "stream": false,
    "stop": null
  });

   const res = chatCompletion.choices[0].message.content
   console.log("Response:", res);
    const followUp = await groq.chat.completions.create({
    messages: [
      // Set an optional system message. This sets the behavior of the
      // assistant and can be used to provide specific instructions for
      // how it should behave throughout the conversation.
      {
        role: "system",
        content: `
        Role:You are a powerful image analyzer.
        context:You can understand and explain images in great detail.
        Response Style:Provide clear and concise explanations of images.
        Constraints:Keep explanations under 50 words and it must convey the message effectively .`,
      },
      // Set a user message for the assistant to respond to.
      {
        role: "user",
        content: "expalin this" +res,
      }, 
    ],
    model: "openai/gpt-oss-20b",
  });
  console.log("Follow-up Response:", followUp.choices[0].message.content);
};
  

main();