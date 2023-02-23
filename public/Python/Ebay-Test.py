#!/usr/bin/env python
# -*- coding: utf-8 -*- 


import requests

response = requests.get("https://www.ebay.co.uk/itm/354427786396")

def getPrice (res):
    if (res.find('US $') != -1):
        Price = res[res.find('US $') + 3:res.find('US $') + 10]
    else:
        Start = 0
        for x in range(100):
            Start = res.find('ux-textspans',Start) + 1
            if x == 51:
                Price = res[res.find('ux-textspans', Start) + 36:res.find('ux-textspans', Start) + 100]
    while True:
        last = Price[len(Price)-1]
        if last.isnumeric():
            break
        else:
            Price = Price[:-1]
    return Price

def getTitle (res):
    Title = res[res.find("x-item-title__mainTitle") + 121:res.find("x-item-title__mainTitle") + 1000]
    Title = Title[:Title.find("<!--")]
    Title = Title.replace("&#034;", '"')
    return Title

def getImg (res):
    Img = res[res.find("ux-image-carousel-item active image"):res.find("ux-image-carousel-item active image") + 1000]
    Img = Img[Img.find("src=") + 4:Img.find(".jpg") + 4]
    return Img

print("Title: " + getTitle(str(response.content)))
print("Price: " + getPrice(str(response.content)))
print("Img src: " + getImg(str(response.content)))