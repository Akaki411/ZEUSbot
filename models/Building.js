const {BuildingAddon, Buildings} = require("../database/Models");

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
        this.isFreezing = building.dataValues.freezing
        this.lastActivityTime = new Date(building.dataValues.workEndTime)
        this.addons = []
    }
    Upgrade(level)
    {
        this.level = level
    }
    GetAllInfo()
    {
        return `${this.GetType(this.type)} \"${this.name}\"\n\n🙎‍♂ Владелец: ${this.ownerType === "user" ? "*id" + this.ownerID + "(Владелец)" : this.ownerType === "city" ? "Город" : "Государство"}\n⬆ Уровень: ${this.level}`
    }

    GetType(type)
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
        }
        return "Новый, еще не добавленный тип"
    }

    GetEmoji(type)
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

    GetExtraction()
    {
        const GetRandomNumb = (min, max) => {return Math.floor(min + Math.floor(Math.random() * (max - min + 1)))}
        switch (`${this.type.replace("building_of_", "")}_lvl${this.level}`)
        {
            case "wheat_lvl1":
                return GetRandomNumb(125, 375)
            case "wheat_lvl2":
                return GetRandomNumb(250, 750)
            case "wheat_lvl3":
                return GetRandomNumb(500, 1500)
            case "wheat_lvl4":
                return GetRandomNumb(1000, 3000)
            case "stone_lvl1":
                return GetRandomNumb(125, 250)
            case "stone_lvl2":
                return GetRandomNumb(250, 500)
            case "stone_lvl3":
                return GetRandomNumb(500, 1000)
            case "stone_lvl4":
                return GetRandomNumb(1000, 2000)
            case "wood_lvl1":
                return GetRandomNumb(125, 250)
            case "wood_lvl2":
                return GetRandomNumb(250, 500)
            case "wood_lvl3":
                return GetRandomNumb(500, 1000)
            case "wood_lvl4":
                return GetRandomNumb(1000, 2000)
            case "iron_lvl1":
                return GetRandomNumb(35, 90)
            case "iron_lvl2":
                return GetRandomNumb(65, 185)
            case "iron_lvl3":
                return GetRandomNumb(130, 370)
            case "iron_lvl4":
                return GetRandomNumb(260, 740)
            case "silver_lvl1":
                return GetRandomNumb(65, 185)
            case "silver_lvl2":
                return GetRandomNumb(125, 375)
            case "silver_lvl3":
                return GetRandomNumb(250, 750)
            case "silver_lvl4":
                return GetRandomNumb(500, 1500)
        }
        return 0
    }

    async SaveWorkTime()
    {
        await Buildings.update({workEndTime: this.lastActivityTime}, {where: {id: this.id}})
    }
}

module.exports = Building