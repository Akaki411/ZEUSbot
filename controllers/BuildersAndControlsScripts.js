const InputManager = require("./InputManager");
const Data = require("../models/CacheData");
const keyboard = require("../variables/Keyboards");
const {City, Country, PlayerStatus, Player, Warning, Ban, LastWills, Buildings,
    CountryResources, CityResources, PlayerInfo, CountryRoads, Keys
} = require("../database/Models");
const api = require("../middleware/API");
const ErrorHandler = require("../error/ErrorHandler")
const NameLibrary = require("../variables/NameLibrary")
const Prices = require("../variables/Prices")

class BuildersAndControlsScripts
{
    async NewCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                //ввод названия фракции
                let name = await InputManager.InputString(
                    context,
                    "1️⃣ Введите название фракции (от 2 до 30 символов):",
                    current_keyboard,
                    2,
                    30)
                if (!name) return resolve()
                while(Data.countries.includes(name))
                {
                    name = await InputManager.InputString(
                        context,
                        "⚠ Фракция с таким названием уже существует.",
                        current_keyboard,
                        2,
                        30)
                    if (!name) return resolve()
                }

                //описание
                const description = await InputManager.InputString(
                    context,
                    "2️⃣ Сделайте описание фракции. (до 1000 символов)",
                    current_keyboard,
                    0,
                    1000
                )
                if(!description) return resolve()

                //фото
                const preview = await InputManager.InputPhoto(
                    context,
                    `3️⃣ Отправьте фото для иллюстрации.\n⚠ Это фото используется для генерации карусели с фракциями для удобства игроков, создать фракцию без фото - нельзя.\n⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету`,
                    current_keyboard)
                if (!preview) return resolve()

                //приветственное фото
                const welcomePhoto = await InputManager.InputPhoto(
                    context,
                    `4️⃣ Отправьте приветственное фото\n⚠ Это фото будет встречать новых граждан. (Фото обязательно)`,
                    current_keyboard)
                if(!welcomePhoto) return resolve()

                //ввод названия столицы
                let capitalName = await InputManager.InputString(
                    context,
                    "5️⃣ Введите название столицы (от 2 до 30 символов):",
                    current_keyboard,
                    2,
                    30)
                if (!capitalName) return resolve()
                while(Data.cities.includes(capitalName))
                {
                    capitalName = await InputManager.InputString(
                        context,
                        "⚠ Город с таким названием уже существует.",
                        current_keyboard,
                        2,
                        30)
                    if (!capitalName) return resolve()
                }

                //выбор правителя
                let leader = await InputManager.SearchUser(context, "6️⃣ Теперь нужно указать правителя.")
                if(!leader) return resolve()

                while(leader.dataValues.status === "leader")
                {
                    leader = await InputManager.SearchUser(context, `⚠ *id${leader.dataValues.id}(${leader.dataValues.nick}) уже является правителем.`)
                    if(!leader) return resolve()
                }

                //группа
                let groupId = await InputManager.InputGroup(
                    context,
                    `7️⃣ Укажите группу этой фракции.`,
                    current_keyboard)
                if(!groupId) return resolve()

                //бюджет
                let budget = await InputManager.InputInteger(
                    context,
                    "8️⃣ Введите начальный бюджет фракции.",
                    current_keyboard
                )
                if (!budget) return resolve()

                //ресурсы
                let resources = await InputManager.ChooseButton(
                    context,
                    "9️⃣ Главный ресурс фракции:",
                    [
                        [keyboard.woodButton, keyboard.stoneButton],
                        [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton]
                    ],
                    current_keyboard
                )
                if(!resources) return resolve()
                let resName = NameLibrary.GetResourceName(resources)

                const wheat = await InputManager.InputInteger(context, "🌾 Введите начальный запас зерна", current_keyboard, 0)
                if(!wheat) return resolve()

                const wood = await InputManager.InputInteger(context, "🪵 Введите начальный запас древесины", current_keyboard, 0)
                if(!wheat) return resolve()

                const stone = await InputManager.InputInteger(context, "⛰ Введите начальный запас камня", current_keyboard, 0)
                if(!wheat) return resolve()

                const iron = await InputManager.InputInteger(context, "🌑 Введите начальный запас железа", current_keyboard, 0)
                if(!wheat) return resolve()

                const copper = await InputManager.InputInteger(context, "🪙 Введите начальный запас меди", current_keyboard, 0)
                if(!wheat) return resolve()

                const silver = await InputManager.InputInteger(context, "🥈 Введите начальный запас серебра", current_keyboard, 0)
                if(!wheat) return resolve()

