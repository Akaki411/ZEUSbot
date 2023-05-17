const api = require("../middleware/API")
const {PlayerInfo, PlayerStatus, Player, Buildings, Keys, City, Warning, Ban, CityRoads, Transactions} = require("../database/Models");
const Data = require("../models/CacheData")
const keyboard = require("../variables/Keyboards")
const NameLibrary = require("../variables/NameLibrary");
const Prices = require("../variables/Prices");
const Scenes = require("./SceneController")
class CallbackEventController
{
    async Handler(context)
    {
        context.eventPayload?.command === "hide_message" && await this.HideMessage(context)
        context.eventPayload?.command === "merry" && await this.Merry(context)
        context.eventPayload?.command  === "decline_merry" && await this.DeclineMerry(context)
        context.eventPayload?.command === "give_citizenship" && await this.GiveCitizenship(context)
        context.eventPayload?.command === "decline_citizenship" && await this.DeclineCitizenship(context)
        context.eventPayload?.command === "give_registration" && await this.GiveRegistration(context)
        context.eventPayload?.command === "decline_registration" && await this.DeclineRegistration(context)
        context.eventPayload?.command === "allow_user_building" && await this.AllowUserBuilding(context)
        context.eventPayload?.command === "decline_user_building" && await this.DeclineUserBuilding(context)
        context.eventPayload?.command === "set_road_distance" && await this.HideRoadDistance(context)
        context.eventPayload?.command === "appeal_warning" && await this.AppealWarning(context)
        context.eventPayload?.command === "appeal_ban" && await this.AppealBan(context)
        context.eventPayload?.command === "transaction_refund_tax" && await this.TransactionRefundTax(context)
        context.eventPayload?.command === "transaction_tax" && await this.TransactionTax(context)
        context.eventPayload?.command === "transaction_tax_evasion" && await this.TransactionTaxEvasion(context)
    }

