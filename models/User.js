const Data = require("./CacheData")
const NameLibrary = require("../variables/NameLibrary")
const Effect = require("./Effect")
class User
{
    constructor(user, status, info, resources)
    {

        this.id = user.dataValues.id
        this.nick = user.dataValues.nick
        this.gender = user.dataValues.gender
        this.warningScore = user.dataValues.warningScore
        this.role = user.dataValues.role
        this.status = user.dataValues.status
        this.platform = user.dataValues.platform
        this.avatar = user.dataValues.avatar
        this.location = status.dataValues.location
        this.countryID = status.dataValues.countryID
        this.citizenship = status.dataValues.citizenship
        this.notifications = status.dataValues.notifications
        this.registration = status.dataValues.registration
        this.dodgeTaxScore = status.dataValues.dodgeTaxScore
        this.botForgotTime = new Date(status.dataValues.botForgotTime)
        this.botCallTime = new Date(status.dataValues.botCallTime)
        this.description = info.dataValues.description
        this.marriedID = info.dataValues.marriedID
        this.nationality = info.dataValues.nationality
        this.age = info.dataValues.age
        this.msgs = info.dataValues.msgs
        this.audios = info.dataValues.audios
        this.stickers = info.dataValues.stickers
        this.swords = info.dataValues.swords
        this.fatigue = 100
        this.effects = []
        this.money = resources.dataValues.money
        this.stone = resources.dataValues.stone
        this.wood = resources.dataValues.wood
        this.wheat = resources.dataValues.wheat
        this.iron = resources.dataValues.iron
        this.copper = resources.dataValues.copper
        this.silver = resources.dataValues.silver
        this.diamond = resources.dataValues.diamond
        this.lastWill = undefined
        this.isMarried = this.marriedID !== null
        this.inBuild = null
        this.isFreezed = false
        this.isRelaxing = false
        this.lastActionTime = new Date()
        this.stayInCityTime = new Date()
        this.state = () => {delete this}
        if(info.dataValues.botMemory)
        {
            Data.requests[this.id] = JSON.parse(info.dataValues.botMemory)
        }
    }

    CanPay(pay)
    {
        let can = true
        if(pay.money) can = can && (this.money + pay.money >= 0)
        if(pay.stone) can = can && (this.stone + pay.stone >= 0)
        if(pay.wood) can = can && (this.wood + pay.wood >= 0)
        if(pay.wheat) can = can && (this.wheat + pay.wheat >= 0)
        if(pay.iron) can = can && (this.iron + pay.iron >= 0)
        if(pay.copper) can = can && (this.copper + pay.copper >= 0)
        if(pay.silver) can = can && (this.silver + pay.silver >= 0)
        if(pay.diamond) can = can && (this.diamond + pay.diamond >= 0)
        return can
    }

    CheckEffectsList = () =>
    {
        const validEffects = []
        for(const effect of this.effects)
        {
            if(effect?.isValid)
            {
                validEffects.push(effect)
            }
        }
        this.effects = validEffects
    }

    HasEffect(type)
    {
        let has = false
        for(const effect of this.effects)
        {
            if(effect?.type === type)
            {
                has = true
            }
        }
        return has
    }

    AddEffect(effect, time)
    {
        if(this.HasEffect(effect.type))
        {
            for(let i = 0; i < this.effects.length; i++)
            {
                if(this.effects[i]?.type === effect.type)
                {
                    clearTimeout(this.effects[i].timeout)
                    this.effects[i] = null
                    this.effects[i] = new Effect(effect, time, this.id)
                }
            }
        }
        else
        {
            this.effects.push(new Effect(effect, time, this.id))
        }
    }

    GetName()
    {
        return this.id > 0 ? `*id${this.id}(${this.nick})` : `*public${Math.abs(this.id)}(${this.nick})`
    }

    GetResources()
    {
        return (this.id > 0 ? `*id${this.id}(Ваш)` : `*public${Math.abs(this.id)}(Ваш)`) + ` инвентарь:\n💰 Монеты - ${this.money}\n🪨 Камень - ${this.stone}\n🌾 Зерно - ${this.wheat}\n🪵 Дерево - ${this.wood}\n🌑 Железо - ${this.iron}\n🥉 Бронза - ${this.copper}\n🥈 Серебро - ${this.silver}\n💎 Алмазы - ${this.diamond}`
    }

    GetInfo()
    {
        try
        {
            return `👤 ${this.id > 0 ? `*id${this.id}(${this.nick})` : `*public${Math.abs(this.id)}(${this.nick})`}:\n\n📅 Возраст: ${this.age}\n🔅 Пол: ${this.gender ? "Мужской" : "Женский"}\n🍣 Национальность: ${this.nationality}\n💍 Брак: ${this.marriedID ? this.gender ? `*id${this.marriedID}(💘Муж)` : `*id${this.marriedID}(💘Жена)` : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(this.role)}\n👑 Статус: ${NameLibrary.GetStatusName(this.status)}\n🔰 Гражданство: ${this.citizenship ? Data.GetCountryName(this.citizenship) : "Нет"}\n📍 Прописка: ${this.registration ? Data.GetCityName(this.registration) : "Нет"}\n💭 Описание: ${this.description}`
        }
        catch (e)
        {
            return "Проблема с кэшем: " + e.message
        }
    }

    CantTransact()
    {
        return this.isRelaxing || this.HasEffect("block_transfer") || this.isFreezed || Data.countries[this.countryID].isUnderSanctions || Data.cities[this.location].isUnderSanctions
    }

    WhyCantTransact()
    {
        if(this.isRelaxing) return "💤 Вы находитесь в режиме отдыха 💤"
        if(this.HasEffect("block_transfer")) return "На вас наложен эффект ⛔ Блокировка счета"
        if(this.isFreezed) return "☃ Вы заморожены ☃"
        if(Data.countries[this.countryID].isUnderSanctions) return "‼ Фракция, гражданином которой вы являетесь попала под санкции"
        if(Data.cities[this.location].isUnderSanctions) return "‼ Город, в котором вы прописаны попал под санкции"
        return "❓ Неизвестно ❓"
    }

    CantMove()
    {
        return this.isRelaxing || this.HasEffect("block_moving") || this.isFreezed || Data.cities[this.location].isSiege || Data.countries[this.countryID].isSiege
    }

    WhyCantMove()
    {
        if(this.isRelaxing) return "💤 Вы находитесь в режиме отдыха 💤"
        if(this.HasEffect("block_moving")) return "На вас наложен эффект 🔗 Кандалы"
        if(this.isFreezed) return "☃ Вы заморожены ☃"
        if(Data.cities[this.location].isSiege) return "‼ Город, в котором вы находитесь осажен"
        if(Data.countries[this.countryID].isSiege) return "‼ Фракция, в которой вы находитесь, сейчас под блокадой"
        return "❓ Неизвестно ❓"
    }

    CantExtraction()
    {
        return this.isRelaxing || this.HasEffect("block_extracting") || this.isFreezed || Data.cities[this.location].isSiege
    }

    WhyCantExtraction()
    {
        if(this.isRelaxing) return "💤 Вы находитесь в режиме отдыха 💤"
        if(this.HasEffect("block_extracting")) return "На вас наложен эффект 😳 Усталость"
        if(this.isFreezed) return "☃ Вы заморожены ☃"
        if(Data.cities[this.location].isSiege) return "‼ Город, в котором вы находитесь осажен"
        return "❓ Неизвестно ❓"
    }
}

module.exports = User