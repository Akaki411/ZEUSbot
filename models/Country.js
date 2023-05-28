const {Player, City, PlayerStatus, CountryArmy} = require("../database/Models")

class CountryObject
{
    constructor(country, resources)
    {
        this.id = country.dataValues.id
        this.name = country.dataValues.name
        this.description = country.dataValues.description
        this.groupID = country.dataValues.groupID
        this.photoURL = country.dataValues.photoURL
        this.welcomePhotoURL = country.dataValues.welcomePhotoURL
        this.leaderID = country.dataValues.leaderID
        this.parliamentID = country.dataValues.parliamentID
        this.governmentForm = country.dataValues.governmentForm
        this.resources = country.dataValues.resources
        this.capitalID = country.dataValues.capitalID
        this.citizenTax = country.dataValues.citizenTax
        this.nonCitizenTax = country.dataValues.nonCitizenTax
        this.entranceFee = country.dataValues.entranceFee
        this.tax = country.dataValues.tax
        this.roadMap = country.dataValues.map
        this.isParliament = country.dataValues.isParliament
        this.isSiege = country.dataValues.isSiege
        this.isUnderSanctions = country.dataValues.isUnderSanctions
        this.notifications = country.dataValues.notifications
        this.chatID = country.dataValues.chatID
        this.rating = country.dataValues.rating
        this.warnings = country.dataValues.warnings
        this.tags = country.dataValues.tags
        this.tested = country.dataValues.tested
        this.barracksLevel = country.dataValues.barracksLevel
        this.stability = country.dataValues.stability
        this.peasantry = country.dataValues.peasantry
        this.religion = country.dataValues.religion
        this.aristocracy = country.dataValues.aristocracy
        this.military = country.dataValues.military
        this.merchants = country.dataValues.merchants
        this.privateBuildingTax = country.dataValues.privateBuildingTax
        this.money = resources.dataValues.money
        this.stone = resources.dataValues.stone
        this.wood = resources.dataValues.wood
        this.wheat = resources.dataValues.wheat
        this.iron = resources.dataValues.iron
        this.copper = resources.dataValues.copper
        this.silver = resources.dataValues.silver
        this.diamond = resources.dataValues.diamond
        this.active = 0
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

    CantTransact()
    {
        return this.isSiege || this.isUnderSanctions
    }

    WhyCantTransact()
    {
        if(this.isSiege) return "Фракция в осаде"
        if(this.isUnderSanctions) return "Фракция под санкциями"
        return "Неизвестно"
    }

    GetResources()
    {
        return `Бюджет фракции *public${this.groupID}(${this.name}):\n\n💰 Монеты - ${this.money}\n🪨 Камень - ${this.stone}\n🌾 Зерно - ${this.wheat}\n🪵 Дерево - ${this.wood}\n🌑 Железо - ${this.iron}\n🥉 Бронза - ${this.copper}\n🥈 Серебро - ${this.silver}\n💎 Алмазы - ${this.diamond}`
    }

    GetUnitType(type)
    {
        switch (type)
        {
            case "elephant":
                return "Слоны"
            case "cavalier":
                return "Кавалерия"
            case "soldier":
                return "Пехота"
        }
        return "Не отмеченный тип"
    }

    async ShowArmy()
    {
        const units = await CountryArmy.findAll({where: {countryID: this.id}})
        if(units.length === 0) return ["🚫 Юниты не добавлены"]
        let request = [""]
        let page = 0
        for(const unit of units)
        {
            if(unit.dataValues.count > 0)
            {
                request[page] += unit.dataValues.name + "\n"
                request[page] += "🏹 Количество: " + unit.dataValues.count + "\n"
                request[page] += "👥 Описание: " + unit.dataValues.description + "\n"
                request[page] += "💂‍♂ Тип: " + this.GetUnitType(unit.dataValues.type) + "\n"
                request[page] += "🎖 Боевой опыт: " + unit.dataValues.rating + "\n"
                request[page] += "\n\n"
                if(request[page].length > 3500)
                {
                    page ++
                    request[page] = ""
                }
            }
        }
        request = request.filter(key => {return key.length > 0})
        if(request[0].length === 0) return ["⚠ Нет армии"]
        return request
    }

    async GetAllInfo()
    {
        const leader = await Player.findOne({where: {id: this.leaderID}})
        const population = await PlayerStatus.count({where: {citizenship: this.id}})
        const cityCount = await City.count({where: {countryID: this.id}})
        return `Фракция: @public${this.groupID}(${this.name}):\n\n👑Правитель: ${leader ? `*id${leader?.dataValues.id}(${leader?.dataValues.nick})` : "Не назначен"}\n🪪Описание: ${this.description}\n👨‍👩‍👧‍👦Население: ${population}\n🏙Количество городов: ${cityCount}\n💲Налог для граждан: ${this.citizenTax}%\n💲Налог для приезжих: ${this.nonCitizenTax}%\n💵Въездная пошлина: 🪙${this.entranceFee} монет`
    }

    GetName(IOS)
    {
        return IOS ? this.name : `@public${this.groupID}(${this.name})`
    }
}

module.exports = CountryObject