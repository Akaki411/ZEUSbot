const {Player, Country, City, PlayerStatus, PlayerInfo} = require("../database/Models")
const Data = require("../models/CacheData")
class NameLibrary
{
    GenerateUniqueKey()
    {
        const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let newKey = ""
        for(let i = 0; i < 16; i++)
        {
            newKey += symbols[Math.round(Math.random() * symbols.length)]
        }
        return newKey
    }

    GetChance(chance)
    {
        chance = Math.min(chance, 100)
        return Math.random() * 100 < chance
    }

    GetRandomNumb(min, max)
    {
        return min + Math.round(Math.random() * (max - min))
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
            case "admin":
                return 3
            case "project_head":
                return 4
            case "support":
                return 4
            case "owner":
                return 5
        }
    }

    GetEffectName(effect)
    {
        switch (effect)
        {
            case "123":
                return "Тест"
        }
        return "Неизвестный эффект, обратитесь в тех поддержку."
    }

    GetBuildingName(building)
    {
        switch (building)
        {
            case "house":
                return "🏠 Часный дом"
            case "stone":
                return "⛏ Каменоломня"
            case "wood":
                return "⛏ Лесозаготовка"
            case "wheat":
                return "⛏ Поле"
            case "iron":
                return "⛏ Железный рудник"
            case "copper":
                return "⛏ Медный рудник"
            case "silver":
                return "⛏ Серебрянный рудник"
            case "mint":
                return "💼 Монетный двор"
            case "bank":
                return "💼 Банк"
            case "barracks":
                return "⚔ Казарма"
            case "port":
                return "⚔ Порт"
            case "church":
                return "☦ Церковь"
        }
    }

    GetPrice(thing)
    {
        // Ресурсы {money, stone, wood, wheat, iron, copper, silver, diamond}
        switch (thing)
        {
            case "new_city":
                return {
                    money: -25000,
                    stone: -80000,
                    wood: -70000
                }
            case "expand_city":
                return {
                    money: -6000,
                    stone: -19000,
                    wood: -18500
                }
            case "new_road":
                return {
                    money: -3000,
                    stone: -27000,
                }
        }
    }

    GetResourceName(res)
    {
        switch(res)
        {
            case "wheat":
                return "🌾 Зерно"
            case "wood":
                return "🪵 Древесина"
            case "stone":
                return "🪨 Камень"
            case "iron":
                return "🌑 Железо"
            case "copper":
                return "🪙 Бронза"
            case "silver":
                return "🥈 Серебро"
            case "diamond":
                return "💎 Алмазы"
        }
        return res
    }

    GetRoleName(role)
    {
        switch (role)
        {
            case "player":
                return "👶 Игрок"
            case "moder":
                return "🧒 Модератор"
            case "GM":
                return "🧑 Гейм-мастер"
            case "admin":
                return "👨‍🦳 Администратор"
            case "support":
                return "🔧 Тех-поддержка"
            case "project_head":
                return "🤴 Глава проекта"
            case "owner":
                return "🔝 Владелец"
        }
        return "Не указано"
    }

    GetStatusName(status)
    {
        switch (status)
        {
            case "stateless":
                return "🫴 Апатрид"
            case "citizen":
                return "🪪 Гражданин"
            case "official":
                return "🧐 Чиновник"
            case "leader":
                return "👑 Правитель"
            case "worker":
                return "⚙ Работник"
        }
        return "Не указано"
    }

    async GetPlayerNick(id)
    {
        const user = await Player.findOne({where: {id: id}})
        return `*id${user.dataValues.id}(${user.dataValues.nick})`
    }


    async GetCountryForCity(cityName)
    {
        const city = await City.findOne({where: {name: cityName}})
        const country = await Country.findOne({where: {id: city.dataValues.countryID}})
        return country.dataValues
    }

    async GetUserInfo(id)
    {
        const user = await Player.findOne({where: {id: id}})
        const userStatus = await PlayerStatus.findOne({where: {id: id}})
        const userInfo = await PlayerInfo.findOne({where: {id: id}})

        const marry = userInfo.dataValues.marriedID ? await this.GetPlayerNick(userInfo.dataValues.marriedID) : "Нет"
        const role = this.GetRoleName(user.dataValues.role)
        const status = this.GetStatusName(user.dataValues.status)
        const citizen = userStatus.dataValues.citizenship ? Data.GetCountryName(userStatus.dataValues.citizenship) : "Нет"
        const registration = userInfo.dataValues.registration ? Data.GetCityName(userStatus.dataValues.citizenship) : "Нет"

        return `📌 Ник: *id${user.dataValues.id}(${user.dataValues.nick})\n📅 Возраст: ${userInfo.dataValues.age}\n⚤ Пол: ${user.dataValues.gender ? "♂ Мужчина" : "♀ Женщина"}\n🍣 Национальность: ${userInfo.dataValues.nationality}\n💍 Брак: ${marry}\n🪄 Роль: ${role}\n👑 Статус: ${status}\n🔰 Гражданство: ${citizen}\n📍 Прописка: ${registration}\n📰 Описание: ${userInfo.dataValues.description}`
    }
}

module.exports = new NameLibrary()