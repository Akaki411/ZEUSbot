const Data = require("./CacheData")
const NameLibrary = require("../variables/NameLibrary")
const {CountryActive} = require("../database/Models");
const sequelize = require("../database/DataBase");
class Active
{
    async GetDateActive(command, platform, isIOS)
    {
        let active = {
            time: "date",
            platform: platform,
            total: false,
            allCountries: true,
            items: []
        }
        let date = command.match(/\d+[.,:]\d+[.,:]\d+/)
        if(!date) date = command.match(/\d+[.,:]\d+/)
        const now = new Date(date)
        if(isNaN(now))
        {
            return "❗ Не верная дата"
        }
        now.setDate(now.getDate() - 1)
        now.setHours(12)
        now.setMinutes(0)
        now.setSeconds(0)
        now.setMilliseconds(0)
        date = await CountryActive.findOne({where: {date: now}})
        date = date ? JSON.parse(date.dataValues.json) : []
        let temp, country
        for(const key of Data.countries)
        {
            if(key?.tags)
            {
                temp = new RegExp(key.tags)
                if(command.match(temp))
                {
                    country = key
                    break
                }
            }
        }
        if(country)
        {
            active.total = false
            active.allCountries = false
            let total = 0
            try
            {
                for(const ctr of date)
                {
                    if(ctr.id === country.id) total += ctr.a
                }
            }
            catch (e) {}
            active.items.push({
                id: country.id,
                name: platform === "TG" ? country.name : country.GetName(isIOS),
                today: total,
                rating: country.rating
            })
        }
        else
        {
            let countries = {}
            for(const ctr of date)
            {
                if(!countries[ctr.id])
                {
                    countries[ctr.id] = {
                        id: ctr.id,
                        name: isIOS ? ctr.n.match(/\((.*?)\)/)[0].replace(/[()]/gi, "") : ctr.n,
                        today: 0
                    }
                }
                countries[ctr.id].today += isNaN(parseInt(ctr.a)) ? 0 : parseInt(ctr.a)
                if(Data.countries[ctr.id]) countries[ctr.id].rating = Data.countries[ctr.id].rating
            }
            for(const key of Object.keys(countries))
            {
                active.items.push(countries[key])
            }
        }
        return await this.ConvertActive(active)
    }

    async GetMonthActive(command, platform, isIOS)
    {
        let active = {
            time: "month",
            platform: platform,
            total: false,
            allCountries: true,
            items: []
        }
        const now = new Date()
        now.setDate(now.getDate() - 1)
        now.setHours(12)
        now.setMinutes(0)
        now.setSeconds(0)
        now.setMilliseconds(0)
        let yesterday = await CountryActive.findOne({where: {date: now}})
        yesterday = yesterday ? JSON.parse(yesterday.dataValues.json) : []
        let yesterdayActive = {}
        for(const country of yesterday)
        {
            yesterdayActive[country.id] = country
        }
        let monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        monthAgo.setHours(0)
        let allActive = await sequelize.query(`SELECT * FROM "country-actives" WHERE date >= '${monthAgo.toISOString()}' AND date <= NOW();`)
        let temp, country
        for(const key of Data.countries)
        {
            if(key?.tags)
            {
                temp = new RegExp(key.tags)
                if(command.match(temp))
                {
                    country = key
                    break
                }
            }
        }
        if(country)
        {
            active.total = false
            active.allCountries = false
            let total = 0
            for(const day of allActive[0])
            {
                try
                {
                    let temp = JSON.parse(day.json)
                    for(const ctr of temp)
                    {
                        if(ctr.id === country.id) total += ctr.a
                    }
                }
                catch (e) {}
            }
            active.items.push({
                id: country.id,
                name: platform === "TG" ? country.name : country.GetName(isIOS),
                today: total + country.active,
                yesterday: yesterdayActive[country.id] ? yesterdayActive[country.id].a : "не найден",
                rating: country.rating
            })
        }
        else
        {
            let countries = {}
            for(const day of allActive[0])
            {
                try
                {
                    let temp = JSON.parse(day.json)
                    for(const ctr of temp)
                    {
                        if(!countries[ctr.id])
                        {
                            countries[ctr.id] = {
                                id: ctr.id,
                                name: isIOS ? ctr.n.match(/\((.*?)\)/)[0].replace(/[()]/gi, "") : ctr.n,
                                today: 0
                            }
                        }
                        countries[ctr.id].today += isNaN(parseInt(ctr.a)) ? 0 : parseInt(ctr.a)
                        if(yesterdayActive[ctr.id]) countries[ctr.id].yesterday = yesterdayActive[ctr.id] ? yesterdayActive[ctr.id].a : "не найден"
                        if(Data.countries[ctr.id]) countries[ctr.id].rating = Data.countries[ctr.id].rating
                    }
                }
                catch (e) {}
            }
            for(const key of Object.keys(countries))
            {
                active.items.push(countries[key])
            }
        }
        return await this.ConvertActive(active)
    }

