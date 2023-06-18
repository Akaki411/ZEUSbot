const keyboard = require("../variables/Keyboards")
const Data = require("../models/CacheData")
const NameLibrary = require("../variables/NameLibrary")
const {Chats, PlayerStatus, Country, City} = require("../database/Models")
const Builders = require("./BuildersAndControlsScripts")
const api = require("../middleware/API")
const sequelize = require("../database/DataBase")
const ChatController = require("./ChatController")
const {relax} = require("../variables/Commands");

class SceneController
{
    // Стартовый экран
    GetStartMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.menuButton]
        ]
        let time = new Date()
        if(Data.cities[context.player.location]?.leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.mayorMenuButton)
        }
        if(Data.countries[context.player.countryID]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2 || context.official)
        {
            if(!kb[1]) kb[1] = []
            let isOfficial = context.official && NameLibrary.RoleEstimator(context.player.role) <= 3
            kb[1].push(isOfficial ? keyboard.officialMenuButton : keyboard.leaderMenuButton)
            if(NameLibrary.RoleEstimator(context.player.role) > 3) kb[1].push(keyboard.officialMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) === 2)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.GMMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[2]) kb[2] = []
            kb[2].push(keyboard.GMMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[2]) kb[2] = []
            kb[2].push(keyboard.adminPanelButton)
        }
        if(context.player.botCallTime - time > 0 || NameLibrary.RoleEstimator(context.player.role) !== 0)
        {
            kb.push([keyboard.talkButtonButton])
        }
        return kb
    }

    StartScreen = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if("object" === typeof context.messagePayload?.choice)
            {
                context.send("👉🏻 Главное меню",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                return
            }
            if(context.messagePayload?.choice?.match(/menu|admin|mayor_menu|leader_menu|gm_menu|talk/))
            {
                if(context.messagePayload.choice === "menu")
                {
                    context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice === "mayor_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id))
                {
                    context.send("▶ Управление городом",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice === "official_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || context.official))
                {
                    context.send("▶ Меню чиновника",{
                        keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))
                    })
                    context.player.state = this.OfficialMenu
                }
                if(context.messagePayload.choice === "leader_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    context.send("▶ Управление фракцией",{
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard())
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if(context.messagePayload.choice === "admin" && NameLibrary.RoleEstimator(context.player.role) > 2)
                {
                    context.send("▶ Админка",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice === "gm_menu" && NameLibrary.RoleEstimator(context.player.role) > 1)
                {
                    context.send("▶ ГМ-панель",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard())
                    })
                    context.player.state = this.GMMenu
                }
                if(context.messagePayload.choice === "talk")
                {
                    context.send("▶ Диалог с ботом\n\nℹ Бот видит контекст сообщения если если ответить на него, также он может видеть контекст пересланных сообщений (15 сообщений не важно от кого)", {keyboard: keyboard.build(this.GetBotTalkMenuKeyboard())})
                    context.player.state = this.BotTalkMenu
                }
            }
            else
            {
                context.send("👉🏻 Главное меню",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/StartScreen", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Говорить с ботом

    GetBotTalkMenuKeyboard = () =>
    {
        return [[keyboard.backButton]]
    }

    BotTalkMenu = async (context) =>
    {
        try
        {
            let time = new Date()
            if(context.player.botCallTime - time < 0 && NameLibrary.RoleEstimator(context.player.role) === 0)
            {
                await context.send("❗ Вы не можете сейчас тут находиться",{keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                context.player.state = this.StartScreen
                return
            }
            if(context.messagePayload?.choice?.match(/back/))
            {
                await context.send("↪ Назад",{keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                context.player.state = this.StartScreen
                return
            }
            let messages = []
            let limit = 15
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
            let request = await Builders.GetChatGPTRequest(messages)
            for (const sample of request)
            {
                await context.send(sample)
            }
        }
        catch (e) {}
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Ожидание
    WaitingWalkMenu = async (context) =>
    {
        if(await ChatController.CommandHandler(context)) return
        if(Data.timeouts["user_timeout_walk_" + context.player.id])
        {
            context.send(`♿ Вы находитесь в пути.\n\nДо прибытия ${NameLibrary.ParseFutureTime(Data.timeouts["user_timeout_walk_" + context.player.id].time)}`, {
                keyboard: keyboard.none
            })
        }
        else
        {
            context.player.state = this.StartScreen
            context.send("👉🏻 Главное меню",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню чиновника

    GetOfficialMenuKeyboard = (context) =>
    {
        let kb = [
            [],
            [],
            [],
            [keyboard.backButton]
        ]
        if(context.official?.canUseResources || NameLibrary.RoleEstimator(context.player.role) > 3) kb[0].push(keyboard.resourcesButton)
        if(context.official?.canUseArmy || NameLibrary.RoleEstimator(context.player.role) > 3) kb[1].push(keyboard.armyButton)
        if(context.official?.canAppointOfficial || NameLibrary.RoleEstimator(context.player.role) > 3) kb[1].push(keyboard.officialsButton)
        if(context.official?.canBuildCity || context.official?.canAppointMayors || NameLibrary.RoleEstimator(context.player.role) > 3) kb[2].push(keyboard.citiesButton)
        if(context.official?.canBeDelegate || NameLibrary.RoleEstimator(context.player.role) > 3) kb[2].push(keyboard.citizensButton)
        return kb
    }

    GetOfficialsResourceMenuKeyboard = () =>
    {
        return [
            [keyboard.getTaxButton],
            [keyboard.getResourcesButton, keyboard.mintingMoneyButton],
            [keyboard.transactionButton, keyboard.budgetButton, keyboard.setTaxButton],
            [keyboard.backButton]
        ]
    }

    GetOfficialsOfficialsMenuKeyboard = () =>
    {
        return [
            [keyboard.officialListButton, keyboard.changeRightsButton],
            [keyboard.setButton, keyboard.takeAwayRightsButton],
            [keyboard.backButton]
        ]
    }

    GetOfficialsCitizensMenuKeyboard = () =>
    {
        return [
            [keyboard.citizenListButton, keyboard.playersListButton],
            [keyboard.takeAwayCitizenshipButton],
            [keyboard.backButton]
        ]
    }

    GetOfficialsCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.buildCityButton],
            [keyboard.setMayorButton, keyboard.buildingsButton],
            [keyboard.backButton]
        ]
    }

    GetOfficialsArmyMenuKeyboard = () =>
    {
        return [
            [keyboard.upgradeBarakButton],
            [keyboard.trainUnitButton, keyboard.refuseUnitButton],
            [keyboard.armyButton, keyboard.expensesButton],
            [keyboard.backButton]
        ]
    }

    OfficialMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetOfficialMenuKeyboard(context)
            if(context.messagePayload?.choice?.match(/back|resources|army|officials|cities|citizens/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload?.choice?.match(/resources/))
                {
                    await context.send("▶ Ресурсы",{keyboard: keyboard.build(this.GetOfficialsResourceMenuKeyboard())})
                    context.player.state = this.OfficialsResourcesMenu
                }
                if(context.messagePayload?.choice?.match(/officials/))
                {
                    await context.send("▶ Чиновники",{keyboard: keyboard.build(this.GetOfficialsOfficialsMenuKeyboard())})
                    context.player.state = this.OfficialsOfficialsMenu
                }
                if(context.messagePayload?.choice?.match(/citizens/))
                {
                    await context.send("▶ Граждане",{keyboard: keyboard.build(this.GetOfficialsCitizensMenuKeyboard())})
                    context.player.state = this.OfficialsCitizensMenu
                }
                if(context.messagePayload?.choice?.match(/cities/))
                {
                    await context.send("▶ Города",{keyboard: keyboard.build(this.GetOfficialsCitiesMenuKeyboard())})
                    context.player.state = this.OfficialsCitiesMenu
                }
                if(context.messagePayload?.choice?.match(/army/))
                {
                    await context.send("▶ Армия",{keyboard: keyboard.build(this.GetOfficialsArmyMenuKeyboard())})
                    context.player.state = this.OfficialsArmyMenu
                }
            }
            else
            {
                await context.send("👉🏻 Меню чиновника",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/OfficialMenu", e)
        }
    }

    OfficialsArmyMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canUseArmy && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetCountryArmyMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|train_unit|refuse_unit|expenses|army|upgrade_barak/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))})
                    context.player.state = this.OfficialMenu
                }
                if (context.messagePayload.choice.match(/train_unit/))
                {
                    await Builders.TrainUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/refuse_unit/))
                {
                    await Builders.RefuseUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade_barak/))
                {
                    await Builders.UpgradeBarak(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/expenses/))
                {
                    await Builders.UnitsExpenses(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/army/))
                {
                    const army = await context.country.ShowArmy()
                    for(const a of army)
                    {
                        await context.send(a)
                    }
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryInfoMenu", e)
        }
    }

    OfficialsBuildingsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canBuildCity && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetCountryBuildingsMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|new_building|upgrade|give_to_city/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetOfficialsCitiesMenuKeyboard())
                    })
                    context.player.state = this.OfficialsCitiesMenu
                }
                if (context.messagePayload.choice.match(/new_building/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.CreateCountryBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.UpgradeCountryBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/give_to_city/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.GiveToCityBuilding(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryBuildingsMenu", e)
        }
    }

    OfficialsCitiesMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canBuildCity && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetOfficialsCitiesMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|build_city|set_mayor|buildings/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))})
                    context.player.state = this.OfficialMenu
                }
                if (context.messagePayload.choice.match(/build_city/))
                {
                    await Builders.BuildNewCity(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/buildings/))
                {
                    context.send("▶ Постройки", {
                        keyboard: keyboard.build(this.GetCountryBuildingsMenuKeyboard())
                    })
                    context.player.state = this.OfficialsBuildingsMenu
                }
                if (context.messagePayload.choice.match(/set_mayor/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointMayors))
                {
                    await Builders.SetMayor(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Города",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/OfficialsOfficialsMenu", e)
        }
    }

    OfficialsCitizensMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canBeDelegate && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetOfficialsCitizensMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|take_away_citizenship|citizen_list|players_list/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))})
                    context.player.state = this.OfficialMenu
                }
                if (context.messagePayload.choice.match(/take_away_citizenship/))
                {
                    await Builders.TakeAwayCitizenship(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/players_list/))
                {
                    await Builders.GetCountryPlayersList(context)
                }
                if (context.messagePayload.choice.match(/citizen_list/))
                {
                    await Builders.GetCitizenList(context)
                }
            }
            else
            {
                await context.send("👉🏻 Граждане",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/OfficialsOfficialsMenu", e)
        }
    }

    OfficialsOfficialsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canAppointOfficial && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetOfficialsOfficialsMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|official_list|change_rights|set|take_away/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))})
                    context.player.state = this.OfficialMenu
                }
                if (context.messagePayload.choice.match(/official_list/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
                {
                    await Builders.GetCountryOfficials(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/set/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
                {
                    await Builders.SetOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_rights/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    await Builders.ChangeOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/take_away/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    await Builders.TakeAwayOfficial(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Чиновники",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/OfficialsOfficialsMenu", e)
        }
    }

    OfficialsResourcesMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || (context.official?.canUseResources && context.official?.countryID === context.player.countryID))
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            const current_keyboard = this.GetOfficialsResourceMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|get_tax|get_resource|minting_money|transaction|set_tax|budget/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{keyboard: keyboard.build(this.GetOfficialMenuKeyboard(context))})
                    context.player.state = this.OfficialMenu
                }
                if(context.messagePayload?.choice?.match(/get_tax/))
                {
                    await Builders.GetCountryTax(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/get_resource/))
                {
                    await Builders.GetAllCountryResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/minting_money/))
                {
                    await Builders.MintingMoney(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/budget/))
                {
                    await context.send(context.country.GetResources())
                }
                if(context.messagePayload?.choice?.match(/set_tax/))
                {
                    await Builders.SetTax(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/transaction/))
                {
                    if(context.country.isSiege)
                    {
                        await context.send(`В данный момент фракция ${context.country.GetName()} находится в блокаде, переводы ресурсов не возможны`)
                        return
                    }
                    await Builders.CountryTransaction(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Ресурсы",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/OfficialsResourcesMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //ГМ-меню

    GetGMMenuKeyboard = () =>
    {
        return [
            [keyboard.citiesButton, keyboard.usersButton],
            [keyboard.chatListButton, keyboard.eventsButton],
            [keyboard.backButton]
        ]
    }

    GetGMUsersMenuKeyboard = () =>
    {
        return [
            [keyboard.applyEffectsButton, keyboard.removeEffectsButton, keyboard.killButton],
            [keyboard.userInfoButton, keyboard.cheatingResourceButton, keyboard.teleportButton],
            [keyboard.backButton, keyboard.notesButton]
        ]
    }

    GetGMCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.cheatingResourceButton, keyboard.notesButton],
            [keyboard.cityInfoButton, keyboard.buildingsButton],
            [keyboard.backButton]
        ]
    }

    GetGMBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.buildingInfoButton, keyboard.freezeBuildingButton],
            [keyboard.backButton]
        ]
    }

    GetGMCountriesMenuKeyboard = () =>
    {
        return [
            [keyboard.cheatingResourceButton, keyboard.resourcesButton, keyboard.armyButton],
            [keyboard.countryInfoButton, keyboard.notesButton, keyboard.roadsButton],
            [keyboard.backButton, keyboard.variablesButton]
        ]
    }

    GetGMArmyMenuKeyboard = () =>
    {
        return [
            [keyboard.createUnitButton],
            [keyboard.editUnitButton, keyboard.deleteUnitButton],
            [keyboard.backButton]
        ]
    }

    GMMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|events|users|cities|chat_list/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload?.choice?.match(/users/))
                {
                    context.send("▶ Игроки", {
                        keyboard: keyboard.build(this.GetGMUsersMenuKeyboard())
                    })
                    context.player.state = this.GMUsersMenu
                }
                if(context.messagePayload?.choice?.match(/cities/))
                {
                    context.send("▶ Города", {
                        keyboard: keyboard.build(this.GetGMCitiesMenuKeyboard())
                    })
                    context.player.state = this.GMCitiesMenu
                }
                if(context.messagePayload?.choice?.match(/chat_list/))
                {
                    context.send("▶ Фракции", {
                        keyboard: keyboard.build(this.GetGMCountriesMenuKeyboard())
                    })
                    context.player.state = this.GMCountriesMenu
                }
                if(context.messagePayload?.choice?.match(/events/))
                {
                    await Builders.Events(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 ГМ-панель",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMMenu", e)
        }
    }

    GMArmyMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMArmyMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|create_unit|delete_unit|edit_unit/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMCountriesMenuKeyboard())
                    })
                    context.player.state = this.GMCountriesMenu
                }
                if (context.messagePayload.choice.match(/create_unit/))
                {
                    await Builders.CreateUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/delete_unit/))
                {
                    await Builders.DeleteUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/edit_unit/))
                {
                    await Builders.EditUnit(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Армия",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMCountriesMenu", e)
        }
    }

    GMCountriesMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMCountriesMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|cheating_resource|country_info|resources|roads|army|notes|variables/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard())
                    })
                    context.player.state = this.GMMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingCountryResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/country_info/))
                {
                    await Builders.GetCountryInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/resources/))
                {
                    await Builders.ChangeCountryResource(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/roads/))
                {
                    await Builders.RoadControls(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/notes/))
                {
                    await Builders.CountryNotes(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/variables/))
                {
                    await Builders.SetCountryVariable(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/army/))
                {
                    context.send("▶ Армия",{
                        keyboard: keyboard.build(this.GetGMArmyMenuKeyboard())
                    })
                    context.player.state = this.GMArmyMenu
                }
            }
            else
            {
                context.send("👉🏻 Фракции",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMCountriesMenu", e)
        }
    }

    GMBuildingsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMBuildingsMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|building_info|freeze_building/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMCitiesMenuKeyboard())
                    })
                    context.player.state = this.GMCitiesMenu
                }
                if(context.messagePayload?.choice?.match(/building_info/))
                {
                    await Builders.GetBuildingInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/freeze_building/))
                {
                    await Builders.FreezeBuilding(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMBuildingsMenu", e)
        }
    }

    GMCitiesMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMCitiesMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|cheating_resource|city_info|buildings|notes/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard())
                    })
                    context.player.state = this.GMMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingCityResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/city_info/))
                {
                    await Builders.GetCityInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/notes/))
                {
                    await Builders.CityNotes(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/buildings/))
                {
                    context.send("▶ Постройки", {
                        keyboard: keyboard.build(this.GetGMBuildingsMenuKeyboard())
                    })
                    context.player.state = this.GMBuildingsMenu
                }
            }
            else
            {
                context.send("👉🏻 Игроки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMCitiesMenu", e)
        }
    }

    GMUsersMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGMUsersMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|cheating_resource|user_info|teleport|remove_effects|apply_effects|notes|kill/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard())
                    })
                    context.player.state = this.GMMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingUserResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/user_info/))
                {
                    await Builders.GetUserInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/teleport/))
                {
                    await Builders.TeleportUser(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/remove_effects/))
                {
                    await Builders.RemoveEffect(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/apply_effects/))
                {
                    await Builders.AddEffect(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/notes/))
                {
                    await Builders.PlayerNotes(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/kill/))
                {
                    await Builders.KillPlayer(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Игроки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GMUsersMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Админ-панель
    GetAdminMenuKeyboard = (context) =>
    {
        const kb = [
            [keyboard.usersButton, keyboard.chatListButton],
            [keyboard.citiesButton],
            [keyboard.backButton]
        ]
        NameLibrary.RoleEstimator(context.player.role) >= 4 && kb[1].push(keyboard.technicalButton)
        return kb
    }

    GetAdminTechnicalMenuKeyboard = () =>
    {
        return [
            [keyboard.uploadMapButton],
            [keyboard.logListButton, keyboard.uploadLogButton, keyboard.clearLogsButton],
            [keyboard.clearUserCacheButton, keyboard.variablesButton],
            [keyboard.sqlButton, keyboard.DBAdminButton],
            [keyboard.backButton]
        ]
    }

    GetAdminCountriesMenuKeyboard = () =>
    {
        return [
            [keyboard.createCountryButton, keyboard.removeCountryButton],
            [keyboard.appointLeaderCountryButton, keyboard.tagsButton, keyboard.addTheChatButton],
            [keyboard.warningsButton, keyboard.activeButton, keyboard.testButton],
            [keyboard.backButton]
        ]
    }

    GetAdminsCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.setMayorButton],
            [keyboard.buildCityButton, keyboard.removeCityButton],
            [keyboard.backButton]
        ]
    }

    GetAdminUsersMenuKeyboard = () =>
    {
        return [
            [keyboard.warningsButton, keyboard.bansButton],
            [keyboard.giveRoleButton, keyboard.addMessageButton, keyboard.cheatingDiamondsButton],
            [keyboard.backButton]
        ]
    }

    AdminPanel = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetAdminMenuKeyboard(context)
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|chat_list|users|technical|cities/))
            {
                if(context.messagePayload?.choice?.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload?.choice?.match(/chat_list/))
                {
                    context.send("▶ Фракции",{
                        keyboard: keyboard.build(this.GetAdminCountriesMenuKeyboard())
                    })
                    context.player.state = this.AdminCountriesMenu
                }
                if(context.messagePayload?.choice?.match(/users/))
                {
                    context.send("▶ Пользователи",{
                        keyboard: keyboard.build(this.GetAdminUsersMenuKeyboard())
                    })
                    context.player.state = this.AdminUsersMenu
                }
                if(context.messagePayload?.choice?.match(/technical/))
                {
                    context.send("▶ Техническое",{
                        keyboard: keyboard.build(this.GetAdminTechnicalMenuKeyboard())
                    })
                    context.player.state = this.AdminTechnicalMenu
                }
                if(context.messagePayload?.choice?.match(/cities/))
                {
                    context.send("▶ Города",{
                        keyboard: keyboard.build(this.GetAdminsCitiesMenuKeyboard())
                    })
                    context.player.state = this.AdminCitiesMenu
                }
            }
            else if(context.command?.match(/время/))
            {
                let time = new Date()
                await context.send(time.toString())
            }
            else
            {
                context.send("👉🏻 Админка",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/AdminPanel", e)
        }
    }

    AdminTechnicalMenu = async (context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminTechnicalMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|sql|upload_log|log_list|clear_logs|clear_user_cache|upload_map|variables/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload?.choice?.match(/sql/))
                {
                    await Builders.SQLSession(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/upload_log/))
                {
                    await Builders.SendLog(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/log_list/))
                {
                    await Builders.SendLogList(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/clear_logs/))
                {
                    await Builders.ClearLogs(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/clear_user_cache/))
                {
                    await Builders.ClearUserCache(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/upload_map/))
                {
                    await Builders.ChangeMap(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/variables/))
                {
                    await Builders.ChangeVariables(context, current_keyboard)
                }
            }
            else if(context.command.match(/перезагруз|reload/))
            {
                await api.SaveTimeouts()
                process.exit(0)
            }
            else
            {
                await context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/AdminTechnicalMenu", e)
        }
    }

    AdminCountriesMenu = async (context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetAdminCountriesMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|create_country|remove_country|appoint_leader|add_the_chat|tags|warnings|active|test/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice.match(/create_country/))
                {
                    await Builders.NewCountry(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/appoint_leader/))
                {
                    await Builders.AppointLeader(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/add_the_chat/))
                {
                    await Builders.ChatControls(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/remove_country/))
                {
                    await Builders.RemoveCountry(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/tags/))
                {
                    await Builders.CountryTags(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/warnings/))
                {
                    await Builders.CountryWarnings(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/active/))
                {
                    await Builders.CountryActive(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/test/))
                {
                    await Builders.TestCountry(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/AdminControlsMenu", e)
        }
    }

    AdminCitiesMenu = async (context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetAdminsCitiesMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|set_mayor|build_city|remove_city/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice.match(/build_city/))
                {
                    await Builders.CreateNewCity(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/remove_city/))
                {
                    await Builders.RemoveCity(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/set_mayor/))
                {
                    await Builders.SetMayor(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/AdminControlsMenu", e)
        }
    }

    AdminUsersMenu = async (context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetAdminUsersMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|warnings|bans|add_message|give_role|cheating_diamonds/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if (context.messagePayload.choice.match(/warnings/))
                {
                    await Builders.Warnings(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/bans/))
                {
                    await Builders.Bans(context, current_keyboard)
                }
                if(context.messagePayload?.choice?.match(/give_role/))
                {
                    await Builders.ChangeRole(context, current_keyboard, {
                        GetStartMenuKeyboard: this.GetStartMenuKeyboard,
                        StayInStartScreen: this.StartScreen
                    })
                }
                if(context.messagePayload.choice.match(/add_message/))
                {
                    await Builders.AddMessage(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/cheating_diamonds/))
                {
                    await Builders.CheatingUserDiamonds(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Статистика",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/AdminUsersMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню правителя

    GetGovernanceCountryMenuKeyboard = () =>
    {
        return [
            [keyboard.budgetButton],
            [keyboard.citiesButton, keyboard.citizensButton],
            [keyboard.officialsButton, keyboard.armyButton],
            [keyboard.backButton, keyboard.parametersButton]
        ]
    }

    GetCountryArmyMenuKeyboard = () =>
    {
        return [
            [keyboard.upgradeBarakButton],
            [keyboard.trainUnitButton, keyboard.refuseUnitButton],
            [keyboard.armyButton, keyboard.expensesButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCountryMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.transferPowerButton],
            [keyboard.nameButton, keyboard.descriptionButton, keyboard.governmentFormButton],
            [keyboard.publicButton, keyboard.photoButton, keyboard.welcomePictureButton],
            [keyboard.backButton, keyboard.countryInfoButton, keyboard.countryParliamentButton]
        ]
        if(Data.countries[context.player.countryID].notifications) kb[0].push(keyboard.notificationsOffButton)
        else kb[0].push(keyboard.notificationsOnButton)
        return kb
    }

    GetCountryBudgetMenuKeyboard = () =>
    {
        return [
            [keyboard.getResourcesButton, keyboard.mintingMoneyButton],
            [keyboard.setTaxButton, keyboard.getTaxButton, keyboard.transactionButton],
            [keyboard.backButton, keyboard.resourcesButton]
        ]
    }

    GetCountryCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.setMayorButton, keyboard.buildCityButton],
            [keyboard.citiesButton, keyboard.buildingsButton],
            [keyboard.backButton]
        ]
    }

    GetCountryOfficialsMenuKeyboard = () =>
    {
        return [
            [keyboard.officialListButton],
            [keyboard.changeRightsButton, keyboard.setButton],
            [keyboard.backButton, keyboard.takeAwayRightsButton]
        ]
    }

    GetCountryBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.upgradeButton],
            [keyboard.backButton, keyboard.giveToCityButton]
        ]
    }

    GetCountryCitizensMenuKeyboard = () =>
    {
        return [
            [keyboard.playersListButton, keyboard.citizenListButton],
            [keyboard.backButton, keyboard.takeAwayCitizenshipButton]
        ]
    }

    GovernanceCountryMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetGovernanceCountryMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|budget|cities|citizens|officials|params|army/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/army/))
                {
                    await context.send("▶ Армия",{keyboard: keyboard.build(this.GetCountryArmyMenuKeyboard())})
                    context.player.state = this.CountryArmyMenu
                }
                if(context.messagePayload.choice.match(/params/))
                {
                    await context.send("▶ Параметры",{keyboard: keyboard.build(this.GetChangeCountryMenuKeyboard(context))})
                    context.player.state = this.ChangeCountryMenu
                }
                if(context.messagePayload.choice.match(/cities/))
                {
                    await context.send("▶ Города ",{keyboard: keyboard.build(this.GetCountryCitiesMenuKeyboard())})
                    context.player.state = this.CountryCitiesMenu
                }
                if(context.messagePayload.choice.match(/budget/))
                {
                    if(Data.countries[context.player.countryID].capitalID !== context.player.location && context.player.status !== "worker")
                    {
                        await context.send("⚠ Бюджетом можно управлять только находясь в столице фракции")
                        return
                    }
                    await context.send("▶ Бюджет",{keyboard: keyboard.build(this.GetCountryBudgetMenuKeyboard())})
                    context.player.state = this.CountryBudgetMenu
                }
                if(context.messagePayload.choice.match(/officials/))
                {
                    await context.send("▶ Чиновники",{keyboard: keyboard.build(this.GetCountryOfficialsMenuKeyboard())})
                    context.player.state = this.CountryOfficialsMenu
                }
                if(context.messagePayload.choice.match(/citizens/))
                {
                    await context.send("▶ Граждане",{keyboard: keyboard.build(this.GetCountryCitizensMenuKeyboard())})
                    context.player.state = this.CountryCitizensMenu
                }
            }
            else
            {
                context.send("👉🏻 Управление фракцией",{keyboard: keyboard.build(current_keyboard)})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/GovernanceCountryMenu", e)
        }
    }

    CountryCitizensMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryCitizensMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|players_list|citizen_list|take_away_citizenship/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/players_list/))
                {
                    await Builders.GetCountryPlayersList(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/citizen_list/))
                {
                    await Builders.GetCitizenList(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/take_away_citizenship/))
                {
                    await Builders.TakeAwayCitizenship(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Граждане",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryOfficialsMenu", e)
        }
    }

    CountryOfficialsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryOfficialsMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|official_list|set|change_rights|take_away/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/official_list/))
                {
                    await Builders.GetCountryOfficials(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/set/))
                {
                    await Builders.SetOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_rights/))
                {
                    await Builders.ChangeOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/take_away/))
                {
                    await Builders.TakeAwayOfficial(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Чиновники",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryOfficialsMenu", e)
        }
    }

    CountryCitiesMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryCitiesMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|set_mayor|build_city|buildings|cities/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/set_mayor/))
                {
                    await Builders.SetMayor(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/build_city/))
                {
                    await Builders.BuildNewCity(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/cities/))
                {
                    await Builders.GetCountryCities(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/buildings/))
                {
                    context.send("▶ Постройки", {
                        keyboard: keyboard.build(this.GetCountryBuildingsMenuKeyboard())
                    })
                    context.player.state = this.CountryBuildingsMenu
                }
            }
            else
            {
                context.send("👉🏻 Города",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryControlsMenu", e)
        }
    }

    CountryBuildingsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryBuildingsMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|new_building|upgrade|give_to_city/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetCountryCitiesMenuKeyboard())
                    })
                    context.player.state = this.CountryCitiesMenu
                }
                if (context.messagePayload.choice.match(/new_building/))
                {
                    await Builders.CreateCountryBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade/))
                {
                    await Builders.UpgradeCountryBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/give_to_city/))
                {
                    await Builders.GiveToCityBuilding(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryBuildingsMenu", e)
        }
    }

    CountryBudgetMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryBudgetMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|get_tax|transaction|get_resource|minting_money|set_tax|resources/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/get_resource/))
                {
                    await Builders.GetAllCountryResources(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/transaction/))
                {
                    if(context.country.isSiege)
                    {
                        await context.send(`В данный момент фракция ${context.country.GetName()} находится в блокаде, переводы ресурсов не возможны`)
                        return
                    }
                    await Builders.CountryTransaction(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/get_tax/))
                {
                    await Builders.GetCountryTax(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/minting_money/))
                {
                    await Builders.MintingMoney(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/set_tax/))
                {
                    await Builders.SetTax(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/resources/))
                {
                    await context.send(context.country.GetResources())
                }
            }
            else
            {
                context.send("👉🏻 Бюджет",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryBudgetMenu", e)
        }
    }

    ChangeCountryMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetChangeCountryMenuKeyboard(context)
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|name|country_parliament|government_form|country_info|description|transfer_power|public|photo|welcome_picture|notifications_off|notifications_on/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/name/))
                {
                    await Builders.ChangeCountryName(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/description/))
                {
                    await Builders.ChangeCountryDescription(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/public/))
                {
                    await Builders.ChangeCountryGroup(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/photo/))
                {
                    await Builders.ChangeCountryPhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/government_form/))
                {
                    await Builders.ChangeCountryParliamentForm(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/welcome_picture/))
                {
                    await Builders.ChangeCountryWelcomePhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/country_parliament/))
                {
                    await Builders.ChangeCountryParliament(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.country.notifications = false
                    await Country.update({notifications: false}, {where: {id: context.country.id}})
                    current_keyboard[0][1] = keyboard.notificationsOnButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.country.notifications = true
                    await Country.update({notifications: true}, {where: {id: context.country.id}})
                    current_keyboard[0][1] = keyboard.notificationsOffButton
                    await context.send("🔊 Уведомления включены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/transfer_power/))
                {
                    await Builders.TransferPower(context, current_keyboard, {GetMenuKeyboard: this.GetStartMenuKeyboard, MenuScene: this.StartScreen})
                }
                if (context.messagePayload.choice.match(/country_info/))
                {
                    await context.send(await context.country.GetAllInfo())
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/ChangeCountryMenu", e)
        }
    }

    CountryArmyMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCountryArmyMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|train_unit|refuse_unit|expenses|army|upgrade_barak/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/train_unit/))
                {
                    await Builders.TrainUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/refuse_unit/))
                {
                    await Builders.RefuseUnit(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade_barak/))
                {
                    await Builders.UpgradeBarak(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/expenses/))
                {
                    await Builders.UnitsExpenses(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/army/))
                {
                    const army = await context.country.ShowArmy()
                    for(const a of army)
                    {
                        await context.send(a)
                    }
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CountryInfoMenu", e)
        }
    }


    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню градоначальника

    GetCityControlsKeyboard = () =>
    {
        return [
            [keyboard.controlsButton],
            [keyboard.buildingsButton, keyboard.infoButton, keyboard.parametersButton],
            [keyboard.backButton]
        ]
    }

    GetCityControlsBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.giveToCountryButton, keyboard.deleteBuildingButton],
            [keyboard.upgradeButton, keyboard.expandButton],
            [keyboard.backButton]
        ]
    }

    GetCityInfoMenuKeyboard = () =>
    {
        return [
            [keyboard.resourcesButton, keyboard.playersListButton],
            [keyboard.buildingsButton, keyboard.registrationListButton, keyboard.cityInfoButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCityMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.nameButton, keyboard.descriptionButton],
            [keyboard.photoButton],
            [keyboard.backButton]
        ]
        if(Data.cities[context.player.location].notifications) kb[1].push(keyboard.notificationsOffButton)
        else kb[1].push(keyboard.notificationsOnButton)
        return kb
    }

    GetControlsCityMenuKeyboard = () =>
    {
        return [
            [keyboard.getResourcesButton],
            [keyboard.transactionButton, keyboard.buildRoadButton],
            [keyboard.backButton]
        ]
    }

    CityControlsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCityControlsKeyboard()
            if(context.messagePayload?.choice?.match(/back|buildings|controls|info|params/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    context.send("▶ Постройки",{
                        keyboard: keyboard.build(this.GetCityControlsBuildingsMenuKeyboard())
                    })
                    context.player.state = this.CityBuildingsMenu
                }
                if(context.messagePayload.choice.match(/info/))
                {
                    context.send("▶ Информация о городе",{
                        keyboard: keyboard.build(this.GetCityInfoMenuKeyboard())
                    })
                    context.player.state = this.CityInfoMenu
                }
                if(context.messagePayload.choice.match(/params/))
                {
                    context.send("▶ Изменить",{
                        keyboard: keyboard.build(this.GetChangeCityMenuKeyboard(context))
                    })
                    context.player.state = this.ChangeCityMenu
                }
                if(context.messagePayload.choice.match(/controls/))
                {
                    context.send("▶ Управление",{
                        keyboard: keyboard.build(this.GetControlsCityMenuKeyboard())
                    })
                    context.player.state = this.ControlsCityMenu
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CityControlsMenu", e)
        }
    }

    ControlsCityMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetControlsCityMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|get_resource|transaction|build_road/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/transaction/))
                {
                    if(Data.cities[context.cityID].isSiege)
                    {
                        await context.send(`Вы не можете распоряжаться ресурсами в осаженном городе`)
                        return
                    }
                    await Builders.CityTransaction(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/get_resource/))
                {
                    await Builders.GetAllCityResources(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/build_road/))
                {
                    await Builders.BuildTheRoad(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/ControlsCityMenu", e)
        }
    }

    ChangeCityMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetChangeCityMenuKeyboard(context)
            context.city = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id)
            {
                context.city = Data.cities[context.player.location]
            }
            if(!context.city)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|name|description|photo|notifications_off|notifications_on/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/name/))
                {
                    await Builders.ChangeCityName(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/description/))
                {
                    await Builders.ChangeCityDescription(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/photo/))
                {
                    await Builders.ChangeCityPhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.city.notifications = false
                    await City.update({notifications: false}, {where: {id: context.city.id}})
                    current_keyboard[1][1] = keyboard.notificationsOnButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.city.notifications = true
                    await City.update({notifications: true}, {where: {id: context.city.id}})
                    current_keyboard[1][1] = keyboard.notificationsOffButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            else
            {
                await context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/ChangeCityMenu", e)
        }
    }

    CityBuildingsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCityControlsBuildingsMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|new_building|delete_building|upgrade|expand|give_to_country/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/delete_building/))
                {
                    await Builders.DeleteCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/new_building/))
                {
                    await Builders.CreateCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/upgrade/))
                {
                    await Builders.UpgradeCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/give_to_country/))
                {
                    await Builders.GiveToCountryBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/expand/))
                {
                    await Builders.ExpandCity(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CityBuildingsMenu", e)
        }
    }

    CityInfoMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetCityInfoMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id || Data.countries[context.player.countryID]?.leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice?.match(/back|buildings|resources|city_info|players_list|reg_list/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    let request = ""
                    if(!Data.buildings[context.cityID])
                    {
                        await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    for(let i = 0; i < Data.buildings[context.cityID]?.length; i++)
                    {
                        request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + ` ур ${Data.buildings[context.cityID][i].ownerType === "country" ? " (гос)" : Data.buildings[context.cityID][i].ownerType === "city" ? " (гор)" : "(час)"}\n`
                    }
                    await context.send(`Список построек в городе ${Data.cities[context.cityID].name}:\n\n${request}`)
                }
                if(context.messagePayload.choice.match(/resources/))
                {
                    await context.send(Data.cities[context.cityID].GetResources())
                }
                if(context.messagePayload.choice.match(/city_info/))
                {
                    await context.send(await Data.cities[context.cityID].GetAllInfo())
                }
                if(context.messagePayload.choice.match(/players_list/))
                {
                    await Builders.GetCityPlayersList(context)
                }
                if(context.messagePayload.choice.match(/reg_list/))
                {
                    await Builders.GetRegistrationList(context)
                }
            }
            else
            {
                await context.send("👉🏻 Информация",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/CityInfoMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Меню
    GetMenuKeyboard = () =>
    {
        return [
            [keyboard.extractButton],
            [keyboard.locationButton, keyboard.profileButton],
            [keyboard.ratingsButton, keyboard.parametersButton],
            [keyboard.backButton]
        ]
    }

    GetProfileMenuKeyboard = async (context) =>
    {
        let kb = [
            [],
            [keyboard.aboutMeButton, keyboard.propertyButton, keyboard.effectsButton],
            [keyboard.resourcesButton, keyboard.subscribesButton],
            [keyboard.backButton, keyboard.transactionButton]
        ]
        context.player.citizenship !== null ? kb[0].push(keyboard.refuseCitizenshipButton) : kb[0].push(keyboard.getCitizenshipButton)
        context.player.marriedID !== null ? kb[0].push(keyboard.refuseMerryButton) : kb[0].push(keyboard.merryButton)
        context.player.lastWill ? kb[0].push(keyboard.deleteLastWillButton) : kb[0].push(keyboard.createLastWillButton)
        if(parseInt(context.player.citizenship) === parseInt(Data.GetCountryForCity(context.player.location).id))
        {
            if(!context.player.registration && !Data.timeouts["get_registration_" + context.player.id])
            {
                kb[2].push(keyboard.getRegistrationButton)
            }
            else if(context.player.registration)
            {
                kb[2].push(keyboard.refuseRegistrationButton)
            }
        }

        return kb
    }

    GetPropertyMenuKeyboard = () =>
    {
        return [
            [keyboard.listButton],
            [keyboard.buildButton, keyboard.upgradeButton],
            [keyboard.giveKeyButton, keyboard.copyKeyButton],
            [keyboard.backButton]
        ]
    }

    GetLocationMenuKeyboard = () =>
    {
        return [
            [keyboard.whereMeButton, keyboard.chatListButton,keyboard.buildingsButton],
            [keyboard.otherCity, keyboard.mapButton,  keyboard.otherCountry],
            [keyboard.backButton]
        ]
    }

    GetSubsMenuKeyboard = () =>
    {
        return [
            [keyboard.botMemoryButton, keyboard.botTalksButton],
            [keyboard.backButton]
        ]
    }

    GetExtractingMenuKeyboard = (context) =>
    {
        const location = Data.countries[context.player.countryID]
        const kb = [
            [Data.timeouts["user_timeout_sleep_" + context.player.id] ? keyboard.secondaryButton(["☕ Взбодриться", "relax"]) : keyboard.secondaryButton(["💤 Отдохнуть", "relax"])],
            [],
            [],
            [keyboard.backButton, keyboard.getResourcesButton]
        ]
        if(context.player.citizenship)
        {
            const citizenship = Data.countries[context.player.citizenship]
            if(location.resources.match(/wheat/) && citizenship.resources.match(/wheat/)) kb[1].push(keyboard.extractWheatButton)
            if(location.resources.match(/stone/) && citizenship.resources.match(/stone/)) kb[1].push(keyboard.extractStoneButton)
            if(location.resources.match(/wood/) && citizenship.resources.match(/wood/)) kb[1].push(keyboard.extractWoodButton)
            if(location.resources.match(/iron/) && citizenship.resources.match(/iron/)) kb[2].push(keyboard.extractIronButton)
            if(location.resources.match(/copper/) && citizenship.resources.match(/copper/)) kb[2].push(keyboard.extractCopperButton)
            if(location.resources.match(/silver/) && citizenship.resources.match(/silver/)) kb[2].push(keyboard.extractSilverButton)
        }
        return kb
    }

    GetRatingsMenuKeyboard = () =>
    {
        return [
            [keyboard.richButton],
            [keyboard.mostActiveButton, keyboard.mostUnculturedButton],
            [keyboard.stickermansButton, keyboard.musicLoversButton],
            [keyboard.backButton]
        ]
    }

    GetParamsMenuKeyboard = (context) =>
    {
        const kb = [
            [keyboard.accountButton],
            [keyboard.adminsButton, keyboard.postboxButton, keyboard.infoButton],
            [keyboard.backButton]
        ]
        context.player.notifications ? kb[0].push(keyboard.notificationsOffButton) : kb[0].push(keyboard.notificationsOnButton)
        return kb
    }

    GetChangeAccountMenuKeyboard = () =>
    {
        return [
            [keyboard.changeNickButton, keyboard.changeDescriptionButton, keyboard.gadgetButton],
            [keyboard.changeGenderButton, keyboard.changeNationButton, keyboard.changeAgeButton],
            [keyboard.backButton, keyboard.avatarButton]
        ]
    }

    GetInBuildingMenuKeyboard = (context) =>
    {
        switch (context.player.inBuild.type)
        {
            case "building_of_house":
            case "building_of_bank":
            case "building_of_mint":
            case "building_of_barracks":
            case "building_of_port":
                return [[keyboard.backButton]]
            case "building_of_wheat":
            case "building_of_stone":
            case "building_of_wood":
            case "building_of_iron":
            case "building_of_copper":
            case "building_of_silver":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
        }
        return [[keyboard.backButton]]
    }

    Menu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            const current_keyboard = this.GetMenuKeyboard()
            if(context.messagePayload?.choice?.match(/back|location|extract|profile|ratings|params/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/params/))
                {
                    await context.send("▶ Параметры",{
                        keyboard: keyboard.build(this.GetParamsMenuKeyboard(context))
                    })
                    context.player.state = this.Params
                }
                if(context.messagePayload.choice.match(/location/))
                {
                    await context.send("▶ Мир",{
                        keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                    })
                    context.player.state = this.Location
                }
                if(context.messagePayload.choice.match(/profile/))
                {
                    await context.send("▶ Профиль", {
                        keyboard: keyboard.build(await this.GetProfileMenuKeyboard(context))
                    })
                    context.player.state = this.Profile
                }
                if(context.messagePayload.choice.match(/extract/))
                {
                    await context.send(`▶ Добыча ресурсов\n\n💪 Ваш уровень бодрости ${context.player.fatigue}%`, {
                        keyboard: keyboard.build(this.GetExtractingMenuKeyboard(context))
                    })
                    context.player.state = this.Extracting
                }
                if(context.messagePayload.choice.match(/ratings/))
                {
                    context.send("▶ Рейтинги",{
                        keyboard: keyboard.build(this.GetRatingsMenuKeyboard())
                    })
                    context.player.state = this.Ratings
                }
            }
            else
            {
                await context.send("👉🏻 Меню",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Menu", e)
        }
    }

    BotSubsMenu = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetSubsMenuKeyboard()
            if (context.messagePayload?.choice?.match(/back|memory|talks/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Профиль", {
                        keyboard: keyboard.build(await this.GetProfileMenuKeyboard(context))
                    })
                    context.player.state = this.Profile
                }
                if (context.messagePayload.choice.match(/memory/))
                {
                    await Builders.SubscribeToMemory(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/talks/))
                {
                    await Builders.SubscribeToTalking(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Подписки",{keyboard: keyboard.build(current_keyboard)})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Params", e)
        }
    }

    Params = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetParamsMenuKeyboard(context)
            if (context.messagePayload?.choice?.match(/back|notifications_on|notifications_off|info|admins|postbox|account/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню", {
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.player.notifications = true
                    await PlayerStatus.update({notifications: true}, {where: {id: context.player.id}})
                    current_keyboard[0][1] = keyboard.notificationsOffButton
                    await context.send("✅ Уведомления включены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.player.notifications = false
                    await PlayerStatus.update({notifications: false}, {where: {id: context.player.id}})
                    current_keyboard[0][1] = keyboard.notificationsOnButton
                    await context.send("❌ Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/admins/))
                {
                    let request = "🚾 Админ-состав проекта:\n\n"
                    request += "🔝 Владелец:\n"
                    request += Data.owner ? `*id${Data.owner.id}(${Data.owner.nick})` : "Отсутствует"
                    request += "\n\n"
                    request += "🤴 Глава проекта:\n"
                    request += Data.projectHead ? `- *id${Data.projectHead.id}(${Data.projectHead.nick})` : "Отсутствует"
                    request += "\n\n"
                    request += "🔧 Тех-поддержка:\n"
                    for (const key of Object.keys(Data.supports))
                    {
                        request += `*id${Data.supports[key].id}(${Data.supports[key].nick})\n`
                    }
                    if(Object.keys(Data.supports).length === 0) request += "Отсутствует"
                    request += "\n\n"
                    request += "♿ Администраторы:\n"
                    for (const key of Object.keys(Data.administrators))
                    {
                        request += `*id${Data.administrators[key].id}(${Data.administrators[key].nick})\n`
                    }
                    if(Object.keys(Data.administrators).length === 0) request += "Отсутствует"
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/postbox/))
                {
                    let request = "📫 Последние 5 сообщений:\n\n"
                    let messages = await sequelize.query("SELECT \"text\", \"createdAt\" FROM \"messages\" ORDER BY id DESC LIMIT 5")
                    messages = messages[0]
                    if(messages.length > 0)
                    {
                        for (let i = messages.length - 1; i >= 0; i--)
                        {
                            request += "🔸 Сообщение от " + NameLibrary.ParseDateTime(messages[i].createdAt) + ":\nℹ " + messages[i].text + "\n\n"
                        }
                    }
                    else
                    {
                        request += "Не добавлено"
                    }
                    await context.send(request)
                }
                if (context.messagePayload.choice.match(/info/))
                {
                    let request = "Проект *public218388422 («ZEUS - Вселенная игроков»).\n Войны, интриги, симулятор античного жителя.\n\nБот создан на NodeJS версии: "+ process.version + "\nБот версии: "+ Data.variables.version +"\nВладелец проекта - *id212554134(Игорь Будзинский)\nГлавный разработчик - *id565472458(Александр Ковалысько)\nЕсли возникли проблемы с использованием, кого пинать - знаете."
                    await context.send(request)
                }
                if (context.messagePayload.choice.match(/account/))
                {
                    await context.send("▶ Управление аккаунтом", {
                        keyboard: keyboard.build(this.GetChangeAccountMenuKeyboard())
                    })
                    context.player.state = this.ChangeAccount
                }
            }
            else
            {
                await context.send("👉🏻 Параметры",{keyboard: keyboard.build(current_keyboard)})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Params", e)
        }
    }

    ChangeAccount = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetChangeAccountMenuKeyboard()
            if (context.messagePayload?.choice?.match(/back|change_description|avatar|change_nick|gadget|change_nation|change_gender|change_age/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Параметры", {keyboard: keyboard.build(this.GetParamsMenuKeyboard(context))})
                    context.player.state = this.Params
                }
                if (context.messagePayload.choice.match(/change_nick/))
                {
                    await Builders.ChangeNick(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_description/))
                {
                    await Builders.ChangeDescription(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/gadget/))
                {
                    await Builders.ChangeGadget(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_nation/))
                {
                    await Builders.ChangeNation(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_gender/))
                {
                    await Builders.ChangeGender(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_age/))
                {
                    await Builders.ChangeAge(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/avatar/))
                {
                    await Builders.ChangeAvatar(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Управление аккаунтом",{keyboard: keyboard.build(current_keyboard)})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/ChangeAccount", e)
        }
    }

    Ratings = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetRatingsMenuKeyboard()

            if (context.messagePayload?.choice?.match(/back|most_active|uncultured|stickermans|music_lovers|rich/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/most_active/))
                {
                    let array = []
                    Object.keys(Data.activity).forEach(key => {
                        array.push([Data.activity[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("😴 За сегодня никто ничего не успел написать в чат")
                        return
                    }
                    for (let j = array.length - 1; j > 0; j--)
                    {
                        for (let i = 0; i < j; i++)
                        {
                            if (array[i][0] < array[i + 1][0])
                            {
                                let temp = array[i];
                                array[i] = array[i + 1];
                                array[i + 1] = temp;
                            }
                        }
                    }
                    let request = "🎆 Самые активные за сегодня:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " сообщений\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/uncultured/))
                {
                    let array = []
                    Object.keys(Data.uncultured).forEach(key => {
                        array.push([Data.uncultured[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("😸 У нас сегодня никто не матерился!")
                        return
                    }
                    for (let j = array.length - 1; j > 0; j--)
                    {
                        for (let i = 0; i < j; i++)
                        {
                            if (array[i][0] < array[i + 1][0])
                            {
                                let temp = array[i];
                                array[i] = array[i + 1];
                                array[i + 1] = temp;
                            }
                        }
                    }
                    let request = "🤬 Сегодня больше всех матерились:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/stickermans/))
                {
                    let array = []
                    Object.keys(Data.stickermans).forEach(key => {
                        array.push([Data.stickermans[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("👽 Сегодня у нас никто не отправлял стикеры")
                        return
                    }
                    for (let j = array.length - 1; j > 0; j--)
                    {
                        for (let i = 0; i < j; i++)
                        {
                            if (array[i][0] < array[i + 1][0])
                            {
                                let temp = array[i];
                                array[i] = array[i + 1];
                                array[i + 1] = temp;
                            }
                        }
                    }
                    let request = "💩 Отправили больше всех стикеров на сегодня:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/music_lovers/))
                {
                    let array = []
                    Object.keys(Data.musicLovers).forEach(key => {
                        array.push([Data.musicLovers[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("🔇 Сегодня никто не делился музыкой")
                        return
                    }
                    for (let j = array.length - 1; j > 0; j--)
                    {
                        for (let i = 0; i < j; i++)
                        {
                            if (array[i][0] < array[i + 1][0])
                            {
                                let temp = array[i];
                                array[i] = array[i + 1];
                                array[i + 1] = temp;
                            }
                        }
                    }
                    let request = "🎵 Больше всех сегодня делились музыкой:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/rich/))
                {
                    await Builders.GetMostRich(context)
                }
            }
            else
            {
                await context.send("👉🏻 Рейтинги",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Ratings", e)
        }
    }

    Profile = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = await this.GetProfileMenuKeyboard(context)

            if (context.messagePayload?.choice?.match(/back|get_registration|resources|subscribes|refuse_registration|get_citizenship|refuse_citizenship|merry|transaction|divorce|create_last_will|delete_last_will|about_me|effects|property/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню", {keyboard: keyboard.build(this.GetMenuKeyboard())})
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/subscribes/))
                {
                    await context.send("▶ Подписки", {keyboard: keyboard.build(this.GetSubsMenuKeyboard())})
                    context.player.state = this.BotSubsMenu
                }
                if(context.messagePayload.choice.match(/about_me/))
                {
                    await context.send(`Информация о вас:\n${context.player.GetInfo()}`, {attachment: context.player.avatar})
                }
                if(context.messagePayload.choice.match(/effects/))
                {
                    let request = `*id${context.player.id}(Ваши) эффекты:\n\n`
                    let count = 0
                    for(let i = 0; i < context.player.effects.length; i++)
                    {
                        if(context.player.effects[i])
                        {
                            request += "🔸 " + context.player.effects[i].GetInfo() + "\n"
                            count++
                        }
                    }
                    if(count === 0)
                    {
                        request += "У вас нет эффектов."
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/create_last_will/))
                {
                    await Builders.CreateLastWill(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/delete_last_will/))
                {
                    await Builders.DeleteLastWill(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/merry/))
                {
                    await Builders.OfferMarry(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/divorce/))
                {
                    await Builders.Divorce(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/get_citizenship/))
                {
                    await Builders.GetCitizenship(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/refuse_citizenship/))
                {
                    await Builders.RefuseCitizenship(context, current_keyboard, {keyboard: this.GetProfileMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/get_registration/))
                {
                    await Builders.GetRegistration(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/refuse_registration/))
                {
                    await Builders.RefuseRegistration(context, current_keyboard, {keyboard: this.GetProfileMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/transaction/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете делать переводы, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.Transaction(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/property/))
                {
                    await context.send("▶ Имущество",{keyboard: keyboard.build(this.GetPropertyMenuKeyboard())})
                    context.player.state = this.Property
                }
                if(context.messagePayload.choice.match(/resources/))
                {
                    await context.send(context.player.GetResources())
                }
            }
            else
            {
                await context.send("👉🏻 Профиль",{keyboard: keyboard.build(current_keyboard)})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Profile", e)
        }
    }

    Property = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetPropertyMenuKeyboard()
            if (context.messagePayload?.choice?.match(/back|list|build|give_key|copy_key|upgrade/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Профиль", {
                        keyboard: keyboard.build(await this.GetProfileMenuKeyboard(context))
                    })
                    context.player.state = this.Profile
                }
                if (context.messagePayload.choice.match(/list/))
                {
                    await Builders.GetAllProperty(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/give_key/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете обмениваться ключами, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.GiveKey(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/copy_key/))
                {
                    await Builders.CopyKey(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/build/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете строить, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.NewUserBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете улучшать постройки, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.UpgradeUserBuilding(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Имущество", {
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Property", e)
        }
    }

    Location = async(context) =>
    {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetLocationMenuKeyboard()
            if (context.messagePayload?.choice?.match(/back|map|where_me|buildings|other_city|other_country|chat_list/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/map/))
                {
                    await context.send("Карта", {attachment: Data.variables.globalMap})
                }
                if(context.messagePayload.choice.match(/where_me/))
                {
                    await context.send(`Ваше местоположение: ${Data.GetCityInfo(context.player.location)}`)
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    await Builders.EnterBuilding(context, current_keyboard, {build: this.InBuilding, buildKeyboard: this.GetInBuildingMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/other_city/))
                {
                    if(context.player.CantMove())
                    {
                        await context.send(`Вы не можете покинуть город, причина:\n\n${context.player.WhyCantMove()}`)
                        return
                    }
                    await Builders.GoToOtherCity(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
                 }
                if(context.messagePayload.choice.match(/other_country/))
                {
                    if(context.player.CantMove())
                    {
                        await context.send(`Вы не можете покинуть фракцию, причина:\n\n${context.player.WhyCantMove()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.GoToOtherCountry(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/chat_list/))
                {
                    let request = "💬 Список чатов:"
                    const chats = await Chats.findAll()
                    let flag = true
                    for (let i = 0; i < Data.countries.length; i++)
                    {
                        flag = true
                        if(Data.countries[i])
                        {
                            request += "\n\n🔶 Фракция " + Data.GetCountryName(Data.countries[i].id) + ":"
                            for(const chat of chats)
                            {
                                if(Data.countries[i].id === chat.dataValues.countryID)
                                {
                                    request += "\n🔸 " + chat.dataValues.name + " - " + "https://vk.cc/" + chat.dataValues.link
                                    flag = false
                                }
                            }
                            if(flag)
                            {
                                request += "  -  Не добавлено\n"
                            }
                        }
                    }
                    await context.send(request)
                }
            }
            else
            {
                context.send("👉🏻 Местоположение",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Location", e)
        }
    }

    InBuilding = async(context) => {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = await this.GetInBuildingMenuKeyboard(context)
            if (context.messagePayload?.choice?.match(/back|get_resource|relax|change_money/) && context.player.inBuild)
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Местоположение",{
                        keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                    })
                    context.player.state = this.Location
                }
                if(context.messagePayload.choice.match(/get_resource/) && context.player.inBuild?.type.match(/wheat|stone|wood|iron|copper|silver/) && !context.player.inBuild?.isFreezing)
                {
                    await Builders.GetResourcesFormBuilding(context, current_keyboard)
                }
            }
            else if (!context.player.inBuild)
            {
                context.player.state = this.Location
                context.send("Как вы оказались в здании?", {keyboard: keyboard.build(this.GetLocationMenuKeyboard())})
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/InBuilding", e)
        }
    }

    Extracting = async(context) => {
        try
        {
            if(await ChatController.CommandHandler(context)) return
            let current_keyboard = this.GetExtractingMenuKeyboard(context)
            if (context.messagePayload?.choice?.match(/back|get_resource|extract_wheat|extract_stone|extract_wood|extract_iron|extract_copper|extract_silver|relax|wakeup/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/get_resource/))
                {
                    await Builders.GetAllUserResources(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/extract_wheat/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 7.5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {wheat: extraction, diamond: diamonds})
                        context.send(`🌾 Вы добыли ${extraction} зерна`, {attachment: Data.variables["wheatPicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_stone/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {stone: extraction, diamond: diamonds})
                        context.send(`🪨 Вы добыли ${extraction} камня`, {attachment: Data.variables["stonePicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_wood/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {wood: extraction, diamond: diamonds})
                        context.send(`🪵 Вы добыли ${extraction} дерева`, {attachment: Data.variables["woodPicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_iron/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {iron: extraction, diamond: diamonds})
                        context.send(`🌑 Вы добыли ${extraction} железа`, {attachment: Data.variables["ironPicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_copper/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {copper: extraction, diamond: diamonds})
                        context.send(`🪙 Вы добыли ${extraction} бронзы`, {attachment: Data.variables["copperPicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_silver/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(1.25 * fatigue, 2.5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`, {attachment: Data.variables["diamondPicture"]})
                        }
                        await Data.AddPlayerResources(context.player.id, {silver: extraction, diamond: diamonds})
                        context.send(`🥈 Вы добыли ${extraction} серебра`, {attachment: Data.variables["silverPicture"]})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/relax/))
                {
                    await Builders.Relaxing(context, this.GetExtractingMenuKeyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Добыча ресурсов",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/Extracting", e)
        }
    }

    FillingOutTheForm = async (context) =>
    {
        try
        {
            let start_menu_keyboard = this.GetStartMenuKeyboard(context)
            if(context.messagePayload)
            {
                if(context.messagePayload.choice.type === "build_the_road")
                {
                    let form = await Builders.FillingOutTheRoad(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_warning")
                {
                    let form = await Builders.CreateWarning(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_report")
                {
                    let form = await Builders.NewReport(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_ban")
                {
                    let form = await Builders.Ban(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "registration")
                {
                    let form = await Builders.Registration(context, this.GetStartMenuKeyboard(context))
                    if(form) return
                }
                await context.send("Возврат в главное меню", {keyboard: keyboard.build(start_menu_keyboard)})
                context.player.state = this.StartScreen
            }
            else
            {
                await context.send("Вы находитесь в режиме заполнения форм, вводите только то, что требует бот.\nЕсли вы оказались здесь по ошибке и не можете выйти из этого режима, то напишите тех-поддержке.")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "SceneController/FillingOutTheForm", e)
        }
    }
}

module.exports = new SceneController()