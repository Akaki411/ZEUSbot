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
}

module.exports = Building