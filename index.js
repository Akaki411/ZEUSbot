require('dotenv').config()
const {VK} = require('vk-io')
const TelegramBot = require('node-telegram-bot-api');
const {QuestionManager} = require('vk-io-question')

const database = require('./database/DataBase')
const Data = require('./models/CacheData')
const ChatController = require("./controllers/ChatController")
const CallbackEventController = require("./controllers/CallbackEventController")
const CacheUserMiddleware = require('./middleware/CacheUserMiddleware')
const CacheUserCallbackMiddleware = require('./middleware/CacheUserCallbackMiddleware')
const CacheUserCallbackTGMiddleware = require('./middleware/CacheUserCallbackTGMiddleware')
const CountStatsMiddleware = require('./middleware/CountStatsMiddleware')
const SelectPlayerMiddleware = require('./middleware/SelectPlayerMiddleware')
const CacheTGUserMiddleware = require('./middleware/CacheTGUserMiddleware')
const SceneController = require("./controllers/SceneController")
const BonusController = require("./controllers/BonusController")


const VKbot = new VK({token: process.env.VK_BOT_TOKEN})
const TGbot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true});
const questionManager = new QuestionManager()

VKbot.updates.on('message_new', questionManager.middleware)
VKbot.updates.on('message_new', CacheUserMiddleware)
VKbot.updates.on('message_new', SelectPlayerMiddleware)
VKbot.updates.on('message_new', CountStatsMiddleware)
VKbot.updates.on('message_event', CacheUserCallbackMiddleware)

// Памятка для кодеров:
// Архитектура бота построена на реализации паттерна state, у каждого игрока есть сцена, с которой он взаимодействует.
// Весь кэш бота находится в файле models/CacheData.js, там еще и прописаны методы загрузки кэша и быстрого нахождения кэшированной информации.
// Краткая карта кода:
// В файле controllers/BuildersAndControlsScripts.js находятся все исполняемые скрипты
// Файл controllers/SceneController.js содержит в себе все сцены
// controllers/CallbackEventController.js отвечает за обработку событий с callback кнопок
// controllers/ChatController.js отвечает за проверку команд вводимых в чатах

const StartDB = async () =>
{
    return new Promise(async (resolve, reject) => {
        try
        {
            await database.authenticate().then(() => {
                console.log("База данных подключена.")
            })
            await database.sync().then(() => {
                console.log("База данных синхронизирована.")
            })
            return resolve()
        }
        catch (e)
        {
            console.log("Ошибка запуска базы данных: " + e.message)
            return reject()
        }
    })

}

const LoadCache = () =>
{
    return new Promise(async (resolve, reject) => {
        try
        {
            await Data.LoadWorkers().then(() => {
                console.log("Список админов загружен")
            })
            await Data.LoadCountries().then(() => {
                console.log("Список фракций загружен")
            })
            await Data.LoadCities().then(() => {
                console.log("Список городов загружен")
            })
            await Data.LoadBuildings().then(() => {
                console.log("Список построек загружен")
            })
            await Data.LoadOfficials().then(() => {
                console.log("Чиновники загружены")
            })
            await Data.LoadVKChats().then(() => {
                console.log("Чаты ВК загружены")
            })
            await Data.LoadTGChats().then(() => {
                console.log("Чаты ТГ загружены")
            })
            await Data.ReloadChats().then(() => {
                console.log("Подсчет сообщений включен")
            })
            await Data.LoadVariables().then(async () => {
                console.log("Переменные загружены")
                await Data.onLoad({
                    StartScreen: SceneController.StartScreen,
                    Walking: SceneController.WaitingWalkMenu
                })
            })
            return resolve()
        }
        catch (e)
        {
            console.log("Ошибка загрузки кеша: " + e.message)
            return reject()
        }
    })
}

const StartVKBot = async () =>
{
    return new Promise((resolve) => {
        try
        {
            VKbot.updates.on('message_new', async(context) =>
            {
                if(!Data.ignore[context.player.id])
                {
                    context.TGapi = TGbot
                    context.scenes = SceneController
                    context.peerType === "user" && await context.player.state(context)
                    context.peerType === "chat" && await ChatController.CommandHandler(context)
                }
            })
            VKbot.updates.on('message_event', (context) =>
            {
                CallbackEventController.Handler(context)
            })
            VKbot.updates.on('like_add', async (context) =>
            {
                await BonusController.NewLike(context)
            })
            VKbot.updates.start().then(() => {
                console.log("ВК бот запущен")
                return resolve()
            })
        }
        catch (e)
        {
            console.log("ВК бот не смог запуститься из-за ошибки: " + e.message)
            return resolve()
        }
    })

}

const StartTGBot = async () => {
    return new Promise((resolve) =>
    {
        try
        {
            TGbot.on('message', async (context) =>
            {
                context.api = TGbot
                context.scenes = SceneController
                context.send = async (text, params) => {
                    await TGbot.sendMessage(context.chat.id, text, params)
                }
                await CacheTGUserMiddleware(context)
            })
            TGbot.on('callback_query', async (context) =>
            {
                context.api = TGbot
                context.scenes = SceneController
                context.send = async (text, options) => {
                    await TGbot.sendMessage(context.message.chat.id, text, options)
                }
                await CacheUserCallbackTGMiddleware(context)
            })
            console.log("ТГ бот запущен")
            return resolve()
        }
        catch (e)
        {
            console.log("ТГ бот не смог запуститься из-за ошибки: " + e.message)
            return resolve()
        }
    })
}

StartDB().then(() => LoadCache().then(async () => {
    await StartVKBot()
    await StartTGBot()
}))