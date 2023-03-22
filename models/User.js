const Data = require("./CacheData")
const NameLibrary = require("../variables/NameLibrary")
const Effect = require("./Effect")
class User
{
    constructor(user, status, info, resources)
    {

        this.id = user.dataValues.id
        this.nick = user.dataValues.nick
        this.gender = NameLibrary.GetGender(user.dataValues.gender)
        this.warningScore = user.dataValues.warningScore
        this.role = user.dataValues.role
        this.status = user.dataValues.status
        this.location = status.dataValues.location
        this.countryID = status.dataValues.countryID
        this.citizenship = status.dataValues.citizenship
        this.notifications = status.dataValues.notifications
        this.registration = status.dataValues.registration
        this.marriedID = info.dataValues.marriedID
        this.nationality = info.dataValues.nationality
        this.age = info.dataValues.age
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
        this.isMarried = this.marriedID !== null
        this.inBuild = null
        this.lastActionTime = new Date()
        this.lastReportTime = null
        this.timeout = null
        this.state = () => {delete this}
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
        return `*id${this.id}(${this.nick})`
    }

    GetResources()
    {
        return `*id${this.id}(Ваш) инвентарь:\n💰 Монеты:  ${this.money}\n🪨 Камень:${this.stone}\n🌾 Зерно:${this.wheat}\n🪵 Дерево:${this.wood}\n🌑 Железо:${this.iron}\n🥉 Бронза:${this.copper}\n🥈 Серебро:${this.silver}\n💎 Алмазы:${this.diamond}`
    }

    GetInfo()
    {
        return `📌Игрок *id${this.id}(${this.nick}):\n📅 Возраст: ${this.age}\n⚤ Пол: ${this.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${this.nationality}\n💍 Брак: ${this.marriedID ? this.gender ? `*id${this.marriedID}(💘Жена)` : `*id${this.marriedID}(💘Муж)` : "Нет"}\n🪄 Роль: ${NameLibrary.GetRoleName(this.role)}\n👑 Статус: ${NameLibrary.GetStatusName(this.status)}\n🔰 Гражданство: ${this.citizenship ? Data.GetCountryName(this.citizenship) : "Нет"}\n📍 Прописка: ${this.registration ? Data.GetCityName(this.registration) : "Нет"}`
    }
}

module.exports = User