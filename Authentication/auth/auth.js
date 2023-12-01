var jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports.verificaAcesso = function (req, res, next){
    var myToken = req.query.token || req.body.token
    if(myToken){
      jwt.verify(myToken, process.env.SECRET_KEY, function(e, payload){
        if(e){
          res.status(401).jsonp({error: e})
        }
        else{
          next()
        }
      })
    }
    else{
      res.status(401).jsonp({error: "Token inexistente!"})
    }
  }

module.exports.verificaRole = function(role){
    return async(req, res, next) => {
      var myToken = req.query.token || req.body.token
      if(myToken){
        jwt.verify(myToken, process.env.SECRET_KEY, function(e, payload){
          console.log("Payload: " + payload)
          if(e){
            res.status(401).jsonp({error: e})
          }
          else{
            if(payload.role === role){
              next()
            }
            else{
              res.status(401).jsonp({error: 'Acesso negado!'})
            }
          }
        })
      }
      else{
        res.status(401).jsonp({error: "Token inexistente!"})
      }
    }
}

module.exports.verificaId = function(id){
  return async(req, res, next) => {
    var myToken = req.query.token || req.body.token
    if(myToken){
      jwt.verify(myToken, process.env.SECRET_KEY, function(e, payload){
        if(e){
          res.status(401).jsonp({error: e})
        }
        else{
          if(payload.id === id){
            next()
          }
          else{
            res.status(401).jsonp({error: 'Acesso negado!'})
          }
        }
      })
    }
    else{
      res.status(401).jsonp({error: "Token inexistente!"})
    }
  }
}
