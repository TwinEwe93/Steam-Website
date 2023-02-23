async function SteamAPICallInsert (ID) {
    var all = await Promise.all([APICallGame_Data(), APICallSteam(ID)])
    var GameData = all[0];
    var SteamGame = all[1];

    if (SteamGame === 'False Error') {
        return "Invalid ID"
    }

    if (SteamGame === []) {
        setTimeout(() => {
            SteamAPICallInsert(ID);
        }, 60000);
    }
    for (each in GameData) {
        if (GameData[each].App_ID === parseInt(ID)) {
            return "Already in database"; 
        }
    }
    if (SteamGame.price_overview === undefined) {
        var json = {
            App_ID: ID,
            Game_Name: SteamGame.name,
            Description: SteamGame.short_description,
            Price: 0,
            IMG_Link: SteamGame.header_image,
            Steam_Link: `https://store.steampowered.com/app/${ID}/`,
            Coming_Soon: 1,
            Developer: StrEach(SteamGame.developers),
            Publisher: StrEach(SteamGame.publishers),
            Achievements: 0,
            Max_Discount_Price: 0,
            Max_Discount_Percent: 0
        }
    }
    else {
        var json = {
        App_ID: ID,
        Game_Name: SteamGame.name,
        Description: SteamGame.short_description,
        Price: Price_Setting(SteamGame.price_overview.initial.toString()),
        IMG_Link: SteamGame.header_image,
        Steam_Link: `https://store.steampowered.com/app/${ID}/`,
        Coming_Soon: 0,
        Release_Date: DateFormat(SteamGame.release_date.date),
        Developer: StrEach(SteamGame.developers),
        Publisher: StrEach(SteamGame.publishers),
        Achievements: Achievements(SteamGame.Achievements),
        Max_Discount_Price: Price_Setting(SteamGame.price_overview.final.toString()),
        Max_Discount_Percent: SteamGame.price_overview.discount_percent
        }
    
    }
    return await APICallGame_DataPost (json);
}

async function Update_Daily_Sales () {
    var Calls = await Promise.all([APICallGame_Data(), APICallDiscountDate()])
    Game_Data = Calls[0];
    Discounts = Calls[1];
    $.each(Game_Data, async (num) => {
        var Steam_Game = await APICallSteam(Game_Data[num].App_ID)
        while (Steam_Game === null) {
            settimeout(async () => {
                Steam_Game = await APICallSteam(Game_Data[num].App_ID)
            }, 5000);
        }
        console.log(Game_Data[num].App_ID)
        if (Steam_Game.release_date.coming_soon === false) {
        }
    })
}

function Price_Setting (Price) {
    var Price_Edited
    switch (Price.length) {
        //$x.xx
        case 3: 
            Price_Edited = Price.slice(0,1) + "." + Price.slice(1, 3);
            break;
        //$xx.xx
        case 4:
            Price_Edited = Price.slice(0,2) + "." + Price.slice(2, 4);
            break;
        //$xxx.xx
        case 4:
            Price_Edited = Price.slice(0,3) + "." + Price.slice(3, 5);
            break;
    }
    return Price_Edited
}

async function APICallGame_Data () {
    var Data;
    await $.get("/API/Game_Data", (response) => { 
        Data = response.data; 
    });
    return Data
}

async function APICallDiscountDate () {
    var Data;
    await $.get("/API/Discounts-Date", (response) => { 
        Data = response.data; 
    });
    return Data
}

async function APICallSteam (ID) {
    var Data;
    await $.get(`/API/Steam-Game/${ID}`, (response) => { 
        Data = response; 
    });
    return Data
}

