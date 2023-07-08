const Data = require('../models/CacheData')
const api = require('../middleware/API')
const keyboard = require('../variables/Keyboards')
const {Player} = require("../database/Models");

class TGSceneController
{
    MainScene = async (context, type) =>
    {
        if(context.text.match(/^\/start$/))
        {
            await context.send(``)
        }
        if(Data.TGcodes[context.text])
        {
            await this.LinkAccount(context)
        }
    }

    async LinkAccount(context)
    {
        const id = Data.TGcodes[context.text]
        await Player.update({TGID: context.from.id, TGShortName: "@" + context.from.username}, {where: {id: id}})
        if(Data.users[id])
        {
            Data.users[id].TGID = context.from.id
            Data.users[id].TGShortName = "@" + context.from.username
        }
        delete Data.TGcodes[context.text]
        const player = await Player.findOne({where: {id: id}})
        const user = await api.GetUserData(id)
        await context.send(`✅ Ваш аккаунт успешно привязан к аккаунту "${user.first_name + " " + user.last_name}" и персонажу ${player?.dataValues.nick}`)
        await api.SendMessageWithKeyboard(id, `✅ Ваш аккаунт успешно привязан к пользователю "${context.from.first_name + " " + context.from.last_name}" в телеграмм`, [[keyboard.backButton]])
    }
}

module.exports = new TGSceneController()