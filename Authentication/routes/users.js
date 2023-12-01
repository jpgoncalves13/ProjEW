const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const passport = require('passport')
const userModel = require('../models/user')
const auth = require('../auth/auth');
const User = require('../controllers/user')
require('dotenv').config();

function paginatedResults(model) {
  return async (req, res, next) => {
    const queries = []
    const match = {
      $match : {}
    }
    queries.push(match)
  
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    
    try {
      res.paginatedResults = results;

      const aggregation = model.aggregate(queries);
      var total = await model.aggregate([...queries, { $count: 'count' }]).exec();
      total = total.length > 0 ? total[0].count : 0
      results.results = await aggregation.skip(startIndex).limit(limit).exec();
      
      if (endIndex < total) {
          results.next = { 
            page: page + 1,
            limit: limit
          }      
      }

      if (startIndex > 0) {
          results.previous = { 
            page: page - 1,
            limit: limit
          }
      }

      next();
    } catch (error) {
      res.status(500).json({error: error, message: error.message});
    }
  }
}

function verifyActiveStatus(req, res, next) {
  userModel.findOne({ username: req.body.username })
  .then(response => {
    if (response.active === false) {
      res.status(501).jsonp({ error: "User is not active", message: "User is not active" })
    }
    else {
      next()
    }
  })
  .catch(err => {
    res.status(500).jsonp({ error: err, message: "Login error: " + err })
  })

}

/*--GET's------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

/**
 * GET all the users
 * 
 * Verificar o acesso é necessario, rota para admin
 */
router.get('/', paginatedResults(userModel), function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(res.paginatedResults);
})

/**
 * GET Rota para iniciar o processo de autenticação com o Facebook
 * 
 * Autenticação com o Facebook. Para depois ser possível voltar ao serviço que pediu a autenticação guardamos a url de volta na sessão. 
 */
router.get('/facebook', (req, res) => {
  const returnUrl  = req.query.returnUrl || '/'; 
  req.session.returnUrl = returnUrl;

  // Redireciona para a autenticação do Facebook
  passport.authenticate('facebook', {
    scope: ['email']
  })(req, res);
});

/**
 * GET Rota de callback para autenticação com o Facebook
 * 
 * Existem três situações a lidar: Erro na autenticação, autenticação falhada na parte do Facebook e a situação de sucesso
 * onde é gerado um token jwt para ser usado na aplicação com 1h de duração.
 */
router.get('/facebook/callback', function(req, res, next) {
  passport.authenticate('facebook', function(err, user, info) {
    if (!err && ! user) {
      return res.json({ error: "Email already in use"});
    }
    if (err) {
      // Tratar o erro de autenticação
      return res.jsonp({ error: err.message });
    }
    if (!user) {
      // Tratar o cenário de autenticação falhada
      return res.jsonp({ error: 'Authentication failed.' });
    }
    // Autenticação bem-sucedida, gerar o token
    jwt.sign(
      { username: user.username, level: user.level, sub: 'User logged in', id: user._id},
      process.env.SECRET_KEY,
      { expiresIn: "1h" },
      function (error, token) {
        if (error) {
          // Tratar o erro de criar o token
          return res.jsonp({ error: error.message });
        } else {
          // Enviar o token como resposta
          res.cookie('token', token);
          res.redirect(req.session.returnUrl);
        }
      }
    );
  })(req, res, next);
});


/**
 * GET Rota para iniciar o processo de autenticação com o google. 
 * 
 * Autenticação com o Google. Para depois ser possível voltar ao serviço que pediu a autenticação guardamos a url de volta na sessão. 
 */
router.get('/google', (req, res) => {
  const returnUrl = req.query.returnUrl || '/'; 
  req.session.returnUrl = returnUrl;

  // Redireciona para a autenticação do Google
  passport.authenticate('google', { scope: ['profile', 'email']})(req, res);
});


/**
 * GET Rota de callback para autenticação com o Google
 * 
 * Existem três situações a lidar: Erro na autenticação, autenticação falhada na parte do Google e a situação de sucesso
 * onde é gerado um token jwt para ser usado na aplicação com 1h de duração.
 */
router.get('/google/callback', function(req, res, next) {
  passport.authenticate('google', function(err, user, info) {
    if (!err && ! user) {
      return res.json({ error: "Email already in use"});
    }
    if (err) {
      // Tratar o erro de autenticação
      return res.jsonp({ error: err.message });
    }
    if (!user) {
      // Tratar o cenário de autenticação falhada
      return res.jsonp({ error: 'Authentication failed.' });
    }
    // Autenticação bem-sucedida, gerar o token
    jwt.sign({
      username: user.username,
      level: user.level,
      sub: 'User logged in',
      id: user._id
    },
      process.env.SECRET_KEY,
      { expiresIn: "1h" },
      function (e, token) {
        if (e) {
          // Tratar o erro de geração do token
          return res.jsonp({ error: e });
        } else {
          // Enviar o token como resposta
          res.cookie('token', token);
          res.redirect(req.session.returnUrl);
        }
      }
    );
  })(req, res, next);
});


/**
 * GET utilizador com o respetivo id, qualquer utilizador tem acesso se possuir conta
 */
router.get('/:id/history', auth.verificaAcesso, function (req, res) {
  User.getUserHistory(req.params.id)
    .then(dados => res.status(200).jsonp({ dados: dados }))
    .catch(e => res.status(500).jsonp({ error: e }))
})