function DateFormat (Date) {
    var NewDate;

    if (Date.includes(",") && Date.includes("!") === false) {
        Comma = Date.indexOf(',')
        if (Date.includes("Jan") || Date.includes("January"))           NewDate = Date.slice(Comma + 2) + '-01-'
        else if (Date.includes("Feb") || Date.includes("February"))     NewDate = Date.slice(Comma + 2) + '-02-'
        else if (Date.includes("Mar") || Date.includes("March"))        NewDate = Date.slice(Comma + 2) + '-03-'
        else if (Date.includes("Apr") || Date.includes("April"))        NewDate = Date.slice(Comma + 2) + '-04-'
        else if (Date.includes("May"))                                  NewDate = Date.slice(Comma + 2) + '-05-'
        else if (Date.includes("Jun") || Date.includes("June"))         NewDate = Date.slice(Comma + 2) + '-06-'
        else if (Date.includes("Jul") || Date.includes("July"))         NewDate = Date.slice(Comma + 2) + '-07-'
        else if (Date.includes("Aug") || Date.includes("August"))       NewDate = Date.slice(Comma + 2) + '-08-'
        else if (Date.includes("Sep") || Date.includes("September"))    NewDate = Date.slice(Comma + 2) + '-09-'
        else if (Date.includes("Oct") || Date.includes("October"))      NewDate = Date.slice(Comma + 2) + '-10-'
        else if (Date.includes("Nov") || Date.includes("November"))     NewDate = Date.slice(Comma + 2) + '-11-'
        else if (Date.includes("Dec") || Date.includes("December"))     NewDate = Date.slice(Comma + 2) + '-12-'
        if (Date[Comma - 2] != " ") NewDate = NewDate + Date.slice(Comma - 2, Comma)
        else NewDate = NewDate + Date.slice(Comma - 1)
    }
    else if (Date.includes("Jan") || Date.includes("January") || Date.includes("Feb") || Date.includes("February") || Date.includes("Mar") || Date.includes("March") ||
             Date.includes("Apr") || Date.includes("April") || Date.includes("May") || Date.includes("Jun") || Date.includes("June") || Date.includes("Jul") || Date.includes("July") ||
             Date.includes("Aug") || Date.includes("August") || Date.includes("Sep") || Date.includes("September") || Date.includes("Oct") || Date.includes("October") || Date.includes("Nov") || 
             Date.includes("November") || Date.includes("Dec") || Date.includes("December")) {
        Year = 1990
        while (Date.includes(Year.toString())){
            Year = Year + 1
            if (Year == 2100) break
        }
        if (Date.includes("Jan") || Date.includes("January"))           Month = '01'
        else if (Date.includes("Feb") || Date.includes("February"))     Month = '02'
        else if (Date.includes("Mar") || Date.includes("March"))        Month = '03'
        else if (Date.includes("Apr") || Date.includes("April"))        Month = '04'
        else if (Date.includes("May"))                                  Month = '05'
        else if (Date.includes("Jun") || Date.includes("June"))         Month = '06'
        else if (Date.includes("Jul") || Date.includes("July"))         Month = '07'
        else if (Date.includes("Aug") || Date.includes("August"))       Month = '08'
        else if (Date.includes("Sep") || Date.includes("September"))    Month = '09'
        else if (Date.includes("Oct") || Date.includes("October"))      Month = '10'
        else if (Date.includes("Nov") || Date.includes("November"))     Month = '11'
        else if (Date.includes("Dec") || Date.includes("December"))     Month = '12'
        NewDate = Year.toString() + "-" + Month + "-01"
    }
    else if (Date.includes("Coming") || Date.includes("Soon") || Date.includes("TBA") || Date.includes("Announced") || Date.includes("To be") || Date.includes("To Be")) {
        NewDate = "2100-12-31"
    }
    else {
        Year = 1990
        while (Date.includes(Year,toString())){
            Year = Year + 1
            if (Year == 2100){
                Year = 2022
                break
            }
        }
        NewDate = Year.toString() + "-12-31"
    }
    return NewDate
}

function Achievements (Ach) {
    if (Ach === undefined) return 0
    else return Ach.total
}

function StrEach (Array) {
    var Str = "";
    for (x in Array) {
        Str += Array[x];
        if (parseInt(x) !== Array.length - 1) {
            Str += ", "
        }
    }
    return Str
}

async function APICallGame_DataPost (json) {
    var Data;
    await $.post(`/API/Game_Data`, json, (response) => {
        Data = response;
    });
    return Data
}