const keyboard = require("../variables/Keyboards")
const {Player} = require("../database/Models")
const api = require("../middleware/API")
class InputManager
{
    static async InputInteger(context, message, current_keyboard, min, max)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                if (min) min = Math.max(min, -2147483646)
                if (max) max = Math.min(max, 2147483646)
                min = min || -2147483646
                max = max || 2147483646

                let answer = await context.question(message, {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })
                while ((isNaN(answer.text) || (parseInt(answer.text, 10) < min || parseInt(answer.text, 10) > max)) && !answer.payload)
                {
                    answer = await context.question("⚠ Введите корректное значение.", {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                }
                if(answer.payload)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(parseInt(answer.text))
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputInteger", e)
            }
        })
    }

    static async InputDefaultInteger(context, message, current_keyboard, min, max, def)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                if (min) min = Math.max(min, -2147483646)
                if (max) max = Math.min(max, 2147483646)
                min = min || -2147483646
                max = max || 2147483646

                let answer = await context.question(message + "\n\nℹ Значение по умолчанию = " + def, {
                    keyboard: keyboard.build([[keyboard.defaultsButton], [keyboard.cancelButton]])
                })
                while ((isNaN(answer.text) || (parseInt(answer.text, 10) < min || parseInt(answer.text, 10) > max)) && !answer.payload)
                {
                    answer = await context.question("⚠ Введите корректное значение." + "\n\nℹ Значение по умолчанию = " + def, {
                        keyboard: keyboard.build([[keyboard.defaultsButton], [keyboard.cancelButton]])
                    })
                }
                if(answer.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                if(answer.payload)
                {
                    return resolve(parseInt(def))
                }
                return resolve(parseInt(answer.text))
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputDefaultInteger", e)
            }
        })
    }

    static async InputFloat(context, message, current_keyboard, min, max)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                if (min) min = Math.max(min, -2147483646)
                if (max) max = Math.min(max, 2147483646)
                min = min || -2147483646
                max = max || 2147483646

                let answer = await context.question(message, {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })
                while ((isNaN(answer.text) || (parseFloat(answer.text) < min || parseFloat(answer.text) > max)) && !answer.payload)
                {
                    answer = await context.question("⚠ Введите корректное значение.", {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                }
                if(answer.payload)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(parseFloat(answer.text))
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputInteger", e)
            }
        })
    }

    static async InputDate(context, message, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let answer = await context.question(message + "\n\nℹ Рекомендуемый формат даты: MM.DD.YY HH:MM (Время по МСК)\n\nℹ По умолчанию = сейчас", {
                    keyboard: keyboard.build([[keyboard.defaultsButton], [keyboard.cancelButton]])
                })
                let date = new Date(answer.text)
                while (date.toString().match(/invalid/i) && !answer.payload)
                {
                    answer = await context.question("⚠ Некорректное значение", {
                        keyboard: keyboard.build([[keyboard.defaultsButton], [keyboard.cancelButton]])
                    })
                    date = new Date(answer.text)
                }
                if(answer.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                if(answer.payload)
                {
                    date = new Date()
                }
                return resolve(date)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputDefaultInteger", e)
            }
        })
    }

    static async InputString(context, message, current_keyboard, min, max)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                min = min || 0
                max = max || Number.MAX_SAFE_INTEGER

                let answer = await context.question(message, {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })
                while ((answer.text?.length <= min || answer.text?.length >= max) && !answer.payload && !isNaN(answer.text))
                {
                    answer = await context.question("⚠ Введите корректное значение.", {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                }
                if(answer.payload)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(answer.text || "")
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputString", e)
            }
        })
    }

    static async InputBoolean(context, message, current_keyboard, yesButton, noButton)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                yesButton = yesButton || keyboard.yesButton
                noButton = noButton || keyboard.noButton

                const yesChoice = yesButton.options.payload["choice"]

                let answer = await context.question(message, {
                    keyboard: keyboard.build([[yesButton, noButton]])
                })
                while (!answer.payload)
                {
                    answer = await context.question("⚠ Выберите из предложенного снизу.", {
                        keyboard: keyboard.build([[yesButton, noButton]])
                    })
                }
                return resolve(answer.payload.choice === yesChoice)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputBoolean", e)
            }
        })
    }

    static async InputPhoto(context, message, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let answer = await context.question(message, {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })
                let photo = answer.attachments[0]?.type === "photo" ? answer.attachments[0].largeSizeUrl : null
                while (!answer.payload && !photo)
                {
                    answer = await context.question("⚠ Отправьте фото" , {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                    photo = answer.attachments[0]?.type === "photo" ? answer.attachments[0].largeSizeUrl : null
                }
                if(answer.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                let url = await api.upload.messagePhoto({source: {value: photo}})
                return resolve(url.toString())
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputPhoto", e)
            }
        })
    }

    static async InputLotPhoto(context, message, current_keyboard, max)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                max = max || 10
                let count = 0
                const photos = []
                let answer = null
                let photo = ""
                let url = ""
                do
                {
                    answer = await context.question(message, {
                        keyboard: keyboard.build([count === 0 ? [keyboard.cancelButton] : [keyboard.cancelButton, keyboard.nextButton]])
                    })
                    photo = answer.attachments[0]?.type === "photo" ? answer.attachments[0].largeSizeUrl : null
                    while (!answer.payload && !photo)
                    {
                        answer = await context.question("⚠ Отправьте фото" , {
                            keyboard: keyboard.build([count === 0 ? [keyboard.cancelButton] : [keyboard.cancelButton, keyboard.nextButton]])
                        })
                        photo = answer.attachments[0]?.type === "photo" ? answer.attachments[0].largeSizeUrl : null
                    }
                    if(!answer.payload)
                    {
                        url = await api.upload.messagePhoto({source: {value: photo}})
                        photos.push(url)
                        count ++
                        message = `✅ Загружено ${count} фото`
                    }
                }
                while(count < max && !answer.payload)
                if(answer.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(photos.map(key => {return key.toString()}).join(","))
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputLotPhoto", e)
            }
        })
    }

    static async InputGroup(context, message, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let answer = await context.question(message + "\n\nℹ Перешлите в диалог пост из группы, которую хотите выбрать", {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })

                let id = answer.attachments[0]?.type === "wall" ? answer.attachments[0]?.ownerId : null
                while (!answer.payload && !id)
                {
                    answer = await context.question("⚠ Перешлите пост", {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                    id = answer.attachments[0]?.largeSizeUrl
                }
                if(answer.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(id * -1)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/InputGroup", e)
            }
        })
    }

    static async ChooseButton(context, message, kb)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let answer = await context.question(message, {
                    keyboard: keyboard.build(kb)
                })
                while (!answer.payload)
                {
                    answer = await context.question("⚠ Выберите из предложенного снизу.", {
                        keyboard: keyboard.build(kb)
                    })
                }
                return resolve(answer.payload.choice)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/ChooseButton", e)
            }
        })
    }

    // Радио клавиатуру можно использовать когда надо изменить несколько параметров типа BOOL
    // Принимает в себя 3-м параметром массив формата [[Имя(STRING), Значение(STRING), Вкл/Выкл(BOOL)], [Имя(STRING), Значение(STRING), Вкл/Выкл(BOOL)], ...]
    // Метод рассчитан на максимум 16 передаваемых параметров, если параметров надо ввести больше - делай несколько таких методов последовательно
    // Метод возвращает двухмерный массив формата [[Значение(STRING), Вкл/Выкл(BOOL)], [Значение(STRING), Вкл/Выкл(BOOL)], ...]
    static async RadioKeyboardBuilder(context, message, array, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                const arrayToKeyboard = (arr) => {
                    let kb = []
                    for(let i = 0; i < Math.ceil(arr.length / 4); i++)
                    {
                        kb[i] = arr.slice((i * 4), (i * 4) + 4)
                    }
                    kb.push([keyboard.cancelButton, keyboard.nextButton])
                    return kb
                }
                const convertKeyboard = (kb, choice) => {
                    for (let i = 0; i < kb.length; i++)
                    {
                        if(kb[i].options.payload.choice === choice)
                        {
                            kb[i].options.color = kb[i].options.color === "negative" ? "positive" : "negative"
                        }
                    }
                    return kb
                }
                let radioKeyboard = []
                let answer = null
                let request = message + "\n\nℹ Пометьте пункты которые вы хотите включить зеленым, а которые выключить - красным"
                for(let i = 0; i < array.length; i++)
                {
                    radioKeyboard[i] = keyboard.secondaryButton([array[i][0], array[i][1]])
                    radioKeyboard[i].options.color = array[i][2] ? "positive" : "negative"
                }
                do
                {
                    answer = await context.question(request, {
                        keyboard: keyboard.build(arrayToKeyboard(radioKeyboard))
                    })
                    request = "Ок"
                    if(answer.payload) radioKeyboard = convertKeyboard(radioKeyboard, answer.payload.choice)
                }
                while(!answer?.payload?.choice.match(/cancel|next/))
                if(answer?.payload?.choice === "cancel")
                {
                    await context.send('🚫 Ввод отменен', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                array = []
                for(let i = 0; i < radioKeyboard.length; i++)
                {
                    array.push([radioKeyboard[i].options.payload.choice, radioKeyboard[i].options.color === "positive"])
                }
                return resolve(array)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/RadioKeyboardBuilder", e)
            }
        })
    }

    // KeyboardBuilder строит многостраничную клавиатуру с возможностью переключения между страницами
    // Формат входного массива [[Имя(STRING), Значение(STRING)],[Имя(STRING), Значение(STRING)]...]
    // Возвращает значение выбранной кнопки (STRING)
    // Примечание: ВК не любит принимать в качестве значения тип INTEGER, поэтому если надо отправить в значении id чего-нибудь,
    // прилепи его к строке "ID" + <id>, после этого полученное после выбора значение id можно спарсить через Data.ParseButtonID(<"ID" + id>)
    static async KeyboardBuilder(context, message, array, current_keyboard)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let page = 0
                let end = Math.ceil(array.length/12)
                let pages = []
                let answer = null
                let kb = [[]]
                for(let i = 0; i < end; i++)
                {
                    pages[i] = array.slice((i * 12), (i * 12) + 12)
                }
                const endKB = {
                    one: [keyboard.backButton],
                    end: [keyboard.leftButton, keyboard.backButton],
                    start: [keyboard.backButton, keyboard.rightButton],
                    center: [keyboard.leftButton, keyboard.backButton, keyboard.rightButton]
                }
                const renderPage = (id) =>
                {
                    let columns = []
                    const kb = [[], [], []]
                    for(let i = 0; i < Math.ceil(pages[id].length / 3); i++)
                    {
                        columns[i] = pages[id].slice((i * 3), (i * 3) + 3)
                    }
                    for(let key of columns)
                    {
                        for(let i = 0; i < key.length; i++)
                        {
                            if(key[i])
                            {
                                kb[i].push(keyboard.secondaryButton(key[i]))
                            }
                        }
                    }
                    if(pages[id-1] && pages[id+1]) kb.push(endKB["center"])
                    else if(pages[id+1]) kb.push(endKB["start"])
                    else if(pages[id-1]) kb.push(endKB["end"])
                    else kb.push(endKB["one"])
                    return kb
                }
                do
                {
                    if(answer?.payload?.choice === "right")
                    {
                        page = Math.min(page + 1, end)
                    }
                    if(answer?.payload?.choice === "left")
                    {
                        page = Math.max(page - 1, 0)
                    }
                    kb = renderPage(page)
                    answer = await context.question(message, {
                        keyboard: keyboard.build(kb)
                    })
                }
                while ((!answer.payload || answer.payload.choice.match(/left|right/)))
                if(answer.payload.choice === "back")
                {
                    await context.send('🚫 Ввод отменен', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(answer.payload.choice)
            }
            catch (e)
            {
                await api.SendLogs(context, "InputManager/KeyboardBuilder", e)
            }
        })
    }

    static async InputUser(context, message, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user
                let answer = await context.question(message + "\n\nℹ Введите ник, ID игрока, упомяните его (через @ или *) или перешлите сюда его сообщение. (Именно перешлите, ответ на сообщение не сработает)", {
                    keyboard: keyboard.build([[keyboard.cancelButton]])
                })
                if(answer.payload)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                if(answer.forwards?.length > 0 && !answer.payload)
                {
                    user = await Player.findOne({where: {id: answer.forwards[0].senderId}})
                }
                else if(answer.text?.match(/id\d+/) && !answer.payload)
                {
                    let id = answer.text.match(/id\d+/)[0]
                    id = parseInt(id.replace("id", ""))
                    user = await Player.findOne({where: {id: id}})
                }
                else if(answer.text?.match(/\d{5,}/) && !answer.payload)
                {
                    let id = answer.text.match(/\d{5,}/)[0]
                    user = await Player.findOne({where: {id: id}})
                }
                else if(answer.text && !answer.payload)
                {
                    user = await Player.findOne({where: {nick: answer.text}})
                }
                else
                {
                    return resolve(null)
                }
                while (!answer.payload && !user)
                {
                    answer = await context.question("⚠ Игрок не найден", {
                        keyboard: keyboard.build([[keyboard.cancelButton]])
                    })
                    if(answer.forwards?.length > 0 && !answer.payload)
                    {
                        user = await Player.findOne({where: {id: answer.forwards[0].senderId}})
                    }
                    else if(answer.text?.match(/id\d+/) && !answer.payload)
                    {
                        let id = answer.text.match(/id\d+/)[0]
                        id = parseInt(id.replace("id", ""))
                        user = await Player.findOne({where: {id: id}})
                    }
                    else if(answer.text?.match(/\d{5,}/) && !answer.payload)
                    {
                        let id = answer.text.match(/\d{5,}/)[0]
                        user = await Player.findOne({where: {id: id}})
                    }
                    else if(answer.text && !answer.payload)
                    {
                        user = await Player.findOne({where: {nick: answer.text}})
                    }
                    else
                    {
                        return resolve(null)
                    }
                }
                if(answer.payload)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(user)
            }
            catch (e)
            {
                return resolve(null)
            }
        })
    }

    static async InputPrice(context, message, current_keyboard, canBeFloat)
    {
        return new Promise(async (resolve) => {
            const resourcesKeyboard = [
                ["🌾 Зерно", "wheat", false],
                ["🪵 Древесина", "wood", false],
                ["🪨 Камень", "stone", false],
                ["🌑 Железо", "iron", false],
                ["🥉 Бронза", "copper", false],
                ["🥈 Серебро", "silver", false],
                ["💎 Алмазы", "diamond", false]
            ]
            const resourceNames = {
                wheat: "зерна",
                wood: "дерева",
                stone: "камня",
                iron: "железа",
                copper: "бронзы",
                silver: "серебра",
                diamond: "алмазов"
            }
            let resources = await InputManager.RadioKeyboardBuilder(context, message + "\n\n1️⃣ Выберите ресурсы:", resourcesKeyboard, current_keyboard)
            if(!resources) return resolve()
            if(resources.filter(key => {return key[1]}).length === 0)
            {
                await context.send('🚫 Ресурсы не выбраны.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            let price = {}
            for(const res of resources)
            {
                if(res[1])
                {
                    price[res[0]] = 0
                }
            }
            for(const key of Object.keys(price))
            {
                let count = canBeFloat ? await InputManager.InputFloat(context, `Введите необходимое количество ${resourceNames[key]}`, current_keyboard, 0) : await InputManager.InputInteger(context, `Введите необходимое количество ${resourceNames[key]}`, current_keyboard, 0)
                if(!count) return resolve(null)
                price[key] = count
            }
            return resolve(price)
        })
    }
}

module.exports = InputManager