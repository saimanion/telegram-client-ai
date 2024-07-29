const {VertexAI} = require('@google-cloud/vertexai');
async function getAiResponse(prompt, projectId = 'alpine-myth-429014-e4') {
  const vertexAI = new VertexAI({project: projectId, location: 'us-central1'});

  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash-001',
  });
  const resp = await generativeModel.generateContent(prompt)
  const contentResponse = await resp.response
  let text = contentResponse.candidates[0].content.parts[0].text;
  console.log(text);

}


getTextResponse()


