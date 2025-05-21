const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2');

const app = express();

// Configuração do handlebars
app.engine('handlebars', engine({
  helpers: {
    eq: (a, b) => a === b
  }
}));

app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware para receber dados do formulário
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Conexão com o banco
const conexao = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'aula'
});

conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log("Conectado no banco de dados!");
});

// Página inicial: formulário de login
app.get('/', function (req, res) {
    res.render('formulario');
});

app.post('/login', function (req, res) {
    const { email, senha } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';
    conexao.query(sql, [email, senha], function (erro, resultados) {
        if (erro) {
            return res.render('formulario', { mensagem: 'Erro ao buscar usuário.' });
        }

        if (resultados.length > 0) {
            const usuario = resultados[0];

            if (usuario.nivel_acesso === 'admin') {
                // Buscar lista de usuários para o admin
                conexao.query('SELECT * FROM usuarios', function (erro2, lista) {
                    if (erro2) {
                        return res.render('formulario', {
                            mensagem: 'Erro ao buscar usuários.',
                            usuario
                        });
                    }

                    res.render('formulario', {
                        mensagem: 'Bem-vindo, administrador!',
                        usuario,
                        listagem: lista
                    });
                });

            } else {
                res.render('formulario', {
                    mensagem: 'Bem-vindo, usuário comum.',
                    usuario
                });
            }

        } else {
            res.render('formulario', { mensagem: 'Usuário ou senha inválidos.' });
        }
    });
});



app.post('/cadastrar', function (req, res) {
    const { email, senha, nivel_acesso } = req.body;

    const sql = 'INSERT INTO usuarios (email, senha, nivel_acesso) VALUES (?, ?, ?)';
    conexao.query(sql, [email, senha, nivel_acesso], function (erro, resultado) {
        if (erro) {
            if (erro.code === 'ER_DUP_ENTRY') {
                return res.render('formulario', { mensagem: 'Erro: este email já está cadastrado.' });
            }
            return res.render('formulario', { mensagem: 'Erro ao cadastrar usuário.' });
        }

        res.render('formulario', { mensagem: 'Usuário cadastrado com sucesso!' });
    });
});

app.listen(8050, () => {
    console.log('Servidor rodando em http://localhost:8050');
});