/**
 * GET utilizador com o respetivo id, qualquer utilizador tem acesso se possuir conta
 */
router.get('/:id/favorites', auth.verificaAcesso, function (req, res) {
  User.getUserFavorites(req.params.id)
    .then(dados => res.status(200).jsonp({ dados: dados }))
    .catch(e => res.status(500).jsonp({ error: e }))
})

/**
 * GET histórico de um utilizador
 */
router.get('/:id', auth.verificaAcesso, function (req, res) {
  User.getUser(req.params.id)
    .then(dados => res.status(200).jsonp({ dados: dados }))
    .catch(e => res.status(500).jsonp({ error: e }))
})

/*--POST's------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/


/**
 * POST rota para adicionar um utilizador à base de dados, por um admin 
 */
router.post('/', auth.verificaAcesso, function (req, res) {
  User.addUser(req.body)
    .then(dados => res.status(201).jsonp({ dados: dados }))
    .catch(e => res.status(500).jsonp({ error: e }))
})

/**
 * POST rota para registar um utilizador à base de dados 
 */
router.post('/register', function (req, res) {
  var d = new Date().toISOString().substring(0, 19)
  userModel.findOne({email: req.body.email})
    .then(dados => {
      if (dados) {
        res.status(500).jsonp({ error: 'Email already in use'});

      } else {
        userModel.register(new userModel({
          username: req.body.username, name: req.body.name, surname: req.body.surname,
          email: req.body.email, level: req.body.level, 
          active: true, dateCreated: d, dateLastAccess: d,
          providerId: '', provider: '',history: [],
          favorites: []
        }),
          req.body.password,
          (err, user) => {
            if (err)
              res.jsonp({ error: err, message: "Register error: " + err })
            else {
              passport.authenticate("local")(req, res, () => {
                jwt.sign({
                  username: req.user.username, level: req.user.level,
                  sub: 'New User', id: req.user._id
                },
                  process.env.SECRET_KEY,
                  { expiresIn: "1h" },
                  function (e, token) {
                    if (e) res.status(500).jsonp({ error: "Erro na geração do token: " + e })
                    else res.status(201).jsonp({ token: token })
                  });
              })
            }
          })
      }

    })
    .catch(err => {
        res.status(500).jsonp({ error: err, message: err.message });
    })
})

/**
 * POST rota para iniciar sessão na aplicação 
 */
router.post('/login', verifyActiveStatus, passport.authenticate('local'), function (req, res) {
  jwt.sign({
    username: req.user.username, level: req.user.level,
    sub: 'User logged in',
    id: req.user._id
  },
    process.env.SECRET_KEY,
    { expiresIn: "1h" },
    function (e, token) {
      if (e) res.status(500).jsonp({ error: "Erro na geração do token: " + e })
      else res.status(201).jsonp({ token: token })
    });
})


/*--PUT's------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/


/**
 * PUT alterar um utilizador, pode ser feito por um adim ou pelo utilizador em questão
 * 
 */
router.put('/:id', auth.verificaAcesso, function (req, res) {
  User.updateUser(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

/**
 * PUT desativar a conta de um utilizador, pode ser feito por um adim ou pelo utilizador em questão
 */
router.put('/:id/desativar', auth.verificaAcesso, function (req, res) {
  User.updateUserStatus(req.params.id, false)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

/**
 * PUT ativar a conta de um utilizador, pode ser feito por um adim ou pelo utilizador em questão
 */
router.put('/:id/ativar', auth.verificaAcesso, function (req, res) {
  User.updateUserStatus(req.params.id, true)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

/**
 * PUT alterar a password de um utilizador, pode ser feito pelo utilizador em questão
 */
router.put('/:id/password', auth.verificaAcesso, function (req, res) {
  User.updateUserPassword(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

/**
 * PUT adicionar um processo ao histórico, feito pelo utilizador em questão quando acessa um processo 
 */
router.put('/:id/history', auth.verificaAcesso, function (req, res){
  User.updateHistory(req.params.id, req.body.process)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

/**
 * PUT adicionar um processo aos favoritos, feito pelo utilizador em questão quando adiciona um processo aos favoritos 
 */
router.put('/:id/favorites', auth.verificaAcesso, function (req, res){
  User.updateFavs(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
      console.log("Respost:" + dados);
    })
    .catch(erro => {
      console.log("Erro: " + erro.message);
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
})

router.put('/:id/removeFavorite', auth.verificaAcesso, function (req, res) {
  User.removeFavs(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      console.log("Erro: " + erro.message);
      res.jsonp('error', { error: erro, message: "Erro na alteração do utilizador" })
    })
});

router.put('/:email/redefinePassword', function (req, res) {
  User.changePassword(req.params.email,req.body.pass)
  .then(dados => {
    console.log("DADOS: " + dados)
    res.jsonp(dados)
  })
  .catch(erro => {
    console.log("ERRO " + erro)
    console.log(erro.message);
    res.jsonp({ error: erro, message: "Erro na alteração da password" })
  })
})


/*--DELETE's------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

/**
 * DELETE utilizador, feito pelo utilizador em questão quando quer apagar a conta ou pelo admin 
 */
router.delete('/:id', auth.verificaAcesso, function (req, res) {
  User.deleteUser(req.params.id)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(erro => {
      res.jsonp({ error: erro, message: "Erro na remoção do utilizador" })
    })
})

module.exports = router;