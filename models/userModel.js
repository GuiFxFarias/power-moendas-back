const conexao = require('../conexao.js');

class UserModel {
  executaQuery(sql, parametros) {
    return new Promise((res, rej) => {
      conexao.query(sql, parametros, (error, results) => {
        if (error) {
          console.log('Erro na query: ' + error);
          return rej(error);
        }
        return res(results);
      });
    });
  }

  buscarUsers(email) {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    return this.executaQuery(sql, [email]);
  }

  buscarPorEmailETenant(email, tenant_id) {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    return this.executaQuery(sql, [email, tenant_id]);
  }

  buscarPorTenant(tenant_id) {
    const sql = 'SELECT * FROM usuarios WHERE tenant_id = ?';
    return this.executaQuery(sql, [tenant_id]);
  }

  criarUsuario({ nome, email, telefone, senha }) {
    const sql = `
    INSERT INTO usuarios (nome, email, telefone, senha)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    return this.executaQuery(sql, [nome, email, telefone, senha]);
  }

  salvarTokenRecuperacao(email, token, expira) {
    const sql = `
    UPDATE usuarios
    SET token_recuperacao = ?, token_expira_em = ?
    WHERE email = ?
  `;
    return this.executaQuery(sql, [token, expira, email]);
  }

  buscarPorToken(token) {
    const sql = `SELECT * FROM usuarios WHERE token_recuperacao = ?`;
    return this.executaQuery(sql, [token]).then((res) => res[0]);
  }

  atualizarSenha(email, novaSenha) {
    const sql = `
    UPDATE usuarios
    SET senha = ?, token_recuperacao = NULL, token_expira_em = NULL
    WHERE email = ?
  `;
    return this.executaQuery(sql, [novaSenha, email]);
  }
}

module.exports = new UserModel();
