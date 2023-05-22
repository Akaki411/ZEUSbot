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
}

module.exports = new OutputManager()