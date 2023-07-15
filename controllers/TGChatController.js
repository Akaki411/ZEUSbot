const Commands = require('../variables/Commands')
const OutputManager = require('./OutputManager')
const NameLibrary = require('../variables/NameLibrary')
const Data = require("../models/CacheData");
const api = require("../middleware/API");
const keyboard = require("../variables/Keyboards");
const {Player, PlayerInfo, PlayerStatus, CountryTaxes, Transactions, CountryRoads, CityRoads, Country, PlayerResources} = require("../database/Models");
const CrossStates = require("./CrossStates");
const sequelize = require("../database/DataBase");
const Rules = require("../variables/Rules");
const StopList = require("../files/StopList.json");

class TGChatController
{
    async CallbackHandler(context)
    {
        try
        {
            if(context.data.match(/^extract_/))
            {
                await this.ExtractResource(context, context.data.replace(/^extract_/, ""))
            }
            if(context.data.match(/^to_country_/))
            {
                await this.ToOtherCountry(context, parseInt(context.data.replace(/^to_country_/, "")))
            }
            if(context.data.match(/^to_city_/))
            {
                await this.ToOtherCity(context, parseInt(context.data.replace(/^to_city_/, "")))
            }
        }
        catch (e) {}
    }

    async Handler(context)
    {
        try
        {
            if(context.command?.match(/^бот$/))
            {
                await this.BotCall(context)
                return true
            }
            if(context.command?.match(Commands.countriesActive))
            {
                await this.GetCountriesActive(context)
                return true
            }
            if(context.command?.match(Commands.badJoke))
            {
                await context.send(NameLibrary.GetRandomSample("bad_jokes"))
                return true
            }

            //РП
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
            if(context.command?.match(/^трахнуть/))
            {
                await this.Fuck(context)
                return true
            }
            if(context.command?.match(/^выебать/))
            {
                await this.HardFuck(context)
                return true
            }
            if(context.command?.match(/^делать секс/))
            {
                await this.Sex(context)
                return true
            }
            if(context.command?.match(/^отдаться/))
            {
                await this.Giving(context)
                return true
            }
            if(context.command?.match(/^отсосать/))
            {
                await this.Suck(context)
                return true
            }
            if(context.command?.match(/^прижать/))
            {
                await this.Press(context)
                return true
            }
            if(context.command?.match(/^поцеловать/))
            {
                await this.Kiss(context)
                return true
            }
            if(context.command?.match(/^шлепнуть/))
            {
                await this.Slap(context)
                return true
            }
            if(context.command?.match(/^лизь/))
            {
                await this.Liz(context)
                return true
            }
            if(context.command?.match(/^дать пять/))
            {
                await this.GiveFive(context)
                return true
            }
            if(context.command?.match(/^записать на ноготочки/))
            {
                await this.SignUpForNails(context)
                return true
            }
            if(context.command?.match(/^испугать/))
            {
                await this.Scare(context)
                return true
            }
            if(context.command?.match(/^извиниться/))
            {
                await this.Sorry(context)
                return true
            }
            if(context.command?.match(/^кусь/))
            {
                await this.Kus(context)
                return true
            }
            if(context.command?.match(/^кастрировать/))
            {
                await this.Castrate(context)
                return true
            }
            if(context.command?.match(/^лизнуть|^облизать|^облизнуть/))
            {
                await this.Lick(context)
                return true
            }
            if(context.command?.match(/^обнять/))
            {
                await this.Cuddle(context)
                return true
            }
            if(context.command?.match(/^отравить/))
            {
                await this.Poison(context)
                return true
            }
            if(context.command?.match(/^поздравить/))
            {
                await this.Congratulate(context)
                return true
            }
            if(context.command?.match(/^послать наxуй/))
            {
                await this.FuckOff(context)
                return true
            }
            if(context.command?.match(/^похвалить/))
            {
                await this.Praise(context)
                return true
            }
            if(context.command?.match(/^понюхать/))
            {
                await this.Smell(context)
                return true
            }
            if(context.command?.match(/^погладить/))
            {
                await this.Stroke(context)
                return true
            }
            if(context.command?.match(/^пригласить на ча.к/))
            {
                await this.InviteToTea(context)
                return true
            }
            if(context.command?.match(/^пнуть/))
            {
                await this.Kick(context)
                return true
            }
            if(context.command?.match(/^покормить/))
            {
                await this.Feed(context)
                return true
            }
            if(context.command?.match(/^расстрелять/))
            {
                await this.Shoot(context)
                return true
            }
            if(context.command?.match(/^сжечь/))
            {
                await this.Burn(context)
                return true
            }
            if(context.command?.match(/^ущипнуть/))
            {
                await this.Pinch(context)
                return true
            }
            if(context.command?.match(/^уебать/))
            {
                await this.Broke(context)
                return true
            }
            if(context.command?.match(/^ударить/))
            {
                await this.Brake(context)
                return true
            }
            if(context.command?.match(/^укусить/))
            {
                await this.Bite(context)
                return true
            }
            if(context.command?.match(/^убить/))
            {
                await this.Kill(context)
                return true
            }
            if(context.command?.match(/^пригласить на чай/))
            {
                await this.InviteToTea2(context)
                return true
            }
            if(context.command?.match(/^куснуть/))
            {
                await this.Nip(context)
                return true
            }

            if(!context.player) return

            if(context.command?.match(Commands.location))
            {
                await this.LocationRequest(context)
                return true
            }
            if(context.command?.match(Commands.aboutMe))
            {
                await context.send(context.player.GetInfo(true), {parse_mode: 'MarkdownV2'})
                return true
            }
            if(context.command?.match(Commands.checkDocs))
            {
                await this.CheckDocs(context)
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
            if(context.command?.match(Commands.map))
            {
                await this.RoadMap(context)
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
            if(context.command?.match(Commands.changeNick))
            {
                await this.ChangeNick(context)
                return true
            }
            if(context.command?.match(Commands.changeDescription))
            {
                await this.ChangeDescription(context)
                return true
            }
            if(context.command?.match(Commands.extract))
            {
                await this.Extract(context)
                return true
            }
            if(context.command?.match(Commands.refuseCitizenship))
            {
                await this.RefuseCitizenship(context)
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
            if(context.command?.match(/^бот статус$/))
            {
                await context.send(`⏳ Последняя перезагрузка была ${NameLibrary.ParseDateTime(Data.lastReload)}`)
                return true
            }
            if(context.command?.match(Commands.work))
            {
                await this.Work(context)
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
            if(context.command?.match(Commands.delete))
            {
                await this.DeleteMessage(context)
                return true
            }
            if(context.command?.match(Commands.mute))
            {
                await this.Mute(context)
                return true
            }
            if(context.command?.match(Commands.unmute))
            {
                await this.Unmute(context)
                return true
            }

            //ГМ+
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
            if(context.command?.match(/^добавить чат /))
            {
                await this.AddCountryChat(context)
                return true
            }
            if(context.command?.match(/^удалить чат/))
            {
                await this.RemoveCountryChat(context)
                return true
            }
            if(context.command?.match(/^бан$/))
            {
                await this.Ban(context)
                return true
            }
            if(context.command?.match(/^разбан$/))
            {
                await this.UnBan(context)
                return true
            }
        }
        catch (e){}
    }

    async UnBan(context)
    {
        try
        {
            let temp = null
            let country = null
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].TGchatID)
                    {
                        temp = Data.countries[i].TGchatID.split("|")
                        for(const chat of temp)
                        {
                            if (chat.match(context.chat.id))
                            {
                                country = Data.countries[i]
                                break
                            }
                        }
                    }
                }
            }
            let isLeader = country?.leaderID === context.player.id
            if(NameLibrary.RoleEstimator(context.player.role) === 0 && !isLeader)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                return
            }
            try
            {
                await context.api.unbanChatMember(context.chat.id, context.replyPlayers[0])
                await context.send("✅ Пользователь разблокирован")
            }
            catch (e)
            {
                await context.send("💩 Не могу, это незаконно")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/AddCountryChat", e)
        }
    }

