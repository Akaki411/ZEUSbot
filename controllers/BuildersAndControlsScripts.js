const InputManager = require("./InputManager");
const OutputManager = require("./OutputManager")
const Data = require("../models/CacheData");
const keyboard = require("../variables/Keyboards");
const {City, Country, PlayerStatus, Player, Ban, LastWills, Buildings,
    CountryResources, CityResources, PlayerInfo, CountryRoads, Keys, OfficialInfo, Messages, Chats,
    Warning, CityRoads, Transactions, CountryTaxes, CountryNotes, CityNotes, PlayerNotes, Events,
    PlayerResources, UnitClass, UnitType, Army, LongTimeouts, EmpireRules
} = require("../database/Models");
const api = require("../middleware/API");
const NameLibrary = require("../variables/NameLibrary")
const Prices = require("../variables/Prices")
const Nations = require("../variables/Nations")
const sequelize = require("../database/DataBase")
const Effects = require("../variables/Effects")
const User = require("../models/User")
const fs = require('fs')
const path = require("path")
const axios = require("axios")
const APIKeysGenerator = require("../models/ApiKeysGenerator")
const CrossStates = require("./CrossStates")
const StopList = require("../files/StopList.json");

class BuildersAndControlsScripts
{
    async Registration(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, `1️⃣ Введите никнейм, которым вы будете пользоваться в будущем. Учтите, что необходимо установить античное имя, реально существовавшее в истории. Со списком таких вы можете ознакомиться ниже.\n👉🏾 Греческие имена: https://ru.m.wikipedia.org/wiki/Список_имён_греческого_происхождения\n👉🏾 Римские имена: https://ru.m.wikipedia.org/wiki/Римские_имена\n👉🏾 Персидские имена: https://ru.m.wikipedia.org/wiki/Персидские_имена`, current_keyboard,2, 35)
                if(!name) return resolve(false)
                let temp = await Player.findOne({where: {nick: name}})
                while(temp)
                {
                    name = await InputManager.InputString(context, `⚠ Этот ник занят`, current_keyboard, 2, 20)
                    if(!name) return resolve(false)
                    temp = await Player.findOne({where: {nick: name}})
                }

                const age = await InputManager.InputInteger(context, `2️⃣ Теперь укажите возраст вашего персонажа.\n⚠ Возраст может быть выбран от 16 до 100 лет.`, current_keyboard, 1, 100)
                if(age === null) return resolve(false)

                const gender = await InputManager.InputBoolean(context, `3️⃣ Укажите пол вашего персонажа.`, current_keyboard, keyboard.manButton, keyboard.womanButton)
                if(gender === null) return resolve(false)

                const nationKeyboard = []
                Object.keys(Nations).forEach(key => {
                    nationKeyboard.push([Nations[key].name, key])
                })

                let nation = await InputManager.KeyboardBuilder(context, "4️⃣ Какова национальность вашего персонажа?", nationKeyboard, current_keyboard)
                if(!nation) return resolve()

