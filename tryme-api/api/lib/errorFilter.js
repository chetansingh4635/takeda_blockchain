let request = require('request');

class ErrorFilter{
    constructor(error){
        this.error = error;
    }


    filterError(){
        let error = this.error.toString();
        if(error.indexOf("'Participant:mp.takeda.tryme.Subject' as the object already exists") !== -1){
            return "Subject Already Signed Up";
        }
        else if(error.indexOf("Card not found") !== -1){
            return "Error : Email not Exist";
        }
        else if( error.indexOf("Error: Error trying invoke business network")!== -1){
            error = error.split("Error: Error trying invoke business network.").join("");
            error = error.split("Error: No valid responses from any peers.").join("");
            error = error.split("Response from attempted peer comms was an error: Error: 2 UNKNOWN: error executing chaincode: transaction returned with failure:").join("");
            error = error.split("Error:").join('');
            error = error.trim();
            return error;
        }
        else if( error.indexOf("PHANTOM_READ_CONFLICT")!== -1 || error.indexOf("MVCC_READ_CONFLICT")!== -1){
            return "Something Went Wrong : Multiple Transaction in the pool. Please Retry Again."
        }
        else{
            // let e = error.split("\n");
            // error = e[e.length - 1];
            // error = error.trim();
            return error;
        }
    }
}

module.exports = ErrorFilter;