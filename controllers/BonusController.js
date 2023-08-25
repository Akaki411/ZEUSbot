const {Actions} = require("../database/Models");
const Data = require("../models/CacheData")
const api = require("../middleware/API")
const NameLibrary = require("../variables/NameLibrary")

class BonusController
{
    GetRandomResource()
    {
        const lib = "mcgwis"
        return lib[Math.floor(Math.random() * lib.length)]
    }

    Course = {
        like: {
            m: {money: 10},
            c: {stone: 30},
            g: {wood: 30},
            w: {wheat: 50},
            i: {iron: 20},
            s: {silver: 20}
        },
        sub: {
            m: {money: 100},
            c: {stone: 300},
            g: {wood: 300},
            w: {wheat: 500},
            i: {iron: 200},
            s: {silver: 200}
        },
        repost: {
            m: {money: 50},
            c: {stone: 150},
            g: {wood: 150},
            w: {wheat: 250},
            i: {iron: 100},
            s: {silver: 100}
        }
    }

    async NewLike(context)
    {
        try
        {
            if(context.objectType === "post")
            {
                const res = this.GetRandomResource()
                const action = await Actions.findOrCreate({
                    where: {userID: context.likerId, type: "like", contentID: context.objectId},
                    defaults: {userID: context.likerId, type: "like", contentID: context.objectId, resource: res}
                })
                if(!action[1]) return
                await Data.AddPlayerResources(context.likerId, this.Course.like[res])
                await api.SendNotification(context.likerId, "🎉 Спасибо за лайк, вот тебе подарок:\n" + NameLibrary.GetPrice(this.Course.like[res]))
            }
        }
        catch (e) {console.log(e)}
    }

    async LikeRemove(context)
    {
        try
        {
            if(context.objectType === "post")
            {
                const action = await Actions.findOne({where: {userID: context.likerId, type: "like", contentID: context.objectId}})
                if(!action) return
                const res = action.dataValues.resource
                await Data.AddPlayerResources(context.likerId, NameLibrary.ReversePrice(NameLibrary.PriceMultiply(this.Course.like[res], 1.5)))
                await api.SendNotification(context.likerId, "😡😡😡А теперь поставь лайк обратно!😡😡😡\nЗа такие поступки я у тебя отбираю:\n" + NameLibrary.GetPrice(NameLibrary.PriceMultiply(this.Course.like[res], 1.5)))
                await Actions.destroy({where: {userID: context.likerId, type: "like", contentID: context.objectId}})
            }
        }
        catch (e) {console.log(e)}
    }

    async Subscribe(context)
    {
        try
        {
            const res = this.GetRandomResource()
            await Actions.findOrCreate({
                where: {userID: context.userId, type: "sub"},
                defaults: {userID: context.userId, type: "sub", resource: res}
            })
            await Data.AddPlayerResources(context.userId, this.Course.sub[res])
            await api.SendNotification(context.userId, "🔥🔥🔥 Спасибо за подписку! Держи подарок:\n" + NameLibrary.GetPrice(this.Course.sub[res]))
        }
        catch (e) {console.log(e)}
    }

    async Unsubscribe(context)
    {
        try
        {
            const action = await Actions.findOne({where: {userID: context.userId, type: "sub"}})
            if(!action) return
            const res = action.dataValues.resource
            await Data.AddPlayerResources(context.userId, NameLibrary.ReversePrice(NameLibrary.PriceMultiply(this.Course.sub[res], 1.5)))
            await api.SendNotification(context.userId, "😡😡😡 Фу таким быть! Подпишись обратно!\nНо все равно я у тебя забираю:\n" + NameLibrary.GetPrice(NameLibrary.PriceMultiply(this.Course.sub[res], 1.5)))
            await Actions.destroy({where: {userID: context.userId, type: "sub"}})
        }
        catch (e) {console.log(e)}
    }

    async Repost(context)
    {
        try
        {
            const res = this.GetRandomResource()
            const action = await Actions.findOrCreate({
                where: {userID: context.wall.authorId, type: "repost", contentID: context.wall.copyHistory[0].id},
                defaults: {userID: context.wall.authorId, type: "repost", resource: res, contentID: context.wall.copyHistory[0].id}
            })
            if(!action[1]) return
            await Data.AddPlayerResources(context.wall.authorId, this.Course.repost[res])
            await api.SendNotification(context.wall.authorId, "😺 Ого! Наш пост заслужил твоего репоста? Тогда я считаю что и ты заслуживаешь:\n" + NameLibrary.GetPrice(this.Course.repost[res]))
        }
        catch (e) {console.log(e)}
    }
}

module.exports = new BonusController()