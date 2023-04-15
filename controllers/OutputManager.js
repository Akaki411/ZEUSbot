const Data = require("../models/CacheData");
const {Warning, Player} = require("../database/Models");
const keyboard = require("../variables/Keyboards")
const NameLibrary = require("../variables/NameLibrary")
const api = require("../middleware/API")

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

    async SendCountryCarousel(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = Data.countries.filter(key => {
                    return key !== undefined
                })
                const pages = []
                for(let i = 0; i < Math.ceil(countries.length/9); i++)
                {
                    pages.push(countries.slice((i * 9), (i * 9) + 9))
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
                                            description: key.description,
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
                                                        label: "Перейти в сообщество"
                                                    }
                                                }
                                            ]
                                        })
                                    }
                                })}
                            ]
                        }`
                    })
                    await this.Timeout(0.25)
                }
                return resolve()
            }
            catch (e)
            {
                console.log(e)
            }
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
                for(let i = 0; i < warnings.length; i++)
                {
                    user = await Player.findOne({where: {id: warnings[i].dataValues.id}})
                    await api.api.messages.send({
                        user_id: adminID,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Предупреждение от ${NameLibrary.ParseDateTime(warnings[i].dataValues.createdAt)}:\n\nПричина: ${warnings[i].dataValues.reason}\n\nОписание:\n${warnings[i].dataValues.explanation}`,
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
}

module.exports = new OutputManager()