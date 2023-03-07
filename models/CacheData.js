const {Player, Country, City, CityResources, CountryResources, PlayerResources} = require("../database/Models")
const fs = require("fs")

class CacheData
{
    constructor()
    {
        this.owner = null            //Владелец
        this.projectHead = null      //Глава проекта
        this.supports = []           //Тех-поддержка
        this.administrators = []     //Администраторы
        this.gameMasters = []        //ГМы
        this.moderators = []         //Модераторы
        this.admins = []             //Список всех полноправных админов

        this.users = []              //Кэш пользователей
        this.cities = []             //Список городов
        this.countries = []          //Список государств
        this.stats = []              //Статистика за день
        this.variables = null
    }

    GetCountryButtons()
    {
        const buttons = []
        this.countries.forEach((key) => {
            if(key)
            {
                buttons.push([key.name, "ID" + key.id])
            }
        })
        return buttons
    }

    GetCityButtons()
    {
        const buttons = []
        this.cities.forEach((key) => {
            if(key)
            {
                buttons.push([key.name, "ID" + key.id])
            }
        })
        return buttons
    }

    GetCityInCountryButtons(id)
    {
        const buttons = []
        this.cities.forEach((key) => {
            if(key)
            {
                if(key.countryID === id)
                {
                    buttons.push([key.name, "ID" + key.id])
                }
            }
        })
        return buttons
    }

    GetCountryName(id)
    {
        return `*public${this.countries[id]?.groupID}(${this.countries[id]?.name})`
    }

    GetCityName(id)
    {
        return this.cities[id]?.name
    }

    GetCityInfo(id)
    {
        return `Город ${this.cities[id]?.name} в фракции ${this.GetCountryName(this.cities[id]?.countryID)}`
    }

    GetCountryForCity(id)
    {
        let city = null
        this.cities.forEach(key => {
            if(key?.id === id)
            {
                city = key
            }
        })
        return this.countries[city?.countryID]
    }

    ParseButtonID(id)
    {
        return id.replace("ID", "")
    }

    async LoadAdmins ()
    {
        //Очистка
        this.owner = null
        this.projectHead = null
        this.supports = []
        this.administrators = []
        this.gameMasters = []
        this.moderators = []
        this.admins = []

        //Загрузка с базы данных
        return new Promise(async (resolve) => {
            this.owner = await Player.findOne({where: {role: "owner"}})?.dataValues
            this.projectHead = await Player.findOne({where: {role: "project_head"}})?.dataValues
            const supports = await Player.findAll({where: {role: "support"}})
            supports.forEach(key => {
                this.supports.push(key.dataValues)
            })
            const administrators = await Player.findAll({where: {role: "admin"}})
            administrators.forEach(key => {
                this.administrators.push(key.dataValues)
            })
            const gameMasters = await Player.findAll({where: {role: "GM"}})
            gameMasters.forEach(key => {
                this.gameMasters.push(key.dataValues)
            })
            const moderators = await Player.findAll({where: {role: "moder"}})
            moderators.forEach(key => {
                this.moderators.push(key.dataValues)
            })

            if(this.owner) this.admins.push(this.owner)
            if(this.projectHead) this.admins.push(this.projectHead)
            this.supports.forEach(key => {
                this.admins.push(key)
            })
            this.administrators.forEach(key => {
                this.admins.push(key)
            })
            return resolve()
        })
    }

    async LoadCountries()
    {
        this.countries = []
        return new Promise(async (resolve) => {
            const countries = await Country.findAll()
            for (const key of countries)
            {
                if(key)
                {
                    this.countries[key.dataValues.id] = key.dataValues
                    let res = await CountryResources.findOne({where: {id: key.dataValues.id}})
                    if (res) this.countries[key.dataValues.id].res = res.dataValues
                }
            }
            return resolve()
        })
    }