    async Ban(context)
    {
        try
        {
            let temp = null
            let country = null
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].TGchatID)
                    {
                        temp = Data.countries[i].TGchatID.split("|")
                        for(const chat of temp)
                        {
                            if (chat.match(context.chat.id))
                            {
                                country = Data.countries[i]
                                break
                            }
                        }
                    }
                }
            }
            let isLeader = country?.leaderID === context.player.id
            if(NameLibrary.RoleEstimator(context.player.role) === 0 && !isLeader)
            {
                return
            }
            if(context.replyPlayers.length === 0)
            {
                return
            }
            const player = await Player.findOne({where: {TGID: context.replyPlayers[0]}})
            if(player)
            {
                if(NameLibrary.RoleEstimator(player.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send("⚠ Вы не можете забанить старшего или равного по званию")
                    return
                }
            }
            try
            {
                await context.api.banChatMember(context.chat.id, context.replyPlayers[0])
                await context.send("✅ Пользователь заблокирован в этом чате")
            }
            catch (e)
            {
                await context.send("💩 Не могу, это незаконно")
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
                    if(Data.countries[i].TGchatID)
                    {
                        temp = Data.countries[i].TGchatID.split("|")
                        for(const chat of temp)
                        {
                            if(chat.match(context.chat.id))
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
            temp = country.TGchatID ? country.TGchatID.split("|") : []
            temp = temp.filter(chat => {return parseInt(chat) !== context.chat.id})
            country.TGchatID = (temp.length === 0 ? null : temp.join("|"))
            await Country.update({chatID: country.TGchatID}, {where: {id: country.id}})
            await Data.ReloadChats()
            await context.send(`✅ Чат \\${context.chat.id} больше не принадлежит фракции ${country.GetName(context.player.platform === "IOS", "TG")}`, {parse_mode: 'MarkdownV2'})
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
                    if(Data.countries[i].TGchatID)
                    {
                        temp = Data.countries[i].TGchatID.split("|")
                        for(const chat of temp)
                        {
                            if(chat.match(context.chat.id))
                            {
                                await context.send(`⚠ Этот чат используется фракцией ${Data.countries[i].GetName(context.player.platform === "IOS", "TG")}`, {parse_mode: 'MarkdownV2'})
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
            temp = country.TGchatID ? country.TGchatID.split("|") : []
            temp.push(context.chat.id)
            country.TGchatID = temp.join("|")
            await Country.update({TGchatID: country.TGchatID}, {where: {id: country.id}})
            await Data.ReloadChats()
            await context.send(`✅ Чат \\${context.chat.id} теперь принадлежит фракции ${country.GetName(context.player.platform === "IOS", "TG")}`, {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/AddCountryChat", e)
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
            const user = await Player.findOne({where: {TGID: context.replyPlayers[0]}})
            if(!user)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                return
            }
            const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}, attributes: ["location", "countryID"]})
            await context.send(`📍 Игрок находится в городе ${Data.cities[userStatus.dataValues.location].name}, фракция ${Data.countries[userStatus.dataValues.countryID].GetName(context.player.platform === "IOS", "TG")}`, {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/LocatePlayer", e)
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
                user = context.player.TGID
            }
            let player = await Player.findOne({where: {TGID: user}})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                return
            }
            player = await PlayerResources.findOne({where: {id: player.dataValues.id}})
            user = player.dataValues.id
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
        catch (e) {}
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
                user = [context.player.TGID]
            }
            let player = await Player.findAll({where: {TGID: user}, attributes: ["id"]})
            if(player === 0)
            {
                await context.send("⚠ Игрок не зарегистрирован")
                return
            }
            user = player.map(key => {return key.dataValues.id})
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
            await context.send(request)
        }
        catch (e){}
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
                await context.send("ℹ Вы отправились в фракцию " + country.GetName(context.player.platform === "IOS", "TG"), {parse_mode: 'MarkdownV2'})
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
                user = context.player.TGID
            }
            let player = await Player.findOne({where: {TGID: user}, attributes: ["id"]})
            if(!player)
            {
                await context.send("⚠ Игрок не подвязан к ВК")
                return
            }
            user = player.dataValues.id
            let status = await PlayerStatus.findOne({where: {id: user}})
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
            await context.send(`✅ Игрок телепортирован в фракцию ${country.GetName(context.player.platform === "IOS", "TG")}`, {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Teleport", e)
        }
    }

    async Work(context)
    {
        try
        {
            const country = Data.countries[context.player.countryID]
            let kb = [[], [], []]
            country.resources.match(/wood/) && kb[0].push({text: "🌳 Лес 🪓", callback_data: "extract_wood"})
            country.resources.match(/wheat/) && kb[0].push({text: "🌾 Собрать зерно 🌾", callback_data: "extract_wheat"})
            country.resources.match(/stone/) && kb[1].push({text: "🪨 Копать камень ⛏", callback_data: "extract_stone"})
            country.resources.match(/iron/) && kb[1].push({text: "🌑 Добыть железо ⛏", callback_data: "extract_iron"})
            country.resources.match(/copper/) && kb[2].push({text: "🥉 Добыть бронзы ⛏", callback_data: "extract_copper"})
            country.resources.match(/silver/) && kb[2].push({text: "🥈 Добыть серебра ⛏", callback_data: "extract_silver"})
            await context.send(`🚧 Здравствуй, путник. Вижу, работать хочешь? Что-ж, есть для тебя пару занятий...`, {
                reply_markup: JSON.stringify({
                    inline_keyboard: kb
                })
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/Relax", e)
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
            if(context.peer.muteList[context.replyPlayers[0]])
            {
                delete context.chat.muteList[context.replyPlayers[0]]
                await Data.SaveTGChat(context.chat.peerID)
                await context.send(`✅ С игрока снят локальный мут`)
            }
            else
            {
                await context.send("⚠ Игрок не в муте")
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
            let player = await Player.findOne({where: {TGID: context.replyPlayers[0]}, attributes: ["role"]})
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
            context.peer.muteList[context.replyPlayers[0]] = {
                moderID: context.player.id,
                endTime: now
            }
            await Data.SaveTGChat(context.peer.peerID)
            await context.send(`✅ Игрок ближайшие ${time} минут не будет разговаривать`)
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
            if(NameLibrary.RoleEstimator(context.player.role) === 0) return
            if(!context.reply_to_message) return
            try {await context.api.deleteMessage(context.reply_to_message.chat.id, context.reply_to_message.message_id)} catch (e) {await context.send("😡😡😡 ПРОСТО ДАЙТЕ МНЕ ПУЛЬТ ОТ ЯДЕРКИ!")}
            try {await context.api.deleteMessage(context.chat.id, context.message_id)} catch (e) {}
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/DeleteMessage", e)
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
                    temp = await Player.findOne({where: {TGID: i}})
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
                await context.send("⚠ Игрок не подвязан, используйте кик")
                return
            }
            const players = await Player.findAll({where: {TGID: context.replyPlayers}})
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игроков:\n${players?.map(user => {
                return ` *id${user.dataValues.id}(${user.dataValues.nick})`
            })}`, [[keyboard.startButton({type: "new_warning", users: players.map(user => {return user.dataValues.id}).join(";")})], [keyboard.backButton]])
            context.player.state = context.scenes.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС бота в ВК")
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
            const players = await Player.findAll({where: {TGID: context.replyPlayers}})
            context.player.lastReportTime = time
            await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игрок${players?.map(user => {
                return ` *id${user.dataValues.id}(${user.dataValues.nick})`
            })}`, [[keyboard.startButton({type: "new_report", users: players.map(user => {return user.dataValues.id}).join(";")})], [keyboard.backButton]])
            context.player.state = context.scenes.FillingOutTheForm
            await context.send("ℹ Заполните форму в ЛС бота в ВК")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/SendWarningForm", e)
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
            const player = await Player.findOne({where: {TGID: context.replyPlayers[0]}, attributes: ["id"]})
            await context.send(`TG: ${context.replyPlayers[0]}\nVK: ${player ? player.dataValues.id : "Не подвязан"}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetID", e)
        }
    }

    async Nip(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^куснуть ?\n?/i, "")
            await context.send(`😬 | @${context.from.username} кусьнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async InviteToTea2(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^пригласить на чай ?\n?/i, "")
            await context.send(`☕ | @${context.from.username} пригласил на чай ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Kill(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^убить ?\n?/i, "")
            await context.send(`🤡🔪 | @${context.from.username} убил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Bite(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^укусить ?\n?/i, "")
            await context.send(`😬 | @${context.from.username} укусил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Brake(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^ударить ?\n?/i, "")
            await context.send(`🤜😵 | @${context.from.username} ударил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Broke(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^уебать ?\n?/i, "")
            await context.send(`🤜🤕 | @${context.from.username} жёстко вдарил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Pinch(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^ущипнуть ?\n?/i, "")
            await context.send(`😮 | @${context.from.username} ущипнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Burn(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^сжечь ?\n?/i, "")
            await context.send(`🔥 | @${context.from.username} сжёг ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Shoot(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^расстрелять ?\n?/i, "")
            await context.send(`🔫 | @${context.from.username} расстрелял ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Feed(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^покормить ?\n?/i, "")
            await context.send(`🍕 | @${context.from.username} покормил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Kick(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^пнуть ?\n?/i, "")
            await context.send(`👞 | @${context.from.username} пнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async InviteToTea(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^погладить ?\n?/i, "")
            await context.send(`☕ | @${context.from.username} пригласил на чаёк 🧁 ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Stroke(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^погладить ?\n?/i, "")
            await context.send(`👋 | @${context.from.username} погладил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Smell(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^понюхать ?\n?/i, "")
            await context.send(`👃 | @${context.from.username} понюхал ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Praise(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^похвалить ?\n?/i, "")
            await context.send(`👏 | @${context.from.username} похвалил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async FuckOff(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^послать наxуй ?\n?/i, "")
            await context.send(`🖕 | @${context.from.username} послал куда подальше ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Congratulate(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^поздравить ?\n?/i, "")
            await context.send(`🥳 | @${context.from.username} поздравил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Poison(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^отравить ?\n?/i, "")
            await context.send(`💊 | @${context.from.username} отравил ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Cuddle(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^обнять ?\n?/i, "")
            await context.send(`🤗 | @${context.from.username} обнял ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Lick(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^лизнуть ?\n?|^облизать ?\n?|^облизнуть ?\n?/i, "")
            await context.send(`👅 | @${context.from.username} лизнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Castrate(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^кастрировать ?\n?/i, "")
            await context.send(`✂ | @${context.from.username} кастрировал ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Kus(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^кусь ?\n?/i, "")
            await context.send(`😬 | @${context.from.username} кусьнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Sorry(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^извиниться ?\n?/i, "")
            await context.send(`🙏 | @${context.from.username} извинился(ась) перед ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Liz(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^лизь ?\n?/i, "")
            await context.send(`👅 | @${context.from.username} лизнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async GiveFive(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^дать пять ?\n?/i, "")
            await context.send(`🙏🏻 | @${context.from.username} дала пять ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Scare(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^испугать ?\n?/i, "")
            await context.send(`😱 | @${context.from.username} испугал ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async SignUpForNails(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^записать на ноготочки ?\n?/i, "")
            await context.send(`💅 | @${context.from.username} записал на ноготочки ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Slap(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^шлепнуть ?\n?/i, "")
            await context.send(`👏 | @${context.from.username} шлепнул ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Kiss(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^поцеловать ?\n?/i, "")
            await context.send(`😘 | @${context.from.username} поцеловал ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Press(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^прижать ?\n?/i, "")
            await context.send(`🤲 | @${context.from.username} прижал ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Suck(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^отсосать ?\n?/i, "")
            await context.send(`🥳 | @${context.from.username} отсосал у ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Giving(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^отдаться ?\n?/i, "")
            await context.send(`💝 | @${context.from.username} отдался ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Sex(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^делать секс ?\n?/i, "")
            await context.send(`👉👌🤪 | @${context.from.username} сделал секс с ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Fuck(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^трахнуть ?\n?/i, "")
            await context.send(`👉👌 | @${context.from.username} принудил к интиму ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async HardFuck(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^выебать ?\n?/i, "")
            await context.send(`👉👌😬 | @${context.from.username} принудил к жёсткому интиму ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Poke(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^тыкнуть ?\n?|^тык ?\n?/i, "")
            await context.send(`👉🐽 | @${context.from.username} потрогал палкой ${context.mentions[0]}` + (phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""))
        }
        catch (e) {}
    }

    async Shake(context)
    {
        try
        {
            if(context.mentions.length === 0) return
            let phrase = context.text.replace(/@\S+ ?/i, "")
            phrase = phrase?.trimStart()
            phrase = phrase?.replace(/^пожать /i, "")
            if(phrase.match(/^хуй|^писюн|^пись?ку|^член|^пенис/))
            {
                phrase = phrase.replace(/^хуй ?\n?|^писюн ?\n?|^пись?ку ?\n?|^член ?\n?|^пенис ?\n?/i, "")
                await context.send(`🫱🍆 | @${context.from.username} пожал писюн ${context.mentions[0]}${phrase.length !== 0 ? `\n💬 С репликой: «${phrase}»` : ""}`)
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
                await context.send(`${context.player.nick}, повтори через ${NameLibrary.ParseFutureTime(context.player.lastBeerCup)} Выпито всего - ${context.player.beer.toFixed(1)} л. 🍺`)
                return
            }
            time.setHours(time.getHours() + 1)
            let drinking = Math.random() * 3
            context.player.beer += parseFloat(drinking.toFixed(1))
            context.player.lastBeerCup = time
            await Player.update({beer: context.player.beer}, {where: {id: context.player.id}})
            await context.send(`${context.player.nick}, ты выпил${context.player.gender ? "" : "а"} ${drinking.toFixed(1)} л. пива. Выпито всего - ${context.player.beer.toFixed(1)} л. 🍺\nСледующая попытка через час`)
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
                            request += `\n[${Data.officials[countryID][id].nick}](https://vk.com/id${id})`
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
            request += country.GetName(false, "TG") + "\n"
            request += country.description + "\n\n"
            request += "🌐 Столица \\- " + Data.cities[country.capitalID].name + "\n"
            request += "👥 Население \\- " + population + "\n"
            request += `👑 Правител${country.isParliament ? "и:\n" : "ь \\- "}${country.isParliament ? ((leader ? `[${leader.dataValues.nick}](https://vk.com/id${country.leaderID})` : "") + getLeaders(country.id)) : (leader ? `[${leader.dataValues.nick}](https://vk.com/id${country.leaderID})` : "Не назначен")}\n`
            request += "🏛 Форма правления \\- " + country.governmentForm + "\n\n"
            request += "На территории можно добыть:\n\n"
            let res = country.resources.split(".")
            for(const r of res)
            {
                request += NameLibrary.GetResourceName(r) + "\n"
            }
            if(country.tested) request += "\n❗ Фракция находится на испытательном сроке\n"
            request += "\n🏆 Стабильность \\- " + country.stability + "\n"
            if(NameLibrary.RoleEstimator(context.player.role) > 1)
            {
                request += "🌾 Крестьянство и горожане \\- " + country.peasantry + "\n"
                request += "🙏 Религия \\- " + country.religion + "\n"
                request += "👑 Аристократия \\- " + country.aristocracy + "\n"
                request += "⚔ Военные \\- " + country.military + "\n"
                request += "💰 Купечество \\- " + country.merchants + "\n"
            }
            await context.send(request, {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CountryInfo", e)
        }
    }

    async GetResources(context)
    {
        try
        {
            if(context.replyPlayers?.length !== 0 && NameLibrary.RoleEstimator(context.player.role) >= 1)
            {
                let player = await Player.findOne({where: {TGID: context.replyPlayers[0]}})
                if(!player)
                {
                    await context.send("⚠ Игрок не привязан к ВК")
                    return
                }
                let resources = await PlayerResources.findOne({where: {id: player.dataValues.id}})
                await context.send(`[Инвентарь](https://vk.com/id${player.dataValues.id}):\n\n💰 Монеты \\- ${resources.dataValues.money > 0 ? resources.dataValues.money : "\\" + resources.dataValues.money}\n🪨 Камень \\- ${resources.dataValues.stone > 0 ? resources.dataValues.stone : "\\" + resources.dataValues.stone}\n🌾 Зерно \\- ${resources.dataValues.wheat > 0 ? resources.dataValues.wheat : "\\" + resources.dataValues.wheat}\n🪵 Дерево \\- ${resources.dataValues.wood > 0 ? resources.dataValues.wood : "\\" + resources.dataValues.wood}\n🌑 Железо \\- ${resources.dataValues.iron > 0 ? resources.dataValues.iron : "\\" + resources.dataValues.iron}\n🥉 Бронза \\- ${resources.dataValues.copper > 0 ? resources.dataValues.copper : "\\" + resources.dataValues.copper}\n🥈 Серебро \\- ${resources.dataValues.silver > 0 ? resources.dataValues.silver : "\\" + resources.dataValues.silver}\n💎 Алмазы \\- ${resources.dataValues.diamond > 0 ? resources.dataValues.diamond : "\\" + resources.dataValues.diamond}`, {parse_mode: 'MarkdownV2'})
                return
            }
            await context.send(context.player.GetResources("TG"), {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetResources", e)
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
            await context.send(source.GetResources("TG"), {parse_mode: 'MarkdownV2'})
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
                        attachment: null
                    }
                    await PlayerInfo.update({botMemory: JSON.stringify(Data.requests[context.replyPlayers[0]])}, {where: {id: context.replyPlayers[0]}})
                    await context.send("✅ Ок, запомнил.")
                    return
                }
            }
            Data.requests[context.player.id] = {
                sample: phrase ? phrase : ".",
                attachment: null
            }
            await PlayerInfo.update({botMemory: JSON.stringify(Data.requests[context.player.id])}, {where: {id: context.player.id}})
            await context.send("✅ Ок, запомнил.")
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/BotMem", e)
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
                    await context.send(`💎 Вы нашли алмаз!`)
                }
                obj[resource] = extraction
                await Data.AddPlayerResources(context.player.id, obj)
                await context.send(`✅ Вы добыли ${NameLibrary.GetResourceName(resource)} ${extraction}`)
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

    async ChangeDescription(context)
    {
        try
        {
            if(!context.text) return
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

    async ChangeNick(context)
    {
        try
        {
            if(!context.text) return
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

    async GetCitizenship(context)
    {
        try
        {
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
                if(Data.users[Data.TGusers[context.replyPlayers[0]]])
                {
                    if(Data.activity[Data.TGusers[context.replyPlayers[0]]]) activity.todayMessages = Data.activity[Data.TGusers[context.replyPlayers[0]]]
                    if(Data.musicLovers[Data.TGusers[context.replyPlayers[0]]]) activity.todayAudios = Data.musicLovers[Data.TGusers[context.replyPlayers[0]]]
                    if(Data.stickermans[Data.TGusers[context.replyPlayers[0]]]) activity.todayStickers = Data.stickermans[Data.TGusers[context.replyPlayers[0]]]
                    if(Data.uncultured[Data.TGusers[context.replyPlayers[0]]]) activity.todaySwords = Data.uncultured[Data.TGusers[context.replyPlayers[0]]]
                    activity.allMessages = Data.users[Data.TGusers[context.replyPlayers[0]]].msgs + activity.todayMessages
                    activity.allAudios = Data.users[Data.TGusers[context.replyPlayers[0]]].audios + activity.todayAudios
                    activity.allStickers = Data.users[Data.TGusers[context.replyPlayers[0]]].stickers + activity.todayStickers
                    activity.allSwords = Data.users[Data.TGusers[context.replyPlayers[0]]].swords + activity.todaySwords
                }
                else
                {
                    const user = await PlayerInfo.findOne({where: {TGID: context.replyPlayers[0]}})
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
                if(Data.activity[Data.TGusers[context.player.id]]) activity.todayMessages = Data.activity[Data.TGusers[context.player.id]]
                if(Data.musicLovers[Data.TGusers[context.player.id]]) activity.todayAudios = Data.musicLovers[Data.TGusers[context.player.id]]
                if(Data.stickermans[Data.TGusers[context.player.id]]) activity.todayStickers = Data.stickermans[Data.TGusers[context.player.id]]
                if(Data.uncultured[Data.TGusers[context.player.id]]) activity.todaySwords = Data.uncultured[Data.TGusers[context.player.id]]
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
        catch (e) {}
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
                await context.send(request.slice((i * 3900), (i * 3900) + 3900))
            }
        }
        catch (e) {}
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
                            request += `\n${Data.officials[countryID][id].nick}`
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
                    request += `${country[0].name}\n`
                    request += `👥 Население - ${country[1]} чел.\n`
                    request += `🏆 Стабильность - ${country[0].stability}\n`
                    request += `🌆 Столица - ${Data.cities[country[0].capitalID].name}\n`
                    request += `👑 Правител${country[0].isParliament ? "и:\n" : "ь - "}${country[0].isParliament ? ((user ? `${user.dataValues.nick}` : "") + getLeaders(country[0].id)) : (user ? `${user.dataValues.nick}` : "Не назначен")}\n\n`
                }
            }
            await context.send(request)
        }
        catch (e) {}
    }

    async RoadMap(context)
    {
        try
        {
            const build = (countries, cities) => {
                let ctr = []
                let cit = []
                for (let i = 0; i < Math.ceil(countries.length / 2); i++)
                {
                    ctr.push(countries.slice((i * 4), (i * 4) + 4))
                }
                for (let i = 0; i < Math.ceil(cities.length / 2); i++)
                {
                    cit.push(cities.slice((i * 4), (i * 4) + 4))
                }
                return ctr.concat(cit)
            }
            let request = `🗺 Карта дорог\n\nВы находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${Data.countries[Data.cities[context.player.location].countryID].GetName(context.player.platform === "IOS", "TG")}, в городе ${Data.cities[context.player.location].name}\n`
            let countryKB = []
            let cityKB = []
            const countryRoads = await CountryRoads.findAll({where: {fromID: context.player.countryID, isBlocked: false}, limit: 8, attributes: ["toID", "time"]})
            if(countryRoads.length !== 0) request += "\n🔵 Вы можете отправиться в фракции:\n"
            for(const key of countryRoads)
            {
                countryKB.push({text: Data.countries[key.dataValues.toID].name, callback_data: "to_country_" + key.dataValues.toID})
                request += `🔸 ${Data.countries[key.dataValues.toID].name} \\- ${key.dataValues.time} мин, въездная пошлина \\- ${Data.countries[key.dataValues.toID].entranceFee} монет\n`
            }
            const cityRoads = await CityRoads.findAll({where: {fromID: context.player.location, isBlocked: false}, limit: 8, attributes: ["toID", "time"]})
            if(cityRoads.length !== 0) request += "\n⚪ Вы можете посетить города:\n"
            for(const key of cityRoads)
            {
                cityKB.push({text: Data.cities[key.dataValues.toID].name, callback_data: "to_city_" + key.dataValues.toID})
                request += `🔸 ${Data.cities[key.dataValues.toID].name} \\- ${key.dataValues.time} мин\n`
            }
            await context.send(request, {parse_mode: 'MarkdownV2', reply_markup: JSON.stringify({inline_keyboard: build(countryKB, cityKB)})})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/RoadMap", e)
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
            if(result.sleep)
            {
                await context.send(`💤 Вы перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(result.time)}`)
            }
            else
            {
                await context.send(`💪 Ваш уровень энергии восстановлен до ${result.fatigue}%`)
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
                user = await Player.findOne({where: {TGID: context.replyPlayers[0]}})
                if(!user)
                {
                    await context.send("⚠ Игрок не зарегистрирован")
                    return
                }
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
                            await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} поделился с вами марковкой, но из за того что я был голодный - я ее не донес\n👉👈`)
                        }
                    }
                    if(res === "tea")
                    {
                        request += "\n🍵 Чай - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} угостил вас 🍵 чаем!`)
                    }
                    if(res === "beer")
                    {
                        request += "\n🍺 Пиво - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Там это, как там его, игрок ${context.player.name} с вами 🍺 пивом поделился.\n\n🥴🥴🥴 Вкусное пиво было, а чё я пришел?\n\n🥴🥴🥴Не помню уже`)
                    }
                    if(res === "ale")
                    {
                        request += "\n🥃 Эль - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} угостил вас 🥃 элем, но пограничники отобрали его у меня!`)
                    }
                    if(res === "mushroom")
                    {
                        request += "\n🍄 Мухоморы - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} 🤢 поделился с вами 🍄 мухоморами 🤢, а я их 🤢🤢 съел. 🤮🤮🤮\nО, мультики показывают!`)
                    }
                    if(res === "elephant")
                    {
                        request += "\n🐘 Слон - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} отдал вам 🐘 слона, а он ушел! Сам.`)
                    }
                    if(res === "vine")
                    {
                        request += "\n🍾 Вино - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} поделился с вами вином.`)
                    }
                    if(res === "florence vine")
                    {
                        request += "\n🍷 Фалернское вино - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} поделился с вами вином. Похоже на фалернское.`)
                    }
                    if(res === "sicilian vine")
                    {
                        request += "\n🍷 Сицилийское вино - ✅ Передано " + esterEgg[res]
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} поделился с вами вином. На вкус - сицилийское.`)
                    }
                    if(res === "dick")
                    {
                        request += "\n👄 По губам - ✅ Проведено 🍌"
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Игрок ${context.player.name} провел вам по 👄 губам 🍌`)
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
                        await context.api.sendMessage(user.dataValues.TGID, `✅ Вам поступил перевод от игрока ${context.player.nick} в размере:\n${NameLibrary.GetPrice(objIN)}`)
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
                        await context.send("ℹ Подтвердите оплату налога в ЛС бота в ВК")
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
        catch (e) {}
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
            const user = await Player.findOne({where: {TGID: context.replyPlayers[0]}})
            if(!user)
            {
                await context.send("⚠ Игрок не подвязан к ВК")
                return
            }
            const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}})
            const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
            await context.send(`📌Игрок [${user.dataValues.nick}](https://vk.com/id${user.dataValues.id}):\n\n📅 Возраст: ${userInfo.dataValues.age}\n⚤ Пол: ${user.dataValues.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${userInfo.dataValues.nationality}\n💍 Брак: ${userInfo.dataValues.marriedID ? (user.dataValues.gender ? `[💘Жена](https://vk.com/id${userInfo.dataValues.marriedID})` : `[💘 Муж](https://vk.com/id${userInfo.dataValues.marriedID})`) : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(user.dataValues.role)}\n👑 Статус: ${NameLibrary.GetStatusName(user.dataValues.status)}\n🔰 Гражданство: ${userStatus.dataValues.citizenship ? Data.countries[userStatus.dataValues.citizenship].name : "Нет"}\n📍 Прописка: ${userStatus.dataValues.registration ? Data.GetCityName(userStatus.dataValues.registration) : "Нет"}\n🍺 Выпито пива: ${Math.floor(user.dataValues.beer)}\\.${user.dataValues.beer % 1} л\\.\n💭 Описание: ${userInfo.dataValues.description}`, {parse_mode: 'MarkdownV2'})
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/CheckLocation", e)
        }
    }

    async LocationRequest(context)
    {
        try
        {
            const country = Data.countries[context.player.countryID]
            let kb = [[], [], []]
            country.resources.match(/wood/) && kb[0].push({text: "🌳 Лес 🪓", callback_data: "extract_wood"})
            country.resources.match(/wheat/) && kb[0].push({text: "🌾 Собрать зерно 🌾", callback_data: "extract_wheat"})
            country.resources.match(/stone/) && kb[1].push({text: "🪨 Копать камень ⛏", callback_data: "extract_stone"})
            country.resources.match(/iron/) && kb[1].push({text: "🌑 Добыть железо ⛏", callback_data: "extract_iron"})
            country.resources.match(/copper/) && kb[2].push({text: "🥉 Добыть бронзы ⛏", callback_data: "extract_copper"})
            country.resources.match(/silver/) && kb[2].push({text: "🥈 Добыть серебра ⛏", callback_data: "extract_silver"})
            await context.send(`🧭 Вы находитесь в ${Data.cities[context.player.location].isCapital ? "столице" : ""} фракции ${country.name}, в городе ${Data.cities[context.player.location].name}`, {
                reply_markup: JSON.stringify({
                    inline_keyboard: kb
                })
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "TGChatController/LocationRequest", e)
        }
    }

    async GetCountriesActive(context)
    {
        try
        {
            if(context.command.match(/неделя/))
            {
                let {request, short} = await OutputManager.GetWeekActiveMessage({command: context.command, app: "TG"})
                short ? await context.send(request, {parse_mode: 'MarkdownV2'}) : await context.send(request)
            }
            else
            {
                let {request, short} = await OutputManager.GetDayActiveMessage({command: context.command, app: "TG"})
                short ? await context.send(request, {parse_mode: 'MarkdownV2'}) : await context.send(request)
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "ChatController/GetCountriesActive", e)
        }
    }

    async BotCall(context)
    {
        try
        {
            if(Data.requests[context.player.id])
            {
                await context.send(Data.requests[context.player.id].sample.length > 0 ? Data.requests[context.player.id].sample : NameLibrary.GetRandomSample("call_request"))
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
}

module.exports = new TGChatController()