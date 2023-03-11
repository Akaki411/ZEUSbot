const api = require("../middleware/API")
const {PlayerInfo, PlayerStatus, Country, Player, Buildings, Keys} = require("../database/Models");
const Data = require("../models/CacheData");
const ErrorHandler = require("../error/ErrorHandler")
const keyboard = require("../variables/Keyboards")
const NameLibrary = require("../variables/NameLibrary");
const Prices = require("../variables/Prices");
class CallbackEventController
{
    async Handler(context)
    {
        context.eventPayload?.command === "merry" && await this.Merry(context)
        context.eventPayload?.command  === "decline_merry" && await this.DeclineMerry(context)
        context.eventPayload?.command === "divorce" && await this.Divorce(context)
        context.eventPayload?.command === "decline_divorce" && await this.DeclineDivorce(context)
        context.eventPayload?.command === "give_citizenship" && await this.GiveCitizenship(context)
        context.eventPayload?.command === "decline_citizenship" && await this.DeclineCitizenship(context)
        context.eventPayload?.command === "give_registration" && await this.GiveRegistration(context)
        context.eventPayload?.command === "decline_registration" && await this.DeclineRegistration(context)
        context.eventPayload?.command === "allow_user_building" && await this.AllowUserBuilding(context)
        context.eventPayload?.command === "decline_user_building" && await this.DeclineUserBuilding(context)
    }

