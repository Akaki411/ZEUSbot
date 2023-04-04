const NameLibrary = require("../variables/NameLibrary")
const Commands = require("../variables/Commands")
const keyboard = require("../variables/Keyboards")
const api = require("../middleware/API")
const SceneController = require("../controllers/SceneController")
const Data = require("../models/CacheData")
const {Player, PlayerStatus, PlayerInfo, Country, CountryRoads, CityRoads, PlayerResources} = require("../database/Models");
const ErrorHandler = require("../error/ErrorHandler")

class ChatController
{
    async CommandHandler(context)
    {
        try
        {
            if(context.messagePayload)
            {
                await this.ChatButtonHandler(context)
                return
            }
            context.command?.match(/^бот$/) && await context.reply(NameLibrary.GetRandomSample("call_request"))
            context.command?.match(Commands.botCall) && await context.reply(NameLibrary.GetRandomSample("dungeon_master_request"))
            context.command?.match(Commands.clearKeyboard) && await context.send("Убираю", {keyboard: keyboard.none})
            context.command?.match(Commands.badJoke) && await context.send(NameLibrary.GetRandomSample("bad_jokes"))
            context.command?.match(Commands.warning) && await this.SendWarningForm(context)
            context.command?.match(Commands.ban) && await this.SendBanForm(context)
            context.command?.match(Commands.resources) && await this.GetResources(context)
            context.command?.match(Commands.location) && await this.LocationRequest(context)
            context.command?.match(Commands.aboutMe) && await context.reply(context.player.GetInfo())
            context.command?.match(Commands.checkLocation) && await this.CheckLocation(context)
            context.command?.match(Commands.checkDocs) && await this.CheckDocs(context)
            context.command?.match(Commands.send) && await this.SendResource(context)
            context.command?.match(Commands.relax) && await this.Relax(context)
            context.command?.match(Commands.wakeup) && await this.Wakeup(context)
            context.command?.match(/^мир$/) && await context.send("🌍 Таков наш мир, но что смотреть ты хочешь?", {attachment: Data.variables.globalMap, keyboard: keyboard.build([[keyboard.greyButton({name: "🗺 Карта дорог", type: "show_road_map"})]]).inline()})
            context.command?.match(Commands.map) && await this.RoadMap(context)
            context.command?.match(Commands.work) && await this.Work(context)
            context.command?.match(/^ресет$/) && await this.Reset(context)
            context.command?.match(/^добавить чат/) && await this.AddCountryChat(context)
            context.command?.match(Commands.countries) && await this.ShowCountriesInfo(context)
            context.command?.match(Commands.countriesActive) && await this.ShowCountriesActive(context)
            context.command?.match(Commands.marry) && await this.OfferMarry(context)
            context.command?.match(Commands.divorce) && await this.Divorce(context)
            context.command?.match(Commands.stats) && await this.ShowPlayerActive(context)
            context.command?.match(/^кик/) && await this.KickUser(context)
            context.command?.match(/^закреп/) && await this.GiveAttachment(context)
            context.command?.match(/^установить переменную |^изменить переменную /) && await this.SetVar(context)
            context.command?.match(/^переменные/) && await this.ShowVars(context)
            context.command?.match(Commands.getCitizenship) && await this.GetCitizenship(context)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/CommandHandler", e)
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
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/ChatButtonHandler", e)
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
                    await context.reply("⚠ Игрок не зарегистрирован")
                    await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
                    return
                }
                await context.reply(`Инвентарь:\n\n💰 Монеты - ${resources.dataValues.money}\n🪨 Камень - ${resources.dataValues.stone}\n🌾 Зерно - ${resources.dataValues.wheat}\n🪵 Дерево - ${resources.dataValues.wood}\n🌑 Железо - ${resources.dataValues.iron}\n🥉 Бронза - ${resources.dataValues.copper}\n🥈 Серебро - ${resources.dataValues.silver}\n💎 Алмазы - ${resources.dataValues.diamond}\``)
                return
            }
            await context.reply(context.player.GetResources())
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/GetCitizenship", e)
        }
    }

    async GetCitizenship(context)
    {
        try
        {
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
                await context.reply("⚠ Фракция не найдена")
                return
            }
            if(context.player.status.match(/official|leader/))
            {
                await context.reply("⚠ Правители и чиновники не могут менять гражданство")
                return
            }
            if(context.player.status.match(/candidate/))
            {
                await context.reply("⚠ Вы уже подали на гражданство")
                return
            }
            if(country.id === context.player.citizenship)
            {
                await context.reply("⚠ Вы уже являетесь гражданином этой фракции.")
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
                            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
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
            await context.reply("✅ Заявка отправлена")
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/GetCitizenship", e)
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
            await context.reply(request)
        }
        catch (e)
        {
            await context.reply("Ошибка: " + e.message)
        }
    }

    async SetVar(context)
    {
        try
        {
            const vars = Object.keys(Data.variables)
            const varButtons = []
            let request = "ℹ Список переменных:\n\n"
            for(let i = 0; i < vars.length; i++)
            {
                varButtons.push([vars[i], vars[i]])
                request += "🔸 " + vars[i] + "   =   " + Data.variables[vars[i]] + "\n"
            }
            if (NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                return
            }
            let msg = context.text.replace(/^установить переменную |^изменить переменную /i, "")
            let commands = msg.split(" ")
            if(commands.length < 2)
            {
                await context.reply("Неверный формат")
                return
            }
            let varName = commands[0]
            console.log(varName)
            commands = commands.slice(1)
            commands = commands.join(" ")
            if(!Data.variables[varName])
            {
                await context.reply("Переменная не найдена")
                return
            }
            Data.variables[varName] = commands
            await Data.SaveVariables()
            await context.reply("✅ Значение переменной изменено")
        }
        catch (e)
        {
            await context.reply("Ошибка: " + e.message)
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
                await context.reply("Нет прикрепленных данных")
                return
            }
            await context.reply(context.attachments[0].toString())
        }
        catch (e)
        {
            await context.reply("Ошибка: " + e.message)
        }
    }

    async KickUser(context)
    {
        try
        {
            if (NameLibrary.RoleEstimator(context.player.role) < 4) {
                return
            }
            context.command = context.command.replace(/^кик /, "")
            let id = parseInt(context.command)
            if (isNaN(id))
            {
                await context.reply("Неверный формат id")
                return
            }
            let result = await api.KickUser(context.peerId, id)
            if (result)
            {
                await context.reply("Ошибка: " + result)
            }
        }
        catch (e)
        {
            await context.reply("Ошибка: " + e.message)
        }
    }

    async ShowPlayerActive(context)
    {
        try
        {
            if(context.replyPlayers?.length !== 0 && NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                await context.reply("⚠ Вы вы не можете просматривать активность других игроков")
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
                        await context.reply("⚠ Игрок не зарегистрирован")
                        await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
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
            await context.reply(request)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/Divorce", e)
        }
    }

    async Divorce(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игрока")
                return
            }
            if(context.player.marriedID !== context.replyPlayers[0])
            {
                await context.reply("⚠ Вы не состоите в браке.")
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
            await ErrorHandler.SendLogs(context, "ChatController/Divorce", e)
        }
    }

    async OfferMarry(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игрока")
                return
            }
            if(context.player.isMarried)
            {
                await context.reply("⚠ Вы уже помолвлены")
                return
            }
            let user = context.replyPlayers[0]
            user = await Player.findOne({where: {id: user}})
            if(!user)
            {
                await context.reply("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}, attributes: ["marriedID"]})
            if(userInfo.dataValues.marriedID !== null)
            {
                await context.send(`⚠ Этот игрок уже состоит в браке`)
                return
            }
            if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender && context.player.nation !== "Грек 🏛️")
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
            await ErrorHandler.SendLogs(context, "ChatController/OfferMarry", e)
        }
    }

    async ToOtherCity(context, id)
    {
        try
        {
            const road = await CityRoads.findOne({where: {fromID: context.player.location, toID: id}})
            if(!road)
            {
                await context.reply("⚠ Вам не доступна эта дорога")
                return
            }
            const city = Data.cities[id]
            if(city.isSiege && context.player.status !== "worker")
            {
                await context.reply("⚠ Город находится под осадой")
                return
            }
            if(Data.countries[context.player.countryID].isSiege && context.player.status !== "worker")
            {
                await context.reply("⚠ В фракции введено военное положение, перемещение между городами невозможно")
                return
            }
            if(city.isSiege && context.player.status !== "worker")
            {
                await context.reply("ℹ В данный момент город, в который вы хотите отправиться находится в осаде, въезд в него не возможен")
                return
            }
            if(context.player.status === "worker")
            {
                await context.reply("🏙 Вы пришли в город " + city.name)
                context.player.location = city.id
                await PlayerStatus.update(
                    {location: city.id},
                    {where: {id: context.player.id}}
                )
            }
            else
            {
                const time = new Date()
                time.setMinutes(time.getMinutes() + parseInt(road.dataValues.time))
                context.player.lastActionTime = time
                context.player.state = SceneController.WaitingWalkMenu
                context.reply("ℹ Вы отправились в город " + city.name)
                context.player.timeout = setTimeout(async () => {
                    try
                    {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + city.name + "\n" + city.description, SceneController.GetStartMenuKeyboard(context))
                        context.player.location = city.id
                        context.player.state = SceneController.StartScreen
                        await PlayerStatus.update(
                            {location: city.id},
                            {where: {id: context.player.id}}
                        )
                        if(city.notifications)
                        {
                            await api.SendMessage(city.leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${city.name}`)
                        }
                    }
                    catch (e)
                    {
                        await ErrorHandler.SendLogs(context, "ChatController/ToOtherCountry", e)
                    }
                }, road.dataValues.time * 60000)
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/ToOtherCountry", e)
        }
    }

    async ToOtherCountry(context, id)
    {
        try
        {
            const road = await CountryRoads.findOne({where: {fromID: context.player.countryID, toID: id}})
            if(!road)
            {
                await context.reply("⚠ Вам не доступна эта дорога")
                return
            }
            const country = Data.countries[id]
            if(!context.player.CanPay({money: -country.entranceFee}))
            {
                await context.reply("⚠ У вас не хватает монет для оплаты входной пошлины")
                return
            }
            if(Data.cities[context.player.location].isSiege)
            {
                await context.reply("⚠ Город находится под осадой, вы не можете его покинуть")
                return
            }
            if(Data.countries[context.player.countryID].isSiege)
            {
                await context.reply("⚠ В фракции введено военное положение, выезд запрещен")
                return
            }
            if(Data.countries[id].isSiege)
            {
                await context.reply("⚠ В данный момент фракция, в которую вы хотите отправиться находится под блокадой, въезд в нее не возможен")
                return
            }
            if(context.player.status === "worker")
            {
                await context.reply("🏙 Вы пришли в город " + Data.GetCityName(country.capitalID))
                context.player.location = country.capitalID
                context.player.countryID = country.id
                await PlayerStatus.update(
                    {location: country.capitalID, countryID: country.id},
                    {where: {id: context.player.id}}
                )
            }
            else
            {
                const time = new Date()
                time.setMinutes(time.getMinutes() + road.dataValues.time)
                context.player.state = SceneController.WaitingWalkMenu
                await context.reply("ℹ Вы отправились в фракцию " + country.GetName())
                context.player.lastActionTime = time
                context.player.timeout = setTimeout(async () => {
                    try
                    {
                        await api.SendMessageWithKeyboard(context.player.id, "🏙 Вы пришли в город " + Data.GetCityName(country.capitalID), SceneController.GetStartMenuKeyboard(context))
                        context.player.location = country.capitalID
                        context.player.countryID = country.id
                        if (country.entranceFee !== 0)
                        {
                            await Data.AddPlayerResources(context.player.id, {money: -country.entranceFee})
                            await Data.AddCountryResources(country, {money: country.entranceFee})
                        }
                        await PlayerStatus.update(
                            {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                            {where: {id: context.player.id}}
                        )
                        if(Data.countries[country].notifications)
                        {
                            await api.SendMessage(Data.countries[country].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в вашу фракцию ${country.GetName()}`)
                        }
                        if(Data.cities[Data.countries[country].capitalID].notifications)
                        {
                            await api.SendMessage(Data.cities[Data.countries[country].capitalID].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${Data.cities[country.capitalID].name}`)
                        }
                        context.player.state = SceneController.StartScreen
                    }
                    catch (e)
                    {
                        await ErrorHandler.SendLogs(context, "ChatController/ToOtherCountry", e)
                    }
                }, road.dataValues.time * 60000)
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/ToOtherCountry", e)
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
            let request = `🗺 Карта дорог\n\n*id${context.player.id}(Вы) находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${Data.countries[Data.cities[context.player.location].countryID].GetName()}, в городе ${Data.cities[context.player.location].name}\n`
            let kb = []
            let countryKB = []
            let cityKB = []
            const countryRoads = await CountryRoads.findAll({where: {fromID: context.player.countryID, isBlocked: false}, limit: 8, attributes: ["toID", "time"]})
            if(countryRoads.length !== 0) request += "\n🔵 Вы можете отправиться в фракции:\n"
            for(const key of countryRoads)
            {
                countryKB.push([Data.countries[key.dataValues.toID].name, "ID" + key.dataValues.toID, "to_other_country"])
                request += `🔸 ${Data.countries[key.dataValues.toID].GetName()} - ${key.dataValues.time} мин, въездная пошлина - ${Data.countries[key.dataValues.toID].entranceFee} монет\n`
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
            await ErrorHandler.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesInfo(context)
    {
        try
        {
            let request = "🔰 Государства, населяющие наш мир:\n\n"
            let user = undefined
            let population = 0
            for(const country of Data.countries)
            {
                user = undefined
                if(country)
                {
                    user = await Player.findOne({where: {id: country.leaderID}, attributes: ["nick"]})
                    population = await PlayerStatus.count({where: {citizenship: country.id}})
                    request += `${country.GetName()}\n`
                    request += `👥 Население - ${population} чел.\n`
                    request += `👑 Правитель - ${user ? `*id${country.leaderID}(${user.dataValues.nick})` : "Не назначен"}\n`
                    request += `🌆 Столица - ${Data.cities[country.capitalID].name}\n\n`
                }
            }
            await context.send(request)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/RoadMap", e)
        }
    }

    async ShowCountriesActive(context)
    {
        try
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
                    request += `${Data.countries[activeCountries[i][1]].GetName()}\n`
                    request +=  `${Data.countries[activeCountries[i][1]].chatID ? `⚒ Актив за сегодня: ${Data.countries[activeCountries[i][1]].active} сообщений` : "⚠ Чат не добавлен"}\n`
                    request += `💪 Получено баллов: ${Data.countries[activeCountries[i][1]].rating}\n`
                    request += `🔴 Получено варнов: ${Data.countries[activeCountries[i][1]].warnings}\n\n`
                }
            }
            await context.send(request)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/RoadMap", e)
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
            context.command = context.command.replace(/добавить чат/, "")
            context.command = context.command.replace(" ", "")
            let country = null
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].chatID === context.peerId)
                    {
                        await context.reply(`⚠ Этот чат используется фракцией ${Data.countries[i].GetName()}`)
                        return
                    }
                }
            }
            let command = new RegExp(context.command, "i")
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].name.toLowerCase().match(command))
                    {
                        country = Data.countries[i]
                        break
                    }
                }
            }
            if(!country)
            {
                await context.reply("⚠ Фракция не найдена")
                return
            }
            country.chatID = context.peerId
            await Country.update({chatID: context.peerId}, {where: {id: country.id}})
            await Data.LoadCountries()
            await context.send(`✅ Чат ${context.peerId} добавлен как основной чат фракции ${country.GetName()}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/AddCountryChat", e)
        }
    }

    async Reset(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                await context.reply("⚠ У вас нет прав на эту команду")
                return
            }
            let user
            if(context.replyPlayers[0])
            {
                user = context.replyPlayers[0]
            }
            else
            {
                user = context.player.id
            }
            if(Data.users[user])
            {
                delete Data.users[user]
                await context.reply("✅ Данные об игроке удалены из кэша")
            }
            else
            {
                await context.reply("⚠ Данные об игроке отсутствуют в кэше")
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/Reset", e)
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
            await ErrorHandler.SendLogs(context, "ChatController/Relax", e)
        }
    }
    async Wakeup(context)
    {
        try
        {
            if(!context.player.isRelaxing)
            {
                await context.reply(`☕ Будете слишком бодрым - сердце посадите.`)
                return
            }
            const now = new Date()
            const time = Math.max(0, Math.round((context.player.relaxingEndTime - now) / 60000))
            context.player.isRelaxing = false
            context.player.fatigue = Math.round(100 - (time * (100 / 360)))
            await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/Relax", e)
        }
    }

    async Relax(context)
    {
        try
        {
            if(context.player.isRelaxing)
            {
                await context.reply(`💤 Сон во сне? Звучит как завязка фильма "Начало"`)
                return
            }
            if(context.player.fatigue === 100)
            {
                await context.reply(`💪 Вы полны сил`)
                return
            }
            const need = (100 - context.player.fatigue) * 3.6
            const time = new Date()
            time.setMinutes(time.getMinutes() + need)
            Data.users[context.player.id].relaxingEndTime = time
            if (Data.users[context.player.id].relaxingEndTimeout)
            {
                clearTimeout(Data.users[context.player.id].relaxingEndTimeout)
            }
            Data.users[context.player.id].relaxingEndTimeout = setTimeout(() => {
                api.SendMessage(context.player.id, "☕ Ваши силы восстановлены")
                context.player.fatigue = 100
                context.player.isRelaxing = false
            }, need * 60000)
            context.player.isRelaxing = true
            await context.send(`💤 *id${context.player.id}(Вы) перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/Relax", e)
        }
    }

    async SendResource(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игрока")
                return
            }
            if(context.replyPlayers[0] === context.player.id)
            {
                await context.reply("❓ Какой смысл передавать ресурсы самому себе? Вот просто зачем? Чтобы что?")
                return
            }
            const user = await Player.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.reply("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
                return
            }
            context.command = context.command.replace(Commands.send, "")
            let resource = null
            if(context.command.match(Commands.money))
            {
                resource = "money"
                context.command = context.command.replace(Commands.money, "")
            }
            if(context.command.match(Commands.wheat))
            {
                resource = "wheat"
                context.command = context.command.replace(Commands.wheat, "")
            }
            if(context.command.match(Commands.stone))
            {
                resource = "stone"
                context.command = context.command.replace(Commands.stone, "")
            }
            if(context.command.match(Commands.wood))
            {
                resource = "wood"
                context.command = context.command.replace(Commands.wood, "")
            }
            if(context.command.match(Commands.iron))
            {
                resource = "iron"
                context.command = context.command.replace(Commands.iron, "")
            }
            if(context.command.match(Commands.copper))
            {
                resource = "copper"
                context.command = context.command.replace(Commands.copper, "")
            }
            if(context.command.match(Commands.silver))
            {
                resource = "silver"
                context.command = context.command.replace(Commands.silver, "")
            }
            if(context.command.match(Commands.diamond))
            {
                resource = "diamond"
                context.command = context.command.replace(Commands.diamond, "")
            }
            if(!resource)
            {
                await context.reply("⚠ Укажите какой ресурс вы хотите передать")
                return
            }
            context.command = context.command.replace(" ", "")
            let count = parseInt(context.command)
            if(isNaN(count))
            {
                await context.reply("⚠ Введите количество ресурса")
                return
            }
            let objIN = {}
            let objOUT = {}
            objIN[resource] = -Math.abs(count)
            objOUT[resource] = Math.abs(count)
            if(!context.player.CanPay(objIN))
            {
                await context.reply(`⚠ Вы не можете передать ${NameLibrary.GetResourceName(resource)} больше ${context.player[resource]} шт.`)
                return
            }
            await Data.AddPlayerResources(user.dataValues.id, objOUT)
            await Data.AddPlayerResources(context.player.id, objIN)
            await api.SendNotification(user.dataValues.id, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
            await context.reply(`✅ Ресурс передан`)
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
                await context.reply("⚠ Выберите игрока")
                return
            }
            let flag = false
            if(Data.countries[context.player.countryID].leaderID === context.player.id)
            {
                flag = true
            }
            if(Data.officials[context.player.countryID])
            {
                if(Data.officials[context.player.countryID][context.player.id])
                {
                    flag = true
                }
            }
            const user = await Player.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.reply("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
                return
            }
            if(!flag && context.player.status !== "worker")
            {
                await context.reply(`⚠ У вас нет права проверять документы в фракции ${Data.countries[context.player.countryID].GetName()}`)
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: context.replyPlayers[0]}})
            const userStatus = await PlayerInfo.findOne({where: {id: context.replyPlayers[0]}})
            await context.reply(`📌Игрок *id${user.dataValues.id}(${user.dataValues.nick}):\n\n📅 Возраст: ${userInfo.dataValues.age}\n⚤ Пол: ${user.dataValues.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${userInfo.dataValues.nationality}\n💍 Брак: ${userInfo.dataValues.marriedID ? user.dataValues.gender ? `*id${userInfo.dataValues.marriedID}(💘Жена)` : `*id${userInfo.dataValues.marriedID}(💘Муж)` : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(user.dataValues.role)}\n👑 Статус: ${NameLibrary.GetStatusName(user.dataValues.status)}\n🔰 Гражданство: ${userStatus.dataValues.citizenship ? Data.GetCountryName(userStatus.dataValues.citizenship) : "Нет"}\n📍 Прописка: ${userStatus.dataValues.registration ? Data.GetCityName(userStatus.dataValues.registration) : "Нет"}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/CheckLocation", e)
        }
    }

    async CheckLocation(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игрока")
                return
            }
            if(context.replyPlayers[0] === context.player.id)
            {
                await context.reply("➕ Да, вы находитесь в одном городе с самим собой")
                return
            }
            const user = await PlayerStatus.findOne({where: {id: context.replyPlayers[0]}})
            if(!user)
            {
                await context.reply("⚠ Игрок не зарегистрирован")
                await context.send(`⚠ А *id${context.replyPlayers[0]}(вас) я попрошу зарегистрироваться, иначе вы не сможете пользоваться функционалом бота`)
                return
            }
            if(user.dataValues.location === context.player.location)
            {
                await context.reply("➕ Вы находитесь в одном городе")
            }
            else
            {
                if(user.dataValues.countryID === context.player.countryID)
                {
                    await context.reply("➖ Вы находитесь в разных городах одной фракции")
                }
                else
                {
                    await context.reply("➖ Вы находитесь в разных городах")
                }
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/CheckLocation", e)
        }
    }

    async ExtractResource(context, resource)
    {
        try
        {
            if(context.player.CantExtraction())
            {
                await context.reply(`🥴 Вы не можете добывать ресурсы, ${context.player.WhyCantTransact()}`)
                return
            }
            if(context.player.fatigue <= 0)
            {
                await context.reply("😢 Хватит работать, иди поспи.")
                return
            }
            if(Data.countries[context.player.countryID].resources.match(resource))
            {
                const extract = {
                    wood: {min: 2.5, max: 5, img: Data.variables["woodPicture"]},
                    wheat: {min: 2.5, max: 7.5, img: Data.variables["wheatPicture"]},
                    stone: {min: 2.5, max: 5, img: Data.variables["stonePicture"]},
                    iron: {min: 0.65, max: 1.85, img: Data.variables["ironPicture"]},
                    copper: {min: 0.65, max: 1.85, img: Data.variables["copperPicture"]},
                    silver: {min: 1.25, max: 2.5, img: Data.variables["silverPicture"]}
                }
                const extraction = NameLibrary.GetRandomNumb(extract[resource].min * context.player.fatigue, extract[resource].max * context.player.fatigue)
                context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                let diamonds = 0
                if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                {
                    diamonds = 1
                    await context.reply(`💎 Вы нашли алмаз!`, {attachment: Data.variables["diamondPicture"]})
                }
                let obj = {
                    diamonds: diamonds
                }
                obj[resource] = extraction
                await Data.AddPlayerResources(context.player.id, obj)
                await context.send(`✅ Вы добыли ${NameLibrary.GetResourceName(resource)} ${extraction}`, {attachment: extract[resource].img})
            }
            else
            {
                await context.reply("🥸 Место, в котором вы находитесь, не располагает этим ресурсом.")
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/ExtractResource", e)
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
            await context.send(`🧭 *id${context.player.id}(Вы) находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${country.GetName()}, в городе ${Data.cities[context.player.location].name}\n\n${Data.cities[context.player.location].description}`,
                {
                    attachment: photo,
                    keyboard: keyboard.build(kb).inline()
                })
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/LocationRequest", e)
        }
    }

    async SendWarningForm(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игроков")
                return
            }
            let time = new Date()
            if(context.player.lastReportTime)
            {
                if(time - context.player.lastReportTime < 3600000 && NameLibrary.RoleEstimator(context.player.role) < 3)
                {
                    await context.reply("⚠ Вы слишком часто отправляете репорты")
                    return
                }
            }
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
                await context.reply("⚠ У вас нет права выдавать предупреждения админам")
                return
            }
            if(unregFlag)
            {
                await context.reply("⚠ Вы не можете выдать предупреждение не зарегистрированному пользователю")
                return
            }
            const users = context.replyPlayers.join(";")
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игроков:\n${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_warning", users: users})]])
            context.player.state = SceneController.FillingOutTheForm
            await context.reply("Заполните форму в ЛС")
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/SendWarningForm", e)
        }
    }

    async SendReport(context)
    {
        try
        {
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игроков")
                return
            }
            let time = new Date()
            if(context.player.lastReportTime)
            {
                if(time - context.player.lastReportTime < 3600000)
                {
                    await context.reply("⚠ Вы слишком часто отправляете жалобы")
                    return
                }
            }
            const users = context.replyPlayers.join(";")
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игрок${context.replyPlayers.length > 1 ? "ов" : "а"}:\n${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_report", users: users})]])
            context.player.state = SceneController.FillingOutTheForm
            await context.reply("ℹ Заполните форму в ЛС")
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/SendWarningForm", e)
        }
    }

    async SendBanForm(context)
    {
        try
        {
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                await context.reply("⚠ У вас нет прав на эту команду")
                return
            }
            if(context.replyPlayers?.length === 0)
            {
                await context.reply("⚠ Выберите игроков")
                return
            }
            let time = new Date()
            if(context.player.lastReportTime)
            {
                if(time - context.player.lastReportTime < 3600000 && NameLibrary.RoleEstimator(context.player.role) < 4)
                {
                    await context.reply("⚠ Вы слишком часто отправляете репорты")
                    return
                }
            }
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
                await context.reply("⚠ Вы не можете выдавать баны админам")
                return
            }
            if(unregFlag)
            {
                await context.reply("⚠ Вы не можете выдать бан не зарегистрированному пользователю")
                return
            }
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные ГлоБана на игрока: ${context.replyPlayers?.map(user => {
                return `*id${user}(${user})\n`
            })}`, [[keyboard.startButton({type: "new_ban", users: users})], keyboard.backButton])
            context.player.state = SceneController.FillingOutTheForm
            await context.reply("ℹ Заполните форму в ЛС")
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "ChatController/SendBanForm", e)
        }
    }
}

module.exports = new ChatController()