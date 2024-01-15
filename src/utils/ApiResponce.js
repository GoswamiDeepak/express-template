export class ApiResponce {
    constructor(statusCode, data, message = 'Success') {
        this.statusCodo = statusCode;
        this.data = data;
        this.message = message;
        this.sucess = statusCode < 400;
    }
}
