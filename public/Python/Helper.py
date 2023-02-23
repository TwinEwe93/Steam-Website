import SQL_Connector

URL = "https://store.steampowered.com/api/appdetails?appids="
URL2 = "&cc=US"
cursor = SQL_Connector.cursor

def check_Special_Chars (str = str):  #This function replaces special characters with their HTML Entity or Unicode
    if ("》" in str):
        str = str.replace("》", "&#12299")
    if ("《" in str):
        str = str.replace("《", "&#12298")
    if ("▲" in str):
        str = str.replace("▲", "&#9650")
    if ("🛣️" in str):
        str = str.replace("🛣️", '&#128739')
    if ("®" in str):
        str = str.replace("®", '&reg')
    if ("™" in str):
        str = str.replace("™", '&#8482')
    if ("©" in str):
        str = str.replace("©", '&copy')
    if ("🃏" in str):
        str = str.replace("🃏", 'U+1F0A0')
    if ("👑" in str):
        str = str.replace("👑", 'U+1F451')
    return str

#Gets the name of a game
def get_Name_json (response, ID = str):
    Name = response.json()[ID]["data"]["name"]
    Name = Name.replace('"', "'")
    return Name

#Gets the Description of a game
def get_Description_json (response, ID):
    return response.json()[ID]["data"]["short_description"]

def Price_Setting(Price = str):
    #$x.xx
    if len(Price) == 3: 
        Price = Price[:1] + "." + Price[1:]
     #$xx.xx
    elif len(Price) == 4:
         Price = Price[:2] + "." + Price[2:]
    #$xxx.xx
    else:
        Price = Price[:3] + "." + Price[2:]
    return Price

#Gets the inital price, final price, and discount percent of a game
def get_Price_json (response, ID = str):
    Initial = Price_Setting(str(response.json()[ID]["data"]["price_overview"]["initial"]))
    Final = Price_Setting(str(response.json()[ID]["data"]["price_overview"]["final"]))
    Discount = str(response.json()[ID]["data"]["price_overview"]["discount_percent"])
    return Initial, Final, Discount #returns the initial price, the final price, and the discount percent
    
#Converts and configures the date for the SQL querty
def date_Convert (Date = str):
    if (',' in Date and '!' not in Date):
        Comma = Date.index(',')
        if "Jan" in Date or "January" in Date:
           NewDate = Date[Comma + 2:] + '-01-'
        elif "Feb" in Date or "February" in Date:
            NewDate = Date[Comma + 2:] + '-02-'
        elif "Mar" in Date or "March" in Date:
            NewDate = Date[Comma + 2:] + '-03-'
        elif "Apr" in Date or "April" in Date:
            NewDate = Date[Comma + 2:] + '-04-'
        elif "May" in Date:
            NewDate = Date[Comma + 2:] + '-05-'
        elif "Jun" in Date or "June" in Date:
            NewDate = Date[Comma + 2:] + '-06-'
        elif "Jul" in Date or "July" in Date:
            NewDate = Date[Comma + 2:] + '-07-'
        elif "Aug" in Date or "August" in Date:
            NewDate = Date[Comma + 2:] + '-08-'
        elif "Sep" in Date or "September" in Date:
            NewDate = Date[Comma + 2:] + '-09-'
        elif "Oct" in Date or "October" in Date:
            NewDate = Date[Comma + 2:] + '-10-'
        elif "Nov" in Date or "November" in Date:
            NewDate = Date[Comma + 2:] + '-11-'
        elif "Dec" in Date or "December" in Date:
            NewDate = Date[Comma + 2:] + '-12-'
        if (Date[Comma - 2] != " "):
            NewDate = NewDate + Date[Comma - 2:Comma]
        else:
            NewDate = NewDate + Date[Comma - 1]
    elif "Jan" in Date or "January" in Date or "Feb" in Date or "February" in Date or "Mar" in Date or "March" in Date or "Apr" in Date or "April" in Date or "May" in Date or "Jun" in Date or "June" in Date or "Jul" in Date or "July" in Date or "Aug" in Date or "August" in Date or "Sep" in Date or "September" in Date or "Oct" in Date or "October" in Date or "Nov" in Date or "November" in Date or "Dec" in Date or "December" in Date:
        Year = 1990
        while (str(Year) not in Date):
            Year = Year + 1
            if Year == 2100:
                break
        if "Jan" in Date or "January" in Date:
            Month = '01'
        elif "Feb" in Date or "February" in Date:
            Month = '02'
        elif "Mar" in Date or "March" in Date:
            Month = '03'
        elif "Apr" in Date or "April" in Date:
            Month = '04'
        elif "May" in Date:
            Month = '05'
        elif "Jun" in Date or "June" in Date:
            Month = '06'
        elif "Jul" in Date or "July" in Date:
            Month = '07'
        elif "Aug" in Date or "August" in Date:
            Month = '08'
        elif "Sep" in Date or "September" in Date:
            Month = '09'
        elif "Oct" in Date or "October" in Date:
            Month = '10'
        elif "Nov" in Date or "November" in Date:
            Month = '11'
        elif "Dec" in Date or "December" in Date:
            Month = '12'
        NewDate = str(Year) + "-" + Month + "-01"
    elif "Coming" in Date or "Soon" in Date or "TBA" in Date or "Announced" in Date or "To be " in Date or "To Be" in Date or "Anounced" in Date:
        NewDate = "2100-12-31"
    else:
        Year = 1990
        while (str(Year) not in Date):
            Year = Year + 1
            if Year == 2100:
                Year = 2022
                break
        NewDate = str(Year) + "-12-31"
    return NewDate

