const Data = require("../models/CacheData")
const Commands = require("../variables/Commands")

module.exports = async (context, next) =>
{
    if(context.peerType === "chat")
    {
        if(Data.users[context.senderId])
        {
            if(Data.activity[context.senderId])
            {
                Data.activity[context.senderId]++
            }
            else
            {
                Data.activity[context.senderId] = 1
            }
            if(context.command?.match(Commands.censorship))
            {
                if(Data.uncultured[context.senderId])
                {
                    Data.uncultured[context.senderId]++
                }
                else
                {
                    Data.uncultured[context.senderId] = 1
                }
            }
            for(let i = 0; i < context.attachments?.length; i++)
            {
                if(context.attachments[i]?.type === "sticker")
                {
                    if(Data.stickermans[context.senderId])
                    {
                        Data.stickermans[context.senderId]++
                    }
                    else
                    {
                        Data.stickermans[context.senderId] = 1
                    }
                }
                if(context.attachments[i]?.type === "audio")
                {
                    if(Data.musicLovers[context.senderId])
                    {
                        Data.musicLovers[context.senderId]++
                    }
                    else
                    {
                        Data.musicLovers[context.senderId] = 1
                    }
                }
            }
        }
    }
    next()
}