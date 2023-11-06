const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models")
const Data = require("../models/CacheData")
const Samples = require("./Samples")
class NameLibrary
{
    GetChance(chance)
    {
        chance = Math.min(chance, 100)
        return Math.random() * 100 < chance
    }

    GetRandomNumb(min, max)
    {
        return Math.floor(min + Math.floor(Math.random() * (max - min + 1)))
    }

    GetDate()
    {
        const date = new Date()
        const mm = date.getMonth() + 1
        const dd = date.getDate()
        return [
            (dd>9 ? '' : '0') + dd,
            (mm>9 ? '' : '0') + mm,
            date.getFullYear()
        ].join('.')
    }

    GetTime()
    {
        const date = new Date()
        const hh = date.getHours()
        const mm = date.getMinutes()
        return [
            (hh>9 ? '' : '0') + hh,
            (mm>9 ? '' : '0') + mm
        ].join('.')
    }

    ParseDateTime(date)
    {
        const time = new Date(date)
        const month = time.getMonth() + 1
        const day = time.getDate()
        const hour = time.getHours()
        const minute = time.getMinutes()
        return [
            [
                (day>9 ? '' : '0') + day,
                (month>9 ? '' : '0') + month,
                time.getFullYear()
            ].join('.'),
            [
                (hour>9 ? '' : '0') + hour,
                (minute>9 ? '' : '0') + minute
            ].join(':')
        ].join(' ')
    }

    GetRandomSample(sample)
    {
        let samples = Samples[sample]
        return samples[this.GetRandomNumb(0, samples.length - 1)]
    }

    ParseFutureTime(future)
    {
        const time = new Date()
        let request = ""
        let differance = future - time
        let weeks = Math.trunc(differance / 604800000)
        if(weeks > 0)
        {
            request += weeks + "н "
            differance -= weeks * 604800000
        }
        let days = Math.trunc(differance / 86400000)
        if(days > 0)
        {
            request += days + "д "
            differance -= days * 86400000
        }
        let hours = Math.trunc(differance / 3600000)
        if(hours > 0)
        {
            request += hours + "ч "
            differance -= hours * 3600000
        }
        let minutes = Math.trunc(differance / 60000)
        if(minutes > 0)
        {
            request += minutes + "м "
            differance -= minutes * 60000
        }
        let seconds = Math.trunc(differance / 1000)
        if(seconds > 0)
        {
            request += seconds + "с "
        }
        return request
    }

    GetGender(sex)
    {
        return sex ? "Мужской" : "Женский"
    }

    RoleEstimator(role)
    {
        switch (role)
        {
            case "player":
                return 0
            case "moder":
                return 1
            case "GM":
                return 2
            case "MGM":
                return 3
            case "admin":
                return 3
            case "Madmin":
                return 4
            case "support":
                return 4
            case "project_head":
                return 5
            case "owner":
                return 6
        }
        return 0
    }

    PriceMultiply(price, multiplier)
    {
        let newPrice = {}
        for(const res of Object.keys(price))
        {
            newPrice[res] = Math.round(price[res] * multiplier)
        }
        return newPrice
    }

    PriceTaxRefund(price, tax)
    {
        if(tax === 0) return price
        let newPrice = {}
        for(const res of Object.keys(price))
        {
            newPrice[res] = Math.round(price[res] / (1 - (tax / 100)))
        }
        return newPrice
    }

    AfterPayTax(price, tax)
    {
        if(tax === 0) return price
        let newPrice = {}
        for(const res of Object.keys(price))
        {
            newPrice[res] = Math.round(price[res] * (1 - (tax / 100)))
        }
        return newPrice
    }

    IsVoidPrice(price)
    {
        let isVoid = true
        for(const res of Object.keys(price)) if(price[res] !== 0) isVoid = false
        return isVoid
    }

    GetDateByDayOfYear(day)
    {
        const date = new Date(new Date().getFullYear(), 0, day)
        const month = date.toLocaleString('ru-RU', { month: 'long' })
        const dayOfMonth = date.getDate()
        return `${dayOfMonth} ${month.charAt(0).toUpperCase() + month.slice(1)}`
    }

    GetGameTime(time)
    {
        const date = new Date(time)
        const now = new Date()
        const diff = now.getMonth() - date.getMonth() + (12 * (now.getFullYear() - date.getFullYear()))
        const year = (year) => {return year > 0 ? `${year} год` : `${Math.abs(year)} год до Н.Э.`}
        let daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
        let day = Math.round((date.getDate() / daysInMonth) * 365)
        return `${this.GetDateByDayOfYear(day)} ${year(Data.variables["year"] - diff)} (${this.ParseDateTime(time)})`
    }

    GetGameSeason()
    {
        let now = new Date()
        let daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
        const season = (month, day) =>
        {
            const seasons = {
                1: "☃ Зима",
                2: "🍃 Весна",
                3: "☀ Лето",
                4: "🍁 Осень"
            }
            const seasonDuration = month / 4
            return seasons[Math.ceil(day / seasonDuration)]
        }
        const year = (year) => {return year > 0 ? `${year} год` : `${Math.abs(year)} год до Н.Э.`}
        return `${year(Data.variables["year"])}, ${season(daysInMonth, now.getDate())}`
    }

