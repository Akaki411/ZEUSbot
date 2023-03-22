const NameLibrary = require("../variables/NameLibrary")
const Commands = require("../variables/Commands")
const keyboard = require("../variables/Keyboards")
const api = require("../middleware/API")
const SceneController = require("../controllers/SceneController")
const Data = require("../models/CacheData")
const {Player} = require("../database/Models");

class ChatController
{
    async CommandHandler(context)
    {
        context.command?.match(/^бот$/) && await context.reply(NameLibrary.GetRandomSample("call_request"))
        context.command?.match(Commands.botCall) && await context.reply(NameLibrary.GetRandomSample("dungeon_master_request"))
        context.command?.match(Commands.clearKeyboard) && await context.send("Убираю", {keyboard: keyboard.none})
        context.command?.match(Commands.badJoke) && await context.send(NameLibrary.GetRandomSample("bad_jokes"))
        context.command?.match(Commands.warning) && await this.SendWarningForm(context)
        context.command?.match(Commands.ban) && await this.SendBanForm(context)
    }

    async SendWarningForm(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 1)
        {
            await context.reply("⚠ У вас нет прав на эту команду")
            return
        }
        if(context.replyPlayers?.length === 0)
        {
            await context.reply("⚠ Выберите игроков")
            return
        }
        let time = new Date()
        if(context.player.lastReportTime)
        {
            if(time - context.player.lastReportTime < 3600000 && NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                await context.reply("⚠ Вы слишком часто отправляете репорты")
                return
            }
        }
        let adminsFlag = false
        let unregFlag = false
        let temp = null
        for(const i of context.replyPlayers)
        {
            if(Data.users[i])
            {
                if(NameLibrary.RoleEstimator(Data.users[i].role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    adminsFlag = true
                }
            }
            else
            {
                temp = await Player.findOne({where: {id: i}})?.dataValues
                if(temp)
                {
                    if(NameLibrary.RoleEstimator(temp.role) >= NameLibrary.RoleEstimator(context.player.role))
                    {
                        adminsFlag = true
                    }
                }
                else
                {
                    unregFlag = true
                }
            }
        }
        if(adminsFlag)
        {
            await context.reply("⚠ У вас нет права выдавать предупреждения админам")
            return
        }
        if(unregFlag)
        {
            await context.reply("⚠ Вы не можете выдать предупреждение не зарегистрированному пользователю")
            return
        }
        const users = context.replyPlayers.join(";")
        context.player.lastReportTime = time
        await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены врежим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные репорта на игроков:\n${context.replyPlayers?.map(user => {
            return `*id${user}(${user})\n`
        })}`, [[keyboard.startButton({type: "new_warning", users: users})]])
        context.player.state = SceneController.FillingOutTheForm
        await context.reply("Заполните форму в ЛС")
    }

    async SendBanForm(context)
    {
        if(NameLibrary.RoleEstimator(context.player.role) < 3)
        {
            await context.reply("⚠ У вас нет прав на эту команду")
            return
        }
        if(context.replyPlayers?.length === 0)
        {
            await context.reply("⚠ Выберите игроков")
            return
        }
        let time = new Date()
        if(context.player.lastReportTime)
        {
            if(time - context.player.lastReportTime < 3600000 && NameLibrary.RoleEstimator(context.player.role) < 4)
            {
                await context.reply("⚠ Вы слишком часто отправляете репорты")
                return
            }
        }
        let adminsFlag = false
        let unregFlag = false
        let temp = null
        const users = context.replyPlayers[0]
        if(Data.users[users])
        {
            if(NameLibrary.RoleEstimator(Data.users[users].role) >= NameLibrary.RoleEstimator(context.player.role))
            {
                adminsFlag = true
            }
        }
        else
        {
            temp = await Player.findOne({where: {id: users}})?.dataValues
            if(temp)
            {
                if(NameLibrary.RoleEstimator(temp.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    adminsFlag = true
                }
            }
            else
            {
                unregFlag = true
            }
        }
        if(adminsFlag)
        {
            await context.reply("⚠ Вы не можете выдавать баны админам")
            return
        }
        if(unregFlag)
        {
            await context.reply("⚠ Вы не можете выдать бан не зарегистрированному пользователю")
            return
        }
        context.player.lastReportTime = time
        await api.SendMessageWithKeyboard(context.player.id, `Вы перенаправлены врежим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" чтобы ввести данные глобана на игрока: ${context.replyPlayers?.map(user => {
            return `*id${user}(${user})\n`
        })}`, [[keyboard.startButton({type: "new_ban", users: users})]])
        context.player.state = SceneController.FillingOutTheForm
        await context.reply("Заполните форму в ЛС")
    }
}

module.exports = new ChatController()