                const diamonds = await InputManager.InputInteger(context, "💎 Введите начальный запас алмазов", current_keyboard, 0)
                if(!diamonds) return resolve()

                await context.send(`Итак, мы имеем следующее:\nНазвание: ${name}\nСтолица: ${capitalName}\nГруппа: *public${groupId}(${name})\nПравитель: *id${leader.dataValues.id}(${leader.dataValues.nick})\nБюджет: ${budget}\nРесурс: ${resName}\nЗерно: ${wheat} Древесина: ${wood} Камень: ${stone}\nЖелезо: ${iron} Медь: ${copper} Серебро: ${silver}`)
                let accept = await InputManager.InputBoolean(context, "Верно?", current_keyboard)
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
                const country = await Country.create({
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
                    money: budget,
                    wheat: wheat,
                    stone: stone,
                    wood: wood,
                    iron: iron,
                    copper: copper,
                    silver: silver,
                    diamond: diamonds
                })
                const leaderStatus = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                city.set({
                    countryID: country.dataValues.id,
                    capitalID: country.dataValues.id
                })
                leader.set({
                    status: leader.dataValues.status === "worker" ? "worker" : "leader"
                })
                leaderStatus.set({
                    location: city.dataValues.id,
                    citizenship: country.dataValues.id
                })
                await city.save()
                await leader.save()
                await leaderStatus.save()

