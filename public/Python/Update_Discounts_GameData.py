from datetime import date
import requests
import Helper as H
import SQL_Connector as SQL
import time

URL = "https://store.steampowered.com/api/appdetails?appids="
URL2 = "&cc=US"

def Update_Discount_and_Game_Data ():
    result = 0 #Used to print out how many rows were added
    Discount_AppIDs = [] #An array of all AppIDs that have already been added to the discounts table
    Games = [] #An array that will house of all games info
    Date = str(date.today())
    H.cursor.execute("Select * from steam.game_data") #Gets all the game data needed
    for each in H.cursor:
        Games.append(each) #Adds each to the games array
    H.cursor.execute("Select App_ID from steam.discounts where Date = '" + Date + "'") #Gets all the discounts that were added already for today
    for each in H.cursor:
        Discount_AppIDs.append(each[0]) #Adds each AppID to Discount_AppIDs
    for each in Games: #A loop to go through each game
        #print(each)
        response = requests.get(URL + str(each[0]) + URL2) #Makes an API request to get the data from Steam about the game
        while (response.json() is None): #If too many requests are ran, it will result in None and try again in a minute
            print("Too many requests... waiting")
            time.sleep(60)
            response = requests.get(URL + str(each[0]) + URL2)
        Coming_Soon = response.json()[str(each[0])]["data"]["release_date"]['coming_soon'] #Checks the Coming soon section for if the game is released
        if Coming_Soon == False: #Game is released
            Initial, Final, Discount = H.get_Price_json(response, str(each[0])) #Gets the inital price, discount price, and discount percent
            if (each[6] == 1): #each[6] is coming soon.  This checks if the game has coming soon still (1)
                query = ("UPDATE steam.game_data SET Coming_Soon = '0' WHERE App_ID = " + str(each[0])) #Sets coming soon to 0
                print("New Release: " + H.check_Special_Chars(each[1]) + "!") #Alerts that the game released
                H.cursor.execute(query)
                SQL.mydb.commit()
            if (float(each[3]) != float(Initial) and float(Discount) == 0): #each[3] = price.  This checks if the price risen/declined without a discount
                query = ("UPDATE steam.game_data SET Price = '" + Initial + "', Max_Discount_Price = " + Final + ", Max_Discount_Percent = " + Discount + " WHERE App_ID = " + str(each[0]) + ";") #Updates the price
                print("New price added for: " + H.check_Special_Chars(each[1])) #Alerts the price updated
                H.cursor.execute(query)
                SQL.mydb.commit()
                query = ("INSERT INTO steam.price_updates VALUES (" + str(each[0]) + "," + str(each[3]) + "," + Initial + ", '" + Date + "');") #Adds price change to price updates
                H.cursor.execute(query)
                SQL.mydb.commit()
            if (float(each[11]) > float(Final) or each[12] < float(Discount)): #each[11] = is max discount price and each[12] is max discount percent.  This checks if the current discount is higher then the previously recorded max discount
                query = ("UPDATE steam.game_data SET Max_Discount_Price = '" + Final + "', Max_Discount_Percent = " + Discount + " WHERE App_ID = " + str(each[0])) #Updates the max discount percent and price
                print("New max discount added for: " + H.check_Special_Chars(str(each[1]))) #Alerts there is a new max discount
                H.cursor.execute(query)
                SQL.mydb.commit()
            if each[0] not in Discount_AppIDs and int(Discount) > 0: #If the game isn't already in the discount database and there is a discount
                query = "INSERT INTO steam.discounts VALUES (" + str(each[0]) + ", '" + Date + "', " + Initial + ", " + Discount + ", " + Final + ");" #Adds info to discount database
                H.cursor.execute(query)
                print(query + " - " + str(H.count_Rows("*", "discounts", "App_ID", str(each[0]), 2)) +" row(s) affected") #Prints out a SLQ like result
                SQL.mydb.commit()
                result = result + 1
    print("Total Rows Added to Discounts: " + str(result)) #Prints total rows edited
Update_Discount_and_Game_Data()