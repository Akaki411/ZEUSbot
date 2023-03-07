const {Stats} = require("../database/Models")
class State
{
    constructor(props)
    {
        this.allMessages = 0
        this.swearWordsTable = []
        this.chatsActivity = []
        this.stickermans = []
        this.musicians = []
    }

    async UploadStats()
    {
        this.swearWordsTable.sort()
        this.chatsActivity.sort()
        this.stickermans.sort()
        this.musicians.sort()

        await Stats.create({
            messages: this.allMessages,

        })
    }

    NewSwearWord(id)
    {
        for(let i = 0; i < this.swearWordsTable.length; i++)
        {
            if(this.swearWordsTable[i].includes(id))
            {
                this.swearWordsTable[i][1]++
                return
            }
        }
        this.swearWordsTable.push([id, 1])
    }
}