    async GetWeekActive(command, platform, isIOS)
    {
        let active = {
            time: "week",
            platform: platform,
            total: false,
            allCountries: true,
            items: []
        }
        const now = new Date()
        now.setDate(now.getDate() - 1)
        now.setHours(12)
        now.setMinutes(0)
        now.setSeconds(0)
        now.setMilliseconds(0)
        let yesterday = await CountryActive.findOne({where: {date: now}})
        yesterday = yesterday ? JSON.parse(yesterday.dataValues.json) : []
        let yesterdayActive = {}
        for(const country of yesterday)
        {
            yesterdayActive[country.id] = country
        }
        let weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        weekAgo.setHours(0)
        let allActive = await sequelize.query(`SELECT * FROM "country-actives" WHERE date >= '${weekAgo.toISOString()}' AND date <= NOW();`)
        let temp, country
        for(const key of Data.countries)
        {
            if(key?.tags)
            {
                temp = new RegExp(key.tags)
                if(command.match(temp))
                {
                    country = key
                    break
                }
            }
        }
        if(country)
        {
            active.total = false
            active.allCountries = false
            let total = 0
            for(const day of allActive[0])
            {
                try
                {
                    let temp = JSON.parse(day.json)
                    for(const ctr of temp)
                    {
                        if(ctr.id === country.id) total += ctr.a
                    }
                }
                catch (e) {}
            }
            active.items.push({
                id: country.id,
                name: platform === "TG" ? country.name : country.GetName(isIOS),
                today: total + country.active,
                yesterday: yesterdayActive[country.id] ? yesterdayActive[country.id].a : "не найден",
                rating: country.rating
            })
        }
        else
        {
            let countries = {}
            for(const day of allActive[0])
            {
                try
                {
                    let temp = JSON.parse(day.json)
                    for(const ctr of temp)
                    {
                        if(!countries[ctr.id])
                        {
                            countries[ctr.id] = {
                                id: ctr.id,
                                name: isIOS ? ctr.n.match(/\((.*?)\)/)[0].replace(/[()]/gi, "") : ctr.n,
                                today: 0
                            }
                        }
                        countries[ctr.id].today += isNaN(parseInt(ctr.a)) ? 0 : parseInt(ctr.a)
                        if(yesterdayActive[ctr.id]) countries[ctr.id].yesterday = yesterdayActive[ctr.id] ? yesterdayActive[ctr.id].a : "не найден"
                        if(Data.countries[ctr.id]) countries[ctr.id].rating = Data.countries[ctr.id].rating
                    }
                }
                catch (e) {}
            }
            for(const key of Object.keys(countries))
            {
                active.items.push(countries[key])
            }
        }
        return await this.ConvertActive(active)
    }

    async GetTotalActive(command, platform, isIOS)
    {
        let active = {
            time: "all",
            platform: platform,
            total: false,
            allCountries: true,
            items: []
        }
        let allActive = await CountryActive.findAll()
        let temp, country
        for(const key of Data.countries)
        {
            if(key?.tags)
            {
                temp = new RegExp(key.tags)
                if(command.match(temp))
                {
                    country = key
                    break
                }
            }
        }
        if(country)
        {
            active.total = false
            active.allCountries = false
            let total = 0
            for(const day of allActive)
            {
                try
                {
                    let temp = JSON.parse(day.dataValues.json)
                    for(const ctr of temp)
                    {
                        if(ctr.id === country.id) total += ctr.a
                    }
                }
                catch (e) {}
            }
            active.items.push({
                id: country.id,
                name: platform === "TG" ? country.name : country.GetName(isIOS),
                today: total + country.active,
                rating: country.rating
            })
        }
        else
        {
            let countries = {}
            for(const day of allActive)
            {
                try
                {
                    let temp = JSON.parse(day.dataValues.json)
                    for(const ctr of temp)
                    {
                        if(!countries[ctr.id])
                        {
                            countries[ctr.id] = {
                                id: ctr.id,
                                name: isIOS ? ctr.n.match(/\((.*?)\)/)[0].replace(/[()]/gi, "") : ctr.n,
                                today: 0
                            }
                        }
                        countries[ctr.id].today += isNaN(parseInt(ctr.a)) ? 0 : parseInt(ctr.a)
                        if(Data.countries[ctr.id]) countries[ctr.id].rating = Data.countries[ctr.id].rating
                    }
                }
                catch (e) {}
            }
            for(const key of Object.keys(countries))
            {
                active.items.push(countries[key])
            }
        }
        return await this.ConvertActive(active)
    }

