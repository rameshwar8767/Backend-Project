class ApiResponse{
    constructor(statuscode, data, message= "Success"){
        this.statusCode = this.statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}