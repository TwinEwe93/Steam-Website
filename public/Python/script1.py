from datetime import date
import requests
import Helper as H
import SQL_Connector as SQL
import sys

Games = []
H.cursor.execute("Select * from steam.game_data")
for each in H.cursor:
    Games.append(each)
for each in Games:
    print(each[3])