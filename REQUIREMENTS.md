# Recuperação de senha

**Tipo:** Feature

**User story:** Como usuário que esqueceu a senha, quero solicitar uma redefinição e escolher uma senha nova sozinho, sem precisar acionar o suporte.

## Regras de negócio

- Por privacidade, a mensagem de confirmação após solicitar a redefinição é sempre a mesma, exista ou não uma conta para aquele e-mail — a aplicação nunca revela se um e-mail está cadastrado.
- O link de redefinição expira em 30 minutos após ser gerado.
- Um link só pode ser usado uma vez; usá-lo de novo deve ser tratado como inválido.
- A senha nova segue a mesma regra mínima do cadastro (8 caracteres ou mais).
- **Nota de ambiente de treino:** como este projeto não tem um serviço de e-mail real, o token de redefinição é exibido na própria tela, claramente identificado como um atalho válido só para desenvolvimento/teste — isso não deve existir em produção.

## Critérios de aceite

- Dado que sou um usuário cadastrado, quando solicito a redefinição informando meu e-mail, então recebo a confirmação de que um link foi enviado.
- Dado um e-mail que não existe na base, quando solicito a redefinição, então recebo exatamente a mesma mensagem de confirmação (sem indicar que a conta não existe).
- Dado um link válido e ainda não expirado, quando defino uma senha nova, então consigo entrar com a senha nova e não consigo mais entrar com a antiga.
- Dado um link expirado ou já utilizado, quando tento redefinir a senha, então recebo uma mensagem avisando que o link é inválido ou expirou.
- Dado que deixo o campo de token vazio, quando envio o formulário, então recebo um erro pedindo o token antes de qualquer chamada ao servidor.
- Dado que a confirmação de senha não bate com a senha nova, então recebo um erro de "senhas não coincidem" antes de qualquer chamada ao servidor.

## Fora de escopo

- Envio real de e-mail.
- Notificação de segurança avisando o usuário que a senha foi alterada.
- Histórico ou auditoria de tentativas de redefinição.
