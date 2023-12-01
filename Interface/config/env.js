if (process.env.API_URL){
    module.exports.apiAccessPoint = process.env.API_URL
}
else{
    module.exports.apiAccessPoint = "http://localhost:8001/api"    
}
module.exports.localHostAPI = "http://localhost:8001/api"

if (process.env.AUTH_URL){
    module.exports.authAcessPoint = process.env.AUTH_URL
}
else{
    module.exports.authAcessPoint = "http://localhost:8002/users"
}
module.exports.localHostAuth = "http://localhost:8002/users"    

if (process.env.SELF_URL){
    module.exports.selfURL = process.env.SELF_URL
}
else{
    module.exports.selfURL = "http://localhost:8003/"
}
