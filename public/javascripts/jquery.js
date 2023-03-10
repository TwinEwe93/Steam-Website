$(function() {
    $('#HomeButton').click(function(){
        window.location.href = ('/')
    });
    $('#All-Games').click(function(){
        window.location.href = ('/All-Games')
    });
    $('#Sale-Today').click(function(){ 
        if ($('#Sale-Today-Dropdown').is(':hidden')) {
            $("#Sale-Today-Dropdown").slideDown('slow');
        } 
        else {
            $("#Sale-Today-Dropdown").slideUp('slow');
        }
    });
    $('#Add-Game').click(function(){
        window.location.href = ('/Add-Game')
    });
    $('#Search-Game').click(function(){
        window.location.href = ('/Search-Game')
    });
    /*$('#RefreshSalesButton').click(function(){
        window.location.href = ('/Update-Daily-Deals')
    });*/
    $('#Todays-Sales-Show').click(function(){
        window.location.href = ('/Sale-Today')
    });
    $('#Todays-Sales-All').click(function(){
        window.location.href = ('/Update-Daily-Deals-All')
    });
    $('#Todays-Sales-Date').click(function(){
        window.location.href = ('/Sales-Date-Picker')
    });
    $('#Delete-Game').click(function(){
        window.location.href = ('/Delete-Game')
    });
    $('#Chart-Button').click(function(){
        window.location.href = ('/Chart')
    });
    $('#Copy-Sales-On-Date').click(function(){
        window.location.href = ('/Copy-Sales-Date')
    });
    $('#Email-Deals-Button').click(function(){
        window.location.href = ('/Email-Daily-Deals')
    });

    $('#SaleDatePicker').datepicker({
        minDate: new Date("2022-04-12"),
        maxDate: new Date(),
        dateFormat: "yy-mm-dd"
    });
    $('#FromDatePicker').datepicker({
        minDate: new Date("2022-04-12"),
        maxDate: new Date(),
        dateFormat: "yy-mm-dd"
    });
    $('#ToDatePicker').datepicker({
        minDate: new Date("2022-04-12"),
        maxDate: new Date(),
        dateFormat: "yy-mm-dd"
    });
});
async function MakeChart(App_ID, Time) {
    var DiscountsRaw;  
    var Game_Data;  
    var EndDate = new Date();  
    var StartDate = new Date();  
    var MaxDate = new Date("2022-04-12")  //The first day data was recorded.  Using this to prevent the graph from going back too far (won't go before this date).
    var ChartData = [];  
    var Title;  
    if (Time === 1) {
        StartDate.setDate(EndDate.getDate() - 6);  //Subtracts 6 days from the EndDate.  This makes it caculate a week.
        Title = "Discounts for 1 week";
    }
    else if (Time === 2) {
        StartDate.setMonth(EndDate.getMonth() - 1); //Subtracts 1 month from the EndDate to make the StartDate a month before the EndDate
        Title = "Discounts for 1 month";
    }
    else if (Time === 3) {
        StartDate.setMonth(EndDate.getMonth() - 6);  //Subtracts 6 months from the EndDate to make the StartDate 6 months before the EndDate
        Title = "Discounts for 6 months";
    }
    else {
        StartDate.setFullYear(EndDate.getFullYear() - 1)  //Default - Subtracts 1 year from the EndDate to make the StartDate 1 year before the EndDate
        Title = "Discounts for 1 year";
    }

    TimeBetween = (EndDate - StartDate) / (1000 * 60 * 60 * 24) + 1;  //Calculates the difference between the end date and start date.

    FormattedStartDate = StartDate.getFullYear() + "-" + (StartDate.getMonth()+1) + "-" + StartDate.getDate();  //Formats the StartDate to a String for the API  -Format YYYY/MM/DD
    FormattedEndDate = EndDate.getFullYear() + "-" + (EndDate.getMonth()+1) + "-" + EndDate.getDate();  //Formats the EndDate to a String for the API  -Format YYYY/MM/DD

    //Connects to the API that gets the Discounts for the date range provided.  Await is used to make sure this is run before the program continues.  Otherwise the Discounts will be empty.
    await $.get("/API/Discounts/OnDate/DateRange", {App_ID:App_ID, DateBegin:FormattedStartDate, DateEnd:FormattedEndDate})
        .done(function (data){  
            DiscountsRaw = data.data;
            console.log(data)
            console.log(App_ID)
            console.log(FormattedStartDate)
            console.log(FormattedEndDate)
        });

    //Connects to the API that gets the Price_Updates for the date range provided.  Await is used to make sure this is run before the program continues.  Otherwise the Price_Updates will be empty.
    await $.get("/API/Price_Updates/OnDate/DateRange", {App_ID:App_ID, DateBegin:FormattedStartDate, DateEnd:FormattedEndDate})
        .done(function (data){  
            Price_UpdatesRaw = data.data;  
        });
        
    //Connects to the API that gets the Price for a specific game based on App_ID provided.
    await $.get(`API/Game_Data/${App_ID.toString()}`, function (data) {  
        Game_Data = data.data;  
    });

    if (DiscountsRaw.length === 0) {  //This is a error handler to in the case of no discount being recorded for the selected time period.  The checker below needs DiscountsRaw to have some value (even if it is dummy text) to run the for loop.  Pushing dummy data will result it in working as intended and allowing it to loop.
        DiscountsRaw.push("Dummy"); //Dummy text to make the second for loop below work
    }

    Title = Title + " for " + Game_Data[0].Game_Name;  //Updating the title to include the game name
    var runnerDate = new Date(StartDate) //This is a date that will be used in the loop below.  It will be used for if statements to see if statements on if dates match.  More details will be in the loop.
    for (i = 0; i < TimeBetween; i++) {  //This is the first main loop.  It will check each day and see if there was a sale.  If not, it will check if there was a price increase.  If neither, it will use the default price.  Explained more below.
        for (x = 0; x < DiscountsRaw.length; x++){  //This is the second main loop.  It will loop through all the Discount data.  The purpose of this is for the next if statement
            if (runnerDate < MaxDate) break;
            if (runnerDate.getMonth() + 1 == new Date(DiscountsRaw[x].Date).getMonth() + 1 && runnerDate.getDate() == new Date(DiscountsRaw[x].Date).getDate()) {  //If the day and month match for both the Discount data and runnerDate, that means there was a discount on that date.  This will be recorded in the main array.
                ChartData.push([runnerDate.toLocaleDateString("en-US"), DiscountsRaw[x].Discount_Price, "Price on " + (runnerDate.getMonth() + 1) + "/" + runnerDate.getDate() + ": $" + DiscountsRaw[x].Discount_Price 
                + "\n Discount Percent: " + DiscountsRaw[x].Discount_Percent + "%"]);  //This is data to generate the chart.  The first element displays the date (Ex. "12/15/2022").  The second gets the discount price of the game from the discount database.  The third is a string that says the price on (date): $xx.xx.  The first two are used for the x and y axis while the third is for the hover information.
                break;
            }
            if (x === DiscountsRaw.length-1) {  //There was no discount on this day.  This means the game was at default price.
                ChartData.push([runnerDate.toLocaleDateString("en-US"), Game_Data[0].Price, "Price on " + (runnerDate.getMonth() + 1) + "/" + runnerDate.getDate() + ": $" + Game_Data[0].Price 
                + "\n Discount Percent: 0%"]);  //This is data to generate the chart.  The first element displays the date (Ex. "12/15/2022").  The second gets the normal price of the game from Game_Data.  The third is a string that says the price on (date): $xx.xx.  The first two are used for the x and y axis while the third is for the hover information.
            }
        }
        runnerDate.setDate(runnerDate.getDate() + 1)  //Adds one to the runnerDate so it will start the next iteration with the next date
    }
    google.charts.load('current',{packages:['corechart']});  //Loads the Google Chart data needed to make the chart
    google.charts.setOnLoadCallback(drawChart);  //Draws the chart

    function drawChart() {  //This function is to make the chart
        var data = new google.visualization.DataTable();
        data.addColumn('string', "Date")  //Adding the x axis as Date
        data.addColumn('number', "Price")  //Adding the y axis as Price
        data.addColumn({type: 'string', role: 'tooltip'});  //This is for the hover information
        data.addRows(ChartData)  //ChartData has 3 parts: the date, the price, and the hover info.  It must be in this order as this is how the chart will read it in (it will read the columns up to down and cooralate it with the ChartData left to right).
        var options = {  //Extra features to make the chart look beter
          title:Title,  //Adding a title
          hAxis: {title: 'Date'},  //Adding the name "Date" for the x axis
          vAxis: {title: 'Price', maxValue: (Game_Data[0].Price + 60)},  //Adding the name "Price" to the y axis and making the max height the price + 60.  This makes the graph look better and not have the data riding the top of the graph.
          legend: 'none'  //No legend needed for this graph.
        };
        var chart = new google.visualization.LineChart(document.getElementById('Chart'));  //This will make the line graph and place it on the element with the Chart ID.
        chart.draw(data, options);  //Makes the graph.
      }
};

function ListGames(ElementID) {  //This function appends all games to a select element based on elementID
    $.get("/API/Game_Data/Order_By_Name", function (data) {  //This API is used to get all game names
        $.each(data.data, (each) => {
            console.log(each)
            $(`#${ElementID}`).append("<option value='" + $(data.data)[each].Game_Name + "'> " + $(data.data)[each].Game_Name + " </option>")  //Appends all the games to the list
        });
    })
}