                if(Data.users[leader.dataValues.id]?.status !== "worker") Data.users[leader.dataValues.id].status = "leader"
                await Data.LoadCountries()
                await Data.LoadCities()
                await api.SendMessage(
                    leader.dataValues.id,
                    `✅ Вы были назначены правителем только что созданной фракции ${name}\nВаш статус изменен на "Правитель"`)
                context.send("✅ Фракция создана!\nТеперь можно построить дороги через ГМ-меню", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Создание фракции", e)
            }
        })
    }

    async ChangeRole(context, current_keyboard, tools)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите игрока.", current_keyboard)
                if (!user) return resolve()
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(user.dataValues.role))
                {
                    context.send(`⛔ Вы не имеете права изменять роль игрока *id${user.dataValues.id}(${user.dataValues.nick}).`, {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }

                let giveRoleKB = [
                    [keyboard.playerButton, keyboard.moderatorButton, keyboard.GMButton],
                    [],
                    [keyboard.cancelButton]
                ]
                context.player.role.match(/owner|project_head|support/) && giveRoleKB[1].push(keyboard.adminButton)
                context.player.role.match(/owner|project_head/) && giveRoleKB[1].push(keyboard.supportButton)
                context.player.role.match(/owner/) && giveRoleKB[1].push(keyboard.projectHeadButton)

                let role = await InputManager.ChooseButton(
                    context,
                    `✅ Выбран игрок с ником *id${user.dataValues.id}(${user.dataValues.nick})\n2️⃣ Выберите новую роль.`,
                    giveRoleKB,
                    current_keyboard)
                if(role === "cancel")
                {
                    context.send('⛔ Поиск игрока отменен.', {
                        keyboard: keyboard.build([
                            [keyboard.statsButton, keyboard.controlsButton],
                            [keyboard.giveRoleButton, keyboard.sqlButton],
                            [keyboard.backButton]
                        ])
                    })
                    return resolve()
                }

                user.set({role: role})
                await user.save()
                let newRole = NameLibrary.GetRoleName(role)
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].role = role
                    Data.users[user.dataValues.id].state = tools.StayInStartScreen
                }

                await api.SendMessage(
                    user.dataValues.id,
                    `Пользователь *id${context.player.id}(${context.player.nick}) назначил вас на роль: ${newRole}`,
                    tools.GetStartMenuKeyboard(context))
                await context.send(`Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен на роль: ${newRole}`, {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Изменение роли", e)
            }
        })
    }

    async AppointLeader(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                // Выбор гос-ва
                const buttons = Data.GetCountryButtons()
                if(buttons.length === 0)
                {
                    await context.send("⚠ Ни одна фракция не обнаружена.")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите государство", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)

                //Поиск игрока
                let newLeader = await InputManager.SearchUser(context, "2️⃣ Выберите пользователя")
                if(!newLeader) return resolve()

                //Подтверждение
                if(newLeader.dataValues.status === "leader")
                {
                    await context.send(`⚠ *id${newLeader.dataValues.id}(${newLeader.dataValues.nick}) уже является правителем!`)
                    return resolve()
                }
                const access = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!access) return

                const newLeaderStatus = await PlayerStatus.findOne({where: {id: newLeader.dataValues.id}})
                const newLeaderCountry = await Country.findOne({where: {id: country}})
                const newLeaderCountryCapital = await City.findOne({where: {capitalID: country}})
                const oldLeader = await Player.findOne({where: {id: newLeaderCountry.dataValues.leaderID}})

                oldLeader.set({
                    status: "citizen"
                })
                newLeader.set({
                    status: "leader"
                })
                newLeaderStatus.set({
                    location: newLeaderCountry.dataValues.id,
                    citizenship: newLeaderCountry.dataValues.id
                })
                newLeaderCountry.set({
                    leaderID: newLeader.dataValues.id
                })
                newLeaderCountryCapital.set({
                    leaderID: newLeader.dataValues.id
                })
                await newLeader.save()
                await newLeaderStatus.save()
                await newLeaderCountry.save()
                await newLeaderCountryCapital.save()

                await api.SendMessage(
                    oldLeader.dataValues.id,
                    `⚠ Вы были сняты с должности правителя фракции ${newLeaderCountry.dataValues.name}\n🪪 Ваш статус изменен на "Гражданин"`)
                await api.SendMessage(
                    newLeader.dataValues.id,
                    `✅ Вы были назначены правителем фракции ${newLeaderCountry.dataValues.name}\n👑 Ваш статус изменен на "Правитель"`)

                context.send(`✅ *id${newLeader.dataValues.id}(${newLeader.dataValues.nick}) назначен правителем фракции ${newLeaderCountry.dataValues.name}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Назначение правителя", e)
            }
        })
    }

    async ShowListWarnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return resolve()

                const warnings = await Warning.findAll({where: {id: user.dataValues.id}})
                if(warnings.length === 0)
                {
                    context.send(`⚠ У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет предупреждений`,
                        {
                            keyboard: keyboard.build(current_keyboard)
                        })
                    return resolve()
                }
                for (const key of warnings)
                {
                    await context.send(`Предупреждение от ${key.dataValues.createdAt}:\nНик: *id${user.dataValues.id}(${user.dataValues.nick})\nПричина: ${key.dataValues.reason}\nПодробная причина: ${key.dataValues.explanation}`)
                }
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Вывод списка предупреждений.", e)
            }
        })
    }

    async ShowBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.SearchUser(context, "Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                if(!user.dataValues.isBanned)
                {
                    context.send(`Пользователь *id${user.dataValues.id}(${user.dataValues.nick}) не забанен.`,
                        {
                            keyboard: keyboard.build(current_keyboard)
                        })
                    return resolve()
                }

                const ban = await Ban.findOne({where: {id: user.dataValues.id}})
                if(!ban)
                {
                    if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = false
                    user.set({
                        isBanned: false
                    })
                    await user.save()
                    await api.SendMessage(user.dataValues.id, "⚠ Вы были разбанены.")
                    context.send(`У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет бана. Видимо произошла ошибка, сейчас все исправлено.`)
                    return resolve()
                }
                await context.send(`Бан от ${ban.dataValues.createdAt}:\nНик: *id${user.dataValues.id}(${user.dataValues.nick})\nПричина: ${ban.dataValues.reason}\nПодробная причина: ${ban.dataValues.explanation}`)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Баны", e)
            }
        })
    }

    async CreateLastWill(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите пользователя, которому завещаете все свое имущество", current_keyboard)
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
                await ErrorHandler.SendLogs(context, "Написание завещания.", e)
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
                await api.SendMessage(lastWill.dataValues.successorID, `⚠ Игрок ${await NameLibrary.GetPlayerNick(context.player.id)} удалил своё завещание.`)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Удаление завещания.", e)
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
                const now = new Date()
                const minutes = (time - now) / 60000
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
                await context.send(`💤 Спокойной ночи, до полного восстановления сил ${Math.round(minutes)} мин.`,
                    {
                        keyboard: keyboard.build([[keyboard.wakeupButton]])
                    })
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Начало отдыха", e)
            }
        })
    }

    async DeleteBuildingForMayor(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {cityID: context.cityID}})
                let kb = []
                for (let i = 0; i < buildings.length; i++)
                {
                    if(buildings[i].dataValues.ownerID === "country")
                    {
                        kb.push([NameLibrary.GetBuildingType(buildings[i].dataValues.type) + " " + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    }
                }
                const buildingID = await InputManager.KeyboardBuilder(context, "Выберите здание, которое хотите снести (вы можете распоряжаться только государственными зданиями)", kb, current_keyboard)
                if(!buildingID) return resolve()

                const accept = await InputManager.InputBoolean(context, `Снос здания стоит 200 монет. Сейчас в бюджете ${Data.cities[context.cityID].resources.money} монет.\nВы действительно ходите снести это здание?`)
                if (!accept) return resolve()
                if(Data.cities[context.cityID].resources.money < 200)
                {
                    await context.send("В бюджете города не хватает монет!")
                }
                await Data.AddCityResources(context.cityID, {money: -200})
                await context.send("Здание снесено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Мэр удаляет здание", e)
            }
        })
    }

    async CreateBuildingForMayor(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {cityID: context.cityID}})
                let kb = []
                for (let i = 0; i < buildings.length; i++)
                {
                    if(buildings[i].dataValues.ownerID === "country")
                    {
                        kb.push([NameLibrary.GetBuildingType(buildings[i].dataValues.type) + " " + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    }
                }
                const buildingID = await InputManager.KeyboardBuilder(context, "Выберите здание, которое хотите снести (вы можете распоряжаться только государственными зданиями)", kb, current_keyboard)
                if(!buildingID) return resolve()

                const accept = await InputManager.InputBoolean(context, `Снос здания стоит 200 монет.\nВы действительно ходите снести это здание?`)
                if (!accept) return resolve()
                if(Data.cities[context.cityID].resources.money < 200)
                {
                    await context.send("В бюджете города не хватает монет!")
                }
                await Data.AddCityResources(context.cityID, {money: -200})
                await context.send("Здание снесено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Мэр создает здание", e)
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
                const user = await InputManager.SearchUser(context, "Кому вы хотите сделать предложение?", current_keyboard)
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
                    await context.send("⛔ Отменено")
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
                await ErrorHandler.SendLogs(context, "Предложение брака", e)
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
                await ErrorHandler.SendLogs(context, "Предложение брака", e)
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
                for (const key of Data.delegates[country]) {
                    await api.api.messages.send({
                        user_id: key,
                        random_id: Math.round(Math.random() * 100000),
                        message: `🪪 Игрок *id${context.player.id}(${context.player.nick}) подал на гражданство в вашу фракцию`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
                    })
                }
                if(!context.player.status.match(/worker/))
                {
                    Data.users[context.player.id].status = "candidate"
                }
                Data.users[context.player.id].waitingCitizenship = setTimeout(() => {
                    if(!context.player.status.match(/worker/))
                    {
                        Data.users[context.player.id].status = "stateless"
                    }
                }, 86400000)
                await context.send("✅ Заявка отправлена.\nПравитель или делегаты в течении 24 часов рассмотрят вашу кандидатуру и примут решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Подача на гражданство", e)
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
                await ErrorHandler.SendLogs(context, "Отказ от гражданства", e)
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
                await ErrorHandler.SendLogs(context, "Подача на прописку", e)
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
                await ErrorHandler.SendLogs(context, "Отказ от регистрации", e)
            }
        })
    }

    async Transaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.SearchUser(context, "Кому вы хотите перевести ресурс?", current_keyboard)
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
                    if(!count) return resolve()
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
                await ErrorHandler.SendLogs(context, "Перевод", e)
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
                const accept = await InputManager.InputBoolean(context, `Перемещение в другой город займет ${Data.variables.cityToCityTime / 60} минут, на это время вы будете заморожены.\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                context.player.state = scenes.moving
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город" + Data.GetCityName(city) + "\n" + Data.cities[city].description)
                    context.player.location = city
                    await PlayerStatus.update(
                        {location: city},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город" + Data.GetCityName(city) + "\n" + Data.cities[city].description)
                        context.player.location = city
                        context.player.state = scenes.finish
                        await PlayerStatus.update(
                            {location: city},
                            {where: {id: context.player.id}}
                        )
                    }, Data.variables.cityToCityTime * 1000)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Переход в другой город", e)
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
                for(let i = 0; i < roads.length; i++)
                {
                    countryButtons.push([Data.countries[roads[i].dataValues.toID].name, "ID" + roads[i].dataValues.toID])
                }
                if(roads.length === 0)
                {
                    await context.send("ℹ Для того чтобы уехать из фракции нужна дорога, но из фракции, в которой вы находитесь, не ведет ни одна дорога.\nВсе вопросы о дорогах к правителю фракции " + Data.GetCountryName(Data.GetCountryForCity(context.player.location).id) + " или Гейм-Мастерам")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите в какую фракцию вы хотите отправиться", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                let road = null
                roads.forEach(key => {if(key.dataValues.toID === country) road = key.dataValues})
                if(road.isBlocked)
                {
                    await context.send("В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let accept
                if (Data.countries[country].entranceFee !== 0)
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
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road.time} минут, на это время вы будете заморожены.\nПродолжить?`, current_keyboard)
                }
                if(!accept)
                {
                    await context.send("⛔ Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const time = new Date()
                time.setMinutes(time.getMinutes() + road.time)
                context.player.state = scenes.moving
                context.player.lastActionTime = time
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город" + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description)
                    context.player.location = Data.countries[country].capitalID
                    await PlayerStatus.update(
                        {location: Data.countries[country].capitalID},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город" + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description)
                        context.player.location = Data.countries[country].capitalID
                        if (Data.countries[country].entranceFee !== 0)
                        {
                            await Data.AddPlayerResources(context.player.id, {money: -Data.countries[country].entranceFee})
                            await Data.AddCountryResources(country, {money: Data.countries[country].entranceFee})
                        }
                        await PlayerStatus.update(
                            {location: Data.countries[country].capitalID},
                            {where: {id: context.player.id}}
                        )
                    }, road.time * 60000)
                    context.player.state = scenes.finish
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Переход в другой город", e)
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
                const user = await InputManager.SearchUser(context, "Кому вы хотите отдать этот ключ?", current_keyboard)
                if(!user) return resolve()
                await Keys.update({ownerID: user.dataValues.id}, {where: {id: key}})
                await context.send("✅ Ключ отдан.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Отдать ключ", e)
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
                console.log(key)
                await Keys.create({
                    houseID: key.houseID,
                    ownerID: key.ownerID,
                    name: key.name,
                    description: key.description + " дубликат"
                })
                await context.send("✅ Ключ продублирован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Сделать дубликат ключа", e)
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
                        " уровня, город: " +
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
                    request += (i+1) + ": " + "\"" + keys[i].dataValues.name + "\" " + keys[i].dataValues.description + "\n"
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
                await ErrorHandler.SendLogs(context, "Вывод всего имущества", e)
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
                    ["🏦 Банк", "bank"],
                    ["🌾 Сельское хозяйство", "wheat"]
                ]
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесополоса", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/copper/) && buildingButtons.push(["🪙 Бронзовый рудник", "copper"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебрянный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += NameLibrary.GetPlayerResources(context) + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\n\n⚠ Если вы не прописаны в этом городе, то сначала придется получить разрешение на строительство от главы города.", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(!context.player.CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
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
                if(parseInt(context.player.location) === parseInt(context.player.registration))
                {
                    await Data.LoadBuildings()
                    await Keys.create({
                        houseID: build.dataValues.id,
                        ownerID: context.player.id,
                        name: "🔑 " + build.dataValues.name,
                        description: "Ключ от постройки - " + NameLibrary.GetBuildingType(build.dataValues.type) + " в городе " + Data.GetCityName(context.player.location)
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
                            await context.send(`⚠ Время ожидания одобрения строительства постройки \"${NameLibrary.GetBuildingType(build.dataValues.type)}\" вышло, рсурсы возвращены.`)
                            let count = 0
                            for(let i = 0; i < context.player.waitingAllowBuilding.length; i++)
                            {
                                if (context.player.waitingAllowBuilding[i])
                                {
                                    if(context.player.waitingAllowBuilding[i][1]) count++
                                    else delete context.player.waitingAllowBuilding[i]
                                }
                            }
                            if(count === 0) delete context.player.waitingAllowBuilding
                        }, 86400000)
                    ])
                    await api.api.messages.send({
                        user_id: Data.GetCity(context.player.location).leaderID,
                        random_id: Math.round(Math.random() * 100000),
                        message: `Игрок *id${context.player.id}(${context.player.nick}) хочет построить ${NameLibrary.GetBuildingType(build.dataValues.type)}. Разрешить строительство?`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "allow_user_building", item: context.player.id, parameter: build.dataValues.id}), keyboard.declineCallbackButton({command: "decline_user_building", item: context.player.id, parameter: build.dataValues.id})]]).inline().oneTime()
                    })
                    await context.send("✅ Заявка на возведение постройки подана, ресурсы зарезервированы", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Пользователь строит новое здание", e)
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
                    buildingButtons.push([buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    request += `${NameLibrary.GetBuildingType(buildings[i].dataValues.type)} \"${buildings[i].dataValues.name}\" ${buildings[i].dataValues.level} уровня\n`
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()

                building = Data.ParseButtonID(building)
                buildings.forEach(key => {if(parseInt(key.dataValues.id) === parseInt(building)) building = key.dataValues})
                if(building.level >= 5)
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
                await ErrorHandler.SendLogs(context, "Пользователь улучшает свое здание", e)
            }
        })
    }
}

module.exports = new BuildersAndControlsScripts()