const {Player, Country, City, CityResources, CountryResources, PlayerResources, OfficialInfo, Buildings, PlayerStatus,
    VKChats, TGChats, Variables
} = require("../database/Models")
const Building = require("../models/Building")
const CityObject = require("../models/City")
const CountryObject = require("../models/Country")
const VKChat = require('../models/VKChat')
const TGChat = require('../models/TGChat')
const ChatGPTModes = require("../variables/BotCallModes");

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

        this.lastReload = new Date()

        this.users = {}              //Кэш пользователей
        this.TGusers = {}
        this.VKChats = {}
        this.TGChats = {}
        this.cities = []             //Кэш городов
        this.countries = []          //Кэш государств
        this.buildings = {}          // и т.д., я устал писать, слишком много пробелов
        this.officials = {}
        this.variables = null

        this.active = 0
        this.activity = {}
        this.uncultured = {}
        this.stickermans = {}
        this.musicLovers = {}
        this.countryChats = {}
        this.TGcountryChats = {}
        this.countriesWeekPassiveScore = {}
        this.TGcodes = {}
        this.longTimeouts = {}

        this.countryResourcesStats = {}

        this.samples = {}
        this.requests = {}
        this.censorship = {}
        this.mute = {}
        this.activeIgnore = {}
        this.floodBase = {}
        this.ignore = {}
        this.botCallTimeouts = {}
        this.botCallModes = {}

        this.timeouts = {}
        this.onLoad = () => {}

        this.accessKey = ""
        this.ChangeCode()
        this.StartLoop()
    }

    ChangeCode()
    {
        this.accessKey = this.GenerateString(8)
    }

    StartLoop()
    {
        setInterval(() => {
            this.ChangeCode()
        }, 21600000)
    }

    GenerateString(length)
    {
        const lib = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let request = ""
        for(let i = 0; i < length; i++)
        {
            request += lib[Math.round(Math.random() * (lib.length - 1))]
        }
        return request
    }

    NewUserMessage(id, text)
    {
        text = text || ""
        if(text.length < 8 || (text.split(" ").length === 1 && text.length < 6))
        {
            if(!this.floodBase[id]) this.floodBase[id] = []
            const time = new Date()
            const now = new Date()
            time.setSeconds(time.getSeconds() + 20)
            this.floodBase[id].push(time)
            this.floodBase[id] = this.floodBase[id].filter(key => {return (key - now) > 0})
            if(this.floodBase[id].length >= 5)
            {
                delete this.floodBase[id]
                this.activeIgnore[id] = setTimeout(() => {
                    delete this.activeIgnore[id]
                }, 60000)
            }
        }
    }

    GetCountryButtons(ignoreId)
    {
        const buttons = []
        this.countries.forEach((key) => {
            if(key && key?.id !== ignoreId)
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

    async LoadVKChats()
    {
        return new Promise(async (resolve) =>
        {
            this.VKChats = {}
            const chats = await VKChats.findAll()
            for(const chat of chats)
            {
                this.VKChats[chat.dataValues.id] = new VKChat(chat)
                if(chat.dataValues.botMode)
                {
                    for(const mode of Object.keys(ChatGPTModes))
                    {
                        if(ChatGPTModes[mode].id === parseInt(chat.dataValues.botMode))
                        {
                            this.botCallModes[chat.dataValues.id] = ChatGPTModes[mode]
                            break
                        }
                    }
                }
            }
            return resolve()
        })
    }

    async LoadTGChats()
    {
        return new Promise(async (resolve) =>
        {
            this.TGChats = {}
            const chats = await TGChats.findAll()
            for(const chat of chats)
            {
                this.TGChats[chat.dataValues.peerID] = new TGChat(chat)
            }
            return resolve()
        })
    }

    async SaveVKChat(id)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let muteList = []
                let antiMuteList = []
                for(const i of Object.keys(this.VKChats[id].muteList))
                {
                    muteList.push({
                        id: i,
                        moderID: this.VKChats[id].muteList[i].moderID,
                        endTime: this.VKChats[id].muteList[i].endTime
                    })
                }
                for(const i of Object.keys(this.VKChats[id].antiMuteList))
                {
                    antiMuteList.push({
                        id: i,
                        moderID: this.VKChats[id].antiMuteList[i].moderID,
                        name: this.VKChats[id].antiMuteList[i].name
                    })
                }
                await VKChats.update
                (
                    {
                        botMode: this.botCallModes[id] ? this.botCallModes[id].id : null,
                        muteList: JSON.stringify(muteList),
                        antiMuteList: JSON.stringify(antiMuteList),
                        deleteMessages: this.VKChats[id] ? this.VKChats[id].clean : true,
                        rolePlay: this.VKChats[id] ? this.VKChats[id].RP : false,
                        hide: this.VKChats[id] ? this.VKChats[id].hide : false
                    },
                    {
                        where: {id: id}
                    }
                )
            }
            catch (e) {}
            return resolve()
        })
    }

    async SaveTGChat(id)
    {
        return new Promise(async (resolve) =>
        {
            try
            {
                let muteList = []
                for(const i of Object.keys(this.TGChats[id].muteList))
                {
                    muteList.push({
                        id: i,
                        moderID: this.TGChats[id].muteList[i].moderID,
                        endTime: this.TGChats[id].muteList[i].endTime
                    })
                }
                await TGChats.update
                (
                    {
                        muteList: JSON.stringify(muteList),
                        deleteMessages: this.VKChats[id] ? this.VKChats[id].clean : true
                    },
                    {
                        where: {peerID: id}
                    }
                )
            }
            catch (e) {}
            return resolve()
        })
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

    async ReloadChats()
    {
        this.countryChats = {}
        this.TGcountryChats = {}
        return new Promise(async (resolve) => {
            let temp = null
            for(const key of this.countries)
            {
                if(key)
                {
                    if(key.chatID)
                    {
                        temp = key.chatID.split("|")
                        for(const chat of temp)
                        {
                            this.countryChats[chat] = key.id
                        }
                    }
                    if(key.TGchatID)
                    {
                        temp = key.TGchatID.split("|")
                        for(const chat of temp)
                        {
                            this.TGcountryChats[chat] = key.id
                        }
                    }
                }
            }
            return resolve()
        })
    }

    async LoadCountries()
    {
        this.countries = []
        this.countryResourcesStats = {}
        return new Promise(async (resolve) => {
            const countries = await Country.findAll()
            for (const key of countries)
            {
                if(key)
                {
                    let res = await CountryResources.findOne({where: {id: key.dataValues.id}})
                    this.countries[key.dataValues.id] = new CountryObject(key, res)
                }
            }
            let active = await this.LoadVariable("countryActive")
            if(!active)
            {
                await this.UpdateVariable("countryActive", {})
                active = {}
            }
            this.active = active["total"] ? active["total"] : 0
            for(const country of this.countries)
            {
                if(country)
                {
                    country.active = active[country.id] ? active[country.id] : 0
                    this.countriesWeekPassiveScore[country.id] = active.passiveScore ? active.passiveScore[country.id] ? active.passiveScore[country.id] : 0 : 0
                    if(active.resourcesStats)
                    {
                        if(active.resourcesStats[country.id])
                        {
                            this.countryResourcesStats[country.id] = {
                                in: {
                                    money: active.resourcesStats[country.id]["in"]["money"] ? active.resourcesStats[country.id]["in"]["money"] : 0,
                                    stone: active.resourcesStats[country.id]["in"]["stone"] ? active.resourcesStats[country.id]["in"]["stone"] : 0,
                                    wood: active.resourcesStats[country.id]["in"]["wood"] ? active.resourcesStats[country.id]["in"]["wood"] : 0,
                                    wheat: active.resourcesStats[country.id]["in"]["wheat"] ? active.resourcesStats[country.id]["in"]["wheat"] : 0,
                                    iron: active.resourcesStats[country.id]["in"]["iron"] ? active.resourcesStats[country.id]["in"]["iron"] : 0,
                                    silver: active.resourcesStats[country.id]["in"]["silver"] ? active.resourcesStats[country.id]["in"]["silver"] : 0,
                                    diamond: active.resourcesStats[country.id]["in"]["diamond"] ? active.resourcesStats[country.id]["in"]["diamond"] : 0
                                },
                                out: {
                                    money: active.resourcesStats[country.id]["out"]["money"] ? active.resourcesStats[country.id]["out"]["money"] : 0,
                                    stone: active.resourcesStats[country.id]["out"]["stone"] ? active.resourcesStats[country.id]["out"]["stone"] : 0,
                                    wood: active.resourcesStats[country.id]["out"]["wood"] ? active.resourcesStats[country.id]["out"]["wood"] : 0,
                                    wheat: active.resourcesStats[country.id]["out"]["wheat"] ? active.resourcesStats[country.id]["out"]["wheat"] : 0,
                                    iron: active.resourcesStats[country.id]["out"]["iron"] ? active.resourcesStats[country.id]["out"]["iron"] : 0,
                                    silver: active.resourcesStats[country.id]["out"]["silver"] ? active.resourcesStats[country.id]["out"]["silver"] : 0,
                                    diamond: active.resourcesStats[country.id]["out"]["diamond"] ? active.resourcesStats[country.id]["out"]["diamond"] : 0
                                }
                            }
                        }
                    }
                }
            }
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
                            this.countryChats[chat] = key.dataValues.id
                        }
                    }
                    if(key.dataValues.TGchatID)
                    {
                        temp = key.dataValues.TGchatID.split("|")
                        for(const chat of temp)
                        {
                            this.TGcountryChats[chat] = this.countries[key.dataValues.id]
                        }
                    }
                }
            }
            return resolve()
        })
    }

    async SaveActive()
    {
        return new Promise(async (resolve) =>
        {
            let active = {
                total: this.active,
                passiveScore: {},
                resourcesStats: {}
            }
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
                    active.passiveScore[country.id] = this.countriesWeekPassiveScore[country.id] ? this.countriesWeekPassiveScore[country.id] : 0
                }
            }
            for(const country of this.countries)
            {
                if(country)
                {
                    active.resourcesStats[country.id] = this.countryResourcesStats[country.id] ? this.countryResourcesStats[country.id] : {
                        in: {
                            money: 0,
                            stone: 0,
                            wood: 0,
                            wheat: 0,
                            iron: 0,
                            silver: 0,
                            diamond: 0
                        },
                        out: {
                            money: 0,
                            stone: 0,
                            wood: 0,
                            wheat: 0,
                            iron: 0,
                            silver: 0,
                            diamond: 0
                        }
                    }
                }
            }
            await this.UpdateVariable("countryActive", active)
            return resolve()
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
        return new Promise(async (resolve) =>
        {
            this.variables = {}
            const parseValue = (value, type) =>
            {
                switch (type)
                {
                    case "object":
                        return JSON.parse(value)
                    case "bool":
                        return value === "true"
                    case "int":
                        return parseInt(value)
                    case "float":
                        return parseFloat(value)
                    default:
                        return value
                }
            }
            const vars = await Variables.findAll({where: {isGlobal: true}})
            for(const i of vars)
            {
                this.variables[i.dataValues.name] = parseValue(i.dataValues.json, i.dataValues.type)
            }
            return resolve()
        })
    }

    async SaveVariables()
    {
        return new Promise(async (resolve) =>
        {
            const getValue = (key) =>
            {
                switch (typeof this.variables[key])
                {
                    case "number":
                        if(this.variables[key] % 1 === 0) return [this.variables[key].toString(), "int"]
                        else return [this.variables[key].toString(), "float"]
                    case "string":
                        return [this.variables[key], "string"]
                    case "boolean":
                        return [this.variables[key], "bool"]
                    default:
                        return [JSON.stringify(this.variables[key]), typeof this.variables[key]]
                }
            }
            for(const i of Object.keys(this.variables))
            {
                const variable = await Variables.findOne({where: {name: i}})
                const values = getValue(i)
                if(variable)
                {
                    await Variables.update({json: values[0]}, {where: {name: i}})
                }
                else
                {
                    await Variables.create({name: i, type: values[1], json: values[0]})
                }
            }
            return resolve()
        })
    }

    async UpdateVariable(name, value)
    {
        const getType = () =>
        {
            switch (typeof value)
            {
                case "number":
                    if(value % 1 === 0) return [value.toString(), "int"]
                    else return [value.toString(), "float"]
                case "string":
                    return [value, "string"]
                case "boolean":
                    return [value, "bool"]
                default:
                    return [JSON.stringify(value), typeof value]
            }
        }
        const json = getType(value)
        const variable = await Variables.findOrCreate({
            where: {name: name},
            defaults: {name: name, type: json[1], json: json[0], isGlobal: false}
        })
        variable[0].set({name: name, type: json[1], json: json[0]})
        await variable[0].save()
    }

    async LoadVariable(name)
    {
        const variable = await Variables.findOne({where: {name: name}})
        if(!variable) return null
        switch (variable.dataValues.type)
        {
            case "object":
                return JSON.parse(variable.dataValues.json)
            case "bool":
                return variable.dataValues.json === "true"
            case "int":
                return parseInt(variable.dataValues.json)
            case "float":
                return parseFloat(variable.dataValues.json)
            default:
                return variable.dataValues.json
        }
    }

    async AddCityResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await CityResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.cities[id])
            {
                this.cities[id][key] = resources.dataValues[key] + res[key]
            }
            obj[key] = Math.max(resources.dataValues[key] + res[key], 0)
        }
        await CityResources.update(obj, {where: {id: id}})
    }

    async AddCountryResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await CountryResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.countries[id])
            {
                this.countries[id][key] = resources.dataValues[key] + res[key]
            }
            if(this.countryResourcesStats[id])
            {
                if(res[key] >= 0)
                {
                    this.countryResourcesStats[id]["in"][key] += res[key]
                }
                else
                {
                    this.countryResourcesStats[id]["out"][key] -= res[key]
                }
            }
            obj[key] = Math.max(resources.dataValues[key] + res[key], 0)
        }
        await CountryResources.update(obj, {where: {id: id}})
    }

    async AddCountryGold(id, count)
    {
        if(!id || !count) throw new Error("ID or Resources is not exist")
        this.countries[id].gold += count
        await Country.update({gold: this.countries[id].gold}, {where: {id: id}})
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
            obj[key] = Math.max(resources.dataValues[key] + res[key], 0)
        }
        await PlayerResources.update(obj, {where: {id: id}})
    }
}

module.exports = new CacheData()