const NameLibrary = require("../variables/NameLibrary")
const Commands = require("../variables/Commands")
const keyboard = require("../variables/Keyboards")
const api = require("../middleware/API")
const SceneController = require("../controllers/SceneController")
const Data = require("../models/CacheData")
const {Player, PlayerStatus, PlayerInfo, Country, CountryRoads, CityRoads, PlayerResources, Warning, OfficialInfo} = require("../database/Models")
const Samples = require("../variables/Samples")
const sequelize = require("../database/DataBase")
const OutputManager = require("../controllers/OutputManager")

class ChatController
{
    async CommandHandler(context)
    {
        try
        {
            // Обработка кнопок
            if(context.messagePayload)
            {
                await this.ChatButtonHandler(context)
                return
            }
            // Игроки+
            context.command?.match(/^бот$/) && await this.BotCall(context)
            context.command?.match(Commands.botCall) && await context.send(NameLibrary.GetRandomSample("dungeon_master_request"))
            context.command?.match(Commands.clearKeyboard) && await context.send("Убираю", {keyboard: keyboard.none})
            context.command?.match(Commands.badJoke) && await context.send(NameLibrary.GetRandomSample("bad_jokes"))
            context.command?.match(Commands.location) && await this.LocationRequest(context)
            context.command?.match(Commands.aboutMe) && await context.send(context.player.GetInfo())
            context.command?.match(Commands.checkLocation) && await this.CheckLocation(context)
            context.command?.match(Commands.checkDocs) && await this.CheckDocs(context)
            context.command?.match(Commands.send) && await this.SendResource(context)
            context.command?.match(Commands.relax) && await this.Relax(context)
            context.command?.match(Commands.wakeup) && await this.Wakeup(context)
            context.command?.match(/^мир$/) && await context.send("🌍 Таков наш мир, но что смотреть ты хочешь?", {attachment: Data.variables.globalMap, keyboard: keyboard.build([[keyboard.greyButton({name: "🗺 Карта дорог", type: "show_road_map"})]]).inline()})
            context.command?.match(Commands.map) && await this.RoadMap(context)
            context.command?.match(Commands.work) && await this.Work(context)
            context.command?.match(Commands.countries) && await this.ShowCountriesInfo(context)
            context.command?.match(Commands.countriesActive) && await this.ShowCountriesActive(context)
            context.command?.match(Commands.marry) && await this.OfferMarry(context)
            context.command?.match(Commands.divorce) && await this.Divorce(context)
            context.command?.match(Commands.stats) && await this.ShowPlayerActive(context)
            context.command?.match(Commands.getCitizenship) && await this.GetCitizenship(context)
            context.command?.match(Commands.toStall) && await this.ToStall(context)
            context.command?.match(Commands.changeNick) && await this.ChangeNick(context)
            context.command?.match(Commands.changeDescription) && await this.ChangeDescription(context)
            context.command?.match(Commands.top) && await this.SendTopsMessage(context)
            context.command?.match(Commands.extract) && await this.Extract(context)
            context.command?.match(Commands.getImarat) && await this.GetImarat(context)
            context.command?.match(Commands.refuseCitizenship) && await this.RefuseCitizenship(context)
            context.command?.match(Commands.unregistered) && await this.GetUnregList(context)
            context.command?.match(Commands.botMem) && await this.BotMem(context)
            context.command?.match(Commands.botForgot) && await this.BotForgot(context)
            context.command?.match(Commands.getFromBudget) && await this.GetResFromBudget(context)
            context.command?.match(Commands.budget) && await this.GetBudget(context)
            context.command?.match(Commands.resources) && await this.GetResources(context)

            //Модератор+
            context.command?.match(/^id$|^ид$/) && await this.GetID(context)
            context.command?.match(Commands.warning) && await this.SendWarningForm(context)
            context.command?.match(Commands.dub) && await this.StartRepeat(context)
            context.command?.match(Commands.stopDub) && await this.StopRepeat(context)
            context.command?.match(Commands.warnings) && await this.SendWarnList(context)
            context.command?.match(Commands.delete) && await this.DeleteMessage(context)
            context.command?.match(Commands.mute) && await this.Mute(context)
            context.command?.match(Commands.unmute) && await this.Unmute(context)
            context.command?.match(Commands.sword) && await this.Censorship(context)
            context.command?.match(/^\?$/) && await this.IsRegistered(context)

            //ГМ-ы+
            context.command?.match(Commands.teleport) && await this.Teleport(context)
            context.command?.match(Commands.cheating) && await this.CheatResource(context)
            context.command?.match(Commands.pickUp) && await this.PickUpResource(context)
            context.command?.match(Commands.whereYou) && await this.LocatePlayer(context)

            //Админы+
            context.command?.match(Commands.ban) && await this.SendBanForm(context)
            context.command?.match(/^кик$/) && await this.KickUser(context)
            context.command?.match(Commands.ignore) && await this.Ignore(context)
            context.command?.match(Commands.trolling) && await this.AddTrollSample(context)
            context.command?.match(Commands.stopTrolling) && await this.StopTrolling(context)

            //Тех-поддержка+
            context.command?.match(/^перезагрузить|^релоад|^релод|^reload/) && await this.Reload(context)
            context.command?.match(/^добавить чат /) && await this.AddCountryChat(context)
            context.command?.match(/^удалить чат/) && await this.RemoveCountryChat(context)
            context.command?.match(/^чаты /) && await this.ShowCountryChats(context)
            context.command?.match(/^закреп/) && await this.GiveAttachment(context)
            context.command?.match(/^установить переменную |^изменить переменную /) && await this.SetVar(context)
            context.command?.match(/^переменные/) && await this.ShowVars(context)
            context.command?.match(/^ресет|^reset/) && await this.Reset(context)
            context.command?.match(/^восстановить правителей/) && await this.ResetLeaders(context)
            context.command?.match(/^user/) && await this.GetUserObject(context)
            context.command?.match(/^чат инфо/) && await this.GetChatInfo(context)
            context.command?.match(Commands.getChatLink) && await this.GetChatLink(context)

            if(Data.samples[context.player.id])
            {
                let sample = Data.samples[context.player.id][Math.round(Math.random() * (Data.samples[context.player.id].length - 1))]
                await context.send(sample.sample, {attachment: sample.attachment})
            }
            try{if(Data.repeat[context.player.id]) await context.send(context.text, {attachment: context.attachments?.length > 0 ? context.attachments.map((key) => {return key.toString()}).join(",") : null})} catch (e) {}
            if(context.attachments[0]?.type === "audio") await this.MusicAnalysis(context)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CommandHandler", e)
        }
    }

    async ChatButtonHandler(context)
    {
        try
        {
            context.messagePayload.type === "extract" && await this.ExtractResource(context, context.messagePayload.action)
            context.messagePayload.type === "show_road_map" && await this.RoadMap(context)
            context.messagePayload.type === "to_other_city" && await this.ToOtherCity(context, Data.ParseButtonID(context.messagePayload.action))
            context.messagePayload.type === "to_other_country" && await this.ToOtherCountry(context, Data.ParseButtonID(context.messagePayload.action))
            context.messagePayload.type === "ratings" && await this.SendRating(context)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ChatButtonHandler", e)
        }
    }

