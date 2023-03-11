require('dotenv').config()
const {VK} = require('vk-io')
const {QuestionManager} = require('vk-io-question')

const database = require('./database/DataBase')
const Data = require('./models/CacheData')
const ChatController = require("./controllers/ChatController")
const CallbackEventController = require("./controllers/CallbackEventController")
const CacheUserMiddleware = require('./middleware/CacheUserMiddleware')
const CacheUserCallbackMiddleware = require('./middleware/CashUserCallbackMiddleware')
const CountStatsMiddleware = require('./middleware/CountStatsMiddleware')

const bot = new VK({token: process.env.VK_BOT_TOKEN})
const questionManager = new QuestionManager()

bot.updates.use(questionManager.middleware)
bot.updates.on('message_new', CacheUserMiddleware)
bot.updates.on('message_new', CountStatsMiddleware)
bot.updates.on('message_event', CacheUserCallbackMiddleware)

const start = async () => {
    try
    {
        await database.authenticate().then(() => {
            console.log("База данных подключена.")
        })
        await database.sync().then(() => {
            console.log("База данных синхронизирована.")
        })
        await Data.LoadAdmins().then(() => {
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
        await Data.LoadDelegates().then(async () => {
            console.log("Делегаты загружены")
        })
        await Data.LoadVariables().then(async () => {
            console.log("Переменные загружены")
        })

        bot.updates.on('message_new', async(msg) =>
        {
            msg.peerType === "user" && await msg.player.state(msg)
            msg.peerType === "chat" && await ChatController.CommandHandler(msg)
        })
        bot.updates.on('message_event', (context) =>
        {
            CallbackEventController.Handler(context)
        })

        bot.updates.start().then(() => console.log("Бот запущен"))
    }
    catch (e)
    {
        console.log("Бот не смог запуститься из-за ошибки: " + e.message)
    }
}

start()