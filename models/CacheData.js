const {Player, Country, City, CityResources, CountryResources, PlayerResources, OfficialInfo, Buildings, PlayerStatus} = require("../database/Models")
const fs = require("fs")
const Building = require("../models/Building")
const CityObject = require("../models/City")
const CountryObject = require("../models/Country")
const active = require("../files/active.json");

class CacheData
{
    constructor()
    {
        this.owner = null            //Владелец
        this.projectHead = null      //Глава проекта
        this.supports = {}           //Тех-поддержка
        this.administrators = {}     //Администраторы
        this.gameMasters = {}        //ГМы
        this.moderators = {}         //Модераторы

        this.users = {}              //Кэш пользователей
        this.cities = []             //Список городов
        this.countries = []          //Список государств
        this.buildings = {}          // и т.д., я устал писать, слишком много пробелов
        this.officials = {}
        this.variables = null
        this.activity = {}
        this.uncultured = {}
        this.stickermans = {}
        this.musicLovers = {}
        this.countryChats = {}
        this.countriesWeekActive = {}
        this.stall = []

        this.accessKey = this.GenerateString(8)
        this.StartLoop()
    }

    StartLoop()
    {
        setInterval(() => {
            this.accessKey = this.GenerateString(8)
        }, 21600000)
    }

    GenerateString(length)
    {
        const lib = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let request = ""
        for(let i = 0; i < length; i++)
        {
            request += lib[Math.round(Math.random() * (lib.length - 1))]
        }
        return request
    }

