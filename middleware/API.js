const {API, Upload} = require('vk-io')
const keyboard = require('../variables/Keyboards')
const Data = require("../models/CacheData")
const {PlayerStatus, Warning, Player, Country, PlayerInfo, PlayerResources} = require("../database/Models");
const NameLibrary = require("../variables/NameLibrary")
const fs = require("fs");
const User = require("../models/User")

class VK_API
{
    constructor(token)
    {
        this.api = new API({token: token})
        this.upload = new Upload({api: this.api})
        this.day = 0
        this.StartLoop()
        let time = new Date()
        this.day = time.getDay()
        this.day = this.day === 0 ? 7 : this.day
        Data.onLoad = async (scenes) => {
            await this.LoadTimeouts(scenes)
        }
    }

    StartLoop()
    {
        let midnightTime = new Date()
        let now = new Date()
        midnightTime.setDate(midnightTime.getDate() + 1)
        midnightTime.setHours(0)
        midnightTime.setMinutes(0)
        midnightTime.setSeconds(0)
        let toMidnight = midnightTime - now
        setTimeout(async () => {await this.StartMainLoop()}, toMidnight)
        setInterval(async () => {await Data.SaveActive()}, 300000)
    }

    async StartMainLoop()
    {
        await this.EveryDayLoop()
        setInterval(async () => {await this.EveryDayLoop()}, 86400000)
    }

    EveryDayLoop = async () =>
    {
        try
        {
            const warns = await Warning.findAll({where: {banned: false}, attributes: ["id", "userID", "time", "createdAt"]})
            const time = new Date()
            let warnTime = null
            for(const warn of warns)
            {
                warnTime = new Date(warn.dataValues.createdAt)
                warnTime.setDate(warnTime.getDate() + warn.dataValues.time)
                if(warnTime - time < 0)
                {
                    await Warning.destroy({where: {id: warn.dataValues.id}})
                    await this.SendMessage(warn.dataValues.userID, `✅ Срок действия предупреждения от ${NameLibrary.ParseDateTime(warn.dataValues.createdAt)} истек, предупреждение обжаловано`)
                    await Player.update({warningScore: await Warning.count({where: {userID: warn.dataValues.userID}})}, {where: {id: warn.dataValues.userID}})
                }
            }

            let active = null
            let max = 0
            let activeNegative = null
            let min = Number.MAX_SAFE_INTEGER
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    Data.countriesWeekActive[Data.countries[i].id] += Data.countries[i].active
                    if(Data.countries[i].active >= max)
                    {
                        max = Data.countries[i].active
                        active = i
                    }
                    if(Data.countries[i].active <= min)
                    {
                        min = Data.countries[i].active
                        activeNegative = i
                    }
                    if(Data.countries[i].active <= 500)
                    {
                        Data.countriesWeekPassiveScore[Data.countries[i].id] += 1
                        await this.SendMessage(Data.countries[i].leaderID, `⚠ Ваша фракция ${Data.countries[i].GetName()} ${Data.countriesWeekPassiveScore[Data.countries[i].id]}-й раз набрала меньше 500 сообщений актива`)
                        if(Data.countriesWeekPassiveScore[Data.countries[i].id] >= 3)
                        {
                            Data.countries[i].warnings ++
                            await Country.update({warnings: Data.countries[i].warnings}, {where: {id: Data.countries[i].id}})
                            await this.SendMessage(Data.countries[i].leaderID, `⚠ Внимание! Ваша фракция ${Data.countries[i].GetName()} получила варн`)
                            Data.countriesWeekPassiveScore[Data.countries[i].id] = 0
                        }
                    }
                    Data.countries[i].active = 0
                }
            }
            Data.countries[active].rating++
            if(min < 200)
            {
                Data.countries[activeNegative].rating--
                await Country.update({rating: Data.countries[activeNegative].rating}, {where: {id: Data.countries[activeNegative].id}})
            }
            await Country.update({rating: Data.countries[active].rating}, {where: {id: Data.countries[active].id}})
            await Data.AddCountryResources(Data.countries[active].id, {money: 100})
            await this.SendMessage(Data.countries[active].leaderID, `✅ Ваша фракция ${Data.countries[active].GetName()} набрала наибольший актив за сегодня, рейтинг увеличен на 1 балл, в бюджет передан сладкий подарок в размере 100 монет`)
            await this.SendMessage(Data.countries[activeNegative].leaderID, `⚠ Ваша фракция ${Data.countries[activeNegative].GetName()} набрала самый низкий актив за сегодня${min < 200 ? " и количество сообщений за день не достигло 200, рейтинг уменьшен на 1 балл" : ", но вы смогли преодолеть порог в 200 сообщений, поэтому баллы активности с вас не снимаются."}`)

