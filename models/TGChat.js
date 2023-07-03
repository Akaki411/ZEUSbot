class TGChat
{
    constructor(chat)
    {
        this.id = chat.dataValues.id
        this.muteList = JSON.parse(chat.dataValues.muteList)
        this.clean = chat.dataValues.deleteMessages
    }
}

module.exports = TGChat