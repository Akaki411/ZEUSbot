const Commands = require('../variables/Commands')
const OutputManager = require('./OutputManager')

class TGChatController
{
    async Handler(context, type)
    {
        try
        {
            if(context.command.match(Commands.countriesActive))
            {
                let {request, short} = await OutputManager.GetDayActiveMessage({command: context.command, app: "TG"})
                short ? await context.send(request, {parse_mode: 'MarkdownV2'}) : await context.send(request)
                return true
            }
        }
        catch (e){}
    }
}

module.exports = new TGChatController()