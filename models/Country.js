const {Player, City, PlayerStatus, Army, UnitType, UnitClass, Country} = require("../database/Models")

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
        this.TGchatID = country.dataValues.TGchatID
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
        this.moderID = country.dataValues.moderID
        this.hide = country.dataValues.hide
        this.blessingScore = country.dataValues.blessingScore
        this.economicScore = country.dataValues.economicScore
        this.loyalty = country.dataValues.loyalty
        this.gold = country.dataValues.gold
        this.income = country.dataValues.income
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

    GetResources(app)
    {
        if(app === "TG")
        {
            return `Бюджет фракции [${this.name}](https://vk.com/club${this.groupID}):\n\n💰 Монеты \\- ${this.money > 0 ? this.money : "\\" + this.money}\n🪨 Камень \\- ${this.stone > 0 ? this.stone : "\\" + this.stone}\n🌾 Зерно \\- ${this.wheat > 0 ? this.wheat : "\\" + this.wheat}\n🪵 Дерево \\- ${this.wood > 0 ? this.wood : "\\" + this.wood}\n🌑 Железо \\- ${this.iron > 0 ? this.iron : "\\" + this.iron}\n🥉 Бронза \\- ${this.copper > 0 ? this.copper : "\\" + this.copper}\n🥈 Серебро \\- ${this.silver > 0 ? this.silver : "\\" + this.silver}\n💎 Алмазы \\- ${this.diamond > 0 ? this.diamond : "\\" + this.diamond}`
        }
        else
        {
            return `Бюджет фракции *public${this.groupID}(${this.name}):\n\n💰 Монеты - ${this.money}\n🪨 Камень - ${this.stone}\n🌾 Зерно - ${this.wheat}\n🪵 Дерево - ${this.wood}\n🌑 Железо - ${this.iron}\n🥉 Бронза - ${this.copper}\n🥈 Серебро - ${this.silver}\n💎 Алмазы - ${this.diamond}${process.env["MINIROUND"] && `\n\n🔶 Золотые монеты - ${this.gold}`}`
        }
    }

    async ShowArmy()
    {
        const army = await Army.findAll({where: {ownerId: this.id, ownerType: "country"}})
        if(army.length === 0) return ["🚫 Отряды не добавлены"]
        let request = [""]
        let page = 0
        let i = 1
        for(const detachment of army)
        {
            let type = await UnitType.findOne({where: {id: detachment.dataValues.typeId}})
            if(!type) continue
            let unit = await UnitClass.findOne({where: {id: detachment.dataValues.classId}})
            if(!unit) continue
            let city = await City.findOne({where: {id: detachment.dataValues.location}})
            if(!city) continue
            let country = await Country.findOne({where: {id: city.dataValues.countryID}})
            if(!country) continue
            request[page] += "🔵 Отряд " + detachment.dataValues.name + "\n"
            request[page] += "🔰 Юнит: " + unit.dataValues.name + "\n"
            request[page] += "🏹 Количество юнитов в отряде: " + detachment.dataValues.count + "\n"
            request[page] += "👥 Описание: " + unit.dataValues.description + "\n"
            request[page] += "💂‍♂ Тип: " + type.dataValues.name + "\n"
            request[page] += "🎖 Боевой опыт: " + detachment.dataValues.experience + "\n"
            request[page] += `📍 Местоположение отряда: город ${city.dataValues.name} фракции @public${country.dataValues.groupID}(${country.dataValues.name}), ${detachment.dataValues.note}`
            request[page] += "\n\n"
            i++
            if(request[page].length > 3500)
            {
                page ++
                request[page] = ""
            }
        }
        request = request.filter(key => {return key.length > 0})
        if(request[0].length === 0) return ["⚠ Список отрядов пуст"]
        return request
    }

    async GetAllInfo()
    {
        const leader = await Player.findOne({where: {id: this.leaderID}})
        const population = await PlayerStatus.count({where: {citizenship: this.id}})
        const cityCount = await City.count({where: {countryID: this.id}})
        return `Фракция: @public${this.groupID}(${this.name}):\n\n👑Правитель: ${leader ? `*id${leader?.dataValues.id}(${leader?.dataValues.nick})` : "Не назначен"}\n🪪Описание: ${this.description}\n👨‍👩‍👧‍👦Население: ${population}\n🏙Количество городов: ${cityCount}\n💲Налог для граждан: ${this.citizenTax}%\n💲Налог для приезжих: ${this.nonCitizenTax}%\n💵Въездная пошлина: 🪙${this.entranceFee} монет`
    }

    GetName(IOS, app)
    {
        app = app || "VK"
        if(app === "VK")
        {
            return IOS ? this.name : `@public${this.groupID}(${this.name})`
        }
        else
        {
            return `[${this.name}](https://vk.com/club${this.groupID})`
        }
    }
}

module.exports = CountryObject