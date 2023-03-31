const {API} = require('vk-io')
const keyboard = require('../variables/Keyboards')
const Data = require("../models/CacheData")
const {PlayerStatus, Warning, Player, Country, PlayerInfo} = require("../database/Models");
const NameLibrary = require("../variables/NameLibrary")

class VK_API
{
    constructor(token)
    {
        this.api = new API({token: token})
        this.StartLoop()
    }

    StartLoop()
    {
        setInterval(async () => {
            const warns = await Warning.findAll({where: {banned: false}, attributes: ["id", "userID", "time", "createdAt"]})
            const time = new Date()
            let warnTime = null
            for(const warn of warns)
            {
                warnTime = new Date(warn.dataValues.createdAt)
                warnTime.setDate(warnTime.getDate() + warn.dataValues.time)
                if(warnTime - time < 0)
                {
                    await Warning.destroy({where: {id: warn.dataValues.id}})
                    await this.SendMessage(warn.dataValues.userID, `✅ Срок действия предупреждения от ${NameLibrary.ParseDateTime(warn.dataValues.createdAt)} истек, предупреждение обжаловано`)
                    await Player.update({warningScore: await Warning.count({where: {userID: warn.dataValues.userID}})}, {where: {id: warn.dataValues.userID}})
                }
            }
            let active = null
            let max = 0
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].active >= max)
                    {
                        max = Data.countries[i].active
                        active = i
                    }
                }
            }
            await this.SendMessage(Data.countries[active].leaderID, `✅ Ваша фракция ${Data.countries[active].GetName()} набрала наибольший актив за сегодня, в бюджет передан сладкий подарок в размере 100 монет`)
            await Data.AddCountryResources(Data.countries[active].id, {money: 100})
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    if(Data.countries[i].active <= 500)
                    {
                        Data.countries[i].warnings++
                        await Country.update({warnings: Data.countries[i].warnings}, {where: {id: Data.countries[i].id}})
                        await this.SendMessage(Data.countries[i].leaderID, `⚠ Внимание, ваша фракция ${Data.countries[i].GetName()} получила варн за малый актив в чате (< 500 сообщений за день)`)
                    }
                    Data.countries[i].active = 0
                }
            }
            let temp = null
            for(const key of Object.keys(Data.activity))
            {
                temp = await PlayerInfo.findOne({where: {id: key}, attributes: ["msgs"]})
                if(!temp) continue
                temp.set({msgs: temp.dataValues.msgs + Data.activity[key]})
                await temp.save()
            }
            Data.activity = {}
            for(const key of Object.keys(Data.musicLovers))
            {
                temp = await PlayerInfo.findOne({where: {id: key}, attributes: ["audios"]})
                if(!temp) continue
                temp.set({audios: temp.dataValues.audios + Data.musicLovers[key]})
                await temp.save()
            }
            Data.musicLovers = {}
            for(const key of Object.keys(Data.stickermans))
            {
                temp = await PlayerInfo.findOne({where: {id: key}, attributes: ["stickers"]})
                if(!temp) continue
                temp.set({stickers: temp.dataValues.stickers + Data.stickermans[key]})
                await temp.save()
            }
            Data.stickermans = {}
            for(const key of Object.keys(Data.uncultured))
            {
                temp = await PlayerInfo.findOne({where: {id: key}, attributes: ["swords"]})
                if(!temp) continue
                temp.set({swords: temp.dataValues.swords + Data.uncultured[key]})
                await temp.save()
            }
            Data.uncultured = {}
        }, 86400000)
    }

    async KickUser(chatID, userID)
    {
        if(!chatID || !userID) return
        // await this.api.messages.removeChatUser({
        //     chat_id: chatID - 2000000000,
        //     user_id: userID
        // })
    }

    async BanUser(userID)
    {
        if(!userID) return
        // for(const country of Data.countries)
        // {
        //     if(country)
        //     {
        //         if(country.chatID)
        //         {
        //             try
        //             {
        //                 await this.api.messages.removeChatUser({
        //                     chat_id: country.chatID - 2000000000,
        //                     user_id: userID
        //                 })
        //             }
        //             catch (e)
        //             {
        //                 console.log(e.message)
        //             }
        //         }
        //     }
        // }
    }

    async GetUserData(id)
    {
        const info = await this.api.users.get({
            user_ids: id
            })
        return info[0]
    }

    async SendNotification(id, message)
    {
        try
        {
            if(!id) return
            const user = await PlayerStatus.findOne({where: {id: id}})
            if(!user) return
            if(!user.dataValues.notifications) return
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async SendMessage(id, message)
    {
        if(!id) return
        await this.api.messages.send({
            user_id: id,
            random_id: Math.round(Math.random() * 100000),
            message: message
        })
    }

    async SendMessageWithKeyboard(id, message, kb)
    {
        if(!id) return
        await this.api.messages.send({
            user_id: id,
            random_id: Math.round(Math.random() * 100000),
            message: message,
            keyboard: keyboard.build(kb)
        })
    }


    async GMMailing(message, kb)
    {
        let GMs = Object.keys(Data.gameMasters)
        for(let i = 0; i < GMs.length; i++)
        {
            await this.api.messages.send({
                user_id: GMs[i],
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: kb ? keyboard.build(kb).inline().oneTime() : keyboard.inlineNone
            })
        }
    }

    async SendAccessKey(reason)
    {
        if(!Data.owner) return
        console.log("\n\n" + Data.accessKey + "\n\n")
        if(Data.owner)
        {
            await this.api.messages.send({
                user_id: Data.owner.id,
                random_id: Math.round(Math.random() * 100000),
                message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
            })
        }
        if(Data.projectHead)
        {
            await this.api.messages.send({
                user_id: Data.projectHead.id,
                random_id: Math.round(Math.random() * 100000),
                message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
            })
        }
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)