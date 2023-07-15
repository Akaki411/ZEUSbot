const NameLibrary = require("../variables/NameLibrary")
const Commands = require("../variables/Commands")
const keyboard = require("../variables/Keyboards")
const api = require("../middleware/API")
const Data = require("../models/CacheData")
const {Player, PlayerStatus, PlayerInfo, Country, CountryRoads, CityRoads, PlayerResources, Warning, OfficialInfo,
    Transactions, CountryTaxes, Chats, VKChats
} = require("../database/Models")
const Samples = require("../variables/Samples")
const sequelize = require("../database/DataBase")
const OutputManager = require("../controllers/OutputManager")
const axios = require('axios')
const groupId = parseInt(process.env.GROUPID)
const ChatGPTModes = require('../variables/BotCallModes')
const Rules = require("../variables/Rules")
const APIKeysGenerator = require("../models/ApiKeysGenerator")
const CrossStates = require("./CrossStates")
const BotReactions = require("./Reactions")
const StopList = require("../files/StopList.json")

class ChatController
{
    async CommandHandler(context)
    {
        try
        {
            if(context.command?.match(/^начать$/) && context.peerType === "user")
            {
                await OutputManager.WelcomeMessage(context)
                return true
            }

            // Обработка кнопок
            if(context.messagePayload)
            {
                return await this.ChatButtonHandler(context)
            }

            // Игроки+
            if(context.command?.match(/^бот$/))
            {
                await this.BotCall(context)
                return true
            }
            if(context.command?.match(Commands.clearKeyboard) && context.peerType === "chat")
            {
                await context.send("Убираю", {keyboard: keyboard.none})
                return true
            }
            if(context.command?.match(Commands.badJoke))
            {
                await context.send(NameLibrary.GetRandomSample("bad_jokes"))
                return true
            }
            if(context.command?.match(Commands.location))
            {
                await this.LocationRequest(context)
                return true
            }
            if(context.command?.match(Commands.aboutMe))
            {
                await context.send(context.player.GetInfo(), {attachment: context.player.avatar, disable_mentions: true})
                return true
            }
            if(context.command?.match(Commands.checkLocation))
            {
                await this.CheckLocation(context)
                return true
            }
            if(context.command?.match(Commands.checkDocs))
            {
                await this.CheckDocs(context)
                return true
            }
            if(context.command?.match(Commands.marry))
            {
                await this.OfferMarry(context)
                return true
            }
            if(context.command?.match(Commands.send))
            {
                await this.SendResource(context)
                return true
            }
            if(context.command?.match(Commands.relax))
            {
                await this.Relax(context)
                return true
            }
            if(context.command?.match(/^мир$/))
            {
                await context.send("🌍 Таков наш мир, но что смотреть ты хочешь?", {attachment: Data.variables.globalMap, keyboard: keyboard.build([[keyboard.greyButton({name: "🗺 Карта дорог", type: "show_road_map"})]]).inline()})
                return true
            }
            if(context.command?.match(Commands.map))
            {
                await this.RoadMap(context)
                return true
            }
            if(context.command?.match(Commands.work))
            {
                await this.Work(context)
                return true
            }
            if(context.command?.match(Commands.countries))
            {
                await this.ShowCountriesInfo(context)
                return true
            }
            if(context.command?.match(Commands.events))
            {
                await this.ShowEvents(context)
                return true
            }
            if(context.command?.match(Commands.countriesActive))
            {
                await this.ShowCountriesActive(context)
                return true
            }
            if(context.command?.match(Commands.divorce))
            {
                await this.Divorce(context)
                return true
            }
            if(context.command?.match(Commands.stats))
            {
                await this.ShowPlayerActive(context)
                return true
            }
            if(context.command?.match(Commands.getCitizenship))
            {
                await this.GetCitizenship(context)
                return true
            }
            if(context.command?.match(Commands.toStall) && context.peerType === "chat")
            {
                await this.ToStall(context)
                return true
            }
            if(context.command?.match(Commands.changeNick) && context.peerType === "chat")
            {
                await this.ChangeNick(context)
                return true
            }
            if(context.command?.match(Commands.changeDescription) && context.peerType === "chat")
            {
                await this.ChangeDescription(context)
                return true
            }
            if(context.command?.match(Commands.top))
            {
                await this.SendTopsMessage(context)
                return true
            }
            if(context.command?.match(Commands.extract))
            {
                await this.Extract(context)
                return true
            }
            if(context.command?.match(Commands.getImarat))
            {
                await this.GetImarat(context)
                return true
            }
            if(context.command?.match(Commands.refuseCitizenship))
            {
                await this.RefuseCitizenship(context)
                return true
            }
            if(context.command?.match(Commands.unregistered) && context.peerType === "chat")
            {
                await this.GetUnregList(context)
                return true
            }
            if(context.command?.match(Commands.botMem))
            {
                await this.BotMem(context)
                return true
            }
            if(context.command?.match(Commands.botForgot))
            {
                await this.BotForgot(context)
                return true
            }
            if(context.command?.match(Commands.getFromBudget))
            {
                await this.GetResFromBudget(context)
                return true
            }
            if(context.command?.match(Commands.budget))
            {
                await this.GetBudget(context)
                return true
            }
            if(context.command?.match(Commands.resources))
            {
                await this.GetResources(context)
                return true
            }
            if(context.command?.match(Commands.registration))
            {
                await this.Registration(context)
                return true
            }
            if(context.command?.match(Commands.info))
            {
                await this.CountryInfo(context)
                return true
            }
            if(context.command?.match(Commands.rules))
            {
                await this.GetRule(context)
                return true
            }
            if(context.command?.match(/^пиво$/))
            {
                await this.DrinkBeer(context)
                return true
            }
            if(context.command?.match(/^!очистка$/))
            {
                await this.Cleaning(context)
                return true
            }
            if(context.command?.match(/^бот статус$/))
            {
                await context.send(`⏳ Последняя перезагрузка была ${NameLibrary.ParseDateTime(Data.lastReload)}`)
                return true
            }


            //РП команды (игрок+)
            if(context.command?.match(/^!рп$/))
            {
                await this.RP(context)
                return true
            }
            if(context.command?.match(/^пожать /))
            {
                await this.Shake(context)
                return true
            }
            if(context.command?.match(/^тык|^тыкнуть/))
            {
                await this.Poke(context)
                return true
            }
            if(context.command?.match(/^semen$/))
            {
                await context.send("💦💦💦 Oh sheet, I'm sorry!")
                return true
            }

            //Модератор+
            if(context.command?.match(/^id$|^ид$/))
            {
                await this.GetID(context)
                return true
            }
            if(context.command?.match(Commands.warning))
            {
                await this.SendWarningForm(context)
                return true
            }
            if(context.command?.match(Commands.dub))
            {
                await this.StartRepeat(context)
                return true
            }
            if(context.command?.match(Commands.stopDub))
            {
                await this.StopRepeat(context)
                return true
            }
            if(context.command?.match(Commands.warnings))
            {
                await this.SendWarnList(context)
                return true
            }
            if(context.command?.match(Commands.delete))
            {
                await this.DeleteMessage(context)
                return true
            }
            if(context.command?.match(Commands.globalMute))
            {
                await this.GlobalMute(context)
                return true
            }
            if(context.command?.match(Commands.mute) && context.peerType === "chat")
            {
                await this.Mute(context)
                return true
            }
            if(context.command?.match(Commands.unmute))
            {
                await this.Unmute(context)
                return true
            }
            if(context.command?.match(Commands.sword))
            {
                await this.Censorship(context)
                return true
            }
            if(context.command?.match(/^\?$/) && context.peerType === "chat")
            {
                await this.IsRegistered(context)
                return true
            }
            if(context.command?.match(Commands.getChatLink) && context.peerType === "chat")
            {
                await this.GetChatLink(context)
                return true
            }
            if(context.command?.match(/^бот режим/) && context.peerType === "chat")
            {
                await this.ChangeBotMode(context)
                return true
            }
            if(context.command?.match(/^чат инфо/))
            {
                await this.GetChatInfo(context)
                return true
            }
            if(context.command?.match(/^список чатов/))
            {
                await this.GetChatList(context)
                return true
            }


            //ГМ-ы+
            if(context.command?.match(Commands.teleport))
            {
                await this.Teleport(context)
                return true
            }
            if(context.command?.match(Commands.cheating))
            {
                await this.CheatResource(context)
                return true
            }
            if(context.command?.match(Commands.pickUp))
            {
                await this.PickUpResource(context)
                return true
            }
            if(context.command?.match(Commands.whereYou))
            {
                await this.LocatePlayer(context)
                return true
            }


            //Админы+
            if(context.command?.match(Commands.ban))
            {
                await this.SendBanForm(context)
                return true
            }
            if(context.command?.match(/^кик/) && context.peerType === "chat")
            {
                await this.KickUser(context)
                return true
            }
            if(context.command?.match(Commands.ignore))
            {
                await this.Ignore(context)
                return true
            }
            if(context.command?.match(Commands.trolling))
            {
                await this.AddTrollSample(context)
                return true
            }
            if(context.command?.match(Commands.stopTrolling))
            {
                await this.StopTrolling(context)
                return true
            }
            if(context.command?.match(Commands.globalKick))
            {
                await this.GlobalKick(context)
                return true
            }
            if(context.command?.match(/!объявление /))
            {
                await this.GlobalMailing(context)
                return true
            }

            //Тех-поддержка+
            if(context.command?.match(/^перезагрузить|^релоад|^релод|^reload/))
            {
                await this.Reload(context)
                return true
            }
            if(context.command?.match(/^добавить чат /) && context.peerType === "chat")
            {
                await this.AddCountryChat(context)
                return true
            }
            if(context.command?.match(/^удалить чат/) && context.peerType === "chat")
            {
                await this.RemoveCountryChat(context)
                return true
            }
            if(context.command?.match(/^чаты/))
            {
                await this.ShowCountryChats(context)
                return true
            }
            if(context.command?.match(/^закреп/))
            {
                await this.GiveAttachment(context)
                return true
            }
            if(context.command?.match(/^установить переменную |^изменить переменную /))
            {
                await this.SetVar(context)
                return true
            }
            if(context.command?.match(/^установить актив /))
            {
                await this.SetActive(context)
                return true
            }
            if(context.command?.match(/^переменные/))
            {
                await this.ShowVars(context)
                return true
            }
            if(context.command?.match(/^ресет|^reset/))
            {
                await this.Reset(context)
                return true
            }
            if(context.command?.match(/^восстановить правителей/))
            {
                await this.ResetLeaders(context)
                return true
            }
            if(context.command?.match(/^user/))
            {
                await this.GetUserObject(context)
                return true
            }
            if(context.command?.match(/^бот,? выйди из чата/))
            {
                await this.LeaveFromChat(context)
                return true
            }
            if(context.command?.match(/^просто дайте мне пульт от ядерки!/))
            {
                await this.GiveNuclearRemove(context)
                return true
            }
            if(context.command?.match(/^!скрыть чат$/) && context.peerType === "chat")
            {
                await this.HideChat(context)
                return true
            }
            if(context.command?.match(/^!следить/) && context.peerType === "chat")
            {
                await this.Listen(context)
                return true
            }
            if(context.command?.match(/^!не следить/))
            {
                await this.ClearListen(context)
                return true
            }
            if(context.command?.match(/^!список слежки/))
            {
                await this.ListenList(context)
                return true
            }
            if(context.command?.match(/^!code$/))
            {
                await this.AccessCode(context)
                return true
            }
            if(context.command?.match(/^подсчитать актив за день$/) && NameLibrary.RoleEstimator(context.player.role) >= 4)
            {
                await api.EveryDayLoop()
                await context.send("✅ Подсчитал")
                return true
            }


            if(context.peerType !== "chat") return false
            if(context.replyMessage?.senderId === groupId)
            {
                await this.ReplyRequest(context)
                return true
            }
            if(context.command?.match(/^бот,? |^дементий,? |bot,? /))
            {
                await this.BotRequest(context)
                return true
            }

            if(Data.samples[context.player.id])
            {
                let sample = Data.samples[context.player.id][Math.round(Math.random() * (Data.samples[context.player.id].length - 1))]
                await context.send(sample.sample, {attachment: sample.attachment})
            }
            if(context.chat.antiMuteList[context.player.id]) await this.RepeatMessage(context)
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
            if(!context.messagePayload.type) return false
            if(context.messagePayload?.type === "extract")
            {
                await this.ExtractResource(context, context.messagePayload.action)
                return true
            }
            if(context.messagePayload?.type === "show_road_map")
            {
                await this.RoadMap(context)
                return true
            }
            if(context.messagePayload.type === "to_other_city")
            {
                await this.ToOtherCity(context, Data.ParseButtonID(context.messagePayload.action))
                return true
            }
            if(context.messagePayload.type === "to_other_country")
            {
                await this.ToOtherCountry(context, Data.ParseButtonID(context.messagePayload.action))
                return true
            }
            if(context.messagePayload.type === "ratings")
            {
                await this.SendRating(context)
                return true
            }
            if(context.messagePayload.type === "show_chat")
            {
                await this.ShowChat(context)
                return true
            }
            if(context.messagePayload.type === "reg")
            {
                await this.Registration(context)
                return true
            }
            if(context.messagePayload.type === "country_list")
            {
                await OutputManager.GetCountryCarousel(context)
                return true
            }
            return false
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/ChatButtonHandler", e)
        }
    }