    async LoadCities()
    {
        this.cities = []
        return new Promise(async (resolve) => {
            const cities = await City.findAll()
            for (const key of cities)
            {
                if(key)
                {
                    this.cities[key.dataValues.id] = key.dataValues
                    let res = await CityResources.findOne({where: {id: key.dataValues.id}})
                    if(res) this.cities[key.dataValues.id].res = res.dataValues
                }
            }
            return resolve()
        })
    }

    async LoadVariables()
    {
        return new Promise((resolve) => {
            this.variables = require("../files/settings.json")
            return resolve()
        })
    }

    async SaveVariables()
    {
        return new Promise((resolve) => {
            const serialize = JSON.stringify(this.variables)
            fs.writeFile("./files/settings.json", serialize, (e) => {
                if(e) console.log(e)
                return resolve()
            })
        })
    }

    async AddCityResources(id, res)
    {
        let resources = await CityResources.findOne({where: {id: id}})
        this.cities[id].resources.money += res.money ? res.money : 0
        this.cities[id].resources.stone += res.stone ? res.stone : 0
        this.cities[id].resources.wood += res.wood ? res.wood : 0
        this.cities[id].resources.wheat += res.wheat ? res.wheat : 0
        this.cities[id].resources.iron += res.iron ? res.iron : 0
        this.cities[id].resources.copper += res.copper ? res.copper : 0
        this.cities[id].resources.silver += res.silver ? res.silver : 0
        this.cities[id].resources.diamond += res.diamond ? res.diamond : 0
        resources.set({
            money: this.cities[id].resources.money,
            stone: this.cities[id].resources.stone,
            wood: this.cities[id].resources.wood,
            wheat: this.cities[id].resources.wheat,
            iron: this.cities[id].resources.iron,
            copper: this.cities[id].resources.copper,
            silver: this.cities[id].resources.silver,
            diamond: this.cities[id].resources.diamond
        })
        await resources.save()
    }

    async AddCountryResources(id, res)
    {
        let resources = await CountryResources.findOne({where: {id: id}})
        this.countries[id].resources.money += res.money ? res.money : 0
        this.countries[id].resources.stone += res.stone ? res.stone : 0
        this.countries[id].resources.wood += res.wood ? res.wood : 0
        this.countries[id].resources.wheat += res.wheat ? res.wheat : 0
        this.countries[id].resources.iron += res.iron ? res.iron : 0
        this.countries[id].resources.copper += res.copper ? res.copper : 0
        this.countries[id].resources.silver += res.silver ? res.silver : 0
        this.countries[id].resources.diamond += res.diamond ? res.diamond : 0
        resources.set({
            money: this.countries[id].resources.money,
            stone: this.countries[id].resources.stone,
            wood: this.countries[id].resources.wood,
            wheat: this.countries[id].resources.wheat,
            iron: this.countries[id].resources.iron,
            copper: this.countries[id].resources.copper,
            silver: this.countries[id].resources.silver,
            diamond: this.countries[id].resources.diamond
        })
        await resources.save()
    }

    async AddPlayerResources(id, res)
    {
        let resources = await PlayerResources.findOne({where: {id: id}})
        this.users[id].money += res.money ? res.money : 0
        this.users[id].stone += res.stone ? res.stone : 0
        this.users[id].wood += res.wood ? res.wood : 0
        this.users[id].wheat += res.wheat ? res.wheat : 0
        this.users[id].iron += res.iron ? res.iron : 0
        this.users[id].copper += res.copper ? res.copper : 0
        this.users[id].silver += res.silver ? res.silver : 0
        this.users[id].diamond += res.diamond ? res.diamond : 0
        resources.set({
            money: this.users[id].money,
            stone: this.users[id].stone,
            wood: this.users[id].wood,
            wheat: this.users[id].wheat,
            iron: this.users[id].iron,
            copper: this.users[id].copper,
            silver: this.users[id].silver,
            diamond: this.users[id].diamond
        })
        await resources.save()
    }
}

module.exports = new CacheData()