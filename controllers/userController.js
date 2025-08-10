const userModel = require('../models/userModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { enviarEmail } = require('../services/emailService.js');
const {
  verificaAcessoLiberado,
} = require('../middlewares/verificaTesteGratuito.js');

class UserController {
  async buscarUsers(req, res) {
    const { email, senha } = req.body;
    const assinatura = req.query.assinatura == 'true';

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

      const acesso_liberado = await verificaAcessoLiberado(usuario);

      if (!acesso_liberado && !assinatura) {
        return res.status(403).json({
          sucesso: false,
          erro: 'Seu acesso expirou. Acesse a página de pagamento para renovar.',
        });
      }

      // Geração de token
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          tenant_id: usuario.tenant_id,
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
          tenant_id: usuario.tenant_id,
          acesso_liberado,
        },
        value: {
          token,
          tenant_id: usuario.tenant_id,
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
    const { nome, email, telefone, senha, inicio_teste_gratis } = req.body;

    try {
      if (!nome || !email || !telefone || !senha) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Todos os campos são obrigatórios.',
        });
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10);

      const nomePart = nome.substring(0, 4).toLowerCase().replace(/\s/g, '');
      const emailPart = email.split('@')[0].substring(0, 4).toLowerCase();
      const telefonePart = telefone.replace(/\D/g, '').substring(0, 4);
      const tenant_id = `${nomePart}${emailPart}${telefonePart}`;

      await userModel.criarUsuario({
        nome,
        email,
        telefone,
        senha: senhaCriptografada,
        tenant_id,
        inicio_teste_gratis,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Usuário criado com sucesso!',
        tenant_id,
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

      const link = `http://www.gcalendar.com.br/redefinir-senha?token=${token}`;
      const html = `
      <p>Olá,</p>
      <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este link é válido por 1 hora.</p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `;

      await enviarEmail(email, '🔐 Redefinição de Senha - G-Calendar', html);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'E-mail de recuperação enviado com sucesso!',
      });
    } catch (erro) {
      console.error('Erro em esqueciSenha:', erro);
      return res
        .status(500)
        .json({ sucesso: false, erro: 'Erro ao enviar e-mail.' });
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
