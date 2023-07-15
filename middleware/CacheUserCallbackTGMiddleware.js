const Data = require("../models/CacheData");
const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models");
const UserObject = require("../models/User");
const TGChatController = require("../controllers/TGChatController")

module.exports = async (context) =>
{
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
        else return
    }
    await TGChatController.CallbackHandler(context)
}