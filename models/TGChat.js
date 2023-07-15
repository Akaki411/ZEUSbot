class TGChat
{
    constructor(chat)
    {
        this.id = chat.dataValues.id
        this.peerID = chat.dataValues.peerID
        this.muteList = this.MuteListToObject(JSON.parse(chat.dataValues.muteList))
        this.clean = chat.dataValues.deleteMessages
    }

    MuteListToObject(array)
    {
        let obj = {}
        for(const element of array)
        {
            obj[element.id] = {
                moderID: element.moderID,
                endTime: new Date(element.endTime)
            }
        }
        return obj
    }
}

module.exports = TGChat