    async TransactionTaxEvasion(context)
    {
        try
        {
            const transaction = context.eventPayload.transaction
            const resources = NameLibrary.ReversePrice(transaction.price)
            if(!context.player.CanPay(transaction.price))
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
                await api.SendMessage(context.player.id, "❌ Не хватает ресурсов")
            }
            await Data.AddPlayerResources(transaction.toUser, resources)
            await Data.AddPlayerResources(context.player.id, transaction.price)
            await api.SendNotification(transaction.toUser, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(resources)}`)
            context.player.dodgeTaxScore += 1
            await PlayerStatus.update({dodgeTaxScore: context.player.dodgeTaxScore}, {where: {id: context.player.id}})
            if(NameLibrary.GetChance(Math.log(context.player.dodgeTaxScore) * 20))
            {
                if(transaction.tax.in > 0)
                {
                    await api.SendNotification(Data.countries[transaction.countries.in].leaderID, `❗ Игрок ${context.player.GetName()} попался на уклонении от налогов, отказ от уплаты налога в ${transaction.tax.in} во время перевода в размере:\n${NameLibrary.GetPrice(transaction.price)}`)
                    let officials = Data.officials[transaction.countries.in]
                    if(officials)
                    {
                        for(const official of Object.keys(officials))
                        {
                            if(officials[official].canUseResources)
                            {
                                await api.SendNotification(official, `❗ Игрок ${context.player.GetName()} попался на уклонении от налогов, отказ от уплаты налога в ${transaction.tax.in} во время перевода в размере:\n${NameLibrary.GetPrice(transaction.price)}`)
                            }
                        }
                    }
                }
                if(transaction.tax.out > 0)
                {
                    await api.SendNotification(Data.countries[transaction.countries.in].leaderID, `❗ Игрок ${context.player.GetName()} попался на уклонении от налогов, отказ от уплаты налога в ${transaction.tax.out} во время перевода в размере:\n${NameLibrary.GetPrice(transaction.price)}`)
                    let officials = Data.officials[transaction.countries.out]
                    if(officials)
                    {
                        for(const official of Object.keys(officials))
                        {
                            if(officials[official].canUseResources)
                            {
                                await api.SendNotification(official, `❗ Игрок ${context.player.GetName()} попался на уклонении от налогов, отказ от уплаты налога в ${transaction.tax.in} во время перевода в размере:\n${NameLibrary.GetPrice(transaction.price)}`)
                            }
                        }
                    }
                }
            }
            await Transactions.create({
                fromID: context.player.id,
                toID: transaction.toUser,
                type: "ptp",
                money: resources.money ? resources.money : null,
                stone: resources.stone ? resources.stone : null,
                wood: resources.wood ? resources.wood : null,
                wheat: resources.wheat ? resources.wheat : null,
                iron: resources.iron ? resources.iron : null,
                copper: resources.copper ? resources.copper : null,
                silver: resources.silver ? resources.silver : null,
                diamond: resources.diamond ? resources.diamond : null
            })
            await api.SendMessage(context.player.id, "✅ Выполнено")
            await api.api.messages.delete({
                conversation_message_ids: context.conversationMessageId,
                delete_for_all: 1,
                peer_id: context.peerId
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/TransactionRefundTax", e)
        }
    }

    async TransactionTax(context)
    {
        try
        {
            const transaction = context.eventPayload.transaction
            let resources = NameLibrary.AfterPayTax(transaction.price, transaction.tax.in)
            let firstTax = NameLibrary.ReversePrice(NameLibrary.PriceMultiply(transaction.price, transaction.tax.in / 100))
            let secondTax = NameLibrary.ReversePrice(NameLibrary.PriceMultiply(resources, transaction.tax.out / 100))
            resources = NameLibrary.AfterPayTax(resources, transaction.tax.out)
            if(!context.player.CanPay(transaction.price))
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
                await api.SendMessage(context.player.id, "❌ Не хватает ресурсов")
            }
            await Data.AddPlayerResources(transaction.toUser, NameLibrary.ReversePrice(resources))
            await Data.AddPlayerResources(context.player.id, transaction.price)
            !NameLibrary.IsVoidPrice(firstTax) && await Data.AddCountryResources(transaction.countries.in, firstTax)
            !NameLibrary.IsVoidPrice(secondTax) && await Data.AddCountryResources(transaction.countries.out, secondTax)
            await api.SendNotification(transaction.toUser, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(resources)}`)
            resources = NameLibrary.ReversePrice(resources)
            await Transactions.create({
                fromID: context.player.id,
                toID: transaction.toUser,
                type: "ptp",
                money: resources.money ? resources.money : null,
                stone: resources.stone ? resources.stone : null,
                wood: resources.wood ? resources.wood : null,
                wheat: resources.wheat ? resources.wheat : null,
                iron: resources.iron ? resources.iron : null,
                copper: resources.copper ? resources.copper : null,
                silver: resources.silver ? resources.silver : null,
                diamond: resources.diamond ? resources.diamond : null
            })
            !NameLibrary.IsVoidPrice(firstTax) && await Transactions.create({
                fromID: context.player.id,
                toID: transaction.countries.in,
                type: "ptctr",
                money: firstTax.money ? firstTax.money : null,
                stone: firstTax.stone ? firstTax.stone : null,
                wood: firstTax.wood ? firstTax.wood : null,
                wheat: firstTax.wheat ? firstTax.wheat : null,
                iron: firstTax.iron ? firstTax.iron : null,
                copper: firstTax.copper ? firstTax.copper : null,
                silver: firstTax.silver ? firstTax.silver : null,
                diamond: firstTax.diamond ? firstTax.diamond : null
            })
            !NameLibrary.IsVoidPrice(secondTax) && await Transactions.create({
                fromID: context.player.id,
                toID: transaction.countries.out,
                type: "ptctr",
                money: secondTax.money ? secondTax.money : null,
                stone: secondTax.stone ? secondTax.stone : null,
                wood: secondTax.wood ? secondTax.wood : null,
                wheat: secondTax.wheat ? secondTax.wheat : null,
                iron: secondTax.iron ? secondTax.iron : null,
                copper: secondTax.copper ? secondTax.copper : null,
                silver: secondTax.silver ? secondTax.silver : null,
                diamond: secondTax.diamond ? secondTax.diamond : null
            })
            await api.SendMessage(context.player.id, "✅ Выполнено")
            await api.api.messages.delete({
                conversation_message_ids: context.conversationMessageId,
                delete_for_all: 1,
                peer_id: context.peerId
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/TransactionRefundTax", e)
        }
    }

