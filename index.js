require('dotenv').config()
const {VK} = require('vk-io')
const {QuestionManager} = require('vk-io-question')

const database = require('./database/DataBase')
const Data = require('./models/CacheData')
const CacheUserMiddleware = require('./middleware/CacheUserMiddleware')

const bot = new VK({token: process.env.VK_BOT_TOKEN})
const questionManager = new QuestionManager()

bot.updates.use(questionManager.middleware)
bot.updates.on('message_new', CacheUserMiddleware)

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
        await Data.LoadVariables().then(async () => {
            console.log("Переменные загружены")
        })

        bot.updates.on('message_new', async(msg) => {
            msg.peerType === "user" && await msg.player.state(msg)
            msg.peerType === "chat" && await chatMessageHandler(msg)
        })
        bot.updates.on('message_event', async(msg) => {
            console.log(msg)
        })

        bot.updates.start().then(() => console.log("Бот запущен"))
    }
    catch (e)
    {
        console.log("Бот не смог запуститься из-за ошибки: " + e.message)
    }
}

const chatMessageHandler = async (msg) =>
{
    // msg.reply("Chat")
}

start()