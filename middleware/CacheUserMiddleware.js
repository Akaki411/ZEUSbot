const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models");
const Data = require("../models/CacheData");
const User = require("../models/User");
const keyboard = require("../variables/Keyboards");
const commands = require("../variables/Commands");
const SceneManager = require("../controllers/SceneController")
const api = require("./API");
const InputManager = require("../controllers/InputManager");
const ErrorHandler = require("../error/ErrorHandler");

module.exports = async (context, next) =>
{
    context.command = context.text?.toLowerCase()
    const {peerId} = context

    if(context.peerType === "chat")
    {
        return next()
    }

    if(Data.users[peerId])
    {
        context.player = Data.users[peerId]
        return next()
    }
    else
    {
        const user = await Player.findOne({where: {id: peerId}})
        if(user)
        {
            if(!user.dataValues.isBanned)
            {
                const status = await PlayerStatus.findOne({where: {id: peerId}})
                const info = await PlayerInfo.findOne({where: {id: peerId}})
                const resources = await PlayerResources.findOne({where: {id: peerId}})
                Data.users[peerId] = new User(user, status, info, resources)
                Data.users[peerId].SetState(SceneManager.StayInStartScreen)
                context.player = Data.users[peerId]
                return next()
            }
            else
            {
                context.send(`🚫Внимание!🚫
                                Вы были забанены в проекте *public218388422 («ZEUS - Вселенная игроков»)
                                Если вы не согласны с блокировкой - напишите одному из админов:
                                ${Data.admins.map(key => {
                    return "@id" + key.id + "(" + key.nick +")\n"
                })}`, {
                    keyboard: keyboard.none
                })
            }
        }
        else
        {
            const current_keyboard = [[keyboard.registrationButton]]
            if(context.command.match(commands.registration))
            {
                try
                {
                    const peerInfo = await api.GetUserData(context.peerId)
                    let temp

                    //ввод ника
                    let name = await InputManager.InputString(context, `✍🏾 Добро пожаловать в канцелярию.\n\n*id${context.peerId} (${peerInfo.first_name}), вы хотите зарегистрироваться в проекте *public218388422 («ZEUS - Вселенная игроков»).\n\n1️⃣ Введите никнейм, которым вы будете пользоваться в будущем. Учтите, что необходимо установить античное имя, реально существовавшее в истории. Со списком таких вы можете ознакомиться ниже.\n👉🏾 Греческие имена: https://ru.m.wikipedia.org/wiki/Список_имён_греческого_происхождения\n👉🏾 Римские имена: https://ru.m.wikipedia.org/wiki/Римские_имена\n👉🏾 Персидские имена: https://ru.m.wikipedia.org/wiki/Персидские_имена`,
                        current_keyboard,
                        2, 20)
                    if(!name) return
                    temp = await Player.findOne({where: {nick: name}})
                    while(temp && name)
                    {
                        name = await InputManager.InputString(context, `⚠ Этот ник занят`,
                            current_keyboard,
                            [2, 20])
                        temp = await Player.findOne({where: {nick: name}})
                    }
                    if(!name) return

                    //ввод возраста
                    const age = await InputManager.InputInteger(context,
                        `2️⃣ Теперь укажите возраст вашего персонажа.\n⚠ Возраст может быть выбран от 16 до 100 лет.`,
                        current_keyboard,
                        16, 100)
                    if(!age) return

                    //выбор пола
                    const gender = await InputManager.InputBoolean(context,
                        `3️⃣ Укажите пол вашего персонажа.`,
                        current_keyboard,
                        keyboard.manButton,
                        keyboard.womanButton)
                    if(gender === null) return

                    //описание персонажа
                    const description = await InputManager.InputString(context,
                        `4️⃣ Расскажите о своём персонаже! Откуда он родом, чем занимается. Возможно есть ли у него семья, дети. С какой целью он пришёл в то место, где находится сейчас.\n⚠ Длина до 1000 символов.`,
                        current_keyboard,
                        0, 1000)
                    if(!description) return

                    //национальность
                    let nation = await InputManager.ChooseButton(context,
                        "5️⃣ Какова национальность вашего персонажа?",
                        [
                            [keyboard.romanButton, keyboard.celtButton],
                            [keyboard.greekButton, keyboard.armenianButton],
                            [keyboard.persianButton, keyboard.germanButton]
                        ],
                        current_keyboard)

                    switch (nation)
                    {
                        case "rim":
                            nation = "🔱 Римлянин"
                            context.send(`🔱 Ваши предки покорили Италику и Средиземноморье, подарили миру институты гражданства, легионы ваших предков храбро сражались за Рим и его ценности, пока не были повержены ордой варваров. Браво!`)
                            break
                        case "celt":
                            nation = "🍀 Кельт"
                            context.send(`🍀 Ваши предки завоевали обширные земли, от Альбиона до Анатолии, сохраните ли вы достоинство, данное вам?`)
                            break
                        case "greek":
                            nation = "🏛️ Грек"
                            context.send(`🏛️ Сколько умов подарила Греция миру, сколько оливок было выращено на благодатной греческой земле... О, греки, весь мир пропитан вашей культурой! Браво!`)
                            break
                        case "armenian":
                            nation = "💃 Армянин"
                            context.send(`💃 Край гор, вина... На той почве растёт только лучшая еда, а вашей горячей кровью восхищаются во всём мире... Добро пожаловать домой, путник.`)
                            break
                        case "persian":
                            nation = "🐘 Перс"
                            context.send(`🐘 Восточный край богатств и шёлка, Персия. Огромные земли принадлежат персидскому народу, а воины на слонах достанут каждого, кто посмеет посягнуть на суверенитет гордой Персии. Браво!`)
                            break
                        case "german":
                            nation = "⚔ Германец"
                            context.send(`⚔ Мужественные и храбрые воины с севера. Тяжёлые северные условия подготовили их к любым трудностям и лишениям, суровее них, скорее всего, нет никого на всём белом свете. Браво!`)
                            break
                    }

                    //местоположение
                    let countries = Data.GetCountryButtons()

                    let location = await InputManager.KeyboardBuilder(context,
                        "6️⃣ Почти готово, теперь выберите в какой фракции вы хотите появиться после регистрации.",
                        countries,
                        current_keyboard)
                    if(!location) return
                    location = Data.ParseButtonID(location)

                    await context.send(`${Data.GetCountryName(location)}\n${Data.countries[location].description}`,
                        {
                            attachment: Data.countries[location].welcomePhotoURL
                        })

                    const user = await Player.create({
                        id: context.peerId,
                        nick: name,
                        gender: gender
                    })
                    const status = await PlayerStatus.create({
                        id: context.peerId,
                        location: Data.countries[location].capitalID
                    })
                    const info = await PlayerInfo.create({
                        id: context.peerId,
                        description: description,
                        nationality: nation,
                        age: age
                    })
                    const resources = await PlayerResources.create({id: context.peerId})
                    Data.users[context.peerId] = new User(user, status, info, resources)
                    Data.users[context.peerId].SetState(SceneManager.StayInStartScreen)
                    context.player = Data.users[context.peerId]

                    let kb = SceneManager.GetStartMenuKeyboard(context)

                    context.send(`🏁 Регистрация завершена, *id${context.peerId}(${name}). Радуйтесь каждому дню, проведенному в этом мире. Пусть Боги оберегают ваш путь...`, {
                        keyboard: keyboard.build(kb)
                    })
                    context.send("Если вы хотите ближе познакомиться с командами и проектом, то изучите нашу группу. Для ознакомления с государствами перейдите в раздел \"Локация\", для глубинного изучения можете посетить сообщества. Выбирайте с умом!",{
                        template: `{
                            "type": "carousel",
                            "elements": [
                                ${Data.countries.filter(key => {
                                    return key !== undefined
                                }).map(key => {
                                    if(key)
                                    {
                                        return JSON.stringify({
                                            title: key.name,
                                            description: key.description,
                                            photo_id: key.photoURL.replace("photo", ""),
                                            action: {
                                                type: "open_link",
                                                link: "https://vk.com/public" + key.groupID
                                            },
                                            buttons: [
                                                {
                                                    action: {
                                                        type: "open_link",
                                                        link: "https://vk.com/public" + key.groupID,
                                                        label: "Перейти в сообщество"
                                                    }
                                                }
                                            ]
                                        })
                                    }
                                })}
                            ]
                        }`
                    })
                }
                catch (e)
                {
                    context.player = {
                        id: context.peerId,
                        nick: "Незарегистрированный пользователь"
                    }
                    await ErrorHandler.SendLogs(context, "Регистрация", e)
                }
            }
            else if(context.peerType === "user")
            {
                context.send(`Добро пожаловать в Проект ZEUS, более тысячи участников уже два года играют с нами.\nВойны, интриги, симулятор античного жителя, всё это доступно для тебя... осталось только зарегистрироваться!\nПосле регистрации вам будет доступно меню игрока... \nС изменением вашего статуса будут меняться и ваши возможности.\nНажимая на кнопку "Зарегистрироваться" вы принимаете правила проекта.`,
                    {
                        keyboard: keyboard.build(current_keyboard)
                    })
            }
        }
    }
}