    async IsRegistered(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                return
            }
            let player = await Player.count({where: {id: context.replyPlayers[0]}})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
            }
            else
            {
                await context.send("✅ Игрок зарегистрирован")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetChatInfo", e)
        }
    }

    async GetChatInfo(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let temp = null
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID)
                    {
                        temp = Data.countries[i].chatID.split("|")
                        for(const chat of temp)
                        {
                            if(parseInt(chat) === context.peerId)
                            {
                                await context.send(`✅ Этот чат используется фракцией ${Data.countries[i].GetName(context.player.platform === "IOS")}`)
                                return
                            }
                        }
                    }
                }
            }
            await context.send(`⚠ Этот чат никому не принадлежит`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetChatInfo", e)
        }
    }

    async GetChatLink(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            try
            {
                const link = await api.api.messages.getInviteLink({
                    peer_id: context.peerId
                })
                if(link?.link)
                {
                    await context.send("✅ Держи: " + link.link)
                }
                else
                {
                    await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")
                }
            }
            catch (e)
            {
                await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/MusicAnalysis", e)
        }
    }

    async GetUserObject(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let user
            if(context.replyPlayers?.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            if(!Data.users[user])
            {
                await context.send("⚠ Игрок отсутствует в кэше")
                return
            }
            await context.send(JSON.stringify(Data.users[user], null, "\t"))
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/MusicAnalysis", e)
        }
    }

    async GetBudget(context)
    {
        try
        {
            let city = false
            let source = Data.countries[context.player.countryID]
            if(context.command.match(/город/))
            {
                source = Data.cities[context.player.location]
                city = true
            }
            let isLeader = Data.countries[context.player.countryID].leaderID === context.player.id
            let isOfficial = context.official?.countryID === context.player.countryID && context.official?.canUseResources
            let isGM = NameLibrary.RoleEstimator(context.player.role) >= 2
            let mayor = city && context.player.id === Data.cities[context.player.location].leaderID
            if(!isLeader && !isOfficial && !isGM && !mayor)
            {
                return
            }
            const msg = await context.send(source.GetResources())
            setTimeout(async () => {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: msg.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: msg.peerId
                    })
                }
                catch (e) {}
            }, 30000)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/MusicAnalysis", e)
        }
    }

    async GetResFromBudget(context)
    {
        try
        {
            let city = false
            let resource = null
            let sends = context.command.split(",")
            let objOUT = {}
            let objIN = {}
            let count
            let request = ""
            let source = Data.countries[context.player.countryID]
            if(context.command.match(/город/) && Data.cities[context.player.location].leaderID === context.player.id)
            {
                source = Data.cities[context.player.location]
                city = true
            }
            if(Data.countries[context.player.countryID].leaderID !== context.player.id && !(context.official?.countryID === context.player.countryID && context.official?.canUseResources) && NameLibrary.RoleEstimator(context.player.role) < 2 && !city)
            {
                return
            }
            if(source.CantTransact())
            {
                await context.send("Вы не можете делать переводы, причина:\n\n" + source.WhyCantTransact())
                return
            }
            if(!city && Data.countries[context.player.countryID].capitalID !== context.player.location)
            {
                await context.send("⚠ Брать ресурсы из бюджета фракции можно только из столицы")
                return
            }
            for(let send of sends)
            {
                resource = null
                if(send.match(Commands.money))
                {
                    resource = "money"
                }
                if(send.match(Commands.wheat))
                {
                    resource = "wheat"
                }
                if(send.match(Commands.stone))
                {
                    resource = "stone"
                }
                if(send.match(Commands.wood))
                {
                    resource = "wood"
                }
                if(send.match(Commands.iron))
                {
                    resource = "iron"
                }
                if(send.match(Commands.copper))
                {
                    resource = "copper"
                }
                if(send.match(Commands.silver))
                {
                    resource = "silver"
                }
                if(send.match(Commands.diamond))
                {
                    resource = "diamond"
                }
                if(!resource)
                {
                    continue
                }
                count = send.match(/\d+/)
                count = parseInt( count ? count[0] : send)
                if(isNaN(count))
                {
                    count = 1
                }
                if(send.match(/все|всё|всю|всех|весь/))
                {
                    count = source[resource]
                }
                if(source[resource] < count)
                {
                    request += `${NameLibrary.GetResourceName(resource)} - ⚠ Не хватает\n`
                    continue
                }
                objIN[resource] = objIN[resource] ? objIN[resource] - Math.abs(count) : -Math.abs(count)
                objOUT[resource] = objOUT[resource] ? objOUT[resource] + Math.abs(count) : Math.abs(count)
            }
            for(const res of Object.keys(objOUT))
            {
                if(Math.abs(objOUT[res]) !== 0)
                {
                    request += `${NameLibrary.GetResourceName(res)} - ✅ Переведено ${Math.abs(objOUT[res])}\n`
                }
            }
            if(Object.keys(objOUT).length !== 0)
            {
                if(city)
                {
                    await Data.AddCityResources(context.player.countryID, objIN)
                    await Data.AddPlayerResources(context.player.id, objOUT)
                    await api.SendNotification(Data.countries[context.player.countryID].leaderID, `✅ Из бюджета фракции ${source.GetName()} игроком ${context.player.GetName()} взято:\n${NameLibrary.GetPrice(objIN)}`)
                }
                else
                {
                    await Data.AddCountryResources(context.player.location, objIN)
                    await Data.AddPlayerResources(context.player.id, objOUT)
                    await api.SendNotification(Data.cities[context.player.location].leaderID, `✅ Из бюджета города ${source.name} игроком ${context.player.GetName()} взято:\n${NameLibrary.GetPrice(objIN)}`)
                }
            }
            if(request.length !== 0) await context.send(request)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/MusicAnalysis", e)
        }
    }

    async MusicAnalysis(context)
    {
        try
        {
            let name = context.attachments[0].title + " " + context.attachments[0].artist
            name = name.toLowerCase()
            if(name.match(Commands.badMusic))
            {
                await context.send(NameLibrary.GetRandomSample("bad_audio_reaction"))
            }
            else if(name.match(Commands.goodMusic))
            {
                await context.send(NameLibrary.GetRandomSample("good_audio_reaction"))
            }
            else if(name.match(/ария/) && NameLibrary.GetChance(80))
            {
                await context.send("Опять кавер на Iron Maiden")
            }
            else
            {
                await context.send(NameLibrary.GetRandomSample("audio_reaction"))
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/MusicAnalysis", e)
        }
    }

    async LocatePlayer(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 2)
            {
                return
            }
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            const user = await Player.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            const userStatus = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}, attributes: ["location", "countryID"]})
            await context.send(`📍 Игрок находится в городе ${Data.cities[userStatus.dataValues.location].name}, фракция ${Data.countries[userStatus.dataValues.countryID].GetName(context.player.platform === "IOS")}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async BotForgot(context)
    {
        try
        {
            if(Data.requests[context.player.id])
            {
                delete Data.requests[context.player.id]
                await context.send("✅ Ладно, забыл.")
            }
            else
            {
                await context.send("⚠ Что ты хочешь чтобы я забыл?")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async BotMem(context)
    {
        try
        {
            if(context.command.match(Commands.censorship))
            {
                await context.send("⚠ Я не буду материться")
                return
            }
            let phrase = context.text.replace(Commands.botMem, "")
            if(context.replyPlayers?.length !== 0)
            {
                if(NameLibrary.RoleEstimator(context.player.role) > 3)
                {
                    phrase = phrase.replace(/\[.*?] /, "")
                    phrase = phrase.replace(/ \[.*?]/, "")
                    Data.requests[context.replyPlayers[0]] = {
                        sample: phrase ? phrase : ".",
                        attachment: context.attachments?.length > 0 ? context.attachments.map((key) => {return key.toString()}).join(",") : null
                    }
                    await context.send("✅ Ок, запомнил.")
                    return
                }
            }
            Data.requests[context.player.id] = {
                sample: phrase ? phrase : ".",
                attachment: context.attachments?.length > 0 ? context.attachments.map((key) => {return key.toString()}).join(",") : null
            }
            await context.send("✅ Ок, запомнил.")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async BotCall(context)
    {
        try
        {
            if(Data.requests[context.player.id])
            {
                await context.send(Data.requests[context.player.id].sample, {attachment: Data.requests[context.player.id].attachment})
            }
            else
            {
                await context.send(NameLibrary.GetRandomSample("call_request"))
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async StopTrolling(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(!Data.samples[context.replyPlayers[0]])
            {
                await context.send("⚠ Я не троллю этого игрока")
                return
            }
            let samples = Data.samples[context.replyPlayers[0]].filter(key => {return key.admin !== context.player.id})
            if(samples.length === 0)
            {
                delete Data.samples[context.replyPlayers[0]]
                await context.send("✅ Теперь я не троллю этого игрока")
            }
            else
            {
                Data.samples[context.replyPlayers[0]] = samples
                await context.send("✅ Я убрал фразы наложенные вами, но остались фразы от других админов")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async AddTrollSample(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
            if(player)
            {
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(player.dataValues.role))
                {
                    await context.send("⚠ Вы не можете троллить старшего или равного по званию")
                    return
                }
            }
            if(context.command.match(Commands.censorship))
            {
                await context.send("⚠ Я не буду материться")
                return
            }
            let phrase = context.text
            phrase = phrase.replace(/\[.*?] /g, "")
            phrase = phrase.replace(/ \[.*?]/g, "")
            phrase = phrase.replace(Commands.trolling, "")
            if(!Data.samples[context.replyPlayers[0]]) Data.samples[context.replyPlayers[0]] = []
            Data.samples[context.replyPlayers[0]].push({
                admin: context.player.id,
                sample: phrase ? phrase : ".",
                attachment: context.attachments?.length > 0 ? context.attachments.map((key) => {return key.toString()}).join(",") : null
            })
            await context.send("✅ Семпл добавлен.")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async ResetLeaders(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            try
            {
                let leaders = await Country.findAll({attributes: ["leaderID"]})
                await Player.update({status: "leader"}, {where: {id: leaders.map(key => {return key.dataValues.leaderID})}})
                for(const user of leaders)
                {
                    if(Data.users[user.dataValues.leaderID])
                    {
                        Data.users[user.dataValues.leaderID].status = "leader"
                    }
                }
                await context.send("Правители - ✅ Восстановлены")
            }
            catch (e)
            {
                await context.send("Правители - ⚠ Ошибка: " + e.message)
            }
            try
            {
                let officials = await OfficialInfo.findAll({attributes: ["id"]})
                await Player.update({status: "official"}, {where: {id: officials.map(key => {return key.dataValues.id})}})
                for(const user of officials)
                {
                    if(Data.users[user.dataValues.id])
                    {
                        Data.users[user.dataValues.id].status = "official"
                    }
                }
                await context.send("Чиновники - ✅ Восстановлены")
            }
            catch (e)
            {
                await context.send("Чиновники - ⚠ Ошибка: " + e.message)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ResetLeaders", e)
        }
    }

    async Censorship(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
            if(player)
            {
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(player.dataValues.role))
                {
                    await context.send("⚠ Вы не можете наложить цензуру на старшего или равного по званию")
                    return
                }
            }
            let time = context.command.match(/\d+/)
            time = parseInt( time ? time[0] : 10)
            time = Math.min(time, 1440)
            if(Data.censorship[context.replyPlayers[0]])
            {
                let admin = await Player.findOne({where: {id: Data.censorship[context.replyPlayers[0]].moder}, attributes: ["role"]})
                if(!(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.censorship[context.replyPlayers[0]].moder === context.player.id))
                {
                    await context.send("⚠ Снять цензуру может только тот, кто её наложил или админ рангом выше")
                    return
                }
                clearTimeout(Data.censorship[context.replyPlayers[0]].timeout)
                delete Data.censorship[context.replyPlayers[0]]
                await context.send(`✅ Фильтр мата выключен`)
            }
            else
            {
                Data.censorship[context.replyPlayers[0]] = {
                    moder: context.player.id,
                    timeout: setTimeout(async () => {
                        delete Data.censorship[context.replyPlayers[0]]
                    }, time * 60000)
                }
                await context.send(`✅ Фильтр мата включен на ${time} минут`)
            }

        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
        }
    }

    async Ignore(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
            if(player)
            {
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(player.dataValues.role))
                {
                    await context.send("⚠ Вы не можете наложить игнор на старшего или равного по званию")
                    return
                }
            }
            let time = context.command.match(/\d+/)
            time = parseInt( time ? time[0] : 10)
            time = Math.min(time, 1440)
            if(context.command.match(/актив/))
            {
                if(Data.activeIgnore[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.activeIgnore[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.activeIgnore[context.replyPlayers[0]].moder === context.player.id)
                    {
                        clearTimeout(Data.activeIgnore[context.replyPlayers[0]].timeout)
                        delete Data.activeIgnore[context.replyPlayers[0]]
                        await context.send(`✅ Теперь бот будет считать актив игрока`)
                    }
                    else
                    {
                        await context.send("⚠ Снять игнор может только тот, кто его наложил или админ рангом выше")
                    }
                }
                else
                {
                    Data.activeIgnore[context.replyPlayers[0]] = {
                        moder: context.player.id,
                        timeout: setTimeout(async () => {
                            delete Data.activeIgnore[context.replyPlayers[0]]
                        }, time * 60000)
                    }
                    await context.send(`✅ Теперь бот не будет считать актив игрока ${time} минут`)
                }
            }
            else
            {
                if(Data.ignore[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.ignore[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.ignore[context.replyPlayers[0]].moder === context.player.id)
                    {
                        clearTimeout(Data.ignore[context.replyPlayers[0]].timeout)
                        delete Data.ignore[context.replyPlayers[0]]
                        await context.send(`✅ Теперь бот будет реагировать на команды игрока`)
                    }
                    else
                    {
                        await context.send("⚠ Снять игнор может только тот, кто его наложил или админ рангом выше")
                    }
                }
                else
                {
                    Data.ignore[context.replyPlayers[0]] = {
                        moder: context.player.id,
                        timeout: setTimeout(async () => {
                            delete Data.ignore[context.replyPlayers[0]]
                        }, time * 60000)
                    }
                    await context.send(`✅ Теперь бот не будет реагировать на команды игрока ${time} минут`)
                }
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
        }
    }

    async Unmute(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(context.command.match(/гс|аудио|голосовые/))
            {
                if(Data.voiceMute[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.voiceMute[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.voiceMute[context.replyPlayers[0]].moder === context.player.id)
                    {
                        clearTimeout(Data.voiceMute[context.replyPlayers[0]].timeout)
                        delete Data.voiceMute[context.replyPlayers[0]]
                        await context.send(`✅ Теперь игрок может оставлять голосовые сообщения`)
                    }
                    else
                    {
                        await context.send("⚠ Снять мут может только тот, кто его наложил или админ рангом выше")
                    }
                }
            }
            else
            {
                if(Data.mute[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.mute[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.mute[context.replyPlayers[0]].moder === context.player.id)
                    {
                        clearTimeout(Data.mute[context.replyPlayers[0]].timeout)
                        delete Data.mute[context.replyPlayers[0]]
                        await context.send(`✅ Игрок теперь может разговаривать`)
                        await api.SendMessage(context.replyPlayers[0], `✅ С вас был снят мут`)
                    }
                    else
                    {
                        await context.send("⚠ Снять мут может только тот, кто его наложил или админ рангом выше")
                    }
                }
                else
                {
                    await context.send("⚠ Игрок не в муте")
                }
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
        }
    }

    async Mute(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
            if(player)
            {
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(player.dataValues.role))
                {
                    await context.send("⚠ Вы не можете замутить старшего или равного по званию")
                    return
                }
            }
            let time = context.command.match(/\d+/)
            time = parseInt( time ? time[0] : 10)
            time = Math.min(time, 1440)
            if(context.command.match(/гс|аудио|голосовые/))
            {
                if(Data.voiceMute[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.voiceMute[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(!(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.voiceMute[context.replyPlayers[0]].moder === context.player.id))
                    {
                        await context.send("⚠ Снять мут может только тот, кто его наложил или админ рангом выше")
                        return
                    }
                    clearTimeout(Data.voiceMute[context.replyPlayers[0]].timeout)
                    delete Data.voiceMute[context.replyPlayers[0]]
                    await context.send(`✅ Теперь игрок может оставлять голосовые сообщения`)
                }
                else
                {
                    Data.voiceMute[context.replyPlayers[0]] = {
                        moder: context.player.id,
                        timeout: setTimeout(async () => {
                            delete Data.voiceMute[context.replyPlayers[0]]
                        }, time * 60000)
                    }
                    await context.send(`✅ Голосовые сообщения игрока отключены на  ${time} минут`)
                }
            }
            else
            {
                if(Data.mute[context.replyPlayers[0]])
                {
                    clearTimeout(Data.mute[context.replyPlayers[0]].timeout)
                    delete Data.mute[context.replyPlayers[0]]
                }
                Data.mute[context.replyPlayers[0]] = {
                    moder: context.player.id,
                    timeout: setTimeout(async () => {
                        await context.send(`✅ *id${context.replyPlayers[0]}(Игрок) теперь может разговаривать`)
                        await api.SendMessage(context.replyPlayers[0], `✅ Время действия мута вышло`)
                        delete Data.mute[context.replyPlayers[0]]
                    }, time * 60000)
                }
                await context.send(`✅ Игрок ближайшие ${time} минут не будет разговаривать`)
                await api.SendMessage(context.replyPlayers[0], `⚠ На вас был наложен мут, время действия ${time} минут`)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
        }
    }

    async DeleteMessage(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                return
            }
            const messages = []
            if(context.replyMessage) messages.push(context.replyMessage?.conversationMessageId)
            if(context.forwards.length > 0)
            {
                for(const msg of context.forwards)
                {
                    messages.push(msg?.conversationMessageId)
                }
            }
            try
            {
                await api.api.messages.delete({
                    conversation_message_ids: messages.filter(key => {return key}).join(","),
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
            }
            catch (e)
            {
                await context.send("😢 У меня не получилось: " + e.message)
            }
            try
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
            } catch (e) {}
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
        }
    }

    async GetUnregList(context)
    {
        try
        {
            const users = await api.api.messages.getConversationMembers({
                peer_id: context.peerId
            })
            let temp, request = "😡 В боте не зарегистрированы:\n\n", count = 0
            for(const user of users.profiles)
            {
                if(user.type) continue
                temp = await Player.count({where: {id: user.id}})
                if(temp !== 0) continue
                request += `@id${user.id}(${user.first_name + " " + user.last_name})\n`
                count ++
            }
            if(count === 0)
            {
                await context.send("😺 Все участники этого чата зарегистрированы в боте!")
            }
            else
            {
                request += "\n⚠ Зарегистрируйтесь, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`"
                await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetUnregList", e)
        }
    }

    async RefuseCitizenship(context)
    {
        try
        {
            if(!context.player.citizenship)
            {
                await context.send("⚠ У вас нет гражданства")
                return
            }
            const country = Data.countries[context.player.citizenship]
            await PlayerStatus.update({citizenship: null, registration: null}, {where: {id: context.player.id}})
            country.population = await PlayerStatus.count({where: {citizenship: country.id}})
            await Country.update({population: country.population}, {where: {id: country.id}})
            if(!context.player.status.match(/worker/))
            {
                Data.users[context.player.id].status = "stateless"
                await Player.update({status: "stateless"}, {where: {id: context.player.id}})
            }
            context.player.citizenship = null
            context.player.registration = null
            await api.SendMessage(country.leaderID, `ℹ Игрок ${context.player.GetName()} отказался от гражданства фракции ${country.GetName()}`)
            await context.send("ℹ Теперь вы апатрид.")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Extract", e)
        }
    }

    async GetImarat(context)
    {
        try
        {
            if(context.player.nationality.match(/славян|донбас/i))
            {
                if(context.command.match(/ислам/) && !context.player.nationality.match(/имарат/i))
                {
                    context.player.nationality = "☝ Имарат Донбасс"
                    await PlayerInfo.update({nationality: "☝ Имарат Донбасс"}, {where: {id: context.player.id}})
                    await context.send(`☝ Ты принял${context.player.gender ? "" : "а"} ислам во имя Имарата Донбасса, мы гордимся тобой ${context.player.gender ? "брат" : "сестра"}.`)
                }
                else if(context.command.match(/отца|христиан|право/) && !context.player.nationality.match(/священ/i))
                {
                    context.player.nationality = "☦ Священный Донбасс"
                    await PlayerInfo.update({nationality: "☦ Священный Донбасс"}, {where: {id: context.player.id}})
                    await context.send(`☦ Теперь ты христиан${context.player.gender ? "ин" : "ка"}, гордись этим, Имарат Донбасс рад принять тебя в свои ряды!`)
                }
            }
            else
            {
                await context.send(`⚠ Ты не достоин!`)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetIslam", e)
        }
    }

    async Extract(context)
    {
        try
        {
            let resource = null
            if(context.command.match(Commands.money))
            {
                resource = "money"
            }
            if(context.command.match(Commands.wheat))
            {
                resource = "wheat"
            }
            if(context.command.match(Commands.stone))
            {
                resource = "stone"
            }
            if(context.command.match(Commands.wood))
            {
                resource = "wood"
            }
            if(context.command.match(Commands.iron))
            {
                resource = "iron"
            }
            if(context.command.match(Commands.copper))
            {
                resource = "copper"
            }
            if(context.command.match(Commands.silver))
            {
                resource = "silver"
            }
            if(!resource)
            {
                return
            }
            await this.ExtractResource(context, resource)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Extract", e)
        }
    }

    async SendWarnList(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                return
            }
            let user
            if(context.replyPlayers.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            const count = await Warning.count({where: {userID: user}})
            if(count === 0)
            {
                await context.send("✅ У этого игрока нет предупреждений")
            }
            else
            {
                await OutputManager.GetUserWarnings(context.player.id, user)
                await context.send("ℹ Смотрите предупреждения в ЛС")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendRating", e)
        }
    }

    async SendRating(context)
    {
        try
        {
            let request = ""
            if(context.messagePayload.action === "most_rich")
            {
                request += "💰 Самые богатые люди Античности\n\n"
                const theRich = await sequelize.query("SELECT \"id\", \"money\" FROM \"player-resources\" ORDER BY money DESC LIMIT 10")
                const players = await Player.findAll({
                    where: {id: theRich[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                let riches = {}
                for(const player of players)
                {
                    riches[player.dataValues.id] = {nick: player.dataValues.nick}
                }
                for(let i = 0; i < theRich[0].length; i++)
                {
                    request += `🟠 ${i+1}: *id${theRich[0][i].id}(${riches[theRich[0][i].id].nick}) - ${theRich[0][i].money} 🪙\n\n`
                }
            }
            if(context.messagePayload.action === "most_active")
            {
                request += "☢️ Самые активные люди Античности!\n\n"
                const mostActive = await sequelize.query("SELECT \"id\", \"msgs\" FROM \"player-infos\" ORDER BY msgs DESC LIMIT 25")
                const players = await Player.findAll({
                    where: {id: mostActive[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                let temp
                let users = {}
                for(const player of mostActive[0])
                {
                    users[player.id] = {active: player.msgs}
                }
                let active = []
                for(const player of players)
                {
                    active.push({
                        id: player.dataValues.id,
                        nick: player.dataValues.nick,
                        active: users[player.dataValues.id].active + (Data.activity[player.dataValues.id] ? Data.activity[player.dataValues.id] : 0)
                    })
                }
                for (let j = active.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (active[i].active < active[i + 1].active)
                        {
                            temp = active[i];
                            active[i] = active[i + 1];
                            active[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < active.length; i++)
                {
                    request += `${i+1}. *id${active[i].id}(${active[i].nick}) - ${active[i].active}\n`
                }
                request += "\n"

                let array = []
                Object.keys(Data.activity).forEach(key => {
                    array.push([Data.activity[key], key])
                })

                if(array.length === 0)
                {
                    request += "😴 За сегодня никто ничего не успел написать в чат"
                    await context.send(request)
                    return
                }
                for (let j = array.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (array[i][0] > array[i + 1][0])
                        {
                            let temp = array[i];
                            array[i] = array[i + 1];
                            array[i + 1] = temp;
                        }
                    }
                }
                request += "☢️ Самые активные за сегодня:\n\n"
                array = array.reverse()
                for(let i = 0; i < Math.min(10, array.length); i++)
                {
                    request += `${i+1}. ${await NameLibrary.GetPlayerNick(array[i][1])} - ${array[i][0]}\n`
                }
            }
            if(context.messagePayload.action === "uncultured")
            {
                request += "😡 Самые токсичные люди Античности! Осуждаем!\n\n"
                const uncultured = await sequelize.query("SELECT \"id\", \"swords\" FROM \"player-infos\" ORDER BY swords DESC LIMIT 10")
                const players = await Player.findAll({
                    where: {id: uncultured[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                let temp
                let users = {}
                for(const player of uncultured[0])
                {
                    users[player.id] = {active: player.swords}
                }
                let active = []
                for(const player of players)
                {
                    active.push({
                        id: player.dataValues.id,
                        nick: player.dataValues.nick,
                        active: users[player.dataValues.id].active + (Data.uncultured[player.dataValues.id] ? Data.uncultured[player.dataValues.id] : 0)
                    })
                }
                for (let j = active.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (active[i].active < active[i + 1].active)
                        {
                            temp = active[i];
                            active[i] = active[i + 1];
                            active[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < active.length; i++)
                {
                    request += `♦️ ${i+1} *id${active[i].id}(${active[i].nick}) - ${active[i].active}\n`
                }
                request += "\n"
                let array = []
                Object.keys(Data.uncultured).forEach(key => {
                    array.push([Data.uncultured[key], key])
                })
                if(array.length === 0)
                {
                    request += "😸 У нас сегодня никто не матерился!"
                    await context.send(request)
                    return
                }
                for (let j = array.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (array[i][0] > array[i + 1][0])
                        {
                            let temp = array[i];
                            array[i] = array[i + 1];
                            array[i + 1] = temp;
                        }
                    }
                }
                request += "🤬 Сегодня больше всех матерились:\n\n"
                array = array.reverse()
                for(let i = 0; i < Math.min(10, array.length); i++)
                {
                    request += `${i+1}. ${await NameLibrary.GetPlayerNick(array[i][1])} - ${array[i][0]}\n`
                }
            }
            if(context.messagePayload.action === "stickermans")
            {
                request += "😾 Кто они? Богачи или просто выпендрежники... Это те, кто использует стикеры больше всего.\n\n"
                const stickers = await sequelize.query("SELECT \"id\", \"stickers\" FROM \"player-infos\" ORDER BY stickers DESC LIMIT 15")
                const players = await Player.findAll({
                    where: {id: stickers[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                let temp
                let users = {}
                for(const player of stickers[0])
                {
                    users[player.id] = {active: player.stickers}
                }
                let active = []
                for(const player of players)
                {
                    active.push({
                        id: player.dataValues.id,
                        nick: player.dataValues.nick,
                        active: users[player.dataValues.id].active + (Data.uncultured[player.dataValues.id] ? Data.uncultured[player.dataValues.id] : 0)
                    })
                }
                for (let j = active.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (active[i].active < active[i + 1].active)
                        {
                            temp = active[i];
                            active[i] = active[i + 1];
                            active[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < active.length; i++)
                {
                    request += `😼 ${i+1}. *id${active[i].id}(${active[i].nick}) - ${active[i].active}\n`
                }
                request += "\n"
                let array = []
                Object.keys(Data.stickermans).forEach(key => {
                    array.push([Data.stickermans[key], key])
                })
                if(array.length === 0)
                {
                    request += "👽 Сегодня у нас никто не отправлял стикеры"
                    await context.send(request)
                    return
                }
                for (let j = array.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (array[i][0] > array[i + 1][0])
                        {
                            let temp = array[i];
                            array[i] = array[i + 1];
                            array[i + 1] = temp;
                        }
                    }
                }
                request += "😼 Отправили больше всех стикеров на сегодня:\n\n"
                array = array.reverse()
                for(let i = 0; i < Math.min(10, array.length); i++)
                {
                    request += `${i+1}. ${await NameLibrary.GetPlayerNick(array[i][1])} - ${array[i][0]}\n`
                }
            }
            if(context.messagePayload.action === "music_lovers")
            {
                request += "🎶 Вот они - любители послушать и поделиться своей музыкой.\n\n"
                const audios = await sequelize.query("SELECT \"id\", \"audios\" FROM \"player-infos\" ORDER BY audios DESC LIMIT 10")
                const players = await Player.findAll({
                    where: {id: audios[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                let temp
                let users = {}
                for(const player of audios[0])
                {
                    users[player.id] = {active: player.audios}
                }
                let active = []
                for(const player of players)
                {
                    active.push({
                        id: player.dataValues.id,
                        nick: player.dataValues.nick,
                        active: users[player.dataValues.id].active + (Data.uncultured[player.dataValues.id] ? Data.uncultured[player.dataValues.id] : 0)
                    })
                }
                for (let j = active.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (active[i].active < active[i + 1].active)
                        {
                            temp = active[i];
                            active[i] = active[i + 1];
                            active[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < active.length; i++)
                {
                    request += `🎶 ${i+1} *id${active[i].id}(${active[i].nick}) - ${active[i].active}\n`
                }
                request += "\n"
                let array = []
                Object.keys(Data.musicLovers).forEach(key => {
                    array.push([Data.musicLovers[key], key])
                })
                if(array.length === 0)
                {
                    request += "🔇 Сегодня никто не делился музыкой"
                    await context.send(request)
                    return
                }
                for (let j = array.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (array[i][0] > array[i + 1][0])
                        {
                            let temp = array[i];
                            array[i] = array[i + 1];
                            array[i + 1] = temp;
                        }
                    }
                }
                request += "🎵 Больше всех сегодня делились музыкой:\n\n"
                array = array.reverse()
                for(let i = 0; i < Math.min(10, array.length); i++)
                {
                    request += `${i+1}. ${await NameLibrary.GetPlayerNick(array[i][1])} - ${array[i][0]}\n`
                }
            }
            await context.send(request, {disable_mentions: true})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendTopsMessage", e)
        }
    }

    async SendTopsMessage(context)
    {
        try
        {
            await context.send("🌟 Лучшие люди Античности по критериям ниже!\n\n" +
                "💰 Количество монет в кошельке.\n" +
                "😡 Некультурные люди. Осуждаем!\n" +
                "💬 Самые активные люди в проекте.\n" +
                "😼 Богатые перцы со стикерами.\n" +
                "🎶 Любители поделиться музыкой.", {
                keyboard: keyboard.build([
                    [keyboard.greyButton({name: "💰 Богачи", type: "ratings", action: "most_rich"})],
                    [keyboard.greenButton({name: "☢️ Самые активные", type: "ratings", action: "most_active"}), keyboard.greenButton({name: "😡 Некультурные", type: "ratings", action: "uncultured"})],
                    [keyboard.greenButton({name: "😼 Стикеры", type: "ratings", action: "stickermans"}), keyboard.greenButton({name: "🎶 Меломаны", type: "ratings", action: "music_lovers"})]
                ]).inline()
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendRating", e)
        }
    }

    async StartRepeat(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            let user
            if(context.replyPlayers.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            if(Data.repeat[user])
            {
                await context.send("⚠ Дублирование уже включено")
                return
            }
            if(Data.mute[user])
            {
                let admin = await Player.findOne({where: {id: Data.mute[user].moder}, attributes: ["role"]})
                if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.mute[user].moder === context.player.id)
                {
                    clearTimeout(Data.mute[context.replyPlayers[0]].timeout)
                    delete Data.mute[context.replyPlayers[0]]
                }
                else
                {
                    await context.send("⚠ Снять мут может только тот, кто его наложил или админ рангом выше")
                    return
                }
            }
            Data.repeat[user] = context.player.id
            await context.send("✅ Дублирование включено")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/StartRepeat", e)
        }
    }

    async StopRepeat(context)
    {
        try
        {
            let user
            if(context.replyPlayers.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            if(!Data.repeat[user])
            {
                await context.send("⚠ Дублирование не включено")
                return
            }
            if(context.player.id !== user && Data.repeat[user] !== context.player.id)
            {
                await context.send("⚠ Дублирование может снять только сам дублируемый или тот кто его наложил")
                return
            }
            delete Data.repeat[user]
            await context.send("✅ Дублирование выключено")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/StopRepeat", e)
        }
    }

    async ChangeNick(context)
    {
        try
        {
            let nick = context.text.replace(Commands.changeNick, "")
            let user = await Player.count({where: {nick: nick}})
            if(user !== 0)
            {
                await context.send("⚠ Ник занят")
                return
            }
            context.player.nick = nick
            await Player.update({nick: nick}, {where: {id: context.player.id}})
            await context.send("✅ Ник изменен")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ChangeNick", e)
        }
    }

    async ChangeDescription(context)
    {
        try
        {
            let description = context.text.replace(Commands.changeDescription, "")
            context.player.description = description
            await PlayerInfo.update({description: description}, {where: {id: context.player.id}})
            await context.send("✅ Описание изменено")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ChangeDescription", e)
        }
    }

    async GetID(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                return
            }
            if(context.replyPlayers?.length === 0)
            {
                return
            }
            await context.send(context.replyPlayers.join("\n"))
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetID", e)
        }
    }

    async Teleport(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 2)
            {
                return
            }
            let user, temp, country
            if(context.replyPlayers?.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            let status = await PlayerStatus.findOne({where: {id: user}})
            if(!status)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${user}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(context.command.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                await context.send("⚠ Фракция не найдена")
                return
            }
            if(Data.users[user])
            {
                Data.users[user].countryID = country.id
                Data.users[user].location = country.capitalID
            }
            status.set({
                countryID: country.id,
                location: country.capitalID
            })
            await status.save()
            await context.send(`✅ *id${user}(Игрок) телепортирован в фракцию ${country.GetName(context.player.platform === "IOS")}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Teleport", e)
        }
    }

    async ToStall(context)
    {
        try
        {
            let user
            if(context.replyPlayers?.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            if(!user) return
            if(user < 0) user = context.player.id
            let person = await api.GetUserData(user)
            await context.send(`💊 *id${user}(${person.first_name + " " + person.last_name}) ${Samples.stall_add_request(parseInt(person.sex) === 2)}`, {disable_mentions: true})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ToStall", e)
        }
    }

    async GetResources(context)
    {
        try
        {
            if(context.replyPlayers?.length !== 0 && NameLibrary.RoleEstimator(context.player.role) >= 1)
            {
                let resources = await PlayerResources.findOne({where: {id: context.replyPlayers[0]}})
                if(!resources)
                {
                    await context.send("⚠ Игрок не зарегистрирован")
                    await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                    return
                }
                const msg = await context.send(`*id${context.replyPlayers[0]}(Инвентарь):\n\n💰 Монеты - ${resources.dataValues.money}\n🪨 Камень - ${resources.dataValues.stone}\n🌾 Зерно - ${resources.dataValues.wheat}\n🪵 Дерево - ${resources.dataValues.wood}\n🌑 Железо - ${resources.dataValues.iron}\n🥉 Бронза - ${resources.dataValues.copper}\n🥈 Серебро - ${resources.dataValues.silver}\n💎 Алмазы - ${resources.dataValues.diamond}`)
                setTimeout(async () => {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    }
                    catch (e) {}
                }, 60000)
                return
            }
            const msg = await context.send(context.player.GetResources())
            setTimeout(async () => {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: msg.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: msg.peerId
                    })
                }
                catch (e) {}
            }, 60000)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetResources", e)
        }
    }

    async GetCitizenship(context)
    {
        try
        {
            let temp = null
            let country = null
            if(context.command.match(/я лев ислама и русского халифата/))
            {
                context.command = "имарат донбасс"
            }
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(context.command.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                await context.send("⚠ Фракция не найдена")
                return
            }
            if(context.player.status.match(/official|leader/))
            {
                await context.send("⚠ Правители и чиновники не могут менять гражданство")
                return
            }
            if(context.player.status.match(/candidate/))
            {
                await context.send("⚠ Вы уже подали на гражданство")
                return
            }
            if(country.id === context.player.citizenship)
            {
                await context.send("⚠ Вы уже являетесь гражданином этой фракции.")
                return
            }
            await api.api.messages.send({
                user_id: country.leaderID,
                random_id: Math.round(Math.random() * 100000),
                message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country.id}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country.id})]]).inline().oneTime()
            })
            let officials = Data.officials[country.id]
            if(officials)
            {
                for(const official of Object.keys(officials))
                {
                    if(officials[official].canBeDelegate)
                    {
                        await api.api.messages.send({
                            user_id: official,
                            random_id: Math.round(Math.random() * 100000),
                            message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country.id}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country.id})]]).inline().oneTime()
                        })
                    }
                }
            }
            if(!context.player.status.match(/worker/))
            {
                Data.users[context.player.id].status = "candidate"
            }
            context.player.waitingCitizenship = setTimeout(() => {
                if(!context.player.status.match(/worker/))
                {
                    Data.users[context.player.id].status = "stateless"
                }
            }, 86400000)
            await context.send("✅ Заявка отправлена")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetCitizenship", e)
        }
    }

    async ShowVars(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            const vars = Object.keys(Data.variables)
            const varButtons = []
            let request = "ℹ Список переменных:\n\n"
            for(let i = 0; i < vars.length; i++)
            {
                varButtons.push([vars[i], vars[i]])
                request += "🔸 " + vars[i] + "   =   " + Data.variables[vars[i]] + "\n"
            }
            await context.send(request)
        }
        catch (e)
        {
            await context.send("Ошибка: " + e.message)
        }
    }

    async SetVar(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            const vars = Object.keys(Data.variables)
            const varButtons = []
            let request = "ℹ Список переменных:\n\n"
            for(let i = 0; i < vars.length; i++)
            {
                varButtons.push([vars[i], vars[i]])
                request += "🔸 " + vars[i] + "   =   " + Data.variables[vars[i]] + "\n"
            }
            let msg = context.text.replace(/^установить переменную |^изменить переменную /i, "")
            let commands = msg.split(" ")
            if(commands.length < 2)
            {
                await context.send("Неверный формат")
                return
            }
            let varName = commands[0]
            commands = commands.slice(1)
            commands = commands.join(" ")
            if(!Data.variables[varName])
            {
                await context.send("Переменная не найдена")
                return
            }
            Data.variables[varName] = commands
            await Data.SaveVariables()
            await context.send("✅ Значение переменной изменено")
        }
        catch (e)
        {
            await context.send("Ошибка: " + e.message)
        }
    }

    async GiveAttachment(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            if (!context.attachments[0])
            {
                await context.send("Нет прикрепленных данных")
                return
            }
            let attachment = context.attachments[0]
            if(attachment.type === "photo")
            {
                attachment = await api.upload.messagePhoto({source: {value: attachment.largeSizeUrl}})
                attachment = attachment.toString()
            }
            else
            {
                attachment = attachment.toString()
            }
            await context.send(attachment)
        }
        catch (e)
        {
            await context.send("Ошибка: " + e.message)
        }
    }

    async KickUser(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(context.replyPlayers?.length !== 0)
            {
                let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
                if(NameLibrary.RoleEstimator(player?.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send("⚠ Вы не можете кикнуть админа находящегося на одном с вами ранге или выше")
                    return
                }
                await api.KickUser(context.peerId, context.replyPlayers[0])
            }
        }
        catch (e)
        {
            await context.send("Ошибка: " + e.message)
        }
    }

    async ShowPlayerActive(context)
    {
        try
        {
            if(context.replyPlayers?.length !== 0 && NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                return
            }
            let activity = {
                allMessages: 0,
                allAudios: 0,
                allStickers: 0,
                allSwords: 0,
                todayMessages: 0,
                todayAudios: 0,
                todayStickers: 0,
                todaySwords: 0
            }
            if(context.replyPlayers?.length !== 0)
            {
                if(Data.users[context.replyPlayers[0]])
                {
                    if(Data.activity[context.replyPlayers[0]]) activity.todayMessages = Data.activity[context.replyPlayers[0]]
                    if(Data.musicLovers[context.replyPlayers[0]]) activity.todayAudios = Data.musicLovers[context.replyPlayers[0]]
                    if(Data.stickermans[context.replyPlayers[0]]) activity.todayStickers = Data.stickermans[context.replyPlayers[0]]
                    if(Data.uncultured[context.replyPlayers[0]]) activity.todaySwords = Data.uncultured[context.replyPlayers[0]]
                    activity.allMessages = Data.users[context.replyPlayers[0]].msgs + activity.todayMessages
                    activity.allAudios = Data.users[context.replyPlayers[0]].audios + activity.todayAudios
                    activity.allStickers = Data.users[context.replyPlayers[0]].stickers + activity.todayStickers
                    activity.allSwords = Data.users[context.replyPlayers[0]].swords + activity.todaySwords
                }
                else
                {
                    const user = await PlayerInfo.findOne({where: {id: context.replyPlayers[0]}})
                    if(!user)
                    {
                        await context.send("⚠ Игрок не зарегистрирован")
                        await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                        return
                    }
                    activity.allMessages = user.dataValues.msgs
                    activity.allAudios = user.dataValues.audios
                    activity.allStickers = user.dataValues.stickers
                    activity.allSwords = user.dataValues.swords
                }
            }
            else
            {
                if(Data.activity[context.player.id]) activity.todayMessages = Data.activity[context.player.id]
                if(Data.musicLovers[context.player.id]) activity.todayAudios = Data.musicLovers[context.player.id]
                if(Data.stickermans[context.player.id]) activity.todayStickers = Data.stickermans[context.player.id]
                if(Data.uncultured[context.player.id]) activity.todaySwords = Data.uncultured[context.player.id]
                activity.allMessages = context.player.msgs + activity.todayMessages
                activity.allAudios = context.player.audios + activity.todayAudios
                activity.allStickers = context.player.stickers + activity.todayStickers
                activity.allSwords = context.player.swords + activity.todaySwords
            }
            let request = "↖ Статистика:\n\n" +
                "💬 Всего сообщений: " + activity.allMessages + "\n" +
                "💩 Всего стикеров: " + activity.allStickers + "\n" +
                "🎶 Всего музыки: " + activity.allAudios + "\n" +
                "🤬 Всего матов: " + activity.allSwords + "\n" +
                "⚠ Всего предупреждений: " + context.player.warningScore + "\n\n" +
                "💬 Сообщений сегодня: " + activity.todayMessages + "\n" +
                "💩 Стикеров сегодня: " + activity.todayStickers + "\n" +
                "🎶 Музыки сегодня: " + activity.todayAudios + "\n" +
                "🤬 Матов сегодня: " + activity.todaySwords
            await context.send(request)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Divorce", e)
        }
    }

    async Divorce(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(context.player.marriedID !== context.replyPlayers[0])
            {
                await context.send("⚠ Вы не состоите в браке.")
                return
            }
            await api.api.messages.send({
                user_id: context.player.marriedID,
                random_id: Math.round(Math.random() * 100000),
                message: `❤️‍🩹 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение расторгнуть брак`,
                keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "divorce", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_divorce", item: context.player.id})]]).inline().oneTime()
            })
            await context.send(`✅ Предложение отправлено, ход за *id${context.replyPlayers[0]}(вами), перейдите в ЛС и дайте свой ответ`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Divorce", e)
        }
    }

    async OfferMarry(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(context.player.isMarried)
            {
                await context.send("⚠ Вы уже помолвлены")
                return
            }
            let user = context.replyPlayers[0]
            user = await Player.findOne({where: {id: user}})
            if(!user)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}, attributes: ["marriedID"]})
            if(userInfo.dataValues.marriedID !== null)
            {
                await context.send(`⚠ Этот игрок уже состоит в браке`)
                return
            }
            if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender && !context.player.nation.match(/грек/i))
            {
                await context.send("✝ Мы такое не одобряем.")
                return
            }
            await api.api.messages.send({
                user_id: user.dataValues.id,
                random_id: Math.round(Math.random() * 100000),
                message: `💌 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение руки и сердца`,
                keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "merry", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_merry", item: context.player.id})]]).inline().oneTime()
            })
            Data.users[context.player.id].isMarried = true
            await context.send(`✅ Предложение отправлено, ход за *id${user.dataValues.id}(вами), перейдите в ЛС и дайте свой ответ`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/OfferMarry", e)
        }
    }

    async ToOtherCity(context, id)
    {
        try
        {
            let time = new Date()
            if(context.player.stayInCityTime - time > 0)
            {
                await context.send(`⚠ Вы сильно устали после предыдущей дороги, отдохните и можно опять в путь.\n\nДо восстановления сил ${NameLibrary.ParseFutureTime(context.player.stayInCityTime)}`)
                return
            }
            const road = await CityRoads.findOne({where: {fromID: context.player.location, toID: id}})
            if(!road)
            {
                await context.send("⚠ Вам не доступна эта дорога")
                return
            }
            const city = Data.cities[id]
            if(city.isSiege && context.player.status !== "worker")
            {
                await context.send("⚠ Город находится под осадой")
                return
            }
            if(Data.countries[context.player.countryID].isSiege && context.player.status !== "worker")
            {
                await context.send("⚠ В фракции введено военное положение, перемещение между городами невозможно")
                return
            }
            if(city.isSiege && context.player.status !== "worker")
            {
                await context.send("ℹ В данный момент город, в который вы хотите отправиться находится в осаде, въезд в него не возможен")
                return
            }
            if(context.player.status === "worker")
            {
                await context.send("🏙 Вы пришли в город " + city.name)
                context.player.location = city.id
                context.player.countryID = city.countryID
                await PlayerStatus.update(
                    {location: city.id, countryID: city.countryID},
                    {where: {id: context.player.id}}
                )
            }
            else
            {
                time.setMinutes(time.getMinutes() + parseInt(road.dataValues.time))
                context.player.lastActionTime = time
                context.player.state = SceneController.WaitingWalkMenu
                await context.send("ℹ Вы отправились в город " + city.name)
                Data.timeouts["user_timeout_walk_" + context.player.id] = {
                    type: "user_timeout",
                    subtype: "walk",
                    userId: context.player.id,
                    cityID: city.id,
                    time: time,
                    timeout: setTimeout(async () => {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + city.name + "\n" + city.description, SceneController.GetStartMenuKeyboard(context))
                        context.player.state = SceneController.StartScreen
                        context.player.location = city.id
                        context.player.countryID = city.countryID
                        await PlayerStatus.update(
                            {location: city.id, countryID: city.countryID},
                            {where: {id: context.player.id}}
                        )
                        if(city.notifications)
                        {
                            await api.SendMessage(city.leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${city.name}`)
                        }
                        let stayTime = new Date()
                        stayTime.setMinutes(stayTime.getMinutes() + 30)
                        context.player.stayInCityTime = stayTime
                        delete Data.timeouts["user_timeout_walk_" + context.player.id]
                    }, road.dataValues.time * 60000)
                }
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ToOtherCountry", e)
        }
    }

    async ToOtherCountry(context, id)
    {
        try
        {
            let time = new Date()
            if(context.player.stayInCityTime - time > 0)
            {
                await context.send(`⚠ Вы сильно устали после предыдущей дороги, отдохните и можно опять в путь.\n\nДо восстановления сил ${NameLibrary.ParseFutureTime(context.player.stayInCityTime)}`)
                return
            }
            const road = await CountryRoads.findOne({where: {fromID: context.player.countryID, toID: id}})
            if(!road)
            {
                await context.send("⚠ Вам не доступна эта дорога")
                return
            }
            const country = Data.countries[id]
            if(!context.player.CanPay({money: -country.entranceFee}))
            {
                await context.send("⚠ У вас не хватает монет для оплаты входной пошлины")
                return
            }
            if(Data.cities[context.player.location].isSiege)
            {
                await context.send("⚠ Город находится под осадой, вы не можете его покинуть")
                return
            }
            if(Data.countries[context.player.countryID].isSiege)
            {
                await context.send("⚠ В фракции введено военное положение, выезд запрещен")
                return
            }
            if(Data.countries[id].isSiege)
            {
                await context.send("⚠ В данный момент фракция, в которую вы хотите отправиться находится под блокадой, въезд в нее не возможен")
                return
            }
            if(context.player.status === "worker")
            {
                await context.send("🏙 Вы пришли в город " + Data.GetCityName(country.capitalID))
                context.player.location = country.capitalID
                context.player.countryID = country.id
                await PlayerStatus.update(
                    {location: country.capitalID, countryID: country.id},
                    {where: {id: context.player.id}}
                )
            }
            else
            {
                time.setMinutes(time.getMinutes() + road.dataValues.time)
                context.player.state = SceneController.WaitingWalkMenu
                await context.send("ℹ Вы отправились в фракцию " + country.GetName(context.player.platform === "IOS"))
                context.player.lastActionTime = time
                Data.timeouts["user_timeout_walk_" + context.player.id] = {
                    type: "user_timeout",
                    subtype: "walk",
                    userId: context.player.id,
                    cityID: Data.countries[country.id].capitalID,
                    time: time,
                    timeout: setTimeout(async () => {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + Data.GetCityName(country.capitalID), SceneController.GetStartMenuKeyboard(context))
                        context.player.location = country.capitalID
                        context.player.countryID = country.id
                        if (country.entranceFee !== 0)
                        {
                            await Data.AddPlayerResources(context.player.id, {money: -country.entranceFee})
                            await Data.AddCountryResources(country.id, {money: country.entranceFee})
                        }
                        await PlayerStatus.update(
                            {location: country.capitalID, countryID: country.id},
                            {where: {id: context.player.id}}
                        )
                        if(country.notifications)
                        {
                            await api.SendMessage(country.leaderID, `ℹ Игрок ${context.player.GetName()} зашел в вашу фракцию ${country.GetName(false)}`)
                        }
                        if(Data.cities[country.capitalID].notifications)
                        {
                            await api.SendMessage(Data.cities[country.capitalID].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${Data.cities[country.capitalID].name}`)
                        }
                        let stayTime = new Date()
                        stayTime.setMinutes(stayTime.getMinutes() + 30)
                        context.player.stayInCityTime = stayTime
                        context.player.state = SceneController.StartScreen
                        delete Data.timeouts["user_timeout_walk_" + context.player.id]
                    }, road.time * 60000)
                }
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ToOtherCountry", e)
        }
    }


    async RoadMap(context)
    {
        try
        {
            const renderKbString = (array, button) => {
                let kb = []
                const strings = []
                for (let i = 0; i < Math.ceil(array.length / 2); i++)
                {
                    strings.push(array.slice((i * 4), (i * 4) + 4))
                }
                for(let i = 0; i < strings.length; i++)
                {
                    kb[i] = []
                    for(const btn of strings[i])
                    {
                        kb[i].push(button({name: btn[0], type: btn[2], action: btn[1]}))
                    }
                }
                return kb
            }
            let request = `🗺 Карта дорог\n\n*id${context.player.id}(Вы) находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${Data.countries[Data.cities[context.player.location].countryID].GetName(context.player.platform === "IOS")}, в городе ${Data.cities[context.player.location].name}\n`
            let kb = []
            let countryKB = []
            let cityKB = []
            const countryRoads = await CountryRoads.findAll({where: {fromID: context.player.countryID, isBlocked: false}, limit: 8, attributes: ["toID", "time"]})
            if(countryRoads.length !== 0) request += "\n🔵 Вы можете отправиться в фракции:\n"
            for(const key of countryRoads)
            {
                countryKB.push([Data.countries[key.dataValues.toID].name, "ID" + key.dataValues.toID, "to_other_country"])
                request += `🔸 ${Data.countries[key.dataValues.toID].GetName(context.player.platform === "IOS")} - ${key.dataValues.time} мин, въездная пошлина - ${Data.countries[key.dataValues.toID].entranceFee} монет\n`
            }
            const cityRoads = await CityRoads.findAll({where: {fromID: context.player.location, isBlocked: false}, limit: 8, attributes: ["toID", "time"]})
            if(cityRoads.length !== 0) request += "\n⚪ Вы можете посетить города:\n"
            for(const key of cityRoads)
            {
                cityKB.push([Data.cities[key.dataValues.toID].name, "ID" + key.dataValues.toID, "to_other_city"])
                request += `🔸 ${Data.cities[key.dataValues.toID].name} - ${key.dataValues.time} мин\n`
            }
            kb = kb.concat(renderKbString(countryKB, keyboard.lightButton))
            kb = kb.concat(renderKbString(cityKB, keyboard.greyButton))
            await context.send(request, {attachment: Data.variables.roadMap, keyboard: keyboard.build(kb).inline()})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesInfo(context)
    {
        try
        {
            let request = "🔰 Государства, населяющие наш мир:\n\n"
            let user = undefined
            let population = 0
            let countries = []
            for(const country of Data.countries)
            {
                if(country)
                {
                    population = await PlayerStatus.count({where: {citizenship: country.id}})
                    countries.push([country, population])
                }
            }
            for (let j = countries.length - 1; j > 0; j--)
            {
                for (let i = 0; i < j; i++)
                {
                    if (countries[i][1] < countries[i + 1][1])
                    {
                        let temp = countries[i];
                        countries[i] = countries[i + 1];
                        countries[i + 1] = temp;
                    }
                }
            }
            for(const country of countries)
            {
                user = undefined
                if(country)
                {
                    user = await Player.findOne({where: {id: country[0].leaderID}, attributes: ["nick"]})
                    request += `${country[0].GetName(context.player.platform === "IOS")}\n`
                    request += `👥 Население - ${country[1]} чел.\n`
                    request += `👑 Правитель - ${user ? `@id${country[0].leaderID}(${user.dataValues.nick})` : "Не назначен"}\n`
                    request += `🌆 Столица - ${Data.cities[country[0].capitalID].name}\n\n`
                }
            }
            await context.send(request, {disable_mentions: true})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesActive(context)
    {
        try
        {
            if(context.command.match(/неделя/))
            {
                await this.ShowCountriesWeekActive(context, context.command.replace(/неделя/, ""))
            }
            else
            {
                await this.ShowCountriesDayActive(context, context.command)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesDayActive(context, response)
    {
        try
        {
            let temp, country, request = ""
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(response.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                let request = "🔰 Актив фракций:\n\n"
                let activeCountries = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        activeCountries.push([Data.countries[i].active, i])
                    }
                }
                for (let j = activeCountries.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (activeCountries[i][0] < activeCountries[i + 1][0])
                        {
                            let temp = activeCountries[i];
                            activeCountries[i] = activeCountries[i + 1];
                            activeCountries[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < activeCountries.length; i++)
                {
                    if(Data.countries[activeCountries[i][1]])
                    {
                        request += `${Data.countries[activeCountries[i][1]].GetName(context.player.platform === "IOS")}\n`
                        request +=  `${Data.countries[activeCountries[i][1]].chatID ? `⚒ Актив за сегодня: ${Data.countries[activeCountries[i][1]].active} сообщений` : "⚠ Чат не добавлен"}\n`
                        request += `💪 Рейтинг активности: ${Data.countries[activeCountries[i][1]].rating}\n`
                        request += `🔴 Получено варнов: ${Data.countries[activeCountries[i][1]].warnings}\n\n`
                    }
                }
                await context.send(request)
            }
            else
            {
                request += `${country.GetName(context.player.platform === "IOS")}\n`
                request +=  `${country.chatID ? `⚒ Актив за сегодня: ${country.active} сообщений` : "⚠ Чат не добавлен"}\n`
                request += `💪 Рейтинг активности: ${country.rating}\n`
                request += `🔴 Получено варнов: ${country.warnings}`
                await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesWeekActive(context, response)
    {
        try
        {
            let temp, country, request = ""
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(response.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                let request = "🔰 Актив фракций за неделю:\n\n"
                let activeCountries = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        activeCountries.push([Data.countriesWeekActive[Data.countries[i].id] + Data.countries[i].active, i])
                    }
                }
                for (let j = activeCountries.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (activeCountries[i][0] < activeCountries[i + 1][0])
                        {
                            let temp = activeCountries[i];
                            activeCountries[i] = activeCountries[i + 1];
                            activeCountries[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < activeCountries.length; i++)
                {
                    if(Data.countries[activeCountries[i][1]])
                    {
                        request += `${Data.countries[activeCountries[i][1]].GetName(context.player.platform === "IOS")}\n`
                        request +=  `${Data.countries[activeCountries[i][1]].chatID ? `⚒ Актив за неделю: ${Data.countriesWeekActive[Data.countries[[activeCountries[i][1]]].id] + Data.countries[activeCountries[i][1]].active} сообщений` : "⚠ Чат не добавлен"}\n`
                        request += `💪 Рейтинг активности: ${Data.countries[activeCountries[i][1]].rating}\n`
                        request += `🔴 Получено варнов: ${Data.countries[activeCountries[i][1]].warnings}\n\n`
                    }
                }
                await context.send(request)
            }
            else
            {
                request += `${country.GetName(context.player.platform === "IOS")}\n`
                request += `${country.chatID ? `⚒ Актив за неделю: ${Data.countriesWeekActive[country.id] + country.active} сообщений` : "⚠ Чат не добавлен"}\n`
                request += `💪 Рейтинг активности: ${country.rating}\n`
                request += `🔴 Получено варнов: ${country.warnings}`
                await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountryChats(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let country = null
            let temp = null
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(context.command.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                await context.send("⚠ Фракция не найдена")
                return
            }
            temp = country.chatID ? country.chatID.split("|") : []
            if(temp.length !== 0)
            {
                let request = `✅ Чаты фракции ${country.GetName(context.player.platform === "IOS")}:\n\n`
                for(const chat of temp)
                {
                    request += chat + (parseInt(chat) === context.peerId ? " (мы сейчас здесь)" : "") + "\n"
                }
                await context.send(request)
            }
            else
            {
                await context.send(`⚠ У фракции ${country.GetName(context.player.platform === "IOS")} не найдено чатов`)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/AddCountryChat", e)
        }
    }

    async RemoveCountryChat(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let country = null
            let temp = null
            context.command = context.command.replace(/добавить чат /, "")
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID)
                    {
                        temp = Data.countries[i].chatID.split("|")
                        for(const chat of temp)
                        {
                            if(parseInt(chat) === context.peerId)
                            {
                                country = Data.countries[i]
                            }
                        }
                    }
                }
            }
            if(!country)
            {
                await context.send("⚠ Этот чат не является чатом фракции")
                return
            }
            temp = country.chatID ? country.chatID.split("|") : []
            temp = temp.filter(chat => {return parseInt(chat) !== context.peerId})
            country.chatID = (temp.length === 0 ? null : temp.join("|"))
            await Country.update({chatID: country.chatID}, {where: {id: country.id}})
            await context.send(`✅ Чат ${context.peerId} больше не принадлежит фракции ${country.GetName(context.player.platform === "IOS")}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/AddCountryChat", e)
        }
    }

    async AddCountryChat(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let country = null
            let temp = null
            context.command = context.command.replace(/добавить чат /, "")
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID)
                    {
                        temp = Data.countries[i].chatID.split("|")
                        for(const chat of temp)
                        {
                            if(parseInt(chat) === context.peerId)
                            {
                                await context.send(`⚠ Этот чат используется фракцией ${Data.countries[i].GetName(context.player.platform === "IOS")}`)
                                return
                            }
                        }
                    }
                }
            }
            for(const key of Data.countries)
            {
                if(key?.tags)
                {
                    temp = new RegExp(key.tags)
                    if(context.command.match(temp))
                    {
                        country = key
                        break
                    }
                }
            }
            if(!country)
            {
                await context.send("⚠ Фракция не найдена")
                return
            }
            temp = country.chatID ? country.chatID.split("|") : []
            temp.push(context.peerId)
            country.chatID = temp.join("|")
            await Country.update({chatID: country.chatID}, {where: {id: country.id}})
            await context.send(`✅ Чат ${context.peerId} теперь принадлежит фракции ${country.GetName(context.player.platform === "IOS")}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/AddCountryChat", e)
        }
    }

    async Reset(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let users = []
            let request = ""
            if(context.command.match(/фракции|государства/))
            {
                await Data.ResetCountries()
                request += "♻ Кеш фракций очищен\n\n"
            }
            if(context.command.match(/город/))
            {
                await Data.ResetCities()
                request += "♻ Кеш городов очищен\n\n"
            }
            if(context.command.match(/здания|постройки|строения/))
            {
                await Data.ResetBuildings()
                request += "♻ Кеш построек очищен\n\n"
            }
            if(context.replyPlayers.length !== 0)
            {
                users = context.replyPlayers
            }
            else if (request.length === 0)
            {
                users = [context.player.id]
            }
            if(users.length > 0)
            {
                request += "\n♻ Очистка данных об игроках:\n"
                for(const user of users)
                {
                    if(Data.users[user])
                    {
                        if(Data.users[user].relaxingEndTimeout) clearTimeout(Data.users[user].relaxingEndTimeout)
                        if(Data.users[user].timeout) clearTimeout(Data.users[user].timeout)
                        delete Data.users[user]
                        if(Data.samples[user]) delete Data.samples[user]
                        if(Data.requests[user]) delete Data.requests[user]
                        if(Data.repeat[user]) delete Data.repeat[user]
                        if(Data.censorship[user])
                        {
                            clearTimeout(Data.censorship[context.replyPlayers[0]].timeout)
                            delete Data.censorship[context.replyPlayers[0]]
                        }
                        if(Data.mute[user])
                        {
                            clearTimeout(Data.mute[context.replyPlayers[0]].timeout)
                            delete Data.mute[context.replyPlayers[0]]
                        }
                        if(Data.voiceMute[user])
                        {
                            clearTimeout(Data.voiceMute[context.replyPlayers[0]].timeout)
                            delete Data.voiceMute[context.replyPlayers[0]]
                        }
                        if(Data.activeIgnore[user])
                        {
                            clearTimeout(Data.activeIgnore[context.replyPlayers[0]].timeout)
                            delete Data.activeIgnore[context.replyPlayers[0]]
                        }
                        if(Data.ignore[user])
                        {
                            clearTimeout(Data.ignore[context.replyPlayers[0]].timeout)
                            delete Data.ignore[context.replyPlayers[0]]
                        }
                        request += `*id${user}(${user}) - удален из кэша ✅\n`
                    }
                    else
                    {
                        request += `*id${user}(${user}) - отсутствует в кэше ⚠\n`
                    }
                }
            }
            await context.send(request)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Reset", e)
        }
    }

    async Reload(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let request = ""
            if(context.command.match(/фракции|государства/))
            {
                await Data.LoadCountries()
                request += "♻ Фракции перезагружены\n\n"
            }
            if(context.command.match(/город/))
            {
                await Data.LoadCities()
                request += "♻ Города перезагружены\n\n"
            }
            if(context.command.match(/здания|постройки|строения/))
            {
                await Data.LoadBuildings()
                request += "♻ Постройки перезагружены\n\n"
            }
            if(context.command.match(/чиновник/))
            {
                await Data.LoadOfficials()
                request += "♻ Чиновники перезагружены\n\n"
            }
            if(request.length !== 0)
            {
                await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Reset", e)
        }
    }

    async Work(context)
    {
        try
        {
            const country = Data.countries[context.player.countryID]
            const kb = []
            country.resources.match(/wood/) && kb.push([keyboard.greenButton({name: "🌳 Лес 🪓", type: "extract", action: "wood"})])
            country.resources.match(/wheat/) && kb.push([keyboard.greyButton({name: "🌾 Собрать зерно 🌾", type: "extract", action: "wheat"})])
            country.resources.match(/stone/) && kb.push([keyboard.greyButton({name: "🪨 Копать камень ⛏", type: "extract", action: "stone"})])
            country.resources.match(/iron/) && kb.push([keyboard.lightButton({name: "🌑 Добыть железо ⛏", type: "extract", action: "iron"})])
            country.resources.match(/copper/) && kb.push([keyboard.lightButton({name: "🥉 Добыть бронзы ⛏", type: "extract", action: "copper"})])
            country.resources.match(/silver/) && kb.push([keyboard.lightButton({name: "🥈 Добыть серебра ⛏", type: "extract", action: "silver"})])
            await context.send(`🚧 Здравствуй, *id${context.player.id}(путник). Вижу, работать хочешь? Что-ж, есть для тебя пару занятий...`, {keyboard: keyboard.build(kb).inline()})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Relax", e)
        }
    }
    async Wakeup(context)
    {
        try
        {
            if(!Data.timeouts["user_timeout_sleep_" + context.player.id])
            {
                context.player.isRelaxing = false
                await context.send(`☕ Будете слишком бодрым - сердце посадите.`)
                return
            }
            const now = new Date()
            const time = Math.max(0, Math.round((Data.timeouts["user_timeout_sleep_" + context.player.id].time - now) / 60000))
            clearTimeout(Data.timeouts["user_timeout_sleep_" + context.player.id].timeout)
            delete Data.timeouts["user_timeout_sleep_" + context.player.id]
            context.player.isRelaxing = false
            context.player.fatigue = Math.round(100 - (time * (100 / 360)))
            await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Relax", e)
        }
    }

    async Relax(context)
    {
        try
        {
            if(Data.timeouts["user_timeout_sleep_" + context.player.id])
            {
                await context.send(`💤 Сон во сне? Звучит как завязка фильма "Начало"`)
                return
            }
            if(context.player.fatigue === 100)
            {
                await context.send(`💪 Вы полны сил`)
                return
            }
            const need = (100 - context.player.fatigue) * 3.6
            const time = new Date()
            time.setMinutes(time.getMinutes() + need)
            Data.timeouts["user_timeout_sleep_" + context.player.id] = {
                type: "user_timeout",
                subtype: "sleep",
                userId: context.player.id,
                time: time,
                timeout: setTimeout(async () => {
                    await api.SendMessage(context.player.id, "☕ Ваши силы восстановлены")
                    context.player.fatigue = 100
                    context.player.isRelaxing = false
                    delete Data.timeouts["user_timeout_sleep_" + context.player.id]
                }, need * 60000)
            }
            context.player.isRelaxing = true
            await context.send(`💤 *id${context.player.id}(Вы) перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Relax", e)
        }
    }

    async SendResource(context)
    {
        try
        {
            if(context.player.CantTransact())
            {
                await context.send("Вы не можете делать переводы, причина:\n\n" + context.player.WhyCantTransact())
                return
            }
            let country = false
            let city = false
            let user
            let resource = null
            let sends = context.command.split(",")
            let objOUT = {}
            let objIN = {}
            let count
            let request = ""
            let esterEgg = {}
            if(context.command.match(/бюджет|госуд|фракц/))
            {
                country = true
            }
            if(context.command.match(/город/))
            {
                country = false
                city = true
            }
            if(country && Data.countries[context.player.countryID].capitalID !== context.player.location)
            {
                await context.send("⚠ Переводить ресурсы в бюджет фракции можно только из столицы")
                return
            }
            if(!country && !city && context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(!country && !city)
            {
                user = await Player.findOne({where: {id: context.replyPlayers[0]}})
                if(!user)
                {
                    await context.send("⚠ Игрок не зарегистрирован")
                    await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                    return
                }
            }
            if(context.replyPlayers[0] === context.player.id)
            {
                await context.send("❓ Какой смысл передавать ресурсы самому себе? Вот просто зачем? Чтобы что?")
                return
            }
            for(let send of sends)
            {
                resource = null
                if(send.match(Commands.money)) resource = "money"
                if(send.match(Commands.wheat)) resource = "wheat"
                if(send.match(Commands.stone)) resource = "stone"
                if(send.match(Commands.wood)) resource = "wood"
                if(send.match(Commands.iron)) resource = "iron"
                if(send.match(Commands.copper)) resource = "copper"
                if(send.match(Commands.silver)) resource = "silver"
                if(send.match(Commands.diamond)) resource = "diamond"
                if(send.match(Commands.carrot)) resource = "carrot"
                if(send.match(Commands.tea)) resource = "tea"
                if(send.match(Commands.beer)) resource = "beer"
                if(send.match(Commands.ale)) resource = "ale"
                if(send.match(Commands.elephant)) resource = "elephant"
                if(send.match(Commands.dick)) resource = "dick"
                if(send.match(Commands.mushroom)) resource = "mushroom"
                if(send.match(Commands.vine))
                {
                    resource = "vine"
                    if(send.match(/фалерн/))
                    {
                        resource = "florence vine"
                    }
                    else if(send.match(/сицил/))
                    {
                        resource = "sicilian vine"
                    }
                }
                if(!resource) continue
                count = send.match(/\d+/)
                count = parseInt( count ? count[0] : send)
                if(isNaN(count))
                {
                    count = 1
                }
                if(resource.match(/money|wheat|stone|wood|iron|copper|silver|diamond/))
                {
                    if(send.match(/все|всё|всю|всех|весь/))
                    {
                        count = context.player[resource]
                    }
                    if(context.player[resource] < count)
                    {
                        continue
                    }
                    objIN[resource] = objIN[resource] ? objIN[resource] - Math.abs(count) : -Math.abs(count)
                    objOUT[resource] = objOUT[resource] ? objOUT[resource] + Math.abs(count) : Math.abs(count)
                }
                else
                {
                    esterEgg[resource] = count
                }
            }
            if(Object.keys(esterEgg).length !== 0 && !country && !city)
            {
                for(const res of Object.keys(esterEgg))
                {
                    if(res === "carrot")
                    {
                        if(!NameLibrary.GetChance((1 / esterEgg[res]) * 100))
                        {
                            request += "\nУ вас слишком мало морковки!🥕🥕🥕"
                        }
                        else
                        {
                            request += "\n🥕 Морковка - ✅ Передано " + esterEgg[res]
                            await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} поделился с вами марковкой, но из за того что я был голодный - я ее не донес\n👉👈`)
                        }
                    }
                    if(res === "tea")
                    {
                        request += "\n🍵 Чай - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} угостил вас 🍵 чаем!`)
                    }
                    if(res === "beer")
                    {
                        request += "\n🍺 Пиво - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Там это, как там его, игрок ${context.player.GetName()} с вами 🍺 пивом поделился.\n\n🥴🥴🥴 Вкусное пиво было, а чё я пришел?\n\n🥴🥴🥴Не помню уже`)
                    }
                    if(res === "ale")
                    {
                        request += "\n🥃 Эль - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} угостил вас 🥃 элем, но пограничники отобрали его у меня!`)
                    }
                    if(res === "mushroom")
                    {
                        request += "\n🍄 Мухоморы - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} 🤢 поделился с вами 🍄 мухоморами 🤢, а я их 🤢🤢 съел. 🤮🤮🤮\nО, мультики показывают!`)
                    }
                    if(res === "elephant")
                    {
                        request += "\n🐘 Слон - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} отдал вам 🐘 слона, а он ушел! Сам.`)
                    }
                    if(res === "vine")
                    {
                        request += "\n🍾 Вино - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} поделился с вами вином.`)
                    }
                    if(res === "florence vine")
                    {
                        request += "\n🍷 Флорентийское вино - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} поделился с вами вином. На вкус - флорентийское.`)
                    }
                    if(res === "sicilian vine")
                    {
                        request += "\n🍷 Сицилийское вино - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} поделился с вами вином. На вкус - сицилийское.`)
                    }
                    if(res === "dick")
                    {
                        request += "\n👄 По губам - ✅ Проведено 🍌"
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} провел вам по 👄 губам 🍌`)
                    }
                }
            }
            for(const res of Object.keys(objOUT))
            {
                if(Math.abs(objOUT[res]) !== 0)
                {
                    request += `${NameLibrary.GetResourceName(res)} - ✅ Передано ${Math.abs(objOUT[res])}\n`
                }
            }
            if(Object.keys(objOUT).length !== 0)
            {
                if(country)
                {
                    await Data.AddCountryResources(context.player.countryID, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(Data.countries[context.player.countryID].leaderID, `✅ В бюджет фракции ${Data.countries[context.player.countryID].GetName()} поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                }
                else if(city)
                {
                    await Data.AddCityResources(context.player.location, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(Data.cities[context.player.location].leaderID, `✅ В бюджет города ${Data.cities[context.player.location].name} поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                }
                else
                {
                    await Data.AddPlayerResources(user.dataValues.id, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(user.dataValues.id, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                }
            }
            if(request.length !== 0) await context.send(request)
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async CheatResource(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 2)
            {
                return
            }
            let user
            if(context.replyPlayers?.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            let player = await Player.count({where: {id: user}})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            context.command = context.command.replace(Commands.cheating, "")
            let resource = null
            let sends = context.command.split(",")
            let objOUT = {}
            let count
            let request = ""
            for(let send of sends)
            {
                if(send.match(Commands.money))
                {
                    resource = "money"
                }
                if(send.match(Commands.wheat))
                {
                    resource = "wheat"
                }
                if(send.match(Commands.stone))
                {
                    resource = "stone"
                }
                if(send.match(Commands.wood))
                {
                    resource = "wood"
                }
                if(send.match(Commands.iron))
                {
                    resource = "iron"
                }
                if(send.match(Commands.copper))
                {
                    resource = "copper"
                }
                if(send.match(Commands.silver))
                {
                    resource = "silver"
                }
                if(!resource)
                {
                    return
                }
                count = send.match(/\d+/)
                count = parseInt( count ? count[0] : send)
                if(isNaN(count))
                {
                    count = 1
                }
                objOUT[resource] = Math.abs(count)
                request += `${NameLibrary.GetResourceName(resource)} - ✅ Накручено ${Math.abs(count)}\n`
            }
            await Data.AddPlayerResources(user, objOUT)
            await api.SendNotification(user, `✅ Вам поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
            await context.send(request)
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async PickUpResource(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 2)
            {
                return
            }
            let user
            if(context.replyPlayers?.length !== 0)
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            let player = await PlayerResources.findOne({where: {id: user}})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            context.command = context.command.replace(Commands.pickUp, "")
            let resource = null
            let sends = context.command.split(",")
            let objOUT = {}
            let count
            let request = ""
            for(let send of sends)
            {
                if(send.match(Commands.money))
                {
                    resource = "money"
                }
                if(send.match(Commands.wheat))
                {
                    resource = "wheat"
                }
                if(send.match(Commands.stone))
                {
                    resource = "stone"
                }
                if(send.match(Commands.wood))
                {
                    resource = "wood"
                }
                if(send.match(Commands.iron))
                {
                    resource = "iron"
                }
                if(send.match(Commands.copper))
                {
                    resource = "copper"
                }
                if(send.match(Commands.silver))
                {
                    resource = "silver"
                }
                if(send.match(Commands.diamond))
                {
                    resource = "diamond"
                }
                if(send.match(Commands.carrot))
                {
                    resource = "carrot"
                }
                if(!resource)
                {
                    return
                }
                count = send.match(/\d+/)
                count = parseInt( count ? count[0] : send)
                if(isNaN(count))
                {
                    count = 1
                }
                if(send.match(/все|всё|всю|всех|весь/) || player.dataValues[resource] < count)
                {
                    count = player.dataValues[resource]
                }
                objOUT[resource] = -Math.abs(count)
                request += `${NameLibrary.GetResourceName(resource)} - ✅ Отобрано ${Math.abs(count)}\n`
            }
            await Data.AddPlayerResources(user, objOUT)
            await api.SendNotification(user, `✅ У вас было отобрано:\n${NameLibrary.GetPrice(objOUT)}`)
            await context.send(request)
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async CheckDocs(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            const user = await Player.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: context.replyPlayers[0]}})
            const userStatus = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}})
            await context.send(`📌Игрок *id${user.dataValues.id}(${user.dataValues.nick}):\n\n📅 Возраст: ${userInfo.dataValues.age}\n⚤ Пол: ${user.dataValues.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${userInfo.dataValues.nationality}\n💍 Брак: ${userInfo.dataValues.marriedID ? user.dataValues.gender ? `*id${userInfo.dataValues.marriedID}(💘Муж)` : `*id${userInfo.dataValues.marriedID}(💘Жена)` : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(user.dataValues.role)}\n👑 Статус: ${NameLibrary.GetStatusName(user.dataValues.status)}\n🔰 Гражданство: ${userStatus.dataValues.citizenship ? Data.GetCountryName(userStatus.dataValues.citizenship) : "Нет"}\n📍 Прописка: ${userStatus.dataValues.registration ? Data.GetCityName(userStatus.dataValues.registration) : "Нет"}\n💭 Описание: ${userInfo.dataValues.description}`, {disable_mentions: true})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CheckLocation", e)
        }
    }

    async CheckLocation(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(context.replyPlayers[0] === context.player.id)
            {
                await context.send("➕ Да, вы находитесь в одном городе с самим собой")
                return
            }
            const user = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота. Вот ссылОчка где это можно сделать https://vk.com/im?sel=-218388422`)
                return
            }
            if(user.dataValues.location === context.player.location)
            {
                await context.send("➕ Вы находитесь в одном городе")
            }
            else
            {
                if(user.dataValues.countryID === context.player.countryID)
                {
                    await context.send("➖ Вы находитесь в разных городах одной фракции")
                }
                else
                {
                    await context.send("➖ Вы находитесь в разных городах")
                }
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CheckLocation", e)
        }
    }

    async ExtractResource(context, resource)
    {
        try
        {
            if(context.player.CantExtraction())
            {
                await context.send(`🥴 Вы не можете добывать ресурсы, ${context.player.WhyCantTransact()}`)
                return
            }
            if(context.player.fatigue <= 0)
            {
                await context.send("😢 Хватит работать, иди поспи.")
                return
            }
            if(!context.player.citizenship)
            {
                await context.send("🥸 Для добычи ресурсов надо иметь гражданство")
                return
            }

            if(Data.countries[context.player.countryID].resources.match(resource) && Data.countries[context.player.citizenship].resources.match(resource))
            {
                const extract = {
                    wood: {min: 2.5, max: 5, img: Data.variables["woodPicture"]},
                    wheat: {min: 2.5, max: 7.5, img: Data.variables["wheatPicture"]},
                    stone: {min: 2.5, max: 5, img: Data.variables["stonePicture"]},
                    iron: {min: 0.65, max: 1.85, img: Data.variables["ironPicture"]},
                    copper: {min: 0.65, max: 1.85, img: Data.variables["copperPicture"]},
                    silver: {min: 1.25, max: 2.5, img: Data.variables["silverPicture"]}
                }
                let obj = {}
                const extraction = NameLibrary.GetRandomNumb(extract[resource].min * context.player.fatigue, extract[resource].max * context.player.fatigue)
                context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                {
                    obj["diamond"] = 1
                    await context.send(`💎 Вы нашли алмаз!`, {attachment: Data.variables["diamondPicture"]})
                }
                obj[resource] = extraction
                await Data.AddPlayerResources(context.player.id, obj)
                await context.send(`✅ Вы добыли ${NameLibrary.GetResourceName(resource)} ${extraction}`, {attachment: extract[resource].img})
            }
            else
            {
                await context.send("🥸 Вы не можете добыть этот ресурс.")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ExtractResource", e)
        }
    }

    async LocationRequest(context)
    {
        try
        {
            const country = Data.countries[context.player.countryID]
            const kb = [[], [], []]
            country.resources.match(/wood/) && kb[0].push(keyboard.greenButton({name: "🌳 Лес 🪓", type: "extract", action: "wood"}))
            country.resources.match(/wheat/) && kb[0].push(keyboard.greyButton({name: "🌾 Собрать зерно 🌾", type: "extract", action: "wheat"}))
            country.resources.match(/stone/) && kb[1].push(keyboard.greyButton({name: "🪨 Копать камень ⛏", type: "extract", action: "stone"}))
            country.resources.match(/iron/) && kb[1].push(keyboard.lightButton({name: "🌑 Добыть железо ⛏", type: "extract", action: "iron"}))
            country.resources.match(/copper/) && kb[2].push(keyboard.lightButton({name: "🥉 Добыть бронзы ⛏", type: "extract", action: "copper"}))
            country.resources.match(/silver/) && kb[2].push(keyboard.lightButton({name: "🥈 Добыть серебра ⛏", type: "extract", action: "silver"}))
            const photo = Data.cities[context.player.location].photoURL || country.photoURL
            await context.send(`🧭 *id${context.player.id}(Вы) находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${country.GetName(context.player.platform === "IOS")}, в городе ${Data.cities[context.player.location].name}\n\n${Data.cities[context.player.location].description}`,
                {
                    attachment: photo,
                    keyboard: keyboard.build(kb).inline()
                })
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/LocationRequest", e)
        }
    }

    async SendWarningForm(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игроков")
                return
            }
            let time = new Date()
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                await this.SendReport(context)
                return
            }
            let adminsFlag = false
            let unregFlag = false
            let temp = null
            for(const i of context.replyPlayers)
            {
                if(Data.users[i])
                {
                    if(NameLibrary.RoleEstimator(Data.users[i].role) >= NameLibrary.RoleEstimator(context.player.role))
                    {
                        adminsFlag = true
                    }
                }
                else
                {
                    temp = await Player.findOne({where: {id: i}})?.dataValues
                    if(temp)
                    {
                        if(NameLibrary.RoleEstimator(temp.role) >= NameLibrary.RoleEstimator(context.player.role))
                        {
                            adminsFlag = true
                        }
                    }
                    else
                    {
                        unregFlag = true
                    }
                }
            }
            if(adminsFlag)
            {
                await context.send("⚠ У вас нет права выдавать предупреждения админам")
                return
            }
            if(unregFlag)
            {
                await context.send("⚠ Вы не можете выдать предупреждение не зарегистрированному пользователю")
                return
            }
            const users = context.replyPlayers.join(";")
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игроков:\n${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_warning", users: users})], [keyboard.backButton]])
            context.player.state = SceneController.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendWarningForm", e)
        }
    }

    async SendReport(context)
    {
        try
        {
            let time = new Date()
            if(context.player.lastReportTime)
            {
                if(time - context.player.lastReportTime < 3600000)
                {
                    await context.send("⚠ Вы слишком часто отправляете жалобы")
                    return
                }
            }
            if(!context.player.CanPay({money: -150}))
            {
                await context.send("⚠ У вас не хватает монет для отправки жалобы (стоимость 150 монет)")
                return
            }
            await Data.AddPlayerResources(context.player.id, {money: -150})
            const users = context.replyPlayers.join(";")
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игрок${context.replyPlayers.length > 1 ? "ов" : "а"}:\n${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_report", users: users})], [keyboard.backButton]])
            context.player.state = SceneController.FillingOutTheForm
            await context.send("ℹ Снято 150 монет, заполните форму в ЛС")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendWarningForm", e)
        }
    }

    async SendBanForm(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                await context.send("⚠ У вас нет прав на эту команду")
                return
            }
            if(context.replyPlayers?.length === 0)
            {
                await context.send("⚠ Выберите игроков")
                return
            }
            let time = new Date()
            let adminsFlag = false
            let unregFlag = false
            let temp = null
            const users = context.replyPlayers[0]
            if(Data.users[users])
            {
                if(NameLibrary.RoleEstimator(Data.users[users].role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    adminsFlag = true
                }
            }
            else
            {
                temp = await Player.findOne({where: {id: users}})
                if(temp)
                {
                    if(NameLibrary.RoleEstimator(temp.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                    {
                        adminsFlag = true
                    }
                }
                else
                {
                    unregFlag = true
                }
            }
            if(adminsFlag)
            {
                await context.send("⚠ Вы не можете выдавать баны админам")
                return
            }
            if(unregFlag)
            {
                await context.send("⚠ Вы не можете выдать бан не зарегистрированному пользователю")
                return
            }
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные ГлоБана на игрока: ${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_ban", users: users})], keyboard.backButton])
            context.player.state = SceneController.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendBanForm", e)
        }
    }
}

module.exports = new ChatController()