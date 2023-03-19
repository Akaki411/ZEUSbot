const InputManager = require("./InputManager");
const OutputManager = require("./OutputManager")
const Data = require("../models/CacheData");
const keyboard = require("../variables/Keyboards");
const {City, Country, PlayerStatus, Player, Ban, LastWills, Buildings,
    CountryResources, CityResources, PlayerInfo, CountryRoads, Keys, OfficialInfo, PlayerResources, Messages
} = require("../database/Models");
const api = require("../middleware/API");
const ErrorHandler = require("../error/ErrorHandler")
const NameLibrary = require("../variables/NameLibrary")
const Prices = require("../variables/Prices")
const Nations = require("../variables/Nations")
const sequelize = require("../database/DataBase")
const upload = require("../middleware/Upload")
const fs = require('fs')
const path = require("path")

class BuildersAndControlsScripts
{
    async Registration(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const peerInfo = await api.GetUserData(context.peerId)

                let name = await InputManager.InputString(context, `✍🏾 Добро пожаловать в канцелярию.\n\n*id${context.peerId} (${peerInfo.first_name}), вы хотите зарегистрироваться в проекте *public218388422 («ZEUS - Вселенная игроков»).\n\n1️⃣ Введите никнейм, которым вы будете пользоваться в будущем. Учтите, что необходимо установить античное имя, реально существовавшее в истории. Со списком таких вы можете ознакомиться ниже.\n👉🏾 Греческие имена: https://ru.m.wikipedia.org/wiki/Список_имён_греческого_происхождения\n👉🏾 Римские имена: https://ru.m.wikipedia.org/wiki/Римские_имена\n👉🏾 Персидские имена: https://ru.m.wikipedia.org/wiki/Персидские_имена`, current_keyboard,2, 20)
                if(!name) return resolve()
                let temp = await Player.findOne({where: {nick: name}})
                while(temp)
                {
                    name = await InputManager.InputString(context, `⚠ Этот ник занят`, current_keyboard, 2, 20)
                    if(!name) return resolve()
                    temp = await Player.findOne({where: {nick: name}})
                }

                const age = await InputManager.InputInteger(context, `2️⃣ Теперь укажите возраст вашего персонажа.\n⚠ Возраст может быть выбран от 16 до 100 лет.`, current_keyboard, 16, 100)
                if(age === null) return resolve()

                const gender = await InputManager.InputBoolean(context, `3️⃣ Укажите пол вашего персонажа.`, current_keyboard, keyboard.manButton, keyboard.womanButton)
                if(gender === null) return resolve()

                const description = await InputManager.InputString(context, `4️⃣ Расскажите о своём персонаже! Откуда он родом, чем занимается. Возможно есть ли у него семья, дети. С какой целью он пришёл в то место, где находится сейчас.\n⚠ Длина до 1000 символов.`, current_keyboard, 0, 1000)
                if(!description) return resolve()

                const nationKeyboard = []
                Object.keys(Nations).forEach(key => {
                    nationKeyboard.push([Nations[key].name, key])
                })
                let nation = await InputManager.KeyboardBuilder(context, "5️⃣ Какова национальность вашего персонажа?", nationKeyboard, current_keyboard)
                await context.send(Nations[nation].description)
                nation = Nations[nation].name

                let location = await InputManager.KeyboardBuilder(context, "6️⃣ Почти готово, теперь выберите в какой фракции вы хотите появиться после регистрации.", Data.GetCountryButtons(), current_keyboard)
                if(!location) return resolve()
                location = Data.ParseButtonID(location)

                await context.send(`ℹ Вы находитесь в столице фракции ${Data.countries[location].GetName()} - городе ${Data.cities[Data.countries[location].capitalID].name}\n\n${Data.countries[location].description}`, {attachment: Data.countries[location].welcomePhotoURL})
                const user = await Player.create({
                    id: context.peerId,
                    nick: name,
                    gender: gender
                })
                const status = await PlayerStatus.create({
                    id: context.peerId,
                    location: Data.countries[location].capitalID,
                    countryID: Data.countries[location].id
                })
                const info = await PlayerInfo.create({
                    id: context.peerId,
                    description: description,
                    nationality: nation,
                    age: age
                })
                const resources = await PlayerResources.create({id: context.peerId})
                Data.users[context.peerId] = new scenes.User(user, status, info, resources)
                Data.users[context.peerId].state = scenes.StartMenu
                context.player = Data.users[context.peerId]

                let kb = scenes.StartMenuKeyboard(context)

                await context.send(`🏁 Регистрация завершена, *id${context.peerId}(${name}). Радуйтесь каждому дню, проведенному в этом мире. Пусть Боги оберегают ваш путь...\n\nℹ Если вы хотите ближе познакомиться с командами и проектом, то изучите нашу группу. Для ознакомления с государствами перейдите в раздел \"Локация\", для глубинного изучения можете посетить сообщества. Выбирайте с умом!`, {
                    keyboard: keyboard.build(kb)
                })
                await OutputManager.SendCountryCarousel(context)
            }
            catch (e)
            {
                context.player = {
                    id: context.peerId,
                    nick: "Незарегистрированный пользователь"
                }
                await ErrorHandler.SendLogs(context, "Registration", e)
            }
        })
    }

    async NewCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите название фракции (от 2 до 30 символов):", current_keyboard, 2, 30)
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
                while(leader.dataValues.status === "leader")
                {
                    leader = await InputManager.InputUser(context, `⚠ *id${leader.dataValues.id}(${leader.dataValues.nick}) уже является правителем. Заберите у него статус или выберите другого игрока.`)
                    if(!leader) return resolve()
                }
                let groupId = await InputManager.InputGroup(context, `7️⃣ Укажите группу этой фракции.`, current_keyboard)
                if(!groupId) return resolve()

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

                let budget = {}
                budget.money = await InputManager.InputInteger(context, "💰 Введите начальный запас монет", current_keyboard)
                if (budget.money === null) return resolve()
                budget.wheat = await InputManager.InputInteger(context, "🌾 Введите начальный запас зерна", current_keyboard, 0)
                if(budget.wheat === null) return resolve()
                budget.wood = await InputManager.InputInteger(context, "🪵 Введите начальный запас древесины", current_keyboard, 0)
                if(budget.wood === null) return resolve()
                budget.stone = await InputManager.InputInteger(context, "🪨 Введите начальный запас камня", current_keyboard, 0)
                if(budget.stone === null) return resolve()
                budget.iron = await InputManager.InputInteger(context, "🌑 Введите начальный запас железа", current_keyboard, 0)
                if(budget.iron === null) return resolve()
                budget.copper = await InputManager.InputInteger(context, "🪙 Введите начальный запас меди", current_keyboard, 0)
                if(budget.copper === null) return resolve()
                budget.silver = await InputManager.InputInteger(context, "🥈 Введите начальный запас серебра", current_keyboard, 0)
                if(budget.silver === null) return resolve()
                budget.diamond = await InputManager.InputInteger(context, "💎 Введите начальный запас алмазов", current_keyboard, 0)
                if(budget.diamond === null) return resolve()

                let accept = await InputManager.InputBoolean(context, `Итак, мы имеем следующее:\n\n📌 Название: *public${groupId}(${name})\n🏙 Столица: ${capitalName}\n👑 Правитель: *id${leader.dataValues.id}(${leader.dataValues.nick})\n\n⛏ Ресурсы для добычи:\n ${resName}\n\nНачальный бюджет:\n${NameLibrary.GetPrice(budget)}\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send('⛔ Ввод отменен.', {
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
                    capitalID: city.dataValues.id
                })
                await CountryResources.create({
                    id: country.dataValues.id,
                    money: budget.money,
                    wheat: budget.wheat,
                    stone: budget.stone,
                    wood: budget.wood,
                    iron: budget.iron,
                    copper: budget.copper,
                    silver: budget.silver,
                    diamond: budget.diamond
                })
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
                context.send("✅ Фракция создана!\nТеперь можно построить дороги через ГМ-меню", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "NewCountry", e)
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
                    context.send(`⛔ Вы не имеете права изменять роль игрока *id${user.dataValues.id}(${user.dataValues.nick}).`, {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }

                let giveRoleKB = [
                    ["👶 Игрок", "player"],
                    ["🧒 Модератор", "moder"],
                    ["🧑 Гейм-мастер", "GM"]
                ]
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["👨‍🦳 Администратор", "admin"])
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["🔧 Тех-поддержка", "support"])
                context.player.role.match(/owner/) && giveRoleKB.push(["🤴 Глава проекта", "project_head"])

                let role = await InputManager.KeyboardBuilder(context, `✅ Выбран игрок *id${user.dataValues.id}(${user.dataValues.nick})\n2️⃣ Выберите новую роль.`, giveRoleKB, current_keyboard)
                if(!role) return resolve()
                const status = role === "player" ? await Data.GetUserStatus(user.dataValues.id) : "worker"
                user.set({role: role, status: status})
                await user.save()
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].status = status
                    Data.users[user.dataValues.id].role = role
                    Data.users[user.dataValues.id].state = tools.StayInStartScreen
                }
                role = NameLibrary.GetRoleName(role)
                await api.SendMessageWithKeyboard(user.dataValues.id, `Пользователь *id${context.player.id}(${context.player.nick}) назначил вас на роль: ${role}`, tools.GetStartMenuKeyboard(context))
                await context.send(`Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен на роль: ${role}`, {keyboard: keyboard.build(current_keyboard)})
                await Data.LoadWorkers()
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeRole", e)
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
                let oldCountry = null
                for(let i = 0; i < Data.countries?.length; i++)
                {
                    if(Data.countries[i]?.leaderID === user.dataValues.id)
                    {
                        oldCountry = await Country.findOne({where: {id: Data.countries[i].id}})
                        await context.send(`⚠ *id${user.dataValues.id}(${user.dataValues.nick}) уже является правителем!`)
                    }
                }
                const access = await InputManager.InputBoolean(context, `Назначить игрока *id${user.dataValues.id}(${user.dataValues.nick}) парвителем фракции ${country.GetName()}?`, current_keyboard)
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
                    await context.send(`⚠ Фракция ${Data.countries[oldCountry.dataValues.id].GetName()} осталась без правителя.`)
                }
                await Country.update({leaderID: user.dataValues.id}, {where: {id: country.id}})
                await PlayerStatus.update({citizenship: country.id},{where: {id: user.dataValues.id}})
                if(user.dataValues.status !== "worker")
                {
                    await Player.update({status: "official"}, {where: {id: country.leaderID}})
                    if(Data.users[country.leaderID]) Data.users[country.leaderID].status = "official"
                }
                if(country.leaderID)
                {
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
                await ErrorHandler.SendLogs(context, "AppointLeader", e)
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
                await OutputManager.GetUserWarnings(context, user.dataValues.id, current_keyboard)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ShowListWarnings", e)
            }
        })
    }

    async ShowBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                if(!user.dataValues.isBanned)
                {
                    context.send(`Пользователь *id${user.dataValues.id}(${user.dataValues.nick}) не забанен.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const ban = await Ban.findOne({where: {id: user.dataValues.id}})
                if(!ban)
                {
                    if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = false
                    user.set({isBanned: false})
                    await user.save()
                    await api.SendMessage(user.dataValues.id, "✅ Вы были разбанены.")
                    await context.send(`✅ У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет бана. Видимо произошла ошибка, сейчас все исправлено.`)
                    return resolve()
                }
                await context.send(`Бан от ${NameLibrary.ParseDateTime(ban.dataValues.createdAt)}:\nНик: *id${user.dataValues.id}(${user.dataValues.nick})\nПричина: ${ban.dataValues.reason}\nПодробная причина: ${ban.dataValues.explanation}\n\nℹ Если вы обжалуете бан, то вместе с баном удалятся и все предупреждения`, {keyboard: keyboard.build([[keyboard.appealCallbackButton({command: "appeal_ban", item: ban.dataValues.id}), keyboard.hideCallbackButton()]]).inline()})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ShowBan", e)
            }
        })
    }

    async CheatingUserResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "Кому вы хотите накрутить ресурс?", current_keyboard)
                if(!user) return resolve()
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `Выберите какой ресурс вы хотите накрутить игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddPlayerResources(user.dataValues.id, objIN)
                await api.SendMessage(user.dataValues.id, `Вам поступил перевод:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CheatingUserResources", e)
            }
        })
    }

    async CheatingCityResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "Выберите город, которому вы хотите перевести накрутить ресурсы:", Data.GetCityButtons(), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, "Выберите какой ресурс вы хотите накрутить", resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
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
                await ErrorHandler.SendLogs(context, "CheatingCityResources", e)
            }
        })
    }

    async CheatingCountryResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${country.GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет фракции ${country.GetName()}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let count = await InputManager.InputInteger(context, `Введите количество`, current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: Фракция ${country.GetName()}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddCountryResources(country, objIN)
                await api.SendMessage(Data.GetCountryForCity(context.cityID).leaderID, `Поступил перевод в бюджет фракции ${Data.GetCountryName(country)} в размере:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CheatingCountryResources", e)
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
                    context.send("⚠ Указывать себя в завещании запрещено.")
                    return resolve()
                }

                const lastWillText = await InputManager.InputString(context, "2️⃣ Введите текст завещания. Этот текст будет виден только вам и наследователю после вашей смерти. (до 1000 символов)", current_keyboard, 0, 1000)
                if (!lastWillText)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                await LastWills.create({
                    userID: context.player.id,
                    text: lastWillText,
                    successorID: user.dataValues.id
                })
                current_keyboard[0][2] = keyboard.deleteLastWillButton
                await context.send("✅ Добавлено завещание.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(user.dataValues.id, `✅ Игрок ${await NameLibrary.GetPlayerNick(context.player.id)} добавил вас в своё завещание.`)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CreateLastWill", e)
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
                await context.send(`*id${context.player.id}(Ваше) завещание:\nНаследователь: ${await NameLibrary.GetPlayerNick(lastWill.dataValues.successorID)}\nТекст:${lastWill.dataValues.text}`)
                const success = await InputManager.InputBoolean(context, "Вы уверены что хотите удалить свое завещание?")
                if(!success) return resolve()

                await LastWills.destroy({where: {userID: context.player.id}})
                current_keyboard[0][2] = keyboard.createLastWillButton
                await context.send("✅ Завещание удалено.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(lastWill.dataValues.successorID, `⚠ Игрок ${context.player.GetName()} удалил своё завещание.`)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "DeleteLastWill", e)
            }
        })
    }

    async Relax(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const need = (100 - context.player.fatigue) * 3.6
                const time = new Date()
                time.setMinutes(time.getMinutes() + need)
                Data.users[context.player.id].lastActionTime = time
                if (Data.users[context.player.id].timeout)
                {
                    clearTimeout(Data.users[context.player.id].timeout)
                }
                Data.users[context.player.id].timeout = setTimeout(() => {
                    context.send("☕ С добрым утром, теперь вы полны сил.", {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    Data.users[context.player.id].fatigue = 100
                    Data.users[context.player.id].isFreezed = false
                    Data.users[context.player.id].state = scenes.Menu
                }, need * 60000)
                Data.users[context.player.id].state = scenes.Relaxing
                Data.users[context.player.id].isFreezed = true
                await context.send(`💤 Спокойной ночи, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`,
                    {
                        keyboard: keyboard.build([[keyboard.checkTimeButton], [keyboard.wakeupButton]])
                    })
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Relax", e)
            }
        })
    }

    async ChangeCityName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "Введите новое название города (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует. Введите название города еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `Переименовать город \"${Data.cities[context.cityID].name}\" в "${name}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({name: name}, {where: {id: context.cityID}})
                Data.cities[context.cityID].name = name
                await context.send("✅ Город переиненован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCityName", e)
            }
        })
    }

    async ChangeCityDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `Старое описание: ${Data.cities[context.cityID].description}\n\nВведите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "Изменить описание города?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({description: description}, {where: {id: context.cityID}})
                Data.cities[context.cityID].description = description
                await context.send("✅ Описание города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCityDescription", e)
            }
        })
    }

    async ChangeCityPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.cityID].photoURL)
                {
                    await context.send("Вот старое фото", {attachment: Data.cities[context.cityID].photoURL})
                }
                else
                {
                    await context.send("У города нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "Отправьте новое фото. (Оно будет встречать людей, когда они будут заходить в город)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "Изменить фото города?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({photoURL: photo}, {where: {id: context.cityID}})
                Data.cities[context.cityID].photoURL = photo
                await context.send("✅ Фото города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCityPhoto", e)
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
                const resource = await InputManager.ChooseButton(context, `${Data.cities[context.cityID].GetResources()}\n\nПереводить ресурсы можно только в бюджет фракции.\n\nВыберите какой ресурс вы хотите перевести в бюджет фракции ${Data.GetCountryName(Data.GetCountryForCity(context.cityID).id)}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
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
                    count = await InputManager.InputInteger(context, `Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: ${Data.GetCountryName(Data.GetCountryForCity(context.cityID).id)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddCountryResources(Data.GetCountryForCity(context.cityID).id, objOUT)
                await api.SendMessage(Data.GetCountryForCity(context.cityID).leaderID, `Из города ${Data.cities[context.cityID].name} поступил перевод в бюджет фракции ${Data.GetCountryName(Data.GetCountryForCity(context.cityID).id)} в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CityToCountryTransaction", e)
            }
        })
    }

    async DeleteCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "Постройки в городе:\n\n"
                const buildingButtons = []
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + " ур\n"
                    if(Data.buildings[context.player.location][i].type !== "building_of_house")
                    {
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.cityID][i].type) + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
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

                const accept = await InputManager.InputBoolean(context, `Стоимость сноса здания:\n${NameLibrary.GetPrice(Prices["delete_building"])}\nСейчас в бюджете ${Data.cities[context.cityID].GetResources()} монет.\n\n⚠ Вы действительно ходите снести это здание?`)
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
                        await api.SendMessage(Data.buildings[context.cityID][i].ownerID, `⚠ Глава города ${Data.cities[context.cityID].name} распорядился снести вашу постройку ${NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type)} \"${Data.buildings[context.cityID][i].name}\"`)
                        break
                    }
                }
                await Data.LoadBuildings()
                await context.send("✅ Здание снесено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "DeleteCityBuilding", e)
            }
        })
    }

    async CreateCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.cityID].buildingsScore >= Data.cities[context.cityID].maxBuildings)
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const country = Data.GetCountryForCity(context.cityID)
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["🪙 Монетный двор", "mint"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"]
                ]
                country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебрянный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += Data.cities[context.cityID].GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\nСейчас в городе " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
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
                                for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                                {
                                    if(Data.buildings[Data.cities[i].id][j])
                                    {
                                        if(Data.buildings[Data.cities[i].id][j].type === "building_of_" + building)
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
                }
                const name = await InputManager.InputString(context, "Назовите постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                await Data.AddCityResources(context.cityID, Prices["new_" + building])
                await Buildings.create({
                    cityID: context.cityID,
                    name: name,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "city",
                    level: 1,
                    freezing: false
                })
                await Data.LoadBuildings()
                Data.cities[context.cityID].buildingsScore++
                await City.update({buildingsScore: Data.cities[context.cityID].buildingsScore}, {where: {id: context.cityID}})
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CreateCityBuilding", e)
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
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.cityID][i].type) + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
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
                if(building.type.match(/church|mint/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!Data.cities[context.cityID].CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(Data.cities[context.cityID].id ,Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "UpgradeCityBuilding", e)
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
                    await context.send("⛔ Отменено.", {keyboard: keyboard.build(current_keyboard)})
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
                await ErrorHandler.SendLogs(context, "ExpandCity", e)
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
                let request = "Добыча из построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 6)
                let resource = ""
                let flag = false
                let isVoid = true
                for(let i = 0, j = 0; i < Data.buildings[context.cityID]?.length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city" && Data.buildings[context.cityID][i].type.match(/wheat|stone|wood|iron|silver/))
                    {
                        flag = true
                        j++
                        request += (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" "
                        if(Data.buildings[context.cityID][i].lastActivityTime - time <= 0)
                        {
                            isVoid = false
                            resource = Data.buildings[context.cityID][i].type.replace("building_of_", "")
                            extract = Math.round(NameLibrary.GetFarmRandom(resource + "_lvl" + Data.buildings[context.cityID][i].level) * 0.9)
                            request += " - добыто\n"
                            Data.buildings[context.cityID][i].lastActivityTime = future
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
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCityResources(context.cityID, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetAllCityResources", e)
            }
        })
    }

    async GetCountryCities(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "Список городов в фракции " + context.country.GetName() + ":\n\n"
                for(let i = 0, j = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        j++
                        request += `${j}: 🌇 Город ${Data.cities[i].name} ${Data.cities[i].isCapital ? "(Столица) " : ""}- *id${Data.cities[i].leaderID}(глава)\n`
                    }
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetCountryCities", e)
            }
        })
    }

    async ChangeCountryName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "Введите новое название фракции (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let country = await Country.findOne({where: {name: name}})
                while(country)
                {
                    name = await InputManager.InputString(context, "⚠ Фракция с таким названием уже существует. Введите название фракции еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    country = await Country.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `Переименовать фракцию ${context.country.GetName()} в "${"*public" + context.country.groupID + "(" + name + ")"}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({name: name}, {where: {id: context.country.id}})
                context.country.name = name
                await context.send("✅ Фракция переиненована.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCountryName", e)
            }
        })
    }

    async ChangeCountryDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `Старое описание: ${context.country.description}\n\nВведите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "Изменить описание фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({description: description}, {where: {id: context.country.id}})
                context.country.description = description
                await context.send("✅ Описание фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCountryDescription", e)
            }
        })
    }

    async ChangeCountryPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.photoURL)
                {
                    await context.send("Вот старое фото", {attachment: context.country.photoURL})
                }
                else
                {
                    await context.send("У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "Отправьте новое фото.\n⚠ Это фото используется для генерации карусели.\n\n⚠⚠⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету\n\nБыстро изменить размер фото можно здесь: https://www.visualwatermark.com/ru/image-resizer/", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "Изменить фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({photoURL: photo}, {where: {id: context.country.id}})
                context.country.photoURL = photo
                await context.send("✅ Фото Фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCountryPhoto", e)
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
                    await context.send("Вот старое фото", {attachment: context.country.welcomePhotoURL})
                }
                else
                {
                    await context.send("У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "Отправьте новое фото. (Оно будет отображаться при заезде в фракцию)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "Изменить приветственное фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({welcomePhotoURL: photo}, {where: {id: context.country.id}})
                context.country.welcomePhotoURL = photo
                await context.send("✅ Приветственное фото фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCountryWelcomePhoto", e)
            }
        })
    }

    async ChangeCountryGroup(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let group = await InputManager.InputGroup(context, `*public${context.country.groupID}(Ссылка на группу фракции)\n\nЧтобы изменить:`, current_keyboard)
                if(!group) return resolve()
                const accept = await InputManager.InputBoolean(context, `Изменить группу на *public${group}(новую)?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({groupID: group}, {where: {id: context.country.id}})
                context.country.groupID = group
                await context.send("✅ Группа фракции изменена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeCountryGroup", e)
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
                let request = "Добыча из государственных построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 6)
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
                            if(Data.buildings[Data.cities[k].id][i].ownerType === "country" && Data.buildings[Data.cities[k].id][i].type.match(/wheat|stone|wood|iron|silver/))
                            {
                                flag = true
                                j++
                                request += "\n" + (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[Data.cities[k].id][i].type) + " \"" + Data.buildings[Data.cities[k].id][i].name + "\" "
                                if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time <= 0)
                                {
                                    isVoid = false
                                    resource = Data.buildings[Data.cities[k].id][i].type.replace("building_of_", "")
                                    extract = Math.round(NameLibrary.GetFarmRandom(resource + "_lvl" + Data.buildings[Data.cities[k].id][i].level) * 0.8)
                                    request += ` - добыто ${extract}`
                                    Data.buildings[Data.cities[k].id][i].lastActivityTime = future
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
                                    request += " - через " + Math.round((Data.buildings[Data.cities[k].id][i].lastActivityTime - time) / 60000) + " мин\n"
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
                    await context.send("⚠ В фракции нет государственных построек для добычи ресурсов пренадлежащих государству.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCountryResources(context.country.id, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetAllCountryResources", e)
            }
        })
    }

    async CountryToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "Выберите город, в бюджет которого хотите перевести ресурсы:", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${context.country.GetResources()}\n\nПереводить ресурсы можно только в бюджет города фракции.\n\nВыберите какой ресурс вы хотите перевести в бюджет города ${Data.GetCityName(cityID)}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
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
                    count = await InputManager.InputInteger(context, `Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddCityResources(cityID, objOUT)
                await api.SendMessage(Data.cities[cityID].leaderID, `✅ Из бюджета фракции ${context.country.GetName()} поступил перевод в бюджет города ${Data.cities[cityID].name} в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CountryToCityTransaction", e)
            }
        })
    }

    async GetCountryTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let time = new Date()
                if(context.country.lastTaxTime - time > 0)
                {
                    context.send("✡ Вы уже собирали налоги, следующий сбор будет доступен через " + NameLibrary.ParseFutureTime(context.country.lastTaxTime), {keyboard: keyboard.build(current_keyboard)})
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
                        await api.SendMessage(Data.cities[i].leaderID, `Правитель фракции ${context.country.GetName()} собрал с городов фракции налоги в размере ${context.country.tax}%, из бюджета города \"${Data.cities[i].name}\" собрано:\n${NameLibrary.GetPrice(taxIncome)}`)
                    }
                }
                await Data.AddCountryResources(context.country.id, totalIncome)
                time.setHours(time.getHours() + 168)
                context.country.lastTaxTime = time
                await context.send(`С ${count} городов собрано:\n${NameLibrary.GetPrice(totalIncome)}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetCountryTax", e)
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
                    cityButtons = Data.GetCityForCountryButtons()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                const user = await InputManager.InputUser(context, `Выберите, кого назначить главой города ${city.name}`, current_keyboard)
                if(!user) return resolve()
                const accept = await InputManager.InputBoolean(context, `Назначить *id${user.dataValues.id}(${user.dataValues.nick}) главой города ${city.name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "official"
                if(city.leaderID) await api.SendMessage(city.leaderID, `Вы были сняты с должности главы города ${city.name}`)
                await Player.update({status: "official"}, {where: {id: user.dataValues.id}})
                if(user.dataValues.id !== Data.countries[city.countryID].leaderID)
                {
                    await OfficialInfo.findOrCreate({
                        where: {id: user.dataValues.id},
                        defaults: {id: user.dataValues.id, nick: user.dataValues.nick, countryID: city.countryID}
                    })
                }
                await City.update({leaderID: user.dataValues.id}, {where: {id: city.id}})
                city.leaderID = user.dataValues.id
                await api.SendMessage(user.dataValues.id, `Вы были назначены главой города ${city.name}`)
                await context.send(`✅ Игрок ${await NameLibrary.GetPlayerNick(user.dataValues.id)} назначен главой города ${city.name}`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "SetMayor", e)
            }
        })
    }

    async SetTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const taxButtons = [
                    ["🏙 Городской налог", "tax"],
                    ["🧑 Гражданский налог", "citizenTax"],
                    ["🧑‍🦯 Туристический налог", "nonCitizenTax"],
                    ["⏩ Въездная пошлина", "entranceFee"],
                ]
                const taxType = await InputManager.KeyboardBuilder(context, "Какой тип налога вы хотите установить?", taxButtons, current_keyboard)
                if(!taxType) return resolve()
                const taxSamples = {
                    tax: "Укажите городской налог в процентах (этот налог вы можете снимать с городов раз в неделю)",
                    citizenTax: "Укажите налог для граждан в процентах (этот налог будет сниматься с граждан при добыче ресурсов и обмене ресурсами)",
                    nonCitizenTax: "Укажите налог для граждан другой фракции и апатридов в процентах (этот налог будет сниматься с игроков, не являющихся гражданами фракции, при добыче ресурсов и обмене ресурсами)",
                    entranceFee: "Укажите въездную пошлину в монетах (это та сумма, которую надо оплатить перед отправкой в вашу фракцию)"
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
                await ErrorHandler.SendLogs(context, "SetTax", e)
            }
        })
    }

    async BuildNewCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let leader = await InputManager.InputUser(context, `${context.country.GetResources()}\n\nСтоимость строительства нового города:\n${NameLibrary.GetPrice(Prices["new_city"])}\n\nУкажите градоначальника`, current_keyboard)
                if(!leader) return resolve()
                let leaderInfo = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                if(leaderInfo.dataValues.citizenship !== context.country.id)
                {
                    await context.send("⛔ В бюджете не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!context.country.CanPay(Prices["new_city"]))
                {
                    await context.send(`⚠ `, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let city = await City.findOne({where: {leaderID: leader.dataValues.id}})
                while(city)
                {
                    leader = await InputManager.InputUser(context, `⚠ Игрок *id${leader.dataValues.id}(${leader.dataValues.nick})уже является главой города ${city.dataValues.name}`, current_keyboard)
                    if(!leader) return resolve()
                    leaderInfo = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                    if(leaderInfo.dataValues.citizenship !== context.country.id)
                    {
                        await context.send(`⚠ Игрок *id${leader.dataValues.id}(${leader.dataValues.nick}) не является гражданином вашей фракции`, {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                    city = await City.findOne({where: {leaderID: leader.dataValues.id}})
                }
                let name = await InputManager.InputString(context, "Введите название нового города (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует, повторите ввод.", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                let description = await InputManager.InputString(context, "Введите описание города (от 2 до 1000 символов)", current_keyboard, 2, 1000)
                if(!description) return resolve()
                const newCity = await City.create({
                    countryID: context.country.id,
                    leaderID: leader.dataValues.id,
                    name: name,
                    description: description
                })
                await CityResources.create({id: newCity.dataValues.id})
                if(Data.users[leader.dataValues.id]) Data.users[leader.dataValues.id].status = "official"
                if(leader.dataValues.status.match(/citizen|/))
                {
                    leader.set({status: "official"})
                    await leader.save()
                }
                await Data.AddCountryResources(context.country.id, Prices["new_city"])
                await OfficialInfo.findOrCreate({
                    where: {id: leader.dataValues.id},
                    defaults: {id: leader.dataValues.id, countryID: context.country.id}
                })
                await Data.LoadCities()
                await api.SendMessage(leader.dataValues.id, `Правитель фракции ${context.country.GetName()} построил новый город \"${newCity.dataValues.name}\" и вы были назначены его главой, ваш статус изменен на "Чиновник"`)
                await context.send("✅ Город создан.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildNewCity", e)
            }
        })
    }

    async BuildTheRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll({where: {fromID: context.country.id}})
                let nonRoadCountryButtons = []
                let flag = true
                for(let i = 0; i < Data.countries.length; i++)
                {
                    flag = true
                    if(Data.countries[i]?.id === context.country.id) continue
                    for(let j = 0; j < roads.length; j++)
                    {
                        if(Data.countries[i]?.id === roads[j].dataValues.toID)
                        {
                            flag = false
                            break
                        }
                    }
                    if(flag && Data.countries[i])
                    {
                        nonRoadCountryButtons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                    }
                }
                if(nonRoadCountryButtons.length === 0)
                {
                    await context.send("ℹ Вы провели все доступные вам дороги.")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, `${context.country.GetResources()}\n\nПостройка новой дороги стоит:\n${NameLibrary.GetPrice(Prices["new_road"])}\n\nВыберите фракцию, к которой вы хотите провести дорогу:`, nonRoadCountryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.countries[Data.ParseButtonID(country)]
                if(!context.country.CanPay(Prices["new_road"]))
                {
                    await context.send("⛔ В бюджете не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Построить дорогу от ${context.country.GetName()} до ${country.GetName()}?`)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, Prices["new_road"])
                const roadFrom = await CountryRoads.create({fromID: context.country.id, toID: country.id, isBlocked: true})
                const roadTo = await CountryRoads.create({fromID: country.id, toID: context.country.id, isBlocked: true})
                await api.GMMailing(`Правитель фракции ${context.country.GetName()} построил дорогу к фракции ${country.GetName()}, необходимо зоплонить данные о расстоянии между фракциями.`, [[keyboard.startCallbackButton({command: "set_road_distance", item: roadTo.dataValues.id, addition: roadFrom.dataValues.id})]])
                await context.send("Дорога построена, осталось чтобы ГМ-ы обработали заявку", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildTheRoad", e)
            }
        })
    }

    async CreateCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город, в котором хотите разместить новую постройку", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                if(Data.cities[city].buildingsScore >= Data.cities[city].maxBuildings)
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["🪙 Монетный двор", "mint"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"]
                ]
                context.country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                context.country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                context.country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                context.country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                context.country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебрянный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += context.country.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\nСейчас в городе " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
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
                            for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                            {
                                if(Data.buildings[Data.cities[i].id][j]?.type === "building_of_" + building)
                                {
                                    await context.send(`⚠ В фракции ${context.country.GetName()} уже имеется ${NameLibrary.GetBuildingType("building_of_" + building)}`, {keyboard: keyboard.build(current_keyboard)})
                                    return resolve()
                                }
                            }
                        }
                    }
                }
                const name = await InputManager.InputString(context, "Назовите постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                await Data.AddCountryResources(context.country.id, Prices["new_" + building])
                await Buildings.create({
                    cityID: city,
                    name: name,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "country",
                    level: 1,
                    freezing: false
                })
                await Data.LoadBuildings()
                Data.cities[city].buildingsScore++
                await City.update({buildingsScore: Data.cities[city].buildingsScore}, {where: {id: city}})
                await api.SendMessage(Data.cities[city].leaderID, `Правитель фракции ${context.country.GetName()} возвел в вашем городе ${NameLibrary.GetBuildingType("building_of_" + building)}`)
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "CreateCountryBuilding", e)
            }
        })
    }

    async UpgradeCountryBuilding(context, current_keyboard)
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
                                if(Data.buildings[Data.cities[i].id][j].ownerType === "country")
                                {
                                    buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[Data.cities[i].id][j].type) + Data.buildings[Data.cities[i].id][j].name, "ID" + Data.buildings[Data.cities[i].id][j].id])
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
                    await context.send("⛺ В фракции нет государственных построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        for(let j = 0; j < Data.buildings[Data.cities[i].id]?.length; j++)
                        {
                            if(Data.buildings[Data.cities[i].id][j].id === building)
                            {
                                building = Data.buildings[Data.cities[i].id][j]
                                break
                            }
                        }
                    }
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.type.match(/church|mint/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.country.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "UpgradeCountryBuilding", e)
            }
        })
    }

    async GetCountryOfficials(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = `Чиновники фракции ${context.country.GetName()}:\n\n`
                let flag = true
                for(let i = 0; i < Data.officials[context.country.id]?.length; i++)
                {
                    flag = true
                    request += `🔸 *id${Data.officials[context.country.id][i].id}(${Data.officials[context.country.id][i].nick}) может:\n`
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- принимать граждан\n"
                    }
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- возводить города\n"
                    }
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- распоряжаться бюджетом\n"
                    }
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- распоряжаться армией\n"
                    }
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- назначать чиновников\n"
                    }
                    if(Data.officials[context.country.id][i].canBeDelegate)
                    {
                        flag = false
                        request += "- назначать градоначальников\n"
                    }
                    if(flag) request += "ничего не может"
                    request += "\n"
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetCountryOfficials", e)
            }
        })
    }

    async SetOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "Выберите игрока", current_keyboard)
                if(!user) return resolve()
                const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(userStatus?.dataValues.id === context.country.leaderID)
                {
                    await context.send("⚠ Это правитель, правителя невозможно сделать чиновником", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(userStatus?.dataValues.citizenship !== context.country.id)
                {
                    await context.send("⚠ Вы не можкте назначить чиновником игрока, не имеющего гражданство вашей фракции", {keyboard: keyboard.build(current_keyboard)})
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
                if(user.dataValues.status !== "worker")
                {
                    await Player.update({status: "official"}, {where: {id: user.dataValues.id}})
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "official"
                }
                await Data.LoadOfficials()
                await api.SendMessage(user.dataValues.id, `Правитель фракции ${context.country.GetName()} назначил вас чиновником`)
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен чиновником`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "SetOfficial", e)
            }
        })
    }

    async ChangeOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                for(let i = 0; i < Data.officials[context.country.id]?.length; i++)
                {
                    officialButtons.push([Data.officials[context.country.id][i].nick, "ID" + i])
                }
                if(officialButtons.length === 0)
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const request = "Возможности:\n\n🔸Делегат - может принимать гражданство\n🔸Города - может возводить города\n🔸Ресурсы - может распоряжаться бюджетом\n🔸Чиновники - может назначать других чиновников, но не может выдавать им права\n🔸Градоначальники - может менять глав городов"
                const rulesData = [
                    ["Делегат", "canBeDelegate", official.canBeDelegate],
                    ["Города", "canBuildCity", official.canBuildCity],
                    ["Ресурсы", "canUseResources", official.canUseResources],
                    ["Чиновники", "canAppointOfficial", official.canAppointOfficial],
                    ["Градоначальники", "canAppointMayors", official.canAppointMayors]
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
                await api.SendMessage(official.id, `ℹ Ваши права как чиновника изменены, теперь вы:\n\n🔸Можете принимать гражданство - ${newRules.canBeDelegate?"Да":"Нет"}\n🔸Можете возводить города - ${newRules.canBuildCity?"Да":"Нет"}\n🔸Может распоряжаться бюджетом - ${newRules.canUseResources?"Да":"Нет"}\n🔸Может назначать других чиновников - ${newRules.canAppointOfficial?"Да":"Нет"}\n🔸Может менять глав городов - ${newRules.canAppointMayors?"Да":"Нет"}`)
                await context.send("✅ Права чиновника изменены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeOfficial", e)
            }
        })
    }

    async TakeAwayOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                for(let i = 0; i < Data.officials[context.country.id]?.length; i++)
                {
                    officialButtons.push([Data.officials[context.country.id][i].nick, "ID" + i])
                }
                if(officialButtons.length === 0)
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const accept = await InputManager.InputBoolean(context, `Вы действительно хотите забрать права чиновника у игрока *id${official.id}(${official.nick})?`)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
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
                await api.SendMessage(official.id, `⚠ Правитель фракции ${context.country.GetName()} забрал у вас права чиновника.`)
                await Data.LoadOfficials()
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) лишен статуса чиновника`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "TakeAwayOfficial", e)
            }
        })
    }

    async TakeAwayCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "Выберите игрока", current_keyboard)
                if(!user) return resolve()
                const status = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(status.dataValues.citizenship !== context.country.id)
                {
                    await context.send(`⚠ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) не является гражданином фракции ${context.country.GetName()}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.id === context.country.leaderID)
                {
                    await context.send(`⛔ Невозможно забрать гражданство у правителя`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.status?.match(/official|leader/))
                {
                    await context.send(`⚠ Перед тем как забрать гражданство у игрока необходимо сместить его с должности чиновника`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Лишить игрока *id${user.dataValues.id}(${user.dataValues.nick}) гражданства фракции ${context.country.GetName()}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                status.set({citizenship: null})
                await status.save()
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].citizenship = null
                    Data.users[user.dataValues.id].status = "stateless"
                }
                await api.SendMessage(user.dataValues.id, `⚠ Правительство фракции ${context.country.GetName()} лишило вас гражданства`)
                await context.send("✅ Игрок лишен гражданства", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "TakeAwayCitizenship", e)
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
                const user = await InputManager.InputUser(context, "Кому вы хотите сделать предложение?", current_keyboard)
                if(!user) return resolve()
                const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}})
                if(isNaN(userInfo.dataValues.marriedID))
                {
                    await context.send(`⚠ ${await NameLibrary.GetPlayerNick(user.dataValues.id)} уже состоит в браке!`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender)
                {
                    await context.send("✝ Не надо так.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const text = await InputManager.InputString(context, "Напишите текст предложения.", current_keyboard)
                if (!text) return resolve()

                const accept = await InputManager.InputBoolean(context, `Текст предложения:\n${text}\nСделать предложение вступления в брак игроку *id${user.dataValues.id}(${user.dataValues.nick})?\nℹ Если игрок согласится, то у вас будет заключен брак.`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: user.dataValues.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `💍 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение руки и сердца с текстом:\n${text}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "merry", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_merry", item: context.player.id})]]).inline().oneTime()
                })
                Data.users[context.player.id].isMarried = true
                await context.send("✅ Предложение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "OfferMarry", e)
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
                    await context.send("⚠ Вы не в браке.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Вы хотите расторгнуть брак с игроком ${await NameLibrary.GetPlayerNick(context.player.marriedID)}?\nℹ Если игрок тоже согласится на это, то ваш брак будет расторжен.`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено")
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: context.player.marriedID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `❤️‍🩹 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение расторгнуть брак`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "divorce", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_divorce", item: context.player.id})]]).inline().oneTime()
                })
                await context.send("✅ Предложение отправлено", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Divorce", e)
            }
        })
    }

    async GetCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.status.match(/official|leader/))
                {
                    await context.send("⚠ Правители и чиновники не могут менять гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status.match(/candidate/))
                {
                    await context.send("⚠ Вы уже подали на гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.citizenship !== null)
                {
                    const firstAccept = await InputManager.InputBoolean(context, `⚠ Выточно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\".`, current_keyboard)
                    if(!firstAccept) return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию, гражданином которой хотите стать:", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                if(country === context.player.citizenship)
                {
                    await context.send("⚠ Вы уже являетесь гражданином этой страны.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: Data.countries[country].leaderID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
                })
                for(let i = 0; i < Data.officials[country]?.length; i++)
                {
                    if(Data.officials[country][i].canBeDelegate)
                    {
                        await api.api.messages.send({
                            user_id: Data.officials[country][i].id,
                            random_id: Math.round(Math.random() * 100000),
                            message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
                        })
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
                await context.send("✅ Заявка отправлена.\nПравитель или делегаты в течении 24 часов рассмотрят вашу кандидатуру и примут решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetCitizenship", e)
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
                const firstAccept = await InputManager.InputBoolean(context, `⚠ Выточно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\" и пропадет прописка, ваше имущество останется у вас.`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("⛔ Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("⛔ Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const country = await Country.findOne({where: {id: context.player.citizenship}})
                country.set({
                    population: country.population - 1
                })
                await country.save()
                await PlayerStatus.update({
                    citizenship: null
                },{where: {id: context.player.id}})
                await PlayerInfo.update({
                    registration: null
                },{where: {id: context.player.id}})
                if(!context.player.status.match(/worker/))
                {
                    Data.users[context.player.id].status = "stateless"
                    await Player.update({
                        status: "stateless"
                    },{where: {id: context.player.id}})
                }
                context.player.citizenship = null
                context.player.registration = null
                context.send("Теперь вы апатрид.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "RefuseCitizenship", e)
            }
        })
    }

    async GetRegistration(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.registration === "candidate")
                {
                    await context.send("⚠ Вы уже подали заявку", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: Data.cities[context.player.location].leaderID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `🪪 Игрок *id${context.player.id}(${context.player.nick}) подал заявку на прописку в вашем городе`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_registration", item: context.player.id, parameter: context.player.location}), keyboard.declineCallbackButton({command: "decline_registration", item: context.player.id, parameter: context.player.location})]]).inline().oneTime()
                })
                context.player.registration = "candidate"
                context.player.waitingRegistration = setTimeout(() => {
                    context.player.registration = null
                }, 86400000)
                await context.send("✅ Заявка отправлена.\nГлава города в течении 24 часов рассмотрит вашу кандидатуру и примет решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetRegistration", e)
            }
        })
    }

    async RefuseRegistration(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const firstAccept = await InputManager.InputBoolean(context, `⚠ Выточно хотите отказаться от прописки в городе ${Data.GetCityName(context.player.registration)}?`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await PlayerInfo.update({registration: null},{where: {id: context.player.id}})
                context.player.registration = null
                context.send("Теперь вы без прописки.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "RefuseRegistration", e)
            }
        })
    }

    async Transaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "Кому вы хотите перевести ресурс?", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.id === context.player.id)
                {
                    context.send("⛔ Какой смысл переводить самому себе?", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                context.send(`*id${context.player.id}(Ваш) инвентарь:\n💵 Деньги:  ${context.player.money}\n🪨 Камень:${context.player.stone}\n🌾 Зерно:${context.player.wheat}\n🪵 Дерево:${context.player.wood}\n🌑 Железо:${context.player.iron}\n🪙 Медь:${context.player.copper}\n🥈 Серебро:${context.player.silver}\n💎 Алмазы:${context.player.diamond}`)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `Выберите какой ресурс вы хотите перевести игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
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
                    count = await InputManager.InputInteger(context, `Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("⛔ Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddPlayerResources(user.dataValues.id, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(user.dataValues.id, `Вам поступил перевод:\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно")
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Transaction", e)
            }
        })
    }
    async GoToOtherCity(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const cities = await City.findAll({where: {countryID: Data.GetCountryForCity(context.player.location).id}})
                const cityButtons = []
                for(let i = 0; i < cities.length; i++)
                {
                    if(cities[i].dataValues.id !== context.player.location)
                    {
                        cityButtons.push([cities[i].dataValues.name, "ID" + cities[i].dataValues.id])
                    }
                }
                if(cityButtons.length === 0)
                {
                    await context.send("ℹ Вы находитесь в единственном городе фракции " + Data.GetCountryName(Data.GetCountryForCity(context.player.location).id))
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите в какой город вы хотите отправиться", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                const accept = await InputManager.InputBoolean(context, `Перемещение в другой город займет ${Data.variables["cityToCityTime"]} минут, на это время вы будете заморожены.\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город " + Data.GetCityName(city) + "\n" + Data.cities[city].description, {attachment: Data.cities[city].photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                    context.player.location = city
                    await PlayerStatus.update(
                        {location: city},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    const time = new Date()
                    time.setMinutes(time.getMinutes() + parseInt(Data.variables["cityToCityTime"]))
                    context.player.lastActionTime = time
                    context.player.state = scenes.moving
                    context.send("Вы отправились в город " + Data.cities[city].name, {keyboard: keyboard.none})
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город " + Data.GetCityName(city) + "\n" + Data.cities[city].description, {attachment: Data.cities[city].photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                        context.player.location = city
                        context.player.state = scenes.finish
                        await PlayerStatus.update(
                            {location: city},
                            {where: {id: context.player.id}}
                        )
                    }, parseInt(Data.variables["cityToCityTime"]) * 60000)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GoToOtherCity", e)
            }
        })
    }

    async GoToOtherCountry(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
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
                    await context.send("ℹ Для того чтобы уехать из фракции нужна дорога, но из фракции, в которой вы находитесь, не ведет ни одна дорога.\nВсе вопросы о дорогах к правителю фракции " + Data.GetCountryName(Data.GetCountryForCity(context.player.location).id) + " или Гейм-Мастерам")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите в какую фракцию вы хотите отправиться", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                let road = null
                roads.forEach(key => {if(key.dataValues.toID === country) road = key.dataValues})
                if(road?.isBlocked)
                {
                    await context.send("В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let accept
                if (Data.countries[country].entranceFee !== 0 && context.player.status !== "worker")
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road.time} минут, на это время вы будете заморожены.\nУ фракции ${Data.GetCountryName(country)} есть входная пошлина в размере ${Data.countries[country].entranceFee} монет\nПродолжить?`, current_keyboard)
                    if(context.player.money - Data.countries[country].entranceFee < 0)
                    {
                        await context.send("У вас не хватает средств для оплаты входной пошлины", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                }
                else
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road?.time ? road?.time : 0} минут, на это время вы будете заморожены, а повернуть назад невозможно.\nПродолжить?`, current_keyboard)
                }
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
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
                    const time = new Date()
                    time.setMinutes(time.getMinutes() + road.time)
                    context.player.state = scenes.moving
                    context.send("Вы отправились в фракцию " + Data.countries[country].GetName(), {keyboard: keyboard.none})
                    context.player.lastActionTime = time
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город " + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description, {attachment: Data.countries[country].welcomePhotoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                        context.player.location = Data.countries[country].capitalID
                        context.player.countryID = Data.countries[country].id
                        if (Data.countries[country].entranceFee !== 0)
                        {
                            await Data.AddPlayerResources(context.player.id, {money: -Data.countries[country].entranceFee})
                            await Data.AddCountryResources(country, {money: Data.countries[country].entranceFee})
                        }
                        await PlayerStatus.update(
                            {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                            {where: {id: context.player.id}}
                        )
                        context.player.state = scenes.finish
                    }, road.time * 60000)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GoToOtherCountry", e)
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
                for(let i = 0; i < keys.length; i++)
                {
                    keysButton.push([keys[i].dataValues.name, "ID" + keys[i].dataValues.id])
                }
                let key = await InputManager.KeyboardBuilder(context, "Выберите ключ, который вы хотите передать", keysButton, current_keyboard)
                if(!key) return resolve()
                key = Data.ParseButtonID(key)
                const user = await InputManager.InputUser(context, "Кому вы хотите отдать этот ключ?", current_keyboard)
                if(!user) return resolve()
                await Keys.update({ownerID: user.dataValues.id}, {where: {id: key}})
                await context.send("✅ Ключ отдан.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GiveKey", e)
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
                let key = await InputManager.KeyboardBuilder(context, "Выберите ключ, дубликат которого вы хотите сделать. \nСтоимость:\n" + NameLibrary.GetPrice(Prices["copy_key"]), keysButton, current_keyboard)
                if(!key) return resolve()
                if (!context.player.CanPay(Prices["copy_key"]))
                {
                    await context.send("⚠ У вас не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
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
                await ErrorHandler.SendLogs(context, "CopyKey", e)
            }
        })
    }
    async GetAllProperty(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id}})
                let request = "*id"+ context.player.id +"(Ваши) постройки:\n"
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
                request += "\n*id"+ context.player.id +"(Ваши) ключи:\n"
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
                await ErrorHandler.SendLogs(context, "GetAllProperty", e)
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
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебрянный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += context.player.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\n\n⚠ Любая постройка кроме жилого дома занимает полезное место в городе, поэтому для строительства вам надо получить разрешение от гравы города.\n\n⚠ Если вы прописаны в этом городе, то можно не получать разрешение на строительство от главы города.", buildingButtons, current_keyboard)
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
                const name = await InputManager.InputString(context, "Назовите свою постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                await Data.AddPlayerResources(context.player.id, Prices["new_" + building])
                const build = await Buildings.create({
                    cityID: context.player.location,
                    name: name,
                    type: "building_of_" + building,
                    ownerID: context.player.id,
                    ownerType: "user",
                    level: 1,
                    freezing: parseInt(context.player.location) !== parseInt(context.player.registration)
                })
                if(parseInt(context.player.location) === parseInt(context.player.registration) && building === "house")
                {
                    await Data.LoadBuildings()
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
                        message: `Игрок *id${context.player.id}(${context.player.nick}) хочет построить ${NameLibrary.GetBuildingType(build.dataValues.type)}.\n\n${context.player.GetInfo()}\n\n Разрешить строительство?`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "allow_user_building", item: context.player.id, parameter: build.dataValues.id}), keyboard.declineCallbackButton({command: "decline_user_building", item: context.player.id, parameter: build.dataValues.id})]]).inline().oneTime()
                    })
                    await context.send("✅ Заявка на возведение постройки подана, ресурсы зарезервированы", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "NewUserBuilding", e)
            }
        })
    }

    async UpgradeUserBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id}})
                if(buildings.length === 0)
                {
                    await context.send("⚠ У вас нет построек.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Ваши постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < buildings.length; i++)
                {
                    buildingButtons.push([NameLibrary.GetBuildingEmoji(buildings[i].dataValues.type) + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    request += `${NameLibrary.GetBuildingType(buildings[i].dataValues.type)} \"${buildings[i].dataValues.name}\" ${buildings[i].dataValues.level} уровня\n`
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()

                building = Data.ParseButtonID(building)
                buildings.forEach(key => {if(parseInt(key.dataValues.id) === parseInt(building)) building = key.dataValues})
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.player.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id ,Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                for(let i = 0; i < Data.buildings[building.cityID].length; i++)
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
                await ErrorHandler.SendLogs(context, "UpgradeUserBuilding", e)
            }
        })
    }

    async EnterBuilding(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                let request = "Постройки в городе " + Data.GetCityName(context.player.location) + " :\n"
                const buildingButtons = []
                if(!Data.buildings[context.player.location])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.player.location].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.player.location][i].type) + " \"" + Data.buildings[context.player.location][i].name + "\" " + Data.buildings[context.player.location][i].level + " уровня\n"
                    if (Data.buildings[context.player.location][i].type.match(/bank|mint|barracks|port|church/)) 
                    {
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.player.location][i].type) + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                        continue
                    }
                    for(let j = 0; j < keys.length; j++)
                    {
                        if(keys[j].dataValues.houseID === Data.buildings[context.player.location][i].id)
                        {
                            buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.player.location][i].type) + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                            break
                        }
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send(request + "🏘 В городе нет построек, которые вы можете посетить.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request + "\nВыберите, куда вы хотите зайти.", buildingButtons, current_keyboard)
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
                await ErrorHandler.SendLogs(context, "EnterBuilding", e)
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
                let extraction = NameLibrary.GetFarmRandom(resource + "_lvl" + context.player.inBuild.level)
                const extractionTax = parseInt(context.player.citizenship) === parseInt(country.id) ? country.citizenTax : country.nonCitizenTax
                const tax = Math.round(extraction * (extractionTax * 0.01))
                extraction -= tax
                playerBalance[resource] = extraction
                cityBalance[resource] = tax
                await Data.AddPlayerResources(context.player.id, playerBalance)
                await Data.AddCityResources(context.player.location, cityBalance)
                context.player.inBuild.lastActivityTime = time
                await context.send("Собрано: " + NameLibrary.GetPrice(NameLibrary.ReversePrice(playerBalance)) + "\nНалог составил: " + NameLibrary.GetPrice(cityBalance) + "(" + extractionTax + "%)", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "GetResourcesFormBuilding", e)
            }
        })
    }

    async RelaxInTheHouse(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                let need
                switch (context.player.inBuild.level)
                {
                    case 1:
                        need = (100 - context.player.fatigue) * 3.3
                        break
                    case 2:
                        need = (100 - context.player.fatigue) * 3.0
                        break
                    case 3:
                        need = (100 - context.player.fatigue) * 2.7
                        break
                    case 4:
                        need = (100 - context.player.fatigue) * 2.4
                        break
                }
                if(need === 0)
                {
                    await context.send("💪 Вы полны сил.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const time = new Date()
                time.setMinutes(time.getMinutes() + need)
                context.player.lastActionTime = time
                if (context.player.timeout)
                {
                    clearTimeout(context.player.timeout)
                }
                context.player.timeout = setTimeout(() => {
                    context.send("☕ С добрым утром, теперь вы полны сил.", {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    context.player.fatigue = 100
                    context.player.isFreezed = false
                    context.player.inBuild = null
                    context.player.state = scenes.Menu
                }, need * 60000)
                context.player.state = scenes.Relaxing
                context.player.isFreezed = true
                await context.send(`💤 Спокойной ночи, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`,
                    {
                        keyboard: keyboard.build([[keyboard.checkTimeButton], [keyboard.wakeupButton]])
                    })
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "RelaxInTheHouse", e)
            }
        })
    }

    async FillingOutTheRoad(context, current_keyboard, inputData, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const road = await CountryRoads.findOne({where: {id: inputData.roadFromID}})
                if(road?.dataValues.isBlocked)
                {
                    let time = await InputManager.InputInteger(context, "Введите в минутах время перемещения по дороге. (Требуется ввести целое значение)", current_keyboard, 1)
                    if(time === null) return resolve(false)
                    await CountryRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadFromID}})
                    await CountryRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadToID}})
                    await context.send("✅ Принято, спасбо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
                else
                {
                    await context.send("⚠ Кто-то из ГМ-ов уже заполнил данные, спасбо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "FillingOutTheRoad", e)
            }
        })
    }

    async SQLSession(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Вы введены в режим SQL-терминалла\n\nℹ Введите SQL-запрос, если вы не знаете что это такое, то лучше это не трогать."
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
                await ErrorHandler.SendLogs(context, "SQLSession", e)
            }
        })
    }

    async SendLog(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const log = await InputManager.InputString(context, "Введите название файла", current_keyboard)
                if(!log) return resolve()
                try
                {
                    const file = await upload.messageDocument({
                        peer_id: context.player.id,
                        source: {
                            value: "./logs/" + log
                        },
                        title: log
                    })
                    await context.send("Лови:", {attachment: file, keyboard: keyboard.build(current_keyboard)})
                }
                catch (e)
                {
                    await context.send("ℹ Файл не найден", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "SendLog", e)
            }
        })
    }

    async SendLogList(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const logs = fs.readdirSync("./logs/")
                let request = "Список логов:\n\n"
                logs.forEach(key => {
                    request += "🔸 " + key + "\n"
                })
                if(logs.length === 0) request += "⭕ Пусто"
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "SendLogList", e)
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
                            if (err) throw err;
                        });
                    }
                })
                await context.send("✅ Логи очищены.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ClearLogs", e)
            }
        })
    }

    async ClearUserCache(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const accept = await InputManager.InputBoolean(context, "⚠Вы действительно хотите очистить кэш пользователей?\n\n⚠⚠⚠Это приведет к выбрасыванию всех игроков в главное меню, силы всех игроков обнулятся, те игроки, что спят или куда-то идут, окажутся в главном меню и не получат уведомления об окончании процесса.", current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                Data.users = {}
                await context.send("✅ Кэш пользователей очищен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ClearUserCache", e)
            }
        })
    }

    async ChangeMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const newMap = await InputManager.InputPhoto(context, "Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                Data.variables.globalMap = newMap
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeMap", e)
            }
        })
    }

    async ChangeVariables(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const vars = Object.keys(Data.variables)
                const varButtons = []
                let request = "Список переменных:\n\n"
                for(let i = 0; i < vars.length; i++)
                {
                    varButtons.push([vars[i], vars[i]])
                    request += "🔸 " + vars[i] + "   =   " + Data.variables[vars[i]] + "\n"
                }
                request += "\nℹ Выберите переменную которую хотите изменить"
                const variable = await InputManager.KeyboardBuilder(context, request, varButtons, current_keyboard)
                if(!variable) return resolve()
                const newValue = await InputManager.InputString(context, "Введите новое значение переменной " + variable, current_keyboard)
                if(!newValue) return resolve()
                Data.variables[variable] = newValue
                await Data.SaveVariables()
                await context.send("✅ Сохранено новое значение переменной", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeVariables", e)
            }
        })
    }

    async AddMessage(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const text = await InputManager.InputString(context, "Введите текст сообщения, это сообщение смогут видеть все игроки по нажатию кнопки \"Сообщения\" в меню", current_keyboard, 1)
                if(!text) return resolve()
                const isNoisy = await InputManager.InputBoolean(context, "Отправить уведомление о новом сообщении?\n\n🔸 Да - Всем подписанным на уведомления игрокам придет оповещение о новом сообщении\n🔸 Нет - Сообщение отправится без уведомления подписанных игроков, посмотреть его можно будет только через меню сообщений", current_keyboard)
                const accept = await InputManager.InputBoolean(context, `Проверьте сообщение:\n\nТекст:\n${text}\nТихое сообщение: ${isNoisy ? "Нет" : "Да"}`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Messages.create({
                    text: text,
                    isSilent: !isNoisy
                })
                if(isNoisy)
                {
                    const subscribedUsers = await PlayerStatus.findAll({where: {notifications: true}})
                    for(const user of subscribedUsers)
                    {
                        await api.SendMessage(user.dataValues.id, "ℹНовое объявление!\n\n" + text)
                    }
                }
                await context.send("✅ Сообщение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "AddMessage", e)
            }
        })
    }

    async ChangeTheRoad(context, current_keyboard)
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
                        request += "🔸 " + Data.countries[i].GetName() + "  -  " + Data.countries[i].id + "\n"
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
                await context.send("✅ Дорога изменна", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "ChangeTheRoad", e)
            }
        })
    }
}

module.exports = new BuildersAndControlsScripts()