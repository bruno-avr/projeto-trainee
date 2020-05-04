const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const handlebars = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs')
const Usuario = require('./models/Usuario');
const app = express();
const passport = require('passport');
const {acessos} = require('./helpers/acessos');
require('./config/auth')(passport);
app.use(express.json());
// Confugaração
    // SESSAO
        app.use(session({
            secret: "projetoNB",
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(flash());
    // Middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.user = req.user || null;
            next();
        })
const urlencodeParser=bodyParser.urlencoded({extended:false});
const sql=mysql.createConnection({
   host:'localhost',
   user:'root',
   password:'coxinha12',
   port:3306
});
// escolhe qual db será usado
sql.query("use crud");

//Template engine
app.engine("handlebars",handlebars({defaultLayout:'main'}));
app.set('view engine','handlebars');

//Paginas estáticas
app.use('/css',express.static('css'));
app.use('/js',express.static('js'));
app.use('/img',express.static('img'));

//Rotas
app.get("/:id?", function(req,res){
	if(!req.params.id){
		let query = "SELECT * FROM produtos order by id"

	    sql.query(query, function(err,results,fields) {
	        res.render('index',{data:results});
	    })
	}else{
		let values = '%' + req.params.id + '%'

        let query = "SELECT * FROM produtos where nome LIKE ? order by id"

	    sql.query(query, values, function(err,results,fields) {
	        res.render('index',{data:results, busca:req.params.id});
	    })
    }
});
app.post("/adicionar",urlencodeParser,function(req,res){
	let nome = req.body.nome
    let desc = req.body.descricao
    let valor = req.body.valor
    let qntd = req.body.quantidade

    let values = [[nome, desc, valor, qntd]]

    let query = "INSERT INTO produtos (nome, descricao, valor, quantidade) VALUES ?"

    sql.query(query, [values], function(err) {
        if (err) throw err
    })
    res.render('adicionar',{nome:req.body.nome});
});

app.post("/vender",urlencodeParser,function(req,res){
    let id = req.body.idProdutoVenda
    let nome = req.body.nomeVenda
	let qntdEstoque = req.body.quantidadeEstoqueVenda
    let qntd = req.body.quantidadeVenda
    
    let transaction = "INSERT INTO transacoes (id, nome, quantidade) VALUES ?"

    sql.query(transaction, [[[id, nome, qntd]]], function (err) {
        if (err) throw err;
    })

    let values = [(qntdEstoque - qntd), id];

    let query = "UPDATE produtos SET quantidade = ? WHERE id = ?"

    sql.query(query, values, function(err) {
        if (err) throw err
    })
    res.render('vender');
});

app.post("/editarEstoque",urlencodeParser,function(req,res){
	let id = req.body.idProdutoEstoque
	let qntd = req.body.quantidadeEstoque

    let values = [qntd, id];

    let query = "UPDATE produtos SET quantidade = ? WHERE id = ?"

    sql.query(query, values, function(err) {
        if (err) throw err
    })
    res.render('editarEstoque');
});

app.post("/editar",urlencodeParser,function(req,res){
	let id = req.body.idProdutoEditar
	let nome = req.body.nomeEditar
    let desc = req.body.descricaoEditar
    let valor = req.body.valorEditar

    let values = [nome, desc, valor, id];

    let query = "UPDATE produtos SET nome = ?, descricao = ?, valor = ? WHERE id = ?"

    sql.query(query, values, function(err) {
        if (err) throw err
    })
    res.render('editar');
});

app.get("/excluir/:id",function(req,res){
	let values = req.params.id

    let query = "DELETE FROM produtos WHERE id = ?"

    sql.query(query, values, function(err) {
        if (err) throw err
    })
    res.render('excluir');
});

app.post("/transacoes", urlencodeParser, function (req, res) {

    let query = "SELECT * FROM transacoes";

    sql.query(query, function(err, results, fields) {
        res.render('transacoes', {data: results});
    })
})

app.post("/home", urlencodeParser, function (req, res) {
    res.redirect('/')
})

app.post('/adicionarUsuario', function(req, res) {
    //verifica senha
    if (req.body.senha != req.body.senha2) {
        res.send('Msg diverge');
    } 
    
    // Procura algum usuario com o login desejado
    Usuario.findAll({
        where: {
            login: req.body.login
        }
    }).then(function(usuario) {
        if(usuario.length > 0) {  // verifica se já existe usuario com esse login
            res.send('login já está sendo utilizado');
        }else{
            // gera senha
            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(req.body.senha, salt, (erro, hash) => { //cria hash
                    if(erro) {
                        res.send('houve um erro');
                    }
                    
                    // cria um usuario com os dados já conferidos
                    Usuario.create({
                        nome: req.body.nome,
                        login: req.body.login,
                        senha: hash,
                        tipo: req.body.tipo
                    }).then(function() {
                        res.send('usuario criado com sucesso');
                    }).catch(function(erro) {
                        res.send('erro ao criar o usuario');
                    });
                })
            })
        }
    })
});

//Abrir servidor
app.listen(8000,function(req,res){
   console.log('Servidor aberto!');
});