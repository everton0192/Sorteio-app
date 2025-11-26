const express = require('express');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal - formulário para adicionar participante
app.get('/', async (req, res) => {
  res.render('index', { title: 'Sorteio - Registrar' });
});

// Criar participante (inserir no DB)
app.post('/participants', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.redirect('/?error=empty');
    }
    const sql = 'INSERT INTO participants (name) VALUES (?)';
    await db.query(sql, [name.trim()]);
    res.redirect('/participants');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao inserir participante');
  }
});

// Listar participantes
app.get('/participants', async (req, res) => {
 try {
    const [rows] = await db.query('SELECT * FROM participants ORDER BY created_at DESC');

    // Formatando as datas
    const participants = rows.map(p => {
      return {
        ...p,
        created_at_formatted: new Date(p.created_at).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        })
      };
    });

    res.render('participants', { participants });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter participantes');
  }
});

// Página editar participante (form)
app.get('/participants/:id/edit', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM participants WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Participante não encontrado');
    res.render('edit', { participant: rows[0], title: 'Editar Participante' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
});

// Atualizar participante (PUT via method-override)
app.put('/participants/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name || !name.trim()) return res.redirect(`/participants/${id}/edit?error=empty`);
    const sql = 'UPDATE participants SET name = ? WHERE id = ?';
    await db.query(sql, [name.trim(), id]);
    res.redirect('/participants');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar');
  }
});

// Deletar participante (POST via method-override ou form)
app.delete('/participants/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM participants WHERE id = ?', [id]);
    res.redirect('/participants');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao excluir');
  }
});




// Página do sorteio
app.get('/draw', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participants ORDER BY created_at DESC');
    res.render('draw', { participants: rows, title: 'Sorteio' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
});

// Realizar sorteio (pega um participante aleatório)
app.post('/draw', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participants');
    if (rows.length === 0) {
      return res.render('draw', { participants: [], message: 'Não há participantes para sortear.' });
    }
    // escolha randômica
    const winner = rows[Math.floor(Math.random() * rows.length)];
    res.render('draw', { participants: rows, winner, title: 'Sorteio - Resultado' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao realizar sorteio');
  }
});

// Servidor

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta:${PORT}`);
});