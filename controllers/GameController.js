const Data = require("../models/CacheData");
const api = require("../middleware/API");
const {Player} = require("../database/Models");

class GameController
{
    async BanUser(id)
    {
        try
        {
            const user = await Player.findOne({where: {id: id}})
            if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = true
            user.set({
                isBanned: true
            })
            await user.save()
            await api.SendMessage(user.dataValues.id,`🚫Внимание!🚫
                                                        Вы были забанены в проекте *public218388422 («ZEUS - Вселенная игроков»)
                                                        Если вы не согласны с блокировкой - напишите одному из админов:
                                                        ${Data.admins.map(key => {
                if(key) return "*id" + key.id + "(" + key.nick +")\n"
            })}`)
            return true
        }
        catch (e)
        {
            return false
        }
    }

    async UnbanUser(id)
    {
        try
        {
            const user = await Player.findOne({where: {id: id}})
            if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = false
            user.set({
                isBanned: false
            })
            await user.save()
            await api.SendMessage(user.dataValues.id,`✅ Вы были разбанены в проекте *public218388422 («ZEUS - Вселенная игроков»)`)
            return true
        }
        catch (e)
        {
            return false
        }
    }
}

module.exports = new GameController()