    async PlayersAreNearby(firID, secID)
    {
        let firstLocation = null
        let secondLocation = null
        if(this.users[firID])
        {
            firstLocation = parseInt(this.users[firID].location)
        }
        else
        {
            const fUser = await PlayerStatus.findOne({where: {id: firID}})
            if(!fUser) return false
            firstLocation = parseInt(fUser.dataValues.location)
        }
        if(this.users[secID])
        {
            secondLocation = parseInt(this.users[secID].location)
        }
        else
        {
            const sUser = await PlayerStatus.findOne({where: {id: secID}})
            if(!sUser) return false
            secondLocation = parseInt(sUser.dataValues.location)
        }
        return firstLocation === secondLocation
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

    GetCountryCities(countryID)
    {
        const cities = []
        this.cities.forEach((key) => {
            if(key)
            {
                if(key.countryID === countryID)
                {
                    cities.push(key)
                }
            }
        })
        return cities
    }

    GetCityForCountryButtons(countryID)
    {
        const buttons = []
        this.cities.forEach((key) => {
            if(key)
            {
                if(key.countryID === countryID)
                {
                    buttons.push([key.name, "ID" + key.id])
                }
            }
        })
        return buttons
    }

    GetCityButtons()
    {
        const buttons = []
        for(const city of this.cities)
        {
            if(city)
            {
                buttons.push([city.name, "ID" + city.id])
            }
        }
        return buttons
    }

    async GetUserStatus(id)
    {
        for(let i = 0; i < this.countries; i++)
        {
            if(this.countries[i]?.leaderID === id)
            {
                return "leader"
            }
        }
        for(const key of Object.keys(this.officials))
        {
            if(this.officials[key])
            {
                for(const j of Object.keys(this.officials[key]))
                {
                    if(parseInt(j) === id)
                    {
                        return "official"
                    }
                }
            }
        }
        const status = await PlayerStatus.findOne({where: {id: id}})
        if(status?.dataValues.citizenship)
        {
            return "citizen"
        }
        return "stateless"
    }

    GetCity(id)
    {
        return this.cities[id]
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
        return this.countries[this.cities[id]?.countryID]
    }

    ParseButtonID(id)
    {
        return parseInt(id.replace("ID", ""))
    }

    GiveAdminList()
    {
        let request = ""
        if (this.owner) request += `*id${this.owner.id}(${this.owner.nick})\n`
        if (this.projectHead) request += `*id${this.projectHead.id}(${this.projectHead.nick})\n`
        if(Object.keys(this.supports).length !== 0)
        {
            for (const key of Object.keys(this.supports))
            {
                request += `*id${this.supports[key].id}(${this.supports[key].nick})\n`
            }
        }
        if(Object.keys(this.administrators).length !== 0)
        {
            for (const key of Object.keys(this.administrators))
            {
                request += `*id${this.administrators[key].id}(${this.administrators[key].nick})\n`
            }
        }
        return request
    }

    async LoadWorkers ()
    {
        //Очистка
        this.owner = null
        this.projectHead = null
        this.supports = {}
        this.administrators = {}
        this.gameMasters = {}
        this.moderators = {}

        //Загрузка с базы данных
        return new Promise(async (resolve) => {
            const owner = await Player.findOne({where: {role: "owner"}})
            this.owner = owner?.dataValues
            const projectHead = await Player.findOne({where: {role: "project_head"}})
            this.projectHead = projectHead?.dataValues
            const supports = await Player.findAll({where: {role: "support"}})
            supports.forEach(key => {
                this.supports[key.dataValues.id] = key.dataValues
            })
            const administrators = await Player.findAll({where: {role: "admin"}})
            administrators.forEach(key => {
                this.administrators[key.dataValues.id] = key.dataValues
            })
            const gameMasters = await Player.findAll({where: {role: "GM"}})
            gameMasters.forEach(key => {
                this.gameMasters[key.dataValues.id] = key.dataValues
            })
            const moderators = await Player.findAll({where: {role: "moder"}})
            moderators.forEach(key => {
                this.moderators[key.dataValues.id] = key.dataValues
            })
            return resolve()
        })
    }

    async LoadCountries()
    {
        this.countries = []
        return new Promise(async (resolve) => {
            const countries = await Country.findAll()
            let temp
            for (const key of countries)
            {
                if(key)
                {
                    let res = await CountryResources.findOne({where: {id: key.dataValues.id}})
                    this.countries[key.dataValues.id] = new CountryObject(key, res)
                    if(key.dataValues.chatID)
                    {
                        temp = key.dataValues.chatID.split("|")
                        for(const chat of temp)
                        {
                            this.countryChats[chat] = this.countries[key.dataValues.id]
                        }
                    }
                }
            }
            fs.access("./files/active.json", (error) => {
                if(error)
                {
                    this.SaveActive()
                }
                else
                {
                    const active = require("../files/active.json")
                    for(const country of this.countries)
                    {
                        if(country)
                        {
                            country.active = active[country.id] ? active[country.id] : 0
                            this.countriesWeekActive[country.id] = active["week_" + country.id] ? active["week_" + country.id] : 0
                        }
                    }
                }
            })
            return resolve()
        })
    }

    async ResetCountries()
    {
        return new Promise(async (resolve) => {
            const countries = await CountryResources.findAll()
            let temp
            for (const key of countries)
            {
                if(this.countries[key.id])
                {
                    this.countries[key.id].money = key.dataValues.money
                    this.countries[key.id].stone = key.dataValues.stone
                    this.countries[key.id].wood = key.dataValues.wood
                    this.countries[key.id].wheat = key.dataValues.wheat
                    this.countries[key.id].iron = key.dataValues.iron
                    this.countries[key.id].copper = key.dataValues.copper
                    this.countries[key.id].silver = key.dataValues.silver
                    this.countries[key.id].diamond = key.dataValues.diamond
                }
                else
                {
                    let country = await Country.findOne({where: {id: key.dataValues.id}})
                    this.countries[key.dataValues.id] = new CountryObject(key, country)
                    if(key.dataValues.chatID)
                    {
                        temp = key.dataValues.chatID.split("|")
                        for(const chat of temp)
                        {
                            this.countryChats[chat] = this.countries[key.dataValues.id]
                        }
                    }
                }
            }
            return resolve()
        })
    }

    async SaveActive()
    {
        return new Promise((resolve) => {
            let active = {}
            for(const country of this.countries)
            {
                if(country)
                {
                    active[country.id] = country.active
                }
            }
            for(const country of this.countries)
            {
                if(country)
                {
                    active["week_" + country.id] = this.countriesWeekActive[country.id] ? this.countriesWeekActive[country.id] : 0
                }
            }
            const serialize = JSON.stringify(active, null, "\t")
            fs.writeFile("./files/active.json", serialize, (e) => {
                if(e) console.log(e)
                return resolve()
            })
        })
    }

    async LoadOfficials()
    {
        this.officials = {}
        return new Promise(async (resolve) => {
            const officials = await OfficialInfo.findAll()
            for(let i = 0; i < officials.length; i++)
            {
                if(!this.officials[officials[i].dataValues.countryID]) this.officials[officials[i].dataValues.countryID] = {}
                this.officials[officials[i].dataValues.countryID][officials[i].dataValues.id] = officials[i].dataValues
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
                    let res = await CityResources.findOne({where: {id: key.dataValues.id}})
                    this.cities[key.dataValues.id] = new CityObject(key, res)
                }
            }
            return resolve()
        })
    }

