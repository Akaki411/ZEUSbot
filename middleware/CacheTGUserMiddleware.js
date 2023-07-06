const Data = require('../models/CacheData')
const TGChatController = require("../controllers/TGChatController")
const TGSceneController = require("../controllers/TGSceneController")

module.exports = async (context, type) =>
{
    console.log(context)
    if(Data.countryChats[context.peerId])
    {
        Data.countries[Data.TGcountryChats[context.peerId]].active++
    }
    let command = context.text || context.caption
    const replyPlayers = []
    const mentions = []
    if(context.reply_to_message)
    {
        replyPlayers.push(context.reply_to_message.from.id)
    }
    if(context.entities)
    {
        for(const entity of context.entities)
        {
            if(entity.type === "mention")
            {
                mentions.push(command.slice(entity.offset, entity.offset + entity.length))
            }
        }
    }
    if(context.caption_entities)
    {
        for(const entity of context.caption_entities)
        {
            if(entity.type === "mention")
            {
                mentions.push(command.slice(entity.offset, entity.offset + entity.length))
            }
        }
    }
    command = command.toLowerCase()
    context.command = command.replace(/@\S+ ?/gi, "")
    context.command = context.command.trimStart()
    context.replyPlayers = replyPlayers
    if(context.chat.id < 0)
    {
        await TGChatController.Handler(context, type)
    }
    else
    {
        await TGSceneController.MainScene(context, type)
    }
}