#Gets the release date
def get_Release_Date_json (response, ID = str):
    return date_Convert(response.json()[ID]["data"]["release_date"]['date'])

#Gets the image link
def get_Img_Link_json (response, ID = str):
    return response.json()[ID]["data"]["header_image"]

#Gets the developer(s)
def get_Developers_json (response, ID = str):
    Devs = []
    res = response.json()[ID]["data"]["developers"]
    for each in res:
        if ((len(res) - 1) != res.index(each)):
            Devs.append(each + ", ")
        else:
            Devs.append(each)
    return Devs

#Gets the publisher(s)
def get_Publishers_json (response, ID = str):
    Publishers = []
    res = response.json()[ID]["data"]["publishers"]
    for each in res:
        if ((len(res) - 1) != res.index(each)):
            Publishers.append(each + ", ")
        else:
            Publishers.append(each)
    return Publishers

#Gets the amount of achivements
def get_Achievements_json (response, ID = str):
    try:
         achivements = response.json()[ID]["data"]["achievements"]["total"]
    except:
        achivements = 0
    return achivements

#A function that reduces code by returning SQL statements based on parameters
def select_DB_Info (Columns = str, Table = str, W_Column = str, Equals = str, Type = int):
    #Type 1 - where Name Like %'Name'%
    if Type == 1:
        query = 'SELECT ' + Columns + ' FROM steam.' + Table + ' where ' + W_Column + ' like "%' + Equals + '%"'
        cursor.execute(query)
        for each in cursor:
            return each
    #Type 2 - where APP_ID = 110022
    if Type == 2:
        query = 'SELECT ' + Columns + ' FROM steam.' + Table + ' where ' + W_Column + ' = ' + Equals
        cursor.execute(query)
        for each in cursor:
            return each
    if Type == 3:
        query = 'SELECT App_ID FROM steam.' + Table
        cursor.execute(query)
        Data = cursor.fetchall()
        Return = []
        for each in Data:
            Return.append(each[0])
        return Return

#Used to count the amount of rows edited.
def count_Rows(Columns = str, Table = str, W_Column = str, Equals = str, Type = int):
    count = 0
    Column_count = 1
    Data = select_DB_Info(Columns, Table, W_Column, Equals, Type)
    if Data != None:
        for each in Data:
            count = count + 1
    if Columns == "*":
        if Table == "game_data":
            Column_count = 13
        if Table == "discounts":
            Column_count = 4
    else:
        for each in Columns:
            if each == ",":
                Column_count = Column_count + 1
    return int(count / Column_count)