    async TransactionRefundTax(context)
    {
        try
        {
            const transaction = context.eventPayload.transaction
            let resources = NameLibrary.AfterPayTax(transaction.price, transaction.tax.in)
            let firstTax = NameLibrary.ReversePrice(NameLibrary.PriceMultiply(transaction.price, transaction.tax.in / 100))
            let secondTax = NameLibrary.ReversePrice(NameLibrary.PriceMultiply(resources, transaction.tax.out / 100))
            resources = NameLibrary.AfterPayTax(resources, transaction.tax.out)
            if(!context.player.CanPay(transaction.price))
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
                await api.SendMessage(context.player.id, "❌ Не хватает ресурсов")
            }
            await Data.AddPlayerResources(transaction.toUser, NameLibrary.ReversePrice(resources))
            await Data.AddPlayerResources(context.player.id, transaction.price)
            !NameLibrary.IsVoidPrice(firstTax) && await Data.AddCountryResources(transaction.countries.in, firstTax)
            !NameLibrary.IsVoidPrice(secondTax) && await Data.AddCountryResources(transaction.countries.out, secondTax)
            await api.SendNotification(transaction.toUser, `✅ Вам поступил перевод от игрока ${context.player.GetName()} в размере:\n${NameLibrary.GetPrice(resources)}`)
            resources = NameLibrary.ReversePrice(resources)
            await Transactions.create({
                fromID: context.player.id,
                toID: transaction.toUser,
                type: "ptp",
                money: resources.money ? resources.money : null,
                stone: resources.stone ? resources.stone : null,
                wood: resources.wood ? resources.wood : null,
                wheat: resources.wheat ? resources.wheat : null,
                iron: resources.iron ? resources.iron : null,
                copper: resources.copper ? resources.copper : null,
                silver: resources.silver ? resources.silver : null,
                diamond: resources.diamond ? resources.diamond : null
            })
            !NameLibrary.IsVoidPrice(firstTax) && await Transactions.create({
                fromID: context.player.id,
                toID: transaction.countries.in,
                type: "ptctr",
                money: firstTax.money ? firstTax.money : null,
                stone: firstTax.stone ? firstTax.stone : null,
                wood: firstTax.wood ? firstTax.wood : null,
                wheat: firstTax.wheat ? firstTax.wheat : null,
                iron: firstTax.iron ? firstTax.iron : null,
                copper: firstTax.copper ? firstTax.copper : null,
                silver: firstTax.silver ? firstTax.silver : null,
                diamond: firstTax.diamond ? firstTax.diamond : null
            })
            !NameLibrary.IsVoidPrice(secondTax) && await Transactions.create({
                fromID: context.player.id,
                toID: transaction.countries.out,
                type: "ptctr",
                money: secondTax.money ? secondTax.money : null,
                stone: secondTax.stone ? secondTax.stone : null,
                wood: secondTax.wood ? secondTax.wood : null,
                wheat: secondTax.wheat ? secondTax.wheat : null,
                iron: secondTax.iron ? secondTax.iron : null,
                copper: secondTax.copper ? secondTax.copper : null,
                silver: secondTax.silver ? secondTax.silver : null,
                diamond: secondTax.diamond ? secondTax.diamond : null
            })
            await api.SendMessage(context.player.id, "✅ Выполнено")
            await api.api.messages.delete({
                conversation_message_ids: context.conversationMessageId,
                delete_for_all: 1,
                peer_id: context.peerId
            })
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/TransactionRefundTax", e)
        }
    }

    async HideMessage(context)
    {
        try
        {
            await api.api.messages.delete({
                conversation_message_ids: context.conversationMessageId,
                delete_for_all: 1,
                peer_id: context.peerId
            })
            await api.SendMessage(context.player.id, "❌ Сообщение скрыто")
        }
        catch (e) {}
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
            try
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
            } catch (e) {}
            await api.SendMessage(firstUserID, `❤ Теперь *id${secondUser.id}(${secondUser.nick}) ваш${secondUser.gender ? " муж" : "а жена"}`)
            await api.SendMessage(secondUserID, `❤ Теперь *id${firstUser.id}(${firstUser.nick}) ваш${firstUser.gender ? " муж" : "а жена"}`)
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/Merry", e)
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
            try
            {
                await api.api.messages.delete({
                    conversation_message_ids: context.conversationMessageId,
                    delete_for_all: 1,
                    peer_id: context.peerId
                })
            } catch (e) {}
            await api.SendMessage(firstUserID, `💔 Вы отвергли предложение брака от игрока *id${secondUser.id}(${secondUser.nick})`)
            await api.SendMessage(secondUserID, `💔 *id${firstUser.id}(${firstUser.nick}) ${firstUser.gender ? "отверг" : "отвергла"} ваше предложение вступить в брак.`)
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/DeclineMerry", e)
        }
    }

    async GiveCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        const countryID = context.eventPayload.addition
        try
        {
            if(Data.timeouts["get_citizenship_" + secondUserID])
            {
                clearTimeout(Data.timeouts["get_citizenship_" + secondUserID].timeout)
                delete Data.timeouts["get_citizenship_" + secondUserID]
                await PlayerStatus.update({citizenship: countryID},{where: {id: secondUserID}})
                if(Data.users[secondUserID])
                {
                    Data.users[secondUserID].citizenship = countryID
                    if(!Data.users[secondUserID].status.match(/worker|official|leader/))
                    {
                        Data.users[secondUserID].status = "citizen"
                        await Player.update({status: "citizen"}, {where: {id: secondUserID}})
                    }
                }
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Принято")
                await api.SendMessageWithKeyboard(secondUserID, `✅ Ваша заявка на гражданство принята.`, [[keyboard.backButton]])
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/GiveCitizenship", e)
        }
    }

    async DeclineCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        try
        {
            if(Data.timeouts["get_citizenship_" + secondUserID])
            {
                clearTimeout(Data.timeouts["get_citizenship_" + secondUserID].timeout)
                delete Data.timeouts["get_citizenship_" + secondUserID]
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "❌ Отклонено")
                await api.SendMessageWithKeyboard(secondUserID, `❌ Ваша заявка на гражданство отклонена.`, [[keyboard.backButton]])
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/DeclineCitizenship", e)
        }
    }

    async GiveRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        const cityID = context.eventPayload.addition
        try
        {
            if(Data.timeouts["get_registration_" + secondUserID])
            {
                clearTimeout(Data.timeouts["get_registration_" + secondUserID].timeout)
                delete Data.timeouts["get_registration_" + secondUserID]
                await PlayerStatus.update({registration: cityID},{where: {id: secondUserID}})
                Data.users[secondUserID].registration = cityID
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Принято")
                await api.SendMessageWithKeyboard(secondUserID, `✅ Ваша заявка принята. Теперь вы прописаны в городе ${Data.GetCityName(cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/GiveRegistration", e)
        }
    }

    async DeclineRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        try
        {
            if(Data.timeouts["get_registration_" + secondUserID])
            {
                clearTimeout(Data.timeouts["get_registration_" + secondUserID].timeout)
                delete Data.timeouts["get_registration_" + secondUserID]
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "❌ Отклонено")
                await api.SendMessage(secondUserID, `❌ Ваша заявка на получение прописки отклонена.`)
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/DeclineRegistration", e)
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
            for (let i = 0; i < Data.users[userID]?.waitingAllowBuilding?.length; i++)
            {
                if(Data.users[userID]?.waitingAllowBuilding[i])
                {
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                        break
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                let length = 0
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID].waitingAllowBuilding[i])
                    {
                        length ++
                    }
                }
                if(length === 0)
                {
                    Data.users[userID].waitingAllowBuilding = null
                }
                const building = await Buildings.findOne({where: {id: buildingID}})
                if(!building)
                {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {}
                    await api.SendMessage(context.player.id, "⚠ Не актуально")
                    return
                }
                if(Data.cities[building.dataValues.cityID].buildingsScore >= Data.cities[building.dataValues.cityID].maxBuildings)
                {
                    try
                    {
                        await api.api.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {}
                    await api.SendMessage(context.player.id, "⚠ Не хватает места в городе")
                    await Buildings.destroy({where: {id: buildingID}})
                    const price = NameLibrary.ReversePrice(Prices["new_" + building.dataValues.type.replace("building_of_", "")])
                    await Data.AddPlayerResources(userID, price)
                    await api.SendMessageWithKeyboard(userID, `❌ Ваша заявка на размещение в городе постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} отклонена. В городе не нашлось места для вашей постройки. Ресурсы возвращены.`, [[keyboard.backButton]])
                    return
                }
                await Keys.create({
                    houseID: building.dataValues.id,
                    ownerID: userID,
                    name: "🔑 " + building.dataValues.name
                })
                building.set({freezing: false})
                await building.save()
                await Data.ResetBuildings()
                Data.cities[building.dataValues.cityID].buildingsScore++
                await City.update({buildingsScore: Data.cities[building.dataValues.cityID].buildingsScore}, {where: {id: building.dataValues.cityID}})
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Принято")
                await api.SendMessageWithKeyboard(userID, `✅ Ваша заявка принята. Теперь вы владелец постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} в городе ${Data.GetCityName(building.dataValues.cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/AllowUserBuilding", e)
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
            for (let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
            {
                if(Data.users[userID]?.waitingAllowBuilding[i])
                {
                    console.log(Data.users[userID]?.waitingAllowBuilding[i])
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                        break
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                let length = 0
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID].waitingAllowBuilding[i])
                    {
                        length ++
                    }
                }
                if(length === 0)
                {
                    Data.users[userID].waitingAllowBuilding = null
                }
                const building = await Buildings.findOne({where: {id: buildingID}})
                await Buildings.destroy({where: {id: buildingID}})
                const price = NameLibrary.ReversePrice(Prices["new_" + building.dataValues.type.replace("building_of_", "")])
                await Data.AddPlayerResources(userID, price)
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "❌ Отклонено")
                await api.SendMessageWithKeyboard(userID, `❌ Ваша заявка на размещение в городе постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} отклонена. Глава города не дал одобрение на строительство. Ресурсы возвращены.`, [[keyboard.backButton]])
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/DeclineUserBuilding", e)
        }
    }

    async HideRoadDistance(context)
    {
        const roadToID = context.eventPayload.item
        const roadFromID = context.eventPayload.addition
        try
        {
            const road = await CityRoads.findOne({where: {id: roadFromID}})
            if(road?.dataValues.time === 0 && road?.dataValues.isBlocked)
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Принято")
                await api.SendMessageWithKeyboard(context.peerId, "ℹ Вы направлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" для того чтобы начать ввод информации о новой дороге", [[keyboard.startButton({type: "build_the_road", roadFromID: roadFromID, roadToID: roadToID})]])
                Data.users[context.peerId].state = Scenes.FillingOutTheForm
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/HideRoadDistance", e)
        }
    }

    async AppealWarning(context)
    {
        const warningID = context.eventPayload.item
        try
        {
            const warning = await Warning.findOne({where: {id: warningID}})
            if(warning)
            {
                const user = await Player.findOne({where: {id: warning.dataValues.userID}})
                await Warning.destroy({where: {id: warningID}})
                const warnCount = await Warning.count({where: {userID: user.dataValues.id}})
                let request = `✅ Администрация проекта приняла решение обжаловать вам жалобу от ${NameLibrary.ParseDateTime(warning.dataValues.createdAt)}`
                if(user.dataValues.isBanned && warnCount < 3)
                {
                    await Player.update({warningScore: warnCount, isBanned: false}, {where: {id: user.dataValues.id}})
                    await Ban.destroy({where: {userID: user.dataValues.id}})
                    if(Data.users[user.dataValues.id]) delete Data.users[user.dataValues.id]
                    request += "\n\n✅ Теперь у вас менее 3-х предупреждений, поэтому вы получаете разбан в проекте"
                }
                else
                {
                    await Player.update({warningScore: warnCount}, {where: {id: user.dataValues.id}})
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].warningScore = warnCount
                }
                await api.SendMessage(user.dataValues.id, request)
                if(Data.owner)
                {
                    await api.api.messages.send({
                        user_id: Data.owner.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал репорт игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                if(Data.projectHead)
                {
                    await api.api.messages.send({
                        user_id: Data.projectHead.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал репорт игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                for(const id of Object.keys(Data.supports))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал репорт игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                for(const id of Object.keys(Data.administrators))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал репорт игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                for(const id of Object.keys(Data.moderators))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал репорт игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Обжаловано")
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/AppealWarning", e)
        }
    }

    async AppealBan(context)
    {
        const banID = context.eventPayload.item
        try
        {
            const ban = await Ban.findOne({where: {id: banID}})
            if(ban)
            {
                const user = await Player.findOne({where: {id: ban.dataValues.userID}})
                await Ban.destroy({where: {id: banID}})
                await Warning.destroy({where: {userID: ban.dataValues.userID}})
                await Player.update({warningScore: 0, isBanned: false}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) delete Data.users[user.dataValues.id]
                await api.SendMessage(user.dataValues.id, `✅ Администрация проекта приняла решение обжаловать ваш бан от ${NameLibrary.ParseDateTime(ban.dataValues.createdAt)}\n\n✅ Теперь вы можете свободно пользоваться ботом и писать в чатах`)
                if(Data.owner)
                {
                    await api.api.messages.send({
                        user_id: Data.owner.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал бан игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                if(Data.projectHead)
                {
                    await api.api.messages.send({
                        user_id: Data.projectHead.id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал бан игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                for(const id of Object.keys(Data.supports))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал бан игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                for(const id of Object.keys(Data.administrators))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} обжаловал бан игрока *id${user.dataValues.id}(${user.dataValues.nick})`
                    })
                }
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "✅ Обжаловано")
            }
            else
            {
                try
                {
                    await api.api.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {}
                await api.SendMessage(context.player.id, "⚠ Не актуально")
            }
        }
        catch (e)
        {
            await api.SendLogs(context, "CallbackEventController/AppealBan", e)
        }
    }
}

module.exports = new CallbackEventController()