    async ResetCities()
    {
        return new Promise(async (resolve) => {
            const cities = await CityResources.findAll()
            for (const key of cities)
            {
                if(this.cities[key.id])
                {
                    this.cities[key.id].money = key.dataValues.money
                    this.cities[key.id].stone = key.dataValues.stone
                    this.cities[key.id].wood = key.dataValues.wood
                    this.cities[key.id].wheat = key.dataValues.wheat
                    this.cities[key.id].iron = key.dataValues.iron
                    this.cities[key.id].copper = key.dataValues.copper
                    this.cities[key.id].silver = key.dataValues.silver
                    this.cities[key.id].diamond = key.dataValues.diamond
                }
                else
                {
                    let city = await City.findOne({where: {id: key.dataValues.id}})
                    this.cities[key.dataValues.id] = new CityObject(city, key)
                }
            }
            return resolve()
        })
    }

    async LoadBuildings()
    {
        this.buildings = {}
        return new Promise(async (resolve) =>
        {
            const buildings = await Buildings.findAll()
            for(let i = 0; i < buildings.length; i++)
            {
                if(!buildings[i].dataValues.freezing)
                {
                    if(this.buildings[buildings[i].dataValues.cityID])
                    {
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
                    else
                    {
                        this.buildings[buildings[i].dataValues.cityID] = []
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
                }

            }
            return resolve()
        })
    }

    async ResetBuildings()
    {
        return new Promise(async (resolve) =>
        {
            const buildings = await Buildings.findAll()
            for(let i = 0; i < buildings.length; i++)
            {
                if(this.buildings[buildings[i].dataValues.cityID])
                {
                    let flag = false
                    for(const building of this.buildings[buildings[i].dataValues.cityID])
                    {
                        if(building.id === buildings[i].dataValues.id)
                        {
                            flag = true
                            break
                        }
                    }
                    if(flag) continue
                }
                if(!buildings[i].dataValues.freezing)
                {
                    if(this.buildings[buildings[i].dataValues.cityID])
                    {
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
                    else
                    {
                        this.buildings[buildings[i].dataValues.cityID] = []
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
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
            const serialize = JSON.stringify(this.variables, null, "\t")
            fs.writeFile("./files/settings.json", serialize, (e) => {
                if(e) console.log(e)
                return resolve()
            })
        })
    }

    async AddCityResources(id, res)
    {
        let resources = await CityResources.findOne({where: {id: id}})
        this.cities[id].money += res.money ? res.money : 0
        this.cities[id].stone += res.stone ? res.stone : 0
        this.cities[id].wood += res.wood ? res.wood : 0
        this.cities[id].wheat += res.wheat ? res.wheat : 0
        this.cities[id].iron += res.iron ? res.iron : 0
        this.cities[id].copper += res.copper ? res.copper : 0
        this.cities[id].silver += res.silver ? res.silver : 0
        this.cities[id].diamond += res.diamond ? res.diamond : 0
        resources.set({
            money: this.cities[id].money,
            stone: this.cities[id].stone,
            wood: this.cities[id].wood,
            wheat: this.cities[id].wheat,
            iron: this.cities[id].iron,
            copper: this.cities[id].copper,
            silver: this.cities[id].silver,
            diamond: this.cities[id].diamond
        })
        await resources.save()
    }

    async AddCountryResources(id, res)
    {
        let resources = await CountryResources.findOne({where: {id: id}})
        this.countries[id].money += res.money ? res.money : 0
        this.countries[id].stone += res.stone ? res.stone : 0
        this.countries[id].wood += res.wood ? res.wood : 0
        this.countries[id].wheat += res.wheat ? res.wheat : 0
        this.countries[id].iron += res.iron ? res.iron : 0
        this.countries[id].copper += res.copper ? res.copper : 0
        this.countries[id].silver += res.silver ? res.silver : 0
        this.countries[id].diamond += res.diamond ? res.diamond : 0
        resources.set({
            money: this.countries[id].money,
            stone: this.countries[id].stone,
            wood: this.countries[id].wood,
            wheat: this.countries[id].wheat,
            iron: this.countries[id].iron,
            copper: this.countries[id].copper,
            silver: this.countries[id].silver,
            diamond: this.countries[id].diamond
        })
        await resources.save()
    }

    async AddPlayerResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await PlayerResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.users[id])
            {
                this.users[id][key] = resources.dataValues[key] + res[key]
            }
            obj[key] = resources.dataValues[key] + res[key]
        }
        await PlayerResources.update(obj, {where: {id: id}})
    }
}

module.exports = new CacheData()