const Data = require('../models/CacheData')
const api = require('../middleware/API')

class TGSceneController
{
    MainScene = async (context, type) =>
    {
        if(Data.TGcodes[context.text])
        {
            await this.LinkAccount(context)
        }
    }

    async LinkAccount(context)
    {
        const id = Data.TGcodes[context.text]

    }
}

module.exports = new TGSceneController()