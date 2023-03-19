const keyboard = require("../variables/Keyboards")
const Data = require("../models/CacheData")
const NameLibrary = require("../variables/NameLibrary")
const {LastWills, Chats, Messages, PlayerStatus} = require("../database/Models")
const Builders = require("./BuildersAndControlsScripts")
const ErrorHandler = require("../error/ErrorHandler")

class SceneController
{
    //Клавиатуры
    GetStartMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.menuButton]
        ]
        if(Data.cities[context.player.location]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.mayorMenuButton)
        }
        if(Data.countries[context.player.countryID]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2 || context.official)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.leaderMenuButton)
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
        return kb
    }

    GetMenuKeyboard = () =>
    {
        return [[keyboard.extractButton, keyboard.propertyButton, keyboard.relaxButton],
            [keyboard.locationButton, keyboard.profileButton, keyboard.postboxButton],
            [keyboard.ratingsButton, keyboard.chatListButton, keyboard.parametersButton],
            [keyboard.backButton]]
    }

    GetAdminMenuKeyboard = (context) =>
    {
        if (NameLibrary.RoleEstimator(context.player.role) >= 4)
        {
            return [
                [keyboard.giveRoleButton, keyboard.controlsButton],
                [keyboard.usersButton, keyboard.technicalButton],
                [keyboard.backButton]
            ]
        }
        else
        {
            return [
                [keyboard.giveRoleButton, keyboard.controlsButton],
                [keyboard.usersButton],
                [keyboard.backButton]
            ]
        }
    }

    GetAdminUsersMenuKeyboard = () =>
    {
        return [
            [keyboard.warningsButton, keyboard.bansButton],
            [keyboard.cheatingUserResourcesButton, keyboard.cheatingCityResourcesButton, keyboard.cheatingCountryResourcesButton],
            [keyboard.backButton]
        ]
    }
    GetAdminControlsMenuKeyboard = () =>
    {
        return [
            [keyboard.addMessageButton],
            [keyboard.setMayorButton, keyboard.appointLeaderCountryButton],
            [keyboard.createCountryButton, keyboard.addTheChatButton],
            [keyboard.backButton]
        ]
    }

    GetAdminTechnicalMenuKeyboard = () =>
    {
        return [
            [keyboard.uploadMapButton],
            [keyboard.logListButton, keyboard.uploadLogButton, keyboard.clearLogsButton],
            [keyboard.sqlButton, keyboard.clearUserCacheButton, keyboard.variablesButton],
            [keyboard.backButton]
        ]
    }

    GetProfileMenuKeyboard = async (context) =>
    {
        let kb = [
            [],
            [keyboard.aboutMeButton, keyboard.resourcesButton, keyboard.effectsButton],
            [keyboard.transactionButton],
            [keyboard.backButton]
        ]
        let lastWill = await LastWills.count({where: {userID: context.player.id}})
        context.player.citizenship !== null ? kb[0].push(keyboard.refuseCitizenshipButton) : kb[0].push(keyboard.getCitizenshipButton)
        context.player.marriedID !== null ? kb[0].push(keyboard.refuseMerryButton) : kb[0].push(keyboard.merryButton)
        lastWill > 0 ? kb[0].push(keyboard.deleteLastWillButton) : kb[0].push(keyboard.createLastWillButton)
        if(parseInt(context.player.citizenship) === parseInt(Data.GetCountryForCity(context.player.location).id))
        {
            if(!context.player.registration || context.player.registration === "candidate")
            {
                kb[2][1] = keyboard.getRegistrationButton
            }
            else if(context.player.registration)
            {
                kb[2][1] = keyboard.refuseRegistrationButton
            }
        }
        return kb
    }
    GetLocationMenuKeyboard = () =>
    {
        return [
            [keyboard.whereMeButton, keyboard.mapButton, keyboard.buildingsButton],
            [keyboard.otherCity, keyboard.otherCountry],
            [keyboard.backButton]
        ]
    }

    GetExtractingMenuKeyboard = (context) =>
    {
        const country = Data.GetCountryForCity(context.player.location)
        const kb = [
            [],
            [],
            [keyboard.backButton]
        ]
        country.resources.match(/wheat/) && kb[0].push(keyboard.extractWheatButton)
        country.resources.match(/stone/) && kb[0].push(keyboard.extractStoneButton)
        country.resources.match(/wood/) && kb[0].push(keyboard.extractWoodButton)
        country.resources.match(/iron/) && kb[1].push(keyboard.extractIronButton)
        country.resources.match(/copper/) && kb[1].push(keyboard.extractCopperButton)
        country.resources.match(/silver/) && kb[1].push(keyboard.extractSilverButton)

        return kb
    }

    GetGovernanceCountryMenuKeyboard = () =>
    {
        return [
            [keyboard.controlsButton],
            [keyboard.budgetButton, keyboard.infoButton],
            [keyboard.officialsButton, keyboard.changeButton],
            [keyboard.backButton]
        ]
    }

    GetCountryInfoMenuKeyboard = () =>
    {
        return [
            [keyboard.resourcesButton],
            [keyboard.citiesButton, keyboard.countryInfoButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCountryMenuKeyboard = () =>
    {
        return [
            [keyboard.nameButton],
            [keyboard.descriptionButton, keyboard.publicButton],
            [keyboard.photoButton, keyboard.welcomePictureButton],
            [keyboard.backButton]
        ]
    }

    GetCountryBudgetMenuKeyboard = () =>
    {
        return [
            [keyboard.getTaxButton],
            [keyboard.transactionButton, keyboard.getResourcesButton],
            [keyboard.backButton]
        ]
    }

    GetCountryControlsMenuKeyboard = () =>
    {
        return [
            [keyboard.setTaxButton, keyboard.buildRoadButton],
            [keyboard.buildCityButton, keyboard.buildingsButton],
            [keyboard.takeAwayCitizenshipButton, keyboard.setMayorButton],
            [keyboard.backButton]
        ]
    }

    GetCountryOfficialsMenuKeyboard = () =>
    {
        return [
            [keyboard.officialListButton],
            [keyboard.changeRightsButton, keyboard.setButton],
            [keyboard.takeAwayRightsButton],
            [keyboard.backButton]
        ]
    }

    GetCountryBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.upgradeButton],
            [keyboard.backButton]
        ]
    }

    GetCityControlsKeyboard = () =>
    {
        return [
            [keyboard.controlsButton],
            [keyboard.buildingsButton, keyboard.infoButton, keyboard.changeButton],
            [keyboard.backButton]
        ]
    }

    GetCityControlsBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.deleteBuildingButton],
            [keyboard.upgradeButton, keyboard.expandButton],
            [keyboard.backButton]
        ]
    }

    GetCityInfoMenuKeyboard = () =>
    {
        return [
            [keyboard.resourcesButton],
            [keyboard.buildingsButton, keyboard.cityInformationButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCityMenuKeyboard = () =>
    {
        return [
            [keyboard.nameButton, keyboard.descriptionButton],
            [keyboard.photoButton],
            [keyboard.backButton]
        ]
    }

    GetControlsCityMenuKeyboard = () =>
    {
        return [
            [keyboard.getResourcesButton],
            [keyboard.transactionButton],
            [keyboard.backButton]
        ]
    }

    GetRatingsMenuKeyboard = () =>
    {
        return [
            [keyboard.mostActiveButton, keyboard.mostUnculturedButton],
            [keyboard.stickermansButton, keyboard.musicLoversButton],
            [keyboard.backButton]
        ]
    }

    GetParamsMenuKeyboard = (context) =>
    {
        const kb = [
            [],
            [keyboard.infoButton, keyboard.adminsButton],
            [keyboard.backButton]
        ]
        context.player.notifications ? kb[0].push(keyboard.notificationsOffButton) : kb[0].push(keyboard.notificationsOnButton)
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
    GetInBuildingMenuKeyboard = (context) =>
    {
        switch (context.player.inBuild.type)
        {
            case "building_of_house":
                return [[keyboard.relaxButton], [keyboard.backButton]]
            case "building_of_bank":
                return [[keyboard.backButton]]
            case "building_of_mint":
                return [[keyboard.changeMoneyButton], [keyboard.backButton]]
            case "building_of_barracks":
                return [[keyboard.backButton]]
            case "building_of_port":
                return [[keyboard.backButton]]
            case "building_of_wheat":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_stone":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_wood":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_iron":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_copper":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_silver":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
        }
        return [[keyboard.backButton]]
    }

    GetGMMenuKeyboard = () =>
    {
        return [
            [keyboard.eventsButton],
            [keyboard.applyEffectsButton, keyboard.removeEffectsButton],
            [keyboard.controlsButton, keyboard.infoButton],
            [keyboard.backButton]
        ]

    }

    GetGMControlsMenuKeyboard = () =>
    {
        return [
            [keyboard.buildRoadButton, keyboard.changeRoadButton, keyboard.deleteRoadButton],
            [keyboard.backButton]
        ]

    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Стартовый экрн
    StartScreen = async(context) =>
    {
        if("object" === typeof context.messagePayload?.choice)
        {
            context.send("👉🏻 Главное меню",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            return
        }
        if(context.messagePayload?.choice?.match(/menu|admin|mayor_menu|leader_menu|gm_menu/))
        {
            if(context.messagePayload.choice === "menu")
            {
                context.send("▶ Меню",{
                    keyboard: keyboard.build(this.GetMenuKeyboard())
                })
                context.player.state = this.Menu
            }
            if(context.messagePayload.choice === "mayor_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id))
            {
                context.send("▶ Управление городом",{
                    keyboard: keyboard.build(this.GetCityControlsKeyboard())
                })
                context.player.state = this.CityControlsMenu
            }
            if(context.messagePayload.choice === "leader_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official))
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

    //Ожидание
    WaitingWalkMenu = async (context) => {
        if(context.player.timeout)
        {
            context.send(`♿ Вы находитесь в пути.\n\nДо прибытия ${NameLibrary.ParseFutureTime(context.player.lastActionTime)}`, {
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

    GMMenu = async(context) =>
    {
        const current_keyboard = this.GetGMMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|events|apply_effects|remove_effects|controls|info/))
        {
            if(context.messagePayload?.choice.match(/back/))
            {
                await context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                context.player.state = this.StartScreen
            }
            if(context.messagePayload?.choice.match(/controls/))
            {
                await context.send("↪ Управление",{
                    keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                })
                context.player.state = this.GMControlsMenu
            }
        }
        else
        {
            await context.send("👉🏻 Админка",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    GMControlsMenu = async(context) =>
    {
        const current_keyboard = this.GetGMControlsMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|change_road|delete_road|build_road/))
        {
            if(context.messagePayload?.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                context.player.state = this.StartScreen
            }
            if(context.messagePayload?.choice.match(/change_road/))
            {
                await Builders.ChangeTheRoad(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Админка",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Админ-панель
    AdminPanel = async(context) =>
    {
        const current_keyboard = this.GetAdminMenuKeyboard(context)

        if(context.messagePayload?.choice.match(/back|give_role|controls|users|technical/))
        {
            if(context.messagePayload?.choice.match(/back/))
            {
                context.send("↪ Назад",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                context.player.state = this.StartScreen
            }
            if(context.messagePayload?.choice.match(/give_role/))
            {
                await Builders.ChangeRole(context, current_keyboard, {
                    GetStartMenuKeyboard: this.GetStartMenuKeyboard,
                    StayInStartScreen: this.StartScreen
                })
            }
            if(context.messagePayload?.choice.match(/controls/))
            {
                context.send("▶ Управление",{
                    keyboard: keyboard.build(this.GetAdminControlsMenuKeyboard())
                })
                context.player.state = this.AdminControlsMenu
            }
            if(context.messagePayload?.choice.match(/users/))
            {
                context.send("▶ Пользователи",{
                    keyboard: keyboard.build(this.GetAdminUsersMenuKeyboard())
                })
                context.player.state = this.AdminUsersMenu
            }
            if(context.messagePayload?.choice.match(/technical/))
            {
                context.send("▶ Техническое",{
                    keyboard: keyboard.build(this.GetAdminTechnicalMenuKeyboard())
                })
                context.player.state = this.AdminTechnicalMenu
            }
        }
        else
        {
            context.send("👉🏻 Админка",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    AdminTechnicalMenu = async (context) =>
    {
        const current_keyboard = this.GetAdminTechnicalMenuKeyboard()

        if(context.messagePayload?.choice.match(/back|sql|upload_log|log_list|clear_logs|clear_user_cache|upload_map|variables/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                if(context.player.role.match(context.player.role.match(/owner|project_head|admin|support/)))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                else
                {
                    context.send("👉🏻 Главное меню",{
                        keyboard: keyboard.build([[keyboard.menuButton]])
                    })
                    context.player.state = this.StartScreen
                }
            }
            if(context.messagePayload?.choice.match(/sql/))
            {
                await Builders.SQLSession(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/upload_log/))
            {
                await Builders.SendLog(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/log_list/))
            {
                await Builders.SendLogList(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/clear_logs/))
            {
                await Builders.ClearLogs(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/clear_user_cache/))
            {
                await Builders.ClearUserCache(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/upload_map/))
            {
                await Builders.ChangeMap(context, current_keyboard)
            }
            if(context.messagePayload?.choice.match(/variables/))
            {
                await Builders.ChangeVariables(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    AdminControlsMenu = async (context) =>
    {
        const current_keyboard = this.GetAdminControlsMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|create_country|appoint_leader|add_message|add_the_chat|set_mayor/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                if(context.player.role.match(context.player.role.match(/owner|project_head|admin|support/)))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                else
                {
                    context.send("👉🏻 Главное меню",{
                        keyboard: keyboard.build([[keyboard.menuButton]])
                    })
                    context.player.state = this.StartScreen
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
            if(context.messagePayload.choice.match(/set_mayor/))
            {
                await Builders.SetMayor(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/add_message/))
            {
                await Builders.AddMessage(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление",{
                keyboard: keyboard.build(current_keyboard)
            })
        }

    }

    AdminUsersMenu = async (context) =>
    {
        const current_keyboard = this.GetAdminUsersMenuKeyboard()

        if(context.messagePayload?.choice.match(/back|warnings|bans|cheating_user_resources|cheating_city_resources|cheating_country_resources/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                if(context.player.role.match(context.player.role.match(/owner|project_head|admin|support/)))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                else
                {
                    context.send("👉🏻 Главное меню",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
            }
            if (context.messagePayload.choice.match(/warnings/))
            {
                await Builders.ShowListWarnings(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/bans/))
            {
                await Builders.ShowBan(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/cheating_user_resources/))
            {
                await Builders.CheatingUserResources(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/cheating_country_resources/))
            {
                await Builders.CheatingCountryResources(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/cheating_city_resources/))
            {
                await Builders.CheatingCityResources(context, current_keyboard)
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

    //Меню правителя
    GovernanceCountryMenu = async(context) =>
    {
        const current_keyboard = this.GetGovernanceCountryMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|budget|controls|info|officials|change/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                context.player.state = this.StartScreen
            }
            if(context.messagePayload.choice.match(/info/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official))
            {
                context.send("▶ Информация о фракции",{
                    keyboard: keyboard.build(this.GetCountryInfoMenuKeyboard())
                })
                context.player.state = this.CountryInfoMenu
            }
            if(context.messagePayload.choice.match(/change/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
            {
                context.send("▶ Изменить",{
                    keyboard: keyboard.build(this.GetChangeCountryMenuKeyboard())
                })
                context.player.state = this.ChangeCountryMenu
            }
            if(context.messagePayload.choice.match(/controls/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity || context.official?.canAppointMayors || context.official?.canBeDelegate))
            {
                context.send("▶ Управление ",{
                    keyboard: keyboard.build(this.GetCountryControlsMenuKeyboard())
                })
                context.player.state = this.CountryControlsMenu
            }
            if(context.messagePayload.choice.match(/budget/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
            {
                context.send("▶ Бюджет",{
                    keyboard: keyboard.build(this.GetCountryBudgetMenuKeyboard())
                })
                context.player.state = this.CountryBudgetMenu
            }
            if(context.messagePayload.choice.match(/officials/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
            {
                context.send("▶ Чиновники",{
                    keyboard: keyboard.build(this.GetCountryOfficialsMenuKeyboard())
                })
                context.player.state = this.CountryOfficialsMenu
            }
        }
        else
        {
            context.send("👉🏻 Управление фракцией",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CountryOfficialsMenu = async(context) =>
    {
        const current_keyboard = this.GetCountryOfficialsMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|official_list|set|change_rights|take_away/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                })
                context.player.state = this.GovernanceCountryMenu
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
            context.send("👉🏻 Чиновники",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CountryControlsMenu = async(context) =>
    {
        const current_keyboard = this.GetCountryControlsMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|set_mayor|build_road|build_city|set_tax|buildings|take_away_citizenship/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                })
                context.player.state = this.GovernanceCountryMenu
            }
            if (context.messagePayload.choice.match(/set_mayor/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointMayors))
            {
                await Builders.SetMayor(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/set_tax/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
            {
                await Builders.SetTax(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/build_city/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
            {
                await Builders.BuildNewCity(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/build_road/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
            {
                await Builders.BuildTheRoad(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/buildings/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
            {
                context.send("▶ Постройки", {
                    keyboard: keyboard.build(this.GetCountryBuildingsMenuKeyboard())
                })
                context.player.state = this.CountryBuildingsMenu
            }
            if (context.messagePayload.choice.match(/take_away_citizenship/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id) || context.official?.canBeDelegate)
            {
                await Builders.TakeAwayCitizenship(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CountryBuildingsMenu = async(context) =>
    {
        const current_keyboard = this.GetCountryBuildingsMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|new_building|upgrade/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetCountryControlsMenuKeyboard(context))
                })
                context.player.state = this.CountryControlsMenu
            }
            if (context.messagePayload.choice.match(/new_building/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
            {
                await Builders.CreateCountryBuilding(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/upgrade/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
            {
                await Builders.UpgradeCountryBuilding(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Постройки",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CountryBudgetMenu = async(context) =>
    {
        const current_keyboard = this.GetCountryBudgetMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|get_tax|transaction|get_resource/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                })
                context.player.state = this.GovernanceCountryMenu
            }
            if (context.messagePayload.choice.match(/get_resource/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
            {
                await Builders.GetAllCountryResources(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/transaction/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
            {
                await Builders.CountryToCityTransaction(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/get_tax/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
            {
                await Builders.GetCountryTax(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Бюджет",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    ChangeCountryMenu = async(context) =>
    {
        const current_keyboard = this.GetChangeCountryMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|name|description|public|photo|welcome_picture/))
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
            if (context.messagePayload.choice.match(/welcome_picture/))
            {
                await Builders.ChangeCountryWelcomePhoto(context, current_keyboard)
            }
        }
        else
        {
            context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CountryInfoMenu = async(context) =>
    {
        const current_keyboard = this.GetCountryInfoMenuKeyboard()
        context.country = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
        {
            context.country = Data.GetCountryForCity(context.player.location)
        }
        if(!context.country)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|resources|cities|country_info/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                context.send("↪ Назад", {
                    keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                })
                context.player.state = this.GovernanceCountryMenu
            }
            if (context.messagePayload.choice.match(/resources/))
            {
                await context.send(context.country.GetResources())
            }
            if (context.messagePayload.choice.match(/cities/))
            {
                await Builders.GetCountryCities(context, current_keyboard)
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


    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню градоначальника
    CityControlsMenu = async(context) =>
    {
        const current_keyboard = this.GetCityControlsKeyboard()
        if(context.messagePayload?.choice.match(/back|buildings|controls|info|change/))
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
            if(context.messagePayload.choice.match(/change/))
            {
                context.send("▶ Изменить",{
                    keyboard: keyboard.build(this.GetChangeCityMenuKeyboard())
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

    ControlsCityMenu = async(context) =>
    {
        const current_keyboard = this.GetControlsCityMenuKeyboard()
        context.cityID = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
        {
            context.cityID = context.player.location
        }
        if(context.cityID === null)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetCityControlsKeyboard())
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|get_resource|transaction/))
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
                await Builders.CityToCountryTransaction(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/get_resource/))
            {
                await Builders.GetAllCityResources(context, current_keyboard)
            }
        }
        else
        {
            await context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    ChangeCityMenu = async(context) =>
    {
        const current_keyboard = this.GetChangeCityMenuKeyboard()
        context.cityID = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
        {
            context.cityID = context.player.location
        }
        if(context.cityID === null)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetCityControlsKeyboard())
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|name|description|photo/))
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
        }
        else
        {
            await context.send("👉🏻 Управление городом",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    CityBuildingsMenu = async(context) =>
    {
        const current_keyboard = this.GetCityControlsBuildingsMenuKeyboard()
        context.cityID = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
        {
            context.cityID = context.player.location
        }
        if(context.cityID === null)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetCityControlsKeyboard())
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|new_building|delete_building|upgrade|expand/))
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

    CityInfoMenu = async(context) =>
    {
        const current_keyboard = this.GetCityInfoMenuKeyboard()
        context.cityID = null
        if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
        {
            context.cityID = context.player.location
        }
        if(context.cityID === null)
        {
            context.send("↪ Вы не имеите права здесь находиться",{
                keyboard: keyboard.build(this.GetCityControlsKeyboard())
            })
            context.player.state = this.StartScreen
        }
        if(context.messagePayload?.choice.match(/back|buildings|resources|city_info/))
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
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + ` ур ${Data.buildings[context.cityID][i].ownerType === "country" ? " (гос)" : ""}\n`
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
        }
        else
        {
            await context.send("👉🏻 Информация",{
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
        const current_keyboard = this.GetMenuKeyboard()
        if(context.messagePayload?.choice.match(/back|location|property|relax|extract|profile|postbox|ratings|chat_list|params/))
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
                await context.send("▶ Локация",{
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
            if(context.messagePayload.choice.match(/relax/))
            {
                if(context.player.fatigue < 100)
                {
                    await Builders.Relax(context, current_keyboard, {
                        Menu: this.Menu,
                        Relaxing: this.Relaxing
                    })
                }
                else
                {
                    await context.send("💪 Вы полны сил.")
                }
            }
            if(context.messagePayload.choice.match(/chat_list/))
            {
                let request = "💬 Список чатов\n"
                for (let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 Фракция " + Data.GetCountryName(Data.countries[i].id) + ":\n"
                        const chats = await Chats.findAll({where: {countryID: Data.countries[i].id}})
                        if(chats.length > 0)
                        {
                            chats.forEach(key => {
                                request += key.dataValues.name + " - " + key.dataValues.link + "\n"
                            })
                        }
                        else
                        {
                            request += "Не добавлено\n"
                        }
                    }
                }
                await context.send(request)
            }
            if(context.messagePayload.choice.match(/postbox/))
            {
                let request = "📫 Последние 5 сообщений:\n\n"
                const messages = await Messages.findAll({limit: 5})
                if(messages.length > 0)
                {
                    for (let i = 0; i < messages.length; i++)
                    {
                        request += "🔸 Сообщение от " + NameLibrary.ParseDateTime(messages[i].dataValues.createdAt) + ":\n" + messages[i].dataValues.text + "\n\n"
                    }
                }
                else
                {
                    request += "Не добавлено"
                }
                await context.send(request)
            }
            if(context.messagePayload.choice.match(/ratings/))
            {
                context.send("▶ Рейтинги",{
                    keyboard: keyboard.build(this.GetRatingsMenuKeyboard())
                })
                context.player.state = this.Ratings
            }
            if(context.messagePayload.choice.match(/property/))
            {
                context.send("▶ Имущество",{
                    keyboard: keyboard.build(this.GetPropertyMenuKeyboard())
                })
                context.player.state = this.Property
            }
        }
        else
        {
            await context.send("👉🏻 Меню",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Property = async(context) =>
    {
        let current_keyboard = this.GetPropertyMenuKeyboard()
        if (context.messagePayload?.choice.match(/back|list|build|give_key|copy_key|upgrade/))
        {
            if (context.messagePayload.choice.match(/back/))
            {
                await context.send("▶ Меню", {
                    keyboard: keyboard.build(this.GetMenuKeyboard())
                })
                context.player.state = this.Menu
            }
            if (context.messagePayload.choice.match(/list/))
            {
                await Builders.GetAllProperty(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/give_key/))
            {
                await Builders.GiveKey(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/copy_key/))
            {
                await Builders.CopyKey(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/build/))
            {
                await Builders.NewUserBuilding(context, current_keyboard)
            }
            if (context.messagePayload.choice.match(/upgrade/))
            {
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

    Params = async(context) =>
    {
        let current_keyboard = this.GetParamsMenuKeyboard(context)
        if (context.messagePayload?.choice.match(/back|notifications_on|notifications_off|info|admins/))
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
                current_keyboard[0][0] = keyboard.notificationsOffButton
                await context.send("✅ Уведомления включены", {keyboard: keyboard.build(current_keyboard)})
            }
            if (context.messagePayload.choice.match(/notifications_off/))
            {
                context.player.notifications = false
                await PlayerStatus.update({notifications: false}, {where: {id: context.player.id}})
                current_keyboard[0][0] = keyboard.notificationsOnButton
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
            if (context.messagePayload.choice.match(/info/))
            {
                let request = "Проект *public218388422 («ZEUS - Вселенная игроков»).\n Войны, интриги, симулятор античного жителя.\n\nБот создан на NodeJS версии: "+ process.version + "\nБот версии: "+ Data.variables.version +"\nВладелец проекта - *id212554134(Игорь Будзинский)\nГлавный разработчик - *id565472458(Александр Ковалысько)\nЕсли возникли проблемы с использованием, кого пинать - знаете."
                await context.send(request)
            }
        }
        else
        {
            await context.send("👉🏻 Параметры",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Ratings = async(context) => {
        let current_keyboard = this.GetRatingsMenuKeyboard()

        if (context.messagePayload?.choice.match(/back|most_active|uncultured|stickermans|music_lovers/))
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
                let array = Data.activity
                let request = "🎆 Самые активные за сегодня:\n"
                let max = 0
                let index = null
                for(let i = 0; i < Math.min(10, Object.keys(array).length); i++)
                {
                    max = 0
                    index = null
                    Object.keys(array).forEach(key => {
                        if(array[key] > max)
                        {
                            max = array[key]
                            index = key
                        }
                    })
                    if(index)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(index) + " - " + max + " сообщений"
                        delete array[index]
                    }
                }
                await context.send(request)
            }
            if(context.messagePayload.choice.match(/uncultured/))
            {
                let array = Data.uncultured
                let request = "🤬 Сегодня больше всех матерились:\n"
                let max = 0
                let index = null
                for(let i = 0; i < Math.min(10, Object.keys(array).length); i++)
                {
                    max = 0
                    index = null
                    Object.keys(array).forEach(key => {
                        if(array[key] > max)
                        {
                            max = array[key]
                            index = key
                        }
                    })
                    if(index)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(index) + " - " + max + " раз"
                        delete array[index]
                    }
                }
                await context.send(request)
            }
            if(context.messagePayload.choice.match(/stickermans/))
            {
                let array = Data.stickermans
                let request = "💩 Отправили больше всех стикеров на сегодня:\n"
                let max = 0
                let index = null
                for(let i = 0; i < Math.min(10, Object.keys(array).length); i++)
                {
                    max = 0
                    index = null
                    Object.keys(array).forEach(key => {
                        if(array[key] > max)
                        {
                            max = array[key]
                            index = key
                        }
                    })
                    if(index)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(index) + " - " + max + " раз"
                        delete array[index]
                    }
                }
                await context.send(request)
            }
            if(context.messagePayload.choice.match(/music_lovers/))
            {
                let array = Data.musicLovers
                let request = "🎵 Больше всех сегодня делились музыкой:\n"
                let max = 0
                let index = null
                for(let i = 0; i < Math.min(10, Object.keys(array).length); i++)
                {
                    max = 0
                    index = null
                    Object.keys(array).forEach(key => {
                        if(array[key] > max)
                        {
                            max = array[key]
                            index = key
                        }
                    })
                    if(index)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(index) + " - " + max + " раз"
                        delete array[index]
                    }
                }
                await context.send(request)
            }
        }
        else
        {
            await context.send("👉🏻 Рейтинги",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Relaxing = async(context) => {

        if (context.messagePayload?.choice.match(/wakeup/))
        {
            if(context.player.timeout)
            {
                clearTimeout(context.player.timeout)
            }
            const now = new Date()
            const time = Math.max(0, Math.round((context.player.lastActionTime - now) / 60000))
            context.player.isFreezed = false
            context.player.fatigue = Math.round(100 - (time * (100 / 360)))
            await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`,
                {
                    keyboard: keyboard.build(this.GetMenuKeyboard())
                })
            context.player.state = this.Menu
        }
        else
        {
            await context.send(`💤 До полного восстановления сил осталось ${NameLibrary.ParseFutureTime(context.player.lastActionTime)}`)
        }
    }

    RelaxingInTheHouse = async(context) => {

        if (context.messagePayload?.choice.match(/wakeup/))
        {
            let need
            const now = new Date()
            switch (context.player.inBuild.level)
            {
                case 1:
                    need = 330
                    break
                case 2:
                    need = 300
                    break
                case 3:
                    need = 270
                    break
                case 4:
                    need = 240
                    break
            }
            if(context.player.timeout)
            {
                clearTimeout(context.player.timeout)
            }
            const time = Math.max(0, Math.round((context.player.lastActionTime - now) / 60000))
            context.player.isFreezed = false
            context.player.inBuild = null
            context.player.fatigue = Math.round(100 - (time * (100 / need)))
            await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`,
                {
                    keyboard: keyboard.build(this.GetMenuKeyboard())
                })
            context.player.state = this.Menu
        }
        else
        {
            await context.send(`💤 До полного восстановления сил осталось ${NameLibrary.ParseFutureTime(context.player.lastActionTime)}`)
        }
    }

    Profile = async(context) =>
    {
        let current_keyboard = await this.GetProfileMenuKeyboard(context)

        if (context.messagePayload?.choice.match(/back|get_registration|refuse_registration|transaction|get_citizenship|refuse_citizenship|merry|divorce|create_last_will|delete_last_will|about_me|resources|effects/))
        {
            if(context.messagePayload.choice.match(/back/))
            {
                await context.send("▶ Меню",{
                    keyboard: keyboard.build(this.GetMenuKeyboard())
                })
                context.player.state = this.Menu
            }
            if(context.messagePayload.choice.match(/about_me/))
            {
                await context.send(`Информация о вас:\n${await NameLibrary.GetUserInfo(context.player.id)}`)
            }
            if(context.messagePayload.choice.match(/resources/))
            {
                await context.send(context.player.GetResources())
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
            if(context.messagePayload.choice.match(/transaction/))
            {
                await Builders.Transaction(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/get_registration/))
            {
                await Builders.GetRegistration(context, current_keyboard)
            }
            if(context.messagePayload.choice.match(/refuse_registration/))
            {
                await Builders.RefuseRegistration(context, current_keyboard, {keyboard: this.GetProfileMenuKeyboard})
            }
        }
        else
        {
            await context.send("👉🏻 Профиль",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    Location = async(context) =>
    {
        let current_keyboard = this.GetLocationMenuKeyboard()
        if (context.messagePayload?.choice.match(/back|map|where_me|buildings|other_city|other_country/))
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
                await Builders.GoToOtherCity(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
            }
            if(context.messagePayload.choice.match(/other_country/))
            {
                await Builders.GoToOtherCountry(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
            }
        }
        else
        {
            context.send("👉🏻 Местоположение",{
                keyboard: keyboard.build(current_keyboard)
            })
        }
    }

    InBuilding = async(context) => {
        try
        {
            let current_keyboard = await this.GetInBuildingMenuKeyboard(context)
            if (context.messagePayload?.choice.match(/back|get_resource|relax|change_money/) && context.player.inBuild)
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Местоположение",{
                        keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                    })
                    context.player.state = this.Location
                }
                if(context.messagePayload.choice.match(/get_resource/) && context.player.inBuild?.type.match(/wheat|stone|wood|iron|copper|silver/))
                {
                    await Builders.GetResourcesFormBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/relax/) && context.player.inBuild?.type.match(/house/))
                {
                    await Builders.RelaxInTheHouse(context, current_keyboard, {
                        Menu: this.Menu,
                        Relaxing: this.RelaxingInTheHouse
                    })
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
            await ErrorHandler.SendLogs(context, "Сцена внутри здания", e)
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
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/extract_wheat/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 7.5 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {wheat: extraction, diamonds: diamonds})
                        context.send(`🌾 Вы добыли ${extraction} зерна`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_stone/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {stone: extraction, diamonds: diamonds})
                        context.send(`🪨 Вы добыли ${extraction} камня`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_wood/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {wood: extraction, diamonds: diamonds})
                        context.send(`🪵 Вы добыли ${extraction} дерева`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_iron/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {iron: extraction, diamonds: diamonds})
                        context.send(`🌑 Вы добыли ${extraction} железа`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_copper/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {copper: extraction, diamonds: diamonds})
                        context.send(`🪙 Вы добыли ${extraction} бронзы`)
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_silver/))
                {
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(1.25 * fatigue, 2.5 * fatigue)
                        context.player.fatigue = 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {silver: extraction, diamonds: diamonds})
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

    FillingOutTheForm = async (context) =>
    {
        let start_menu_keyboard = this.GetStartMenuKeyboard(context)
        if(context.messagePayload)
        {
            if(context.messagePayload.choice.type === "build_the_road")
            {
                let form = await Builders.FillingOutTheRoad(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                if(form) return
            }
            await context.send("Возврат в главное меню", {keyboard: keyboard.build(start_menu_keyboard)})
            context.player.state = this.StartScreen
        }
        else
        {
            await context.send("Вы находитесь в режиме заполнения форм, вводите только то, что требует бот.\nЕсли вы оказались здесь по ошибке и не можете выйти из этого режима, то напишите тех-подержке.")
        }
    }
}

module.exports = new SceneController()