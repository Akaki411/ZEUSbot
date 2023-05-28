const Data = require("../models/CacheData")
const {Keys} = require("../database/Models")
const api = require("../middleware/API")

class CrossStates
{
    async Relaxing(context)
    {
        if(Data.timeouts["user_timeout_sleep_" + context.player.id])
        {
            const lvls = {
                0: 360,
                1: 300
            }
            const now = new Date()
            const time = Math.max(0, Math.round((Data.timeouts["user_timeout_sleep_" + context.player.id].time - now) / 60000))
            context.player.isRelaxing = false
            context.player.fatigue = Math.round(100 - (time * (100 / lvls[Data.timeouts["user_timeout_sleep_" + context.player.id].houseLevel])))
            clearTimeout(Data.timeouts["user_timeout_sleep_" + context.player.id].timeout)
            delete Data.timeouts["user_timeout_sleep_" + context.player.id]
        }
        else
        {
            const lvls = {
                0: 3.6,
                1: 3.0
            }
            const keys = await Keys.findAll({where: {ownerID: context.player.id}})
            let houseLevel = 0

            for(let i = 0; i < Data.buildings[context.player.location]?.length; i++)
            {
                if (Data.buildings[context.player.location][i].ownerType === "user" && Data.buildings[context.player.location][i].type.match(/house/))
                {
                    for (const key of keys)
                    {
                        if (key.dataValues.houseID === Data.buildings[context.player.location][i].id)
                        {
                            houseLevel = 1
                            break
                        }
                    }
                }
            }
            const need = (100 - context.player.fatigue) * lvls[houseLevel]
            const time = new Date()
            time.setMinutes(time.getMinutes() + need)
            Data.timeouts["user_timeout_sleep_" + context.player.id] = {
                type: "user_timeout",
                subtype: "sleep",
                userId: context.player.id,
                time: time,
                houseLevel: houseLevel,
                timeout: setTimeout(async () => {
                    await api.SendMessage(context.player.id, "☕ Ваши силы восстановлены")
                    context.player.fatigue = 100
                    context.player.isRelaxing = false
                    delete Data.timeouts["user_timeout_sleep_" + context.player.id]
                }, need * 60000)
            }
            context.player.isRelaxing = true
        }
        return {
            fatigue: context.player.fatigue,
            sleep: !!Data.timeouts["user_timeout_sleep_" + context.player.id],
            time: Data.timeouts["user_timeout_sleep_" + context.player.id]?.time
        }
    }
}

module.exports = new CrossStates()