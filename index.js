const TelegramApi = require('node-telegram-bot-api');
const {gameOptions, againOptions} = require('./options');
const sequelize = require('./db');
const UserModel = require('./models');

const token = '1834950148:AAF_OYAQjCm0v6QzXkti7uW9G5yEwJvoPyY';

const bot = new TelegramApi(token , {polling: true});

const chats = {};

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Сейчас я загадаю цифру от 0 до 9 и ты попробуй её угадать`);
    const randomNumber = Math.floor(Math.random() * 10);
    chats[chatId] = randomNumber;
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions);
}

const start = async () => {

  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log('Подключение к бд сломалось', e);
  }

  bot.setMyCommands([
    {command: '/start', description: 'Начальное приветствие'},
    {command: '/info', description: 'Информация о пользователе'},
    {command: '/game', description: 'Игра угадай цифру'},
  ])
  
  bot.on('message', async msg => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if(text === '/start') {
        await UserModel.create({chatId});
        await bot.sendSticker(chatId, 'https://cdn.tlgrm.ru/stickers/6f9/bf3/6f9bf3ed-544f-37cf-b3e1-1779eccbf3d2/192/1.webp');
        return bot.sendMessage(chatId, `Добро пожаловать в телеграм бот`);
      }
  
      if(text === '/info') {
        const user = await UserModel.findOne({chatId});
        return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, в игре у тебя правильных ответов ${user.right}, в игре у тебя неправильных ответов ${user.wrong}`);
      }
  
      if(text === '/game') {
        return startGame(chatId);
      }
  
      return bot.sendMessage(chatId, `Моя твоя не понимать`);
    } catch (e) {
      return bot.sendMessage(chatId, 'Произошла какая-то ошибка')
    }
  
    
  })

  bot.on('callback_query', async msg => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    if(data == '/again') {
      return startGame(chatId);
    }

    const user = UserModel.findOne({chatId});

    if(data == chats[chatId]) {
      user.right += 1;
      await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру ${chats[chatId]}`, againOptions);
    } else {
      user.wrong += 1;
      await bot.sendMessage(chatId, `К сожалению, ты не отгадал цифру ${chats[chatId]}`, againOptions);
    }
    await user.save();
  })
}

start();