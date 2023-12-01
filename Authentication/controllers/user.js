var User = require('../models/user')

// Devolve a lista de Users
module.exports.list = () => {
    return User
        .find()
        .sort('name')
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getUser = id => {
    return User.findOne({ _id: id })
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getUserHistory = id => {
    return User.findOne({ _id: id }, {history: 1})
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.getUserFavorites = id => {
    return User.findOne({ _id: id }, {favorites: 1})
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.addUser = u => {
    return User.create(u)
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.updateUser = (id, info) => {
    return User.updateOne({ _id: id }, { $set: info })
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.updateFavs = (id, fav) => {
    return this.getUser(id)
    .then(response => {
        let user = response
        let existingFavorite = null;
        for(let i=0; i<user.favorites.length; i++) {
            if (user.favorites[i].id == fav.id) { // Dois iguais porque o id vem como string
                existingFavorite = user.favorites[i]
            }
        }

        if (existingFavorite) {
          // Update the description of the existing favorite
          existingFavorite.description = fav.description;
        } else {
          // Add a new favorite object
          user.favorites.push({ id: fav.id, description: fav.description });
        }

        this.updateUser(id, user)
        .then(response => {
            return response
        })
        .catch(error => {
            console.log("Erro: " + error.message);
            return error 
        })
    })
    .catch(err => {
        console.log("Erro2: " + err.message);
        return err
    })
}

module.exports.removeFavs = (id, fav) => {
    return this.getUser(id)
    .then(response => {
        let user = response
        let existingFavorite = null;
        let updated = false;
        for(let i=0; i<user.favorites.length; i++) {
            if (user.favorites[i].id == fav.id) { // Dois iguais porque o id vem como string
                user.favorites.splice(i, 1)
                updated = true
            }
        }
        if (updated){
            this.updateUser(id, user)
            .then(response => {
                return response
            })
            .catch(error => {
                console.log("Erro: " + error.message);
                return error 
            })
        }
        
    })
    .catch(err => {
        console.log("Erro2: " + err.message);
        return err
    })
}

module.exports.updateHistory = (id, process) => {
    return User.updateOne({ _id: id }, {$push: { history: process } })
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.updateUserStatus = (id, status) => {
    return User.updateOne({ _id: id }, { $set: { active: status } })
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.updateUserPassword = (id, pwd) => {
    return User.updateOne({ _id: id }, pwd)
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.deleteUser = id => {
    return User.deleteOne({ _id: id })
        .then(resposta => {
            return resposta
        })
        .catch(erro => {
            return erro
        })
}

module.exports.changePassword = (email, newPassword) => {
    console.log('ola')
    return User.findOne({ email: email })
       .then(response => {
            if (!response) {
                return { error: "Email not in use" }
            } else {
                console.log("AQUI " + response)  
                response.setPassword(newPassword, (err, user) => {
                if (err) {
                    console.log(err.message)
                  return err;
                } else {
                // Salve as alterações no utilizador
                response.save()
                    .then(response => {
                        return response
                    })
                    .catch(err => {
                        console.log(err)
                        return err;
                    })
                }
              });
            
            }
        })   
       .catch(err => {
            return err;
       }) 

  };
  

