const keyboard = require("../variables/Keyboards");
const sequelize = require("../database/DataBase")
const Data = require("../models/CacheData")
const InputManager = require("./InputManager")
const NameLibrary = require("../variables/NameLibrary")
const {LastWills, Buildings, PlayerResources} = require("../database/Models")
const Builders = require("./BuildersAndControlsScripts")
const ErrorHandler = require("../error/ErrorHandler")

class SceneController
{
    //Клавиатуры
    GetStartMenuKeyboard(context)
    {
        let kb = Data.users[context.player.id].status === "worker" ? Data.users[context.player.id].role : Data.users[context.player.id].status
        if(Data.users[context.player.id].isMayor && !Data.users[context.player.id].role.match(/admin|support|project_head|owner/))
        {
            kb = kb === "official" ? "mayor" : kb
            kb = kb === "leader" ? "leader-mayor" : kb
        }
        switch (kb)
        {
            case "player":
            case "moder":
            case "official":
                return [[keyboard.menuButton]]
            case "mayor":
                return [[keyboard.mayorMenuButton, keyboard.menuButton]]
            case "leader-mayor":
                return [[keyboard.mayorMenuButton, keyboard.leaderMenuButton],[keyboard.menuButton]]
            case "leader":
                return [[keyboard.leaderMenuButton, keyboard.menuButton]]
            case "GM":
                return [[keyboard.GMMenuButton, keyboard.menuButton]]
            case "admin":
            case "support":
            case "project_head":
            case "owner":
                return [[keyboard.mayorMenuButton, keyboard.leaderMenuButton],
                    [keyboard.menuButton],
                    [keyboard.GMMenuButton, keyboard.adminPanelButton]]
        }
        return [[keyboard.menuButton]]
    }

    GetMenuKeyboard(context)
    {
        if(context.player.citizenship)
        {
            return [[keyboard.extractButton, keyboard.propertyButton, keyboard.relaxButton],
                [keyboard.locationButton, keyboard.profileButton, keyboard.postboxButton],
                [keyboard.ratingsButton, keyboard.chatListButton, keyboard.parametersButton],
                [keyboard.backButton]]
        }
        else
        {
            return [[keyboard.extractButton, keyboard.relaxButton],
                [keyboard.locationButton, keyboard.profileButton, keyboard.postboxButton],
                [keyboard.ratingsButton, keyboard.chatListButton, keyboard.parametersButton],
                [keyboard.backButton]]
        }
    }

    GetAdminMenuKeyboard(context) {
        if (NameLibrary.RoleEstimator(context.player.role) >= 4)
        {
            return [
                [keyboard.statsButton, keyboard.controlsButton],
                [keyboard.giveRoleButton, keyboard.sqlButton],
                [keyboard.backButton]
            ]
        }
        else
        {
            return [
                [keyboard.statsButton, keyboard.controlsButton],
                [keyboard.giveRoleButton],
                [keyboard.backButton]
            ]
        }
    }

    GetAdminStatsMenuKeyboard()
    {
        return [
            [keyboard.todayStatsButton, keyboard.dateStatsButton],
            [keyboard.warningsButton, keyboard.bansButton],
            [keyboard.backButton]
        ]
    }
    GetAdminControlsMenuKeyboard()
    {
        return [
            [keyboard.createCountryButton, keyboard.appointLeaderCountryButton],
            [keyboard.backButton]
        ]
    }

    async GetProfileMenuKeyboard(context)
    {
        let kb = [
            [],
            [keyboard.aboutMeButton, keyboard.resourcesButton, keyboard.effectsButton],
            [keyboard.backButton]
        ]
        let lastWill = await LastWills.findOne({where: {userID: context.player.id}})
        isNaN(context.player.citizenship) ? kb[0].push(keyboard.refuseCitizenshipButton) : kb[0].push(keyboard.getCitizenshipButton)
        isNaN(context.player.marriedID) ? kb[0].push(keyboard.refuseMerryButton) : kb[0].push(keyboard.merryButton)
        lastWill ? kb[0].push(keyboard.deleteLastWillButton) : kb[0].push(keyboard.createLastWillButton)
        return kb
    }
    GetLocationMenuKeyboard()
    {
        return [
            [keyboard.whereMeButton, keyboard.mapButton, keyboard.buildingsButton],
            [keyboard.otherCity, keyboard.otherCountry],
            [keyboard.backButton]
        ]
    }

