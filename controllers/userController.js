const userModel = require('../models/userModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class UserController {
  async buscarUsers(req, res) {
    const { email, senha } = req.body;

    try {
      if (!email || !senha) {
        return res.status(400).json({
          sucesso: false,
          erro: 'E-mail e senha são obrigatórios',
        });
      }

      const resposta = await userModel.buscarUsers(email);

      if (!resposta || resposta.length === 0) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Usuário não encontrado',
        });
      }

      const usuario = resposta[0];
      const senhaValida = await bcrypt.compare(String(senha), usuario.senha);

      if (!senhaValida) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Senha incorreta',
        });
      }

      // Geração de token
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const expiration = new Date(Date.now() + 1000 * 60 * 60);

      return res.status(200).json({
        sucesso: true,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
        },
        value: {
          token,
          expiration,
        },
      });
    } catch (erro) {
      console.error('Erro ao buscar usuário:', erro);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
      });
    }
  }

  async criarUsers(req, res) {
    const { nome, email, telefone, senha } = req.body;

    try {
      if (!nome || !email || !telefone || !senha) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Todos os campos são obrigatórios.',
        });
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10);

      await userModel.criarUsuario({
        nome,
        email,
        telefone,
        senha: senhaCriptografada,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Usuário criado com sucesso!',
      });
    } catch (erro) {
      console.error('Erro ao criar usuário:', erro);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno ao cadastrar usuário.',
      });
    }
  }

  async esqueciSenha(req, res) {
    const { email } = req.body;

    try {
      if (!email) {
        return res
          .status(400)
          .json({ sucesso: false, erro: 'E-mail é obrigatório.' });
      }

      const usuarios = await userModel.buscarUsers(email);
      if (!usuarios || usuarios.length === 0) {
        return res
          .status(404)
          .json({ sucesso: false, erro: 'Usuário não encontrado.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

      await userModel.salvarTokenRecuperacao(email, token, expira);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Token de recuperação gerado com sucesso!',
        token, // Retorna o token na resposta (em produção, remova esta linha)
      });
    } catch (erro) {
      console.error('Erro em esqueciSenha:', erro);
      return res
        .status(500)
        .json({ sucesso: false, erro: 'Erro interno do servidor.' });
    }
  }

  async redefinirSenha(req, res) {
    const { token, novaSenha } = req.body;

    try {
      if (!token || !novaSenha) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Token e nova senha são obrigatórios.',
        });
      }

      const usuario = await userModel.buscarPorToken(token);
      if (!usuario) {
        return res
          .status(400)
          .json({ sucesso: false, erro: 'Token inválido.' });
      }

      const expiracao = new Date(usuario.token_expira_em);
      if (Date.now() > expiracao) {
        return res
          .status(400)
          .json({ sucesso: false, erro: 'Token expirado.' });
      }

      const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
      await userModel.atualizarSenha(usuario.email, senhaCriptografada);

      return res
        .status(200)
        .json({ sucesso: true, mensagem: 'Senha redefinida com sucesso.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ sucesso: false, erro: 'Erro interno.' });
    }
  }

  async usuarioAtual(req, res) {
    try {
      const { usuario_id, tenant_id } = req;

      // Se quiser consultar dados no banco:
      // const usuario = await clienteModel.buscarPorId(usuario_id, tenant_id);
      // return res.status(200).json(usuario);

      res.status(200).json({
        id: usuario_id,
        tenant_id,
      });
    } catch (err) {
      console.error('Erro ao buscar usuário atual:', err);
      res.status(500).json({ erro: 'Erro interno' });
    }
  }
}

module.exports = new UserController();