                const clan = await InputManager.InputString(context, `5️⃣ Расскажите о своём клане/племени/филе/доме и тд, если они есть\n\n⚠ Длина до 100 символов. Чтобы пропустить нажмите отмена.`, current_keyboard, 0, 100)
                const position = await InputManager.InputString(context, `6️⃣ Расскажите о положении в обществе, например: политик, религиозный деятель, торговец, солдат и т.д.\n\n⚠ Длина до 100 символов. Чтобы пропустить нажмите отмена.`, current_keyboard, 0, 100)
                const appearance = await InputManager.InputString(context, `7️⃣ Укажите внешность, телосложение, гражданская одежда\n\n⚠ Длина до 150 символов. Чтобы пропустить нажмите отмена.`, current_keyboard, 0, 150)
                const personality = await InputManager.InputString(context, `8️⃣ Опишите характер, взгляды, ценности. Если вы опытный ролевик, то именно на этот пункт вы должны сделать акцент.\n⚠ Длина до 250 символов.`, current_keyboard, 0, 250)
                const description = await InputManager.InputString(context, `9️⃣ Расскажите о своём персонаже! Откуда он родом, чем занимается. Возможно есть ли у него семья, дети. С какой целью он пришёл в то место, где находится сейчас.\n⚠ Длина до 1000 символов.`, current_keyboard, 0, 1000)
                if(!description) return resolve(false)
                await context.send(Nations[nation].description)
                nation = Nations[nation].name
                await Player.update({
                    nick: name,
                    gender: gender,
                    clan: clan,
                    position: position,
                    appearance: appearance,
                    personality: personality
                }, {where: {id: context.player.id}})
                await PlayerInfo.update({
                    description: description,
                    nationality: nation,
                    age: age
                }, {where: {id: context.player.id}})
                context.player.nick = name
                context.player.gender = gender
                context.player.clan = clan
                context.player.position = position
                context.player.appearance = appearance
                context.player.personality = personality
                context.player.description = description
                context.player.nationality = nation
                context.player.age = age
                await context.send("✅ Данные обновлены", {keyboard: keyboard.build(current_keyboard)})
                context.player.state = context.scenes.StartScreen
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Registration", e)
            }
        })
    }

    async NewCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const showTags = (array) =>
                {
                    if(array.length === 0) return "Тегов нет"
                    let request = `Теги:\n\n`
                    for(const tag of array)
                    {
                        request += "- " + tag + "\n"
                    }
                    return request
                }

                let name = await InputManager.InputString(context, "1️⃣ Введите название фракции (от 2 до 35 символов):", current_keyboard, 2, 35)
                if (!name) return resolve()
                let country = await Country.count({where: {name: name}})
                while(country > 0)
                {
                    name = await InputManager.InputString(context, "⚠ Фракция с таким названием уже существует.", current_keyboard, 2,30)
                    if (!name) return resolve()
                    country = await Country.count({where: {name: name}})
                }

                const description = await InputManager.InputString(context,"2️⃣ Сделайте описание фракции. (до 1000 символов)",current_keyboard,0,1000)
                if(!description) return resolve()

                const preview = await InputManager.InputPhoto(context,`3️⃣ Отправьте фото для иллюстрации.\n⚠ Это фото используется для генерации карусели с фракциями для удобства игроков, создать фракцию без фото - нельзя.\n\n⚠⚠⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету\n\nБыстро изменить размер фото можно здесь: https://www.visualwatermark.com/ru/image-resizer/`, current_keyboard)
                if (!preview) return resolve()

                const welcomePhoto = await InputManager.InputPhoto(context,`4️⃣ Отправьте приветственное фото\n⚠ Это фото будет встречать новых граждан. (Фото обязательно)`, current_keyboard)
                if(!welcomePhoto) return resolve()

                let capitalName = await InputManager.InputString(context, "5️⃣ Введите название столицы (от 2 до 30 символов):", current_keyboard, 2,30)
                if (!capitalName) return resolve()

                let capital = await City.count({where: {name: capitalName}})
                while(capital > 0)
                {
                    capitalName = await InputManager.InputString(context, "⚠ Город с таким названием уже существует.", current_keyboard, 2, 30)
                    if (!capitalName) return resolve()
                    capital = await City.count({where: {name: capitalName}})
                }

                let leader = await InputManager.InputUser(context, "6️⃣ Теперь нужно указать правителя.")
                if(!leader) return resolve()
                while(leader.dataValues.status.match(/leader/))
                {
                    if(leader.dataValues.status.match(/leader/)) leader = await InputManager.InputUser(context, `⚠ *id${leader.dataValues.id}(${leader.dataValues.nick}) уже является правителем. Заберите у него статус или выберите другого игрока.`, current_keyboard)
                    if(!leader) return resolve()
                }
                let groupId = await InputManager.InputGroup(context, `7️⃣ Укажите группу этой фракции.`, current_keyboard)
                if(!groupId) return resolve()

                await context.send("8️⃣ Теперь надо указать теги фракции, они нужны для указания требуемой фракции в чат-командах. Вводите не слова целиком, а, желательно, их корни.", {keyboard: keyboard.build(current_keyboard)})
                let tags = []
                let newTag = ""
                do
                {
                    await context.send(showTags(tags))
                    newTag = await InputManager.InputString(context, "Введите новый тег", current_keyboard)
                    if(newTag)
                    {
                        tags.push(newTag)
                    }
                }
                while(newTag)
                if(tags.length === 0) return resolve()

                let resourcesKeyboard = [
                    ["🌾 Зерно", "wheat", false],
                    ["🪵 Древесина", "wood", false],
                    ["🪨 Камень", "stone", false],
                    ["🌑 Железо", "iron", false],
                    ["🥉 Бронза", "copper", false],
                    ["🥈 Серебро", "silver", false]
                ]
                let resources = await InputManager.RadioKeyboardBuilder(context, "8️⃣ Выберите ресурсы фракции:", resourcesKeyboard, current_keyboard)
                if(!resources) return resolve()
                resources = resources.filter(key => {
                    return key[1]
                }).map(key => {
                    return key[0]
                })
                let resName = ""
                 resources.forEach(key => {
                     resName += NameLibrary.GetResourceName(key) + "\n"
                })
                resources = resources.join(".")

                let accept = await InputManager.InputBoolean(context, `Итак, мы имеем следующее:\n\n📌 Название: *public${groupId}(${name})\n🏙 Столица: ${capitalName}\n👑 Правитель: *id${leader.dataValues.id}(${leader.dataValues.nick})\n\n⛏ Ресурсы для добычи:\n ${resName}\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }

                const city = await City.create({
                    leaderID: leader.dataValues.id,
                    name: capitalName,
                    description: `Столица фракции *public${groupId}(${name})`,
                    photoURL: preview,
                    isCapital: true,
                    maxBuildings: 8
                })
                await CityResources.create({
                    id: city.dataValues.id
                })
                country = await Country.create({
                    name: name,
                    description: description,
                    photoURL: preview,
                    welcomePhotoURL: welcomePhoto,
                    leaderID: leader.dataValues.id,
                    groupID: groupId,
                    resources: resources,
                    capital: capitalName,
                    capitalID: city.dataValues.id,
                    tested: true,
                    tags: tags.join("|")
                })
                await CountryResources.create({id: country.dataValues.id})
                await PlayerStatus.update({
                    location: city.dataValues.id,
                    countryID: country.dataValues.id,
                    citizenship: country.dataValues.id
                }, {where: {id: leader.dataValues.id}})
                city.set({
                    countryID: country.dataValues.id,
                    capitalID: country.dataValues.id
                })
                leader.set({
                    status: leader.dataValues.status === "worker" ? "worker" : "leader"
                })
                await city.save()
                await leader.save()

                if(Data.users[leader.dataValues.id]?.status !== "worker") Data.users[leader.dataValues.id].status = "leader"
                await Data.LoadCountries()
                await Data.LoadCities()
                await Data.LoadOfficials()
                await api.SendMessage(leader.dataValues.id,`👑 Вы были назначены правителем только что созданной фракции ${name}\nВаш статус изменен на "👑 Правитель"`)
                await context.send("✅ Фракция создана!\nТеперь можно построить дороги через ГМ-меню", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/NewCountry", e)
            }
        })
    }

    async ChangeRole(context, current_keyboard, tools)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока.", current_keyboard)
                if (!user) return resolve()
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(user.dataValues.role))
                {
                    await context.send(`🚫 Вы не имеете права изменять роль игрока *id${user.dataValues.id}(${user.dataValues.nick}).`, {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }
                let giveRoleKB = [
                    ["👶 Игрок", "player"],
                    ["🧒 Модератор", "moder"],
                    ["🧑 Гейм-мастер", "GM"]
                ]
                context.player.role.match(/owner|project_head|support|MGM|Madmin/) && giveRoleKB.push(["👨‍🦳 Админ", "admin"])
                context.player.role.match(/owner|project_head|support|Madmin/) && giveRoleKB.push(["🔝🕹 Старший гейм-мастер", "MGM"])
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["🔝🐓 Старший админ", "Madmin"])
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["🔧 Тех-поддержка", "support"])
                context.player.role.match(/owner/) && giveRoleKB.push(["🤴 Глава проекта", "project_head"])
                let role = await InputManager.KeyboardBuilder(context, `✅ Выбран игрок *id${user.dataValues.id}(${user.dataValues.nick})\n2️⃣ Выберите новую роль.`, giveRoleKB, current_keyboard)
                if(!role) return resolve()
                const status = role.match(/player|moder/) ? await Data.GetUserStatus(user.dataValues.id) : "worker"
                user.set({role: role, status: status})
                await user.save()
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].status = status
                    Data.users[user.dataValues.id].role = role
                    Data.users[user.dataValues.id].state = tools.StayInStartScreen
                }
                role = NameLibrary.GetRoleName(role)
                await api.SendMessageWithKeyboard(user.dataValues.id, `ℹ Пользователь ${context.player.GetName()} назначил вас на роль: ${role}`, tools.GetStartMenuKeyboard(context))
                await context.send(`ℹ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен на роль: ${role}`, {keyboard: keyboard.build(current_keyboard)})
                await Data.LoadWorkers()
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeRole", e)
            }
        })
    }

    async AppointLeader(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = Data.GetCountryButtons()
                if(buttons.length === 0)
                {
                    await context.send("⚠ Фракции не добавлены.")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите государство", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                let user = await InputManager.InputUser(context, "2️⃣ Выберите пользователя", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    context.send(`🚫 Назначать игроков со статусом ⚙ Работник на должность правителя запрещено`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let oldCountry = null
                for(let i = 0; i < Data.countries?.length; i++)
                {
                    if(Data.countries[i]?.leaderID === user.dataValues.id)
                    {
                        oldCountry = await Country.findOne({where: {id: Data.countries[i].id}, attributes: ["id"]})
                        await context.send(`⚠ *id${user.dataValues.id}(${user.dataValues.nick}) уже является правителем!`)
                        break
                    }
                }
                const access = await InputManager.InputBoolean(context, `ℹ Назначить игрока *id${user.dataValues.id}(${user.dataValues.nick}) правителем фракции ${country.GetName(context.player.platform === "IOS")}?`, current_keyboard)
                if(!access)
                {
                    context.send("Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(oldCountry)
                {
                    oldCountry.set({leaderID: null})
                    await oldCountry.save()
                    Data.countries[oldCountry.dataValues.id].leaderID = null
                    await context.send(`⚠ Фракция ${Data.countries[oldCountry.dataValues.id].GetName(context.player.platform === "IOS")} осталась без правителя.`)
                }
                await Country.update({leaderID: user.dataValues.id}, {where: {id: country.id}})
                Data.countries[country.id].leaderID = user.dataValues.id
                await PlayerStatus.update({citizenship: country.id},{where: {id: user.dataValues.id}})
                await OfficialInfo.destroy({where: {id: user.dataValues.id}})
                const oldLeader = await Player.findOne({where: {id: country.leaderID}, attributes: ["status"]})
                if(oldLeader?.dataValues.status !== "worker")
                {
                    await Player.update({status: "official"}, {where: {id: country.leaderID}})
                    if(Data.users[country.leaderID]) Data.users[country.leaderID].status = "official"
                    await api.SendMessage(country.leaderID, `⚠ Вы были сняты с должности правителя фракции ${country.name}\n\n🪪 Ваш статус изменен на "Чиновник"`)
                }
                if(user.dataValues.status !== "worker")
                {
                    user.set({status: "leader"})
                    await user.save()
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "leader"
                }
                await api.SendMessage(user.dataValues.id,`✅ Вы были назначены правителем фракции ${country.name}\n\n👑 Ваш статус изменен на "Правитель"`)
                await context.send(`✅ *id${user.dataValues.id}(${user.dataValues.nick}) назначен правителем фракции ${country.name}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AppointLeader", e)
            }
        })
    }

    async Warnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["⚠ Сделать предупреждение", "new"],
                    ["🗒 Показать предупреждения", "show"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "new" && await this.NewWarning(context, current_keyboard)
                action === "show" && await this.ShowListWarnings(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async ShowListWarnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                await OutputManager.GetUserWarnings(context.player.id, user.dataValues.id)
                await context.send("Назад", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async Bans(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["🚫 Забанить игрока", "new"],
                    ["🗒 Показать баны", "show"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "new" && await this.NewBan(context, current_keyboard)
                action === "show" && await this.ShowBan(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async ShowBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                if(!user.dataValues.isBanned)
                {
                    context.send(`ℹ Пользователь *id${user.dataValues.id}(${user.dataValues.nick}) не забанен.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const ban = await Ban.findOne({where: {userID: user.dataValues.id}})
                if(!ban)
                {
                    if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = false
                    user.set({isBanned: false})
                    await user.save()
                    await api.SendMessage(user.dataValues.id, "✅ Вы были разбанены.")
                    await context.send(`✅ У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет бана. Видимо произошла ошибка, сейчас все исправлено.`)
                    return resolve()
                }
                await context.send(`ℹ Бан от ${NameLibrary.ParseDateTime(ban.dataValues.createdAt)}:\nНик: *id${user.dataValues.id}(${user.dataValues.nick})\nПричина: ${ban.dataValues.reason}\nПодробная причина: ${ban.dataValues.explanation}\n\nℹ Если вы обжалуете бан, то вместе с баном удалятся и все предупреждения`, {keyboard: keyboard.build([[keyboard.hideCallbackButton()], ban.dataValues.prohibit ? [] : [keyboard.appealCallbackButton({command: "appeal_ban", item: ban.dataValues.id})]]).inline()})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ShowBan", e)
            }
        })
    }

    async CheatingUserResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите накрутить ресурс?", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    context.send("🚫 Накрутка ресурсов работникам запрещена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const resources = [[keyboard.moneyButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ Выберите какой ресурс вы хотите накрутить игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "3️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddPlayerResources(user.dataValues.id, objIN)
                await api.SendMessage(user.dataValues.id, `ℹ Вам поступил перевод:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CheatingUserResources", e)
            }
        })
    }

    async CheatingCityResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город, которому вы хотите перевести накрутить ресурсы:", Data.GetCityButtons(), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, "2️⃣ Выберите какой ресурс вы хотите накрутить", resources)
                if (resource === "cancel")
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "3️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddCityResources(cityID, objIN)
                await api.SendMessage(Data.cities[cityID].leaderID, `✅ Поступил перевод в бюджет города ${Data.cities[cityID].name} в размере:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CheatingCityResources", e)
            }
        })
    }

    async CheatingCountryResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ Выберите какой ресурс вы хотите перевести в бюджет фракции ${country.GetName(context.player.platform === "IOS")}?`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, `3️⃣ Введите количество`, current_keyboard)
                if(count === null) return resolve()
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: Фракция ${country.GetName(context.player.platform === "IOS")}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let objIN = {}
                objIN[resource] = count
                await Data.AddCountryResources(country.id, objIN)
                await api.SendMessage(country.leaderID, `ℹ Поступил перевод в бюджет фракции ${country.GetName(context.player.platform === "IOS")} в размере:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CheatingCountryResources", e)
            }
        })
    }

    async CreateLastWill(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя, которому завещаете все свое имущество", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.id === context.player.id)
                {
                    context.send("ℹ Указывать себя в завещании запрещено.")
                    return resolve()
                }

                const lastWillText = await InputManager.InputString(context, "2️⃣ Введите текст завещания. Этот текст будет виден только вам и наследователю после вашей смерти. (до 1000 символов)", current_keyboard, 0, 1000)
                if (!lastWillText)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const lastWill = await LastWills.count({where: {userID: context.player.id}})
                if(lastWill !== 0)
                {
                    await LastWills.update({text: lastWillText, successorID: user.dataValues.id}, {where: {userID: context.player.id}})
                }
                else
                {
                    await LastWills.create({
                        userID: context.player.id,
                        text: lastWillText,
                        successorID: user.dataValues.id
                    })
                }
                current_keyboard[0][2] = keyboard.deleteLastWillButton
                await context.send("✅ Добавлено завещание.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(user.dataValues.id, `✅ Игрок ${context.player.GetName()} добавил вас в своё завещание.`)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateLastWill", e)
            }
        })
    }

    async DeleteLastWill(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const lastWill = await LastWills.findOne({where: {userID: context.player.id}})
                if(!lastWill) return resolve()
                await context.send(`ℹ *id${context.player.id}(Ваше) завещание:\nНаследователь: ${await NameLibrary.GetPlayerNick(lastWill.dataValues.successorID)}\nТекст:${lastWill.dataValues.text}`)
                const success = await InputManager.InputBoolean(context, "❓ Вы уверены что хотите удалить свое завещание?")
                if(!success) return resolve()

                await LastWills.destroy({where: {userID: context.player.id}})
                current_keyboard[0][2] = keyboard.createLastWillButton
                await context.send("✅ Завещание удалено.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(lastWill.dataValues.successorID, `ℹ Игрок ${context.player.GetName()} удалил своё завещание.`)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/DeleteLastWill", e)
            }
        })
    }

    async Relaxing(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.fatigue === 100)
                {
                    await context.send("💪 Вы полны сил")
                    return resolve()
                }
                let result = await CrossStates.Relaxing(context)
                if(result.sleep)
                {
                    await context.send(`💤 Вы перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(result.time)}`, {keyboard: keyboard.build(current_keyboard(context))})
                }
                else
                {
                    await context.send(`💪 Ваш уровень энергии восстановлен до ${result.fatigue}%`, {keyboard: keyboard.build(current_keyboard(context))})
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Wakeup", e)
            }
        })
    }

    async ChangeCityName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите новое название города (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "ℹ Город с таким названием уже существует. Введите название города еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `❓ Переименовать город \"${context.city.name}\" в "${name}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({name: name}, {where: {id: context.city.id}})
                context.city.name = name
                await context.send("✅ Город переименован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCityName", e)
            }
        })
    }

    async ChangeCityDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `ℹ Старое описание: ${context.city.description}\n\n1️⃣ Введите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить описание города?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({description: description}, {where: {id: context.city.id}})
                context.city.description = description
                await context.send("✅ Описание города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCityDescription", e)
            }
        })
    }

    async ChangeCityPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.city.photoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: context.city.photoURL})
                }
                else
                {
                    await context.send("ℹ У города нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото. (Оно будет встречать людей, когда они будут заходить в город)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить фото города?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({photoURL: photo}, {where: {id: context.city.id}})
                context.city.photoURL = photo
                await context.send("✅ Фото города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCityPhoto", e)
            }
        })
    }

    async CityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"],
                    ["🔀 Фракции", "country"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.CityToUserTransaction(context, current_keyboard)
                action === "city" && await this.CityToCityTransaction(context, current_keyboard)
                action === "country" && await this.CityToCountryTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "2️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                user = user.dataValues
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `3️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести игроку *id${user.id}(${user.nick})`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `4️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `5️⃣ Подтвердите перевод:\n\nКому: игроку *id${user.id}(${user.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddPlayerResources(user.id, objOUT)
                await api.SendMessage(user.id, `✅ Из бюджета города ${Data.cities[context.cityID].name} в ваш инвентарь поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = []
                Data.cities.forEach((key) => {
                    if(key?.countryID === Data.cities[context.cityID].countryID && key?.id !== Data.cities[context.cityID].id)
                    {
                        buttons.push([key.name, "ID" + key.id])
                    }
                })
                if(buttons.length === 0)
                {
                    context.send(`ℹ Город ${Data.cities[context.cityID].name} единственный в фракции ${Data.GetCountryForCity(context.cityID)?.GetName(context.player.platform === "IOS")}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", buttons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет города ${city.name}`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\n\nКому: город ${city.name}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddCityResources(city.id, objOUT)
                await api.SendMessage(city.leaderID, `✅ Из бюджета города ${Data.cities[context.cityID].name} в бюджет города ${city.name} поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToCountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `1️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет фракции ${Data.GetCountryName(Data.GetCountryForCity(context.cityID).id)}`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `2️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `3️⃣ Подтвердите перевод:\n\nКому: фракция ${Data.GetCountryForCity(context.cityID).GetName(context.player.platform === "IOS")}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddCountryResources(Data.GetCountryForCity(context.cityID).id, objOUT)
                await api.SendMessage(Data.GetCountryForCity(context.cityID).leaderID, `✅ Из бюджета города ${Data.cities[context.cityID].name} в бюджет фракции ${Data.GetCountryForCity(context.cityID).GetName(context.player.platform === "IOS")} поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async DeleteCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Постройки в городе:\n\n"
                const buildingButtons = []
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    request += (i+1) + ": " + Data.buildings[context.cityID][i].GetType() + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + " ур\n"
                    if(Data.buildings[context.player.location][i].type !== "building_of_house")
                    {
                        buildingButtons.push([Data.buildings[context.cityID][i].GetEmoji() + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send(request + "\n🏘 В городе нет построек, которые вы можете снести.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let buildingID = await InputManager.KeyboardBuilder(context, request + "\nВыберите здание, которое хотите снести.\n⚠ Вы не можете распоряжаться домами игроков.", buildingButtons, current_keyboard)
                if(!buildingID) return resolve()
                buildingID = Data.ParseButtonID(buildingID)

                const accept = await InputManager.InputBoolean(context, `ℹ Стоимость сноса здания:\n${NameLibrary.GetPrice(Prices["delete_building"])}\nСейчас в бюджете ${Data.cities[context.cityID].GetResources()} монет.\n\n⚠ Вы действительно ходите снести это здание?`)
                if (!accept) return resolve()
                if(!Data.cities[context.cityID].CanPay(Prices["delete_building"]))
                {
                    await context.send("⚠ В бюджете города не хватает ресурсов!")
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices["delete_building"])
                await Buildings.destroy({where: {id: buildingID}})
                Data.cities[context.cityID].buildingsScore = Math.max(0, Data.cities[context.cityID].buildingsScore - 1)
                await City.update({buildingsScore: Data.cities[context.cityID].buildingsScore}, {where: {id: context.cityID}})
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i]?.ownerType === "user" && Data.buildings[context.cityID][i]?.id === buildingID)
                    {
                        await api.SendMessage(Data.buildings[context.cityID][i].ownerID, `⚠ Глава города ${Data.cities[context.cityID].name} распорядился снести вашу постройку ${Data.buildings[context.cityID][i].GetType()} \"${Data.buildings[context.cityID][i].name}\"`)
                        break
                    }
                }
                await Data.LoadBuildings()
                await context.send("✅ Здание снесено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/DeleteCityBuilding", e)
            }
        })
    }

    async CreateCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const country = Data.GetCountryForCity(context.cityID)
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"],
                    ["🗿 Памятник", "monument"]
                ]
                country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "1️⃣ Цены на постройки:\n\n"
                request += Data.cities[context.cityID].GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\nℹ Сейчас в городе " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(Data.cities[context.cityID].buildingsScore >= Data.cities[context.cityID].maxBuildings && !building.match(/monument|barracks|port|church/))
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!Data.cities[context.cityID].CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.match(/port|barracks/))
                {
                    for(let i = 0; i < Data.cities.length; i++)
                    {
                        if(Data.cities[i])
                        {
                            if(Data.cities[i].countryID === Data.cities[context.cityID].countryID)
                            {
                                for(let j = 0; j < Data.buildings[Data.cities[i].id]?.length; j++)
                                {
                                    if(Data.buildings[Data.cities[i].id][j]?.type === "building_of_" + building)
                                    {
                                        const country = Data.GetCountryForCity(context.cityID)
                                        await context.send(`⚠ В фракции *public${country.groupID}(${country.name}) уже имеется ${NameLibrary.GetBuildingType("building_of_" + building)}`, {keyboard: keyboard.build(current_keyboard)})
                                        return resolve()
                                    }
                                }
                            }
                        }
                    }
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите постройку. (от 1 до 35 символов)", current_keyboard, 1, 35)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Введите описание для постройки (нажмите \"Отмена\" чтобы оставить без описания)", current_keyboard, 1)
                await Data.AddCityResources(context.cityID, Prices["new_" + building])
                await Buildings.create({
                    cityID: context.cityID,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "city",
                    level: 1,
                    freezing: false
                })
                await Data.ResetBuildings()
                if(!building.match(/monument|barracks|port|church/))
                {
                    Data.cities[context.cityID].buildingsScore++
                    await City.update({buildingsScore: Data.cities[context.cityID].buildingsScore}, {where: {id: context.cityID}})
                }
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateCityBuilding", e)
            }
        })
    }

    async UpgradeCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Городские постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city")
                    {
                        buildingButtons.push([Data.buildings[context.cityID][i].GetEmoji() + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
                        request += `${NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type)} \"${Data.buildings[context.cityID][i].name}\" ${Data.buildings[context.cityID][i].level} ур\n`
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В городе нет городских построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i].id === building)
                    {
                        building = Data.buildings[context.cityID][i]
                        break
                    }
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.type.match(/church|monument/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`ℹ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!Data.cities[context.cityID].CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(Data.cities[context.cityID].id, Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UpgradeCityBuilding", e)
            }
        })
    }

    async GiveToCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Городские постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city")
                    {
                        buildingButtons.push([Data.buildings[context.cityID][i].GetEmoji() + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
                        request += `${NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type)} \"${Data.buildings[context.cityID][i].name}\" ${Data.buildings[context.cityID][i].level} ур\n`
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В городе нет городских построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let buildingID = await InputManager.KeyboardBuilder(context, request + "\n\n1️⃣ Выберите постройку, которую вы хотите передать в государственное владение", buildingButtons, current_keyboard)
                if(!buildingID) return resolve()
                buildingID = Data.ParseButtonID(buildingID)
                let building = await Buildings.findOne({where: {id: buildingID}})
                const accept = await InputManager.InputBoolean(context, `Передать ${NameLibrary.GetBuildingType(building.dataValues.type)} ${building.dataValues.name} в государственное владение?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                building.set({
                    ownerType: "country"
                })
                await building.save()
                Data.buildings[context.cityID].filter(key => {return key.id === buildingID})[0].ownerType = "country"
                await context.send("✅ Постройка передана фракции.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GiveToCountryBuilding", e)
            }
        })
    }

    async ExpandCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const isCapital = Data.cities[context.cityID].isCapital
                const maxBuildings = Data.cities[context.cityID].maxBuildings
                if((isCapital && maxBuildings >= 16) || (!isCapital && maxBuildings >= 12))
                {
                    await context.send("🏘 Город максимально расширен.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Расширение города ${maxBuildings} => ${maxBuildings + 2} мест для строительства.\n\n${Data.cities[context.cityID].GetResources()}\n\nСтоимость расширения:\n${NameLibrary.GetPrice(Prices['expand_city'])}\n\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!Data.cities[context.cityID].CanPay(Prices['expand_city']))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices['expand_city'])
                await Data.cities[context.cityID].Expand()
                await context.send(`✅ Город расширен до ${Data.cities[context.cityID].maxBuildings} мест.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ExpandCity", e)
            }
        })
    }

    async GetAllCityResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let extraction = {}
                let extract = 0
                let request = "ℹ Добыча из построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 4)
                let resource = ""
                let flag = false
                let isVoid = true
                for(let i = 0, j = 0; i < Data.buildings[context.cityID]?.length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city" && Data.buildings[context.cityID][i].type.match(/wheat|stone|wood|iron|silver/) && !Data.buildings[context.cityID][i].isFreezing)
                    {
                        flag = true
                        j++
                        request += (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" "
                        if(Data.buildings[context.cityID][i].lastActivityTime - time <= 0)
                        {
                            isVoid = false
                            resource = Data.buildings[context.cityID][i].type.replace("building_of_", "")
                            extract = Math.round(Data.buildings[context.cityID][i].GetExtraction() * 0.9)
                            request += " - добыто\n"
                            Data.buildings[context.cityID][i].lastActivityTime = future
                            await Data.buildings[context.cityID][i].SaveWorkTime()
                            if(extraction[resource])
                            {
                                extraction[resource] += -extract
                            }
                            else
                            {
                                extraction[resource] = -extract
                            }
                        }
                        else
                        {
                            request += " - через " + NameLibrary.ParseFutureTime(Data.buildings[context.cityID][i].lastActivityTime) + "\n"
                        }
                    }
                }
                if(!flag)
                {
                    await context.send("⚠ В городе нет построек для добычи ресурсов принадлежащих городу.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!isVoid)
                {
                    if(Data.timeouts["city_timeout_resources_ready_" + context.cityID])
                    {
                        clearTimeout(Data.timeouts["city_timeout_resources_ready_" + context.cityID].timeout)
                        delete Data.timeouts["city_timeout_resources_ready_" + context.cityID]
                    }
                    Data.timeouts["city_timeout_resources_ready_" + context.cityID] = {
                        type: "city_timeout",
                        subtype: "resources_ready",
                        time: future,
                        cityID: context.cityID,
                        timeout: setTimeout(async () =>
                        {
                            await context.send(`✅ Постройки города ${Data.cities[context.cityID].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                            delete Data.timeouts["city_timeout_resources_ready_" + context.cityID]
                        }, 14400000)
                    }
                }
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCityResources(context.cityID, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetAllCityResources", e)
            }
        })
    }

    async GetCountryCities(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Список городов в фракции " + context.country.GetName(context.player.platform === "IOS") + ":\n\n"
                let leaders = Data.cities.filter(city => {return city?.countryID === context.country.id}).map(city => {return city.leaderID})
                let players = await Player.findAll({where: {id: leaders}, attributes: ["id", "nick"]})
                let userIds = {}
                let names = await api.api.users.get({
                    user_ids: leaders.join(",")
                })
                for(const user of names)
                {
                    userIds[user.id] = user
                    userIds[user.id].nick = players.filter(key => {return key.dataValues.id === user.id})[0].dataValues.nick
                }
                for(let i = 0, j = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        j++
                        request += `${j}: 🌇 Город ${Data.cities[i].name} ${Data.cities[i].isCapital ? "(Столица) " : ""}- глава *id${Data.cities[i].leaderID}(${userIds[Data.cities[i].leaderID].nick}) [${userIds[Data.cities[i].leaderID].first_name + " " + userIds[Data.cities[i].leaderID].last_name}]\n\n`
                    }
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryCities", e)
            }
        })
    }

    async ChangeCountryName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите новое название фракции (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let country = await Country.findOne({where: {name: name}})
                while(country)
                {
                    name = await InputManager.InputString(context, "⚠ Фракция с таким названием уже существует. Введите название фракции еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    country = await Country.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `❓ Переименовать фракцию ${context.country.GetName(context.player.platform === "IOS")} в "${"*public" + context.country.groupID + "(" + name + ")"}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({name: name}, {where: {id: context.country.id}})
                context.country.name = name
                await context.send("✅ Фракция переименована.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryName", e)
            }
        })
    }

    async ChangeCountryParliamentForm(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите название формы правления (от 2 до 50 букв)", current_keyboard, 2, 50)
                if(!name) return resolve()

                const accept = await InputManager.InputBoolean(context, `❓ Изменить форму правления фракции ${context.country.GetName(context.player.platform === "IOS")} с ${context.country.governmentForm} на ${name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({governmentForm: name}, {where: {id: context.country.id}})
                context.country.governmentForm = name
                await context.send("✅ Форма правления изменена", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryName", e)
            }
        })
    }


    async ChangeCountryDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `1️⃣ Старое описание: ${context.country.description}\n\nВведите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить описание фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({description: description}, {where: {id: context.country.id}})
                context.country.description = description
                await context.send("✅ Описание фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryDescription", e)
            }
        })
    }

    async ChangeCountryPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                if(country.photoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: country.photoURL})
                }
                else
                {
                    await context.send("ℹ У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото.\n⚠ Это фото используется для генерации карусели.\n\n⚠⚠⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету\n\nБыстро изменить размер фото можно здесь: https://www.visualwatermark.com/ru/image-resizer/", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({photoURL: photo}, {where: {id: country.id}})
                context.country.photoURL = photo
                await context.send("✅ Фото Фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryPhoto", e)
            }
        })
    }

    async ChangeCountryWelcomePhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.welcomePhotoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: context.country.welcomePhotoURL})
                }
                else
                {
                    await context.send("ℹ У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото. (Оно будет отображаться при въезде в фракцию)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить приветственное фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({welcomePhotoURL: photo}, {where: {id: context.country.id}})
                context.country.welcomePhotoURL = photo
                await context.send("✅ Приветственное фото фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryWelcomePhoto", e)
            }
        })
    }

    async ChangeCountryParliament(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.isParliament)
                {
                    await Country.update({isParliament: false}, {where: {id: context.country.id}})
                    context.country.isParliament = false
                    await context.send("✅ Теперь у фракции только один правитель.", {keyboard: keyboard.build(current_keyboard)})
                }
                else
                {
                    await Country.update({isParliament: true}, {where: {id: context.country.id}})
                    context.country.isParliament = true
                    await context.send("✅ Теперь у фракции несколько правителей, правителями считаются чиновники с правом назначения чиновников.", {keyboard: keyboard.build(current_keyboard)})
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryWelcomePhoto", e)
            }
        })
    }

    async ChangeCountryGroup(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let group = await InputManager.InputGroup(context, `ℹ *public${context.country.groupID}(Ссылка на группу фракции)\n\n1️⃣ Чтобы изменить:`, current_keyboard)
                if(!group) return resolve()
                const accept = await InputManager.InputBoolean(context, `❓ Изменить группу на *public${group}(новую)?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({groupID: group}, {where: {id: context.country.id}})
                context.country.groupID = group
                await context.send("✅ Группа фракции изменена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryGroup", e)
            }
        })
    }

    async GetAllCountryResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let extraction = {}
                let extract = 0
                let request = "ℹ Добыча из государственных построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 4)
                let resource = ""
                let flag = false
                let isVoid = true
                for(let k = 0; k < Data.cities.length; k++)
                {
                    if(Data.cities[k]?.countryID === context.country.id)
                    {
                        request += "🌇 Город " + Data.cities[k].name + ":"
                        for(let i = 0, j = 0; i < Data.buildings[Data.cities[k].id]?.length; i++)
                        {
                            if(Data.buildings[Data.cities[k].id][i].ownerType === "country" && Data.buildings[Data.cities[k].id][i].type.match(/wheat|stone|wood|iron|silver/) && !Data.buildings[Data.cities[k].id][i].isFreezing)
                            {
                                flag = true
                                j++
                                request += "\n" + (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[Data.cities[k].id][i].type) + " \"" + Data.buildings[Data.cities[k].id][i].name + "\" "
                                if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time <= 0)
                                {
                                    isVoid = false
                                    resource = Data.buildings[Data.cities[k].id][i].type.replace("building_of_", "")
                                    extract = Math.round(Data.buildings[Data.cities[k].id][i].GetExtraction() * 0.8)
                                    request += ` - добыто ${extract}`
                                    Data.buildings[Data.cities[k].id][i].lastActivityTime = future
                                    await Data.buildings[Data.cities[k].id][i].SaveWorkTime()
                                    if(extraction[resource])
                                    {
                                        extraction[resource] += -extract
                                    }
                                    else
                                    {
                                        extraction[resource] = -extract
                                    }
                                }
                                else
                                {
                                    request += " - через " + NameLibrary.ParseFutureTime(Data.buildings[Data.cities[k].id][i].lastActivityTime)
                                }
                            }
                        }
                        if(!Data.buildings[Data.cities[k].id])
                        {
                            request += " - нет построек"
                        }
                        request += "\n\n"
                    }
                }
                if(!flag)
                {
                    await context.send("⚠ В фракции нет государственных построек для добычи ресурсов принадлежащих государству.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!isVoid)
                {
                    if(Data.timeouts["country_timeout_resources_ready_" + context.country.id])
                    {
                        clearTimeout(Data.timeouts["country_timeout_resources_ready_" + context.country.id].timeout)
                        delete Data.timeouts["country_timeout_resources_ready_" + context.country.id]
                    }
                    Data.timeouts["country_timeout_resources_ready_" + context.cityID] = {
                        type: "country_timeout",
                        subtype: "resources_ready",
                        userId: context.player.id,
                        countryID: context.country.id,
                        time: future,
                        timeout: setTimeout(async () =>
                        {
                            await context.send(`✅ Постройки фракции ${context.country.GetName(context.player.platform === "IOS")} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                            delete Data.timeouts["country_timeout_resources_ready_" + context.country.id]
                        }, 14400000)
                    }
                }
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCountryResources(context.country.id, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetAllCountryResources", e)
            }
        })
    }

    async CountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.CountryToUserTransaction(context, current_keyboard)
                action === "city" && await this.CountryToCityTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryToCityTransaction", e)
            }
        })
    }

    async CountryToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока, которому вы хотите перевести ресурсы из бюджета фракции:", current_keyboard)
                if(!user) return resolve()
                user = user.dataValues
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${context.country.GetResources()}\n\nВыберите какой ресурс вы хотите перевести`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.country[resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(context.country[resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: игрок *id${user.id}(${user.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddPlayerResources(user.id, objOUT)
                await api.SendMessage(user.id, `✅ Из бюджета фракции ${context.country.GetName(context.player.platform === "IOS")} к вам в инвентарь поступил перевод в размере:\n\n${NameLibrary.GetPrice(objOUT)}`)
                await Transactions.create({
                    fromID: context.player.id,
                    toID: user.id,
                    type: "ctrtp",
                    money: objOUT.money ? objOUT.money : null,
                    stone: objOUT.stone ? objOUT.stone : null,
                    wood: objOUT.wood ? objOUT.wood : null,
                    wheat: objOUT.wheat ? objOUT.wheat : null,
                    iron: objOUT.iron ? objOUT.iron : null,
                    copper: objOUT.copper ? objOUT.copper : null,
                    silver: objOUT.silver ? objOUT.silver : null,
                    diamond: objOUT.diamond ? objOUT.diamond : null
                })
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryToUserTransaction", e)
            }
        })
    }

    async CountryToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город, в бюджет которого хотите перевести ресурсы:", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${context.country.GetResources()}\n\nПереводить ресурсы можно только в бюджет города фракции.\n\nВыберите какой ресурс вы хотите перевести в бюджет города ${Data.GetCityName(cityID)}?`, resources)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.country[resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(context.country[resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddCityResources(cityID, objOUT)
                await api.SendMessage(Data.cities[cityID].leaderID, `✅ Из бюджета фракции ${context.country.GetName(context.player.platform === "IOS")} поступил перевод в бюджет города ${Data.cities[cityID].name} в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryToCityTransaction", e)
            }
        })
    }

    async GetCountryTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let time = new Date()
                if(Data.timeouts["country_get_tax_" + context.country.id])
                {
                    await context.send("✡ Вы уже собирали налоги, следующий сбор будет доступен через " + NameLibrary.ParseFutureTime(Data.timeouts["country_get_tax_" + context.country.id].time), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let taxIncome = {}
                Object.keys(Prices["void_tax_price"]).forEach(key => {taxIncome[key] = Prices["void_tax_price"][key]})
                let totalIncome = {}
                Object.keys(Prices["void_tax_price"]).forEach(key => {totalIncome[key] = Prices["void_tax_price"][key]})
                let tax = context.country.tax / 100
                let count = 0
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        Object.keys(taxIncome).forEach(key => {
                            taxIncome[key] = Math.round(parseInt(Data.cities[i][key]) * tax)
                            totalIncome[key] += taxIncome[key]
                        })
                        count++
                        taxIncome = NameLibrary.ReversePrice(taxIncome)
                        await Data.AddCityResources(Data.cities[i].id, taxIncome)
                        await api.SendMessage(Data.cities[i].leaderID, `ℹ Правительство фракции ${context.country.GetName(context.player.platform === "IOS")} собрал с городов фракции налоги в размере ${context.country.tax}%, из бюджета города \"${Data.cities[i].name}\" собрано:\n${NameLibrary.GetPrice(taxIncome)}`)
                    }
                }
                await Data.AddCountryResources(context.country.id, totalIncome)
                time.setHours(time.getHours() + 168)
                Data.timeouts["country_get_tax_" + context.country.id] = {
                    type: "country_timeout",
                    subtype: "city_tax",
                    countryID: context.country.id,
                    time: time,
                    timeout: setTimeout(() => {
                        delete Data.timeouts["country_tax_" + context.country.id]
                    })
                }
                await context.send(`ℹ С ${count} городов собрано:\n${NameLibrary.GetPrice(totalIncome)}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryTax", e)
            }
        })
    }

    async SetMayor(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityButtons
                if(NameLibrary.RoleEstimator(context.player.role) > 2)
                {
                    cityButtons = Data.GetCityButtons()
                }
                else
                {
                    cityButtons = Data.GetCityForCountryButtons(context.player.countryID)
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                const user = await InputManager.InputUser(context, `2️⃣ Выберите, кого назначить главой города ${city.name}`, current_keyboard)
                if(!user) return resolve()
                const accept = await InputManager.InputBoolean(context, `Назначить *id${user.dataValues.id}(${user.dataValues.nick}) главой города ${city.name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.status.match(/citizen|stateless|official/))
                {
                    await PlayerStatus.update({citizenship: city.countryID}, {where: {id: user.dataValues.id}})
                }
                await City.update({leaderID: user.dataValues.id}, {where: {id: city.id}})
                city.leaderID = user.dataValues.id
                await api.SendMessage(user.dataValues.id, `✅ Вы были назначены главой города ${city.name}`)
                await context.send(`✅ Игрок ${await NameLibrary.GetPlayerNick(user.dataValues.id)} назначен главой города ${city.name}`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SetMayor", e)
            }
        })
    }

    async SetTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = [
                    [keyboard.secondaryButton(["💰 Налог для граждан конкретной фракции", "countryTax"])],
                    [keyboard.secondaryButton(["💸😺 Гражданский налог", "citizenTax"]), keyboard.secondaryButton(["💸😾 Налог для приезжих", "nonCitizenTax"])],
                    [keyboard.secondaryButton(["🏙 Городской налог", "tax"]), keyboard.secondaryButton(["🏢 Налог на постройки", "privateBuildingTax"]), keyboard.secondaryButton(["⏩ Въездная пошлина", "entranceFee"])],
                    [keyboard.backButton],
                ]
                const taxType = await InputManager.ChooseButton(context, "1️⃣ Какой тип налога вы хотите установить?", buttons)
                if(taxType === "back")
                {
                    await context.send("Назад", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(taxType === "countryTax")
                {
                    await this.SetCountryTax(context, current_keyboard)
                    return resolve()
                }
                const taxSamples = {
                    tax: "2️⃣ Укажите городской налог в процентах (этот налог вы можете снимать с городов раз в неделю)",
                    citizenTax: "2️⃣ Укажите налог для граждан в процентах (этот налог будет сниматься с граждан при добыче ресурсов и обмене ресурсами)",
                    nonCitizenTax: "2️⃣ Укажите налог для граждан другой фракции и апатридов в процентах (этот налог будет сниматься с игроков, не являющихся гражданами фракции, при добыче ресурсов и обмене ресурсами)",
                    entranceFee: "2️⃣ Укажите въездную пошлину в монетах (это та сумма, которую надо оплатить перед отправкой в вашу фракцию)",
                    privateBuildingTax: "2️⃣ Укажите налог на частные постройки в процентах"
                }
                const tax = await InputManager.InputInteger(context, taxSamples[taxType], current_keyboard, 0, taxType === "entranceFee" ? Number.MAX_SAFE_INTEGER : 100)
                if(tax === null) return resolve()
                context.country[taxType] = tax
                let newTax = {}
                newTax[taxType] = tax
                await Country.update(newTax, {where: {id: context.country.id}})
                await context.send("✅ Налог изменен.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SetTax", e)
            }
        })
    }

    async SetCountryTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = []
                for(const c of Data.countries)
                {
                    if(c && c?.id !== context.country.id)
                    {
                        kb.push([c.name, "ID" + c.id])
                    }
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", kb, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let currentTax = await CountryTaxes.findOne({where: {countryID: context.country.id, toCountryID: country.id}})
                const newTax = await InputManager.InputInteger(context, `${currentTax ? `Существующий налог для граждан фракции ${country.GetName()} ${currentTax.dataValues.tax}` : ""}\n\nВведите новый налог в процентах`, current_keyboard, 0, 100)
                if(newTax === null) return resolve()
                if(currentTax)
                {
                    await CountryTaxes.update({tax: newTax}, {where: {countryID: context.country.id, toCountryID: country.id}})
                }
                else
                {
                    await CountryTaxes.create({
                        countryID: context.country.id,
                        toCountryID: country.id,
                        tax: newTax
                    })
                }
                await context.send("✅ Налог установлен", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BuildTheRoad", e)
            }
        })
    }

    async BuildNewCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let leader = await InputManager.InputUser(context, `${context.country.GetResources()}\n\nСтоимость строительства нового города:\n${NameLibrary.GetPrice(Prices["new_city"])}\n\n1️⃣ Укажите градоначальника`, current_keyboard)
                if(!leader) return resolve()
                if(leader.dataValues.status === "worker")
                {
                    await context.send("⚠ Назначать игроков со статусом ⚙ Работник на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let leaderInfo = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                if(leaderInfo.dataValues.citizenship !== context.country.id)
                {
                    await context.send(`⚠ Игрок не является гражданином фракции ${context.country.GetName(context.player.platform === "IOS")}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!context.country.CanPay(Prices["new_city"]))
                {
                    await context.send(`⚠ В бюджете не хватает ресурсов`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let name = await InputManager.InputString(context, "2️⃣ Введите название нового города (от 2 до 35 символов)", current_keyboard, 2, 35)
                if(!name) return resolve()
                let city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует, повторите ввод.", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                let description = await InputManager.InputString(context, "3️⃣ Введите описание города (от 2 до 1000 символов)", current_keyboard, 2, 1000)
                if(!description) return resolve()
                const newCity = await City.create({
                    countryID: context.country.id,
                    leaderID: leader.dataValues.id,
                    name: name,
                    description: description
                })
                await CityRoads.create({fromID: context.country.capitalID, toID: newCity.dataValues.id, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityRoads.create({fromID: newCity.dataValues.id, toID: context.country.capitalID, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityResources.create({id: newCity.dataValues.id})
                if(leader.dataValues.status.match(/citizen|/))
                {
                    if(Data.users[leader.dataValues.id]) Data.users[leader.dataValues.id].status = "official"
                    leader.set({status: "official"})
                    await leader.save()
                    await OfficialInfo.findOrCreate({
                        where: {id: leader.dataValues.id},
                        defaults: {id: leader.dataValues.id, nick: leader.dataValues.nick, countryID: context.country.id}
                    })
                }
                await Data.AddCountryResources(context.country.id, Prices["new_city"])
                await Data.LoadCities()
                await api.SendMessage(leader.dataValues.id, `✅ Правитель фракции ${context.country.GetName(context.player.platform === "IOS")} построил новый город \"${newCity.dataValues.name}\" и вы были назначены его главой, ваш статус изменен на "Чиновник"`)
                await context.send("✅ Город создан.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BuildNewCity", e)
            }
        })
    }

    async BuildTheRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.cityID].isCapital)
                {
                    await context.send("ℹ Вы находитесь в столице, все дороги фракции соединены со столицей, нет нужды строить дополнительные дороги")
                    return resolve()
                }
                const roads = await CityRoads.findAll({where: {fromID: context.cityID}, attributes: ["id", "toID"]})
                let nonRoadCityButtons = []
                const cities = Data.GetCountryCities(Data.cities[context.cityID].countryID)
                let roadFlag = true
                for(const city of cities)
                {
                    if(city.id === context.cityID) continue
                    roadFlag = true
                    for(const road of roads)
                    {
                        if(city.id === road.dataValues.toID)
                        {
                            roadFlag = false
                            break
                        }
                    }
                    if(roadFlag)
                    {
                        nonRoadCityButtons.push([city.name, "ID" + city.id])
                    }
                }
                if(nonRoadCityButtons.length === 0)
                {
                    await context.send("ℹ Вы провели все доступные вам дороги.")
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, `${Data.cities[context.cityID].GetResources()}\n\nПостройка новой дороги стоит:\n${NameLibrary.GetPrice(Prices["new_road"])}\n\nℹ Выберите город, к которому вы хотите провести дорогу:`, nonRoadCityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.cities[Data.ParseButtonID(city)]
                if(!Data.cities[context.cityID].CanPay(Prices["new_road"]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Построить дорогу от ${Data.cities[context.cityID].name} до ${city.name}?`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices["new_road"])
                const roadFrom = await CityRoads.create({fromID: context.cityID, toID: city.id, isBlocked: true})
                const roadTo = await CityRoads.create({fromID: city.id, toID: context.cityID, isBlocked: true})
                await api.GMMailing(`ℹ Глава города ${Data.cities[context.cityID].name} построил дорогу к городу ${city.name}, необходимо заполнить данные о расстоянии.`, [[keyboard.startCallbackButton({command: "set_road_distance", item: roadTo.dataValues.id, addition: roadFrom.dataValues.id})]])
                await context.send("✅ Дорога построена, осталось чтобы ГМ-ы обработали заявку", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BuildTheRoad", e)
            }
        })
    }

    async CreateCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город, в котором хотите разместить новую постройку", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if (!city) return resolve()
                city = Data.ParseButtonID(city)
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["🪙 Монетный двор", "mint"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"],
                    ["🗿 Памятник", "monument"]
                ]
                context.country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                context.country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                context.country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                context.country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                context.country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "ℹ Цены на постройки:\n\n"
                request += context.country.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\n1️⃣ Какую постройку вы хотите возвести?\nСейчас в городе " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(Data.cities[city].buildingsScore >= Data.cities[city].maxBuildings && !building.match(/monument|barracks|port|church/))
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!context.country.CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.match(/port|barracks/))
                {
                    for(let i = 0; i < Data.cities.length; i++)
                    {
                        if(Data.cities[i]?.countryID === context.country.id)
                        {
                            for(let j = 0; j < Data.buildings[Data.cities[i].id]?.length; j++)
                            {
                                if(Data.buildings[Data.cities[i].id][j]?.type === "building_of_" + building)
                                {
                                    await context.send(`⚠ В фракции ${context.country.GetName(context.player.platform === "IOS")} уже имеется ${NameLibrary.GetBuildingType("building_of_" + building)}`, {keyboard: keyboard.build(current_keyboard)})
                                    return resolve()
                                }
                            }
                        }
                    }
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите постройку. (от 2 до 35 символов)", current_keyboard, 2, 35)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Введите описание для постройки (нажмите \"Отмена\" чтобы оставить без описания)", current_keyboard, 1)
                await Data.AddCountryResources(context.country.id, Prices["new_" + building])
                await Buildings.create({
                    cityID: city,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "country",
                    level: 1,
                    freezing: false
                })
                if(!building.match(/monument|barracks|port|church/))
                {
                    Data.cities[city].buildingsScore++
                    await City.update({buildingsScore: Data.cities[city].buildingsScore}, {where: {id: city}})
                }
                await Data.ResetBuildings()
                await api.SendMessage(Data.cities[city].leaderID, `ℹ Правитель фракции ${context.country.GetName(context.player.platform === "IOS")} возвел в вашем городе ${NameLibrary.GetBuildingType("building_of_" + building)}`)
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateCountryBuilding", e)
            }
        })
    }

    async GiveToCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "🏢 Постройки:\n\n"
                const buildingButtons = []
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        request += `🌇 Город ${Data.cities[i].name}:\n`
                        if(Data.buildings[Data.cities[i].id])
                        {
                            for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                            {
                                if(Data.buildings[Data.cities[i].id][j].ownerType === "country" && !Data.buildings[Data.cities[i].id][j].type.match(/mint/))
                                {
                                    buildingButtons.push([Data.buildings[Data.cities[i].id][j].GetEmoji() + Data.buildings[Data.cities[i].id][j].name, "ID" + Data.buildings[Data.cities[i].id][j].id])
                                    request += `${NameLibrary.GetBuildingType(Data.buildings[Data.cities[i].id][j].type)} \"${Data.buildings[Data.cities[i].id][j].name}\" ${Data.buildings[Data.cities[i].id][j].level} ур\n`
                                }
                            }
                        }
                        if(!Data.buildings[Data.cities[i].id])
                        {
                            request += "⛺ В городе нет построек"
                        }
                        request += "\n\n"
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В фракции нет государственных построек, которые можно передать городу", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let buildingID = await InputManager.KeyboardBuilder(context, request + "\n\n1️⃣ Выберите постройку, которую вы хотите передать городу", buildingButtons, current_keyboard)
                if(!buildingID) return resolve()
                buildingID = Data.ParseButtonID(buildingID)
                let building = await Buildings.findOne({where: {id: buildingID}})
                const accept = await InputManager.InputBoolean(context, `Передать ${NameLibrary.GetBuildingType(building.dataValues.type)} ${building.dataValues.name} во владение города ${Data.cities[building.dataValues.cityID].name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                building.set({
                    ownerType: "city"
                })
                await building.save()
                Data.buildings[building.dataValues.cityID].filter(key => {return key.id === buildingID})[0].ownerType = "city"
                await context.send("✅ Постройка передана городу.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UpgradeCountryBuilding", e)
            }
        })
    }

    async UpgradeCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город, в котором находится постройка", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                let request = "🏢 Постройки:\n\n"
                const buildingButtons = []
                request += `🌇 Город ${Data.cities[city].name}:\n`
                if(Data.buildings[Data.cities[city].id])
                {
                    for(let j = 0; j < Data.buildings[Data.cities[city].id].length; j++)
                    {
                        if(Data.buildings[Data.cities[city].id][j].ownerType === "country")
                        {
                            buildingButtons.push([Data.buildings[Data.cities[city].id][j].GetEmoji() + Data.buildings[Data.cities[city].id][j].name, "ID" + Data.buildings[Data.cities[city].id][j].id])
                            request += `${NameLibrary.GetBuildingType(Data.buildings[Data.cities[city].id][j].type)} \"${Data.buildings[Data.cities[city].id][j].name}\" ${Data.buildings[Data.cities[city].id][j].level} ур\n`
                        }
                    }
                }
                if(!Data.buildings[Data.cities[city].id])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В фракции нет государственных построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request + "\n\n1️⃣ Выберите постройку для улучшения", buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let j = 0; j < Data.buildings[Data.cities[city].id]?.length; j++)
                {
                    if(Data.buildings[Data.cities[city].id][j].id === building)
                    {
                        building = Data.buildings[Data.cities[city].id][j]
                        break
                    }
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.type.match(/church|monument/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`2️⃣ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.country.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UpgradeCountryBuilding", e)
            }
        })
    }

    async GetCountryOfficials(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = `ℹ Чиновники фракции ${context.country.GetName(context.player.platform === "IOS")}:\n\n`
                let flag = true
                if(Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        flag = true
                        request += `🔸 *id${official}(${Data.officials[context.country.id][official].nick}) может:\n`
                        if(Data.officials[context.country.id][official].canBeDelegate)
                        {
                            flag = false
                            request += "- принимать граждан\n"
                        }
                        if(Data.officials[context.country.id][official].canBuildCity)
                        {
                            flag = false
                            request += "- возводить города\n"
                        }
                        if(Data.officials[context.country.id][official].canUseResources)
                        {
                            flag = false
                            request += "- распоряжаться бюджетом\n"
                        }
                        if(Data.officials[context.country.id][official].canUseArmy)
                        {
                            flag = false
                            request += "- распоряжаться армией\n"
                        }
                        if(Data.officials[context.country.id][official].canAppointOfficial)
                        {
                            flag = false
                            request += "- назначать чиновников\n"
                        }
                        if(Data.officials[context.country.id][official].canAppointMayors)
                        {
                            flag = false
                            request += "- назначать градоначальников\n"
                        }
                        if(flag) request += "ничего не может"
                        request += "\n"
                    }
                }
                else
                {
                    await context.send("⚠ Вы не назначали чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryOfficials", e)
            }
        })
    }

    async SetOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать игроков со статусом ⚙ Работник на должность чиновника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(userStatus?.dataValues.id === context.country.leaderID)
                {
                    await context.send("⚠ Это правитель, правителя невозможно сделать чиновником", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(userStatus?.dataValues.citizenship !== context.country.id)
                {
                    await context.send("⚠ Вы не можете назначить чиновником игрока, не имеющего гражданство вашей фракции", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const offInfo = await OfficialInfo.findOne({where: {id: user.dataValues.id}})
                if(offInfo)
                {
                    await context.send(`⚠ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) уже является чиновником`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await OfficialInfo.create({
                    id: user.dataValues.id,
                    countryID: context.country.id,
                    nick: user.dataValues.nick
                })
                await Player.update({status: "official"}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "official"
                await Data.LoadOfficials()
                await api.SendMessage(user.dataValues.id, `Правитель фракции ${context.country.GetName(context.player.platform === "IOS")} назначил вас чиновником`)
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен чиновником`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SetOfficial", e)
            }
        })
    }

    async ChangeOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                if (Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        officialButtons.push([Data.officials[context.country.id][official].nick, "ID" + official])
                    }
                }
                else
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const request = "ℹ Возможности:\n\n🔸Делегат - может принимать гражданство\n🔸Города - может возводить города\n🔸Ресурсы - может распоряжаться бюджетом\n🔸Чиновники - может назначать других чиновников, но не может выдавать им права\n🔸Градоначальники - может менять глав городов\n🔸Армия - может распоряжаться армией"
                const rulesData = [
                    ["🔸Делегат", "canBeDelegate", official.canBeDelegate],
                    ["🔸Города", "canBuildCity", official.canBuildCity],
                    ["🔸Ресурсы", "canUseResources", official.canUseResources],
                    ["🔸Чиновники", "canAppointOfficial", official.canAppointOfficial],
                    ["🔸Градоначальники", "canAppointMayors", official.canAppointMayors],
                    ["🔸Армия", "canUseArmy", official.canUseArmy]
                ]
                const rules = await InputManager.RadioKeyboardBuilder(context, request, rulesData, current_keyboard)
                if(!rules) return resolve()
                let newRules = {}
                for(let i = 0; i < rules.length; i++)
                {
                    newRules[rules[i][0]] = rules[i][1]
                    official[rules[i][0]] = rules[i][1]
                }
                await OfficialInfo.update(newRules, {where: {id: official.id}})
                await api.SendMessage(official.id, `ℹ Ваши права как чиновника изменены, теперь вы:\n\n🔸Можете принимать гражданство - ${newRules.canBeDelegate?"Да":"Нет"}\n🔸Можете возводить города - ${newRules.canBuildCity?"Да":"Нет"}\n🔸Может распоряжаться бюджетом - ${newRules.canUseResources?"Да":"Нет"}\n🔸Может назначать других чиновников - ${newRules.canAppointOfficial?"Да":"Нет"}\n🔸Может менять глав городов - ${newRules.canAppointMayors?"Да":"Нет"}\n🔸Может распоряжаться армией - ${newRules.canUseArmy?"Да":"Нет"}`)
                await context.send("✅ Права чиновника изменены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeOfficial", e)
            }
        })
    }

    async TakeAwayOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                if(Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        officialButtons.push([Data.officials[context.country.id][official].nick, "ID" + official])
                    }
                }
                else
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const accept = await InputManager.InputBoolean(context, `❓ Вы действительно хотите забрать права чиновника у игрока *id${official.id}(${official.nick})?`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await OfficialInfo.destroy({where: {id: official.id}})
                const user = await Player.findOne({where: {id: official.id}})
                if(user.dataValues.status !== "worker")
                {
                    user.set({status: "citizen"})
                    await user.save()
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "citizen"
                }
                await api.SendMessage(official.id, `⚠ Правитель фракции ${context.country.GetName(context.player.platform === "IOS")} забрал у вас права чиновника.`)
                await Data.LoadOfficials()
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) лишен статуса чиновника`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/TakeAwayOfficial", e)
            }
        })
    }

    async TakeAwayCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                const status = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(status.dataValues.citizenship !== context.country.id)
                {
                    await context.send(`⚠ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) не является гражданином фракции ${context.country.GetName(context.player.platform === "IOS")}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.id === context.country.leaderID)
                {
                    await context.send(`🚫 Невозможно забрать гражданство у правителя`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.status?.match(/official|leader/))
                {
                    await context.send(`⚠ Перед тем как забрать гражданство у игрока необходимо сместить его с должности чиновника`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `❓ Лишить игрока *id${user.dataValues.id}(${user.dataValues.nick}) гражданства фракции ${context.country.GetName(context.player.platform === "IOS")}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                status.set({citizenship: null})
                await status.save()
                if(user.dataValues.status !== "worker")
                {
                    await Player.update({status: "stateless"}, {where: {id: user.dataValues.id}})
                    if(Data.users[user.dataValues.id])
                    {
                        Data.users[user.dataValues.id].status = "stateless"
                    }
                }
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].citizenship = null
                }
                await api.SendMessage(user.dataValues.id, `⚠ Правительство фракции ${context.country.GetName(context.player.platform === "IOS")} лишило вас гражданства`)
                await context.send("✅ Игрок лишен гражданства", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/TakeAwayCitizenship", e)
            }
        })
    }

    async TransferPower(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {

                let user = await InputManager.InputUser(context, "Выберите приемника (у него должно быть гражданство фракции)", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать игроков со статусом ⚙ Работник на должность чиновника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(userStatus?.dataValues.citizenship !== context.country.id)
                {
                    await context.send("⚠ Вы не можете передать власть игроку, не имеющему гражданство вашей фракции", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const kb = [
                    ["💼 Чиновник", "official"],
                    ["💳 Гражданин", "citizen"],
                ]
                const giveState = (status) => {
                    if(status === "official") return "💼 Чиновником"
                    if(status === "citizen") return "💳 Гражданином"
                }
                let state = await InputManager.KeyboardBuilder(context, "Выберите, кем вы станете после оставления трона", kb, current_keyboard)
                if(!state) return resolve()
                let access = await InputManager.InputBoolean(context, `Назначить *id${user.dataValues.id}(${user.dataValues.nick}) новым правителем фракции ${context.country.GetName(context.player.platform === "IOS")}?`, current_keyboard)
                if(!access) return resolve()
                access = await InputManager.InputBoolean(context, `Вы будете назначены ${giveState(state)}`, current_keyboard)
                if(!access) return resolve()
                access = await InputManager.InputBoolean(context, `Спрашиваю последний раз - Вы уверены?`, current_keyboard)
                if(!access) return resolve()
                if(state === "official")
                {
                    await OfficialInfo.findOrCreate({
                        where: {id: context.player.id},
                        defaults: {id: context.player.id, nick: context.player.nick, countryID: context.country.id}
                    })
                }
                await Player.update({status: state}, {where: {id: context.player.id}})
                await Player.update({status: "leader"}, {where: {id: user.dataValues.id}})
                await OfficialInfo.destroy({where: {id: user.dataValues.id}})
                context.country.leaderID = user.dataValues.id
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "leader"
                await Country.update({leaderID: user.dataValues.id}, {where: {id: context.country.id}})
                await api.SendMessage(user.dataValues.id, `👑 Правитель фракции ${context.country.GetName(context.player.platform === "IOS")} передал вам власть, ваш статус изменен на "👑 Правитель"`)
                await context.send(`Власть передана, вы стали ${giveState(state)}`, {keyboard: keyboard.build(scenes.GetMenuKeyboard(context))})
                context.player.state = scenes.MenuScene
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/TakeAwayCitizenship", e)
            }
        })
    }

    async OfferMarry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.isMarried)
                {
                    await context.send("⚠ Вы уже помолвлены", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите сделать предложение?", current_keyboard)
                if(!user) return resolve()
                const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}})
                if(userInfo.dataValues.marriedID !== null)
                {
                    await context.send(`⚠ ${await NameLibrary.GetPlayerNick(user.dataValues.id)} уже состоит в браке!`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender && !context.player.nationality.match(/грек/i))
                {
                    await context.send("✝ Мы такое не одобряем.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const text = await InputManager.InputString(context, "2️⃣ Напишите текст предложения.", current_keyboard)
                if (!text) return resolve()

                const accept = await InputManager.InputBoolean(context, `ℹ Текст предложения:\n${text}\n\nСделать предложение вступления в брак игроку *id${user.dataValues.id}(${user.dataValues.nick})?\n\nℹ Если игрок согласится, то у вас будет заключен брак.`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: user.dataValues.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `💌 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение руки и сердца с текстом:\n${text}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "merry", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_merry", item: context.player.id})]]).inline().oneTime()
                })
                Data.users[context.player.id].isMarried = true
                await context.send("✅ Предложение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/OfferMarry", e)
            }
        })
    }

    async Divorce(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(!context.player.marriedID)
                {
                    await context.send("⚠ Вы не состоите в браке.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `❓ Вы хотите расторгнуть брак с игроком ${await NameLibrary.GetPlayerNick(context.player.marriedID)}?\nℹ Если игрок тоже согласится на это, то ваш брак будет расторгнут.`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
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
                await api.SendMessage(player.dataValues.id, `💔 Больше *${context.player.GetName()} не ваш${context.player.gender ? " муж" : "а жена"}`)
                await context.send(`💔 *id${player.dataValues.id}(${player.dataValues.nick}) больше не ваш${player.dataValues.gender ? " муж" : "а жена"}`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Divorce", e)
            }
        })
    }

    async GetCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
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
                if(context.player.status.match(/official|leader/))
                {
                    await context.send("⚠ Правители и чиновники не могут менять гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.timeouts["get_citizenship_" + context.player.id])
                {
                    await context.send("⚠ Вы уже подали на гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.citizenship !== null)
                {
                    const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\".`, current_keyboard)
                    if(!firstAccept) return resolve()
                }
                country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию, гражданином которой хотите стать", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                if(country === context.player.citizenship)
                {
                    await context.send("⚠ Вы уже являетесь гражданином этой страны.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await CrossStates.GetCitizenship(context.player.id, country)
                await context.send("✅ Заявка отправлена.\n\n ℹ Правитель или чиновники в течении 24 часов рассмотрят вашу кандидатуру и примут решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCitizenship", e)
            }
        })
    }

    async RefuseCitizenship(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.status.match(/official|leader/))
                {
                    await context.send("⚠ Правители и чиновники не могут отказаться от гражданства", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\" и пропадет прописка, ваше имущество останется у вас.`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "❓ Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await CrossStates.RefuseCitizenship(context.player.id)
                await context.send("ℹ Теперь вы апатрид.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RefuseCitizenship", e)
            }
        })
    }

    async GetRegistration(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.timeouts["get_registration_" + context.player.id])
                {
                    await context.send("⚠ Вы уже подали заявку", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: Data.cities[context.player.location].leaderID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `🪪 Игрок *id${context.player.id}(${context.player.nick}) подал заявку на прописку в вашем городе\n\n${context.player.GetInfo()}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_registration", item: context.player.id, parameter: context.player.location}), keyboard.declineCallbackButton({command: "decline_registration", item: context.player.id, parameter: context.player.location})]]).inline().oneTime()
                })
                const cityID = context.player.location
                let time = new Date()
                time.setHours(time.getHours() + 24)
                Data.timeouts["get_registration_" + context.player.id] = {
                    type: "user_timeout",
                    subtype: "get_registration",
                    userId: context.player.id,
                    time: time,
                    cityID: cityID,
                    timeout: setTimeout(async () => {
                        await api.SendMessage(context.player.id, `ℹ Вы подали заявку на получение регистрации в городе ${Data.cities[cityID].name}, но прошло уже 24 часа, и никто её не принял, поэтому она аннулируется.`)
                        delete Data.timeouts["get_registration_" + context.player.id]
                    }, 86400000)
                }
                await context.send("✅ Заявка отправлена.\n\nℹ Глава города в течении 24 часов рассмотрит вашу кандидатуру и примет решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetRegistration", e)
            }
        })
    }

    async RefuseRegistration(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от прописки в городе ${Data.GetCityName(context.player.registration)}?`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "❓ Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await PlayerInfo.update({registration: null},{where: {id: context.player.id}})
                context.player.registration = null
                context.send("ℹ Теперь вы без прописки.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RefuseRegistration", e)
            }
        })
    }

    async Transaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"]
                ]
                if(context.player.location === Data.countries[context.player.countryID].capitalID) kb.push(["🔀 Фракции", "country"])
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.UserToUserTransaction(context, current_keyboard)
                action === "city" && await this.UserToCityTransaction(context, current_keyboard)
                action === "country" && await this.UserToCountryTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Transaction", e)
            }
        })
    }

    async UserToCountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${context.player.GetResources()}\n\n2️⃣ Выберите какой ресурс вы хотите перевести в бюджет фракции ${Data.countries[context.player.countryID].GetName(context.player.platform === "IOS")}:`, resources)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: фракция ${Data.countries[context.player.countryID].GetName(context.player.platform === "IOS")}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.player.countryID, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(Data.countries[context.player.countryID].leaderID, `✅ В бюджет фракции ${Data.countries[context.player.countryID].GetName(context.player.platform === "IOS")} поступил перевод:\n\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UserToCountryTransaction", e)
            }
        })
    }

    async UserToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${context.player.GetResources()}\n\n2️⃣ Выберите какой ресурс вы хотите перевести городу ${Data.cities[context.player.location].name}:`, resources)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: город ${Data.cities[context.player.location].name}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.player.location, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(Data.cities[context.player.location].leaderID, `✅ В бюджет города ${Data.cities[context.player.location].name} поступил перевод:\n\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UserToCityTransaction", e)
            }
        })
    }

    async UserToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "2️⃣ Кому вы хотите перевести ресурс?", current_keyboard)
                if(!user) return resolve()
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
                if(user.dataValues.id === context.player.id)
                {
                    context.send("🚫 Какой смысл переводить самому себе?", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(context.player.GetResources())
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `3️⃣ Выберите какой ресурс вы хотите перевести игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `4️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `5️⃣ Подтвердите перевод:\n\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                const {outTax, inTax} = await getTax(user.dataValues.id)
                if(outTax === 100 || inTax === 100)
                {
                    await context.send("⚠ Установлен 100% налог, нет смысла передавать ресурсы")
                    return
                }
                if(outTax === 0 || inTax === 0)
                {
                    await Data.AddPlayerResources(user.dataValues.id, objOUT)
                    await Data.AddPlayerResources(context.player.id, objIN)
                    await api.SendNotification(user.dataValues.id, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(objIN)}`)
                    await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
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
                    let kb = [[], []]
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
                    kb[0].push(keyboard.secondaryCallbackButton({label: "💰 Уклониться", payload: {
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
                    kb[0].push(keyboard.negativeCallbackButton({label: "🚫 Отменить", payload: {
                            command: "hide_message"
                        }}))
                    await context.send("ℹ Подтвердите оплату налога", {keyboard: keyboard.build(current_keyboard)})
                    await api.api.messages.send({
                        user_id: context.player.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `ℹ Для совершения перевода игроку *id${user.dataValues.id}(${user.dataValues.nick}) необходимо уплатить налоги в размере ${inTax}% и ${outTax}%\n\nПеревод в размере:\n${NameLibrary.GetPrice(objIN)}\n\nПосле уплаты налога останется:\n${NameLibrary.GetPrice(NameLibrary.AfterPayTax(NameLibrary.AfterPayTax(objIN, inTax), outTax))}\n\n${canRefund ? "ℹ Также вы можете взять на себя компенсацию налога, но тогда сумма перевода будет составлять:\n" + NameLibrary.GetPrice(refundTax) : ""}`,
                        keyboard: keyboard.build(kb).inline()
                    })
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UserToUserTransaction", e)
            }
        })
    }

    async GoToOtherCity(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                let time = new Date()
                if(context.player.stayInCityTime - time > 0)
                {
                    await context.send(`⚠ Вы сильно устали после предыдущей дороги, отдохните и можно опять в путь.\n\nДо восстановления сил ${NameLibrary.ParseFutureTime(context.player.stayInCityTime)}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.player.location].isSiege && context.player.status !== "worker")
                {
                    await context.send("🚫 Город находится под осадой", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].isSiege && context.player.status !== "worker")
                {
                    await context.send("🚫 В фракции введено военное положение, перемещение между городами невозможно", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].roadMap)
                {
                    await context.send(`ℹ Карта фракции ${Data.countries[context.player.countryID].GetName(context.player.platform === "IOS")}`, {attachment: Data.countries[context.player.countryID].roadMap})
                }
                const cityButtons = []
                const roads = await CityRoads.findAll({where: {fromID: context.player.location}, attributes: ["toID", "isBlocked", "time"]})
                if(context.player.status === "worker")
                {
                    const cities = Data.GetCountryCities(context.player.countryID)
                    for(const city of cities)
                    {
                        if(city.id !== context.player.location)
                        {
                            cityButtons.push([city.name, "ID" + city.id])
                        }
                    }
                }
                else
                {
                    for(const road of roads)
                    {
                        cityButtons.push([Data.cities[road.dataValues.toID].name, "ID" + road.dataValues.toID])
                    }
                }
                if(cityButtons.length === 0)
                {
                    await context.send("ℹ Вы находитесь в единственном городе фракции " + Data.GetCountryName(Data.GetCountryForCity(context.player.location).id))
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите в какой город вы хотите отправиться", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                let road = {time: 0}
                roads.forEach(key => {if(key.dataValues.toID === city.id) road = key.dataValues})
                if(road?.isBlocked)
                {
                    await context.send("ℹ В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(city.isSiege && context.player.status !== "worker")
                {
                    await context.send("ℹ В данный момент город, в который вы хотите отправиться находится в осаде, въезд в него не возможен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `2️⃣ Перемещение в другой город займет ${road?.time ? road?.time : 0} минут, на это время вы будете заморожены.\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город " + city.name + "\n" + city.description, {attachment: city.photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                    context.player.location = city.id
                    await PlayerStatus.update(
                        {location: city.id},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    time.setMinutes(time.getMinutes() + parseInt(road.time))
                    context.player.lastActionTime = time
                    context.player.state = scenes.moving
                    await context.send("ℹ Вы отправились в город " + city.name, {keyboard: keyboard.none})
                    Data.timeouts["user_timeout_walk_" + context.player.id] = {
                        type: "user_timeout",
                        subtype: "walk",
                        userId: context.player.id,
                        cityID: city.id,
                        time: time,
                        timeout: setTimeout(async () => {
                            await context.send("🏙 Вы пришли в город " + city.name + "\n" + city.description, {attachment: city.photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
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
                            context.player.state = scenes.finish
                            delete Data.timeouts["user_timeout_walk_" + context.player.id]
                        }, road.time * 60000)
                    }
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GoToOtherCity", e)
            }
        })
    }

    async GoToOtherCountry(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const time = new Date()
                if(context.player.stayInCityTime - time > 0)
                {
                    await context.send(`⚠ Вы сильно устали после предыдущей дороги, отдохните и можно опять в путь.\n\nДо восстановления сил ${NameLibrary.ParseFutureTime(context.player.stayInCityTime)}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.player.location].isSiege)
                {
                    await context.send("🚫 Город находится под осадой", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].isSiege)
                {
                    await context.send("🚫 В фракции введено военное положение, выезд запрещен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send("ℹ Карта дорог:", {attachment: Data.variables.roadMap})
                const playerPlace = Data.GetCountryForCity(context.player.location).id
                const roads = await CountryRoads.findAll({where: {fromID: playerPlace}})
                const countryButtons = []
                if(context.player.status === "worker")
                {
                    for(let i = 0; i < Data.countries?.length; i++)
                    {
                        if(Data.countries[i]?.id !== context.player.countryID && Data.countries[i])
                        {
                            countryButtons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                        }
                    }
                }
                else
                {
                    for(let i = 0; i < roads.length; i++)
                    {
                        countryButtons.push([Data.countries[roads[i].dataValues.toID].name, "ID" + roads[i].dataValues.toID])
                    }
                }
                if(countryButtons.length === 0)
                {
                    await context.send("ℹ Для того чтобы уехать из фракции нужна дорога, но из фракции, в которой вы находитесь, не ведет ни одна дорога.\nВсе вопросы о дорогах к Гейм-Мастерам")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите в какую фракцию вы хотите отправиться", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                let road = null
                roads.forEach(key => {if(key.dataValues.toID === country) road = key.dataValues})
                if(road?.isBlocked)
                {
                    await context.send("⚠ В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[country].isSiege)
                {
                    await context.send("⚠ В данный момент фракция, в которую вы хотите отправиться находится под блокадой, въезд в нее не возможен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let accept
                if (Data.countries[country].entranceFee !== 0 && context.player.status !== "worker")
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road.time} минут, на это время вы будете заморожены.\nУ фракции ${Data.GetCountryName(country)} есть входная пошлина в размере ${Data.countries[country].entranceFee} монет\nПродолжить?`, current_keyboard)
                    if(context.player.money - Data.countries[country].entranceFee < 0)
                    {
                        await context.send("⚠ У вас не хватает средств для оплаты входной пошлины", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                }
                else
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road?.time ? road?.time : 0} минут, на это время вы будете заморожены, а повернуть назад невозможно.\nПродолжить?`, current_keyboard)
                }
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const fee = Data.countries[country].entranceFee
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город " + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description, {attachment: Data.countries[country].welcomePhotoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                    context.player.location = Data.countries[country].capitalID
                    context.player.countryID = Data.countries[country].id
                    await PlayerStatus.update(
                        {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    time.setMinutes(time.getMinutes() + parseInt(road.time))
                    context.player.lastActionTime = time
                    context.player.state = scenes.moving
                    await context.send("ℹ Вы отправились в фракцию " + Data.countries[country].GetName(context.player.platform === "IOS"), {keyboard: keyboard.none})
                    Data.timeouts["user_timeout_walk_" + context.player.id] = {
                        type: "user_timeout",
                        subtype: "walk",
                        userId: context.player.id,
                        cityID: Data.countries[country].capitalID,
                        time: time,
                        timeout: setTimeout(async () => {
                            await context.send("🏙 Вы пришли в город " + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description, {attachment: Data.countries[country].welcomePhotoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                            context.player.location = Data.countries[country].capitalID
                            context.player.countryID = Data.countries[country].id
                            if (fee !== 0)
                            {
                                await Data.AddPlayerResources(context.player.id, {money: -fee})
                                await Data.AddCountryResources(country, {money: fee})
                            }
                            await PlayerStatus.update(
                                {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                                {where: {id: context.player.id}}
                            )
                            if(Data.countries[country].notifications)
                            {
                                await api.SendMessage(Data.countries[country].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в вашу фракцию ${Data.countries[country].name}`)
                            }
                            if(Data.cities[Data.countries[country].capitalID].notifications)
                            {
                                await api.SendMessage(Data.cities[Data.countries[country].capitalID].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${Data.cities[Data.countries[country].capitalID].name}`)
                            }
                            let stayTime = new Date()
                            stayTime.setMinutes(stayTime.getMinutes() + 30)
                            context.player.stayInCityTime = stayTime
                            context.player.state = scenes.finish
                            delete Data.timeouts["user_timeout_walk_" + context.player.id]
                        }, road.time * 60000)
                    }
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GoToOtherCountry", e)
            }
        })
    }

    async GiveKey(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                const keysButton = []
                if(keys.length === 0)
                {
                    await context.send("⚠ У вас нет ключей", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите отдать этот ключ?", current_keyboard)
                if(!user) return resolve()
                for(let i = 0; i < keys.length; i++)
                {
                    keysButton.push([keys[i].dataValues.name, "ID" + keys[i].dataValues.id])
                }
                let key = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите ключ, который вы хотите передать", keysButton, current_keyboard)
                if(!key) return resolve()
                key = Data.ParseButtonID(key)
                await Keys.update({ownerID: user.dataValues.id}, {where: {id: key}})
                await context.send("✅ Ключ отдан.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GiveKey", e)
            }
        })
    }

    async CopyKey(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                const keysButton = []
                if(keys.length === 0)
                {
                    await context.send("⚠ У вас нет ключей", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < keys.length; i++)
                {
                    keysButton.push([keys[i].dataValues.name, "ID" + keys[i].dataValues.id])
                }
                let key = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите ключ, дубликат которого вы хотите сделать.\n\n" + context.player.GetResources() + "\n\nСтоимость:\n" + NameLibrary.GetPrice(Prices["copy_key"]), keysButton, current_keyboard)
                if(!key) return resolve()
                if (!context.player.CanPay(Prices["copy_key"]))
                {
                    await context.send("⚠ У вас не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id, Prices["copy_key"])
                key = Data.ParseButtonID(key)
                keys.forEach((i) => {if(parseInt(i.dataValues.id)  === parseInt(key)) key = i.dataValues})
                await Keys.create({
                    houseID: key.houseID,
                    ownerID: key.ownerID,
                    name: key.name.includes("-дубликат") ? key.name : key.name + "-дубликат"
                })
                await context.send("✅ Ключ продублирован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CopyKey", e)
            }
        })
    }
    async GetAllProperty(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id}})
                let request = "ℹ *id"+ context.player.id +"(Ваши) постройки:\n"
                for(let i = 0; i < buildings.length; i++)
                {
                    request += (i+1) +
                        ": " +
                        NameLibrary.GetBuildingType(buildings[i].dataValues.type) +
                        " \"" +
                        buildings[i].dataValues.name +
                        "\" " +
                        buildings[i].dataValues.level +
                        " ур, г. " +
                        Data.GetCityName(buildings[i].dataValues.cityID) +
                        "\n"
                }
                if(buildings.length === 0)
                {
                    request += "⛺ У вас нет построек\n"
                }

                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                request += "\nℹ *id"+ context.player.id +"(Ваши) ключи:\n"
                for(let i = 0; i < keys.length; i++)
                {
                    request += "🔸 " + keys[i].dataValues.name + "\n"
                }
                if(keys.length === 0)
                {
                    request += "📎 У вас нет ключей"
                }

                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetAllProperty", e)
            }
        })
    }

    async NewUserBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const country = Data.GetCountryForCity(context.player.location)
                if(parseInt(context.player.citizenship) !== country.id)
                {
                    await context.send("⚠ Вы не являетесь гражданином фракции " + Data.GetCountryName(country.id), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buildingButtons = [
                    ["🏠 Жилой дом", "house"],
                    ["🏦 Банк", "bank"]
                ]
                country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += context.player.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\n1️⃣ Какую постройку вы хотите возвести?\n\n⚠ Любая постройка кроме жилого дома занимает полезное место в городе, поэтому для строительства вам надо получить разрешение от главы города.\n\n⚠ Если вы прописаны в этом городе, то можно не получать разрешение на строительство от главы города.", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(!context.player.CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.player.location].buildingsScore >= Data.cities[context.player.location].maxBuildings && building !== "house")
                {
                    await context.send("⚠ В городе не осталось мест для строительства нового здания.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите свою постройку. (от 2 до 35 символов)", current_keyboard, 2, 35)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Сделайте описание постройки. (чтобы пропустить - нажмите \"отмена\")", current_keyboard, 2, 100)
                await Data.AddPlayerResources(context.player.id, Prices["new_" + building])
                const build = await Buildings.create({
                    cityID: context.player.location,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: context.player.id,
                    ownerType: "user",
                    level: 1,
                    freezing: (parseInt(context.player.location) !== parseInt(context.player.registration)) && building === "house"
                })
                if(parseInt(context.player.location) === parseInt(context.player.registration) && building === "house")
                {
                    await Data.ResetBuildings()
                    await Keys.create({
                        houseID: build.dataValues.id,
                        ownerID: context.player.id,
                        name: "🔑 " + build.dataValues.name
                    })
                    await context.send("✅ Постройка возведена. Вам выдан ключ от нее.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                else
                {
                    if(!context.player.waitingAllowBuilding) context.player.waitingAllowBuilding = []
                    context.player.waitingAllowBuilding.push([
                        build.dataValues.id,
                        setTimeout(async () =>
                        {
                            const price = NameLibrary.ReversePrice(Prices["new_" + building])
                            await Data.AddPlayerResources(context.player.id, price)
                            await Buildings.destroy({where: {id: build.dataValues.id}})
                            await context.send(`⚠ Время ожидания одобрения строительства постройки \"${NameLibrary.GetBuildingType(build.dataValues.type)}\" вышло, ресурсы возвращены.`)
                            let length = 0
                            for(let i = 0; i < context.player.waitingAllowBuilding?.length; i++)
                            {
                                if(context.player.waitingAllowBuilding[i])
                                {
                                    length ++
                                }
                            }
                            if(length === 0)
                            {
                                context.player.waitingAllowBuilding = null
                            }
                        }, 86400000)
                    ])
                    await api.api.messages.send({
                        user_id: Data.GetCity(context.player.location).leaderID,
                        random_id: Math.round(Math.random() * 100000),
                        message: `Игрок ${context.player.GetName()} хочет построить ${NameLibrary.GetBuildingType(build.dataValues.type)}.\n\n${context.player.GetInfo()}\n\n Разрешить строительство?`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "allow_user_building", item: context.player.id, parameter: build.dataValues.id}), keyboard.declineCallbackButton({command: "decline_user_building", item: context.player.id, parameter: build.dataValues.id})]]).inline().oneTime()
                    })
                    await context.send("✅ Заявка на возведение постройки подана, ресурсы зарезервированы", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/NewUserBuilding", e)
            }
        })
    }

    async UpgradeUserBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id, freezing: false}})
                if(buildings.length === 0)
                {
                    await context.send("⚠ У вас нет построек.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Ваши постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < buildings.length; i++)
                {
                    if(!buildings[i].dataValues.type.match(/house/))
                    {
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(buildings[i].dataValues.type) + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                        request += `${NameLibrary.GetBuildingType(buildings[i].dataValues.type)} \"${buildings[i].dataValues.name}\" ${buildings[i].dataValues.level} уровня\n`
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⚠ У вас нет построек, которые можно улучшить.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()

                building = Data.ParseButtonID(building)
                buildings.forEach(key => {if(parseInt(key.dataValues.id) === parseInt(building)) building = key.dataValues})
                if(building.type.match(/house/))
                {
                    await context.send(`⚠ Жилые дома не имеют уровней улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`ℹ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.player.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id ,Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                for(let i = 0; i < Data.buildings[building.cityID]?.length; i++)
                {
                    if(Data.buildings[building.cityID][i].id === building.id)
                    {
                        Data.buildings[building.cityID][i].Upgrade(building.level + 1)
                        break
                    }
                }
                await context.send(`✅ Постройка улучшена до ${building.level + 1} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/UpgradeUserBuilding", e)
            }
        })
    }

    async EnterBuilding(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                let request = "ℹ Постройки в городе " + Data.GetCityName(context.player.location) + " :\n"
                const buildingButtons = []
                if(!Data.buildings[context.player.location])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.player.location].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.player.location][i].type) + " \"" + Data.buildings[context.player.location][i].name + "\" " + Data.buildings[context.player.location][i].level + " уровня\n"
                    if(Data.buildings[context.player.location][i].type.match(/mint/))
                    {
                        if(context.player.id === Data.countries[context.player.countryID].leaderID)
                        {
                            if(context.player.id === Data.countries[context.player.countryID].leaderID)
                            {

                                    buildingButtons.push([Data.buildings[context.player.location][i].GetEmoji() + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                                    continue
                            }
                        }
                        if(Data.officials[context.player.countryID])
                        {
                            if(Data.officials[context.player.countryID][context.player.id]?.canUseResources)
                            {
                                buildingButtons.push([Data.buildings[context.player.location][i].GetEmoji() + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                                continue
                            }
                        }
                    }
                    for(let j = 0; j < keys.length; j++)
                    {
                        if(keys[j].dataValues.houseID === Data.buildings[context.player.location][i].id)
                        {
                            buildingButtons.push([Data.buildings[context.player.location][i].GetEmoji() + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                            break
                        }
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send(request + "🏘 В городе нет построек, которые вы можете посетить.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request + "\nℹ Выберите, куда вы хотите зайти.", buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.buildings[context.player.location].length; i++)
                {
                    if(parseInt(Data.buildings[context.player.location][i].id) === parseInt(building))
                    {
                        context.player.inBuild = Data.buildings[context.player.location][i]
                        context.player.state = scenes.build
                        context.send("Вы зашли в " + NameLibrary.GetBuildingType(context.player.inBuild.type) + " \"" + context.player.inBuild.name + "\"", {keyboard: keyboard.build(scenes.buildKeyboard(context))})
                    }
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/EnterBuilding", e)
            }
        })
    }

    async GetResourcesFormBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const time = new Date()
                if(context.player.inBuild.lastActivityTime - time > 0)
                {
                    await context.send("👀 Ресурсы еще не добыты, приходите через " + NameLibrary.ParseFutureTime(context.player.inBuild.lastActivityTime), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                time.setHours(time.getHours() + 6)
                const country = Data.GetCountryForCity(context.player.inBuild.cityID)
                const resource = context.player.inBuild.type.replace("building_of_", "")
                let playerBalance = {}
                let cityBalance = {}
                let extraction = context.player.inBuild.GetExtraction()
                const extractionTax = parseInt(context.player.citizenship) === parseInt(country.id) ? country.citizenTax : country.nonCitizenTax
                const tax = Math.round(extraction * (extractionTax * 0.01))
                extraction -= tax
                playerBalance[resource] = extraction
                cityBalance[resource] = tax
                await Data.AddPlayerResources(context.player.id, playerBalance)
                await Data.AddCityResources(context.player.location, cityBalance)
                context.player.inBuild.lastActivityTime = time
                await context.send("ℹ Собрано: " + NameLibrary.GetPrice(NameLibrary.ReversePrice(playerBalance)) + "\nНалог составил: " + NameLibrary.GetPrice(cityBalance) + "(" + extractionTax + "%)", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetResourcesFormBuilding", e)
            }
        })
    }

    async FillingOutTheRoad(context, current_keyboard, inputData, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const road = await CityRoads.findOne({where: {id: inputData.roadFromID}})
                if(road?.dataValues.isBlocked)
                {
                    let time = await InputManager.InputInteger(context, "1️⃣ Введите в минутах время перемещения по дороге. (Требуется ввести целое значение)", current_keyboard, 1)
                    if(time === null) return resolve(false)
                    await CityRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadFromID}})
                    await CityRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadToID}})
                    await context.send("✅ Принято, спасибо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
                else
                {
                    await context.send("⚠ Кто-то из ГМ-ов уже заполнил данные вместо вас, спасибо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/FillingOutTheRoad", e)
            }
        })
    }

    async SQLSession(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Вы введены в режим SQL-терминала\n\nℹ Введите SQL-запрос, если вы не знаете что это такое, то лучше это не трогать."
                let query = null
                do
                {
                    try
                    {
                        query = await InputManager.InputString(context, request, current_keyboard)
                        if(!query) break
                        query = await sequelize.query(query)
                        if(query[0]) request = JSON.stringify(query[0], null, "\t")
                        else request = "🚫 Не обработанная ошибка"
                    }
                    catch (e)
                    {
                        await context.send("🚫 Ошибка: " + e.message)
                        request = "ℹ Введите запрос повторно"
                    }
                }
                while(query)
                await context.send("ℹ Сеанс завершен.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SQLSession", e)
            }
        })
    }

    async SendLog(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const log = await InputManager.InputString(context, "1️⃣ Введите название файла", current_keyboard)
                if(!log) return resolve()
                try
                {
                    const file = await api.upload.messageDocument({
                        peer_id: context.player.id,
                        source: {
                            value: "./logs/" + log
                        },
                        title: log
                    })
                    await context.send("✅ Лови:", {attachment: file, keyboard: keyboard.build(current_keyboard)})
                }
                catch (e)
                {
                    await context.send("⚠ Файл не найден", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SendLog", e)
            }
        })
    }

    async SendLogList(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const logs = fs.readdirSync("./logs/")
                let request = "ℹ Список логов:\n\n"
                logs.forEach(key => {
                    request += "🔸 " + key + "\n"
                })
                if(logs.length === 0) request += "⭕ Пусто"
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SendLogList", e)
            }
        })
    }

    async ClearLogs(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                fs.readdir("./logs/", (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlink(path.join("./logs/", file), (err) => {
                            if (err) throw err
                        })
                    }
                })
                await context.send("✅ Логи очищены.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ClearLogs", e)
            }
        })
    }

    async ChangeMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["🗺 Карта мира", "global_map"],
                    ["🌐 Карта дорог", "road_map"],
                    ["🗾 Карта фракции", "country_map"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите тип карты, которую вы хотите поменять", kb, current_keyboard)
                if(!action) return resolve()

                action === "global_map" && await this.ChangeGlobalMap(context, current_keyboard)
                action === "road_map" && await this.ChangeRoadMap(context, current_keyboard)
                action === "country_map" && await this.ChangeCountryMap(context, current_keyboard)

                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeGlobalMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const newMap = await InputManager.InputPhoto(context, "2️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                Data.variables.globalMap = newMap
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeRoadMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const newMap = await InputManager.InputPhoto(context, "2️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                Data.variables.roadMap = newMap
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeCountryMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const newMap = await InputManager.InputPhoto(context, "3️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                country.map = newMap
                await Country.update({map: newMap}, {where: {id: country.id}})
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async AddMessage(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const text = await InputManager.InputString(context, "1️⃣ Введите текст сообщения, это сообщение смогут видеть все игроки по нажатию кнопки \"Сообщения\" в меню", current_keyboard, 1)
                if(!text) return resolve()
                const isNoisy = await InputManager.InputBoolean(context, "2️⃣ Отправить уведомление о новом сообщении?\n\n🔸 Да - Всем подписанным на уведомления игрокам придет оповещение о новом сообщении\n🔸 Нет - Сообщение отправится без уведомления подписанных игроков, посмотреть его можно будет только через меню сообщений", current_keyboard)
                const accept = await InputManager.InputBoolean(context, `3️⃣ Проверьте сообщение:\n\nТекст:\n${text}\nТихое сообщение: ${isNoisy ? "Нет" : "Да"}`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Messages.create({
                    text: text,
                    isSilent: !isNoisy
                })
                if(isNoisy)
                {
                    const subscribedUsers = await PlayerStatus.findAll({where: {notifications: true}, attributes: ["id"]})
                    await context.send("✅ Начинаю отправку, время отправки зависит от количества игроков")
                    for(const user of subscribedUsers)
                    {
                        await api.SendNotification(user.dataValues.id, "⚡⚡⚡ Новое объявление!\n\n" + text + "\n\nℹПри желании вы можете отписаться от рассылки в Меню>>Параметры>>Отключить уведомления")
                    }
                }
                await context.send("✅ Сообщение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddMessage", e)
            }
        })
    }

    async RoadControls(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Новая гос дорога", "create_country_road"],
                    ["⏳ Изменить гос дорогу", "edit_country_road"],
                    ["🚳 Удалить гос дорогу", "delete_country_road"],
                    ["⏳ Изменить гор дорогу", "edit_city_road"],
                    ["🚳 Удалить гор дорогу", "delete_city_road"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "create_country_road" && await this.CreateRoad(context, current_keyboard)
                action === "edit_country_road" && await this.ChangeTheRoad(context, current_keyboard)
                action === "delete_country_road" && await this.DeleteRoad(context, current_keyboard)
                action === "edit_city_road" && await this.ChangeCityRoad(context, current_keyboard)
                action === "delete_city_road" && await this.DeleteCityRoad(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeTheRoad", e)
            }
        })
    }

    async DeleteCityRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const roads = await CityRoads.findAll({where: {fromID: Data.cities.filter(city => {return city.countryID === country.id}).map(city => {return city.id})}})
                let request = "ℹ ID городов:\n\n"
                const roadButtons = []
                Data.cities.filter(city => {return city.countryID === country.id}).forEach(city => {request += "🔸 " + city.name + "  -  " + city.id + "\n"})
                request += "\nℹ Дороги удаляются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ В фракции ${country.GetName(context.player.platform === "IOS")} нет междугородних дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputBoolean(context, `❓ Вы действительно хотите удалить дорогу соединяющую города ${Data.cities[road.dataValues.fromID].name} и ${Data.cities[road.dataValues.toID].name}?`, current_keyboard, 0)
                if(!time) return resolve()
                await CityRoads.destroy({where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CityRoads.destroy({where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCityRoad", e)
            }
        })
    }

    async ChangeCityRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const roads = await CityRoads.findAll({where: {fromID: Data.cities.filter(city => {return city.countryID === country.id}).map(city => {return city.id})}})
                let request = "ℹ ID городов:\n\n"
                const roadButtons = []
                Data.cities.filter(city => {return city.countryID === country.id}).forEach(city => {request += "🔸 " + city.name + "  -  " + city.id + "\n"})
                request += "\nℹ Дороги изменяются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ В фракции ${country.GetName(context.player.platform === "IOS")} нет междугородних дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputInteger(context, "Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CityRoads.update({time: time}, {where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CityRoads.update({time: time}, {where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога изменена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCityRoad", e)
            }
        })
    }

    async DeleteRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll()
                let request = "ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName(context.player.platform === "IOS") + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += "\nℹ Дороги удаляются попарно, если удалить дорогу A->B, то удалится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const accept = await InputManager.InputBoolean(context, `❓ Удалить дорогу соединяющую ${Data.countries[road.dataValues.fromID].GetName(context.player.platform === "IOS")} и ${Data.countries[road.dataValues.toID].GetName(context.player.platform === "IOS")}`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await CountryRoads.destroy({where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CountryRoads.destroy({where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/DeleteRoad", e)
            }
        })
    }

    async CreateRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const firstCountryButtons = Data.GetCountryButtons()
                let firstCountry = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите первую фракцию", firstCountryButtons, current_keyboard)
                if(!firstCountry) return resolve()
                firstCountry = Data.ParseButtonID(firstCountry)
                firstCountry = Data.countries[firstCountry]
                const secondCountryButtons = firstCountryButtons.filter(key => {return key[0] !== firstCountry.name})
                let secondCountry = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите вторую фракцию", secondCountryButtons, current_keyboard)
                if(!secondCountry) return resolve()
                secondCountry = Data.ParseButtonID(secondCountry)
                secondCountry = Data.countries[secondCountry]
                const road = await CountryRoads.count({where: {fromID: firstCountry.id, toID: secondCountry.id}})
                if(road !== 0)
                {
                    await context.send("⚠ Такая дорога уже существует", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const time = await InputManager.InputInteger(context, "3️⃣ Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CountryRoads.create({
                    time: time,
                    fromID: firstCountry.id,
                    toID: secondCountry.id,
                    isBlocked: false
                })
                await CountryRoads.create({
                    time: time,
                    fromID: secondCountry.id,
                    toID: firstCountry.id,
                    isBlocked: false
                })
                await context.send("✅ Дорога создана", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateRoad", e)
            }
        })
    }

    async ChangeTheRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll()
                let request = "ℹ ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName(context.player.platform === "IOS") + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += "\nℹ Дороги изменяются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputInteger(context, "Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CountryRoads.update({time: time}, {where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CountryRoads.update({time: time}, {where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога изменена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeTheRoad", e)
            }
        })
    }

    async ChatControls(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить чат", "add"],
                    ["❌ Удалить чат", "delete"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.AddTheChat(context, current_keyboard)
                action === "delete" && await this.DeleteChat(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChatControls", e)
            }
        })
    }

    async DeleteChat(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let buttons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        buttons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                    }
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите к какой фракции будет относиться чат", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                const chats = await Chats.findAll({where: {countryID: country.id}})
                if(chats.length === 0)
                {
                    await context.send(`⚠ Для фракции ${country.GetName(context.player.platform === "IOS")} не добавлено чатов`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                buttons = []
                let request = `Список чатов фракции ${country.GetName(context.player.platform === "IOS")}:\n\n`
                for(let i = 0; i < chats.length; i++)
                {
                    if(chats[i])
                    {
                        buttons.push([chats[i].name, chats[i].link])
                        request += "🔸" + chats[i].name + "  -  " + "https://vk.cc/" + chats[i].link + "\n"
                    }
                }
                const chat = await InputManager.KeyboardBuilder(context, request + "\n\n3️⃣ Выберите чат, который хотите удалить", buttons, current_keyboard)
                if(!chat) return resolve()
                await Chats.destroy({where: {link: chat}})
                await context.send("✅ Чат удален", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/DeleteChat", e)
            }
        })
    }

    async AddTheChat(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countryButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        countryButtons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                    }
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите к какой фракции будет относиться чат", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                const name = await InputManager.InputString(context, "3️⃣ Введите название чата", current_keyboard)
                if(!name) return resolve()

                const link = await InputManager.InputString(context, "4️⃣ Вставьте ссылку приглашения в чат ВК или ТГ", current_keyboard)
                if(!link) return resolve()
                if(!link.match(/vk\.me\/join|t\.me\//))
                {
                    await context.send("🚫 Это не приглашение в беседу", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const shortLink = await api.api.utils.getShortLink({
                    url: link,
                    private: 0
                })
                await Chats.create({
                    countryID: country.id,
                    link: shortLink.key,
                    name: name
                })
                await context.send("✅ Чат добавлен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddTheChat", e)
            }
        })
    }

    async GetCountryInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                await context.send("ℹ Информация о фракции " + country.GetName(context.player.platform === "IOS") + "\n\n" + await country.GetAllInfo() + "\n\n" + country.GetResources(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryInfo", e)
            }
        })
    }

    async GetCityInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", Data.GetCityButtons(), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                await context.send("ℹ Информация о городе " + city.name + "\n\n" + await city.GetAllInfo() + "\n\n" + city.GetResources(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCityInfo", e)
            }
        })
    }

    async GetUserInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя", current_keyboard)
                if(!user) return resolve()
                await context.send(await NameLibrary.GetFullUserInfo(user.dataValues.id, User), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetUserInfo", e)
            }
        })
    }

    async GetBuildingInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", Data.GetCityButtons(), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                if(!Data.buildings[city])
                {
                    await context.send("🚫 В городе нет зданий", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buttons = []
                for(let i = 0; i < Data.buildings[city].length; i++)
                {
                    buttons.push([Data.buildings[city][i].name, "ID" + i])
                }
                let build = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите здание", buttons, current_keyboard)
                if(!build) return resolve()
                build = Data.ParseButtonID(build)
                build = Data.buildings[city][build]
                await context.send("ℹ Информация о здании:" + "\n\n" + build.GetAllInfo(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetBuildingInfo", e)
            }
        })
    }

    async RemoveEffect(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                if(!Data.users[user.dataValues.id])
                {
                    await context.send(`⚠ Данные игрока ${user.dataValues.id}(${user.dataValues.nick}) отсутствуют в кэше, похоже что он давно не заходил`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                user = Data.users[user.dataValues.id]
                user.effects = []
                await context.send(`ℹ Список эффектов игрока ${user.GetName()} очищен`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RemoveEffect", e)
            }
        })
    }

    async AddEffect(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока, на которого хотите наложить эффект", current_keyboard)
                if(!user) return resolve()
                if(!Data.users[user.dataValues.id])
                {
                    await context.send(`⚠ Данные игрока ${user.dataValues.id}(${user.dataValues.nick}) отсутствуют в кэше, похоже что он давно не заходил`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                user = Data.users[user.dataValues.id]
                if(user.status === "worker")
                {
                    await context.send("⚠ Запрещается накладывать эффекты на игроков со статусом ⚙ Работник", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const effectButtons = []
                let request = "ℹ Описание эффектов:\n\n"
                for(const effect of Object.keys(Effects))
                {
                    effectButtons.push([Effects[effect].name, effect])
                    request += `🔶 ${Effects[effect].name} ${Effects[effect].description}\n`
                }
                let effect = await InputManager.KeyboardBuilder(context, request + "\n2️⃣ Выберите эффект", effectButtons, current_keyboard)
                if(!effect) return resolve()
                effect = Effects[effect]
                let time = await InputManager.InputDefaultInteger(context, "3️⃣ Введите время действия эффекта (не более недели (10080 мин))", current_keyboard, 1, 10080, effect.time)
                if(!time) return resolve()
                user.AddEffect(effect, time)
                await context.send(`✅ Игрок ${user.GetName()} получил эффект ${effect.name}`, {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(user.id, "ℹ На вас был наложен эффект " + effect.name + " на " + time + " минут")
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddEffect", e)
            }
        })
    }

    async Events(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [["➕ Начать", "start"], ["🚫 Прекратить", "stop"]]
                let action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action = action === "start"
                kb = [
                    ["🛣 Блокировка дороги", "block_road"],
                    ["🌇 Осада города", "block_city"],
                    ["🔰 Блокада фракции", "block_country"],
                    ["🔰 Санкции для граждан", "block_country_citizen"],
                    ["🌇 Санкции для горожан", "block_city_citizen"],
                    ["📰 Глобальное событие", "new_event"]
                ]
                const type = await InputManager.KeyboardBuilder(context, "ℹ Справка:\n\n🔸 🛣 Блокировка дороги - запрещает перемещение по дороге\n\n🔸 🌇 Осада города - блокирует переводы ресурсов из бюджета города и запрещает въезд/выезд\n\n🔸 🔰 Блокада фракции - блокирует переводы ресурсов из бюджета фракции и запрещает въезд/выезд\n\n🔸 🔰 Санкции для граждан - блокирует распоряжение ресурсами и имуществом игроков имеющих гражданство конкретной фракции\n\n🔸 🌇 Санкции для горожан - блокирует распоряжение ресурсами и имуществом игроков имеющих прописку конкретного города\n\n2️⃣ Выберите событие", kb, current_keyboard)
                if(!type) return resolve()
                type === "block_road" && await this.BlockRoadEvent(context, current_keyboard, action)
                type === "block_city" && await this.BlockCityEvent(context, current_keyboard, action)
                type === "block_country" && await this.BlockCountryEvent(context, current_keyboard, action)
                type === "block_country_citizen" && await this.CountrySanctionsEvent(context, current_keyboard, action)
                type === "block_city_citizen" && await this.CitySanctionsEvent(context, current_keyboard, action)
                type === "new_event" && await this.NewEvent(context, current_keyboard, action)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Events", e)
            }
        })
    }

    async NewEvent(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const name = await InputManager.InputString(context, "1️⃣ Введите название события (до 35 символов)", current_keyboard, 1, 35)
                if(!name) return resolve()
                const text = await InputManager.InputString(context, "2️⃣ Введите описание события", current_keyboard)
                if(!text) return resolve()
                const date = await InputManager.InputDate(context, "3️⃣ Когда будет происходить это событие?", current_keyboard)
                if(!date) return resolve()
                const accept = await InputManager.InputBoolean(context, `📰 ${name} ${NameLibrary.ParseDateTime(date)}\n${text}\n\nПродолжить?`)
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
                }
                await Events.create({
                    name: name,
                    description: text,
                    date: date
                })
                await context.send(`✅ Событие добавлено`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BlockRoadEvent", e)
            }
        })
    }

    async BlockRoadEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll({where: {isBlocked: !action}})
                let request = "ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName(context.player.platform === "IOS") + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += `\nℹ Дороги блокируются попарно, если заблокировать дорогу A->B, то изменится и дорога B->A\n\nВыберите какую дорогу вы хотите ${action ? "заблокировать" : "разблокировать"}`
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ Нет ${action ? "не заблокированных" : "заблокированных"} дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road].dataValues
                await CountryRoads.update({isBlocked: action}, {where: {fromID: road.fromID, toID: road.toID}})
                await CountryRoads.update({isBlocked: action}, {where: {fromID: road.toID, toID: road.fromID}})
                await api.SendMessage(Data.countries[road.fromID].leaderID, `ℹ Дорога соединяющая фракции ${Data.countries[road.fromID].GetName(context.player.platform === "IOS")} и ${Data.countries[road.toID].GetName(context.player.platform === "IOS")} ${action ? "заблокирована" : "разблокирована"}`)
                await api.SendMessage(Data.countries[road.toID].leaderID, `ℹ Дорога соединяющая фракции ${Data.countries[road.toID].GetName(context.player.platform === "IOS")} и ${Data.countries[road.fromID].GetName(context.player.platform === "IOS")} ${action ? "заблокирована" : "разблокирована"}`)
                await context.send(`✅ Дорога ${action ? "заблокирована" : "разблокирована"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BlockRoadEvent", e)
            }
        })
    }

    async BlockCityEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const cities = await City.findAll({where: {isSiege: !action}})
                const cityButtons = []
                for(let i = 0; i < cities.length; i++)
                {
                    cityButtons.push([cities[i].dataValues.name, "ID" + i])
                }
                if(cityButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось городов, ${action ? "не находящихся под осадой" : "находящихся под осадой"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[cities[city].dataValues.id]
                const users = await PlayerStatus.findAll({where: {location: city.id, notifications: true}})
                city.isSiege = action
                await City.update({isSiege: action}, {where: {id: city.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Город в котором вы находитесь ${action ? "попал в осаду, теперь вы не сможете покинуть город до конца осады" : "вышел из осады, теперь вы можете свободно перемещаться"}`)
                }
                await api.SendMessage(city.leaderID, `⚠ Город ${city.name} ${action ? "попал в осаду" : "больше не в осаде"}`)
                await api.SendMessage(Data.countries[city.countryID].leaderID, `⚠ Город ${city.name} ${action ? "попал в осаду" : "больше не в осаде"}`)
                await context.send(`✅ Город ${action ? "осажен" : "больше не в осаде"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BlockCityEvent", e)
            }
        })
    }

    async BlockCountryEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = await Country.findAll({where: {isSiege: !action}})
                const countryButtons = []
                for(let i = 0; i < countries.length; i++)
                {
                    countryButtons.push([countries[i].dataValues.name, "ID" + i])
                }
                if(countryButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось фракций, ${action ? "не находящихся в блокаде" : "находящихся в блокаде"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[countries[country].dataValues.id]
                const users = await PlayerStatus.findAll({where: {countryID: country.id, notifications: true}})
                country.isSiege = action
                await Country.update({isSiege: action}, {where: {id: country.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Фракция в которой вы находитесь ${action ? "попала в блокаду, теперь вы не можете перемещаться до конца блокады" : "вышел из блокады, теперь вы можете свободно перемещаться"}`)
                }
                await api.SendMessage(country.leaderID, `⚠ Ваша фракция ${country.GetName(context.player.platform === "IOS")} ${action ? "попала в блокаду" : "больше не в блокаде"}`)
                await context.send(`✅ Фракция ${action ? "теперь в блокаде" : "больше не в блокаде"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/BlockCountryEvent", e)
            }
        })
    }

    async CitySanctionsEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const cities = await City.findAll({where: {isUnderSanctions: !action}})
                const cityButtons = []
                for(let i = 0; i < cities.length; i++)
                {
                    cityButtons.push([cities[i].dataValues.name, "ID" + i])
                }
                if(cityButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось городов, ${action ? "не находящихся под санкциями" : "находящихся под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[cities[city].dataValues.id]
                const users = await PlayerStatus.findAll({where: {registration: city.id, notifications: true}})
                city.isUnderSanctions = action
                await City.update({isUnderSanctions: action}, {where: {id: city.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Город в котором вы прописаны ${action ? "попал под санкции, теперь вы не сможете переводить ресурсы и пользоваться имуществом" : "вышел из под санкций, теперь вы можете переводить ресурсы и пользоваться имуществом"}`)
                }
                await api.SendMessage(city.leaderID, `⚠ Город ${city.name} ${action ? "попал под санкции" : "больше не под санкциями"}`)
                await api.SendMessage(Data.countries[city.countryID].leaderID, `⚠ Город ${city.name} ${action ? "попал под санкции" : "больше не под санкциями"}`)
                await context.send(`✅ Город ${action ? "под санкциями" : "больше не под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CitySanctionsEvent", e)
            }
        })
    }

    async CountrySanctionsEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = await Country.findAll({where: {isUnderSanctions: !action}})
                const countryButtons = []
                for(let i = 0; i < countries.length; i++)
                {
                    countryButtons.push([countries[i].dataValues.name, "ID" + i])
                }
                if(countryButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось фракций, ${action ? "не находящихся под санкциями" : "находящихся под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[countries[country].dataValues.id]
                const users = await PlayerStatus.findAll({where: {citizenship: country.id, notifications: true}})
                country.isUnderSanctions = action
                await Country.update({isUnderSanctions: action}, {where: {id: country.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Фракция в которой вы являетесь гражданином ${action ? "попала под санкции, теперь вы не сможете переводить ресурсы и пользоваться имуществом" : "вышла из под санкций, теперь вы можете переводить ресурсы и пользоваться имуществом"}`)
                }
                await api.SendMessage(country.leaderID, `⚠ Ваша фракция ${country.GetName(context.player.platform === "IOS")} ${action ? "попала под санкции" : "больше не под санкциями"}`)
                await context.send(`✅ Фракция ${action ? "теперь под санкциями" : "больше не под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountrySanctionsEvent", e)
            }
        })
    }

    async CreateWarning(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const users = data.users.split(";")
                const names = await api.GetTags(users)

                const type = await InputManager.InputBoolean(context, "1️⃣ Выберите тип предупреждения\n\n🔸 Устное предупреждение - сообщение от бота в ЛС игрока\n\n🔸 Предупреждение - полноценный варн, добавляет балл предупреждения игроку (3 балла - бан)", current_keyboard, keyboard.warningButton, keyboard.reportButton)
                if(type === null) return resolve()
                let unsended = []
                if(type)
                {
                    const reason = await InputManager.InputString(context, "2️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                    if(!reason) return resolve(false)
                    const explanation = await InputManager.InputString(context, "3️⃣ Введите полную причину (для админов)", current_keyboard)
                    if(!explanation) return resolve(false)
                    const time = await InputManager.InputDefaultInteger(context, "4️⃣ Введите время действия предупреждения в днях (от 1 до 365 дней)", current_keyboard, 1, 365, 90)
                    const proof = await InputManager.InputLotPhoto(context, "5️⃣ Отправьте фото-доказательства (обязательно)", current_keyboard, 3)
                    if(!proof) return resolve(false)

                    for(const i of users)
                    {
                        const send = await CrossStates.NewWarning(i, time, reason, explanation, proof, context.player.id)
                        if(!send) unsended.push(i)
                    }
                }
                else
                {
                    const reason = await InputManager.InputString(context, "2️⃣ Введите текст предупреждения", current_keyboard)
                    if(!reason) return resolve(false)
                    const proof = await InputManager.InputPhoto(context, "3️⃣ Отправьте фото-доказательство (отмена = без фото)", current_keyboard)
                    for(const i of users)
                    {
                        try
                        {
                            await api.api.messages.send({
                                user_id: i,
                                random_id: Math.round(Math.random() * 100000),
                                message: `⚠ Вам выдано устное предупреждение:\n\n${reason}\n\n⚠ Имейте в виду - устные предупреждения выдают модераторы и админы, они в праве выдать вам полноценный варн, который может привести к бану в проекте.\nБудьте осторожны и не провоцируйте администрацию.`,
                                attachment: proof
                            })
                        } catch (e) {unsended.push(i)}
                    }
                }
                let request = ""
                for(const i of users)
                {
                    if(unsended.includes(i))
                    {
                        request += `${names[i]} - ⚠ Не получилось уведомить игрока о предупреждении, возможно игрок не писал в ЛС боту\n`
                    }
                    else
                    {
                        request += `${names[i]} - ✅ Предупреждение выдано\n`
                    }
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                context.player.state = scenes.startMenu
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async NewWarning(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока")
                if(!user) return resolve()
                if(NameLibrary.RoleEstimator(user.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send(`⚠ Роль игрока *id${user.dataValues.id}(${user.dataValues.nick}) находится на вашем уровне или выше, у вас нет права выдавать ему предупреждения`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const type = await InputManager.InputBoolean(context, "2️⃣ Выберите тип предупреждения\n\n🔸 Устное предупреждение - сообщение от бота в ЛС игрока\n\n🔸 Предупреждение - полноценный варн, добавляет балл предупреждения игроку (3 балла - бан)", current_keyboard, keyboard.warningButton, keyboard.reportButton)
                if(type === null) return resolve()
                if(type)
                {
                    const reason = await InputManager.InputString(context, "3️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                    if(!reason) return resolve(false)
                    const explanation = await InputManager.InputString(context, "4️⃣ Введите полную причину (для админов)", current_keyboard)
                    if(!explanation) return resolve(false)
                    const time = await InputManager.InputDefaultInteger(context, "5️⃣ Введите время действия предупреждения в днях (от 1 до 365 дней)", current_keyboard, 1, 365, 90)
                    const proof = await InputManager.InputLotPhoto(context, "5️⃣ Отправьте фото-доказательства (обязательно)", current_keyboard, 3)
                    if(!proof) return resolve(false)
                    await CrossStates.NewWarning(user.dataValues.id, time, reason, explanation, proof, context.player.id)
                    await context.send(`✅ Предупреждение выдано`, {keyboard: keyboard.build(current_keyboard)})
                }
                else
                {
                    const reason = await InputManager.InputString(context, "2️⃣ Введите текст предупреждения", current_keyboard)
                    if(!reason) return resolve(false)
                    const proof = await InputManager.InputPhoto(context, "3️⃣ Отправьте фото-доказательство (отмена = без фото)", current_keyboard)
                    let send = true
                    try
                    {
                        await api.api.messages.send({
                            user_id: user.dataValues.id,
                            random_id: Math.round(Math.random() * 100000),
                            message: `⚠ Вам выдано устное предупреждение:\n\n${reason}\n\n⚠ Имейте в виду - устные предупреждения выдают модераторы и админы, они в праве выдать вам полноценный варн, который может привести к бану в проекте.\nБудьте осторожны и не провоцируйте администрацию.`,
                            attachment: proof
                        })
                    }
                    catch (e)
                    {
                        send = false
                    }
                    await context.send(`✅ Предупреждение не выдано${send ? ", игрок не получил уведомление, вероятно из-за того что он не писал в ЛС бота" : ""}`, {keyboard: keyboard.build(current_keyboard)})
                }
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async NewReport(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const users = data.users.split(";")
                const reason = await InputManager.InputString(context, "1️⃣ Введите опишите причину, по которой вы отправляете жалобу", current_keyboard)
                if(!reason) return resolve(false)
                const proof = await InputManager.InputPhoto(context, "2️⃣ Отправьте фото-доказательство (не обязательно, чтобы пропустить нажмите \"Отмена\")", current_keyboard)
                if(!context.player.CanPay({money: -150}))
                {
                    await context.send("⚠ У вас не хватает монет для оплаты жалобы", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "3️⃣ В целях разгрузки модераторов жалоба от обычного игрока стоит 150 монет.\n\nПродолжить?")
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
                }
                if(!context.player.CanPay({money: -150}))
                {
                    await context.send("⚠ У вас не хватает монет для оплаты жалобы", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id, {money: -150})
                const admins = await Player.findAll({where: {role: ["moder", "admin", "Madmin", "support"]}})
                for(const i of admins)
                {
                    try
                    {
                        await api.api.messages.send({
                            user_id: i.dataValues.id,
                            random_id: Math.round(Math.random() * 100000),
                            message: `⚠ Игрок ${context.player.GetName()} отправил жалобу на игрок${users.length > 1 ? "ов" : "а"}:\n${users.map(user => {return "*id" + user + "(" + user + ")"})}\n\nТекст жалобы:\n${reason}`,
                            attachment: proof
                        })
                    } catch (e) {}
                }
                await context.send("✅ Жалоба отправлена", {keyboard: keyboard.build(current_keyboard)})
                context.player.lastReportTime = new Date()
                context.player.state = scenes.startMenu
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async Ban(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = parseInt(data.users)
                if(StopList.includes(user))
                {
                    await context.reply("⚠ Осуждаю")
                    return resolve(false)
                }
                const reason = await InputManager.InputString(context, "1️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "2️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                await Warning.create({
                    userID: user,
                    reason: reason,
                    explanation: explanation,
                    moderID: context.player.id
                })
                await Player.update({isBanned: true}, {where: {id: user}})
                if(Data.users[user]) Data.users[user].isBanned = true
                await api.SendMessageWithKeyboard(user, `⚠⚠⚠ Вы получили бан по причине: ${reason}\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                await Ban.create({
                    userID: user,
                    reason: reason,
                    explanation: explanation,
                    moderID: context.player.id
                })
                await api.BanUser(user)
                await Warning.update({banned: true}, {where: {userID: user}})
                const banned = await Player.findOne({where: {id: user}, attributes: ["id", "nick"]})
                if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${banned.dataValues.id}(${banned.dataValues.nick})`)
                context.player.lastReportTime = new Date()
                context.player.state = scenes.startMenu
                await context.send("✅ Бан выдан", {keyboard: keyboard.build(current_keyboard)})
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Ban", e)
            }
        })
    }

    async NewBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока")
                if(!user) return resolve()
                if(StopList.includes(user.dataValues.id))
                {
                    await context.send("⚠ Осуждаю", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(NameLibrary.RoleEstimator(user.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send(`⚠ Роль игрока *id${user.dataValues.id}(${user.dataValues.nick}) находится на вашем уровне или выше, вы не можете его забанить`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const reason = await InputManager.InputString(context, "2️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "3️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                await Warning.create({
                    userID: user.dataValues.id,
                    reason: reason,
                    explanation: explanation,
                    moderID: context.player.id
                })
                await Player.update({isBanned: true}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = true
                await api.SendMessageWithKeyboard(user.dataValues.id, `⚠⚠⚠ Вы получили бан по причине: ${reason}\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                await Ban.create({
                    userID: user.dataValues.id,
                    reason: reason,
                    explanation: explanation,
                    moderID: context.player.id
                })
                await api.BanUser(user.dataValues.id)
                await Warning.update({banned: true}, {where: {userID: user.dataValues.id}})
                await context.send("✅ Бан выдан", {keyboard: keyboard.build(current_keyboard)})
                if(Data.owner) await api.SendMessage(Data.owner.id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${user.dataValues.id}(${user.dataValues.nick})`)
                if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${user.dataValues.id}(${user.dataValues.nick})`)
                for (const key of Object.keys(Data.supports))
                {
                    await api.SendMessage(Data.supports[key].id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${user.dataValues.id}(${user.dataValues.nick})`)
                }
                for (const key of Object.keys(Data.administrators))
                {
                    await api.SendMessage(Data.administrators[key].id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${user.dataValues.id}(${user.dataValues.nick})`)
                }
                context.player.lastReportTime = new Date()
                return resolve(true)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/Ban", e)
            }
        })
    }

    async CheatingUserDiamonds(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Накрутка алмазов игроку. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите накрутить алмазы?", current_keyboard)
                if(!user) return resolve()
                let count = await InputManager.InputInteger(context, "2️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()
                const accept = await InputManager.InputBoolean(context, `3️⃣ Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: 💎 Алмазы\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {diamond: count}
                await Data.AddPlayerResources(user.dataValues.id, objIN)
                await api.SendMessage(user.dataValues.id, `✅ Вам поступил перевод:\n💎 Алмазы: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CheatingUserResources", e)
            }
        })
    }

    async CreateNewCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let leader = await InputManager.InputUser(context, `1️⃣ Укажите градоначальника`, current_keyboard)
                if(!leader) return resolve()
                if(leader.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать работников на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let name = await InputManager.InputString(context, "3️⃣ Введите название нового города (от 2 до 35 символов)", current_keyboard, 2, 35)
                if(!name) return resolve()
                let city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует, повторите ввод.", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                let description = await InputManager.InputString(context, "4️⃣ Введите описание города (от 2 до 1000 символов)", current_keyboard, 2, 1000)
                if(!description) return resolve()
                const newCity = await City.create({
                    countryID: country.id,
                    leaderID: leader.dataValues.id,
                    name: name,
                    description: description
                })
                await CityRoads.create({fromID: country.capitalID, toID: newCity.dataValues.id, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityRoads.create({fromID: newCity.dataValues.id, toID: country.capitalID, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityResources.create({id: newCity.dataValues.id})
                if(Data.users[leader.dataValues.id]) Data.users[leader.dataValues.id].status = "official"
                if(leader.dataValues.status.match(/citizen|/))
                {
                    leader.set({status: "official"})
                    await leader.save()
                }
                await OfficialInfo.findOrCreate({
                    where: {id: leader.dataValues.id},
                    defaults: {id: leader.dataValues.id, countryID: country.id, nick: leader.dataValues.nick}
                })
                await Data.ResetCities()
                await api.SendMessage(leader.dataValues.id, `✅ Вы были назначены главой нового города \"${newCity.dataValues.name}\", ваш статус изменен на "Чиновник"`)
                await context.send("✅ Город создан.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateNewCity", e)
            }
        })
    }

    async RemoveCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Удаление города. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    await context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let city = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите город", Data.GetCityForCountryButtons(country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                if(city.isCapital)
                {
                    await context.send("🚫 Столицу можно удалить только вместе с фракцией", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const users = await PlayerStatus.findAll({where: {location: city.id}})
                for (const user of users)
                {
                    user.set({location: country.capitalID})
                    await user.save()
                    if(user.dataValues.notifications)
                    {
                        await api.SendMessage(user.dataValues.id, "Администраторы удалили город в котором вы находились, вы перенесены в столицу фракции " + country.GetName(context.player.platform === "IOS"))
                    }
                }
                await City.destroy({where: {id: city.id}})
                await CityResources.destroy({where: {id: city.id}})
                await Data.LoadCities()
                await api.SendMessage(city.leaderID, `⚠ Администрация удалила ваш город \"${city.name}\"`)
                await context.send("✅ Город удален.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RemoveCity", e)
            }
        })
    }

    async HideCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                country.hide = !country.hide
                await Country.update({hide: country.hide}, {where: {id: country.id}})
                await context.send(`✅ Фракция ${country.GetName()} теперь ${country.hide ? "скрыта" : "отображается"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryActive", e)
            }
        })
    }

    async CountryWarnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(NameLibrary.RoleEstimator(context.player.role) < 4)
                {
                    await context.send(`⚠ Вы не можете выдавать предупреждения фракциям`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const kb = [
                    ["➕ Добавить варн", "add"],
                    ["➖ Удалить варн", "remove"]
                ]
                let request = "Количество варнов фракций:\n\n"
                for(const country of Data.countries)
                {
                    if(country)
                    {
                        request += country.GetName(context.player.platform === "IOS") + "  -  " + country.warnings + " варнов\n"
                    }
                }
                const action = await InputManager.KeyboardBuilder(context, request + "\nВыберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.AddCountryWarn(context, current_keyboard)
                action === "remove" && await this.RemoveCountryWarn(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryWarnings", e)
            }
        })
    }

    async RemoveCountryWarn(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                if(country.warnings <= 0)
                {
                    await context.send(`⚠ У фракции ${country.GetName(context.player.platform === "IOS")} нет предупреждений`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                country.warnings --
                await Country.update({warnings: country.warnings}, {where: {id: country.id}})
                await api.SendMessage(country.leaderID, `✅ С вашей фракции ${country.GetName(context.player.platform === "IOS")} снят один варн`)
                await context.send(`✅ Предупреждение снято`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RemoveCountryWarn", e)
            }
        })
    }

    async AddCountryWarn(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                country.warnings ++
                await Country.update({warnings: country.warnings}, {where: {id: country.id}})
                await api.SendMessage(country.leaderID, `⚠ Внимание! Ваша фракция ${country.GetName(context.player.platform === "IOS")} получила варн`)
                await context.send(`✅ Фракции ${country.GetName(context.player.platform === "IOS")} выдано предупреждение`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddCountryWarn", e)
            }
        })
    }

    async CountryTags(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить тег", "add_tag"],
                    ["➖ Удалить тег", "remove_tag"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add_tag" && await this.AddCountryTag(context, current_keyboard)
                action === "remove_tag" && await this.RemoveCountryTag(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CountryTags", e)
            }
        })
    }

    async RemoveCountryTag(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let tags = []
                if(country.tags)
                {
                    tags = country.tags.split("|")
                }
                let request = `Теги фракции ${country.GetName(context.player.platform === "IOS")}:\n\n`
                let tagsKB = []
                if(tags.length === 0)
                {
                    await context.send(`⚠ У фракции ${country.GetName(context.player.platform === "IOS")} нет тегов`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(const tag of tags)
                {
                    request += "- " + tag + "\n"
                    tagsKB.push([tag, tag])
                }
                let newTag = await InputManager.KeyboardBuilder(context, "Выберите тег, который вы хотите убрать", tagsKB, current_keyboard)
                if(!newTag) return resolve()
                tags = tags.filter(key => {return key !== newTag})
                if(tags.length !== 0)
                {
                    country.tags = tags.join("|")
                    await Country.update({tags: tags.join("|")}, {where: {id: country.id}})
                }
                else
                {
                    country.tags = null
                    await Country.update({tags: null}, {where: {id: country.id}})
                }
                await context.send("✅ Теги обновлены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RemoveCountryTag", e)
            }
        })
    }

    async AddCountryTag(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let tags = []
                if(country.tags)
                {
                    tags = country.tags.split("|")
                }
                const showTags = (array) => {
                    if(array.length === 0) return "Тегов нет"
                    let request = `Теги фракции ${country.GetName(context.player.platform === "IOS")}:\n\n`
                    for(const tag of array)
                    {
                        request += "- " + tag + "\n"
                    }
                    return request
                }
                let newTag = ""
                do
                {
                    await context.send(showTags(tags))
                    newTag = await InputManager.InputString(context, "Введите новый тег", current_keyboard)
                    if(newTag)
                    {
                        tags.push(newTag)
                    }
                }
                while(newTag)
                if(tags.length !== 0)
                {
                    country.tags = tags.join("|")
                    await Country.update({tags: tags.join("|")}, {where: {id: country.id}})
                }
                await context.send("✅ Теги обновлены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddCountryTag", e)
            }
        })
    }

    async RemoveCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Удаление фракции. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    await context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const buttons = []
                Data.countries.forEach((key) => {
                    if(key?.id !== country.id)
                    {
                        buttons.push([key.name, "ID" + key.id])
                    }
                })
                let newPlace = await InputManager.KeyboardBuilder(context, "2️⃣ Куда переселить всех игроков, которые находятся в фракции?", buttons, current_keyboard)
                if(!newPlace) return resolve()
                newPlace = Data.ParseButtonID(newPlace)
                newPlace = Data.countries[newPlace]
                const users = await PlayerStatus.findAll({where: {location: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                for (const user of users)
                {
                    user.set({location: newPlace.capitalID, countryID: newPlace.id})
                    if(user.dataValues.registration)
                    {
                        if(Data.cities[user.dataValues.registration].countryID === country.id)
                        {
                            user.set({registration: null})
                        }
                    }
                    if(user.dataValues.citizenship === country.id)
                    {
                        user.set({citizenship: null})
                        await Player.update({status: "stateless"}, {where: {id: user.dataValues.id}})
                    }
                    await user.save()
                    if(user.dataValues.notifications)
                    {
                        await api.SendMessage(user.dataValues.id, "⚠ Администраторы удалили фракцию в которой вы находились, вы перенесены в столицу фракции " + newPlace.GetName())
                    }
                }
                await Player.update({status: "stateless"}, {where: {id: country.leaderID}})
                if(Data.users[country.leaderID]) Data.users[country.leaderID].status = "stateless"
                if(Data.officials[country.id])
                {
                    for(const id of Object.keys(Data.officials[country.id]))
                    {
                        await PlayerStatus.update({status: "stateless"}, {where: {id: id}})
                        if(Data.users[id]) Data.users[id].status = "stateless"
                        await api.SendMessage(id, `⚠ Администраторы удалили вашу фракцию ${country.GetName()}, теперь вы апатрид`)
                    }
                }
                await api.SendMessage(country.leaderID, `⚠ Администрация удалила вашу фракцию ${country.GetName()}, теперь вы апатрид`)
                await Country.destroy({where: {id: country.id}})
                await CountryResources.destroy({where: {id: country.id}})
                await CityRoads.destroy({where: {fromID: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await City.destroy({where: {id: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await CityResources.destroy({where: {id: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await OfficialInfo.destroy({where: {countryID: country.id}})
                await CountryRoads.destroy({where: {fromID: country.id}})
                await CountryRoads.destroy({where: {toID: country.id}})
                await Data.LoadCountries()
                await Data.LoadCities()
                await Data.LoadOfficials()
                await context.send("✅ Фракция удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/RemoveCountry", e)
            }
        })
    }

    async ChangeCountryResource(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let resourcesKeyboard = [
                    ["🌾 Зерно", "wheat", false],
                    ["🪵 Древесина", "wood", false],
                    ["🪨 Камень", "stone", false],
                    ["🌑 Железо", "iron", false],
                    ["🥉 Бронза", "copper", false],
                    ["🥈 Серебро", "silver", false]
                ]
                if(country.resources.match(/wheat/)) resourcesKeyboard[0][2] = true
                if(country.resources.match(/wood/)) resourcesKeyboard[1][2] = true
                if(country.resources.match(/stone/)) resourcesKeyboard[2][2] = true
                if(country.resources.match(/iron/)) resourcesKeyboard[3][2] = true
                if(country.resources.match(/copper/)) resourcesKeyboard[4][2] = true
                if(country.resources.match(/silver/)) resourcesKeyboard[5][2] = true
                let resources = await InputManager.RadioKeyboardBuilder(context, "2️⃣ Выберите ресурсы фракции:", resourcesKeyboard, current_keyboard)
                if(!resources) return resolve()
                resources = resources.filter(key => {
                    return key[1]
                }).map(key => {
                    return key[0]
                })
                let resName = ""
                resources.forEach(key => {
                    resName += NameLibrary.GetResourceName(key) + "\n"
                })
                resources = resources.join(".")
                country.resources = resources
                await Country.update({resources: resources}, {where: {id: country.id}})
                await context.send("✅ Ресурсы изменены", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryResource", e)
            }
        })
    }

    async TeleportUser(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const cities = Data.GetCityForCountryButtons(country.id)
                let city
                if(cities.length > 1)
                {
                    city = await InputManager.KeyboardBuilder(context, "3️⃣ Выберите город", cities, current_keyboard)
                    if(!city) return resolve()
                    city = Data.ParseButtonID(city)
                }
                else
                {
                    city = country.capitalID
                }
                await PlayerStatus.update({location: city, countryID: country.id}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].location = city
                    Data.users[user.dataValues.id].countryID = country.id
                }
                await api.SendMessage(user.dataValues.id, `✅ Вы были телепортированы в город ${Data.cities[city].name} фракции ${country.GetName()}`)
                await context.send("✅ Игрок телепортирован", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryResource", e)
            }
        })
    }

    async GetMostRich(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "💰 Самые богатые люди Античности\n\n"
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
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetMostRich", e)
            }
        })
    }

    async GetCityPlayersList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "📍 Сейчас в вашем городе находятся:\n\n"
                const playersStatus = await PlayerStatus.findAll({where: {location: context.cityID}, attributes: ["id"]})
                if(playersStatus.length === 0)
                {
                    await context.send("‼ В вашем городе никого нет")
                    return resolve()
                }
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick", "status"]})
                let users = await api.api.users.get({
                    user_ids: players.map(key => {return key.dataValues.id}).join(",")
                })
                let userIds = {}
                for(const user of users)
                {
                    userIds[user.id] = user
                }
                for(const player of players)
                {
                    request += `🔸 *id${player.dataValues.id}(${player.dataValues.nick + " <" + userIds[player.dataValues.id].first_name + " " + userIds[player.dataValues.id].last_name + ">"}) - ${NameLibrary.GetStatusName(player.dataValues.status)}\n`
                }
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCityPlayersList", e)
            }
        })
    }

    async GetCountryPlayersList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = ["📍 Сейчас в вашей фракции находятся:\n"]
                const playersStatus = await PlayerStatus.findAll({where: {countryID: context.country.id}, attributes: ["id", "location", "citizenship"]})
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick", "status"]})
                const users = []
                for(const status of playersStatus)
                {
                    for(const player of players)
                    {
                        if(status.dataValues.id === player.dataValues.id)
                        {
                            users.push({
                                id: player.dataValues.id,
                                nick: player.dataValues.nick,
                                status: player.dataValues.status,
                                location: status.dataValues.location,
                                citizenship: status.dataValues.citizenship
                            })
                            break
                        }
                    }
                }
                let names = await api.api.users.get({
                    user_ids: players.map(key => {return key.dataValues.id}).join(",")
                })
                let userIds = {}
                for(const user of names)
                {
                    userIds[user.id] = user
                }
                let count = 0
                let page = 0
                for(const city of Data.cities)
                {
                    if(city?.countryID === context.country.id)
                    {
                        count = 0
                        request[page] += `\n🌇 Город ${city.name}:\n`
                        for(const player of users)
                        {
                            if(player.location === city.id)
                            {
                                request[page] += `🔸 *id${player.id}(${player.nick}) ${userIds[player.id] ? "[" + userIds[player.id].first_name + " " + userIds[player.id].last_name + "]" : ""} - ${player.citizenship !== context.country.id ? "Мигрант" : NameLibrary.GetStatusName(player.status)}\n`
                                if(request[page].length > 3500)
                                {
                                    page ++
                                    request[page] = ""
                                }
                            }
                        }
                    }
                }
                for(const message of request)
                {
                    await context.send(message)
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryPlayersList", e)
            }
        })
    }

    async GetCitizenList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = [`💳 Граждане фракции ${context.country.GetName(context.player.platform === "IOS")}:\n\n`]
                const playersStatus = await PlayerStatus.findAll({where: {citizenship: context.country.id}, attributes: ["id"]})
                if(playersStatus.length === 0)
                {
                    await context.send(`У фракции ${context.country.GetName(context.player.platform === "IOS")} нет граждан`)
                    return resolve()
                }
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick"]})
                const users = []
                for(const status of playersStatus)
                {
                    for(const player of players)
                    {
                        if(status.dataValues.id === player.dataValues.id)
                        {
                            users.push({
                                id: player.dataValues.id,
                                nick: player.dataValues.nick
                            })
                            break
                        }
                    }
                }
                let names = await api.api.users.get({
                    user_ids: players.filter(key => {return key.dataValues.id > 0}).map(key => {return key.dataValues.id}).join(",")
                })
                let userIds = {}
                for(const user of names)
                {
                    userIds[user.id] = user
                }
                let page = 0
                for(const player of users)
                {
                    request[page] += `🔸 *id${player.id}(${player.nick}) ${userIds[player.id] ? ("[" + userIds[player.id].first_name + " " + userIds[player.id].last_name + "]") : ""}\n`
                    if(request[page].length > 3500)
                    {
                        page ++
                        request[page] = ""
                    }
                }
                for(const message of request)
                {
                    await context.send(message)
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryPlayersList", e)
            }
        })
    }

    async GetRegistrationList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = `💳 В городе ${Data.cities[context.cityID].name} прописаны:\n\n`
                const playersStatus = await PlayerStatus.findAll({where: {registration: context.cityID}, attributes: ["id"]})
                if(playersStatus.length === 0)
                {
                    await context.send("⚠ В вашем городе никто не прописан.")
                    return resolve()
                }
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick"]})
                const users = []
                for(const status of playersStatus)
                {
                    for(const player of players)
                    {
                        if(status.dataValues.id === player.dataValues.id)
                        {
                            users.push({
                                id: player.dataValues.id,
                                nick: player.dataValues.nick
                            })
                            break
                        }
                    }
                }
                let names = await api.api.users.get({
                    user_ids: players.map(key => {return key.dataValues.id}).join(",")
                })
                let userIds = {}
                for(const user of names)
                {
                    userIds[user.id] = user
                }
                for(const player of users)
                {
                    request += `🔸 *id${player.id}(${player.nick + " <" + userIds[player.id].first_name + " " + userIds[player.id].last_name + ">"})\n`
                }
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetCountryPlayersList", e)
            }
        })
    }

    async ChangeNick(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, `1️⃣ Введите новый ник`, current_keyboard,2, 20)
                if(!name) return resolve()
                let temp = await Player.findOne({where: {nick: name}})
                while(temp)
                {
                    name = await InputManager.InputString(context, `⚠ Этот ник занят`, current_keyboard, 2, 20)
                    if(!name) return resolve()
                    temp = await Player.findOne({where: {nick: name}})
                }
                context.player.nick = name
                await Player.update({nick: name}, {where: {id: context.player.id}})
                let official = await OfficialInfo.findOne({where: {id: context.player.id}})
                if(official)
                {
                    official.set({nick: name})
                    await official.save()
                }
                await context.send("✅ Ник изменен", {keyboard: keyboard.build(current_keyboard)})
                if(context.player.status === "worker")
                {
                    await Data.LoadWorkers()
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangeClan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let clan = await InputManager.InputString(context, `1️⃣ Введите новое значение, которое будет отображаться в поле \"Клан\"`, current_keyboard,2, 20)
                if(!clan) return resolve()
                context.player.clan = clan
                await Player.update({clan: clan}, {where: {id: context.player.id}})
                await context.send("✅ Клан изменен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangePosition(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let position = await InputManager.InputString(context, `1️⃣ Введите новое значение, которое будет отображаться в поле \"Положение\"`, current_keyboard,2, 20)
                if(!position) return resolve()
                context.player.position = position
                await Player.update({position: position}, {where: {id: context.player.id}})
                await context.send("✅ Положение изменено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangeAppearance(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let appearance = await InputManager.InputString(context, `1️⃣ Введите новое значение, которое будет отображаться в поле \"Внешний вид\"`, current_keyboard,2, 20)
                if(!appearance) return resolve()
                context.player.appearance = appearance
                await Player.update({appearance: appearance}, {where: {id: context.player.id}})
                await context.send("✅ Внешний вид изменен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangePersonality(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let personality = await InputManager.InputString(context, `1️⃣ Введите новое значение, которое будет отображаться в поле \"Характер\"`, current_keyboard,2, 20)
                if(!personality) return resolve()
                context.player.personality = personality
                await Player.update({personality: personality}, {where: {id: context.player.id}})
                await context.send("✅ Характер изменен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangeDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `1️⃣ Введите новое описание`, current_keyboard,2, 20)
                if(!description) return resolve()
                context.player.description = description
                await PlayerInfo.update({description: description}, {where: {id: context.player.id}})
                await context.send("✅ Описание изменено", {keyboard: keyboard.build(current_keyboard)})
                if(context.player.status === "worker")
                {
                    await Data.LoadWorkers()
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangeGadget(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🖥 PC (Windows, Linux, MacOS)", "PC"],
                    ["🤖 Android", "ANDROID"],
                    ["🍏 IPhone / IPad", "IOS"]
                ]
                const detectPlatform = (name) => {
                    switch (name)
                    {
                        case "ANDROID":
                            return "🤖 Android"
                        case "IOS":
                            return "🍏 IPhone/IPad"
                        case "PC":
                            return "🖥 ПК на Windows, Linux или MacOS"
                    }
                }
                let platform = await InputManager.KeyboardBuilder(context, `ℹ Сейчас у вас установлена платформа ${detectPlatform(context.player.platform)}\n\n1️⃣ Выберите устройство (это надо для правильности отрисовки сообщений от бота)`, kb, current_keyboard)
                if(!platform) return resolve()
                context.player.platform = platform
                await Player.update({platform: platform}, {where: {id: context.player.id}})
                await context.send(`✅ Установлена платформа ${detectPlatform(platform)}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async ChangeNation(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const nationKeyboard = []
                Object.keys(Nations).forEach(key => {
                    nationKeyboard.push([Nations[key].name, key])
                })
                let nation = await InputManager.KeyboardBuilder(context, "1️⃣ Укажите национальность вашего персонажа", nationKeyboard, current_keyboard)
                if(!nation) return resolve()
                let description = Nations[nation].description
                nation = Nations[nation].name
                context.player.nationality = nation
                await PlayerInfo.update({nationality: nation}, {where: {id: context.player.id}})
                await context.send(description, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeNation", e)
            }
        })
    }

    async ChangeGender(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                context.player.gender = !context.player.gender
                await Player.update({gender: context.player.gender}, {where: {id: context.player.id}})
                await context.send(`✅ Ваш пол изменен на ${context.player.gender ? "мужской" : "женский"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeGender", e)
            }
        })
    }

    async ChangeAge(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const age = await InputManager.InputInteger(context, `1️⃣ Укажите возраст вашего персонажа.\n⚠ Возраст может быть выбран от 16 до 100 лет.`, current_keyboard, 16, 100)
                if(age === null) return resolve()
                context.player.age = age
                await PlayerInfo.update({age: age}, {where: {id: context.player.id}})
                await context.send(`✅ Возраст установлен`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeAge", e)
            }
        })
    }

    async ChangeAvatar(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.avatar)
                {
                    await context.send("Ваш аватар", {attachment: context.player.avatar})
                    let action = await InputManager.InputBoolean(context, "Что сделать с аватаркой?", current_keyboard, keyboard.secondaryButton(["♻ Изменить", "change"]), keyboard.secondaryButton(["🗑 Удалить", "delete"]))
                    if(!action)
                    {
                        await Player.update({avatar: null}, {where: {id: context.player.id}})
                        await context.send("✅ Аватар удален", {keyboard: keyboard.build(current_keyboard)})
                        context.player.avatar = null
                        return resolve()
                    }
                }
                const photo = await InputManager.InputPhoto(context, `1️⃣ Отправьте новое фото`, current_keyboard)
                if(photo === null) return resolve()
                context.player.avatar = photo
                await Player.update({avatar: photo}, {where: {id: context.player.id}})
                await context.send(`✅ Аватар установлен`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeAge", e)
            }
        })
    }

    async TestCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                country.tested = !country.tested
                await Country.update({tested: country.tested}, {where: {id: country.id}})
                await api.SendMessage(country.leaderID, `ℹ Ваша фракция ${country.GetName()} была ${country.tested ? "переведена в тестовый период" : "выведена из тестового периода"}`)
                await context.send(`✅ Фракция ${country.GetName()} была ${country.tested ? "переведена в тестовый период" : "выведена из тестового периода"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/TestCountry", e)
            }
        })
    }

    async MintingMoney(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let maxCount = 0
                let middleChance = 0
                let minChance = 0
                let maxChance = 0
                let mintCount = 0
                let workingCount = 0
                let flag = true
                let lastMintTime = new Date()
                const time = new Date()
                const lvls = {
                    1: {from: 0.4, to: 0.6, max: 125},
                    2: {from: 0.45, to: 0.6, max: 250},
                    3: {from: 0.5, to: 0.6, max: 500},
                    4: {from: 0.55, to: 0.6, max: 1000}
                }
                if(context.country.silver === 0)
                {
                    await context.send("⚠ Не хватает серебра для чеканки", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let k = 0; k < Data.cities.length; k++)
                {
                    if(Data.cities[k]?.countryID === context.country.id)
                    {
                        for(let i = 0; i < Data.buildings[Data.cities[k].id]?.length; i++)
                        {
                            if(Data.buildings[Data.cities[k].id][i].type.match(/mint/))
                            {
                                flag = false
                                if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time < 0)
                                {
                                    maxCount += lvls[Data.buildings[Data.cities[k].id][i].level].max
                                    mintCount += 1
                                    middleChance += (lvls[Data.buildings[Data.cities[k].id][i].level].from + lvls[Data.buildings[Data.cities[k].id][i].level].to) / 2
                                }
                                else
                                {
                                    workingCount += 1
                                    if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time > lastMintTime - time)
                                    {
                                        lastMintTime = Data.buildings[Data.cities[k].id][i].lastActivityTime
                                    }
                                }
                            }
                        }
                    }
                }
                if(flag)
                {
                    await context.send("⚠ В фракции нет монетных дворов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(mintCount === 0)
                {
                    await context.send("⚠ Все монетные дворы заняты чеканкой, приходите через " + NameLibrary.ParseFutureTime(lastMintTime), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                middleChance = Math.round((middleChance / mintCount) * 100)
                let count = await InputManager.InputDefaultInteger(context, `1️⃣ Вы можете отчеканить монеты из серебра, находящегося в бюджете фракции.\nℹ Сейчас в бюджете ${context.country.silver} серебра.\n\nℹ Вы можете загрузить до ${maxCount} серебра в ${mintCount} / ${mintCount + workingCount} свободные монетные дворы, при этом средний КПД будет около ${middleChance}%\n\nУкажите количество серебра для чеканки`, current_keyboard, 1, Math.min(maxCount, context.country.silver), Math.min(maxCount, context.country.silver))
                if(!count) return resolve()
                await Data.AddCountryResources(context.country.id, {silver: -count})
                let access = await InputManager.InputBoolean(context, `Отправить ${count} серебра на чеканку?`, current_keyboard)
                if(!access)
                {
                    await Data.AddCountryResources(context.country.id, {silver: count})
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let seconds = Math.round(14400 * (count / maxCount))
                time.setSeconds(time.getSeconds() + seconds)
                mintCount = 0
                for(let k = 0; k < Data.cities.length; k++)
                {
                    if(Data.cities[k]?.countryID === context.country.id)
                    {
                        for(let i = 0; i < Data.buildings[Data.cities[k].id]?.length; i++)
                        {
                            if(Data.buildings[Data.cities[k].id][i].type.match(/mint/))
                            {
                                if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time < 0)
                                {
                                    mintCount += 1
                                    minChance += lvls[Data.buildings[Data.cities[k].id][i].level].from
                                    maxChance += lvls[Data.buildings[Data.cities[k].id][i].level].to
                                    Data.buildings[Data.cities[k].id][i].lastActivityTime = time
                                }
                            }
                        }
                    }
                }
                minChance /= mintCount
                maxChance /= mintCount
                let extraction = NameLibrary.GetRandomNumb(Math.round(count * minChance), Math.round(count * maxChance))
                await Data.AddCountryResources(context.country.id, {money: extraction})
                await context.send(`✅ Из ${count} серебра отчеканено ${extraction} монет, КПД составил ${Math.round((extraction / count) * 100)}%`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/MintingMoney", e)
            }
        })
    }

    async ChangeArmyDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Создать отряд", "add"],
                    ["↘ Переместить отряд", "move"],
                    ["🎯 Изменить боевой опыт", "experience"],
                    ["♾ Изменить количество юнитов", "count"],
                    ["✏ Изменить заметку", "note"],
                    ["❌ Удалить отряд", "delete"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.CreateArmyDetachment(context, current_keyboard)
                action === "count" && await this.ChangeCountDetachment(context, current_keyboard)
                action === "move" && await this.MoveDetachment(context, current_keyboard)
                action === "note" && await this.ChangeNoteDetachment(context, current_keyboard)
                action === "experience" && await this.ChangeDetachmentExperience(context, current_keyboard)
                action === "delete" && await this.DeleteDetachment(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeClassUnits", e)
            }
        })
    }

    async DeleteDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой принадлежит отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const detachments = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("У фракции " + country.GetName(context.player.platform === "IOS") + " нет отрядов")
                    return resolve()
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите отряд, который хотите удалить", detachments.map(key => {return [`${key.dataValues.name} ${key.dataValues.count}`, "ID" + key.dataValues.id]}), current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(key => {return key.dataValues.id === detachment})[0]
                let accept = await InputManager.InputBoolean(context, "Вы уверены?", current_keyboard)
                if(!accept) return resolve()
                await Army.destroy({where: {id: detachment.dataValues.id}})
                await context.send("✅ Отряд удален", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async ChangeDetachmentExperience(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой принадлежит отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const detachments = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("У фракции " + country.GetName(context.player.platform === "IOS") + " нет отрядов")
                    return resolve()
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите отряд, который хотите переместить", detachments.map(key => {return [`${key.dataValues.name} ${key.dataValues.count}`, "ID" + key.dataValues.id]}), current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(key => {return key.dataValues.id === detachment})[0]
                let newExperience = await InputManager.InputInteger(context, "Сейчас опыт отряда равен  " + detachment.dataValues.experience + "\n\nВведите новое значение", current_keyboard, 0)
                if(!newExperience) return resolve()
                await Army.update({experience: newExperience}, {where: {id: detachment.dataValues.id}})
                await context.send("✅ Боевой опыт отряда установлен", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async ChangeNoteDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой принадлежит отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const detachments = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("У фракции " + country.GetName(context.player.platform === "IOS") + " нет отрядов")
                    return resolve()
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите отряд, который хотите переместить", detachments.map(key => {return [`${key.dataValues.name} ${key.dataValues.count}`, "ID" + key.dataValues.id]}), current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(key => {return key.dataValues.id === detachment})[0]
                let newNote = await InputManager.InputString(context, "Текст заметки: " + detachment.dataValues.note + "\n\nВведите новый текст заметки", current_keyboard)
                if(!newNote) return resolve()
                await Army.update({note: newNote}, {where: {id: detachment.dataValues.id}})
                await context.send("✅ Заметка изменена", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async MoveDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой принадлежит отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const detachments = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("У фракции " + country.GetName(context.player.platform === "IOS") + " нет отрядов")
                    return resolve()
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите отряд, который хотите переместить", detachments.map(key => {return [`${key.dataValues.name} ${key.dataValues.count}`, "ID" + key.dataValues.id]}), current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(key => {return key.dataValues.id === detachment})[0]
                let locateCountry = await InputManager.KeyboardBuilder(context, "Сейчас отряд находится в городе " + Data.cities[detachment.dataValues.location].name + " фракции " + Data.countries[Data.cities[detachment.dataValues.location].countryID]?.GetName() + "\nВведите новое местоположение отряда\n\nУкажите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!locateCountry) return resolve()
                locateCountry = Data.ParseButtonID(locateCountry)
                locateCountry = Data.countries[locateCountry]
                let locateCity = await InputManager.KeyboardBuilder(context, "Укажите город, в котором или рядом с которым располагается отряд", Data.GetCityForCountryButtons(locateCountry.id), current_keyboard)
                if(!locateCity) return resolve()
                locateCity = Data.ParseButtonID(locateCity)
                locateCity = Data.cities[locateCity]
                await Army.update({location: locateCity.id}, {where: {id: detachment.dataValues.id}})
                await context.send("✅ Местоположение установлено", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async ChangeCountDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const arrToObj = (arr) =>
                {
                    let obj = {}
                    for(const e of arr)
                    {
                        obj[e[0]] = e[1]
                    }
                    return obj
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой принадлежит отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const population = await PlayerStatus.count({where: {citizenship: country.id}})
                const detachments = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("У фракции " + country.GetName(context.player.platform === "IOS") + " нет отрядов")
                    return resolve()
                }
                let types = []
                for(const det of detachments) {if(!types.includes(det.dataValues.typeId)) types.push(det.dataValues.typeId)}
                types = await UnitType.findAll({where: {id: types}})
                types = arrToObj(types.map(key => {return [key.dataValues.id, key.dataValues]}))
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите отряд, который хотите изменить", detachments.map(key => {return [`${key.dataValues.name} ${key.dataValues.count}`, "ID" + key.dataValues.id]}), current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(key => {return key.dataValues.id === detachment})[0]
                let usedUnitPos = 0
                for(const det of detachments)
                {
                    if(detachment.dataValues.id === det.dataValues.id) continue
                    usedUnitPos += Math.ceil(det.dataValues.count / types[det.dataValues.typeId].citizenPrice)
                }
                usedUnitPos = population - usedUnitPos
                const count = await InputManager.InputInteger(context, "Введите количество юнитов в отряде, от 1 до " + usedUnitPos * types[detachment.dataValues.typeId].citizenPrice, current_keyboard, 0, usedUnitPos * types[detachment.dataValues.typeId].citizenPrice)
                if(!count) return resolve()
                await Army.update({count: count}, {where: {id: detachment.dataValues.id}})
                await context.send("✅ Количество установлено", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async CreateArmyDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const types = await UnitType.findAll()
                if(types.length === 0)
                {
                    await context.send("Перед созданием отряда добавьте типы юнитов")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, которой будет принадлежать отряд", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const classes = await UnitClass.findAll({where: {countryId: country.id}})
                if(classes.length === 0)
                {
                    await context.send("Перед созданием отряда добавьте юниты фракции " + country.GetName(), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let unitType = await InputManager.KeyboardBuilder(context, "Выберите тип юнита", types.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitType) return resolve()
                unitType = Data.ParseButtonID(unitType)
                unitType = types.filter(key => {return key.id === unitType})[0].dataValues
                let unitClass = await InputManager.KeyboardBuilder(context, "Выберите юнит", classes.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitClass) return resolve()
                unitClass = Data.ParseButtonID(unitClass)
                unitClass = classes.filter(key => {return key.id === unitClass})[0].dataValues

                const allCountryArmy = await Army.findAll({where: {ownerId: country.id, ownerType: "country"}})
                const population = await PlayerStatus.count({where: {citizenship: country.id}})
                let usedCitizens = 0
                for(const unit of allCountryArmy)
                {
                    let type = await UnitType.findOne({where: {id: unit.dataValues.typeId}})
                    if(!type) continue
                    usedCitizens += Math.ceil(unit.dataValues.count / type.dataValues.citizenPrice)
                }
                const freeCitizens = population - usedCitizens
                if(freeCitizens <= 0)
                {
                    await context.send("Не хватает граждан для формирования отряда этого типа", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const name = await InputManager.InputString(context, "Введите название отряда", current_keyboard)
                if(!name) return resolve()
                let count = await InputManager.InputInteger(context, "Введите количество юнитов в отряде (от 1 до " + (unitType.citizenPrice * freeCitizens) + ")", current_keyboard, 1, unitType.citizenPrice * freeCitizens)
                if(!count) return resolve()
                let rating = await InputManager.InputDefaultInteger(context, "Укажите боевой опыт этого отряда", current_keyboard, -1000000, 1000000, 0)
                if(rating === null) return resolve()
                let locateCountry = await InputManager.KeyboardBuilder(context, "Введите местоположение отряда\n\nУкажите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!locateCountry) return resolve()
                locateCountry = Data.ParseButtonID(locateCountry)
                locateCountry = Data.countries[locateCountry]
                let locateCity = await InputManager.KeyboardBuilder(context, "Укажите город, в котором или рядом с которым располагается отряд", Data.GetCityForCountryButtons(locateCountry.id), current_keyboard)
                if(!locateCity) return resolve()
                locateCity = Data.ParseButtonID(locateCity)
                locateCity = Data.cities[locateCity]
                let note = await InputManager.InputString(context, "Сделайте уточнение по местоположению отряда", current_keyboard)
                if(!note) return resolve()

                const request = "Отряд юнитов: " + unitClass.name + "\n" +
                    "Тип юнитов: " + unitType.name + "\n" +
                    "Принадлежит фракции " + country.GetName() + "\n" +
                    "Количество: " + count + "\n" +
                    "Боевой опыт: " + rating + "\n" +
                    "Располагается в фракции " + locateCountry.GetName() + ", в городе " + locateCity.name + ", " + note
                const accept = await InputManager.InputBoolean(context, request, current_keyboard)
                if(!accept) return resolve()
                await Army.create({
                    ownerId: country.id,
                    ownerType: "country",
                    typeId: unitType.id,
                    classId: unitClass.id,
                    count: count,
                    experience: rating,
                    note: note,
                    name: name,
                    location: locateCity.id
                })
                await context.send("✅ Отряд создан", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async ChangeTypeUnits(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить тип", "add"],
                    ["✏ Изменить тип", "edit"],
                    ["❌ Удалить тип", "delete"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.AddUnitType(context, current_keyboard)
                action === "edit" && await this.EditUnitType(context, current_keyboard)
                action === "delete" && await this.DeleteUnitType(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeClassUnits", e)
            }
        })
    }

    async DeleteUnitType(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const classes = await UnitType.findAll()
                if(classes.length === 0)
                {
                    await context.send("Типы не добавлены")
                    return resolve()
                }
                let unitType = await InputManager.KeyboardBuilder(context, "Выберите тип, который вы хотите удалить", classes.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitType) return resolve()
                unitType = Data.ParseButtonID(unitType)
                unitType = classes.filter(key => {return key.id === unitType})[0].dataValues
                const accept = await InputManager.InputBoolean(context, `Вы действительно хотите удалить тип ${unitType.name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
                }
                await UnitType.destroy({where: {id: unitType.id}})
                await Army.destroy({where: {typeId: unitType.id}})
                await context.send("✅ Тип удален", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/EditUnitClass", e)
            }
        })
    }

    async EditUnitType(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const classes = await UnitType.findAll()
                if(classes.length === 0)
                {
                    await context.send("Типы не добавлены")
                    return resolve()
                }
                let unitType = await InputManager.KeyboardBuilder(context, "Выберите тип юнита, который вы хотите отредактировать", classes.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitType) return resolve()
                unitType = Data.ParseButtonID(unitType)
                unitType = classes.filter(key => {return key.id === unitType})[0].dataValues
                let name = await InputManager.InputString(context, `Текущее название: ${unitType.name}\n\nВведите новое название класса юнита\n\nЧтобы пропустить нажмите \"отмена\"`, current_keyboard)
                if(!name) name = unitType.name

                let accept = await InputManager.InputBoolean(context, "Изменить цену тренировки типа юнита?", current_keyboard)
                let newPrice = JSON.parse(unitType.price)
                if(accept)
                {
                    newPrice = await InputManager.InputPrice(context, "Введите новую цену тренировки", current_keyboard)
                    if(!newPrice) newPrice = JSON.parse(unitType.price)
                }
                accept = await InputManager.InputBoolean(context, "Изменить стоимость содержания типа юнита?", current_keyboard)
                let newService = JSON.parse(unitType.price)
                if(accept)
                {
                    newService = await InputManager.InputPrice(context, "Введите новую стоимость содержания", current_keyboard)
                    if(!newPrice) newService = JSON.parse(unitType.price)
                }
                let barracksLVL = await InputManager.InputInteger(context, "Введите уровень казармы, с которого будет доступна тренировка юнита такого типа, чтобы оставить как есть, нажмите отмена", current_keyboard, 1, 4)
                if(!barracksLVL) barracksLVL = unitType.barracksLVL
                let citizenPrice = await InputManager.InputInteger(context, "Введите сколько можно будет натренировать юнитов такого типа за одного гражданина, чтобы оставить как есть, нажмите отмена", current_keyboard, 1)
                if(!citizenPrice) citizenPrice = unitType.citizenPrice

                await UnitType.update({
                    name: name,
                    price: JSON.stringify(newPrice),
                    service: JSON.stringify(newService),
                    barracksLVL: barracksLVL,
                    citizenPrice: citizenPrice
                }, {where: {id: unitType.id}})
                await context.send("✅ Тип обновлен", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/EditUnitClass", e)
            }
        })
    }

    async AddUnitType(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const name = await InputManager.InputString(context, "Введите название типа юнита", current_keyboard)
                if(!name) return resolve()

                const price = await InputManager.InputPrice(context, "Укажите цену покупки юнита этого типа", current_keyboard)
                if(!price) return resolve()
                const service = await InputManager.InputPrice(context, "Укажите цену поддержки юнита этого типа", current_keyboard, true)
                if(!service) return resolve()
                const barracksLVL = await InputManager.InputInteger(context, "Укажите уровень казармы, с которого будет доступна тренировка юнита такого типа", current_keyboard, 1, 4)
                if(!barracksLVL) return resolve()
                const citizenPrice = await InputManager.InputInteger(context, "Укажите сколько юнитов такого типа можно будет натренировать за одного гражданина", current_keyboard, 1,)
                if(!citizenPrice) return resolve()

                const accept = await InputManager.InputBoolean(context, `\nНазвание типа: ${name}\nУровень казармы:\n${barracksLVL}\nЦена покупки: ${NameLibrary.GetPrice(price)}\n\nСтоимость содержания: ${NameLibrary.GetPrice(service)}\n\nВерно?`, current_keyboard)
                if(!accept) return resolve()
                await UnitType.create({
                    name: name,
                    price: JSON.stringify(price),
                    service: JSON.stringify(service),
                    barracksLVL: barracksLVL,
                    citizenPrice: citizenPrice
                })
                await context.send("✅ Тип юнита создан", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddUnitClass", e)
            }
        })
    }

    async ChangeClassUnits(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить юнит", "add"],
                    ["✏ Изменить юнит", "edit"],
                    ["❌ Удалить юнит", "delete"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.AddUnitClass(context, current_keyboard)
                action === "edit" && await this.EditUnitClass(context, current_keyboard)
                action === "delete" && await this.DeleteUnitClass(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeClassUnits", e)
            }
        })
    }

    async AddUnitClass(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const showTags = (array) => {
                    if(array.length === 0) return "Тегов нет"
                    let request = `Список тегов:\n\n`
                    for(const tag of array)
                    {
                        request += "- " + tag + "\n"
                    }
                    return request
                }

                const name = await InputManager.InputString(context, "Введите название юнита", current_keyboard)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "Введите описание юнита", current_keyboard)
                if(!description) return resolve()
                let country = await InputManager.KeyboardBuilder(context, "Выберите  фракцию, которой будет принадлежать юнит", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                await context.send("Укажите теги этого юнита.\n\nТеги нужны для того чтобы быстро запрашивать информацию об конкретном юните, изменять характеристики и т.д.\n\nТегом может являться часть слова: с тегом \"кавалер\" бот найдет совпадения в словах \"КАВАЛЕР\", \"КАВАЛЕРия\", \"КАВАЛЕРийский\" и т.д.\n\nБудьте аккуратны, если теги будут пересекаться, то бот может выдавать не верный результат")
                let tags = []
                let newTag = ""
                do
                {
                    await context.send(showTags(tags))
                    newTag = await InputManager.InputString(context, "Введите новый тег", current_keyboard)
                    if(newTag)
                    {
                        tags.push(newTag.toLowerCase())
                    }
                }
                while(newTag)
                if(tags.length === 0) return resolve()
                newTag = tags.join("|")

                const accept = await InputManager.InputBoolean(context, `${country.GetName(context.player.platform === "IOS")}\nНазвание: ${name}\nОписание:\n${description}\n\nВерно?`, current_keyboard)
                if(!accept) return resolve()
                await UnitClass.create({
                    name: name,
                    description: description,
                    countryId: country.id,
                    tag: newTag
                })
                await context.send("✅ Юнит создан", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/AddUnitClass", e)
            }
        })
    }

    async EditUnitClass(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const showTags = (array) => {
                    if(array.length === 0) return "Тегов нет"
                    let request = `Список тегов:\n\n`
                    for(const tag of array)
                    {
                        request += "- " + tag + "\n"
                    }
                    return request
                }

                const classes = await UnitClass.findAll()
                if(classes.length === 0)
                {
                    await context.send("Юниты не добавлены")
                    return resolve()
                }
                let unitClass = await InputManager.KeyboardBuilder(context, "Выберите юнит, который вы хотите отредактировать", classes.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitClass) return resolve()
                unitClass = Data.ParseButtonID(unitClass)
                unitClass = classes.filter(key => {return key.id === unitClass})[0].dataValues
                let name = await InputManager.InputString(context, `Название: ${unitClass.name}\n\nВведите новое название юнита\n\nЧтобы пропустить нажмите \"отмена\"`, current_keyboard)
                if(!name) name = unitClass.name
                let description = await InputManager.InputString(context, `Описание: ${unitClass.description}\n\nВведите новое описание юнита\n\nЧтобы пропустить нажмите \"отмена\"`, current_keyboard)
                if(!description) description = unitClass.description

                let newTag = ""
                let tags = unitClass.tag ? unitClass.tag.split("|") : []
                const action = await InputManager.ChooseButton(context, "Выберите что сделать с тегами:", [[keyboard.deleteButton, keyboard.skipButton, keyboard.addButton]])
                if(action === "add")
                {
                    do
                    {
                        await context.send(showTags(tags))
                        newTag = await InputManager.InputString(context, "Введите новый тег", current_keyboard)
                        if(newTag)
                        {
                            tags.push(newTag.toLowerCase())
                        }
                    }
                    while(newTag)
                    if(tags.length === 0) return resolve()
                    newTag = tags.join("|")
                }
                else if(action === "delete")
                {
                    if(tags.length === 0)
                    {
                        await context.send("Нет тегов", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                    let tagsKB = []
                    for(const tag of tags)
                    {
                        tagsKB.push([tag, tag])
                    }
                    let newTag = await InputManager.KeyboardBuilder(context, "Выберите тег, который вы хотите убрать", tagsKB, current_keyboard)
                    if(!newTag) return resolve()
                    tags = tags.filter(key => {return key !== newTag})
                    if(tags.length !== 0)
                    {
                        newTag = tags.join("|")
                    }
                }
                else
                {
                    newTag = tags.join("|")
                }

                let country = await InputManager.KeyboardBuilder(context, `Сейчас юнит принадлежит фракции: ${Data.countries[unitClass.countryId]?.GetName(context.player.platform === "IOS")}\n\nВыберите новую фракцию, которой будет принадлежать юнит, отмена = оставить прежнюю`, Data.GetCountryButtons(), current_keyboard)
                if(country)
                {
                    country = Data.ParseButtonID(country)
                    country = Data.countries[country].id
                }
                else
                {
                    country = unitClass.countryId
                }
                await UnitClass.update({
                    name: name,
                    description: description,
                    countryId: country,
                    tag: newTag
                }, {where: {id: unitClass.id}})
                await context.send("✅ Юнит обновлен", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/EditUnitClass", e)
            }
        })
    }

    async DeleteUnitClass(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const classes = await UnitClass.findAll()
                if(classes.length === 0)
                {
                    await context.send("Юниты не добавлены")
                    return resolve()
                }
                let unitClass = await InputManager.KeyboardBuilder(context, "Выберите юнит, который вы хотите удалить", classes.map(key => {return [key.name, "ID" + key.id]}), current_keyboard)
                if(!unitClass) return resolve()
                unitClass = Data.ParseButtonID(unitClass)
                unitClass = classes.filter(key => {return key.id === unitClass})[0].dataValues
                const accept = await InputManager.InputBoolean(context, `Вы действительно хотите удалить юнит ${unitClass.name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
                }
                await UnitClass.destroy({where: {id: unitClass.id}})
                await Army.destroy({where: {classId: unitClass.id}})
                await context.send("✅ Юнит удален", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/EditUnitClass", e)
            }
        })
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

    async SubscribeToMemory(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const now = new Date()
                let time
                if(context.player.botForgotTime - now > 0)
                {
                    time = context.player.botForgotTime
                }
                else
                {
                    time = now
                }
                time.setMonth(time.getMonth() + 1)
                time.setDate(time.getDate() + 1)
                time.setHours(0)
                time.setMinutes(0)
                time.setSeconds(0)
                time.setMilliseconds(0)
                const request = "ℹ С этой подпиской бот сможет запоминать заданные вами фразы, фото, видео и музыку.\n" +
                    "ℹ По вызову через команду проверки бота \"бот\" в общедоступных чатах, бот будет выдавать не случайную заготовку, а то, что вы дадите боту.\n\n" +
                    "Стоимость подписки на месяц:\n" +
                    "💎 Алмазы: 1\n\n" +
                    "ℹПодписка будет активна до " + NameLibrary.ParseDateTime(time.toString()) + "\n\n" +
                    "ℹ В вашем инвентаре " + context.player.diamond + " алмазов\n\n"
                if(context.player.diamond < 1)
                {
                    await context.send(request + "⚠ У вас не хватает алмазов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, request + "Оформить подписку?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                context.player.botForgotTime = time
                await PlayerStatus.update({botForgotTime: time}, {where: {id: context.player.id}})
                await Data.AddPlayerResources(context.player.id, {diamond: -1})
                await context.send("✅ Вы оформили месячный доступ к командам:\n\n🔸\"Бот запомни\" - бот будет отзываться заданной вами после этой команды фразой (можно прикрепить фото, видео и музыку)\n\n🔸\"Бот забудь\" - бот сбрасывает заданную вами фразу и начинает отвечать заготовками по умолчанию\n\nℹ Примечание: когда срок подписки истечет, заданная вами фраза останется с вами, но для того чтобы поставить новую - надо будет продлить подписку.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/CreateUnit", e)
            }
        })
    }

    async SubscribeToTalking(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const now = new Date()
                let time
                if(context.player.botCallTime - now > 0)
                {
                    time = context.player.botCallTime
                }
                else
                {
                    time = now
                }
                time.setMonth(time.getMonth() + 1)
                time.setDate(time.getDate() + 1)
                time.setHours(0)
                time.setMinutes(0)
                time.setSeconds(0)
                time.setMilliseconds(0)
                const request = "ℹ С этой подпиской вам станет доступно общение с ботом в чатах без ограничений, также откроется отдельное меню в ЛС, через которое можно напрямую общаться с ботом\n\n" +
                    "Стоимость подписки на месяц:\n" +
                    "💎 Алмазы: 1\n\n" +
                    "ℹПодписка будет активна до " + NameLibrary.ParseDateTime(time.toString()) + "\n\n" +
                    "ℹ В вашем инвентаре " + context.player.diamond + " алмазов\n\n"
                if(context.player.diamond < 1)
                {
                    await context.send(request + "⚠ У вас не хватает алмазов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, request + "Оформить подписку?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                context.player.botCallTime = time
                await PlayerStatus.update({botCallTime: time}, {where: {id: context.player.id}})
                await Data.AddPlayerResources(context.player.id, {diamond: -1})
                await context.send("✅ Вы оформили месячный безлимитный доступ к ChatGPT, в главном меню должна появиться кнопка \"Поговорить с ботом\", а в чатах у вас больше не будет ограничений по интервалу", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async TrainUnit(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const arrToObj = (arr) =>
                {
                    let obj = {}
                    for(const e of arr)
                    {
                        obj[e[0]] = e[1]
                    }
                    return obj
                }
                const detachments = await Army.findAll({where: {ownerId: context.country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("⚠ ГМ-ы не добавили вам отряды", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = [context.country.GetResources() + "\n\n"]
                let page = 0
                const kb = []
                for(const det of detachments)
                {
                    let type = await UnitType.findOne({where: {id: det.dataValues.typeId}})
                    if(!type) continue
                    let unit = await UnitClass.findOne({where: {id: det.dataValues.classId}})
                    if(!unit) continue
                    if(type.dataValues.barracksLVL > context.country.barracksLevel) continue
                    kb.push([det.dataValues.name, "ID" + det.dataValues.id])
                    request[page] += "🟢 Отряд " + det.dataValues.name + "\n"
                    request[page] += "💂‍♂ Юнит " + unit.dataValues.name + "\n"
                    request[page] += "Количество: " + det.dataValues.count + "\n"
                    request[page] += "Количество за одного гражданина: " + type.dataValues.citizenPrice + "\n"
                    request[page] += "Тип: " + type.dataValues.name + "\n"
                    request[page] += "Описание: " + unit.dataValues.description + "\n"
                    request[page] += "Боевой опыт: " + det.dataValues.explanation + "\n"
                    request[page] += "Доступен с казармы " + type.dataValues.barracksLVL + " уровня" + "\n"
                    request[page] += "💸 Стоимость (за один):\n" + NameLibrary.GetPrice(JSON.parse(type.dataValues.price))
                    request[page] += "💸 Содержание (за один):\n" + NameLibrary.GetPrice(JSON.parse(type.dataValues.service))
                    request[page] += "\n\n"
                    if(request[page].length > 3500)
                    {
                        page ++
                        request[page] = ""
                    }
                }
                if(kb.length === 0)
                {
                    await context.send(`⚠ Нет доступных юнитов для казармы ${context.country.barracksLevel} уровня`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(const part of request)
                {
                    await context.send(part)
                }
                let types = []
                for(const det of detachments) {if(!types.includes(det.dataValues.typeId)) types.push(det.dataValues.typeId)}
                types = await UnitType.findAll({where: {id: types}})
                types = arrToObj(types.map(key => {return [key.dataValues.id, key.dataValues]}))
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите, какой отряд вы хотите пополнить", kb, current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(u => {return u.dataValues.id === detachment})[0]
                const population = await PlayerStatus.count({where: {citizenship: context.country.id}})
                let usedUnitPos = 0
                for(const det of detachments)
                {
                    if(detachment.dataValues.id === det.dataValues.id) continue
                    usedUnitPos += Math.ceil(det.dataValues.count / types[det.dataValues.typeId].citizenPrice)
                }
                usedUnitPos = (population - usedUnitPos) * types[detachment.dataValues.typeId].citizenPrice
                if(usedUnitPos <= 0)
                {
                    await context.send("⚠ У вас слишком мало граждан для пополнения этого отряда", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const count = await InputManager.InputInteger(context, "Введите сколько юнитов вы хотите добавить, от 1 до " + (usedUnitPos - detachment.dataValues.count), 1, usedUnitPos - detachment.dataValues.count)
                if(!count) return resolve()
                if(!context.country.CanPay(NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].price), count)))
                {
                    await context.send("🚫 В бюджете не хватает ресурсов для тренировки такого количества юнитов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Вы хотите натренировать ${count} юнитов в отряд "${detachment.dataValues.name}"\n\nЭто будет стоить:\n${NameLibrary.GetPrice(NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].price), count))}\n\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].price), count))
                detachment.set({count: detachment.dataValues.count + count})
                await detachment.save()
                await context.send("✅ Отряды пополнены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async RefuseUnit(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const detachments = await Army.findAll({where: {ownerId: context.country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("⚠ ГМ-ы не добавили вам отряды", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = [context.country.GetResources() + "\n\n"]
                let page = 0
                const kb = []
                for(const det of detachments)
                {
                    let type = await UnitType.findOne({where: {id: det.dataValues.typeId}})
                    if(!type) continue
                    let unit = await UnitClass.findOne({where: {id: det.dataValues.classId}})
                    if(!unit) continue
                    if(det.dataValues.count <= 0) continue
                    kb.push([unit.dataValues.name, "ID" + unit.dataValues.id])
                    request[page] += "🟢 Отряд " + det.dataValues.name + "\n"
                    request[page] += "💂‍♂ Юнит " + unit.dataValues.name + "\n"
                    request[page] += "Количество: " + det.dataValues.count + "\n"
                    request[page] += "Тип: " + type.dataValues.name + "\n"
                    request[page] += "Боевой опыт: " + det.dataValues.explanation + "\n"
                    request[page] += "💸 Содержание (за один):\n" + NameLibrary.GetPrice(JSON.parse(type.dataValues.service))
                    request[page] += "💸 Содержание (полное):\n" + NameLibrary.GetPrice(NameLibrary.PriceMultiply(JSON.parse(type.dataValues.service), det.dataValues.count))
                    request[page] += "\n\n"
                    if(request[page].length > 3500)
                    {
                        page ++
                        request[page] = ""
                    }
                }
                if(kb.length === 0)
                {
                    await context.send(`⚠ Все отряды пусты`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(const part of request)
                {
                    await context.send(part)
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите, какой отряд вы хотите сократить", kb, current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(u => {return u.dataValues.id === detachment})[0]

                let count = await InputManager.InputInteger(context, `Введите количество юнитов (сколько их останется после сокращения)`, current_keyboard, 0, detachment.dataValues.count)
                if(count === null) return resolve()
                const accept = await InputManager.InputBoolean(context, `Вы хотите сократить ${detachment.dataValues.count - count} юнитов отряда ${detachment.dataValues.name}, останется ${count}\n\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                detachment.set({count: count})
                await detachment.save()
                await context.send("✅ Отряд сокращен", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async TrainDetachment(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const arrToObj = (arr) =>
                {
                    let obj = {}
                    for(const e of arr)
                    {
                        obj[e[0]] = e[1]
                    }
                    return obj
                }
                const detachments = await Army.findAll({where: {ownerId: context.country.id, ownerType: "country"}})
                if(detachments.length === 0)
                {
                    await context.send("⚠ ГМ-ы не добавили вам отряды", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let types = []
                for(const det of detachments) {if(!types.includes(det.dataValues.typeId)) types.push(det.dataValues.typeId)}
                types = await UnitType.findAll({where: {id: types}})
                types = arrToObj(types.map(key => {return [key.dataValues.id, key.dataValues]}))
                let request = [context.country.GetResources() + "\n\n"]
                let page = 0
                const kb = []
                let now = new Date()
                for(const det of detachments)
                {
                    let unit = await UnitClass.findOne({where: {id: det.dataValues.classId}})
                    if(!unit) continue
                    let city = await City.findOne({where: {id: det.dataValues.location}})
                    if(!city) continue
                    if(det.dataValues.count <= 0) continue
                    let trainEnd = new Date(det.dataValues.trainEndTime)
                    request[page] += "🟢 Отряд " + det.dataValues.name + "\n"
                    request[page] += "💂‍♂ Юнит " + unit.dataValues.name + "\n"
                    request[page] += "Количество: " + det.dataValues.count + "\n"
                    request[page] += "Тип: " + types[det.dataValues.typeId]?.name + "\n"
                    if(now - trainEnd <= 0)
                    {
                        request[page] += "До окончания тренировки " + NameLibrary.ParseFutureTime(trainEnd)
                        request[page] += "\n\n"
                        continue
                    }
                    if(city.dataValues.countryID !== context.country.id)
                    {
                        request[page] += "⚠ Отряд находится вне фракции, невозможно тренировать"
                        request[page] += "\n\n"
                        continue
                    }
                    kb.push([unit.dataValues.name, "ID" + unit.dataValues.id])
                    request[page] += "\n\n"
                    if(request[page].length > 3500)
                    {
                        page ++
                        request[page] = ""
                    }
                }
                if(kb.length === 0)
                {
                    await context.send(`⚠ Все отряды пусты или тренируются или находятся за границей фракции`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(const part of request)
                {
                    await context.send(part)
                }
                let detachment = await InputManager.KeyboardBuilder(context, "Выберите, какой отряд вы хотите отправить тренироваться", kb, current_keyboard)
                if(!detachment) return resolve()
                detachment = Data.ParseButtonID(detachment)
                detachment = detachments.filter(u => {return u.dataValues.id === detachment})[0]
                if(!context.country.CanPay(NameLibrary.ReversePrice(NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].service), detachment.dataValues.count))))
                {
                    await context.send(`⚠ В бюджете не хватает ресурсов для оплаты тренировки`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Время тренировки отряда 1 неделя, во время тренировки отряды будут заморожены, цена тренировки - недельное снабжение отряда, а именно:\n${NameLibrary.GetPrice(NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].service), detachment.dataValues.count))}\n\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                now.setDate(now.getDate() + 7)
                detachment.set({trainEndTime: now, experience: detachment.dataValues.experience + 2})
                await detachment.save()
                await Data.AddCountryResources(context.country.id, NameLibrary.ReversePrice(NameLibrary.PriceMultiply(JSON.parse(types[detachment.dataValues.typeId].service), detachment.dataValues.count)))
                await context.send("✅ Отряд отправлен на тренировку", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async UpgradeBarak(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.barracksLevel >= 4)
                {
                    await context.send("✅ Казарма уже максимально улучшена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`2️⃣ Улучшение для казармы фракции ${context.country.GetName(context.player.platform === "IOS")}:\n ${context.country.barracksLevel} уровень => ${context.country.barracksLevel + 1} уровень\n${NameLibrary.GetPrice(Prices["barracks_lvl" + (context.country.barracksLevel + 1)])}`)
                if(!context.country.CanPay(Prices["barracks_lvl" + (context.country.barracksLevel + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, Prices["barracks_lvl" + (context.country.barracksLevel + 1)])
                context.country.barracksLevel += 1
                await Country.update({barracksLevel: context.country.barracksLevel}, {where: {id: context.country.id}})
                await context.send(`✅ Казарма улучшена до ${context.country.barracksLevel} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async UnitsExpenses(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                const army = await Army.findAll({where: {ownerId: context.country.id, ownerType: "country"}})
                let prices = []
                if(army.length === 0)
                {
                    await context.send("⚠ ГМ-ы еще не добавили вам отряды")
                    return resolve()
                }
                for(const dec of army)
                {
                    let type = await UnitType.findOne({where: {id: dec.dataValues.typeId}})
                    if(!type) continue
                    type = JSON.parse(type.dataValues.service)
                    prices.push(NameLibrary.PriceMultiply(type, dec.dataValues.count))
                }
                await context.send("💸 Общая стоимость содержания в неделю:\n" + NameLibrary.GetPrice(NameLibrary.PriceSum(prices)))
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/SubscribeToTalking", e)
            }
        })
    }

    async GetAllUserResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                if(keys.length === 0)
                {
                    await context.send("⚠ У вас нет своих построек в этом городе")
                    return resolve()
                }
                let request = "ℹ Добыча из ваших построек:\n\n"
                let flag = false
                let isVoid = true
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 4)
                let extraction = {}
                let tax = {}
                let countryIncome = 0
                let extract = 0
                let resource = ""
                let isProperty = false
                for(let i = 0, j = 0; i < Data.buildings[context.player.location]?.length; i++)
                {
                    if(Data.buildings[context.player.location][i].ownerType === "user" && Data.buildings[context.player.location][i].type.match(/wheat|stone|wood|iron|silver/))
                    {
                        isProperty = false
                        for(const key of keys)
                        {
                            if(key.dataValues.houseID === Data.buildings[context.player.location][i].id && !Data.buildings[context.player.location][i]?.isFreezing)
                            {
                                isProperty = true
                                break
                            }
                        }
                        if(!isProperty) continue
                        flag = true
                        j++
                        request += "\n" + (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.player.location][i].type) + " \"" + Data.buildings[context.player.location][i].name + "\" "
                        if(Data.buildings[context.player.location][i].lastActivityTime - time <= 0)
                        {
                            isVoid = false
                            resource = Data.buildings[context.player.location][i].type.replace("building_of_", "")
                            extract = Data.buildings[context.player.location][i].GetExtraction()
                            countryIncome = Math.round(extract * (Data.GetCountryForCity(context.player.location).privateBuildingTax / 100))
                            extract -= countryIncome
                            request += ` - добыто ${extract} (налог ${countryIncome})`
                            Data.buildings[context.player.location][i].lastActivityTime = future
                            await Data.buildings[context.player.location][i].SaveWorkTime()
                            extraction[resource] = extraction[resource] ? extraction[resource] + extract : extract
                            tax[resource] = tax[resource] ? tax[resource] + countryIncome : countryIncome
                        }
                        else
                        {
                            request += " - через " + NameLibrary.ParseFutureTime(Data.buildings[context.player.location][i].lastActivityTime)
                        }
                    }
                }
                if(!flag)
                {
                    await context.send("⚠ У вас нет построек для добычи ресурсов в этом городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!isVoid)
                {
                    const city = context.player.location
                    if(Data.timeouts["user_timeout_resources_ready_" + context.player.id])
                    {
                        clearTimeout(Data.timeouts["user_timeout_resources_ready_" + context.player.id].timeout)
                        delete Data.timeouts["user_timeout_resources_ready_" + context.player.id]
                    }
                    Data.timeouts["user_timeout_resources_ready_" + context.player.id] = {
                        type: "user_timeout",
                        subtype: "resources_ready",
                        userId: context.player.id,
                        cityID: city,
                        time: future,
                        timeout: setTimeout(async () =>
                        {
                            await context.send(`✅ Ваши постройки в городе ${Data.cities[city].name} завершили добычу ресурсов, а это значит что снова пора собирать ресурсы!`)
                            delete Data.timeouts["country_timeout_resources_ready_" + context.player.id]
                        }, 14400000)
                    }
                }
                request += isVoid ? "" : (`\n\nДобыто всего (после взятия налога ${Data.GetCountryForCity(context.player.location).privateBuildingTax}%):\n` + NameLibrary.GetPrice(extraction))
                await Data.AddPlayerResources(context.player.id, extraction)
                await Data.AddCountryResources(context.player.countryID, tax)
                await context.send(request)
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetAllUserResources", e)
            }
        })
    }

    async CountryNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить заметку", "add_note"],
                    ["📜 Просмотреть заметки", "remove_note"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add_note" && await this.AddCountryNote(context, current_keyboard)
                action === "remove_note" && await this.ViewCountryNotes(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async ViewCountryNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let request = [""]
                let page = 0
                let messages = await sequelize.query(`SELECT "note", "createdAt" FROM "country-notes" WHERE "countryID"=${country.id} ORDER BY id DESC LIMIT 10`)
                messages = messages[0]
                if(messages.length > 0)
                {
                    for (let i = messages.length - 1; i >= 0; i--)
                    {
                        request[page] += "🔸 Заметка от " + NameLibrary.ParseDateTime(messages[i].createdAt) + ":\nℹ " + messages[i].note + "\n\n"
                        if(request[page].length > 3500)
                        {
                            page ++
                            request[page] = ""
                        }
                    }
                }
                else
                {
                    request[page] += "Не добавлено"
                }
                for(const msg of request)
                {
                    await context.send(msg, {keyboard: keyboard.build(current_keyboard)})
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async AddCountryNote(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const note = await InputManager.InputString(context, "Напишите новую заметку (до 4096 символов)", current_keyboard, 2, 4096)
                if(!note) return resolve()
                await CountryNotes.create({
                    countryID: country.id,
                    note: note
                })
                await context.send("✅ Заметка добавлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async CityNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить заметку", "add_note"],
                    ["📜 Просмотреть заметки", "remove_note"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add_note" && await this.AddCityNote(context, current_keyboard)
                action === "remove_note" && await this.ViewCityNotes(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async ViewCityNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", Data.GetCityForCountryButtons(country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                let request = [""]
                let page = 0
                let messages = await sequelize.query(`SELECT "note", "createdAt" FROM "city-notes" WHERE "cityID"=${city} ORDER BY id DESC LIMIT 10`)
                messages = messages[0]
                if(messages.length > 0)
                {
                    for (let i = messages.length - 1; i >= 0; i--)
                    {
                        request[page] += "🔸 Заметка от " + NameLibrary.ParseDateTime(messages[i].createdAt) + ":\nℹ " + messages[i].note + "\n\n"
                        if(request[page].length > 3500)
                        {
                            page ++
                            request[page] = ""
                        }
                    }
                }
                else
                {
                    request[page] += "Не добавлено"
                }
                for(const msg of request)
                {
                    await context.send(msg, {keyboard: keyboard.build(current_keyboard)})
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async AddCityNote(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", Data.GetCityForCountryButtons(country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                const note = await InputManager.InputString(context, "Напишите новую заметку (до 4096 символов)", current_keyboard, 2, 4096)
                if(!note) return resolve()
                await CityNotes.create({
                    cityID: city,
                    note: note
                })
                await context.send("✅ Заметка добавлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async PlayerNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить заметку", "add_note"],
                    ["📜 Просмотреть заметки", "remove_note"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add_note" && await this.AddPlayerNote(context, current_keyboard)
                action === "remove_note" && await this.ViewPlayerNotes(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async ViewPlayerNotes(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let player = await InputManager.InputUser(context, "Выберите игрока", current_keyboard)
                if(!player) return resolve()
                let request = [""]
                let page = 0
                let messages = await sequelize.query(`SELECT "note", "createdAt" FROM "player-notes" WHERE "playerID"=${player.dataValues.id} ORDER BY id DESC LIMIT 10`)
                messages = messages[0]
                if(messages.length > 0)
                {
                    for (let i = messages.length - 1; i >= 0; i--)
                    {
                        request[page] += "🔸 Заметка от " + NameLibrary.ParseDateTime(messages[i].createdAt) + ":\nℹ " + messages[i].note + "\n\n"
                        if(request[page].length > 3500)
                        {
                            page ++
                            request[page] = ""
                        }
                    }
                }
                else
                {
                    request[page] += "Не добавлено"
                }
                for(const msg of request)
                {
                    await context.send(msg, {keyboard: keyboard.build(current_keyboard)})
                }
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async AddPlayerNote(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let player = await InputManager.InputUser(context, "Выберите игрока", current_keyboard)
                if(!player) return resolve()
                const note = await InputManager.InputString(context, "Напишите новую заметку (до 4096 символов)", current_keyboard, 2, 4096)
                if(!note) return resolve()
                await PlayerNotes.create({
                    playerID: player.dataValues.id,
                    note: note
                })
                await context.send("✅ Заметка добавлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async SetCountryVariable(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let kb = [
                    ["🏆 Стабильность", "stability"],
                    ["🌾 Крестьянство", "peasantry"],
                    ["🙏 Религия", "religion"],
                    ["👑 Аристократия", "aristocracy"],
                    ["⚔ Военные", "military"],
                    ["💰 Купечество", "merchants"]
                ]
                if(process.env["MINIROUND"])
                {
                    kb = kb.concat([
                        ["🥕 Очки Благосостояния", "blessingScore"],
                        ["💱 Очки Экономики", "economicScore"],
                        ["🧨 Лояльность", "loyalty"],
                        ["📈 Пассивный доход", "income"]
                    ])
                }
                const variable = await InputManager.KeyboardBuilder(context, "Выберите, какую переменную вы хотите установить", kb, current_keyboard)
                if(!variable) return resolve()
                const count = await InputManager.InputInteger(context, "Введите новое значение", current_keyboard)
                if(count === null) return resolve()
                country[variable] = count
                let obj = {}
                obj[variable] = count
                await Country.update(obj, {where: {id: country.id}})
                await context.send("✅ Переменная установлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeUnitRating", e)
            }
        })
    }

    async FreezeBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", Data.GetCityButtons(), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                if(!Data.buildings[city])
                {
                    await context.send("🚫 В городе нет зданий", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buttons = []
                for(let i = 0; i < Data.buildings[city].length; i++)
                {
                    buttons.push([Data.buildings[city][i].name, "ID" + i])
                }
                let build = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите здание", buttons, current_keyboard)
                if(!build) return resolve()
                build = Data.ParseButtonID(build)
                build = Data.buildings[city][build]
                let freeze = await InputManager.InputBoolean(context, `Сейчас ${build.name} ${build.isFreezing ? "" : "не "}заморожено`, current_keyboard, keyboard.freezeButton, keyboard.unfreezeButton)
                build.isFreezing = freeze
                await Buildings.update({freezing: freeze}, {where: {id: build.id}})
                await context.send(freeze ? "✅ Постройка заморожена" : "✅ Постройка разморожена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetBuildingInfo", e)
            }
        })
    }

    async KillPlayer(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let player = await InputManager.InputUser(context, "Выберите игрока которого хотите убить", current_keyboard)
                if(!player) return resolve()
                if(NameLibrary.RoleEstimator(player.dataValues.role) !== 0)
                {
                    await context.send("🚫 Убить можно только простого игрока", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let res = await PlayerResources.findOne({where: {id: player.dataValues.id}})
                let status = await PlayerStatus.findOne({where: {id: player.dataValues.id}})
                let info = await PlayerInfo.findOne({where: {id: player.dataValues.id}})
                let lastWill = await LastWills.findOne({where: {userID: player.dataValues.id}})
                let will = false
                if(lastWill)
                {
                    let user = await Player.findOne({where: {id: lastWill.dataValues.successorID}})
                    will = await InputManager.InputBoolean(context, `У игрока *id${player.dataValues.id}(${player.dataValues.nick}) есть завещание:\n\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nТекст: ${lastWill.dataValues.text}\n\nВыполнить условия завещания?`, current_keyboard)
                }
                let access = await InputManager.InputBoolean(context, `Убить персонажа игрока *id${player.dataValues.id}(${player.dataValues.nick})?`, current_keyboard)
                if(!access) return resolve()
                await Country.update({leaderID: null}, {where: {leaderID: player.dataValues.id}})
                if(will)
                {
                    await Data.AddPlayerResources(lastWill.dataValues.successorID, {
                        money: res.dataValues.money,
                        stone: res.dataValues.stone,
                        wood: res.dataValues.wood,
                        wheat: res.dataValues.wheat,
                        iron: res.dataValues.iron,
                        silver: res.dataValues.silver,
                        diamond: res.dataValues.diamond
                    })
                    await Buildings.update({ownerID: lastWill.dataValues.successorID}, {where: {ownerID: player.dataValues.id}})
                    await Keys.update({ownerID: lastWill.dataValues.successorID}, {where: {ownerID: player.dataValues.id}})
                }
                else
                {
                    await Data.AddCountryResources(status.dataValues.countryID, {
                        money: res.dataValues.money,
                        stone: res.dataValues.stone,
                        wood: res.dataValues.wood,
                        wheat: res.dataValues.wheat,
                        iron: res.dataValues.iron,
                        silver: res.dataValues.silver,
                        diamond: res.dataValues.diamond
                    })
                    await Buildings.update({ownerID: 0, ownerType: "country"}, {where: {ownerID: player.dataValues.id}})
                    await Keys.destroy({where: {ownerID: player.dataValues.id}})
                }
                if(info.dataValues?.marriedID)
                {
                    await PlayerInfo.update({marriedID: null}, {where: {id: info.dataValues.marriedID}})
                    if(Data.users[info.dataValues.marriedID])
                    {
                        Data.users[info.dataValues.marriedID].isMarried = false
                        Data.users[info.dataValues.marriedID].marriedID = null
                    }
                    await api.SendMessage(player.dataValues.id, `🕊 Ваш${player.dataValues.gender ? " муж" : "а жена"} был убит, вы стали ${player.dataValues.gender ? "вдовой" : "вдовцом"}`)
                }
                await Player.destroy({where: {id: player.dataValues.id}})
                await PlayerStatus.destroy({where: {id: player.dataValues.id}})
                await PlayerResources.destroy({where: {id: player.dataValues.id}})
                await PlayerInfo.destroy({where: {id: player.dataValues.id}})
                await api.SendMessage(player.dataValues.id, `💀 Ваш персонаж был убит, всё ваше имущество ${will ? "переходит по завещанию" : "передается в государственное владение"}`)
                if(Data.users[info.dataValues.marriedID]) delete Data.users[info.dataValues.marriedID]
                await context.send("✅ Персонаж игрока убит")
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/KillPlayer", e)
            }
        })
    }

    async ChangeCountryModer(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                if(country.moderID)
                {
                    let kb = [
                        [keyboard.secondaryButton(["Назначить", "set"]), keyboard.secondaryButton(["Убрать", "remove"])]
                    ]
                    let action = await InputManager.ChooseButton(context, "Выберите действие", kb)
                    if(action === "remove")
                    {
                        await api.SendMessage(country.moderID, `✅ Вы были сняты с должности модератора фракции ${country.GetName()}`)
                        country.moderID = null
                        await Country.update({moderID: null}, {where: {id: country.id}})
                        await context.send("✅ У фракции больше нет модератора", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                }
                let player = await InputManager.InputUser(context, "Выберите нового модератора", current_keyboard)
                if(!player) return resolve()
                country.moderID = player.dataValues.id
                await Country.update({moderID: player.dataValues.id}, {where: {id: country.id}})
                await api.SendMessage(player.dataValues.id, `✅ Вы были назначены модератором фракции ${country.GetName()}`)
                await context.send("✅ Модератор назначен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryModer", e)
            }
        })
    }

    async GetTGCode(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.TGID)
                {
                    await context.send("⚠ У вас уже есть привязанный аккаунт", {keyboard: keyboard.build(current_keyboard(context))})
                    return resolve()
                }
                const code = NameLibrary.GetRandomNumb(10000000, 99999999)
                Data.TGcodes[code] = context.player.id
                await context.send(`✅ Для того чтобы вам привязать свой телеграмм аккаунт к вашему профилю в боте, вам надо ввести код в ЛС телеграм боту.\n\nВот ваш код:`)
                await context.send(code)
                await context.send(`Перейдите по адресу ${Data.variables["TGbotLink"]} и отправьте боту свой код.`, {keyboard: keyboard.build(current_keyboard(context))})

                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/GetTGCode", e)
            }
        })
    }

    async IntelligenceService(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.gold < 30)
                {
                    await context.send(`🚫 В бюджете вашей фракции не хватает золотых монет, для того чтобы провести разведку требуется 30 золотых.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let targetCountry = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию, в которой вы хотите провести разведку", Data.GetCountryButtons(context.country.id), current_keyboard)
                if(!targetCountry) return resolve()
                targetCountry = Data.ParseButtonID(targetCountry)
                targetCountry = Data.countries[targetCountry]
                let access = await InputManager.InputBoolean(context, `Сейчас в бюджете вашей фракции ${context.country.gold} золотых монет, для проведения разведки требуется 30 золотых, продолжить?`, current_keyboard)
                if(!access)
                {
                    await context.send(`🚫 Отменено`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryGold(context.country.id, -30)
                await LongTimeouts.create({
                    type: "intelligence_service",
                    time: 7,
                    fromCountry: context.country.id,
                    toCountry: targetCountry.id
                })
                await context.send(`✅ Ваша шпионская сеть получила команду выведать секреты фракции ${targetCountry.GetName(context.player.platform === "IOS")}, результат их работы вы получите через неделю`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async Implementation(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.gold < 10)
                {
                    await context.send(`🚫 В бюджете вашей фракции не хватает золотых монет, для того чтобы провести внедрение требуется минимум 10 золотых.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let targetCountry = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию, в которой вы хотите провести внедрение", Data.GetCountryButtons(context.country.id), current_keyboard)
                if(!targetCountry) return resolve()
                targetCountry = Data.ParseButtonID(targetCountry)
                targetCountry = Data.countries[targetCountry]
                let maxAgents = Math.min(Math.floor(context.country.gold / 10), 3)
                const agentsCount = await InputManager.InputInteger(context, `Сколько агентов вы хотите отправить на внедрение (от 1 до ${maxAgents}), учтите что стоимость отправки каждого агента это минимум 10 золотых монет, чем больше агентов, тем выше шанс успешной операции, если ваша сеть вскроется, то будут обнаружены все агенты отправленные в этот раз.`, current_keyboard, 1, maxAgents)
                if(!agentsCount) return resolve()
                const price = await InputManager.InputInteger(context, `Сейчас в бюджете вашей фракции ${context.country.gold} золотых монет.\n\nВведите сколько золотых монет вы готовы заплатить каждому агенту (${agentsCount === 1 ? "он" : "их"} ${agentsCount}), минимальная сумма - 10 золотых, максимальная ограничена бюджетом фракции (${Math.floor(context.country.gold / agentsCount)} золотых), чем больше золотых заплатить за внедрение, тем больший урон получит выбранная фракция`, current_keyboard, 10, Math.floor(context.country.gold / agentsCount))
                if(!price) return resolve()
                await Data.AddCountryGold(context.country.id, -1 * price * agentsCount)
                await LongTimeouts.create({
                    type: "implementation",
                    time: 7,
                    fromCountry: context.country.id,
                    toCountry: targetCountry.id,
                    price: price * agentsCount,
                    parameters: agentsCount
                })
                await context.send(`✅ Агенты отправлены, результат их работы вы получите через неделю`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async BuyEconomicScore(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const count = await InputManager.InputInteger(context, `Вы можете обменять золотые монеты на очки экономики с курсом 1 к 1, но получите вы эти очки только через неделю после вклада, итак, сколько золотых вы хотите вложить в экономику? (от 1 до ${context.country.gold})`, current_keyboard, 1, context.country.gold)
                if(!count) return resolve()
                await LongTimeouts.create({
                    type: "buy_economic_score",
                    time: 7,
                    fromCountry: context.country.id,
                    toCountry: context.country.id,
                    price: count
                })
                await Data.AddCountryGold(context.country.id, -1 * count)
                await context.send("✅ Вклад в экономику осуществлен, через неделю вы получите очки экономики", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async Sabotage(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.gold < 5)
                {
                    await context.send(`🚫 В бюджете вашей фракции не хватает золотых монет, для того чтобы провести внедрение требуется минимум 10 золотых.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const count = await InputManager.InputInteger(context, `В бюджете вашей фракции ${context.country.gold} золотых монет\n\nВы можете провести саботаж в любой фракции, во время саботажа вложенные в экономику золотые монеты просто пропадут пропорционально вашему вкладу в саботаж.\n\nВы можете вложить от 5 монет в проведение саботажа, и с 50% вероятностью вы повлияете на экономику врага. Количество золотых, которые вы вложите в проведение саботажа будут влиять на пречиненный ущерб, 1 золотая = 2% от вклада в экономику.`, current_keyboard, 5, context.country.gold)
                if(!count) return resolve()
                let targetCountry = await InputManager.KeyboardBuilder(context, "Выберите фракцию, в которой вы хотите провести саботаж", Data.GetCountryButtons(context.country.id), current_keyboard)
                if(!targetCountry) return resolve()
                targetCountry = Data.ParseButtonID(targetCountry)
                targetCountry = Data.countries[targetCountry]
                const contribution = await LongTimeouts.findOne({where: {toCountry: targetCountry.id, type: "buy_economic_score"}})
                if(contribution && NameLibrary.GetChance(50))
                {
                    let damage = Math.round(contribution.dataValues.price * (1 - Math.min(1, count * 0.02)))
                    await LongTimeouts.update({price: damage}, {where: {id: contribution.dataValues.id}})
                    await context.send("✅ Саботаж проведен успешно", {keyboard: keyboard.build(current_keyboard)})
                    await api.GMMailing(`Фракция ${context.country.GetName()} провела успешный саботаж в фракции ${targetCountry.GetName()}, в результате чего последняя не получит ${contribution.dataValues.price - damage} экономических очков со своего вклада`)
                }
                else
                {
                    await context.send("🚫 Саботаж провалился, можете попробовать еще", {keyboard: keyboard.build(current_keyboard)})
                }
                await Data.AddCountryGold(context.country.id, -1 * count)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async Counterintelligence(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.gold < 10)
                {
                    await context.send(`🚫 В бюджете вашей фракции не хватает золотых монет, для того чтобы провести контрразведку требуется минимум 10 золотых.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const count = await InputManager.InputInteger(context, `В бюджете вашей фракции ${context.country.gold} золотых монет\n\nПроводя контрразведку вы можете с определенным шансом помешать диверсионной деятельности других фракций, чем больше монет вы вложите, тем меньше ущерба будет нанесено диверсантами.\n\nВведите количество золотых монет, которые вы хотите потратить на контрразведку. (от 10 до ${context.country.gold})`, current_keyboard, 10, context.country.gold)
                if(!count) return resolve()
                const enemyOperations = await LongTimeouts.findAll({where: {toCountry: context.country.id, type: ["implementation", "intelligence_service"]}})
                if(enemyOperations.length > 0)
                {
                    let doCounterFlag = true
                    let findIntelFlag = true
                    for(const intel of enemyOperations)
                    {
                        if(intel.dataValues.type === "intelligence_service")
                        {
                            await LongTimeouts.update({price: count}, {where: {id: intel.dataValues.id}})
                            doCounterFlag= false
                        }
                        if(findIntelFlag && intel.dataValues.type === "implementation")
                        {
                            if(NameLibrary.GetChance(Math.max(count, 50)))
                            {
                                await LongTimeouts.destroy({where: {id: intel.dataValues.id}})
                                await context.send(`✅ Контрразведка выявила шпионскую сеть фракции ${Data.countries[intel.dataValues.fromCountry]?.GetName()}, шпионы ликвидированы`)
                                if(Data.countries[intel.dataValues.fromCountry])
                                {
                                    await api.SendMessage(Data.countries[intel.dataValues.fromCountry].leaderID, `⚠ Ваша шпионская сеть в фракции ${context.country.GetName()} вскрылась, шпионы ликвидированы`)
                                }
                                await api.GMMailing(`${context.country.GetName()} провела контрразведку, которая выявила шпионскую сеть фракции ${Data.countries[intel.dataValues.fromCountry]?.GetName()}, шпионы ликвидорованы`)
                            }
                            findIntelFlag = false
                        }
                        if(doCounterFlag || findIntelFlag)
                        {
                            await context.send("✅ Контрразведка проведена успешно, вражеская сеть ослаблена", {keyboard: keyboard.build(current_keyboard)})
                        }
                        else
                        {
                            await context.send("✅ Контрразведка проведена, но следов вражеского вмешательства выявлено не было", {keyboard: keyboard.build(current_keyboard)})
                        }
                    }
                }
                else
                {
                    await context.send("✅ Контрразведка проведена, но следов вражеского вмешательства выявлено не было", {keyboard: keyboard.build(current_keyboard)})
                }
                await Data.AddCountryGold(context.country.id, -1 * count)
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async NewEmpireRule(context, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                if (context.country.gold < 5)
                {
                    await context.send(`🚫 В бюджете вашей фракции не хватает золотых монет, для публикации имперского закона у требуется минимум 5 золотых.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const count = await InputManager.InputInteger(context, `В бюджете вашей фракции ${context.country.gold} золотых монет\n\nПубликация имперского закона стоит не менее 5 золотых монет, другие фракции могут отменить его публикациюзаплатив хотя бы на 1 золотую монету больше, введите количество золотых монет, которое вы хотите вложить в публикацию закона (от 5 до ${context.country.gold})`, current_keyboard, 5, context.country.gold)
                if (!count) return resolve()
                const ruleName = await InputManager.InputString(context, "Введите название закона", current_keyboard, 1, 255)
                if(!ruleName) return resolve()
                const ruleText = await InputManager.InputString(context, "Введите текст закона (до 3000 символов)", current_keyboard, 1, 3000)
                if(!ruleText) return resolve()
                const access = await InputManager.InputBoolean(context, `Проверьте данные:\n\nНазвание закона: ${ruleName}\n\nТекст закона: ${ruleText}\n\nКоличество золотых монет: ${count}\n\nВерно?`, current_keyboard)
                if(!access)
                {
                    await context.send(`🚫 Отменено.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const rule = await EmpireRules.create({
                    name: ruleName,
                    text: ruleText,
                    price: count
                })
                await api.GMMailing(`✅ Правительство фракции ${context.country.GetName()} предложило новый имперский закон, его стоимость составила ${count} золотых монет, вот сам закон:\n\nНазвание: ${ruleName}\n\nТекст закона: ${ruleText}\n\nПредложить гогосование за публикацю?`, [
                    keyboard.positiveCallbackButton({label: "✅ Передать на голосование", payload: {command: "gm_access_rule", ruleId: rule.dataValues.id}}),
                    keyboard.negativeCallbackButton({label: "🚫 Отклонить", payload: {command: "gm_decline_rule", ruleId: rule.dataValues.id, countryId: context.country.id}})
                ])
                await Data.AddCountryGold(context.country.id, -1 * count)
                await context.send("✅ Имперский закон принят в рассмотрение ГМ-ам, после одобрения начнется голосование", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }

    async ChangeEmpireBuildings(context, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                const buildings = [
                    ["⛪ Альтис", "altis", Data.variables["altis"]],
                    ["👨‍🌾 Торговая жемчужина", "market", Data.variables["market"]],
                    ["🕍 Страна дворцов", "castle", Data.variables["castle"]],
                    ["🧱 Высокие стены", "walls", Data.variables["walls"]],
                    ["🍖 А моей женой накормили толпу", "tavern", Data.variables["tavern"]]
                ]
                const newBuildings = await InputManager.RadioKeyboardBuilder(context, "Отметьте постройки", buildings, current_keyboard)
                if(!newBuildings) return resolve()
                for(const v of newBuildings) Data.variables[v[0]] = v[1]
                await Data.SaveVariables()
                await context.send("✅ Имперские здания обновлены", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await api.SendLogs(context, "BuildersAndControlsScripts/IntelligenceService", e)
            }
        })
    }
}

module.exports = new BuildersAndControlsScripts()