    GetExtractingMenuKeyboard(context)
    {
        const country = Data.GetCountryForCity(context.player.location)
        const kb = [
            [keyboard.extractWheatButton],
            [],
            [keyboard.backButton]
        ]
        country.resources.match(/stone/) && kb[0].push(keyboard.extractStoneButton)
        country.resources.match(/wood/) && kb[0].push(keyboard.extractWoodButton)
        country.resources.match(/iron/) && kb[1].push(keyboard.extractIronButton)
        country.resources.match(/copper/) && kb[1].push(keyboard.extractCopperButton)
        country.resources.match(/silver/) && kb[1].push(keyboard.extractSilverButton)

        return kb
    }

    GetCityControlsKeyboard()
    {
        return [
            [keyboard.buildingsButton, keyboard.resourcesButton],
            [keyboard.backButton]
        ]
    }

    GetCityControlsBuildingsMenuKeyboard()
    {
        return [
            [keyboard.allBuildingsButton],
            [keyboard.newBuildingButton, keyboard.deleteBuildingButton],
            [keyboard.backButton]
        ]
    }

    GetCityResourcesMenuKeyboard()
    {
        return [
            [keyboard.resourcesButton],
            [keyboard.extractButton],
            [keyboard.backButton]
        ]
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Стартовый экрн
    StayInStartScreen = async(context) =>
    {
        if(context.messagePayload?.choice.match(/menu|admin|mayor_menu|leader_menu|gm_menu/))
        {
            if(context.messagePayload.choice === "menu")
            {
                context.send("▶ Меню",{
                    keyboard: keyboard.build(this.GetMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.Menu
            }
            if(context.messagePayload.choice === "mayor_menu" && (context.player.role.match(/owner|project_head|admin|support/) || context.player.isMayor))
            {
                context.send("▶ Управление городом",{
                    keyboard: keyboard.build(this.GetCityControlsKeyboard())
                })
                Data.users[context.player.id].state = this.CityControlsMenu
            }
            if(context.messagePayload.choice === "admin" && context.player.role.match(/owner|project_head|admin|support/))
            {
                context.send("▶ Админка",{
                    keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.AdminPanel
            }
        }
        else
        {
            context.send("👉🏻 Главное меню",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    WaitingWalkMenu = async (context) => {
        context.send("♿ Вы находитесь в пути.",{
            keyboard: keyboard.none
        })
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Админ-панель
    AdminPanel = async(context) =>
    {
        const current_keyboard = this.GetAdminMenuKeyboard(context)

        if(context.messagePayload?.choice.match(/give_role|controls|sql|stats|back/))
        {
            //Назад
            if(context.messagePayload?.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.StayInStartScreen
            }
            // Кнопка "Назначить роль"
            if(context.messagePayload?.choice.match(/give_role/))
            {
                await Builders.ChangeRole(context, current_keyboard, {
                    GetStartMenuKeyboard: this.GetStartMenuKeyboard,
                    StayInStartScreen: this.StayInStartScreen
                })
            }
            if(context.messagePayload?.choice.match(/sql/))
            {
                let query = await InputManager.InputString(
                            context,
                    "Введите SQL-запрос, если вы не знаете что это такое, то лучше это не трогать.",
                            current_keyboard)
                const result = await sequelize.query(query);
                console.log(result)
            }
            if(context.messagePayload?.choice.match(/controls/))
            {
                context.send("▶ Управление",{
                    keyboard: keyboard.build(this.GetAdminControlsMenuKeyboard())
                })
                Data.users[context.player.id].state = this.AdminControlsMenu
            }
            if(context.messagePayload?.choice.match(/stats/))
            {
                context.send("▶ Статистика",{
                    keyboard: keyboard.build(this.GetAdminStatsMenuKeyboard())
                })
                Data.users[context.player.id].state = this.AdminStatsMenu
            }
        }
        else
        {
            context.send("👉🏻 Админка",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    AdminControlsMenu = async (context) =>
    {
        const current_keyboard = this.GetAdminControlsMenuKeyboard()

        if(context.messagePayload.choice.match(/create_country|appoint_leader|back/))
        {
            //Назад
            if(context.messagePayload.choice.match(/back/))
            {
                if(context.player.role.match(context.player.role.match(/owner|project_head|admin|support/)))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    Data.users[context.player.id].state = this.AdminPanel
                }
                else
                {
                    context.send("👉🏻 Главное меню",{
                        keyboard: keyboard.build([[keyboard.menuButton]])
                    })
                    Data.users[context.player.id].state = this.StayInStartScreen
                }
            }
            if(context.messagePayload.choice.match(/create_country/))
            {
                await Builders.NewCountry(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/appoint_leader/))
            {
                await Builders.AppointLeader(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление",{
                keyboard: keyboard.build(current_keyboard)
            })
        }

    }

    AdminStatsMenu = async (context) =>
    {
        const current_keyboard = this.GetAdminStatsMenuKeyboard()

        if(context.messagePayload.choice.match(/stats_today|stats_date|warnings|bans|back/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                if(context.player.role.match(context.player.role.match(/owner|project_head|admin|support/)))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    Data.users[context.player.id].state = this.AdminPanel
                }
                else
                {
                    context.send("👉🏻 Главное меню",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    Data.users[context.player.id].state = this.StayInStartScreen
                }
            }
            if (context.messagePayload.choice.match(/stats_today/))
            {
                context.send(`Статистика за сегодня`)
                context.send(`"Этот раздел будет закончен в последнюю очередь"`)
            }
            if (context.messagePayload.choice.match(/stats_date/))
            {
                context.send(`Статистика за определенную `)
                context.send(`"Этот раздел будет закончен в последнюю очередь"`)
            }
            if (context.messagePayload.choice.match(/warnings/))
            {
                await Builders.ShowListWarnings(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/bans/))
            {
                await Builders.ShowBan(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Статистика",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню мэра
    CityControlsMenu = async(context) =>
    {
        const current_keyboard = this.GetCityControlsKeyboard()
        if(context.messagePayload?.choice.match(/back|buildings|resources/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.StayInStartScreen
            }
            if(context.messagePayload.choice.match(/buildings/))
            {
                context.send("▶ Постройки",{
                    keyboard: keyboard.build(this.GetCityControlsBuildingsMenuKeyboard())
                })
                Data.users[context.player.id].state = this.CityBuildingsMenu
            }
            if(context.messagePayload.choice.match(/resources/))
            {
                context.send("▶ Управление ресурсами",{
                    keyboard: keyboard.build(this.GetCityResourcesMenuKeyboard())
                })
                Data.users[context.player.id].state = this.CityResourcesMenu
            }
        }
        else
        {
            context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CityBuildingsMenu = async(context) =>
    {
        const current_keyboard = this.GetCityControlsBuildingsMenuKeyboard()
        context.cityID = 0
        if(context.player.isMayor)
        {
            context.cityID = context.player.isMayor
        }
        else if(NameLibrary.RoleEstimator(context.player) > 2)
        {
            context.cityID = context.player.location
        }
        else
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetCityControlsKeyboard())
            })
            Data.users[context.player.id].state = this.StayInStartScreen
        }
        if(context.messagePayload?.choice.match(/back|new_building|delete_building|all_buildings/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetCityControlsKeyboard())
                })
                Data.users[context.player.id].state = this.StayInStartScreen
            }
            if(context.messagePayload.choice.match(/all_buildings/))
            {
                const buildings = await Buildings.findAll({where: {cityID: context.cityID}})
                let list = ""
                if(buildings.length === 0) list += "Нет построек"
                for (let i = 0; i < buildings.length; i++)
                {
                    list += `Здание: ${NameLibrary.GetBuildingName(buildings[i].dataValues.type)} "${buildings[i].dataValues.name}" ${buildings[i].dataValues.level} уровня, владелец: ${buildings[i].dataValues.ownerID === "country" ? "Государство" : `*id${buildings[i].dataValues.ownerID}(Игрок)`}\n`
                }
                await context.send("Постройки в вашем городе:\n" + list)
            }
            if(context.messagePayload.choice.match(/delete_building/))
            {
                await Builders.DeleteBuildingForMayor(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/new_building/))
            {
                await Builders.CreateBuildingForMayor(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CityResourcesMenu = async(context) =>
    {
        const current_keyboard = this.GetCityResourcesMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|buildings|resources/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetCityControlsKeyboard())
                })
                Data.users[context.player.id].state = this.StayInStartScreen
            }
        }
        else
        {
            context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Меню
    Menu = async(context) =>
    {
        const current_keyboard = this.GetMenuKeyboard(context)
        if(context.messagePayload?.choice.match(/back|location|property|relax|extract|profile|postbox|ratings|chat_list|params/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.StayInStartScreen
            }
            if(context.messagePayload.choice.match(/params/))
            {
                // context.send(`*id${context.player.id}(Ваши) параметры:\n💤 Усталость: ${context.player.fatigue}/100`)
            }
            if(context.messagePayload.choice.match(/location/))
            {
                context.send("▶ Локация",{
                    keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                })
                Data.users[context.player.id].state = this.Location
            }
            if(context.messagePayload.choice.match(/profile/))
            {
                context.send("▶ Профиль", {
                    keyboard: keyboard.build(await this.GetProfileMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.Profile
            }
            if(context.messagePayload.choice.match(/extract/))
            {
                context.send("▶ Добыча ресурсов", {
                    keyboard: keyboard.build(this.GetExtractingMenuKeyboard(context))
                })
                context.send(`💪 Ваш уровень бодрости ${context.player.fatigue}%`)
                Data.users[context.player.id].state = this.Extracting
            }
            if(context.messagePayload.choice.match(/relax/))
            {
                if(Data.users[context.player.id].fatigue < 100)
                {
                    await Builders.Relax(context, current_keyboard, {
                        Menu: this.Menu,
                        Relaxing: this.Relaxing
                    })
                }
                else
                {
                    context.send("💪 Вы полны сил.")
                }
            }
        }
        else
        {
            context.send("👉🏻 Меню",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Relaxing = async(context) => {
        const now = new Date()
        const time = Math.max(0, Math.round((Data.users[context.player.id].lastActionTime - now) / 60000))
        if (context.messagePayload?.choice.match(/wakeup/))
        {
            if(Data.users[context.player.id].timeout)
            {
                clearTimeout(Data.users[context.player.id].timeout)
            }
            Data.users[context.player.id].fatigue = Math.round(100 - (time * (100 / 360)))
            context.send(`💪 Ваш уровень энергии восстановлен до ${Data.users[context.player.id].fatigue}%`,
                {
                    keyboard: keyboard.build(this.GetMenuKeyboard(context))
                })
            Data.users[context.player.id].state = this.Menu
        }
        else
        {
            context.send(`💤 До полного восстановления сил осталось ${time} минут.`)
        }
    }

    Profile = async(context) => {
        let current_keyboard = await this.GetProfileMenuKeyboard(context)

        if (context.messagePayload?.choice.match(/back|get_citizenship|refuse_citizenship|merry|refuse_merry|create_last_will|delete_last_will|about_me|resources|effects/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("▶ Меню",{
                    keyboard: keyboard.build(this.GetMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.Menu
            }
            if(context.messagePayload.choice.match(/about_me/))
            {
                context.send(`Информация о вас:\n${await NameLibrary.GetUserInfo(context.player.id)}`)
            }
            if(context.messagePayload.choice.match(/resources/))
            {
                context.send(`*id${context.player.id}(Ваш) инвентарь:\n💵 Деньги:  ${context.player.money}\n⛰ Камень:${context.player.stone}\n🌾 Зерно:${context.player.wheat}\n🪵 Дерево:${context.player.wood}\n🌑 Железо:${context.player.iron}\n🪙 Медь:${context.player.copper}\n🥈 Серебро:${context.player.silver}\n💎 Алмазы:${context.player.diamond}`)
            }
            if(context.messagePayload.choice.match(/effects/))
            {
                context.send(`*id${context.player.id}(Ваши) эффекты:\n${context.player.effects > 0 ? context.player.effects.map(key => {
                    if(key.isValid())
                    {
                        return NameLibrary.GetEffectName(key.type)
                    }
                }) : "У вас нет эффектов."}`)
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
                await Builders.DeleteLastWill(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Профиль",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Location = async(context) => {
        let current_keyboard = this.GetLocationMenuKeyboard()
        if (context.messagePayload?.choice.match(/back|map|where_me|buildings|other_city|other_country/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                context.send("▶ Меню",{
                    keyboard: keyboard.build(this.GetMenuKeyboard(context))
                })
                Data.users[context.player.id].state = this.Menu
            }
            if(context.messagePayload.choice.match(/map/))
            {
                await context.send("Карта",
                    {
                        attachment: "photo565472458_457240344"
                    })
            }
            if(context.messagePayload.choice.match(/where_me/))
            {
                await context.send(`Ваше местоположение: ${Data.GetCityInfo(context.player.location)}`)
            }
        }
        else
        {
            context.send("👉🏻 Местоположение",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Extracting = async(context) => {
        try
        {
            let current_keyboard = this.GetExtractingMenuKeyboard(context)
            if (context.messagePayload?.choice.match(/back|extract_wheat|extract_stone|extract_wood|extract_iron|extract_copper|extract_silver/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard(context))
                    })
                    Data.users[context.player.id].state = this.Menu
                }
                if(context.messagePayload.choice.match(/extract_wheat/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 7.5 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].wheat += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                wheat: Data.users[context.player.id].wheat,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🌾 Вы добыли ${extraction} зерна`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_stone/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].stone += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                stone: Data.users[context.player.id].stone,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🪨 Вы добыли ${extraction} камня`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_wood/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].wood += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                wood: Data.users[context.player.id].wood,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🪵 Вы добыли ${extraction} дерева`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_iron/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].iron += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                iron: Data.users[context.player.id].iron,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🌑 Вы добыли ${extraction} железа`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_copper/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].copper += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                copper: Data.users[context.player.id].copper,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🪙 Вы добыли ${extraction} бронзы`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_silver/))
                {
                    const fatigue = Data.users[context.player.id].fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(1.25 * fatigue, 2.5 * fatigue)
                        Data.users[context.player.id].fatigue = 0
                        Data.users[context.player.id].silver += extraction
                        if(NameLibrary.GetChance(0.1))
                        {
                            Data.users[context.player.id].diamonds++
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await PlayerResources.update(
                            {
                                silver: Data.users[context.player.id].silver,
                                diamonds: Data.users[context.player.id].diamonds
                            },
                            {where: {id: context.player.id}})
                        context.send(`🥈 Вы добыли ${extraction} серебра`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
            }
            else
            {
                context.send("👉🏻 Добыча ресурсов",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Сцена добычи ресурсов", e)
        }

    }
}

module.exports = new SceneController()