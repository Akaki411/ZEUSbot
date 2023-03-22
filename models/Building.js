const {BuildingAddon} = require("../database/Models");

class Building
{
    constructor(building)
    {
        this.id = building.dataValues.id
        this.cityID = building.dataValues.cityID
        this.name = building.dataValues.name
        this.type = building.dataValues.type
        this.ownerID = building.dataValues.ownerID
        this.ownerType = building.dataValues.ownerType
        this.level = building.dataValues.level
        this.lastActivityTime = new Date()
        this.addons = []
    }
    Upgrade(level)
    {
        this.level = level
    }
    async LoadAddons()
    {
        this.addons = []
        const addons = await BuildingAddon.findAll({where: {id: this.id}})
        addons.forEach(key => {
            addons.push(key.dataValues)
        })
    }
    GetAllInfo()
    {
        return `${this.GetBuildingType(this.type)} \"${this.name}\"\n\nВладелец: ${this.ownerType === "user" ? "*id" + this.ownerID + "(Владелец)" : this.ownerType === "city" ? "Город" : "Государство"}\nУровень: ${this.level}`
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
                return "🥈 Серебрянный рудник"
        }
        return "Новый, еще не добавленный тип"
    }
}

module.exports = Building