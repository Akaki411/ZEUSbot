const Data = require('../models/CacheData')
const api = require('../middleware/API')
const keyboard = require('../variables/Keyboards')
const {Player} = require("../database/Models");

class TGSceneController
{
    MainScene = async (context) =>
    {
        try
        {
            if(context.text.match(/^\/start$/))
            {
                await context.send(`🎉 Приветствую тебя в проекте ZEUS\\!\n\n💫 Это телеграмм версия проекта, полный функционал доступен в [ВК боте](https:\/\/vk.com\/im?sel=${process.env.GROUPID})\\.${context.player ? "" : `\n\n❗ Для того чтобы начать пользоваться телеграм версией бота, вам надо привязать профиль из ВК версии бота\\.\n\n✨ Для подвязки ВК профиля откройте меню [ВК бота](https:\/\/vk.com\/im?sel=${process.env.GROUPID}), перейдите в меню параметров \\(Меню\\-\\>Параметры\\), нажмите на кнопку "Привязать телеграм", бот выдаст вам одноразовый код состоящий из 8 цифр, отправьте его этому боту и вам будет доступен полный функционал бота\\.`}`, {parse_mode: 'MarkdownV2'})
            }
            if(Data.TGcodes[context.text])
            {
                await this.LinkAccount(context)
            }
        } catch (e) {}
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