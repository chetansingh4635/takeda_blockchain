let request = require('request');

class MiddleWare{
    constructor(){
        this.baseUrl = "http://tm4udev.eastus2.cloudapp.azure.com:3090/",
        this.version = "v1.0.2",
        this.development = "DEV"
    }
    // http://tm4udev.eastus2.cloudapp.azure.com:3090/
    // http://tm4udev.eastus2.cloudapp.azure.com:3090/v1.0.2/UAT/users/addAccessKey

    put(keys, form, calback){
        let url = this.baseUrl+this.version+'/'+this.development+'/'+keys;
        // let resp = await request.put(url, {form:form});
        // async.wate
        return request.put(url,form, function (error, response, body) {
            calback(error, body)
            // if(error)
            //     return { error: true, msg : error };
            // else
            //     return JSON.parse(body) 
        });
    }
}

module.exports = MiddleWare;