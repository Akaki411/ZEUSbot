class ApiKeysGenerator
{
    constructor()
    {
        this.keys = {}
        this.ReloadKeys()
    }

    ReloadKeys()
    {
        const keys = require("../files/OpenAIAPIKeys.json")
        this.keys = {}
        for(let i = 0; i < keys.length; i++)
        {
            this.keys[i] = {
                warnings: 0,
                key: keys[i]
            }
        }
    }

    GetKey()
    {
        let keys = Object.keys(this.keys)
        return this.keys[keys[Math.floor(Math.random() * keys.length)]].key
    }

    WarnKey(key)
    {
        let index = null
        for (const i of Object.keys(this.keys))
        {
            if(this.keys[i].key === key)
            {
                index = i
                break
            }
        }
        if(index === null)
        {
            this.ReloadKeys()
            return
        }
        this.keys[index].warnings ++
        if(this.keys[index].warnings >= 25)
        {
            delete this.keys[index]
        }
        if(Object.keys(this.keys).length === 0)
        {
            this.ReloadKeys()
        }
    }
}

module.exports = new ApiKeysGenerator()