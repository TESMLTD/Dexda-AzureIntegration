//Copyright dexda limited
//Pre-processor for azure alerts generated with standard/custom log analytics and application insights schemas
//http://docs.microsoft.com/en-us/azure/azure-monitor/platform/alerts-log-webhook

var http = require('http')

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if ("IncludeSearchResults" in req.body) {
        //log alert with custom json payload 
        context.log("Log alert with custom json payload ")
        if (req.body.IncludeSearchResults == true){
            //create a deep copy of the original req.body and use this as a template
            let template = JSON.parse(JSON.stringify(req.body));
            //delete the search results section in the template ** note the plural of Results (unlike any other azure alert)
            template.SearchResults = {}

            //iterate the SearchResults table and add a single search result to the template
            req.body.SearchResults.tables.forEach(function(table){
                table.rows.forEach(function(row){
                    for (i = 0; i < row.length; i++) {
                        template.SearchResults[table.columns[i].name] = row[i]
                        //context.log(JSON.stringify(template));
                        sendToDexda(context, template)
                    }
                });
            });
        }
        else
        {
            //send on as is
            sendToDexda(context, req.body)
        }
    }
    else if ("SearchResult" in req.body) {
        //log alert for log analytics with standard json payload
        context.log("Log alert for log analytics standard json payload ")

        //create a deep copy of the original req.body and use this as a template
        let template = JSON.parse(JSON.stringify(req.body));
        //delete the search results section in the template)
        template.SearchResult = {}

        //iterate the SearchResults table and add a single search result to the template
        req.body.SearchResult.tables.forEach(function(table){
            table.rows.forEach(function(row){
                for (i = 0; i < row.length; i++) {
                      template.SearchResult[table.columns[i].name] = row[i]
                      context.log(JSON.stringify(template));
                      sendToDexda(context, template)
                  }
             });
        });
    }
    else if ("SearchResult" in req.body.data) {
        //log alert for application insights with standard json payload
        context.log("Log alert for application insights standard json payload ")
        
        //create a deep copy of the original req.body and use this as a template
        let template = JSON.parse(JSON.stringify(req.body));
        //delete the search result section in the template)
        template.data.SearchResult = {}

        //iterate the SearchResult table and add a single search result to the template
        req.body.data.SearchResult.tables.forEach(function(table){
            table.rows.forEach(function(row){
                for (i = 0; i < row.length; i++) {
                      template.data.SearchResult[table.columns[i].name] = row[i]
                      context.log(JSON.stringify(template));
                      sendToDexda(context, template)
                  }
             });
        });
    }
    else  {
        context.log("Unrecognised log alert ")
        sendToDexda(context, req.body)
    }
    context.done()
};


function sendToDexda(context, alert){
    var body = JSON.stringify(alert);
    //context.log(JSON.stringify(body));
    var request = new http.ClientRequest({
        hostname: process.env["WEBHOOK_ALERT_HOSTNAME"],
        port: process.env["WEBHOOK_ALERT_PORT"],
        path: "",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    });
    request.end(body);
    request.on('response', function (response) {
        context.log('STATUS: ' + response.statusCode);
        context.log('HEADERS: ' + JSON.stringify(response.headers));
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            context.log('BODY: ' + chunk);
        });
    });
};
