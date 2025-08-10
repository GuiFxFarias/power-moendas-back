const { Router } = require('express');
const userController = require('../controllers/userController');

const router = Router();

// ===== ROTA PÚBLICA =====
// Login de usuario (SEM middleware de autenticação)
router.post('/login', userController.buscarUsers);
// Cadastrar usuário
router.post('/cadastra', userController.criarUsers);
// Esqueci a senha
router.post('/esqueci-senha', userController.esqueciSenha);
// Redefinir senha
router.post('/redefinir-senha', userController.redefinirSenha);

// USUÁRIOS
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.status(200).json({ sucesso: true, mensagem: 'Logout efetuado' });
});

module.exports = router;
