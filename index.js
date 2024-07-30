const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const { VertexAI } = require("@google-cloud/vertexai");

const API_ID = 23636017;
const API_HASH = "d02ac1408f8bae40d4fb7748e8019ad1";
const STRING_SESSION = new StringSession(
  "1AgAOMTQ5LjE1NC4xNjcuNDEBuwmlmGBkP5TKvpnQPBJEvc/GUs61rX/XkSLUQ+Xt6ehQ8UM9hiEqMwWFG/8w4i1v+VFhwBx8aBXsQnjFDnqRqhwhQgf5jn4w3YSC5Bq88qC6C+Zt6I6BSv6Jgpbny73AoM+mFPqSasSAzdFurlZPc8Te34AW5yqQJ6FmomoJI0251HElgFBmX49wsbrlYs+PtNcseIIXe1wogLxG61nfmlj7LtYttenLphmmfFaj/Qr0RQAD3y2bwrWNsz5+u6odbq88a0UZ9NPVy0qIK0NCazPi16DqDfDxeRopkTGSkL5t9/x4l0oSiKcak8HKqQXlyh9ewDme9JJg6uEHCUbqtSA="
);

(async () => {
  console.log("Загрузка приложения");
  const client = new TelegramClient(STRING_SESSION, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Введите номер телефона:"),
    password: async () => await input.text("Введите пароль:"),
    phoneCode: async () => await input.text("Введите код авторизации:"),
    onError: (err) => console.error("Ошибка подключения:", err),
  });
  console.log("Подключение успешно.");
  if (STRING_SESSION == "") {
    console.log("Сохраните строку сессии:", client.session.save());
  }

  async function getAiResponse(prompt, projectId = "alpine-myth-429014-e4") {
    try {
      console.log("Начинаем генерировать ответ");
      const vertexAI = new VertexAI({
        project: projectId,
        location: "us-central1",
      });
      const generativeModel = vertexAI.getGenerativeModel({
        model: "gemini-1.5-flash-001",
      });
      const resp = await generativeModel.generateContent(prompt);
      const contentResponse = await resp.response;
      let text = contentResponse.candidates[0].content.parts[0].text;
      return text;
    } catch (error) {
      console.error("Произошла ошибка при генерации ответа:", error);
      return "Произошла ошибка при обработке вашего запроса.";
    }
  }

  async function generatePrompt(contextChatPromprt) {
    const promptRules = `
        Ты не языковая модель, а отыгрываешь роль парня, который знакомится с девушкой.
        Твоя легенда: ты 20-летний айтишник. Живёшь в Черногории.
        Поэтому ты не говоришь о том, что ты языковая модель, а даёшь ответ на поставленный вопрос как это сделал бы человек.
        Не дублируй сообщение полученное от человека в своём ответе.
        Не используй эмодзи и смайлики в своём ответе.
        Отвечай настолько коротко, насколько возможно.
        Вот история переписки:
        `
    const finalPrompt = promptRules + contextChatPromprt;
    const response = await getAiResponse(finalPrompt);

    console.log("Ответ от AI:", response);
    await client.sendMessage(messageSenderId, { message: response });
    }

  let messageBuffer = [];

  async function handleNewMessage(event) {
    const aimSenderId = 6313907014;

    const message = event.message;
    const fetchedSender = await message.getSender();
    const senderId = fetchedSender.id;

    if (senderId == aimSenderId) {
      // console.log(`Получено сообщение от ${senderId}`);
      const newMessages = await client.getMessages(senderId, { limit: 100 });
      const messageList = JSON.parse(JSON.stringify(newMessages));
      const chatHistory = getLessChatHistory(messageList);
      if(messageBuffer.length === 0){
        messageBuffer.push(chatHistory);
        console.log("Буфер был пустой поэтому в него добавлена история сообщений");
      }
      const lastMessage = chatHistory.at(0);
      messageBuffer.push(lastMessage);
      console.log("В буфер добавлена запись");
    } else {
      console.log(`Пришло сообщение не от ${aimSenderId},а от ${senderId}`);
      return;
    }
  }
  client.addEventHandler(handleNewMessage, new NewMessage({}));
})();

function getLessChatHistory(arr) {
  return arr.map((item) => ({
    message: item.message,
    out: item.out,
    date: item.date,
  }));
}
