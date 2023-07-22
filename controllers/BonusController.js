const {Actions} = require("../database/Models");

class BonusController
{
    GetRandomResource()
    {
        const lib = "mcgwis"
        return lib[Math.floor(Math.random() * lib.length)]
    }

    Course = {
        m: 20,
        c: 20,
        g: 20,
        w: 20,
        i: 20,
        s: 20,
    }

    async NewLike(context)
    {
        try
        {
            if(context.objectType === "post")
            {
                const res = this.GetRandomResource()
                const likeInfo = await Actions.findOne({where: {userID: context.likerId, type: "like", contentID: context.objectId}})
            }
        }
        catch (e) {console.log(e)}
    }

    async LikeRemove(context)
    {
        console.log(context)
    }
}

module.exports = new BonusController()