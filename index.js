const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const { VertexAI } = require("@google-cloud/vertexai");
// import chalk from 'chalk';

const apiId = 23636017;
const apiHash = "d02ac1408f8bae40d4fb7748e8019ad1";
const stringSession = new StringSession(
  "1AgAOMTQ5LjE1NC4xNjcuNDEBuwmlmGBkP5TKvpnQPBJEvc/GUs61rX/XkSLUQ+Xt6ehQ8UM9hiEqMwWFG/8w4i1v+VFhwBx8aBXsQnjFDnqRqhwhQgf5jn4w3YSC5Bq88qC6C+Zt6I6BSv6Jgpbny73AoM+mFPqSasSAzdFurlZPc8Te34AW5yqQJ6FmomoJI0251HElgFBmX49wsbrlYs+PtNcseIIXe1wogLxG61nfmlj7LtYttenLphmmfFaj/Qr0RQAD3y2bwrWNsz5+u6odbq88a0UZ9NPVy0qIK0NCazPi16DqDfDxeRopkTGSkL5t9/x4l0oSiKcak8HKqQXlyh9ewDme9JJg6uEHCUbqtSA="
);

(async () => {
  // console.log(chalk.green('Загрузка приложения'));
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Введите номер телефона:"),
    password: async () => await input.text("Введите пароль:"),
    phoneCode: async () => await input.text("Введите код авторизации:"),
    onError: (err) => console.error("Ошибка подключения:", err),
  });
  console.log("Подключение успешно.");
  if (stringSession == "") {
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

  async function generatePrompt(event) {
    const mainRulesprompt = `
        Ты не языковая модель, а отыгрываешь роль парня, который знакомится с девушкой.
        Твоя легенда: ты 20-летний айтишник. Живёшь в Черногории.
        Поэтому ты не говоришь о том, что ты языковая модель, а даёшь ответ на поставленный вопрос как это сделал бы человек.
        Не дублируй сообщение полученное от человека в своём ответе.
        Не используй эмодзи и смайлики в своём ответе.
        Отвечай настолько коротко, насколько возможно.
        Вот история переписки: 
        `;

    const specificSenderId = 6313907014;

    const message = event.message;
    const sender = await message.getSender();
    const messageSenderId = sender.id;
    console.log(`Получено сообщение от ${messageSenderId}`);
    if (messageSenderId == specificSenderId) {
      // Получаем историю сообщений для текущего чата
      const chatHistory = await client.getMessages(messageSenderId, {
        limit: 20,
      });
      const formattedChatHistory = chatHistory
        .reverse()
        .map((msg) => `Сообщение ${msg.message} от ${msg.senderId}`)
        .join("; ");
      console.log(formattedChatHistory);

      const finalPrompt = mainRulesprompt + formattedChatHistory;
      const response = await getAiResponse(finalPrompt);

      console.log("Ответ от AI:", response);
      await client.sendMessage(messageSenderId, { message: response });
    }
  }
//Отдельно создать функцию getChatHistory, которая будет обновлять историю сообщений при каждом новом сообщении
//После первого полученного сообщения бот ждёт ещё пять секунд и в течение этого времени собирает все полученные сообщения
  client.addEventHandler(generatePrompt, new NewMessage({}));
})();
