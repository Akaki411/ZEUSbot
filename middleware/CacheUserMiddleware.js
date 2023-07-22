const {Player, PlayerStatus, PlayerInfo, PlayerResources, Ban, LastWills, VKChats} = require("../database/Models");
const Data = require("../models/CacheData");
const User = require("../models/User");
const VKChat = require("../models/VKChat")
const keyboard = require("../variables/Keyboards");
const commands = require("../variables/Commands");
const SceneManager = require("../controllers/SceneController")
const api = require("./API")
const Nations = require("../variables/Nations")

const RoleEstimator = (role) =>
{
    switch (role)
    {
        case "player":
            return 0
        case "moder":
            return 1
        case "GM":
            return 2
        case "admin":
            return 3
        case "support":
            return 4
        case "project_head":
            return 5
        case "owner":
            return 6
    }
    return 0
}

module.exports = async (context, next) =>
{
    try
    {
        context.command = context.text?.toLowerCase()
        const peerId = context.peerType === "chat" ? context.senderId : context.peerId
        if(context.peerType === "chat")
        {
            if(!Data.VKChats[context.peerId])
            {
                let chat = await VKChats.findOne({where: {id: context.peerId}})
                if(!chat)
                {
                    chat = await VKChats.create({id: context.peerId})
                }
                Data.VKChats[context.peerId] = new VKChat(chat)
            }
            context.chat = Data.VKChats[context.peerId]
            if(Data.countryChats[context.peerId] && peerId > 0 && !Data.activeIgnore[peerId])
            {
                Data.countries[Data.countryChats[context.peerId]].active++
            }
            if(Data.mute[peerId] && (context.command !== "ресет" && RoleEstimator(Data.users[peerId]?.role) < 4))
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                }
                catch (e) {}
                return
            }
            if(context.chat.muteList[peerId])
            {
                const time = new Date()
                if(context.chat.muteList[peerId]?.endTime - time > 0)
                {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    }
                    catch (e) {}
                    return
                }
                else
                {
                    delete Data.VKChats[context.chat.id].muteList[context.player.id]
                    await Data.SaveVKChat(context.chat.id)
                }
            }
            if(context.chat.RP)
            {
                if(!context.command?.match(/^\(|^\*|^!|^\/|^-|^#|^\?|^\\/) || !context.command)
                {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    }
                    catch (e) {}
                }
            }
            if(Data.censorship[peerId])
            {
                if(context.command?.match(commands.censorship))
                {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    }
                    catch (e) {}
                }
            }
            if(Data.chatListen[context.peerId])
            {
                try
                {
                    await api.api.messages.send({
                        chat_id: Data.chatListen[context.peerId],
                        random_id: Math.round(Math.random() * 100000),
                        forward: `{"conversation_message_ids":${context.conversationMessageId},"peer_id":${context.peerId}}`
                    })
                }
                catch (e) {}
            }
            if(Data.userListen[peerId])
            {
                try
                {
                    await api.api.messages.send({
                        chat_id: Data.userListen[peerId],
                        random_id: Math.round(Math.random() * 100000),
                        forward: `{"conversation_message_ids":${context.conversationMessageId},"peer_id":${context.peerId}}`
                    })
                }
                catch (e) {}
            }
        }

        if(Data.users[peerId] && !Data.users[peerId]?.isBanned)
        {
            context.player = Data.users[peerId]
            if(Data.officials[context.player.countryID])
            {
                if (Data.officials[context.player.countryID][peerId])
                {
                    context.official = Data.officials[context.player.countryID][peerId]
                }
            }
            if(!context.player.HasEffect("bot_ignore"))
            {
                return next()
            }
        }
        else
        {
            const user = await Player.findOne({where: {id: peerId}})
            if(user)
            {
                if(!user.dataValues.isBanned)
                {
                    const status = await PlayerStatus.findOne({where: {id: peerId}})
                    const info = await PlayerInfo.findOne({where: {id: peerId}})
                    const resources = await PlayerResources.findOne({where: {id: peerId}})
                    Data.users[peerId] = new User(user, status, info, resources)
                    Data.users[peerId].state = SceneManager.StartScreen
                    context.player = Data.users[peerId]
                    context.player.lastWill = await LastWills.findOne({where: {userID: context.player.id}})?.dataValues
                    if(Data.officials[context.player.countryID])
                    {
                        if (Data.officials[context.player.countryID][peerId])
                        {
                            context.official = Data.officials[context.player.countryID][peerId]
                        }
                    }
                    try{if(peerId === 327996039) {await api.KickUser(context.peerId, 327996039)}} catch (e){}
                    return next()
                }
                else
                {
                    const ban = await Ban.findOne({where: {userID: peerId}})
                    if(context.peerType === "chat")
                    {
                        await context.reply(`🚫 Вы были забанены по причине: ${ban?.dataValues.reason}`)
                        await api.KickUser(context.peerId, peerId)
                    }
                    else
                    {
                        await context.send(`🚫Внимание!🚫\n\nВы были забанены в проекте *public218388422 («ZEUS - Вселенная игроков»)\nБан по причине: ${ban?.dataValues.reason}\nЕсли вы не согласны с блокировкой - напишите одному из админов:\n${Data.GiveAdminList()}`, {
                            keyboard: keyboard.none
                        })
                    }
                }
            }
            else
            {
                if(peerId < 0) return
                const user = await api.GetUserData(peerId)
                const nations = Object.keys(Nations).map(key => {return Nations[key]})
                let country = null
                for(const c of Data.countries)
                {
                    if(c?.chatID)
                    {
                        for(const chat of c.chatID.split("|"))
                        {
                            if(parseInt(chat) === context.peerId)
                            {
                                country = c
                                break
                            }
                        }
                    }
                }
                country = country ? country : Data.countries[Math.round(Math.random() * (Data.countries.length - 1))]
                while(!country) country = Data.countries[Math.round(Math.random() * (Data.countries.length - 1))]
                let nation = nations[Math.round(Math.random() * (nations.length - 1))]
                const player = await Player.create({
                    id: peerId,
                    nick: user.first_name + " " + user.last_name,
                    gender: user.sex === 2,
                    platform: "ANDROID"
                })
                const status = await PlayerStatus.create({
                    id: peerId,
                    location: country.capitalID,
                    countryID: country.id
                })
                const info = await PlayerInfo.create({
                    id: peerId,
                    description: nation.description,
                    nationality: nation.name,
                    age: Math.round(16 + Math.round(Math.random() * (100 - 16)))
                })
                const resources = await PlayerResources.create({id: peerId})
                Data.users[peerId] = new User(player, status, info, resources)
                Data.users[peerId].state = SceneManager.StartScreen
                context.player = Data.users[peerId]
                let lw = await LastWills.findOne({where: {userID: context.player.id}})
                context.player.lastWill = lw?.dataValues
                if(Data.officials[context.player.countryID])
                {
                    if (Data.officials[context.player.countryID][peerId])
                    {
                        context.official = Data.officials[context.player.countryID][peerId]
                    }
                }
                return next()
            }
        }
    }
    catch (e)
    {
        console.log(e)
    }
}