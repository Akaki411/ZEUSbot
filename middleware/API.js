const {API} = require('vk-io')
const keyboard = require('../variables/Keyboards')
const Data = require("../models/CacheData")

class VK_API
{
    constructor(token)
    {
        this.api = new API({token: token})
    }

    async GetUserData(id)
    {
        const info = await this.api.users.get({
            user_ids: id
            })
        return info[0]
    }

    async SendMessage(id, message)
    {
        if(!id) return
        await this.api.messages.send({
            user_id: id,
            random_id: Math.round(Math.random() * 100000),
            message: message
        })
    }

    async SendMessageWithKeyboard(id, message, kb)
    {
        if(!id) return
        await this.api.messages.send({
            user_id: id,
            random_id: Math.round(Math.random() * 100000),
            message: message,
            keyboard: keyboard.build(kb)
        })
    }


    async GMMailing(message, kb)
    {
        let GMs = Object.keys(Data.gameMasters)
        for(let i = 0; i < GMs.length; i++)
        {
            await this.api.messages.send({
                user_id: GMs[i],
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: kb ? keyboard.build(kb).inline().oneTime() : keyboard.inlineNone
            })
        }
    }

    async SendAccessKey()
    {
        if(!Data.owner) return
        await this.api.messages.send({
            user_id: GMs[i],
            random_id: Math.round(Math.random() * 100000),
            message: message,
            keyboard: kb ? keyboard.build(kb).inline().oneTime() : keyboard.inlineNone
        })
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)