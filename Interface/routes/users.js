var express = require('express');
var router = express.Router();
var env = require('../config/env');
var axios = require('axios');
var jwt = require('jsonwebtoken');
const Swal = require('sweetalert2');
const auth = require('../auth/auth')
const { query } = require('express');
require('dotenv').config();

const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));

/*--GET's---------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * GET /login página de login
 */
router.get('/login', (req, res)=>{
  res.render('loginForm')
})


/**
 * GET página de login/registo com facebook
 */
router.get('/facebook', (req, res)=>{
  res.redirect('http://localhost:8002/users' + '/facebook?returnUrl=' + env.selfURL)
})

/**
 * GET página de login/registo com o google
 */
router.get('/google', (req, res)=>{
  res.redirect('http://localhost:8002/users' + '/google?returnUrl=' + env.selfURL)
})

/**
 * GET página de logout
 */
router.get('/logout', auth.verificaToken({'admin': -1, 'producer': -1, 'consumer': -1}), (req, res)=>{
  res.cookie('token', "revogado.revogado.revogado")
  res.redirect('/users/login')
})

/**
 * GET página de registo
 */
router.get('/register', (req, res)=>{
  res.render('register')
})

/**
 * GET página para definir o email para enviar link para reposição da password
 */

router.get('/resetPassword=:token',  (req, res) => {
  res.render('redefinePassword');
});


/**
 * GET página para definir o email para enviar link para reposição da password
 */
router.get('/resetPassword',  (req, res)=>{
  res.render('resetPassword')
})

router.get('/', auth.verificaToken({'admin': -1}), (req, res)=>{
  const token = '?token=' + req.cookies.token;
  jwt.verify(req.cookies.token, process.env.SECRET_KEY, function(err, payload) {
    if (err) {
      res.render('error', {error : err, message : err.message})
    } else {
      var apiUrl = env.localHostAuth + '/';
      res.render('users', {user: payload, url: apiUrl});
    }
  });
})

/**
 * GET página de um utilizador
 */
router.get('/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req, res)=>{ 
  const token = '?token=' + req.cookies.token;

  const changed = req.query?.changed ? req.query.changed : false;

  axios.get(env.authAcessPoint + '/' + req.params.id + token)
    .then(response => { 
      console.log(response.data.dados)
      res.render('user', {user: response.data.dados, change: changed});
    })
    .catch(err => {
      res.render('error', {error: err, message: err.message});
    })
})

/**
 * GET histórico de um utilizador
 */
router.get('/history/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req, res)=>{
  const token = '?token=' + req.cookies.token;
  jwt.verify(req.cookies.token, process.env.SECRET_KEY, function(err, payload) {
    if (err) {
      res.render('error', {error : err, message : err.message})
    } else {
      axios.get(env.authAcessPoint + '/' + req.params.id + token)
      .then(response => { 
        const processIds = response.data.dados.history;
        // Construir a URL da API com os parâmetros da query string
        const queryParams = `?ids=${processIds.join(',')}`;
        var apiUrl = env.localHostAPI + '/acordaos' + queryParams;
        res.render('historico', {user: payload, url: apiUrl});
      })
      .catch(err => {
        res.render('error', {error: err, message: err.message});
      })
    }
  });
})

/**
 * GET favoritos de um utilizador
 */
router.get('/favorites/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req, res)=>{
  const token = '?token=' + req.cookies.token;
  jwt.verify(req.cookies.token, process.env.SECRET_KEY, function(err, payload) {
    if (err) {
      res.render('error', {error : err, message : err.message})
    } else {
      axios.get(env.authAcessPoint + '/' + req.params.id + token)
      .then(response => { 
        const processIds = response.data.dados.favorites.map(fav => fav.id);
        let queryParams = `?ids=${processIds.join(',')}`;
        if (processIds.length === 0) {
          queryParams = `?ids=none`
        }
        const objetoConvertido = response.data.dados.favorites.reduce((objetoResultado, objetoAtual) => {
          objetoResultado[objetoAtual.id] = objetoAtual.description;
          return objetoResultado;
        }, {});

        // Construir a URL da API com os parâmetros da query string
        
        var apiUrl = env.localHostAPI + '/acordaos' + queryParams;
        res.render('favoritos', {user: payload, url: apiUrl, favorites: objetoConvertido});
      })
      .catch(err => {
        res.render('error', {error: err, message: err.message});
      })
    }
  });
})

