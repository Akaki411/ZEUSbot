const Data = require("../models/CacheData")
const {Keys, Warning, Player, Ban, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models")
const api = require("../middleware/API")
const StopList = require("../files/StopList.json")
const NameLibrary = require("../variables/NameLibrary")
const keyboard = require("../variables/Keyboards");
const User = require("../models/User")

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

    async RefuseCitizenship(id)
    {
        return new Promise(async resolve => {
            const status = await PlayerStatus.findOne({where: {id: id}})
            if(!status) return resolve()
            if(!status.dataValues.citizenship) return resolve()
            const player = await Player.findOne({where: {id: id}})
            await api.SendMessage(Data.countries[status.dataValues.citizenship].leaderID, `ℹ Игрок @id${id}(${player.dataValues.id}) отказался от гражданства фракции ${Data.countries[status.dataValues.citizenship].GetName()}`)
            if(Data.users[id])
            {
                Data.users[id].citizenship = null
                Data.users[id].registration = null
                if (Data.users[id].status !== "worker") Data.users[id].status = "stateless"
            }
            if(player.dataValues.status !== "worker") await Player.update({status: "stateless"}, {where: {id: id}})
            status.set({citizenship: null, registration: null})
            await status.save()
            return resolve()
        })
    }

    async GetCitizenship(userId, countryId)
    {
        let player = null
        if(Data.users[userId])
        {
           player = Data.users[userId]
        }
        else
        {
            const playerDB = await Player.findOne({where: {id: userId}})
            if(!playerDB) return false
            const playerStatus = await PlayerStatus.findOne({where: {id: userId}})
            const playerInfo = await PlayerInfo.findOne({where: {id: userId}})
            const playerResources = await PlayerResources.findOne({where: {id: userId}})
            Data.users[userId] = new User(playerDB, playerStatus, playerInfo, playerResources)
            player = Data.users[userId]
        }
        await api.api.messages.send({
            user_id: Data.countries[countryId].leaderID,
            random_id: Math.round(Math.random() * 100000),
            message: `🪪 Игрок ${player.GetName()} подал на гражданство в вашу фракцию: \n\n${player.GetInfo()}`,
            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: userId, parameter: countryId}), keyboard.declineCallbackButton({command: "decline_citizenship", item: userId, parameter: countryId})]]).inline().oneTime()
        })
        let officials = Data.officials[countryId]
        if(officials)
        {
            for(const official of Object.keys(officials))
            {
                if(officials[official].canBeDelegate)
                {
                    await api.api.messages.send({
                        user_id: official,
                        random_id: Math.round(Math.random() * 100000),
                        message: `🪪 Игрок ${player.GetName()} подал на гражданство в вашу фракцию: \n\n${player.GetInfo()}`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: userId, parameter: countryId}), keyboard.declineCallbackButton({command: "decline_citizenship", item: player.id, parameter: countryId})]]).inline().oneTime()
                    })
                }
            }
        }
        const time = new Date()
        time.setHours(time.getHours() + 24)
        Data.timeouts["get_citizenship_" + userId] = {
            type: "user_timeout",
            subtype: "get_citizenship",
            userId: userId,
            time: time,
            countryID: countryId,
            timeout: setTimeout(async () => {
                await api.SendMessage(userId,`ℹ Вы подали заявку на получение гражданства в фракции ${Data.countries[countryId].GetName(player.platform === "IOS")}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                delete Data.timeouts["get_citizenship_" + userId]
            }, 86400000)
        }
        return true
    }

    async AddUser(userId, newbieId, peerId)
    {
        try
        {
            const newbie = await Player.findOne({where: {id: newbieId}})
            if(!newbie) return
            if(!newbie.dataValues.isBanned) return
            const banInfo = await Ban.findOne({where: {userID: newbieId}})
            const user = await Player.findOne({where: {id: userId}})
            if(!user) return
            if(NameLibrary.RoleEstimator(user.dataValues.role) === 0)
            {
                await api.SendMessage(peerId, `🚫 Игрок забанен по причине: ${banInfo?.dataValues.reason}`)
                await api.KickUser(peerId, newbieId)
                await this.NewWarning(userId, 30, "Нарушение исполнения наказания", "Приглашение в чат игрока находящегося в бане", Data.variables["addBanUserToChatWarning"], process.env.GROUPID)
            }
            else
            {
                if(banInfo)
                {
                    await Ban.destroy({where: {id: banInfo.dataValues.id}})
                    await Warning.destroy({where: {userID: newbie.dataValues.id}})
                    await Player.update({isBanned: false}, {where: {id: newbie.dataValues.id}})
                    if(Data.users[newbie.dataValues.id]) delete Data.users[newbie.dataValues.id]
                    await api.SendMessage(peerId, `✅ Игрок находится в бане, но так как его добавил администратор - бан снимается`)
                    const admins = await Player.findAll({where: {role: ["moder", "admin", "Madmin", "support", "project_head", "owner"]}})
                    for(const i of admins)
                    {
                        try
                        {
                            await api.api.messages.send({
                                user_id: i.dataValues.id,
                                random_id: Math.round(Math.random() * 100000),
                                message: `⚠ Админ *id${user.dataValues.id}(${user.dataValues.nick}) обжаловал бан игрока *id${newbie.dataValues.id}(${newbie.dataValues.nick})`
                            })
                        } catch (e) {}
                    }
                }
                else
                {
                    await Player.update({isBanned: false}, {where: {id: newbie.dataValues.id}})
                    if(Data.users[newbie.dataValues.id]) delete Data.users[newbie.dataValues.id]
                }
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }
}

module.exports = new CrossStates()