    PriceSum(array)
    {
        let newPrice = {}
        for(const price of array)
        {
            for(const res of Object.keys(price))
            {
                if(!newPrice[res]) newPrice[res] = 0
                newPrice[res] += price[res]
            }
        }
        return newPrice
    }

    GetResourceName(res)
    {
        switch(res)
        {
            case "money":
                return "💰 Монеты"
            case "wheat":
                return "🌾 Зерно"
            case "wood":
                return "🪵 Древесина"
            case "stone":
                return "🪨 Камень"
            case "iron":
                return "🌑 Железо"
            case "copper":
                return "🥉 Бронза"
            case "silver":
                return "🥈 Серебро"
            case "diamond":
                return "💎 Алмазы"
        }
        return res
    }

    GetPrice(price)
    {
        const resources = Object.keys(price)
        let request = ""
        for(let i = 0; i < resources.length; i++)
        {
            request += this.GetResourceName(resources[i]) + " : " + Math.abs(price[resources[i]]) + "\n"
        }
        return request
    }

    ReversePrice(price)
    {
        let newPrice = {}
        Object.keys(price).forEach(key => {
            newPrice[key] = price[key] * -1
        })
        return newPrice
    }

    GetRoleName(role)
    {
        switch (role)
        {
            case "player":
                return "😸 Игрок"
            case "moder":
                return "🪄 Модератор"
            case "GM":
                return "🕹 Гейм-мастер"
            case "MGM":
                return "🔝🕹 Старший гейм-мастер"
            case "admin":
                return "🐓 Администратор"
            case "Madmin":
                return "🔝🐓 Старший администратор"
            case "support":
                return "🔧 Тех-поддержка"
            case "project_head":
                return "🤴 Глава проекта"
            case "owner":
                return "🔝 Владелец"
            default:
                return "Не указано"
        }
    }

    GetStatusName(status)
    {
        switch (status)
        {
            case "stateless":
                return "🫴 Апатрид"
            case "candidate":
                return "Кандидат на гражданство"
            case "citizen":
                return "💳 Гражданин"
            case "official":
                return "🧐 Чиновник"
            case "leader":
                return "👑 Правитель"
            case "worker":
                return "⚙ Работник"
        }
        return "Не указано"
    }

    GetBuildingType(type)
    {
        switch (type)
        {
            case "building_of_house":
                return "🏠 Жилой дом"
            case "building_of_bank":
                return "🏦 Банк"
            case "building_of_barracks":
                return "⚔ Казарма"
            case "building_of_port":
                return "🛟 Порт"
            case "building_of_mint":
                return "🪙 Монетный двор"
            case "building_of_church":
                return "✝ Храм"
            case "building_of_wheat":
                return "🌾 Сельское хозяйство"
            case "building_of_stone":
                return "🪨 Каменоломня"
            case "building_of_wood":
                return "🪵 Лесополоса"
            case "building_of_iron":
                return "🌑 Железный рудник"
            case "building_of_silver":
                return "🥈 Серебряный рудник"
            case "building_of_monument":
                return "🗿 Памятник"
        }
        return "Новый, еще не добавленный тип"
    }
    GetBuildingEmoji(type)
    {
        switch (type)
        {
            case "building_of_house":
                return "🏠 "
            case "building_of_bank":
                return "🏦 "
            case "building_of_barracks":
                return "⚔ "
            case "building_of_port":
                return "🛟 "
            case "building_of_mint":
                return "🪙 "
            case "building_of_church":
                return "✝ "
            case "building_of_wheat":
                return "🌾 "
            case "building_of_stone":
                return "🪨 "
            case "building_of_wood":
                return "🪵 "
            case "building_of_iron":
                return "🌑 "
            case "building_of_silver":
                return "🥈 "
        }
        return ""
    }

    async GetPlayerNick(id)
    {
        const user = await Player.findOne({where: {id: id}, attributes: ["id", "nick"]})
        if(!user) return "Не зарегистрирован"
        return `*id${user.dataValues.id}(${user.dataValues.nick})`
    }

    async GetFullUserInfo(id, userObject)
    {
        let request = "ℹ Полная информация об игроке:\n\n"
        if(Data.users[id])
        {
            request += Data.users[id].GetInfo() + "\n\n" + Data.users[id].GetResources()
        }
        else
        {
            const player = await Player.findOne({where: {id: id}})
            const playerStatus = await PlayerStatus.findOne({where: {id: id}})
            const playerInfo = await PlayerInfo.findOne({where: {id: id}})
            const playerResources = await PlayerResources.findOne({where: {id: id}})
            const user = new userObject(player, playerStatus, playerInfo, playerResources)
            request += user.GetInfo() + "\n\n" + user.GetResources()
        }
        return request
    }

    ConvertTGMessage(message)
    {
        message = message.replace(/\./gi, "\\.")
        message = message.replace(/\[/gi, "\\[")
        message = message.replace(/]/gi, "\\]")
        message = message.replace(/-/gi, "\\-")
        return message
    }
}

module.exports = new NameLibrary()