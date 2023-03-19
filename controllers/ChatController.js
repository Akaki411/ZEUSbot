const NameLibrary = require("../variables/NameLibrary")
const Commands = require("../variables/Commands")
const keyboard = require("../variables/Keyboards")

class ChatController
{
    async CommandHandler(context)
    {
        context.command?.match(/^бот$/) && await context.reply(NameLibrary.GetRandomSample("call_request"))
        context.command?.match(Commands.botCall) && await context.reply(NameLibrary.GetRandomSample("call_request"))
        context.command?.match(Commands.clearKeyboard) && await context.send("Убираю", {keyboard: keyboard.none})
        context.command?.match(Commands.badJoke) && await context.reply(NameLibrary.GetRandomSample("bad_jokes"))
    }
}

module.exports = new ChatController()