const {API, Upload} = require('vk-io')
const keyboard = require('../variables/Keyboards')
const Data = require("../models/CacheData")
const {PlayerStatus, Warning, Player, Country, PlayerInfo, PlayerResources, Ban, CountryUsingResources,
    CountryActive, Keys, Army, UnitType
} = require("../database/Models");
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
        let midday = new Date()
        let now = new Date()
        midnightTime.setDate(midnightTime.getDate() + 1)
        midnightTime.setHours(0)
        midnightTime.setMinutes(0)
        midnightTime.setSeconds(0)
        midday.setDate(midnightTime.getDate() + 1)
        midday.setHours(12)
        midday.setMinutes(0)
        midday.setSeconds(0)
        let toMidnight = midnightTime - now
        let toMidday = midday - now
        setTimeout(async () => {await this.StartMainLoop()}, toMidnight)
        setTimeout(async () => {await this.StartMiddayLoop()}, toMidday)
        setInterval(async () => {await this.FiveMinLoop()}, 300000)
    }

    async FiveMinLoop()
    {
        await Data.SaveActive()
        await this.SaveTimeouts()
    }

    async StartMainLoop()
    {
        await this.EveryDayLoop()
        setInterval(async () => {await this.EveryDayLoop()}, 86400000)
    }

    async StartMiddayLoop()
    {
        await this.EveryDayMiddayLoop()
        setInterval(async () => {await this.EveryDayMiddayLoop()}, 86400000)
    }

    EveryDayMiddayLoop = async () =>
    {
        try
        {
            if(this.day === 6)
            {
                let army = []
                let prices = []
                let fullPrice = {}
                let request = ""
                for(const country of Data.countries)
                {
                    if(country)
                    {
                        request = `🔔 Завтра, в воскресенье, в 00:00 будет снята оплата за содержание армии, на данный момент стоимость содержания:\n\n`
                        prices = []
                        fullPrice = {}
                        army = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                        if(army.length === 0) continue
                        for(const dec of army)
                        {
                            let type = await UnitType.findOne({where: {id: dec.dataValues.typeId}})
                            if(!type) continue
                            type = JSON.parse(type.dataValues.service)
                            prices.push(NameLibrary.PriceMultiply(type, dec.dataValues.count))
                        }
                        fullPrice = NameLibrary.PriceSum(prices)
                        request += NameLibrary.GetPrice(fullPrice) + "\n\n"
                        if(country.CanPay(fullPrice))
                        {
                            request += "✅ В бюджете хватает ресурсов для оплаты содержания, постарайтесь продержать бюджет в том же состоянии"
                        }
                        else
                        {
                            request += "⚠ В бюджете не хватает ресурсов для оплаты содержания, если во время сбора не будет хватать ресурсов, то ГМы распустят некоторые отряды"
                        }
                        country.leaderID && await this.SendMessage(country.leaderID, request)
                        let officials = Data.officials[country.id]
                        if(officials)
                        {
                            for(const official of Object.keys(officials))
                            {
                                if(officials[official].canUseArmy || officials[official].canUseResources)
                                {
                                    await this.SendMessage(country.leaderID, request)
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (e) {}
    }

    GiveCitizensPresent = async (countryId, present, active) =>
    {
        const citizens = await PlayerStatus.findAll({where: {citizenship: countryId}})
        if(citizens.length === 0) return
        for(let cit of citizens)
        {
            if(!Data.activity[cit.dataValues.id]) continue
            if(Data.activity[cit.dataValues.id] < 20) continue
            await Data.AddPlayerResources(cit.dataValues.id, {money: present})
            await this.SendMessage(cit.dataValues.id, "🎉 Спасибо за активное участие в жизни фракции!\n\nФракция, гражданином которой вы являетесь набрала за сегодня " + active + " сообщений актива не без вашей помощи, за это вот вам " + present + " монет")
        }
    }

    CalculatePresent = async (countryId, active) =>
    {
        if(active >= 3500)
        {
            await this.GiveCitizensPresent(countryId, 550, active)
            return
        }
        if(active >= 3000)
        {
            await this.GiveCitizensPresent(countryId, 450, active)
            return
        }
        if(active >= 2500)
        {
            await this.GiveCitizensPresent(countryId, 350, active)
            return
        }
        if(active >= 2000)
        {
            await this.GiveCitizensPresent(countryId, 275, active)
            return
        }
        if(active >= 1500)
        {
            await this.GiveCitizensPresent(countryId, 200, active)
            return
        }
        if(active >= 1000)
        {
            await this.GiveCitizensPresent(countryId, 150, active)
            return
        }
        if(active >= 500)
        {
            await this.GiveCitizensPresent(countryId, 50, active)
        }
    }

    EveryDayLoop = async () =>
    {
        try
        {
            const warns = await Warning.findAll({where: {banned: false}, attributes: ["id", "userID", "time", "createdAt"]})
            const time = new Date()
            let temp = null
            let warnTime = null
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday.setHours(12)
            yesterday.setMinutes(0)
            yesterday.setSeconds(0)
            yesterday.setMilliseconds(0)
            for(const warn of warns)
            {
                warnTime = new Date(warn.dataValues.createdAt)
                warnTime.setDate(warnTime.getDate() + warn.dataValues.time)
                if(warnTime - time < 0)
                {
                    await Warning.destroy({where: {id: warn.dataValues.id}})
                    await this.SendMessage(warn.dataValues.userID, `✅ Срок действия предупреждения от ${NameLibrary.ParseDateTime(warn.dataValues.createdAt)} истек, предупреждение обжаловано`)
                    temp = await Warning.count({where: {id: warn.dataValues.id}})
                    await Player.update({warningScore: temp, isBanned: false}, {where: {id: warn.dataValues.userID}})
                    temp = await Ban.count({where: {userID: warn.dataValues.userID}})
                    if(temp !== 0)
                    {
                        await Ban.destroy({where: {userID: warn.dataValues.userID}})
                    }
                }
            }

            let active = null
            let max = 0
            let activeNegative = null
            let min = Number.MAX_SAFE_INTEGER
            const activity = []
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(!Data.countries[i].hide)
                    {
                        await this.CalculatePresent(Data.countries[i].id, Data.countries[i].active)
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
                        if(Data.countries[i].active > 2000)
                        {
                            Data.countries[i].rating++
                            await Country.update({rating: Data.countries[i].rating}, {where: {id: Data.countries[i].id}})
                            await this.SendMessage(Data.countries[i].leaderID, `✅ Поздравляем! Ваша фракция ${Data.countries[i].GetName()} набрала более 2000 сообщений за день, рейтинг активности увеличен на 1 балл`)
                        }
                        if(Data.countries[i].tested && Data.countries[i].active < Data.variables["minTestActive"])
                        {
                            Data.countries[i].warnings ++
                            await Country.update({warnings: Data.countries[i].warnings}, {where: {id: Data.countries[i].id}})
                            await this.SendMessage(Data.countries[i].leaderID, `⚠ Внимание! Ваша фракция ${Data.countries[i].GetName()} набрала менее ${Data.variables["minTestActive"]} сообщений за день, так как она находится на тестовом периоде, она получает варн`)
                            Data.countries[i].active = 0
                            continue
                        }
                        if(Data.countries[i].active < Data.variables["minActive"])
                        {
                            Data.countriesWeekPassiveScore[Data.countries[i].id] += 1
                            await this.SendMessage(Data.countries[i].leaderID, `⚠ Ваша фракция ${Data.countries[i].GetName()} ${Data.countriesWeekPassiveScore[Data.countries[i].id]}-й раз набрала меньше ${Data.variables["minActive"]} сообщений актива`)
                            if(Data.countriesWeekPassiveScore[Data.countries[i].id] >= 3)
                            {
                                Data.countries[i].warnings ++
                                await Country.update({warnings: Data.countries[i].warnings}, {where: {id: Data.countries[i].id}})
                                await this.SendMessage(Data.countries[i].leaderID, `⚠ Внимание! Ваша фракция ${Data.countries[i].GetName()} получила варн`)
                                Data.countriesWeekPassiveScore[Data.countries[i].id] = 0
                            }
                        }
                    }
                    Data.countriesWeekActive[Data.countries[i].id] += Data.countries[i].active
                    activity.push({
                        id: i,
                        n: Data.countries[i].GetName(),
                        a: Data.countries[i].active
                    })
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
            await this.SendMessage(Data.countries[activeNegative].leaderID, `${min < 200 ? "⚠" : "ℹ"} Ваша фракция ${Data.countries[activeNegative].GetName()} набрала самый низкий актив за сегодня${min < 200 ? " и количество сообщений за день не достигло 200, рейтинг уменьшен на 1 балл" : ", но вы смогли преодолеть порог в 200 сообщений, поэтому баллы активности с вас не снимаются."}`)
            await CountryActive.create({
                json: JSON.stringify(activity),
                date: yesterday
            })

            temp = null
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
                await this.EveryWeakLoop()
                this.day = 0
            }

            const UsingRes = []
            for(const country of Object.keys(Data.countryResourcesStats))
            {
                temp = {}
                temp.id = country
                temp.name = Data.countries[country].GetName()
                temp.using = Data.countryResourcesStats[country]
                UsingRes.push(temp)
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
            await CountryUsingResources.create({
                json: JSON.stringify(UsingRes),
                date: yesterday
            })
            Data.active = 0
            await Data.SaveActive()
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async EveryWeakLoop()
    {
        let army = []
        let prices = []
        let fullPrice = {}
        let request = ""
        let GMRequest = "У фракций была взята плата за содержание армий, вот результат:\n\n"
        for(const country of Data.countries)
        {
            if(country)
            {
                Data.countriesWeekPassiveScore[country.id] = 0
                Data.countriesWeekActive[country.id] = 0
                request = `✅ Только что была снята оплата за содержание армии, стоимость содержания:\n\n`
                prices = []
                fullPrice = {}
                army = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(army.length === 0) continue
                for(const dec of army)
                {
                    let type = await UnitType.findOne({where: {id: dec.dataValues.typeId}})
                    if(!type) continue
                    type = JSON.parse(type.dataValues.service)
                    prices.push(NameLibrary.PriceMultiply(type, dec.dataValues.count))
                }
                fullPrice = NameLibrary.PriceSum(prices)
                request += NameLibrary.GetPrice(fullPrice) + "\n\n"
                if(country.CanPay(fullPrice))
                {

                    request += "✅ В бюджете хватило ресурсов для оплаты содержания, вся армия осталась в прежнем состоянии"
                    await Data.AddCountryResources(country.id, fullPrice)
                    GMRequest += country.GetName() + " - ✅ Полностью оплачено\n\n"
                }
                else
                {
                    request += "⚠ В бюджете не хватило ресурсов для оплаты содержания, ГМы распустят некоторые отряды"
                    GMRequest += country.GetName() + " - ⚠ Не хватило ресурсов\n"
                    GMRequest += country.GetResources() + "\n"
                    GMRequest += "Требовалось для оплаты содержания:\n" + NameLibrary.GetPrice(fullPrice) + "\nРесурсы не сняты, ожидается ручное распоряжение\n\n"
                }
                country.leaderID && await this.SendMessage(country.leaderID, request)
                let officials = Data.officials[country.id]
                if(officials)
                {
                    for(const official of Object.keys(officials))
                    {
                        if(officials[official].canUseArmy || officials[official].canUseResources)
                        {
                            await this.SendMessage(country.leaderID, request)
                        }
                    }
                }
            }
        }
        await this.GMMailing(GMRequest)
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
            let timeouts = await Data.LoadVariable("timeouts")
            if(!timeouts)
            {
                await Data.UpdateVariable("timeouts", [])
                timeouts = []
            }
            let player, playerInfo, playerRes, playerStats, time, future
            for(const key of timeouts)
            {
                if(key.type === "user_activity")
                {
                    if(key.subtype === "activity")
                    {
                        Data.activity = key.data
                    }
                    if(key.subtype === "audios")
                    {
                        Data.musicLovers = key.data
                    }
                    if(key.subtype === "stickers")
                    {
                        Data.stickermans = key.data
                    }
                    if(key.subtype === "swords")
                    {
                        Data.uncultured = key.data
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
                            houseLevel: key.houseLevel,
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
                    if(key.subtype === "get_citizenship")
                    {
                        time = getTime(key.time)
                        if(time.timeout < 0)
                        {
                            await this.SendMessage(key.userId, `ℹ Вы подали заявку на получение гражданства в фракции ${Data.countries[key.countryID].GetName()}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                            continue
                        }
                        Data.timeouts["get_citizenship_" + key.userId] = {
                            type: "user_timeout",
                            subtype: "get_citizenship",
                            userId: key.userId,
                            time: time,
                            countryID: key.countryID,
                            timeout: setTimeout(async () => {
                                await this.SendMessage(key.userId, `ℹ Вы подали заявку на получение гражданства в фракции ${Data.countries[key.countryID].GetName()}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                                delete Data.timeouts["get_citizenship_" + key.userId]
                            }, time.timeout)
                        }
                    }
                    if(key.subtype === "get_registration")
                    {
                        time = getTime(key.time)
                        if(time.timeout < 0)
                        {
                            await this.SendMessage(key.userId, `ℹ Вы подали заявку на получение регистрации в городе ${Data.cities[key.cityID].name}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                        }
                        Data.timeouts["get_registration_" + key.userId] = {
                            type: "user_timeout",
                            subtype: "get_registration",
                            userId: key.userId,
                            time: time,
                            cityID: key.cityID,
                            timeout: setTimeout(async () => {
                                await this.SendMessage(key.userId, `ℹ Вы подали заявку на получение регистрации в городе ${Data.cities[key.cityID].name}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                                delete Data.timeouts["get_registration_" + key.userId]
                            }, 86400000)
                        }
                    }
                    if(key.subtype === "resources_ready")
                    {
                        time = getTime(key.time)
                        if(time.timeout < 0)
                        {
                            await this.SendMessage(key.userId, `✅ Ваши постройки в городе ${Data.cities[key.cityID].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                            continue
                        }
                        future = new Date()
                        future.setMilliseconds(future.getMilliseconds() + time.timeout)
                        let isProperty = false
                        let keys = await Keys.findAll({where: {ownerID: key.userId}})
                        if(keys.length === 0) continue
                        for(let i = 0; i < Data.buildings[key.cityID]?.length; i++)
                        {
                            if(Data.buildings[key.cityID][i].ownerType === "country" && Data.buildings[key.cityID][i].type.match(/wheat|stone|wood|iron|silver/))
                            {
                                isProperty = false
                                for(const key of keys)
                                {
                                    if(key.dataValues.houseID === Data.buildings[key.cityID][i].id)
                                    {
                                        isProperty = true
                                        break
                                    }
                                }
                                if(!isProperty) continue
                                Data.buildings[key.cityID][i].lastActivityTime = future
                            }
                        }
                        Data.timeouts["user_timeout_resources_ready_" + key.userId] = {
                            type: "user_timeout",
                            subtype: "resources_ready",
                            userId: key.userId,
                            countryID: key.countryID,
                            time: key.date,
                            timeout: setTimeout(async () =>
                            {
                                await this.SendMessage(key.userId, `✅ Ваши постройки в городе ${Data.cities[key.cityID].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                                delete Data.timeouts["user_timeout_resources_ready_" + key.countryID]
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
                    if(key.subtype === "city_tax")
                    {
                        time = getTime(key.time)
                        if(time.timeout < 0) continue
                        future = new Date()
                        future.setMilliseconds(future.getMilliseconds() + time.timeout)
                        Data.timeouts["country_get_tax_" + key.countryID] = {
                            type: "country_timeout",
                            subtype: "city_tax",
                            countryID: key.countryID,
                            time: key.date,
                            timeout: setTimeout(async () =>
                            {
                                delete Data.timeouts["country_get_tax_" + key.countryID]
                            }, time.timeout)
                        }
                    }
                }
            }
            if(!Data.variables["isTest"])
            {
                for (const key of Object.keys(Data.supports))
                {
                    await this.SendMessage(Data.supports[key].id, "✅ Бот загружен, данные восстановлены")
                }
            }
            return resolve()
        })
    }

    async SaveTimeouts()
    {
        return new Promise(async (resolve) =>
        {
            let data = []
            data.push({
                type: "user_activity",
                subtype: "activity",
                data: Data.activity
            })
            data.push({
                type: "user_activity",
                subtype: "audios",
                data: Data.musicLovers
            })
            data.push({
                type: "user_activity",
                subtype: "stickers",
                data: Data.stickermans
            })
            data.push({
                type: "user_activity",
                subtype: "swords",
                data: Data.uncultured
            })
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
                            time: Data.timeouts[key].time,
                            houseLevel: Data.timeouts[key].houseLevel
                        })
                    }
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
                    if(Data.timeouts[key].subtype === "get_citizenship")
                    {
                        data.push({
                            type: "user_timeout",
                            subtype: "get_citizenship",
                            countryID: Data.timeouts[key].countryID,
                            userId: Data.timeouts[key].userId,
                            time: Data.timeouts[key].time
                        })
                    }
                    if(Data.timeouts[key].subtype === "get_registration")
                    {
                        data.push({
                            type: "user_timeout",
                            subtype: "get_registration",
                            cityID: Data.timeouts[key].cityID,
                            userId: Data.timeouts[key].userId,
                            time: Data.timeouts[key].time
                        })
                    }
                    if(Data.timeouts[key].subtype === "resources_ready")
                    {
                        data.push({
                            type: "user_timeout",
                            subtype: "get_registration",
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
                    if(Data.timeouts[key].subtype === "resources_ready")
                    {
                        data.push({
                            type: "country_timeout",
                            subtype: "city_tax",
                            countryID: key.countryID,
                            time: Data.timeouts[key].time
                        })
                    }
                }
            }
            await Data.UpdateVariable("timeouts", data)
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
                member_id: userID
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
                        member_id: userID
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

    async GetName(id, name_case)
    {
        try
        {
            if(id > 0)
            {
                const info = await this.api.users.get({
                    user_ids: id,
                    name_case: name_case ? name_case : "nom"
                })
                return `*id${id}(${info[0].first_name + " " + info[0].last_name})`
            }
            else
            {
                id = Math.abs(id)
                const info = await this.api.groups.getById({
                    group_id: id
                })
                return `*public${id}(${info[0].name})`
            }
        }
        catch (e)
        {
            return "Не удалось найти имя"
        }
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
        if(!id) return false
        try
        {
            await this.api.messages.send({
                peer_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
            return true
        }
        catch (e)
        {
            return false
        }
    }

    async SendSticker(peerId, stickerID)
    {
        if(!peerId) return false
        try
        {
            await this.api.messages.send({
                peer_id: peerId,
                random_id: Math.round(Math.random() * 100000),
                sticker_id: stickerID
            })
            return true
        }
        catch (e)
        {
            return false
        }
    }

    async SendMessageWithKeyboard(id, message, kb)
    {
        if(!id) return false
        try
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: keyboard.build(kb)
            })
            return true
        }
        catch (e)
        {
            return false
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
        catch (e) {}
    }

    async GlobalMailing(message, attachments)
    {
        return new Promise(async (resolve) => {
            let flag = true
            for(let i = 1; flag; i++)
            {
                try
                {
                    await this.api.messages.send({
                        peer_id: 2000000000 + i,
                        random_id: Math.round(Math.random() * 100000),
                        message: message,
                        attachment: attachments
                    })
                }
                catch (e)
                {
                    flag = e.code !== 917
                }
            }
            return resolve()
        })
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
        catch (e) {}
    }

    async GetTags(ids)
    {
        const users = await this.api.users.get({user_ids: ids.join(",")})
        let names = {}
        for(const i of users) names[i.id] = `@id${i.id}(${i.first_name} ${i.last_name})`
        return names
    }

    SendLogs = async (context, place, error) =>
    {
        try
        {
            if(error.message.match(/№901/)) return
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
        catch (e) {}
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)