    async GetTodayActive(command, platform, isIOS)
    {
        let active = {
            time: "day",
            platform: platform,
            total: true,
            allCountries: true,
            items: []
        }
        const now = new Date()
        now.setDate(now.getDate() - 1)
        now.setHours(12)
        now.setMinutes(0)
        now.setSeconds(0)
        now.setMilliseconds(0)
        let yesterday = await CountryActive.findOne({where: {date: now}})
        yesterday = yesterday ? JSON.parse(yesterday.dataValues.json) : []
        let yesterdayActive = {}
        for(const country of yesterday)
        {
            yesterdayActive[country.id] = country
        }
        let temp, country
        for(const key of Data.countries)
        {
            if(key?.tags)
            {
                temp = new RegExp(key.tags)
                if(command.match(temp))
                {
                    country = key
                    break
                }
            }
        }
        if(country)
        {
            active.total = false
            active.allCountries = false
            active.items.push({
                id: country.id,
                name: platform === "TG" ? country.name : country.GetName(isIOS),
                today: country.active,
                yesterday: yesterdayActive[country.id] ? yesterdayActive[country.id].a : "не найден",
                rating: country.rating
            })
        }
        else
        {
            for(const country of Data.countries)
            {
                if(!country) continue
                active.items.push({
                    id: country.id,
                    name: platform === "TG" ? country.name : country.GetName(isIOS),
                    today: country.active,
                    yesterday: yesterdayActive[country.id] ? yesterdayActive[country.id].a : "не найден",
                    rating: country.rating
                })
            }
        }
        return await this.ConvertActive(active)
    }

    async ConvertActive(active)
    {
        try
        {
            const when = (type) =>
            {
                switch (type)
                {
                    case "day":
                        return "сегодня"
                    case "week":
                        return "неделю"
                    case "month":
                        return "месяц"
                    case "date":
                        return "указанную дату"
                    default:
                        return "все время"
                }
            }
            const isActiveToday = (countryId, count) => {return active.time === "day" && ((Data.countries[countryId]?.tested && count < Data.variables["minTestActive"]) || (!Data.countries[countryId]?.tested && count < Data.variables["minActive"])) ? "❗" : ""}
            for (let j = active.items.length - 1; j > 0; j--)
            {
                for (let i = 0; i < j; i++)
                {
                    if (active.items[i].today < active.items[i + 1].today)
                    {
                        let temp = active.items[i];
                        active.items[i] = active.items[i + 1];
                        active.items[i + 1] = temp;
                    }
                }
            }
            let request = active.items.length > 1 ? `🔰 Актив фракций за ${when(active.time)}:\n\n` : ""
            let total = 0
            for(const country of active.items)
            {
                if(country.hidden && active.items.length > 1) continue
                request += country.name + "\n"
                total += country.today
                if(active.platform === "TG")
                {
                    request += NameLibrary.ConvertTGMessage(`⚒ Актив за ${when(active.time)}: ${country.today}${isActiveToday(country.id, country.today)}\n`)
                    if(country.yesterday || country.yesterday === 0) request += NameLibrary.ConvertTGMessage(`⚒ Вчерашний актив: ${country.yesterday}\n`)
                    if(country.rating || country.rating === 0) request += NameLibrary.ConvertTGMessage(`💪 Рейтинг активности: ${country.rating}\n`)
                }
                else
                {
                    request += `⚒ Актив за ${when(active.time)}: ${country.today}${isActiveToday(country.id, country.today)}\n`
                    if(country.yesterday || country.yesterday === 0) request += `⚒ Вчерашний актив: ${country.yesterday}\n`
                    if(country.rating || country.rating === 0) request += `💪 Рейтинг активности: ${country.rating}\n`
                }
                request += "\n\n"
            }
            if(active.allCountries) request += "⚒ Общий актив фракций: " + total + "\n"
            if(active.total) request += "⚒ Общий актив проекта: " + Data.active
            return request
        }
        catch (e)
        {
            console.log(e)
            return "Ошибка: " + e.message
        }
    }
}

module.exports = new Active()