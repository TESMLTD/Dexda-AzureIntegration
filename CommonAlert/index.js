//Copyright Dexda Limited
//Pre-processor for azure alerts generated with the common alert schema
//https://docs.microsoft.com/en-us/azure/azure-monitor/platform/alerts-common-schema-definitions

var http = require('http')

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    //check for common alert schema
    if (req.body.schemaId == "azureMonitorCommonAlertSchema") {
        //check for monitoring services that *may* include a search result table
        if (req.body.data.essentials.monitoringService == "Log Analytics" || req.body.data.essentials.monitoringService == "Application Insights" ) {
            //check whether there are some search results to iterate
            if (req.body.data.alertContext.IncludedSearchResults == "True") {
                //create a deep copy of the original req.body and use this as a template
                let template = JSON.parse(JSON.stringify(req.body));
                //delete the search result section in the template
                template.data.alertContext.SearchResult = {}

                //iterate the SearchResult table and add a single search result to the template
                req.body.data.alertContext.SearchResult.tables.forEach(function(table){
                    table.rows.forEach(function(row){
                        for (i = 0; i < row.length; i++) {
                            template.data.alertContext.SearchResult[table.columns[i].name] = row[i]
                            ///context.log(JSON.stringify(template));
                            sendToDexda(context, template)
                        }
                    });
                });
            }
            else
            {
                //no search results to iterate so send as is...
                sendToDexda(context, req.body)
            }
        }
        else
        {
                //not a log alert so send as is...
                sendToDexda(context, req.body)
        }
    }
    else
    {
        //not a common alert so send as is...
        sendToDexda(context, req.body)
    }
    context.done()
};

function sendToDexda(context, alert){
    var body = JSON.stringify(alert);
    //context.log(JSON.stringify(body));
    var request = new http.ClientRequest({
        hostname: process.env["DEXDA_HOSTNAME"],
        port: process.env["DEXDA_PORT"],
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