    async Merry(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await PlayerInfo.update(
                {
                    marriedID: secondUserID
                },
                {where: {id: firstUserID}})
            Data.users[firstUserID].marriedID = secondUserID
            Data.users[firstUserID].isMarried = true
            await PlayerInfo.update(
                {
                    marriedID: firstUserID
                },
                {where: {id: secondUserID}})
            Data.users[secondUserID].marriedID = firstUserID
            Data.users[secondUserID].isMarried = true
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "✅ Принято",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `❤ Теперь *id${secondUser.id}(${secondUser.nick}) ваш${secondUser.gender ? " муж" : "а жена"}`)
            await api.SendMessage(secondUserID, `❤ Теперь *id${firstUser.id}(${firstUser.nick}) ваш${firstUser.gender ? " муж" : "а жена"}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие принятия брака", e)
        }
    }

    async DeclineMerry(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            Data.users[secondUserID].isMarried = false
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "❌ Отклонено",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `💔 Вы отвергли предложение брака от игрока *id${secondUser.id}(${secondUser.nick})`)
            await api.SendMessage(secondUserID, `💔 *id${firstUser.id}(${firstUser.nick}) ${firstUser.gender ? "отверг" : "отвергла"} ваше предложение вступить в брак.`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие отвержения брака", e)
        }
    }

    async Divorce(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await PlayerInfo.update(
                {
                    marriedID: null
                },
                {where: {id: firstUserID}})
            Data.users[firstUserID].marriedID = null
            Data.users[firstUserID].isMarried = false
            await PlayerInfo.update(
                {
                    marriedID: null
                },
                {where: {id: secondUserID}})
            Data.users[secondUserID].marriedID = null
            Data.users[secondUserID].isMarried = false
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "✅ Принято",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `💔 Больше *id${secondUser.id}(${secondUser.nick}) не ваш${secondUser.gender ? " муж" : "а жена"}`)
            await api.SendMessage(secondUserID, `💔 Больше *id${firstUser.id}(${firstUser.nick}) не ваш${firstUser.gender ? " муж" : "а жена"}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие принятия расторжения брака", e)
        }
    }

    async DeclineDivorce(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "❌ Отклонено",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `❤ Вы отвергли предложение расторжения брака от игрока *id${secondUser.id}(${secondUser.nick})`)
            await api.SendMessage(secondUserID, `❤ *id${firstUser.id}(${firstUser.nick}) ${firstUser.gender ? "отверг" : "отвергла"} ваше предложение расторгнуть брак.`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие отвержения расторжения брака", e)
        }
    }

    async GiveCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        const countryID = context.eventPayload.addition
        try
        {
            if(Data.users[secondUserID].waitingCitizenship)
            {
                clearTimeout(Data.users[secondUserID].waitingCitizenship)
                await PlayerStatus.update({citizenship: countryID},{where: {id: secondUserID}})
                if(!context.player.status.match(/worker/))
                {
                    await Player.update({status: "stateless"},{where: {id: context.player.id}})
                }
                Data.users[secondUserID].citizenship = countryID
                if(Data.users[secondUserID].status !== "worker")
                {
                    Data.users[secondUserID].status = "citizen"
                    await Player.update({status: "citizen"}, {where: {id: secondUserID}})
                }
                const country = await Country.findOne({where: {id: countryID}})
                country.set({population: country.population + 1})
                await country.save()
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `✅ Ваша заявка на гражданство принята.`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие одобрения гражданства", e)
        }
    }

    async DeclineCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        const citizen = Data.users[secondUserID]
        try
        {
            if(citizen.waitingCitizenship)
            {
                clearTimeout(Data.users[secondUserID].waitingCitizenship)
                if(Data.users[secondUserID].status !== "worker")
                {
                    Data.users[secondUserID].status = "stateless"
                }
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `❌ Ваша заявка на гражданство отклонена.`)
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие отвержения гражданства", e)
        }
    }

    async GiveRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        const cityID = context.eventPayload.addition
        try
        {
            if(Data.users[secondUserID].waitingRegistration)
            {
                clearTimeout(Data.users[secondUserID].waitingRegistration)
                await PlayerInfo.update({registration: cityID},{where: {id: secondUserID}})
                Data.users[secondUserID].registration = cityID
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `✅ Ваша заявка принята. Теперь вы прописаны в городе ${Data.GetCityName(cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие одобрения прописки", e)
        }
    }

    async DeclineRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        const citizen = Data.users[secondUserID]
        try
        {
            if(citizen.waitingRegistration)
            {
                clearTimeout(Data.users[secondUserID].waitingRegistration)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `❌ Ваша заявка на получение прописки отклонена.`)
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие отвержения прописки", e)
        }
    }

    async AllowUserBuilding(context)
    {
        const userID = context.eventPayload.item
        const buildingID = context.eventPayload.addition
        try
        {
            let isActual = false
            let timeoutNum = null
            if(Data.users[userID]?.waitingAllowBuilding)
            {
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID]?.waitingAllowBuilding[i][0])
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                const building = await Buildings.findOne({where: {id: buildingID}})
                await Keys.create({
                    houseID: building.dataValues.id,
                    ownerID: userID,
                    name: "🔑 " + building.dataValues.name,
                    description: "Ключ от постройки - " + NameLibrary.GetBuildingType(building.dataValues.type) + " в городе " + Data.GetCityName(building.dataValues.cityID)
                })
                building.set({freezing: false})
                await building.save()
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(userID, `✅ Ваша заявка принята. Теперь вы владелец постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} в городе ${Data.GetCityName(building.dataValues.cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие одобрения прописки", e)
        }
    }

    async DeclineUserBuilding(context)
    {
        const userID = context.eventPayload.item
        const buildingID = context.eventPayload.addition
        try
        {
            let isActual = false
            let timeoutNum = null
            if(Data.users[userID]?.waitingAllowBuilding)
            {
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID]?.waitingAllowBuilding[i][0])
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                const building = await Buildings.findOne({where: {id: buildingID}})
                await Buildings.destroy({where: {id: buildingID}})
                const price = NameLibrary.ReversePrice(Prices["new_" + building.dataValues.type.replace("building_of_", "")])
                await Data.AddPlayerResources(userID, price)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(userID, `❌ Ваша заявка на размещение в городе постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} отклонена. Глава города не дал одобрение на строительство. Ресурсы возвращены.`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "Событие отклонения ", e)
        }
    }
}

module.exports = new CallbackEventController()