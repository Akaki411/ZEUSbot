const Data = require("../models/CacheData")
const Commands = require("../variables/Commands")

function countEmojis(string)
{
    const matches = string.match(/\p{Emoji}/gu);
    return matches ? matches.length : 0;
}

module.exports = async (context, next) =>
{
    try
    {
        if(context.peerType !== "chat") return next()
        if(!context.player) return next()
        if(!Data.activity[context.player.id])
        {
            Data.activity[context.player.id] = {
                msgs: 0,
                swords: 0,
                stickers: 0,
                music: 0,
                audio: 0,
                forwards: 0,
                photos: 0,
                videos: 0,
                emojis: 0,
                len: 0
            }
        }
        Data.activity[context.player.id].msgs ++
        Data.activity[context.player.id].len += context.command.length
        Data.activity[context.player.id].emojis += countEmojis(context.text || "")
        Data.activity[context.player.id].forwards += context.forwards ? context.forwards.length : 0
        if(context.command?.match(Commands.censorship))
        {
            Data.activity[context.player.id].swords ++
        }
        for(let i = 0; i < context.attachments?.length; i++)
        {
            if(context.attachments[i]?.type === "sticker")
            {
                Data.activity[context.player.id].stickers ++
            }
            if(context.attachments[i]?.type === "audio")
            {
                Data.activity[context.player.id].music ++
            }
            if(context.attachments[i]?.type === "audio_message")
            {
                Data.activity[context.player.id].audio ++
            }
            if(context.attachments[i]?.type === "photo")
            {
                Data.activity[context.player.id].photos ++
            }
            if(context.attachments[i]?.type === "video")
            {
                Data.activity[context.player.id].videos ++
            }
        }
        next()
    } catch (e) {}
}