            let temp = null
            max = 0
            active = null
            for(const key of Object.keys(Data.activity))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({msgs: temp.dataValues.msgs + Data.activity[key]})
                await temp.save()
                if(Data.activity[key] > max)
                {
                    max = Data.activity[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "🎉 Вы набрали больше всех сообщений за сегодня, печенька 🍪 в виде 70 монет прилагается")
                await Data.AddPlayerResources(active, {money: 70})
            }
            Data.activity = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.musicLovers))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({audios: temp.dataValues.audios + Data.musicLovers[key]})
                await temp.save()
                if(Data.musicLovers[key] > max)
                {
                    max = Data.musicLovers[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "🎶 За сегодня вы главный меломан, держи 🍬 конфетку (30 монет)")
                await Data.AddPlayerResources(active, {money: 30})
            }
            Data.musicLovers = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.stickermans))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({stickers: temp.dataValues.stickers + Data.stickermans[key]})
                await temp.save()
                if(Data.stickermans[key] > max)
                {
                    max = Data.stickermans[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "💩 Любишь стикеры? Держи 🍰 тортик (30 монет)")
                await Data.AddPlayerResources(active, {money: 30})
            }
            Data.stickermans = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.uncultured))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({swords: temp.dataValues.swords + Data.uncultured[key]})
                await temp.save()
                if(Data.uncultured[key] > max)
                {
                    max = Data.uncultured[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "😈 Вы сегодня больше всех матерились, вот 🥛 молоко за вредность (50 монет)")
                await Data.AddPlayerResources(active, {money: 50})
            }
            Data.uncultured = {}

            this.day ++
            if(this.day > 7)
            {
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        Data.countriesWeekPassiveScore[Data.countries[i].id] = 0
                        Data.countriesWeekActive[Data.countries[i].id] = 0
                    }
                }
                this.day = 0
            }

            let request = "📈Статистика расходов фракций за день (<ресурс>: <заработано> - <потрачено> = <разница>)\n\n"
            let resources = ["money", "stone", "wood", "wheat", "iron", "silver", "diamond"]
            for(const country of Object.keys(Data.countryResourcesStats))
            {
                request += `${Data.countries[country].GetName()}:\n`
                for(const res of resources)
                {
                    request += `${NameLibrary.GetResourceName(res)}: ${Data.countryResourcesStats[country]["in"][res]} - ${Data.countryResourcesStats[country]["out"][res]} = ${Data.countryResourcesStats[country]["in"][res] - Data.countryResourcesStats[country]["out"][res]}\n`
                }
                request += "\n"
                Data.countryResourcesStats[country] = {
                    in: {
                        money: 0,
                        stone: 0,
                        wood: 0,
                        wheat: 0,
                        iron: 0,
                        silver: 0,
                        diamond: 0
                    },
                    out: {
                        money: 0,
                        stone: 0,
                        wood: 0,
                        wheat: 0,
                        iron: 0,
                        silver: 0,
                        diamond: 0
                    }
                }
            }
            await this.GMMailing(request)
            await Data.SaveActive()
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async LoadTimeouts(scenes)
    {
        return new Promise(async (resolve) =>
        {
            const now = new Date()
            const getTime = (time) => {
                let date = new Date(time)
                return {
                    date: date,
                    timeout: date - now
                }
            }
            fs.access("./files/cache.json", async (error) => {
                if(error)
                {
                    for (const key of Object.keys(Data.supports))
                    {
                        await this.SendMessage(Data.supports[key].id, "⚠ Бот был перезагружен, но после загрузки не был найден файл с кэшем, возможно перезапуск был связан с критической ошибкой.")
                    }
                    return resolve()
                }
                else
                {
                    const active = require("../files/cache.json")
                    let player, playerInfo, playerRes, playerStats, time, future
                    for(const key of active)
                    {
                        if(key.type === "user_activity")
                        {
                            if(key.subtype === "activity")
                            {
                                Data.activity[key.userId] = key.score
                            }
                            if(key.subtype === "activity")
                            {
                                Data.activity[key.userId] = key.score
                            }
                            if(key.subtype === "activity")
                            {
                                Data.activity[key.userId] = key.score
                            }
                            if(key.subtype === "activity")
                            {
                                Data.activity[key.userId] = key.score
                            }
                        }
                        if(key.type === "user_timeout")
                        {
                            if(!Data.users[key.userId])
                            {
                                player = await Player.findOne({where: {id: key.userId}})
                                if(!player) continue
                                playerInfo = await PlayerInfo.findOne({where: {id: key.userId}})
                                playerRes = await PlayerResources.findOne({where: {id: key.userId}})
                                playerStats = await PlayerStatus.findOne({where: {id: key.userId}})
                                Data.users[parseInt(key.userId)] = new User(player, playerStats, playerInfo, playerRes)
                                Data.users[parseInt(key.userId)].state = scenes.StartScreen
                            }
                            if(key.subtype === "sleep")
                            {
                                time = getTime(key.time)
                                if(time.timeout < 0)
                                {
                                    await this.SendMessage(key.userId, "☕ Ваши силы восстановлены")
                                    continue
                                }
                                Data.users[key.userId].fatigue = 100 - Math.round(time.timeout / 216000)
                                Data.users[key.userId].isRelaxing = true
                                Data.timeouts["user_timeout_sleep_" + key.userId] = {
                                    type: "user_timeout",
                                    subtype: "sleep",
                                    userId: key.userId,
                                    time: time.date,
                                    timeout: setTimeout(async () => {
                                        await this.SendMessage(key.userId, "☕ Ваши силы восстановлены")
                                        Data.users[key.userId].fatigue = 100
                                        Data.users[key.userId].isRelaxing = false
                                        delete Data.timeouts["user_timeout_sleep_" + key.userId]
                                    }, time.timeout)
                                }
                            }
                            if(key.subtype === "walk")
                            {
                                time = getTime(key.time)
                                if(time.timeout < 0)
                                {
                                    await this.SendMessage(key.userId, "🏙 Вы пришли в город " + Data.cities[key.cityID].name + "\n" + Data.cities[key.cityID].description)
                                    continue
                                }
                                Data.users[key.userId].state = scenes.Walking
                                Data.timeouts["user_timeout_walk_" + key.userId] = {
                                    type: "user_timeout",
                                    subtype: "walk",
                                    userId: key.userId,
                                    cityID: key.cityID,
                                    time: time.date,
                                    timeout: setTimeout(async () => {
                                        await this.SendMessage(key.userId, "🏙 Вы пришли в город " + Data.cities[key.cityID].name + "\n" + Data.cities[key.cityID].description)
                                        Data.users[key.userId].location = key.cityID
                                        await PlayerStatus.update(
                                            {location: key.cityID},
                                            {where: {id: key.userId}}
                                        )
                                        if(Data.cities[key.cityID].notifications)
                                        {
                                            await this.SendMessage(Data.cities[key.cityID].leaderID, `ℹ Игрок ${Data.users[key.userId].GetName()} зашел в город ${Data.cities[key.cityID].name}`)
                                        }
                                        let stayTime = new Date()
                                        stayTime.setMinutes(stayTime.getMinutes() + 30)
                                        Data.users[key.userId].stayInCityTime = stayTime
                                        Data.users[key.userId].state = scenes.StartScreen
                                        delete Data.timeouts["user_timeout_walk_" + key.userId]
                                    }, time.timeout)
                                }
                            }
                        }
                        if(key.type === "city_timeout")
                        {
                            if(!Data.cities[key.cityID])
                            {
                                continue
                            }
                            if(key.subtype === "resources_ready")
                            {
                                time = getTime(key.time)
                                if(time.timeout < 0)
                                {
                                    await this.SendMessage(key.userId, `✅ Постройки города ${Data.cities[key.cityID].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                                    continue
                                }
                                future = new Date()
                                future.setMilliseconds(future.getMilliseconds() + time.timeout)
                                for(let k = 0; k < Data.cities.length; k++)
                                {
                                    for(let i = 0; i < Data.buildings[Data.cities[k]?.id]?.length; i++)
                                    {
                                        if(Data.buildings[Data.cities[k].id][i].ownerType === "city" && Data.buildings[Data.cities[k].id][i].type.match(/wheat|stone|wood|iron|silver/))
                                        {
                                            Data.buildings[Data.cities[k].id][i].lastActivityTime = future
                                        }
                                    }
                                }
                                Data.timeouts["city_timeout_resources_ready_" + key.cityID] = {
                                    type: "city_timeout",
                                    subtype: "resources_ready",
                                    userId: key.userId,
                                    cityID: key.cityID,
                                    time: key.date,
                                    timeout: setTimeout(async () =>
                                    {
                                        await this.SendMessage(key.userId, `✅ Постройки города ${Data.cities[key.cityID].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                                        delete Data.timeouts["city_timeout_resources_ready_" + key.cityID]
                                    }, time.timeout)
                                }
                            }
                        }
                        if(key.type === "country_timeout")
                        {
                            if(!Data.countries[key.countryID])
                            {
                                continue
                            }
                            if(key.subtype === "resources_ready")
                            {
                                time = getTime(key.time)
                                if(time.timeout < 0)
                                {
                                    await this.SendMessage(key.userId, `✅ Постройки фракции ${Data.countries[key.countryID].GetName(false)} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                                    continue
                                }
                                future = new Date()
                                future.setMilliseconds(future.getMilliseconds() + time.timeout)
                                for(let k = 0; k < Data.cities.length; k++)
                                {
                                    if(Data.cities[k]?.countryID === key.countryID)
                                    {
                                        for(let i = 0; i < Data.buildings[Data.cities[k]?.id]?.length; i++)
                                        {
                                            if(Data.buildings[Data.cities[k].id][i].ownerType === "country" && Data.buildings[Data.cities[k].id][i].type.match(/wheat|stone|wood|iron|silver/))
                                            {
                                                Data.buildings[Data.cities[k].id][i].lastActivityTime = future
                                            }
                                        }
                                    }
                                }
                                Data.timeouts["country_timeout_resources_ready_" + key.countryID] = {
                                    type: "country_timeout",
                                    subtype: "resources_ready",
                                    userId: key.userId,
                                    countryID: key.countryID,
                                    time: key.date,
                                    timeout: setTimeout(async () =>
                                    {
                                        await this.SendMessage(key.userId, `✅ Постройки фракции ${Data.countries[key.countryID].GetName(false)} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                                        delete Data.timeouts["country_timeout_resources_ready_" + key.countryID]
                                    }, time.timeout)
                                }
                            }
                        }
                    }
                    fs.unlink("./files/cache.json", (err) => {
                        if (err) throw err
                    })
                    for (const key of Object.keys(Data.supports))
                    {
                        await this.SendMessage(Data.supports[key].id, "✅ Бот загружен, данные игроков восстановлены")
                    }
                }
                return resolve()
            })
        })
    }

    async SaveTimeouts()
    {
        return new Promise(async (resolve) =>
        {
            let data = []
            for(const user of Object.keys(Data.activity))
            {
                data.push({
                    type: "user_activity",
                    subtype: "activity",
                    userId: user,
                    score: Data.activity[user]
                })
            }
            for(const user of Object.keys(Data.musicLovers))
            {
                data.push({
                    type: "user_activity",
                    subtype: "audios",
                    userId: user,
                    score: Data.musicLovers[user]
                })
            }
            for(const user of Object.keys(Data.stickermans))
            {
                data.push({
                    type: "user_activity",
                    subtype: "stickers",
                    userId: user,
                    score: Data.stickermans[user]
                })
            }
            for(const user of Object.keys(Data.uncultured))
            {
                data.push({
                    type: "user_activity",
                    subtype: "swords",
                    userId: user,
                    score: Data.uncultured[user]
                })
            }
            for(const key of Object.keys(Data.timeouts))
            {
                if(Data.timeouts[key].type === "user_timeout")
                {
                    if(Data.timeouts[key].subtype === "sleep")
                    {
                        data.push({
                            type: "user_timeout",
                            subtype: "sleep",
                            userId: Data.timeouts[key].userId,
                            time: Data.timeouts[key].time
                        })
                    }
                }
                if(Data.timeouts[key].type === "user_timeout")
                {
                    if(Data.timeouts[key].subtype === "walk")
                    {
                        data.push({
                            type: "user_timeout",
                            subtype: "walk",
                            cityID: Data.timeouts[key].cityID,
                            userId: Data.timeouts[key].userId,
                            time: Data.timeouts[key].time
                        })
                    }
                }
                if(Data.timeouts[key].type === "city_timeout")
                {
                    if(Data.timeouts[key].subtype === "resources_ready")
                    {
                        data.push({
                            type: "city_timeout",
                            subtype: "resources_ready",
                            userId: Data.timeouts[key].userId,
                            cityID: Data.timeouts[key].cityID,
                            time: Data.timeouts[key].time
                        })
                    }
                }
                if(Data.timeouts[key].type === "country_timeout")
                {
                    if(Data.timeouts[key].subtype === "resources_ready")
                    {
                        data.push({
                            type: "country_timeout",
                            subtype: "resources_ready",
                            userId: Data.timeouts[key].userId,
                            countryID: key.countryID,
                            time: Data.timeouts[key].time
                        })
                    }
                }
            }
            const serialize = JSON.stringify(data, null, "\t")
            fs.writeFile("./files/cache.json", serialize, (e) => {
                if(e) console.log(e)
            })
            for (const key of Object.keys(Data.supports))
            {
                await this.SendMessage(Data.supports[key].id, "✅ Данные сохранены, бот готов к перезагрузке")
            }
            return resolve()
        })
    }

    async KickUser(chatID, userID)
    {
        if(!chatID || !userID) return
        try
        {
            await this.api.messages.removeChatUser({
                chat_id: chatID - 2000000000,
                user_id: userID
            })
            return null
        }
        catch (e)
        {
            return e.message
        }
    }

    async BanUser(userID)
    {
        if(!userID) return
        try
        {
            let max = 0
            for(const chat of Object.keys(Data.countryChats))
            {
                if(parseInt(chat) > max)
                {
                    max = parseInt(chat)
                }
            }
            for(let i = 1; i <= (max - 2000000000); i++)
            {
                try
                {
                    await this.api.messages.removeChatUser({
                        chat_id: i,
                        user_id: userID
                    })
                } catch (e) {}
            }
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async GetUserData(id)
    {
        const info = await this.api.users.get({
            user_ids: id,
            fields: "sex"
            })
        return info[0]
    }

    async SendNotification(id, message)
    {
        try
        {
            if(!id) return
            const user = await PlayerStatus.findOne({where: {id: id}})
            if(!user) return
            if(!user.dataValues.notifications) return
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async SendMessage(id, message)
    {
        if(!id) return
        try
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async SendMessageWithKeyboard(id, message, kb)
    {
        if(!id) return
        try
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: keyboard.build(kb)
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }


    async GMMailing(message, kb)
    {
        try
        {
            for(const GM of Object.keys(Data.gameMasters))
            {
                await this.api.messages.send({
                    user_id: GM,
                    random_id: Math.round(Math.random() * 100000),
                    message: message,
                    keyboard: kb ? keyboard.build(kb).inline().oneTime() : keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async SendAccessKey(reason)
    {
        if(!Data.owner) return
        try
        {
            console.log("\n\n" + Data.accessKey + "\n\n")
            if(Data.owner)
            {
                await this.api.messages.send({
                    user_id: Data.owner.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
                })
            }
            if(Data.projectHead)
            {
                await this.api.messages.send({
                    user_id: Data.projectHead.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
                })
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }

    SendLogs = async (context, place, error) =>
    {
        try
        {
            await this.SendMessage(context.player.id, "⚠ Ошибка")
            console.log(error)
            const filename = `error_${NameLibrary.GetDate() + "_" + NameLibrary.GetTime()}.log`
            await new Promise(res => {
                fs.appendFile("./logs/" + filename, error.stack,  (err) => {
                    if (err) throw err
                    return res()
                })
            })
            await this.upload.messageDocument({
                peer_id: context.player.id,
                source: {
                    value: "./logs/" + filename
                },
                title: filename
            }).then(async (log) => {

                for (const key of Object.keys(Data.supports))
                {
                    await this.api.messages.send({
                        user_id: Data.supports[key].id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠Произошла ошибка⚠\nИгрок: *id${context.player.id}(${context.player.nick})\nМесто: ${place}\nКод ошибки: ${error.message}`,
                        attachment: log
                    })
                }
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)