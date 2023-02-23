import Helper as H
import requests
import SQL_Connector as SQL
import sys

def insert_Game_Data (ID = str):
    In_DB = H.select_DB_Info("*", "game_data", "App_ID", ID, 2)
    if In_DB != None:
        print("Game already in Database")
    else:
        response = requests.get("https://store.steampowered.com/api/appdetails?appids=" + ID + "&cc=US")
        Name = H.get_Name_json(response, ID)
        Description = H.get_Description_json(response, ID)
        Coming_Soon = response.json()[str(ID)]["data"]["release_date"]['coming_soon']
        if Coming_Soon == False:
            Initial, Final, Discount = H.get_Price_json(response, ID)
        Achievements = H.get_Achievements_json(response, ID)
        Img_Link = H.get_Img_Link_json(response, ID)
        Release_Date = H.get_Release_Date_json(response, ID)
        Store_Url = "https://store.steampowered.com/app/" + ID + "/"
        Dev = ""
        Pub = ""
        for each in H.get_Developers_json(response, ID):
            Dev = Dev + each
        for each in H.get_Publishers_json(response, ID):
            Pub = Pub + each
        if Coming_Soon == False:
            query = "INSERT into steam.game_data VALUES (" + ID + ", " + '"' + Name + '"' + ', "' + Description + '", ' + Initial + ", '" + Img_Link + "', '" + Store_Url + "', 0, '" + Release_Date + "', '" + Dev + "', '" + Pub + "', " + str(Achievements) + ", " + str(Final) + ", " + str(Discount) + ");"
            SQL.cursor.execute(query)
            print(H.check_Special_Chars(query + " - " + str(H.count_Rows("*", "game_data", "App_ID", ID, 2)) +" row(s) affected"))
        else: 
            query = "INSERT into steam.game_data VALUES (" + ID + ", " + '"' + Name + '"' + ', "' + Description + '", 0' + ", '" + Img_Link + "', '" + Store_Url + "', 1, '" + Release_Date + "', '" + Dev + "', '" + Pub + "', 0, 0, 0);"
            SQL.cursor.execute(query)
            print(H.check_Special_Chars(query + " - " + str(H.count_Rows("*", "game_data", "App_ID", ID, 2)) +" row(s) affected"))
        SQL.mydb.commit()
insert_Game_Data(sys.argv[1])