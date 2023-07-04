const {Warning, Player} = require("../database/Models");
const keyboard = require("../variables/Keyboards")
const NameLibrary = require("../variables/NameLibrary")
const api = require("../middleware/API")
const Data = require("../models/CacheData")

class OutputManager
{
    async Timeout(time)
    {
        return new Promise(async (resolve) => {
            setTimeout(() => {
                return resolve()
            }, time * 1000)
        })
    }

    async GetUserWarnings(adminID, userID)
    {
        return new Promise(async (resolve) => {
            try
            {
                const warnings = await Warning.findAll({where: {userID: userID}})
                if(warnings.length === 0)
                {
                    await api.SendMessage(adminID, "Предупреждений не найдено")
                    return resolve()
                }
                let user = null
                let time = null
                let moder = null
                for(let i = 0; i < warnings.length; i++)
                {
                    moder = warnings[i].dataValues.moderID ? await Player.findOne({where: {id: warnings[i].dataValues.moderID}}) : null
                    user = await Player.findOne({where: {id: warnings[i].dataValues.id}})
                    time = new Date(warnings[i].dataValues.createdAt)
                    time.setDate(time.getDate() + warnings[i].dataValues.time)
                    await api.api.messages.send({
                        user_id: adminID,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Предупреждение от ${NameLibrary.ParseDateTime(warnings[i].dataValues.createdAt)}, выдан${moder ? ` модератором *id${moder.dataValues.id}(${moder.dataValues.nick})` : ""} на ${warnings[i].dataValues.time} дней (до ${NameLibrary.ParseDateTime(time)}):\n\nПричина: ${warnings[i].dataValues.reason}\n\nОписание: ${warnings[i].dataValues.explanation}`,
                        attachment: warnings[i].dataValues.proofImage,
                        keyboard: keyboard.build([[keyboard.appealCallbackButton({command: "appeal_warning", item: warnings[i].dataValues.id})], [keyboard.hideCallbackButton()]]).inline()
                    })
                    await this.Timeout(0.5)
                }
                return resolve()
            }
            catch (e)
            {
                let context = {
                    player: {
                        id: adminID,
                        nick: adminID
                    }
                }
                await api.SendLogs(context, "OutputManager/GetUserWarnings", e)
            }
        })
    }

    async GetCountryCarousel(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = Data.countries.filter(key => {
                    return key !== undefined
                })
                const pages = []
                for(let i = 0; i < Math.ceil(countries.length/5); i++)
                {
                    pages.push(countries.slice((i * 5), (i * 5) + 5))
                }
                for(let i = 0; i < pages.length; i++)
                {
                    await context.send(`Фракции ${i + 1}-я страница:`, {
                        template: `{
                            "type": "carousel",
                            "elements": [
                                ${pages[i].map(key => {
                                if(key)
                                {
                                    return JSON.stringify({
                                        title: key.name,
                                        description: key.description.slice(0,75),
                                        photo_id: key.photoURL.replace("photo", ""),
                                        action: {
                                            type: "open_link",
                                            link: "https://vk.com/public" + key.groupID
                                        },
                                        buttons: [
                                            {
                                                action: {
                                                    type: "open_link",
                                                    link: "https://vk.com/public" + key.groupID,
                                                    label: "🏛 Перейти в сообщество"
                                                }
                                            },
                                            {
                                                action: {
                                                    type: "text",
                                                    label: "💬 Показать чаты",
                                                    payload: JSON.stringify({
                                                        type: "show_chat",
                                                        countryID: key.id
                                                    })
                                                },
                                            }
                                        ]
                                    })
                                }
                            })}
                            ]
                        }`})
                    await this.Timeout(0.25)
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "OutputManager/WelcomeMessage", e)
            }
        })
    }

    async WelcomeMessage(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let text = "🎉 %имя%, приветствуем тебя в нашем проекте! \n" +
                    "\n" +
                    "В чем суть проекта? \n" +
                    "\n" +
                    "🌍 Проект представляет из себя античный мир 3 века до нашей эры, наполненный виртуальными государствами (фракциями), у каждой фракции есть один или несколько чатов, своя экономика и взаимоотношения с соседними фракциями.\n" +
                    "\n" +
                    "👤 Вы, как игрок, можете создать своего персонажа, принять гражданство одной из фракций, после чего вам станет доступна добыча ресурсов этой фракции, строительство частных построек и возможно даже сможете занять одну из руководящий должностей.\n" +
                    "\n" +
                    "🤖 Сердце проекта – бот, который находится во всех чатах и позволяет взаимодействовать с игровыми функциями через команды в привязанных чатах или ЛС бота.\n"
                let name = await api.GetUserData(context.player.id)
                text = text.replace("%имя%", name.first_name)
                await context.send(text, {keyboard: keyboard.build([[keyboard.countryListButton]]).inline()})
                await context.send("📣 В нашем проекте существуют свои правила, их можно найти в группе или попросить бота показать выдержку из них через команду \"статья [номер статьи]\", особенно уделите внимание 24-й статье.\n\n❗ Так же в каждой фракций есть свой модератор, которые следят за чатами и помогают новичкам, поэтому если у вас появились вопросы - обращайтесь к ним.")
                text = "📎 Вот наши стражи порядка:\n\n"
                for(const country of Data.countries)
                {
                    if(country)
                    {
                        text += country.GetName() + " - " +  (country.moderID ? await api.GetName(country.moderID) : "не назначен") + "\n"
                    }
                }
                await context.send(text)
                await context.send("⁉ Так же, если у вас есть вопросы о том, как пользоваться ботом - специально для этого у нас есть отдельная статья, в ней все описано подробно и с иллюстрациями\n" + Data.variables["articleLink"])
                await context.send("✏ Вы можете изменить данные вашего персонажа по нажатию на кнопку ниже, введя команду \"Регистрация\" или перейдя в меню параметров", {keyboard: keyboard.build([[keyboard.registrationButton]]).inline()})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "OutputManager/WelcomeMessage", e)
            }
        })
    }

    async GetDayActiveMessage(params) // {command, app, platform}
    {
        try
        {
            let temp, country, request = ""
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(params.command.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                let request = "🔰 Актив фракций:\n\n"
                let activeCountries = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        activeCountries.push([Data.countries[i].active, i])
                    }
                }
                for (let j = activeCountries.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (activeCountries[i][0] < activeCountries[i + 1][0])
                        {
                            let temp = activeCountries[i];
                            activeCountries[i] = activeCountries[i + 1];
                            activeCountries[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < activeCountries.length; i++)
                {
                    if(Data.countries[activeCountries[i][1]])
                    {
                        request += `${Data.countries[activeCountries[i][1]].name}\n`
                        request +=  `${Data.countries[activeCountries[i][1]].chatID ? `⚒ Актив за сегодня: ${Data.countries[activeCountries[i][1]].active} сообщений` : "⚠ Чат не добавлен"}\n`
                        request += `💪 Рейтинг активности: ${Data.countries[activeCountries[i][1]].rating}\n`
                        request += `🔴 Получено варнов: ${Data.countries[activeCountries[i][1]].warnings}\n\n`
                    }
                }
                return {request: request, short: false}
            }
            else
            {
                request += `${country.GetName(params.platform === "IOS", params.app)}\n`
                request +=  `${country.chatID ? `⚒ Актив за сегодня: ${country.active} сообщений` : "⚠ Чат не добавлен"}\n`
                request += `💪 Рейтинг активности: ${country.rating}\n`
                request += `🔴 Получено варнов: ${country.warnings}`
                return {request: request, short: true}
            }
        }
        catch (e)
        {
            return "Ошибка: " + e.message
        }
    }
}

module.exports = new OutputManager()