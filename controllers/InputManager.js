const keyboard = require("../variables/Keyboards")
const {Player} = require("../database/Models")

class InputManager
{
    static async InputInteger(context, message, current_keyboard, min, max)
    {
        return new Promise(async (resolve) => {
            min = min || Number.MIN_SAFE_INTEGER
            max = max || Number.MAX_SAFE_INTEGER

            let answer = await context.question(message, {
                keyboard: keyboard.build([[keyboard.cancelButton]]),
                answerTimeLimit: 300_000
            })
            while ((isNaN(answer.text) || (parseInt(answer.text, 10) < min || parseInt(answer.text, 10) > max)) && !answer.isTimeout && !answer.payload)
            {
                answer = await context.question("⚠ Введите корректное значение.", {
                    keyboard: keyboard.build([[keyboard.cancelButton]]),
                    answerTimeLimit: 300_000
                })
            }
            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            if(answer.payload)
            {
                await context.send('⛔ Ввод отменен.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(parseInt(answer.text, 10))
        })
    }

    static async InputString(context, message, current_keyboard, min, max)
    {
        return new Promise(async (resolve) => {
            min = min || 0
            max = max || Number.MAX_SAFE_INTEGER

            let answer = await context.question(message, {
                keyboard: keyboard.build([[keyboard.cancelButton]]),
                answerTimeLimit: 300_000
            })
            while ((answer.text?.length <= min || answer.text?.length >= max) && !answer.isTimeout && !answer.payload && !isNaN(answer.text))
            {
                answer = await context.question("⚠ Введите корректное значение.", {
                    keyboard: keyboard.build([[keyboard.cancelButton]]),
                    answerTimeLimit: 300_000
                })
            }

            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            if(answer.payload)
            {
                await context.send('⛔ Ввод отменен.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(answer.text || "")
        })
    }

    static async InputBoolean(context, message, current_keyboard, yesButton, noButton)
    {
        return new Promise(async (resolve) => {
            yesButton = yesButton || keyboard.yesButton
            noButton = noButton || keyboard.noButton

            const yesChoice = yesButton.options.payload.choice

            let answer = await context.question(message, {
                keyboard: keyboard.build([[yesButton, noButton]]),
                answerTimeLimit: 300_000
            })
            while (!answer.payload && !answer.isTimeout)
            {
                answer = await context.question("⚠ Выберите из предложенного снизу.", {
                    keyboard: keyboard.build([[yesButton, noButton]]),
                    answerTimeLimit: 300_000
                })
            }
            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(answer.payload.choice === yesChoice)
        })
    }

    static async InputPhoto(context, message, current_keyboard)
    {
        return new Promise(async (resolve) => {
            let answer = await context.question(message, {
                keyboard: keyboard.build([[keyboard.cancelButton]]),
                answerTimeLimit: 1200_000
            })
            let url = answer.attachments[0]?.type === "photo" ? answer.attachments[0]?.toString() : null
            while (!answer.payload && !answer.isTimeout && !url)
            {
                answer = await context.question("⚠ Отправьте фото", {
                    keyboard: keyboard.build([[keyboard.cancelButton]]),
                    answerTimeLimit: 1200_000
                })
                url = answer.attachments[0]?.type === "photo" ? answer.attachments[0]?.toString() : null
            }
            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            if(answer.payload?.choice === "cancel")
            {
                await context.send('⛔ Ввод отменен', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(url)
        })
    }

    static async InputGroup(context, message, current_keyboard)
    {
        return new Promise(async (resolve) => {

            await context.send(message)

            let answer = await context.question("⚠ Перешлите в диалог пост из группы, которую хотите выбрать", {
                keyboard: keyboard.build([[keyboard.cancelButton]]),
                answerTimeLimit: 300_000
            })

            let id = answer.attachments[0]?.type === "wall" ? answer.attachments[0]?.ownerId : null
            while (!answer.payload && !answer.isTimeout && !id)
            {
                answer = await context.question("⚠ Перешлите пост", {
                    keyboard: keyboard.build([[keyboard.cancelButton]]),
                    answerTimeLimit: 300_000
                })
                id = answer.attachments[0]?.largeSizeUrl
            }
            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            if(answer.payload?.choice === "cancel")
            {
                await context.send('⛔ Ввод отменен', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(id * -1)
        })
    }

    static async ChooseButton(context, message, kb, current_keyboard)
    {
        return new Promise(async (resolve) => {
            let answer = await context.question(message, {
                keyboard: keyboard.build(kb),
                answerTimeLimit: 300_000
            })
            while (!answer.payload && !answer.isTimeout)
            {
                answer = await context.question("⚠ Выберите из предложенного снизу.", {
                    keyboard: keyboard.build(kb),
                    answerTimeLimit: 300_000
                })
            }
            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(answer.payload.choice)
        })
    }

    static async KeyboardBuilder(context, message, array, current_keyboard)
    {
        // Формат массива array: [[text, choice],[text, choice]...]
        return new Promise(async (resolve) => {
            let pageSize = 12
            let page = 0
            let end = Math.ceil(array.length/pageSize)
            let pages = []
            let answer = null
            let kb = [[]]

            for(let i = 0; i < end; i++)
            {
                pages[i] = array.slice((i * pageSize), (i * pageSize) + pageSize)
            }
            do
            {
                kb = [[]]
                if(answer?.payload?.choice === "right")
                {
                    page = Math.min(page + 1, end)
                }
                if(answer?.payload?.choice === "left")
                {
                    page = Math.max(page - 1, 0)
                }
                for(let i = 0; i < Math.ceil(pages[page].length/4); i++)
                {
                    kb[i] = []
                    for(let j = 0; j < Math.min(pages[page].length - (i * 4), 4); j++)
                    {
                        kb[i].push(keyboard.secondaryButton(pages[page][(i * 4) + j]))
                    }
                }
                if(page === 0 && pages.length > 1) kb.push([keyboard.backButton, keyboard.rightButton])
                if(page === end && end > 1) kb.push([keyboard.leftButton, keyboard.backButton])
                if(page !== 0 && page !== end) kb.push([keyboard.leftButton, keyboard.backButton, keyboard.rightButton])
                if(page === end-1) kb.push([keyboard.backButton])

                answer = await context.question(message, {
                    keyboard: keyboard.build(kb),
                    answerTimeLimit: 300_000
                })
            }
            while ((!answer.payload || answer.payload.choice.match(/left|right/)) && !answer.isTimeout)

            if(answer.isTimeout)
            {
                await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            if(answer.payload.choice === "back")
            {
                await context.send('⛔ Ввод отменен', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
            return resolve(answer.payload.choice)
        })
    }

    static async SearchUser(context, message, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let answer, user

                await context.send(message)

                answer = await context.question("Введите ник, ID игрока или перешлите сюда его сообщение.", {
                    keyboard: keyboard.build([[keyboard.cancelButton]]),
                    answerTimeLimit: 300_000
                })

                if(answer.isTimeout)
                {
                    await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                if(answer.payload)
                {
                    await context.send('⛔ Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }

                if(answer.forwards.length > 0 && !answer.payload && !answer.isTimeout) user = await Player.findOne({where: {id: answer.forwards[0].senderId}})
                else if (answer.text && !answer.payload && !answer.isTimeout) {if(isNaN(answer.text)) user = await Player.findOne({where: {nick: answer.text}})}
                else if (answer.text?.match(/\d/) && !answer.payload && !answer.isTimeout) user = await Player.findOne({where: {id: answer.text}})
                else if (!answer.text || answer.payload || answer.isTimeout) return resolve(null)


                while (!answer.isTimeout && !answer.payload && !user)
                {
                    answer = await context.question("⚠ Игрок не найден", {
                        keyboard: keyboard.build([[keyboard.cancelButton]]),
                        answerTimeLimit: 300_000
                    })
                    if(answer.forwards.length > 0) user = await Player.findOne({where: {id: answer.forwards[0].senderId}})
                    else if (answer.text?.match(/\d/)) user = await Player.findOne({where: {id: answer.text}})
                    else if (answer.text) {if(isNaN(answer.text)) user = await Player.findOne({where: {nick: answer.text}})}
                    else if (!answer.text || answer.payload) return resolve(null)
                }

                if(answer.isTimeout)
                {
                    await context.send('⛔ Ввод отменен: время на ввод вышло.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                if(answer.payload)
                {
                    await context.send('⛔ Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve(null)
                }
                return resolve(user)
            }
            catch (e)
            {
                await context.send('⛔ Ввод отменен.', {
                    keyboard: keyboard.build(current_keyboard)
                })
                return resolve(null)
            }
        })
    }
}

module.exports = InputManager