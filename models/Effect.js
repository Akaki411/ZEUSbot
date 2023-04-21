const NameLibrary = require("../variables/NameLibrary")
const Data = require("./CacheData")
class Effect
{
    constructor(effect, time, id)
    {
        this.name = effect.name
        this.type = effect.type
        this.id = id
        this.isValid = true
        this.time = new Date()
        this.time.setMinutes(this.time.getMinutes() + time)
        this.timeout = setTimeout(() =>
        {
            this.isValid = false
            Data.users[this.id]?.CheckEffectsList()
        }, time * 60000)
    }

    GetInfo()
    {
        return `${this.name} - осталось ${NameLibrary.ParseFutureTime(this.time)}`
    }
}

module.exports = Effect