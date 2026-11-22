# Verificação do Meu perfil

Entrega sem alteração de schema, baseada na dev 402be9f. Os extras permanecem separados na branch de perfil completo; esta entrega não os remove da prévia nem anuncia que estão implementados.

## Automatizado local

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

Testes usam componentes reais com dublês apenas nas fronteiras Auth, banco e navegador. Não comprovam configuração ou entrega de push no Supabase remoto. Para executar os testes, usar Node 20.19+, 22.12+ ou 24+ (tooling Vite/Vitest); a aplicação mantém o requisito de runtime existente.

## Contas reais (pendente de ambiente configurado)

1. Ciclista e mecânico: abrir o perfil, alterar nome/WhatsApp (e oficina no mecânico), salvar; verificar cabeçalho, painel, recarga e nova sessão. Oficina vazia mantém autônomo.
2. Nova senha curta e confirmação divergente: erro no campo, sem requisição. Conferir mostrar/ocultar nos três campos.
3. Senha atual errada: “Senha atual incorreta.”. Nova igual à anterior: “Use uma senha diferente da atual.”. Senha fraca: “Senha fraca. Use letras e números.”.
4. Sucesso: toast “Senha alterada.”, campos vazios, permanece logado. Sair; entrar com senha nova funciona, antiga não. Não usar credenciais reais em logs ou fixtures.
5. Notificações: ativar por toque; receber chamado/mensagem com tela bloqueada; desativar e confirmar que os novos avisos não chegam neste navegador. Outro dispositivo não deve ser desativado.
6. Permissão bloqueada: apenas instrução; iPhone não instalado: link leva a #instalar-app; sem suporte/chave pública: card ausente. A instalação continua disponível onde suportada.
7. Falhas de rede: não mostrar sucesso; preservar rascunhos e permitir tentar novamente. Voltar à aba após mudar permissão reconsulta o estado.
8. Conferir em 390 px e desktop, teclado e nomes longos, sem rolagem horizontal.

## Configuração

Necessárias as variáveis Supabase públicas da aplicação e configuração de Web Push da dev (chaves VAPID, service worker em produção e webhooks já previstos pelo #23). Esta entrega não cria nem aplica migrations. Não compartilhar service_role, senhas ou chave VAPID privada no chat.

## Revisão independente

Corrigidas duas condições com regressões: reautenticação em cliente isolado sem escrever cookies; e desativação parcial de push sem afirmar recebimento ativo. O estado ativo agora exige inscrição local e registro acessível à conta no servidor. Não há alteração do RLS.

Observação menor mantida para respeitar o texto do card: erros retornados na reautenticação recebem “Senha atual incorreta.”; distinguir limites/indisponibilidade retornados pelo Auth pode ser refinamento futuro. Promessas rejeitadas recebem erro genérico recuperável.
