const Data = require("../models/CacheData")
const api = require("../middleware/API")

class BotReactions
{
    constructor()
    {
        this.stickers = {
            fun: [161, 73055, 158, 102, 37, 36, 75, 66, 89, 126, 141],
            surprised: [69, 73877, 73078, 162, 167, 104, 2, 60765, 155],
            cringe: [163, 73877, 73055, 73083, 142, 162, 73879, 73, 141],
            pleased: [73055, 161, 131, 158, 102, 60748, 75, 89, 141]
        }
        this.GetSticker = (type) => {
            return this.stickers[type][Math.floor(Math.random() * this.stickers[type].length)]
        }
    }

    async Waiting(sec)
    {
        return new Promise((resolve) => {
            setTimeout(() => {
                return resolve()
            }, sec * 1000)
        })
    }

    Mute = async (context) =>
    {
        try
        {
            await api.SendSticker(context.peerId, this.GetSticker("surprised"))
            await this.Waiting(2.5)
            await context.send("УЪУЪУЪУЪУЪ СУКА!")
            await this.Waiting(3)
            await api.SendSticker(context.peerId, 84204)
            await this.Waiting(3)
            if(Data.mute[context.player.id])
            {
                clearTimeout(Data.mute[context.player.id].timeout)
                delete Data.mute[context.player.id]
            }
            Data.mute[context.player.id] = {
                moder: 1,
                timeout: setTimeout(async () => {delete Data.mute[context.player.id]}, 60000)
            }
            await context.reply("Посиди в муте, лалка!")
            await this.Waiting(1)
            await api.SendSticker(context.peerId, this.GetSticker("pleased"))
        }
        catch (e)
        {
            console.log(e)
        }
    }
}

module.exports = new BotReactions()