router.get('/disable/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req, res)=>{
  const token = '?token=' + req.cookies.token;
  axios.put(env.authAcessPoint + '/' + req.params.id + '/desativar' + token)
    .then(response => { 
      res.redirect('/users')
    })
    .catch(err => {
      res.render('error', {error: err, message: err.message});
    })
})

router.get('/enable/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req, res)=>{
  const token = '?token=' + req.cookies.token;
  axios.put(env.authAcessPoint + '/' + req.params.id + '/ativar' + token)
    .then(response => { 
      res.redirect('/users')
    })
    .catch(err => {
      res.render('error', {error: err, message: err.message});
    })
})

router.get('/deleteUser/:id', auth.verificaToken({'admin': -1, 'producer': 1, 'consumer': 1}), (req,res)=>{
  console.log('delete user')
  const token = '?token=' + req.cookies.token;
  axios.delete(env.authAcessPoint + '/' + req.params.id + token)
    .then(response => { 
      res.redirect('/users/login')
    })
    .catch(err => {
      res.render('error', {error: err, message: err.message});
    })
})

/*--POST's---------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * POST /login 
 * Envia pedido ao serviço de autenticação para fazer login e gerar token jwt em caso de sucesso
 */
router.post('/login', (req, res) => {
  axios.post(env.authAcessPoint + '/login', req.body)
    .then(response => {
      // colocar o token num cookie e enviar para o cliente
      res.cookie('token', response.data.token)
      res.redirect('/')
    })
    .catch(err => {
      console.log(err.response.data)
      if (err.response.data === 'Unauthorized'){
        res.render('loginForm', {error: 1}) // Wrong password
      } else if (err.response.data.error === 'User is not active'){
        res.render('loginForm', {error: 2}) // User not active
      }
      
    })
})

/**
 * POST /register 
 * Envia pedido ao serviço de autenticação para fazer o registo de um novo utilizador
 */
router.post('/register', (req, res)=>{
  axios.post(env.authAcessPoint + '/register', req.body)
    .then(response => {
      res.redirect('/users/login')
    })
    .catch(err => {
      if (err.response.data.error === 'Email already in use'){
        res.render('register', {error: 1})
      }
      res.render('error', {error: err, message: err.message})
    })
})

/**
 * POST /resetPassword 
 * Envia pedido ao serviço de autenticação para mudar palavra passe
 */
router.post('/resetPassword', (req, res)=>{
    const email = req.body.email;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'acordaos2023@gmail.com',
        pass: 'dpqrymxgctzvvmvh',
      },
    });
  
    // Gerar o token de reposição de senha (pode ser um UUID ou qualquer outro método de sua escolha)
    const token = uuidv4();
  
    // Configurar o e-mail a ser enviado
    const mailOptions = {
      from: 'acordaos2023@gmail.com',
      to: email,
      subject: 'Redefinição de senha',
      text: `\n\nRecentemente, houve uma solicitação para alterar a senha da sua conta.\nSe solicitou essa alteração, defina uma nova senha aqui: http://localhost:8003/users/resetPassword=${token} \nSe não fez essa solicitação, pode ignorar este e-mail e a sua senha permanecerá a mesma.`,
    };
  
    // Enviar o e-mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Erro ao enviar e-mail:', error);
        res.send('Ocorreu um erro ao enviar o e-mail. Por favor, tente novamente.');
      } else {
        console.log('E-mail enviado com sucesso:', info.response);
        res.redirect('/users/login');
      }
    });

})

/**
 * POST /redefinePassword
 * Altera a password do utilizador
 */

router.post('/redefinePassword', (req, res) => {
  axios.put(env.authAcessPoint + '/' +req.body.email + '/redefinePassword', req.body)
  .then(resp => {
    console.log(resp)
    res.redirect('/users/login');
  })
  .catch(error => {
    res.render('error', {error : error , message : "Erro a atualizar a password"});
  })
})

/**
 * POST /:id 
 * Envia pedido ao serviço de autenticação para guardar alterações do utilizador
 */
router.post('/:id', auth.verificaToken({'admin': -1, 'consumer': 1, 'producer': 1}), (req, res)=>{ 
  const token = '?token=' + req.cookies.token;

  axios.put(env.authAcessPoint + '/' + req.params.id + token, req.body)
    .then(response => { 
      res.redirect('/users/' + req.params.id + "?changed=true");
    })
    .catch(err => {
      res.render('error', {error: err, message: err.message});
    })
})

module.exports = router;
