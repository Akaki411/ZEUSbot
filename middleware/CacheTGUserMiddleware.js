const Data = require('../models/CacheData')
const TGChatController = require("../controllers/TGChatController")
const TGSceneController = require("../controllers/TGSceneController")
const {Player, PlayerStatus, PlayerInfo, PlayerResources, TGChats, Ban} = require("../database/Models")
const UserObject = require('../models/User')
const TGChat = require("../models/TGChat")

module.exports = async (context) =>
{
    if(Data.TGcountryChats[context.chat.id])
    {
        Data.countries[Data.TGcountryChats[context.chat.id]].active++
        Data.active++
    }
    if(Data.TGusers[context.from.id])
    {
        context.player = Data.users[Data.TGusers[context.from.id]]
    }
    else
    {
        const user = await Player.findOne({where: {TGID: context.from.id}})
        if(user)
        {
            if(Data.users[user.dataValues.id])
            {
                Data.TGusers[context.from.id] = Data.users[user.dataValues.id].id
                context.player = Data.users[user.dataValues.id]
            }
            else
            {
                const status = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                const info = await PlayerInfo.findOne({where: {id: user.dataValues.id}})
                const resources = await PlayerResources.findOne({where: {id: user.dataValues.id}})
                Data.users[user.dataValues.id] = new UserObject(user, status, info, resources)
                Data.TGusers[context.from.id] = Data.users[user.dataValues.id].id
                context.player = Data.users[user.dataValues.id]
            }
        }
    }
    if(context.player)
    {
        if(context.player.isBanned)
        {
            const ban = await Ban.findOne({where: {userID: context.player.id}})
            await context.send(`🚫 Вы были забанены по причине: ${ban?.dataValues.reason}`)
            try{await context.api.banChatMember(context.chat.id, context.from.id)} catch (e) {}
            return
        }
        if(Data.officials[context.player.countryID])
        {
            if (Data.officials[context.player.countryID][context.player.id])
            {
                context.official = Data.officials[context.player.countryID][context.player.id]
            }
        }
    }
    let command = context.text || context.caption
    const replyPlayers = []
    const mentions = []
    if(context.reply_to_message)
    {
        replyPlayers.push(context.reply_to_message.from.id)
        mentions.push("@" + context.reply_to_message.from.username)
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
    const players = await Player.findAll({where: {TGShortName: mentions}, attributes: ["TGID"]})
    for(const player of players)
    {
        replyPlayers.push(player.dataValues.TGID)
    }
    command = command?.toLowerCase()
    context.command = command?.replace(/@\S+ ?/gi, "")
    context.command = context.command?.trimStart()
    context.replyPlayers = replyPlayers
    context.mentions = mentions
    if(context.chat.id < 0)
    {
        if(!Data.TGChats[context.chat.id])
        {
            let chat = await TGChats.findOne({where: {peerID: context.chat.id.toString()}})
            if(!chat)
            {
                chat = await TGChats.create({peerID: context.chat.id.toString()})
            }
            Data.TGChats[context.chat.id] = new TGChat(chat)
        }
        context.peer = Data.TGChats[context.chat.id]

        if(context.peer.muteList[context.from.id])
        {
            const time = new Date()
            if(context.peer.muteList[context.player.TGID]?.endTime - time > 0)
            {
                try {await context.api.deleteMessage(context.chat.id, context.message_id)} catch (e) {}
                return
            }
            else
            {
                delete Data.TGChats[context.peer.peerID].muteList[context.player.id]
                await Data.SaveTGChat(context.chat.id)
            }
        }
        await TGChatController.Handler(context)
    }
    else
    {
        await TGSceneController.MainScene(context)
    }
}