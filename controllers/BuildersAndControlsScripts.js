const InputManager = require("./InputManager");
const Data = require("../models/CacheData");
const keyboard = require("../variables/Keyboards");
const {City, Country, PlayerStatus, Player, Warning, Ban, LastWills, Buildings,
    CountryResources, CityResources
} = require("../database/Models");
const api = require("../middleware/API");
const ErrorHandler = require("../error/ErrorHandler")
const NameLibrary = require("../variables/NameLibrary")
class BuildersAndControlsScripts
{
    async NewCountry(context, current_keyboard)
    {
        return new Promise(async (resolve, reject) => {
            try
            {
                //ввод названия фракции
                let name = await InputManager.InputString(
                    context,
                    "1️⃣ Введите название фракции (от 2 до 30 символов):",
                    current_keyboard,
                    2,
                    30)
                if (!name) return reject()
                while(Data.countries.includes(name))
                {
                    name = await InputManager.InputString(
                        context,
                        "⚠ Фракция с таким названием уже существует.",
                        current_keyboard,
                        2,
                        30)
                    if (!name) return reject()
                }

                //описание
                const description = await InputManager.InputString(
                    context,
                    "2️⃣ Сделайте описание фракции. (до 1000 символов)",
                    current_keyboard,
                    0,
                    1000
                )
                if(!description) return reject()

                //фото
                const preview = await InputManager.InputPhoto(
                    context,
                    `3️⃣ Отправьте фото для иллюстрации.\n⚠ Это фото используется для генерации карусели с фракциями для удобства игроков, создать фракцию без фото - нельзя.\n⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету`,
                    current_keyboard)
                if (!preview) return reject()

                //приветственное фото
                const welcomePhoto = await InputManager.InputPhoto(
                    context,
                    `4️⃣ Отправьте приветственное фото\n⚠ Это фото будет встречать новых граждан. (Фото обязательно)`,
                    current_keyboard)
                if(!welcomePhoto) return reject()

                //ввод названия столицы
                let capitalName = await InputManager.InputString(
                    context,
                    "5️⃣ Введите название столицы (от 2 до 30 символов):",
                    current_keyboard,
                    2,
                    30)
                if (!capitalName) return reject()
                while(Data.cities.includes(capitalName))
                {
                    capitalName = await InputManager.InputString(
                        context,
                        "⚠ Город с таким названием уже существует.",
                        current_keyboard,
                        2,
                        30)
                    if (!capitalName) return reject()
                }

                //выбор правителя
                let leader = await InputManager.SearchUser(context, "6️⃣ Теперь нужно указать правителя.")
                if(!leader) return reject()

                while(leader.dataValues.status === "leader")
                {
                    leader = await InputManager.SearchUser(context, `⚠ *id${leader.dataValues.id}(${leader.dataValues.nick}) уже является правителем.`)
                    if(!leader) return reject()
                }

                //группа
                let groupId = await InputManager.InputGroup(
                    context,
                    `7️⃣ Укажите группу этой фракции.`,
                    current_keyboard)
                if(!groupId) return reject()

                //бюджет
                let budget = await InputManager.InputInteger(
                    context,
                    "8️⃣ Введите начальный бюджет фракции.",
                    current_keyboard
                )
                if (!budget) return reject()

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
                if(!resources) return reject()
                let resName = NameLibrary.GetResourceName(resources)

                const wheat = await InputManager.InputInteger(context, "🌾 Введите начальный запас зерна", current_keyboard, 0)
                if(!wheat) return reject()

                const wood = await InputManager.InputInteger(context, "🪵 Введите начальный запас древесины", current_keyboard, 0)
                if(!wheat) return reject()

                const stone = await InputManager.InputInteger(context, "⛰ Введите начальный запас камня", current_keyboard, 0)
                if(!wheat) return reject()

                const iron = await InputManager.InputInteger(context, "🌑 Введите начальный запас железа", current_keyboard, 0)
                if(!wheat) return reject()

                const copper = await InputManager.InputInteger(context, "🪙 Введите начальный запас меди", current_keyboard, 0)
                if(!wheat) return reject()

                const silver = await InputManager.InputInteger(context, "🥈 Введите начальный запас серебра", current_keyboard, 0)
                if(!wheat) return reject()

                const diamonds = await InputManager.InputInteger(context, "💎 Введите начальный запас алмазов", current_keyboard, 0)
                if(!diamonds) return reject()

                await context.send(`Итак, мы имеем следующее:\nНазвание: ${name}\nСтолица: ${capitalName}\nГруппа: *public${groupId}(${name})\nПравитель: *id${leader.dataValues.id}(${leader.dataValues.nick})\nБюджет: ${budget}\nРесурс: ${resName}\nЗерно: ${wheat} Древесина: ${wood} Камень: ${stone}\nЖелезо: ${iron} Медь: ${copper} Серебро: ${silver}`)
                let accept = await InputManager.InputBoolean(context, "Верно?", current_keyboard)
                if(!accept)
                {
                    await context.send('⛔ Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите игрока.", current_keyboard)
                if (!user) return reject()
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(user.dataValues.role))
                {
                    context.send(`⛔ Вы не имеете права изменять роль игрока *id${user.dataValues.id}(${user.dataValues.nick}).`, {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return reject()
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
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                // Выбор гос-ва
                const buttons = Data.GetCountryButtons()
                if(buttons.length === 0)
                {
                    await context.send("⚠ Ни одна фракция не обнаружена.")
                    return reject()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите государство", buttons, current_keyboard)
                if(!country) return reject()
                country = Data.ParseButtonID(country)

                //Поиск игрока
                let newLeader = await InputManager.SearchUser(context, "2️⃣ Выберите пользователя")
                if(!newLeader) return reject()

                //Подтверждение
                if(newLeader.dataValues.status === "leader")
                {
                    await context.send(`⚠ *id${newLeader.dataValues.id}(${newLeader.dataValues.nick}) уже является правителем!`)
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return reject()

                const warnings = await Warning.findAll({where: {id: user.dataValues.id}})
                if(warnings.length === 0)
                {
                    context.send(`⚠ У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет предупреждений`,
                        {
                            keyboard: keyboard.build(current_keyboard)
                        })
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const user = await InputManager.SearchUser(context, "Выберите пользователя.", current_keyboard)
                if(!user) return reject()
                if(!user.dataValues.isBanned)
                {
                    context.send(`Пользователь *id${user.dataValues.id}(${user.dataValues.nick}) не забанен.`,
                        {
                            keyboard: keyboard.build(current_keyboard)
                        })
                    return reject()
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
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const user = await InputManager.SearchUser(context, "1️⃣ Выберите пользователя, которому завещаете все свое имущество", current_keyboard)
                if(!user) return reject()
                if(user.dataValues.id === context.player.id)
                {
                    context.send("⚠ Указывать себя в завещании запрещено.")
                    return reject()
                }

                const lastWillText = await InputManager.InputString(context, "2️⃣ Введите текст завещания. Этот текст будет виден только вам и наследователю после вашей смерти. (до 1000 символов)", current_keyboard, 0, 1000)
                if (!lastWillText)
                {
                    await context.send("⛔ Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const lastWill = await LastWills.findOne({where: {userID: context.player.id}})
                if(!lastWill) return reject()
                await context.send(`*id${context.player.id}(Ваше) завещание:\nНаследователь: ${await NameLibrary.GetPlayerNick(lastWill.dataValues.successorID)}\nТекст:${lastWill.dataValues.text}`)
                const success = await InputManager.InputBoolean(context, "Вы уверены что хотите удалить свое завещание?")
                if(!success) return reject()

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
                    Data.users[context.player.id].state = scenes.Menu
                }, need * 60000)
                Data.users[context.player.id].state = scenes.Relaxing
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

    // async GoTo(context, current_keyboard)
    // {
    //     return new Promise(async (resolve, reject) => {
    //         try
    //         {
    //             const location = await City.findOne({where: {id: context.player.location}})
    //             const localCities = await City.findAll({where: {countryID: location.dataValues.countryID}})
    //             const cities = []
    //             localCities.forEach(key => {
    //                 if(key.dataValues.id !== location.dataValues.id)
    //                 {
    //                     cities.push([key.dataValues.name, "ID" + key.dataValues.id])
    //                 }
    //             })
    //             cities.push(["В другую фракцию", "other"])
    //
    //             context.send("Куда хотите отправиться?",
    //                 {
    //                     attachment: "photo565472458_457240344"
    //                 })
    //             let place = await InputManager.KeyboardBuilder(context, "Доступные города (перемещение длится 36 минут)", cities, current_keyboard)
    //             if(!place) return reject()
    //             if(place === "other")
    //             {
    //                 context.send("Здесь будет выбор государства")
    //             }
    //             else
    //             {
    //                 place = Data.ParseButtonID(place)
    //                 Data.users[context.player.id].state = SceneController.WaitingWalkMenu
    //                 if(context.player.role.match(/owner|project_head|support|admin/))
    //                 {
    //                     context.send(`✅ Вы пришли в город ${Data.cities[place].name}`)
    //                     Data.users[context.player.id].location = place
    //                     Data.users[context.player.id].state = SceneController.StayInStartScreen
    //                 }
    //                 else
    //                 {
    //                     Data.users[context.player.id].timeout = setTimeout(() => {
    //                         context.send(`✅ Вы пришли в город ${Data.cities[place].name}`)
    //                         Data.users[context.player.id].location = place
    //                         Data.users[context.player.id].state = SceneController.StayInStartScreen
    //                     },  Data.variables["cityToCityTime"])
    //                 }
    //             }
    //         }
    //         catch (e)
    //         {
    //             await ErrorHandler.SendLogs(context, "Выбор куда отправиться", e)
    //         }
    //     })
    // }

    async DeleteBuildingForMayor(context, current_keyboard)
    {
        return new Promise(async (resolve, reject) => {
            try
            {
                const buildings = await Buildings.findAll({where: {cityID: context.cityID}})
                let kb = []
                for (let i = 0; i < buildings.length; i++)
                {
                    if(buildings[i].dataValues.ownerID === "country")
                    {
                        kb.push([NameLibrary.GetBuildingName(buildings[i].dataValues.type) + " " + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    }
                }
                const buildingID = await InputManager.KeyboardBuilder(context, "Выберите здание, которое хотите снести (вы можете распоряжаться только государственными зданиями)", kb, current_keyboard)
                if(!buildingID) return reject()

                const accept = await InputManager.InputBoolean(context, `Снос здания стоит 200 монет. Сейчас в бюджете ${Data.cities[context.cityID].resources.money} монет.\nВы действительно ходите снести это здание?`)
                if (!accept) return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {
                const buildings = await Buildings.findAll({where: {cityID: context.cityID}})
                let kb = []
                for (let i = 0; i < buildings.length; i++)
                {
                    if(buildings[i].dataValues.ownerID === "country")
                    {
                        kb.push([NameLibrary.GetBuildingName(buildings[i].dataValues.type) + " " + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    }
                }
                const buildingID = await InputManager.KeyboardBuilder(context, "Выберите здание, которое хотите снести (вы можете распоряжаться только государственными зданиями)", kb, current_keyboard)
                if(!buildingID) return reject()

                const accept = await InputManager.InputBoolean(context, `Снос здания стоит 200 монет.\nВы действительно ходите снести это здание?`)
                if (!accept) return reject()
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
        return new Promise(async (resolve, reject) => {
            try
            {

            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "Предложение свадьбы", e)
            }
        })
    }
}

module.exports = new BuildersAndControlsScripts()