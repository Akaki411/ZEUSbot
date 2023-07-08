class VKChat
{
    constructor(chat)
    {
        this.id = chat.dataValues.id
        this.muteList = this.MuteListToObject(JSON.parse(chat.dataValues.muteList))
        this.antiMuteList = this.AntiMuteListToObject(JSON.parse(chat.dataValues.antiMuteList))
        this.clean = chat.dataValues.deleteMessages
        this.RP = chat.dataValues.rolePlay
        this.hide = chat.dataValues.hide
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

    AntiMuteListToObject(array)
    {
        let obj = {}
        for(const element of array)
        {
            obj[element.id] = {
                moderID: element.moderID,
                name: element.name
            }
        }
        return obj
    }
}

module.exports = VKChat