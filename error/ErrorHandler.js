const api = require("../middleware/API")
const upload = require("../middleware/Upload")
const Data = require("../models/CacheData")
const fs = require('fs')
const NameLibrary = require("../variables/NameLibrary")

class ErrorHandler
{
    async SendLogs(context, place, error)
    {
        await api.SendMessage(context.player.id, "⛔Ошибка⛔\nПроизошла ошибка, вся информация отправлена поддержке, скоро это будет исправлено.")

        const filename = `error_${NameLibrary.GetDate() + "&" + NameLibrary.GetTime()}.log`
        await new Promise(res => {
            fs.appendFile("./logs/" + filename, error.stack,  (err) => {
                if (err) throw err
                return res()
            })
        })
        await upload.messageDocument({
                peer_id: context.player.id,
                source: {
                    value: "./logs/" + filename
                },
                title: filename
            }).then(async (log) => {

            for (const key of Object.keys(Data.supports))
            {
                await api.SendMessageWithAttachment(Data.supports[key].id,
                    `⚠Произошла ошибка⚠\nИгрок: *id${context.player.id}(${context.player.nick})\nМесто: ${place}\nКод ошибки: ${error.message}`, log)
            }
        })

    }
}

module.exports = new ErrorHandler()