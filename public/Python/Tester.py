import Helper as H
import requests

response = requests.get("https://store.steampowered.com/api/appdetails?appids=1899750&cc=US")

print(H.get_Description_json(response, "1899750"))