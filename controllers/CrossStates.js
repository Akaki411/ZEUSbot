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

    async NewWarning(context, proofs)
    {
        await Warning.create({
            userID: proofs.userID,
            reason: proofs.reason,
            explanation: proofs.explanation,
            proofImage: proofs.photoProof,
            time: proofs.time,
            moderID: context.player.id
        })
        let warnCount = await Warning.count({where: {userID: proofs.userID}})
        await Player.update({warningScore: warnCount, isBanned: warnCount >= 3}, {where: {id: proofs.userID}})
        await api.api.messages.send({
            user_id: proofs.userID,
            random_id: Math.round(Math.random() * 100000),
            message: `⚠ Вам выдано предупреждение, срок его действия ${proofs.time} дней, причина:\n\n${proofs.reason}`,
            attachment: proofs.photoProof
        })
        let notification = `⚠ Модератор ${context.player.GetName()} выдал предупреждение игроку *id${proofs.userID}(${proofs.nick})`
        if(warnCount >= 3 && !StopList.includes(proofs.userID))
        {
            const warnings = await Warning.findAll({where: {id: proofs.userID}, attributes: ["proofImage"]})
            const photos = warnings.map(key => {return key.dataValues.proofImage}).join(",")
            try
            {
                await api.api.messages.send({
                    user_id: proofs.userID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `⚠⚠⚠ Вы получили бан.\n\nКоличество ваших предупреждений равно 3, ваш аккаунт получает блокировку в проекте, блокировка будет действовать до истечения срока одного из предупреждений.\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`,
                    attachment: photos
                })
            } catch (e) {}
            notification += `, количество репортов достигло 3-х, игрок забанен`
            if(Data.users[proofs.userID]) Data.users[proofs.userID].isBanned = true
            await api.BanUser(proofs.userID)
            await Ban.create({
                userID: proofs.userID,
                reason: "3 предупреждения",
                explanation: "Игрок заблокирован потому что имеет 3 предупреждения",
                moderID: context.player.id,
                proofImage: photos
            })
        }
        if(Data.owner)
        {
            await api.api.messages.send({
                user_id: Data.owner.id,
                random_id: Math.round(Math.random() * 100000),
                message: notification,
                attachment: proof
            })
        }
        if(Data.projectHead)
        {
            await api.api.messages.send({
                user_id: Data.projectHead.id,
                random_id: Math.round(Math.random() * 100000),
                message: notification,
                attachment: proof
            })
        }
        for(const id of Object.keys(Data.supports))
        {
            await api.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: `⚠ Игрок ${context.player.GetName()} отправил репорт сроком ${time} дней на игрока *id${user.dataValues.id}(${user.dataValues.nick}\n\nПричина: ${reason}\nОписание: ${explanation}`,
                attachment: proof
            })
        }
        for(const id of Object.keys(Data.administrators))
        {
            await api.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: `⚠ Игрок ${context.player.GetName()} отправил репорт сроком ${time} дней на игрока *id${user.dataValues.id}(${user.dataValues.nick}\n\nПричина: ${reason}\nОписание: ${explanation}`,
                attachment: proof
            })
        }
        for(const id of Object.keys(Data.moderators))
        {
            await api.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: `⚠ Игрок ${context.player.GetName()} отправил репорт сроком ${time} дней на игрока *id${user.dataValues.id}(${user.dataValues.nick}\n\nПричина: ${reason}\nОписание: ${explanation}`,
                attachment: proof
            })
        }
    }
}

module.exports = new CrossStates()