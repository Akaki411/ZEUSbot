const {API} = require('vk-io')
const keyboard = require('../variables/Keyboards')

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

    async GetChatLink(id)
    {
        return await this.api.messages.getInviteLink({
            peer_id: id,
            reset: 0
        })
    }

    async SendMessage(id, message, kb)
    {
        if(kb)
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: keyboard.build(kb)
            })
        }
        else
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
    }

    async SendMessageWithAttachment(id, message, attachment, kb)
    {
        if(kb)
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                attachment: attachment,
                keyboard: keyboard.build(kb)
            })
        }
        else
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                attachment: attachment
            })
        }
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)