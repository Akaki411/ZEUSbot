const {Player, PlayerStatus, PlayerInfo} = require("../database/Models")
const Data = require("../models/CacheData")
const Prices = require("./Prices");
class NameLibrary
{
    GetChance(chance)
    {
        chance = Math.min(chance, 100)
        return Math.random() * 100 < chance
    }

    GetRandomNumb(min, max)
    {
        return Math.round(min + Math.round(Math.random() * (max - min)))
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

    GetGender(sex)
    {
        return sex ? "Мужчина" : "Женщина"
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

    GetResourceName(res)
    {
        switch(res)
        {
            case "money":
                return "💵 Монеты"
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

    GetPrice(price)
    {
        const resources = Object.keys(price)
        let request = ""
        for(let i = 0; i < resources.length; i++)
        {
            request += this.GetResourceName(resources[i]) + " : " + (price[resources[i]] * -1) + "\n"
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

    GetPlayerResources(context)
    {
        return `*id${context.player.id}(Ваш) инвентарь:\n💵 Деньги:  ${context.player.money}\n🪨 Камень:${context.player.stone}\n🌾 Зерно:${context.player.wheat}\n🪵 Дерево:${context.player.wood}\n🌑 Железо:${context.player.iron}\n🪙 Медь:${context.player.copper}\n🥈 Серебро:${context.player.silver}\n💎 Алмазы:${context.player.diamond}`
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
            case "candidate":
                return "Кандидат на гражданство"
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

    GetBuildingType(type)
    {
        switch (type)
        {
            case "building_of_house":
                return "🏠 Жилой дом"
            case "building_of_bank":
                return "🏦 Банк"
            case "building_of_wheat":
                return "🌾 Сельское хозяйство"
            case "building_of_stone":
                return "🪨 Каменоломня"
            case "building_of_wood":
                return "🪵 Лесополоса"
            case "building_of_iron":
                return "🌑 Железный рудник"
            case "building_of_copper":
                return "🪙 Бронзовый рудник"
            case "building_of_silver":
                return "🥈 Серебрянный рудник"
        }
        return "Новый, еще не добавленный тип"
    }

    async GetPlayerNick(id)
    {
        const user = await Player.findOne({where: {id: id}})
        return `*id${user.dataValues.id}(${user.dataValues.nick})`
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