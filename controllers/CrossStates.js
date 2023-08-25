const Data = require("../models/CacheData")
const {Keys, Warning, Player, Ban} = require("../database/Models")
const api = require("../middleware/API")
const StopList = require("../files/StopList.json");
const keyboard = require("../variables/Keyboards");

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

    async NewWarning(userId, time, reason, explanation, proofs, moderId)
    {
        try
        {
            const names = await api.GetTags([userId, moderId])
            let send = true

            await Warning.create({
                userID: userId,
                reason: reason,
                explanation: explanation,
                proofImage: proofs,
                time: time,
                moderID: moderId
            })
            let warnCount = await Warning.count({where: {userID: userId}})
            await Player.update({isBanned: warnCount >= 3}, {where: {id: userId}})
            try
            {
                await api.api.messages.send({
                    user_id: proofs.userID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `⚠ Вам выдано предупреждение, срок его действия ${time} дней, причина:\n\n${reason}`,
                    attachment: proofs
                })
            }
            catch (e) { send = false }

            let notification = `⚠ Модератор ${names[moderId] ? names[moderId] : `@id${moderId}`} выдал предупреждение игроку ${names[userId] ? names[userId] : `@id${userId}`} сроком ${time} дней.\n\nПричина: ${reason}\nОписание:${explanation}`
            if(warnCount >= 3 && !StopList.includes(userId))
            {
                const warnings = await Warning.findAll({where: {id: userId}, attributes: ["proofImage"]})
                const photos = warnings.map(key => {return key.dataValues.proofImage}).join(",")
                try
                {
                    await api.api.messages.send({
                        user_id: userId,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠⚠⚠ Вы получили бан.\n\nКоличество ваших предупреждений равно 3, ваш аккаунт получает блокировку в проекте, блокировка будет действовать до истечения срока одного из предупреждений.\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`,
                        attachment: photos
                    })
                } catch (e) {}
                notification += `\n\nКоличество репортов достигло 3-х, игрок забанен.`
                if(Data.users[userId]) Data.users[userId].isBanned = true
                await api.BanUser(userId)
                await Ban.create({
                    userID: userId,
                    reason: "3 предупреждения",
                    explanation: "3 предупреждения",
                    moderID: moderId,
                    proofImage: photos
                })
            }
            const admins = await Player.findAll({where: {role: ["moder", "admin", "Madmin", "support", "project_head", "owner"]}})
            for(const i of admins)
            {
                try
                {
                    await api.api.messages.send({
                        user_id: i.dataValues.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: notification,
                        attachment: proofs
                    })
                } catch (e) {}
            }
            return send
        }
        catch (e)
        {
            console.log(e)
            return false
        }
    }
}

module.exports = new CrossStates()