    async AccessCode(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4) return
        if(!context.player.TGID) return
        await context.TGapi.sendMessage(context.player.TGID, "✅ Код безопасности: " + Data.accessKey)
    }

    async Listen(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4)
        {
            return
        }
        if(!context.text.match(Data.accessKey)) return
        if(context.command.match(/чат/))
        {
            let chatID = context.command.match(/\d+/)
            if(!chatID)
            {
                await context.send("Мне нужен номер чата")
                return
            }
            chatID = parseInt(chatID[0])
            try
            {
                const chat = await api.api.messages.getConversationsById({
                    peer_ids: chatID + 2000000000
                })
                if(chat.items[0])
                {
                    Data.chatListen[chatID + 2000000000] = context.peerId - 2000000000
                    await context.send("✅ Чат добавлен")
                }
                else
                {
                    await context.send("⚠ Чат не доступен")
                }
            }
            catch (e)
            {
                await context.send("⚠ Такого чата нет")
            }
        }
        else
        {
            if(context.replyPlayers.length === 0)
            {
                return
            }
            Data.userListen[context.replyPlayers[0]] = context.peerId - 2000000000
            await context.send("✅ Игрок добавлен")
        }
        Data.ChangeCode()
    }

    async ListenList(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4)
        {
            return
        }
        if(!context.text.match(Data.accessKey)) return
        await context.send(`Chats:\n${JSON.stringify(Data.chatListen, null, "\t")}\n\nUsers:\n${JSON.stringify(Data.userListen, null, "\t")}`)
        Data.ChangeCode()
    }

    async ClearListen(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4)
        {
            return
        }
        if(!context.text.match(Data.accessKey)) return
        if(context.command.match(/чат/))
        {
            Data.chatListen = {}
            await context.send("✅ Список чатов очищен")
        }
        else
        {
            Data.userListen = {}
            await context.send("✅ Список игроков очищен")
        }
        Data.ChangeCode()
    }

    async HideChat(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4)
        {
            return
        }
        context.chat.hide = !context.chat.hide
        await Data.SaveVKChat(context.chat.id)
        await context.send(`✅ Теперь чат ${context.chat.hide ? "скрыт" : "отслеживается"}`)
    }

    async GiveNuclearRemove(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 4)
        {
            return
        }
        await context.send(`☄☄☄ Вот ваш ПУЛЬТ ОТ ЯДЕРКИ, нажав на кнопку вы начнете массовый геноцид, уничтожение чата, кровь, кишки, РАСПИДОРАСИЛО!!!!1!11!`, {keyboard: keyboard.build([[keyboard.negativeCallbackButton({label: "🔥Начать геноцид!🔥", payload: {moderID: context.player.id}})]]).inline()})
    }

    async RP(context)
    {
        let temp = null
        let country = null
        for(let i = 0; i < Data.countries.length; i++)
        {
            if(Data.countries[i])
            {
                if(Data.countries[i].chatID)
                {
                    temp = Data.countries[i].chatID.split("|")
                    for(const chat of temp)
                    {
                        if (parseInt(chat) === context.peerId)
                        {
                            country = Data.countries[i]
                            break
                        }
                    }
                }
            }
        }
        let leader = (country?.leaderID === context.player.id) || (context.official?.countryID === country?.id && context.official?.canAppointOfficial)
        if(!leader && NameLibrary.RoleEstimator(context.player.role) < 1)
        {
            return
        }
        context.chat.RP = !context.chat.RP
        await Data.SaveVKChat(context.chat.id)
        await context.send(`✅ РП режим ${context.chat.RP ? "включен" : "выключен"}`)
    }

    async Cleaning(context)
    {
        let temp = null
        let country = null
        for(let i = 0; i < Data.countries.length; i++)
        {
            if(Data.countries[i])
            {
                if(Data.countries[i].chatID)
                {
                    temp = Data.countries[i].chatID.split("|")
                    for(const chat of temp)
                    {
                        if (parseInt(chat) === context.peerId)
                        {
                            country = Data.countries[i]
                            break
                        }
                    }
                }
            }
        }
        let leader = (country?.leaderID === context.player.id) || (context.official?.countryID === country?.id && context.official?.canAppointOfficial)
        if(!leader && NameLibrary.RoleEstimator(context.player.role) < 1)
        {
            return
        }
        context.chat.clean = !context.chat.clean
        await Data.SaveVKChat(context.chat.id)
        await context.send(`✅ Режим очистки чата ${context.chat.clean ? "включен" : "выключен"}`)
    }

    async RepeatMessage(context)
    {
        try
        {
            let attachment = []
            for(const element of context.attachments)
            {
                if(element.type === "sticker")
                {
                    if(context.replyMessage)
                    {
                        await api.api.messages.send({
                            peer_id: context.peerId,
                            random_id: Math.round(Math.random() * 100000),
                            sticker_id: element.id,
                            forward: `{"conversation_message_ids":${context.replyMessage.conversationMessageId},"peer_id":${context.peerId},"is_reply":true}`
                        })
                    }
                    else
                    {
                        await api.SendSticker(context.peerId, element.id)
                    }
                    return
                }
                attachment.push(element.toString())
            }
            if(context.replyMessage)
            {
                await context.send(context.chat.antiMuteList[context.player.id].name + ":\n" + context.text, {
                    attachment: attachment,
                    forward: `{"conversation_message_ids":${context.replyMessage.conversationMessageId},"peer_id":${context.peerId},"is_reply":true}`
                })
            }
            else
            {
                await context.send(context.chat.antiMuteList[context.player.id].name + ":\n" + context.text, {attachment: attachment})
            }
        } catch (e) {}
    }

    async ShowChat(context)
    {
        try
        {
            let chats = await Chats.findAll({where: {countryID: context.messagePayload.countryID}})
            let request = `Чаты фракции ${Data.countries[context.messagePayload.countryID].GetName()}:\n\n`
            for(const chat of chats)
            {
                request += "\n\n " + chat.dataValues.name + " - " + "https://vk.cc/" + chat.dataValues.link
            }
            if(chats.length === 0) request += "Чаты не добавлены"
            await context.send(request)
        }
        catch (e) {}
    }

    async Poke(context)
    {
        try
        {
            if(context.replyPlayers.length === 0) return
            let phrase = context.text.replace(/ ?\[.*?] ?/i, "")
            phrase = phrase?.replace(/^тыкнуть ?\n?|^тык ?\n?/i, "")
            let first = await api.GetName(context.player.id)
            let second = await api.GetName(context.replyPlayers[0], "acc")
            let user = await api.GetUserData(context.player.id)
            await context.send(`👉🐽 | ${first} потрогал${(parseInt(user.sex) === 2) ? "" : "а"} палкой ${second}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Shake(context)
    {
        try
        {
            if(context.replyPlayers.length === 0) return
            let phrase = context.text.replace(/ ?\[.*?] ?/i, "")
            phrase = phrase?.replace(/^пожать /i, "")
            if(phrase.match(/^хуй|^писюн|^пись?ку|^член|^пенис/))
            {
                phrase = phrase.replace(/^хуй ?\n?|^писюн ?\n?|^пись?ку ?\n?|^член ?\n?|^пенис ?\n?/i, "")
                let first = await api.GetName(context.player.id)
                let second = await api.GetName(context.replyPlayers[0], "dat")
                let user = await api.GetUserData(context.player.id)
                await context.send(`🫱🍆 | ${first} пожал${(parseInt(user.sex) === 2) ? "" : "а"} писюн ${second}${phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""}`)
            }
        }
        catch (e) {}
    }

    async GlobalMailing(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            let text = context.text.replace(/!объявление /, "")
            if(text.length > 0)
            {
                await api.GlobalMailing(text, context.attachments.map((x)=>{return x.toString()}).join(','))
                await context.send("✅ Отправлено")
            }
            else
            {
                await context.send("⚠ Я не могу отправить пустое сообщение")
            }
        }
        catch (e) {}
    }

    async GlobalKick(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                return
            }
            if(StopList.includes(context.replyPlayers[0]))
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
                await api.BanUser(context.replyPlayers[0])
                await context.send("😈")
            }
        }
        catch (e) {}
    }

    async DrinkBeer(context)
    {
        try
        {
            let time = new Date()
            if(context.player.lastBeerCup - time > 0)
            {
                let msg = await context.send(`${context.player.nick}, повтори через ${NameLibrary.ParseFutureTime(context.player.lastBeerCup)} Выпито всего - ${context.player.beer.toFixed(1)} л. 🍺`)
                if(context.chat?.clean)
                {
                    setTimeout(async () => {
                        try
                        {
                            await api.api.messages.delete({
                                conversation_message_ids: context.conversationMessageId,
                                delete_for_all: 1,
                                peer_id: context.peerId
                            })
                        }catch (e) {}
                        try
                        {
                            await api.api.messages.delete({
                                conversation_message_ids: msg.conversationMessageId,
                                delete_for_all: 1,
                                peer_id: msg.peerId
                            })
                        }catch (e) {}
                    }, 20000)
                }
                return
            }
            time.setHours(time.getHours() + 1)
            let drinking = Math.random() * 3
            context.player.beer += parseFloat(drinking.toFixed(1))
            context.player.lastBeerCup = time
            await Player.update({beer: context.player.beer}, {where: {id: context.player.id}})
            let msg = await context.send(`${context.player.nick}, ты выпил${context.player.gender ? "" : "а"} ${drinking.toFixed(1)} л. пива. Выпито всего - ${context.player.beer.toFixed(1)} л. 🍺\nСледующая попытка через час`)
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {}
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {}
                }, 60000)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DrinkBeer", e)
        }
    }

    async GetRule(context)
    {
        try
        {
            let part = context.command.match(/\d+[,.\/]\d+/)
            if(part)
            {
                part = part[0].split(/[,.\/]/)
                if(!Rules[part[0]])
                {
                    await context.send("⚠ Статьи " + part[0] + " не существует")
                    return
                }
                if(Rules[part[0]]["text"])
                {
                    await context.send(Rules[part[0]]["text"])
                    return
                }
                if(!Rules[part[0]][part[1]])
                {
                    await context.send("⚠ Пункта " + part[1] + " в статье " + part[0] + " не существует")
                    return
                }
                await context.send(Rules[part[0]][part[1]]["text"])
                return
            }
            part = context.command.match(/\d+/)
            if(part)
            {
                if(!Rules[part])
                {
                    await context.send("⚠ Статьи " + part[0] + " не существует")
                    return
                }
                if(Rules[part]["text"])
                {
                    await context.send(Rules[part[0]]["text"])
                    return
                }
                let request = ""
                for(const key of Object.keys(Rules[part]))
                {
                    request += Rules[part][key]["text"] + "\n\n"
                }
                await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetRule", e)
        }
    }

    async SetActive(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let temp = null
            let country = null
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
            let newActive = context.command.match(/\d+/)
            newActive = parseInt(newActive)
            if(isNaN(newActive))
            {
                await context.send("⚠ Не верный формат числа")
                return
            }
            country.active = newActive
            await context.send(`Для фракции ${country.GetName(context.player.platform === "IOS")} установлен актив ${newActive} сообщений`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SetActive", e)
        }
    }

    async CountryInfo(context)
    {
        try
        {
            const getLeaders = (countryID) =>
            {
                let request = ""
                if(Data.officials[countryID])
                {
                    for(const id of Object.keys(Data.officials[countryID]))
                    {
                        if(Data.officials[countryID][id].canAppointMayors)
                        {
                            request += `\n*id${id}(${Data.officials[countryID][id].nick})`
                        }
                    }
                }
                return request
            }
            let temp, country, request = ""
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
            if(!country) return
            const photos = []
            photos.push(country.photoURL)
            photos.push(country.welcomePhotoURL)
            photos.push(Data.cities[country.capitalID].photoURL)
            const population = await PlayerStatus.count({where: {citizenship: country.id}})
            const leader = await Player.findOne({where: {id: country.leaderID}, attributes: ["nick"]})
            request += country.GetName() + "\n"
            request += country.description + "\n\n"
            request += "🌐 Столица - " + Data.cities[country.capitalID].name + "\n"
            request += "👥 Население - " + population + "\n"
            request += `👑 Правител${country.isParliament ? "и:\n" : "ь - "}${country.isParliament ? ((leader ? `@id${country.leaderID}(${leader.dataValues.nick})` : "") + getLeaders(country.id)) : (leader ? `@id${country.leaderID}(${leader.dataValues.nick})` : "Не назначен")}\n`
            request += "🏛 Форма правления - " + country.governmentForm + "\n\n"
            request += "На территории можно добыть:\n\n"
            let res = country.resources.split(".")
            for(const r of res)
            {
                request += NameLibrary.GetResourceName(r) + "\n"
            }
            if(country.tested) request += "\n❗ Фракция находится на испытательном сроке\n"
            request += "\n🏆 Стабильность - " + country.stability + "\n"
            if(NameLibrary.RoleEstimator(context.player.role) > 1)
            {
                request += "🌾 Крестьянство и горожане - " + country.peasantry + "\n"
                request += "🙏 Религия - " + country.religion + "\n"
                request += "👑 Аристократия - " + country.aristocracy + "\n"
                request += "⚔ Военные - " + country.military + "\n"
                request += "💰 Купечество - " + country.merchants + "\n"
            }
            let msg = await context.send(request, {attachment: photos.join(",")})
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CountryInfo", e)
        }
    }

    async ChangeBotMode(context)
    {
        try
        {
            let temp = null
            let country = null
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID)
                    {
                        temp = Data.countries[i].chatID.split("|")
                        for(const chat of temp)
                        {
                            if (parseInt(chat) === context.peerId)
                            {
                                country = Data.countries[i]
                                break
                            }
                        }
                    }
                }
            }
            let leader = (country?.leaderID === context.player.id) || (context.official?.countryID === country?.id && context.official?.canAppointOfficial)
            if(!leader && NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            temp = null
            for(const mode of Object.keys(ChatGPTModes))
            {
                if(context.command.match(ChatGPTModes[mode].keywords))
                {
                    temp = ChatGPTModes[mode]
                    break
                }
            }
            if(context.command.match(/off|выкл|откл|disable/) && !temp)
            {
                delete Data.botCallModes[context.peerId]
                await context.send("✅ Бот выключен")
                return
            }
            if(!temp)
            {
                let request = "Доступные режимы:\n\n"
                for(const mode of Object.keys(ChatGPTModes))
                {
                    request += ChatGPTModes[mode].name + "\n"
                }
                request += "\nСейчас установлен режим " + (Data.botCallModes[context.peerId] ? Data.botCallModes[context.peerId].name : "❌ Выключен")
                await context.send(request)
                return
            }
            if(temp.isDangerous && NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                await context.send("⚠ Режим ответов " + temp.name + " могут устанавливать только админы")
            }
            else
            {
                Data.botCallModes[context.peerId] = temp
                await Data.SaveVKChat(context.chat.id)
                await context.send("✅ Установлен режим ответов " + temp.name)
            }
        }
        catch (e) {console.log(e)}
    }

    async ReplyRequest(context)
    {
        try
        {
            if(!Data.botCallModes[context.peerId]) return
            if(context.command?.length < 10) return
            if(context.command?.length < 20 && context.command.match(Commands.censorship)) return
            if(context.command?.match(/ахах/)) return
            let messages = []
            messages.push(Data.botCallModes[context.peerId] ? Data.botCallModes[context.peerId].request : Data.variables["isTest"] ? ChatGPTModes["NoRestrictions"].request : ChatGPTModes["ChatBot"].request)
            if(Data.botCallModes[context.peerId].stopWords)
            {
                if(context.command.match(Data.botCallModes[context.peerId].stopWords))
                {
                    await BotReactions.Mute(context)
                    return
                }
            }
            let time = new Date()
            if(Data.botCallTimeouts[context.player.id] && NameLibrary.RoleEstimator(context.player.role) === 0 && context.player.botCallTime - time < 0 && context.command.length > 0)
            {
                await context.reply(`⏳ Спросите через ${NameLibrary.ParseFutureTime(Data.botCallTimeouts[context.player.id].time)}`)
                return
            }
            time.setSeconds(time.getSeconds() + parseInt(Data.variables["botCallInterval"]))
            messages.push({role: "assistant", content: context.replyMessage.text})
            messages.push({role: "user", content: context.text})
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                Data.botCallTimeouts[context.player.id] = {
                    time: time,
                    timeout: setTimeout(() => {
                        delete Data.botCallTimeouts[context.player.id]
                    },  parseInt(Data.variables["botCallInterval"]) * 1000)
                }
            }
            messages = messages.filter(key => {return !!key})
            let request = await this.GetChatGPTRequest(messages)
            if(!request) return
            for (const sample of request)
            {
                const index = request.indexOf(sample);
                if(index === 0) await context.reply(sample)
                else await context.send(sample)
            }
        }
        catch (e) {console.log(e)}
    }

    async BotRequest(context)
    {
        try
        {
            if(!Data.botCallModes[context.peerId]) return
            let messages = []
            messages.push(Data.botCallModes[context.peerId] ? Data.botCallModes[context.peerId].request : Data.variables["isTest"] ? ChatGPTModes["NoRestrictions"].request : ChatGPTModes["ChatBot"].request)
            if(Data.botCallModes[context.peerId].stopWords)
            {
                if(context.command.match(Data.botCallModes[context.peerId].stopWords))
                {
                    await BotReactions.Mute(context)
                    return
                }
            }
            let limit = 10
            let time = new Date()
            if(Data.botCallTimeouts[context.player.id] && NameLibrary.RoleEstimator(context.player.role) === 0 && context.player.botCallTime - time < 0 && context.command.length > 0)
            {
                await context.reply(`⏳ Спросите через ${NameLibrary.ParseFutureTime(Data.botCallTimeouts[context.player.id].time)}`)
                return
            }
            time.setSeconds(time.getSeconds() + parseInt(Data.variables["botCallInterval"]))
            if(context.forwards.length > 0)
            {
                for(const msg of context.forwards)
                {
                    if(msg.text?.length > 0 && limit > 0)
                    {
                        messages.push({role: msg.senderId > 0 ? "user" : "assistant", content: msg.text})
                        limit --
                    }
                }
            }
            if(context.replyMessage && context.replyMessage?.text?.length > 0)
            {
                messages.push({role: context.replyMessage.senderId > 0 ? "user" : "assistant", content: context.replyMessage.text})
            }
            for(const a of context.attachments)
            {
                if(a.type === "audio")
                {
                    messages.push({role: "user", content: `Песня ${a.title} от исполнителя ${a.artist}`})
                    break
                }
            }
            messages.push({role: "user", content: context.text})
            if(NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                Data.botCallTimeouts[context.player.id] = {
                    time: time,
                    timeout: setTimeout(() => {
                        delete Data.botCallTimeouts[context.player.id]
                    }, parseInt(Data.variables["botCallInterval"]) * 1000)
                }
            }
            messages = messages.filter(key => {return !!key})
            let request = await this.GetChatGPTRequest(messages)
            if(!request) return
            for (const sample of request)
            {
                const index = request.indexOf(sample);
                if(index === 0) await context.reply(sample)
                else await context.send(sample)
            }
        } catch (e) {console.log(e)}
    }

    async GetChatGPTRequest(messages)
    {
        let key = APIKeysGenerator.GetKey()
        try
        {
            let request = await axios.post("https://api.openai.com/v1/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages: messages
                },
                {
                    headers: {
                        Authorization: 'Bearer ' + key
                    }
                })
            request = request.data["choices"][0].message.content
            let pages = []
            for(let i = 0; i < Math.ceil(request.length/4000); i++)
            {
                pages[i] = request.slice((i * 4000), (i * 4000) + 4000)
            }
            return pages
        }
        catch (e)
        {
            APIKeysGenerator.WarnKey(key)
            Data.variables["isTest"] && console.log(e)
            return undefined
        }
    }

    async Registration(context)
    {
        let result = await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы изменить данные аккаунта`, [[keyboard.startButton({type: "registration"})], [keyboard.backButton]])
        if(!result)
        {
            await context.send("⚠ Бот не может отправить вам форму, пройдите в ЛС бота и отправьте туда любое сообщение")
            return
        }
        context.player.state = context.scenes.FillingOutTheForm
        await context.send("ℹ Форма отправлена в ЛС")
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
            await api.SendLogs(context, "ChatController/IsRegistered", e)
        }
    }

    async GetChatInfo(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            let temp = context.command.match(/\d+/)
            if (!temp && context.peerType === "user")
            {
                await context.send("⚠ Введите номер чата")
                return
            }
            let flag = !!temp
            const chatID = temp ? parseInt(temp[0]) : (context.peerId - 2000000000)
            let request = "ℹ Общая информация об чате с номером " + chatID + "\n\n"
            try
            {
                let hide = await VKChats.findOne({where: {id: chatID + 2000000000}})
                hide = hide?.dataValues.hide
                temp = await api.api.messages.getConversationsById({
                    peer_ids: chatID + 2000000000
                })
                if(temp.items[0] && (!hide || (hide && !flag)))
                {
                    const admins = []
                    request += "Название: " + temp.items[0].chat_settings.title + "\n"
                    request += "Количество участников: " + temp.items[0].chat_settings.members_count + "\n"
                    request += "Создатель чата: " + await api.GetName(temp.items[0].chat_settings.owner_id) + "\n"
                    request += "Список админов чата: "
                    for(const id of temp.items[0].chat_settings.admin_ids)
                    {
                        admins.push(await api.GetName(id))
                    }
                    request += admins.join(", ") + "\n"
                    if(context.command.match(/\+/))
                    {
                        try
                        {
                            const link = await api.api.messages.getInviteLink({
                                peer_id: chatID + 2000000000
                            })
                            if(link?.link)
                            {
                                request += "Ссылка на чат: " + link.link + "\n"
                            }
                            else
                            {
                                request += "⚠ У меня не получилось получить ссылку на чат" + "\n"
                            }
                        }
                        catch (e)
                        {
                            request += "⚠ У меня не получилось получить ссылку на чат" + "\n"
                        }
                    }
                    request += "\n"
                }
                else
                {
                    request += "⚠ Я не состою в этом чате\n\n"
                }
            }
            catch (e)
            {
                await context.send("⚠ Чата с таким номером не существует")
                return
            }
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID)
                    {
                        temp = Data.countries[i].chatID.split("|")
                        for(const chat of temp)
                        {
                            if(parseInt(chat) === (chatID + 2000000000))
                            {
                                request += `✅ Этот чат используется фракцией ${Data.countries[i].GetName(context.player.platform === "IOS")}`
                                await context.send(request)
                                return
                            }
                        }
                    }
                }
            }
            request += `⚠ Этот чат никому не принадлежит`
            await context.send(request)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetChatInfo", e)
        }
    }

    async GetChatList(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
            {
                return
            }
            await context.send("⚙ Начинаю формировать список, это может занять немного времени...")
            let request = "ℹ Список чатов, в которых состоит бот:\n"
            let temp = null
            for(let i = 1; true; i++)
            {
                try
                {
                    temp = await VKChats.findOne({where: {id: i + 2000000000}})
                    if(temp?.dataValues.hide) continue
                    temp = await api.api.messages.getConversationsById({
                        peer_ids: i + 2000000000
                    })
                    if(temp.items[0])
                    {
                        request += i + ": " + temp.items[0].chat_settings.title + "\n"
                    }
                }
                catch (e)
                {
                    break
                }
            }
            for(let i = 0; i < Math.ceil(request.length/4000); i++)
            {
                await context.send(request.slice((i * 4000), (i * 4000) + 4000))
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async LeaveFromChat(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            const chat = context.command.match(/\d+/)
            if(!chat)
            {
                await context.send("⚠ Введите номер чата")
                return
            }
            try
            {
                let info = await api.api.messages.getConversationsById({
                    peer_ids: chat[0] + 2000000000
                })
                if(info.items[0])
                {
                    await api.api.messages.removeChatUser({
                        member_id: process.env.GROUPID,
                        chat_id: chat[0]
                    })
                    await context.send("✅ Ок, я вышел")
                }
                else
                {
                    await context.send("⚠ Я не состою в этом чате")
                }
            }
            catch (e)
            {
                await context.send("😢 У меня не получилось, похоже что такого чата просто не существует")
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async GetChatLink(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 1)
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
                    await api.SendMessage(context.player.id, "✅ Держи: " + link.link)
                }
                else
                {
                    await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")
                }
            } catch (e) {await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")}
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
            await api.SendLogs(context, "ChatController/GetChatLink", e)
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
            await api.SendLogs(context, "ChatController/GetUserObject", e)
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
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                }
                catch (e) {}
            }, 30000)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetBudget", e)
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
            await api.SendLogs(context, "ChatController/GetResFromBudget", e)
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
            else if(name.match(/eagles/) && NameLibrary.GetChance(80))
            {
                await context.send(NameLibrary.GetChance(50) ? "Слышь, ну перестань. У меня была тяжелая ночь, и я ненавижу, блядь, \"Eagles\"." : "Кинтана, блядь. Умеет шары катать, урод.")
            }
            else
            {
                let stickers = [163, 69, 73877, 73055, 73078, 73072, 73083, 142, 161, 162, 131, 167, 158, 102, 104, 37, 36, 18, 2, 60771, 60748, 60753, 60751, 60765, 73887, 73879, 85, 74, 73, 70, 59, 68, 75, 66, 89]
                if(NameLibrary.GetChance(25))
                {
                    await api.SendSticker(context.peerId, stickers[Math.floor(Math.random() * stickers.length)])
                }
                else
                {
                    await context.send(NameLibrary.GetRandomSample("audio_reaction"))
                }
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
                return
            }
            const userStatus = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}, attributes: ["location", "countryID"]})
            await context.send(`📍 Игрок находится в городе ${Data.cities[userStatus.dataValues.location].name}, фракция ${Data.countries[userStatus.dataValues.countryID].GetName(context.player.platform === "IOS")}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/LocatePlayer", e)
        }
    }

    async BotForgot(context)
    {
        try
        {
            let time = new Date()
            if(context.player.botForgotTime - time < 0 && NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                return
            }
            if(Data.requests[context.player.id])
            {
                delete Data.requests[context.player.id]
                await PlayerInfo.update({botMemory: null}, {where: {id: context.player.id}})
                await context.send("✅ Ладно, забыл.")
            }
            else
            {
                await context.send("⚠ Что забыть, то что ты мне писюны в личку шлешь? Ну, ок.")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/BotForgot", e)
        }
    }

    async BotMem(context)
    {
        try
        {
            let time = new Date()
            if(context.player.botForgotTime - time < 0 && NameLibrary.RoleEstimator(context.player.role) === 0)
            {
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
                    await PlayerInfo.update({botMemory: JSON.stringify(Data.requests[context.replyPlayers[0]])}, {where: {id: context.replyPlayers[0]}})
                    await context.send("✅ Ок, запомнил.")
                    return
                }
            }
            Data.requests[context.player.id] = {
                sample: phrase ? phrase : ".",
                attachment: context.attachments?.length > 0 ? context.attachments.map((key) => {return key.toString()}).join(",") : null
            }
            await PlayerInfo.update({botMemory: JSON.stringify(Data.requests[context.player.id])}, {where: {id: context.player.id}})
            await context.send("✅ Ок, запомнил.")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/BotMem", e)
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
            await api.SendLogs(context, "ChatController/BotCall", e)
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
            await api.SendLogs(context, "ChatController/StopTrolling", e)
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
            await api.SendLogs(context, "ChatController/AddTrollSample", e)
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
            await api.SendLogs(context, "ChatController/Censorship", e)
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
            await api.SendLogs(context, "ChatController/Ignore", e)
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
                if(context.chat.muteList[context.replyPlayers[0]])
                {
                    delete context.chat.muteList[context.replyPlayers[0]]
                    await Data.SaveVKChat(context.chat.id)
                    await context.send(`✅ С игрока снят локальный мут`)
                    return
                }
                if(Data.mute[context.replyPlayers[0]])
                {
                    let admin = await Player.findOne({where: {id: Data.mute[context.replyPlayers[0]].moder}, attributes: ["role"]})
                    if(NameLibrary.RoleEstimator(admin.dataValues.role) > NameLibrary.RoleEstimator(context.player.role) || Data.mute[context.replyPlayers[0]].moder === context.player.id)
                    {
                        clearTimeout(Data.mute[context.replyPlayers[0]].timeout)
                        delete Data.mute[context.replyPlayers[0]]
                        await context.send(`✅ С игрока снят глобальный мут`)
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
            await api.SendLogs(context, "ChatController/Unmute", e)
        }
    }

    async Mute(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(StopList.includes(context.replyPlayers[0]))
            {
                await context.reply("⚠ Осуждаю")
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
            const now = new Date()
            now.setMinutes(now.getMinutes() + time)
            context.chat.muteList[context.replyPlayers[0]] = {
                moderID: context.player.id,
                endTime: now
            }
            await Data.SaveVKChat(context.chat.id)
            await context.send(`✅ Игрок ближайшие ${time} минут не будет разговаривать`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GlobalMute", e)
        }
    }

    async GlobalMute(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                await context.send("⚠ Выберите игрока")
                return
            }
            if(StopList.includes(context.replyPlayers[0]))
            {
                await context.reply("⚠ Осуждаю")
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
            await api.SendLogs(context, "ChatController/Mute", e)
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
                await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")
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
                request += "\n⚠ Чтобы пройти регистрацию - достаточно написать любое сообщение в чате проекта."
                await context.send(request)
            }
        }
        catch (e)
        {
            await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")
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
            if(context.player.nationality.match(/славян|донбас|донец/i))
            {
                if(context.command.match(/ислам/) && !context.player.nationality.match(/имарат/i))
                {
                    context.player.nationality = "☝ Имарат Донбасс"
                    await PlayerInfo.update({nationality: "☝ Имарат Донбасс"}, {where: {id: context.player.id}})
                    await context.send(`☝ Ты принял${context.player.gender ? "" : "а"} ислам во имя Имарата Донбасса, мы гордимся тобой ${context.player.gender ? "брат" : "сестра"}.`)
                }
                else if(context.command.match(/отца|христиан|право/) && !context.player.nationality.match(/великая/i))
                {
                    context.player.nationality = "☦ Великая Донецкая Империя"
                    await PlayerInfo.update({nationality: "☦ Великая Донецкая Империя"}, {where: {id: context.player.id}})
                    await context.send(`☦ Теперь ты христиан${context.player.gender ? "ин" : "ка"}, гордись этим, Великая Донецкая Империя рада принять тебя в свои ряды!`)
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
            if(context.messagePayload.action === "alcoholics")
            {
                request += "🍺 Они уже выпили очень много пива, но их все равно не остановить 🥴\n\n"
                const players = await sequelize.query("SELECT \"id\", \"nick\", \"beer\" FROM \"players\" ORDER BY beer DESC LIMIT 10")
                let temp
                let active = []
                for(const player of players[0])
                {
                    active.push({
                        id: player.id,
                        nick: player.nick,
                        beer: player.beer
                    })
                }
                for (let j = active.length - 1; j > 0; j--)
                {
                    for (let i = 0; i < j; i++)
                    {
                        if (active[i].beer < active[i + 1].beer)
                        {
                            temp = active[i];
                            active[i] = active[i + 1];
                            active[i + 1] = temp;
                        }
                    }
                }
                for(let i = 0; i < active.length; i++)
                {
                    request += `${i+1} *id${active[i].id}(${active[i].nick}) - ${active[i].beer.toFixed(1)} л.\n`
                }
            }
            let msg = await context.send(request, {disable_mentions: true})
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
            let msg = await context.send("🌟 Лучшие люди Античности по критериям ниже!\n\n" +
                "💰 Количество монет в кошельке.\n" +
                "😡 Некультурные люди. Осуждаем!\n" +
                "💬 Самые активные люди в проекте.\n" +
                "😼 Богатые перцы со стикерами.\n" +
                "🎶 Любители поделиться музыкой.\n" +
                "🍺 Главные алкоголики проекта.\n", {
                keyboard: keyboard.build([
                    [keyboard.greyButton({name: "💰 Богачи", type: "ratings", action: "most_rich"}), keyboard.greyButton({name: "🍺 Алкоголики", type: "ratings", action: "alcoholics"})],
                    [keyboard.greenButton({name: "☢️ Самые активные", type: "ratings", action: "most_active"}), keyboard.greenButton({name: "😡 Некультурные", type: "ratings", action: "uncultured"})],
                    [keyboard.greenButton({name: "😼 Стикеры", type: "ratings", action: "stickermans"}), keyboard.greenButton({name: "🎶 Меломаны", type: "ratings", action: "music_lovers"})]
                ]).inline()
            })
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
            if(NameLibrary.RoleEstimator(context.player.role) < 1 && !StopList.includes(context.player.id))
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
            if(context.chat.antiMuteList[user])
            {
                await context.send("⚠ Дублирование уже включено")
                return
            }
            if(context.chat.muteList[user])
            {
                delete context.chat.muteList[user]
                await Data.SaveVKChat(context.chat.id)
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
            const name = await api.GetUserData(context.replyPlayers[0])
            context.chat.antiMuteList[user] = {
                moderID: context.player.id,
                name: name.first_name + " " + name.last_name
            }
            await Data.SaveVKChat(context.chat.id)
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
            if(!context.chat.antiMuteList[user])
            {
                await context.send("⚠ Дублирование не включено")
                return
            }
            if(context.player.id !== user && context.chat.antiMuteList[user].moder !== context.player.id)
            {
                await context.send("⚠ Дублирование может снять только сам дублируемый или тот кто его наложил")
                return
            }
            delete context.chat.antiMuteList[user]
            await Data.SaveVKChat(context.chat.id)
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
                    return
                }
                const msg = await context.send(`*id${context.replyPlayers[0]}(Инвентарь):\n\n💰 Монеты - ${resources.dataValues.money}\n🪨 Камень - ${resources.dataValues.stone}\n🌾 Зерно - ${resources.dataValues.wheat}\n🪵 Дерево - ${resources.dataValues.wood}\n🌑 Железо - ${resources.dataValues.iron}\n🥉 Бронза - ${resources.dataValues.copper}\n🥈 Серебро - ${resources.dataValues.silver}\n💎 Алмазы - ${resources.dataValues.diamond}`)
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
                return
            }
            const msg = await context.send(context.player.GetResources())
            setTimeout(async () => {
                try {
                    await api.api.messages.delete({
                        conversation_message_ids: msg.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: msg.peerId
                    })
                } catch (e) {
                }
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
            if(context.replyPlayers.length !== 0 && NameLibrary.RoleEstimator(context.player.role) >= 4)
            {
                await this.GiveCitizenship()
                return
            }
            let temp = null
            let country = null
            let time = new Date()
            const reg = new Date(context.player.createdAt)
            reg.setDate(reg.getDate() + 7)
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
            if(context.player.lastCitizenship - time > 0 && reg - time < 0)
            {
                await context.send("⚠ Менять гражданство можно только раз в неделю")
                return
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
            if(Data.timeouts["get_citizenship_" + context.player.id])
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
            time.setHours(time.getHours() + 24)
            Data.timeouts["get_citizenship_" + context.player.id] = {
                type: "user_timeout",
                subtype: "get_citizenship",
                userId: context.player.id,
                time: time,
                countryID: country.id,
                timeout: setTimeout(async () => {
                    await api.SendMessage(context.player.id, `ℹ Вы подали заявку на получение гражданства в фракции ${Data.countries[country].GetName(context.player.platform === "IOS")}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                    delete Data.timeouts["get_citizenship_" + context.player.id]
                }, 86400000)
            }
            await context.send("✅ Заявка отправлена")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetCitizenship", e)
        }
    }

    async GiveCitizenship(context)
    {
        try
        {
            let temp = null
            let country = null
            let time = new Date()
            let player = Data.users[context.replyPlayers[0]]
            if(!player)
            {
                await context.send("⚠ Игрока нет в кэше")
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
            if(Data.timeouts["get_citizenship_" + player.id])
            {
                delete Data.timeouts["get_citizenship_" + player.id]
            }
            if(country.id === player.citizenship)
            {
                await context.send("⚠ Игрок уже является гражданином этой фракции.")
                return
            }
            await api.api.messages.send({
                user_id: country.leaderID,
                random_id: Math.round(Math.random() * 100000),
                message: `🪪 Игрок ${player.GetName()} подал на гражданство в вашу фракцию: \n\n${player.GetInfo()}`,
                keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: player.id, parameter: country.id}), keyboard.declineCallbackButton({command: "decline_citizenship", item: player.id, parameter: country.id})]]).inline().oneTime()
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
                            message: `🪪 Игрок ${player.GetName()} подал на гражданство в вашу фракцию: \n\n${player.GetInfo()}`,
                            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: player.id, parameter: country.id}), keyboard.declineCallbackButton({command: "decline_citizenship", item: player.id, parameter: country.id})]]).inline().oneTime()
                        })
                    }
                }
            }
            time.setHours(time.getHours() + 24)
            Data.timeouts["get_citizenship_" + player.id] = {
                type: "user_timeout",
                subtype: "get_citizenship",
                userId: player.id,
                time: time,
                countryID: country,
                timeout: setTimeout(async () => {
                    delete Data.timeouts["get_citizenship_" + player.id]
                }, 86400000)
            }
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
            if(StopList.includes(context.replyPlayers[0]))
            {
                return
            }
            if(context.replyPlayers?.length !== 0)
            {
                let player = await Player.findOne({where: {id: context.replyPlayers[0]}, attributes: ["role"]})
                let id = context.command.match(/\d+/)
                let chatID = id ? (parseInt(id[0]) + 2000000000)  : context.peerId
                if(NameLibrary.RoleEstimator(player?.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send("⚠ Вы не можете кикнуть админа находящегося на одном с вами ранге или выше")
                    return
                }
                await api.KickUser(chatID, context.replyPlayers[0])
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
            let msg = await context.send(request)
            if(context.chat?.clean) {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
            if(!context.player.marriedID)
            {
                await context.send("⚠ Вы не состоите в браке.")
                return
            }
            let player = await Player.findOne({where: {id: context.player.marriedID}})
            await PlayerInfo.update({marriedID: null}, {where: {id: context.player.id}})
            await PlayerInfo.update({marriedID: null}, {where: {id: context.player.marriedID}})
            if(Data.users[context.player.marriedID])
            {
                Data.users[context.player.marriedID].marriedID = null
                Data.users[context.player.marriedID].isMarried = false
            }
            context.player.marriedID = null
            context.player.isMarried = false
            await api.SendMessage(player.dataValues.id, `💔 Больше ${context.player.GetName()} не ваш${context.player.gender ? " муж" : "а жена"}`)
            await context.send(`💔 *id${player.dataValues.id}(${player.dataValues.nick}) больше не ваш${player.dataValues.gender ? " муж" : "а жена"}`)
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
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}, attributes: ["marriedID"]})
            if(userInfo.dataValues.marriedID !== null)
            {
                await context.send(`⚠ Этот игрок уже состоит в браке`)
                return
            }
            if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender && !context.player.nationality.match(/грек/i))
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
                context.player.state = context.scenes.WaitingWalkMenu
                await context.send("ℹ Вы отправились в город " + city.name)
                Data.timeouts["user_timeout_walk_" + context.player.id] = {
                    type: "user_timeout",
                    subtype: "walk",
                    userId: context.player.id,
                    cityID: city.id,
                    time: time,
                    timeout: setTimeout(async () => {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + city.name + "\n" + city.description, context.scenes.GetStartMenuKeyboard(context))
                        context.player.state = context.scenes.StartScreen
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
                context.player.state = context.scenes.WaitingWalkMenu
                await context.send("ℹ Вы отправились в фракцию " + country.GetName(context.player.platform === "IOS"))
                context.player.lastActionTime = time
                Data.timeouts["user_timeout_walk_" + context.player.id] = {
                    type: "user_timeout",
                    subtype: "walk",
                    userId: context.player.id,
                    cityID: Data.countries[country.id].capitalID,
                    time: time,
                    timeout: setTimeout(async () => {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + Data.GetCityName(country.capitalID), context.scenes.GetStartMenuKeyboard(context))
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
                        context.player.state = context.scenes.StartScreen
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
            let msg = await context.send(request, {attachment: Data.variables.roadMap, keyboard: keyboard.build(kb).inline()})
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
            const getLeaders = (countryID) =>
            {
                let request = ""
                if(Data.officials[countryID])
                {
                    for(const id of Object.keys(Data.officials[countryID]))
                    {
                        if(Data.officials[countryID][id].canAppointMayors)
                        {
                            request += `\n*id${id}(${Data.officials[countryID][id].nick})`
                        }
                    }
                }
                return request
            }
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
                    request += `🏆 Стабильность - ${country[0].stability}\n`
                    request += `🌆 Столица - ${Data.cities[country[0].capitalID].name}\n`
                    request += `👑 Правител${country[0].isParliament ? "и:\n" : "ь - "}${country[0].isParliament ? ((user ? `@id${country[0].leaderID}(${user.dataValues.nick})` : "") + getLeaders(country[0].id)) : (user ? `@id${country[0].leaderID}(${user.dataValues.nick})` : "Не назначен")}\n\n`
                }
            }
            await context.send(request, {disable_mentions: true})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowEvents(context)
    {
        try
        {
            let request = "⏳ Сейчас " + NameLibrary.GetGameSeason() + "\n\n"
            let messages = await sequelize.query(`SELECT "name", "description", "date" FROM "events" ORDER BY id DESC LIMIT 5`)
            messages = messages[0]
            if(messages.length > 0)
            {
                for (let i = messages.length - 1; i >= 0; i--)
                {
                    request += `📰 ${messages[i].name}\n🕑 ${NameLibrary.GetGameTime(messages[i].date)}\n\n${messages[i].description}\n\n\n`
                }
            }
            else
            {
                request += "🤨 Не добавлено"
            }
            for(let i = 0; i < Math.ceil(request.length/3900); i++)
            {
                await context.send(request.slice((i * 3900), (i * 3900) + 3900), {disable_mentions: true})
            }
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
                let {request} = await OutputManager.GetWeekActiveMessage({command: context.command, app: "VK", platform: context.player.platform})
                await context.send(request)
            }
            else
            {
                let {request} = await OutputManager.GetDayActiveMessage({command: context.command, app: "VK", platform: context.player.platform})
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
            await Data.ReloadChats()
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
            await Data.ReloadChats()
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
            if(context.command.match(/чат/) && context.peerType === "chat")
            {
                await VKChats.destroy({where: {id: context.chat.id}})
                delete Data.VKChats[context.chat.id]
                request += "♻ Кеш чата очищен\n\n"
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
                        if(Data.timeouts["user_timeout_sleep_" + user])
                        {
                            clearTimeout(Data.timeouts["user_timeout_sleep_" + user].timeout)
                            delete Data.timeouts["user_timeout_sleep_" + user]
                        }
                        delete Data.users[user]
                        if(Data.samples[user]) delete Data.samples[user]
                        if(Data.requests[user]) delete Data.requests[user]
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
            if(context.command.match(/чат/))
            {
                await Data.LoadVKChats()
                request += "♻ Чаты перезагружены\n\n"
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
            let msg = await context.send(`🚧 Здравствуй, *id${context.player.id}(путник). Вижу, работать хочешь? Что-ж, есть для тебя пару занятий...`, {keyboard: keyboard.build(kb).inline()})
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
            if(context.player.fatigue === 100)
            {
                await context.send("💪 Вы полны сил")
                return
            }
            let result = await CrossStates.Relaxing(context)
            let msg = null
            if(result.sleep)
            {
                msg = await context.send(`💤 Вы перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(result.time)}`)
            }
            else
            {
                msg = await context.send(`💪 Ваш уровень энергии восстановлен до ${result.fatigue}%`)
            }
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {
                    }
                }, 60000)
            }
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
                await context.send("⚠ Вы не можете делать переводы, причина:\n\n" + context.player.WhyCantTransact())
                return
            }
            const getTax = async (toUserID) => {
                const user = await PlayerStatus.findOne({where: {id: toUserID}})
                if(user.dataValues.countryID === context.player.countryID && context.player.citizenship && user.dataValues.citizenship) return {outTax: 0, inTax: 0}
                let outTax = context.player.countryID === context.player.citizenship ? Data.countries[context.player.countryID].citizenTax : Data.countries[context.player.countryID].nonCitizenTax
                let inTax = user.dataValues.countryID === user.dataValues.citizenship ? Data.countries[user.dataValues.countryID].citizenTax : Data.countries[user.dataValues.countryID].nonCitizenTax
                if(context.player.countryID === context.player.citizenship)
                {
                    let countryTax = await CountryTaxes.findOne({where: {countryID: user.dataValues.countryID, toCountryID: context.player.countryID}})
                    inTax = countryTax ? countryTax.dataValues.tax : Data.countries[user.dataValues.countryID].nonCitizenTax
                }
                return {outTax: outTax, inTax: inTax}
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
                    if(send.match(/все|всё|всю|всех|весь/) || context.player[resource] < count)
                    {
                        count = context.player[resource]
                    }
                    if(count === 0) continue
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
                        request += "\n🍷 Фалернское вино - ✅ Передано " + esterEgg[res]
                        await api.SendNotification(user.dataValues.id, `✅ Игрок ${context.player.GetName()} поделился с вами вином. Похоже на фалернское.`)
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
                    objOUT[res] = Math.abs(Math.min(objOUT[res], context.player[res]))
                    objIN[res] = -objOUT[res]
                    request += `${NameLibrary.GetResourceName(res)} - ✅ Передано ${objOUT[res]}\n`
                }
            }
            if(Object.keys(objOUT).length !== 0)
            {
                if(country)
                {
                    await Data.AddCountryResources(context.player.countryID, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(Data.countries[context.player.countryID].leaderID, `✅ В бюджет фракции ${Data.countries[context.player.countryID].GetName()} поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                    await Transactions.create({
                        fromID: context.player.id,
                        toID: context.player.countryID,
                        type: "ptctr",
                        money: objOUT.money ? objOUT.money : null,
                        stone: objOUT.stone ? objOUT.stone : null,
                        wood: objOUT.wood ? objOUT.wood : null,
                        wheat: objOUT.wheat ? objOUT.wheat : null,
                        iron: objOUT.iron ? objOUT.iron : null,
                        copper: objOUT.copper ? objOUT.copper : null,
                        silver: objOUT.silver ? objOUT.silver : null,
                        diamond: objOUT.diamond ? objOUT.diamond : null
                    })
                }
                else if(city)
                {
                    await Data.AddCityResources(context.player.location, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(Data.cities[context.player.location].leaderID, `✅ В бюджет города ${Data.cities[context.player.location].name} поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                    await Transactions.create({
                        fromID: context.player.id,
                        toID: context.player.location,
                        type: "ptct",
                        money: objOUT.money ? objOUT.money : null,
                        stone: objOUT.stone ? objOUT.stone : null,
                        wood: objOUT.wood ? objOUT.wood : null,
                        wheat: objOUT.wheat ? objOUT.wheat : null,
                        iron: objOUT.iron ? objOUT.iron : null,
                        copper: objOUT.copper ? objOUT.copper : null,
                        silver: objOUT.silver ? objOUT.silver : null,
                        diamond: objOUT.diamond ? objOUT.diamond : null
                    })
                }
                else
                {
                    const {outTax, inTax} = await getTax(user.dataValues.id)
                    if(outTax === 100 || inTax === 100 && !(NameLibrary.RoleEstimator(context.player.role) >= 2 || NameLibrary.RoleEstimator(user.dataValues.role)))
                    {
                        await context.send("⚠ Установлен 100% налог, нет смысла передавать ресурсы")
                        return
                    }
                    if(outTax === 0 || inTax === 0 || (NameLibrary.RoleEstimator(context.player.role) >= 2 || NameLibrary.RoleEstimator(user.dataValues.role)))
                    {
                        await Data.AddPlayerResources(user.dataValues.id, objOUT)
                        await Data.AddPlayerResources(context.player.id, objIN)
                        await api.SendNotification(user.dataValues.id, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                        await Transactions.create({
                            fromID: context.player.id,
                            toID: user.dataValues.id,
                            type: "ptp",
                            money: objOUT.money ? objOUT.money : null,
                            stone: objOUT.stone ? objOUT.stone : null,
                            wood: objOUT.wood ? objOUT.wood : null,
                            wheat: objOUT.wheat ? objOUT.wheat : null,
                            iron: objOUT.iron ? objOUT.iron : null,
                            copper: objOUT.copper ? objOUT.copper : null,
                            silver: objOUT.silver ? objOUT.silver : null,
                            diamond: objOUT.diamond ? objOUT.diamond : null
                        })
                    }
                    else
                    {
                        let kb = [[], [], []]
                        let canRefund = false
                        const playerLocation = await PlayerStatus.findOne({where: {id: user.dataValues.id}, attributes: ["countryID"]})
                        let refundTax = NameLibrary.PriceTaxRefund(NameLibrary.PriceTaxRefund(objIN, outTax), inTax)
                        if(context.player.CanPay(refundTax))
                        {
                            kb[0].push(keyboard.positiveCallbackButton({label: "💸 Покрыть", payload: {
                                command: "transaction_refund_tax",
                                transaction: {
                                    price: refundTax,
                                    tax: {
                                        in: inTax,
                                        out: outTax
                                    },
                                    countries: {
                                        in: context.player.countryID,
                                        out: playerLocation.dataValues.countryID
                                    },
                                    toUser: user.dataValues.id
                                }
                            }}))
                            canRefund = true
                        }
                        kb[0].push(keyboard.positiveCallbackButton({label: "💸 Оплатить", payload: {
                            command: "transaction_tax",
                            transaction: {
                                price: objIN,
                                tax: {
                                    in: inTax,
                                    out: outTax
                                },
                                countries: {
                                    in: context.player.countryID,
                                    out: playerLocation.dataValues.countryID
                                },
                                toUser: user.dataValues.id
                            }
                        }}))
                        kb[1].push(keyboard.secondaryCallbackButton({label: "💰 Уклониться", payload: {
                            command: "transaction_tax_evasion",
                            transaction: {
                                price: objIN,
                                tax: {
                                    in: inTax,
                                    out: outTax
                                },
                                countries: {
                                    in: context.player.countryID,
                                    out: playerLocation.dataValues.countryID
                                },
                                toUser: user.dataValues.id
                            }
                        }}))
                        kb[2].push(keyboard.negativeCallbackButton({label: "🚫 Отменить", payload: {
                            command: "hide_message"
                        }}))
                        await context.send("ℹ Подтвердите оплату налога в ЛС")
                        await api.api.messages.send({
                            user_id: context.player.id,
                            random_id: Math.round(Math.random() * 100000),
                            message: `ℹ Для совершения перевода игроку *id${user.dataValues.id}(${user.dataValues.nick}) необходимо уплатить налоги в размере ${inTax}% и ${outTax}%\n\nПеревод в размере:\n${NameLibrary.GetPrice(objIN)}\n\nПосле уплаты налога останется:\n${NameLibrary.GetPrice(NameLibrary.AfterPayTax(NameLibrary.AfterPayTax(objIN, inTax), outTax))}\n\n${canRefund ? "ℹ Также вы можете взять на себя компенсацию налога, но тогда сумма перевода будет составлять:\n" + NameLibrary.GetPrice(refundTax) : ""}`,
                            keyboard: keyboard.build(kb).inline()
                        })
                        return
                    }
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
                user = context.replyPlayers
            }
            else
            {
                user = [context.player.id]
            }
            let player = await Player.count({where: {id: user}})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                return
            }
            context.command = context.command.replace(Commands.cheating, "")
            let resource = null
            let sends = context.command.split(",")
            let objOUT = {}
            let count
            let request = ""
            let temp = null
            for(const u of user)
            {
                temp = await Player.findOne({where: {id: u}, attributes: ["nick"]})
                request += "\n" + temp.dataValues?.nick + ":" + "\n"
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
                await Data.AddPlayerResources(u, objOUT)
                await api.SendNotification(u, `✅ Вам поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await Transactions.create({
                    fromID: context.player.id,
                    toID: u,
                    type: "gmtp",
                    money: objOUT.money ? objOUT.money : null,
                    stone: objOUT.stone ? objOUT.stone : null,
                    wood: objOUT.wood ? objOUT.wood : null,
                    wheat: objOUT.wheat ? objOUT.wheat : null,
                    iron: objOUT.iron ? objOUT.iron : null,
                    copper: objOUT.copper ? objOUT.copper : null,
                    silver: objOUT.silver ? objOUT.silver : null,
                    diamond: objOUT.diamond ? objOUT.diamond : null
                })
            }
            await context.send(request, {disable_mentions: true})
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
            await Transactions.create({
                fromID: context.player.id,
                toID: user,
                type: "ptgm",
                money: objOUT.money ? objOUT.money : null,
                stone: objOUT.stone ? objOUT.stone : null,
                wood: objOUT.wood ? objOUT.wood : null,
                wheat: objOUT.wheat ? objOUT.wheat : null,
                iron: objOUT.iron ? objOUT.iron : null,
                copper: objOUT.copper ? objOUT.copper : null,
                silver: objOUT.silver ? objOUT.silver : null,
                diamond: objOUT.diamond ? objOUT.diamond : null
            })
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
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: context.replyPlayers[0]}})
            const userStatus = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}})
            await context.send(`📌Игрок *id${user.dataValues.id}(${user.dataValues.nick}):\n\n📅 Возраст: ${userInfo.dataValues.age}\n⚤ Пол: ${user.dataValues.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${userInfo.dataValues.nationality}\n💍 Брак: ${userInfo.dataValues.marriedID ? (user.dataValues.gender ? `*id${userInfo.dataValues.marriedID}(💘 Жена)` : `*id${userInfo.dataValues.marriedID}(💘 Муж)`) : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(user.dataValues.role)}\n👑 Статус: ${NameLibrary.GetStatusName(user.dataValues.status)}\n🔰 Гражданство: ${userStatus.dataValues.citizenship ? Data.GetCountryName(userStatus.dataValues.citizenship) : "Нет"}\n📍 Прописка: ${userStatus.dataValues.registration ? Data.GetCityName(userStatus.dataValues.registration) : "Нет"}\n🍺 Выпито пива: ${parseFloat(user.dataValues.beer).toFixed(1)} л.\n💭 Описание: ${userInfo.dataValues.description}`, {disable_mentions: true, attachment: user.dataValues.avatar})
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
            if(Data.countries[context.player.countryID]?.resources?.match(resource) && Data.countries[context.player.citizenship]?.resources?.match(resource))
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
                let msg = await context.send(`✅ Вы добыли ${NameLibrary.GetResourceName(resource)} ${extraction}`, {attachment: extract[resource].img})
                setTimeout(async () => {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    }catch (e) {}
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    }catch (e) {}
                }, 60000)
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
            const msg = await context.send(`🧭 *id${context.player.id}(Вы) находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${country.GetName(context.player.platform === "IOS")}, в городе ${Data.cities[context.player.location].name}\n\n${Data.cities[context.player.location].description}`, {attachment: photo, keyboard: keyboard.build(kb).inline()})
            if(context.chat?.clean)
            {
                setTimeout(async () => {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    }catch (e) {}
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    }catch (e) {}
                }, 60000)
            }
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
                    temp = await Player.findOne({where: {id: i}})
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
            context.player.state = context.scenes.FillingOutTheForm
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
            const users = context.replyPlayers.join(";")
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игрок${context.replyPlayers.length > 1 ? "ов" : "а"}:\n${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_report", users: users})], [keyboard.backButton]])
            context.player.state = context.scenes.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС")
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
            if(StopList.includes(context.replyPlayers[0]))
            {
                await context.reply("⚠ Осуждаю")
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
            context.player.state = context.scenes.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendBanForm", e)
        }
    }
}

module.exports = new ChatController()