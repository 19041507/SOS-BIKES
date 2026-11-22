# Perfis completos — implantação e validação

## Estado da entrega

Código integrado nas rotas reais dos dois perfis. Testes unitários/componentes, SQL/RLS isolados, TypeScript, lint e build devem ser executados antes do PR. Isso não comprova funcionamento no projeto Supabase remoto.

Não aplicar a migration antiga `20261121000000_perfil_ciclista_completo.sql` da outra branch junto com esta entrega. Esta branch usa um modelo privado compartilhado novo e preserva a tabela de chat já existente.

## Ambiente remoto necessário

1. Identificar o projeto Supabase de homologação e confirmar que não é produção.
2. Configurar localmente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente desta branch. Não enviar senhas, chaves de serviço ou tokens pelo chat, nem versionar arquivos de ambiente.
3. Disponibilizar acesso autorizado às migrations pelo fluxo da equipe (Supabase CLI autenticada ou SQL Editor). Conferir as migrations já aplicadas, fazer backup apropriado e revisar o SQL antes de aplicar.
4. Aplicar `supabase/migrations/20261126000000_perfis_completos.sql` depois das migrations existentes. Ela cria tabelas privadas, RLS, RPCs e o bucket privado `fotos-perfil` (5 MB, JPG/PNG/WebP). Não tornar o bucket público nem usar service role nas telas.
5. Preparar contas exclusivas de teste: dois ciclistas e dois mecânicos. Criar chamados entre um par para testar acesso de participante e deixar o outro par como terceiros. Não usar dados/documentos/fotos de pessoas reais.
6. Só integrar/publicar o código após a migration e os testes abaixo. Sem migration, o perfil ampliado informa erro de carregamento; não interpretar erro como cadastro vazio. A área geral mantém pedidos e histórico, sem depender do sucesso da consulta opcional de preferências.

## Verificação local automatizada

```bash
npm test
npm run test:db
npm run typecheck
npm run lint
npm run build
git diff --check
```

O harness SQL usa PostgreSQL isolado em memória (PGlite), com contas sintéticas e simulação apenas dos schemas externos Auth/Storage. Executa as migrations reais e verifica grants/RLS/RPCs com troca de papel/identidade. Não testa a API remota de Auth, os tokens JWT nem o serviço de upload do Supabase.

## Roteiro obrigatório com contas reais de teste

- Ciclista e mecânico: editar nome/WhatsApp; recarregar e entrar novamente; conferir nome no cabeçalho e painel. CPF e idade opcionais persistem, ficam privados e CPF é ocultado por padrão.
- Senha: atual errada, nova curta, confirmação diferente e nova igual à atual; sucesso limpa campos sem sair da sessão; depois entrar com a nova e confirmar recusa da anterior. Não registrar senhas.
- Mecânico autônomo salva sem CNPJ. Vinculado exige nome e CNPJ válido, inclusive formato alfanumérico. Conta antiga sem CNPJ mostra pendência, mas continua com acesso aos atendimentos.
- Troca de CNPJ/vínculo exige confirmação antes de limpar endereço/fachada. Cancelar preserva tudo. Cadastrar endereço/fachada da nova oficina depois da troca.
- Fotos: avatar de ambos, fachada do vinculado e bicicleta do ciclista. Testar imagem válida, arquivo disfarçado, acima de 5 MB, substituição, remoção, falha de rede e duas abas. Nunca apagar a imagem ainda referenciada. Conferir expiração do link e negar acesso a terceiro.
- Bicicletas: adicionar várias, editar, anexar foto e remover com confirmação. Locais: salvar, editar, remover; endereços utilizados vêm somente dos próprios chamados. Recarregar e novo login preservam tudo.
- Favoritos: ciclista remove/chama novamente pelo fluxo existente; mecânico salva/remove apenas clientes de seus próprios chamados. Terceiro não consulta a lista nem se torna participante de chat por ser favorito.
- Avaliações: conferir notas reais e média global, inclusive mais de uma página. Conta nova não mostra notas fictícias.
- Mensagens: enviar nos dois sentidos, atualizar e filtrar enviadas/recebidas; manter rascunho em falha. Chamado encerrado permite somente leitura. Terceiros não leem nem enviam. Somente a página de mensagens efetivamente aberta/visível é marcada como lida.
- Acessibilidade: salvar texto ampliado, contraste e movimento reduzido; conferir aplicação na área logada e persistência após login. Outra conta não herda essas preferências.
- Ajuda/status/atividade: nenhuma aprovação fictícia de diretrizes; atividade mostra eventos reais, sem documentos, endereços ou textos de mensagens nos eventos. Não é auditoria completa de cliques.
- Notificações/Instalar app: preservar os testes da entrega anterior, com VAPID, service worker de produção e aparelho compatível. Ativar/receber/desativar push não pode ser confirmado só pelo teste SQL.
- 360 × 640, 390 × 844 e desktop: sem rolagem horizontal, teclado/foco, ícones consistentes e senha abaixo de Dados pessoais. Navegar entre seções conserva rascunhos em memória; recarregar a página descarta rascunhos ainda não salvos.

## Limites conhecidos a conferir na revisão

- Dados empresariais, documentos e fotos são privados nesta versão; não representam verificação de identidade ou vínculo.
- Mensagens e listas são atualizadas sob demanda. Não acrescentar segunda tabela de chat ou prometer atualização instantânea nesta caixa de entrada.
- Falha de transporte após commit pode deixar uma imagem órfã para limpeza posterior. Não apagar imagem nova quando o resultado da transação é incerto.
- O projeto é acadêmico, desenvolvido por estudantes de Administração da FICR, sem serviço comercial ou canal de atendimento.

## Revisão independente e decisões

Revisão textual independente do produto/testes, sem execução de ferramentas pelo revisor. A primeira tentativa ficou aguardando aprovação de ferramenta e não produziu parecer; foi substituída, não contou como revisão adicional. O parecer válido apontou precisão do cursor do chat, envio durante carga inicial e carregamento preso após recarga de lista. Os três foram reproduzidos por testes que falharam e passaram após as correções. O último foi reclassificado de menor para importante pelo efeito de bloquear a interface.

Na revisão do executor também foram corrigidos, com regressões, a permanência de CPF de conta anterior durante troca de identidade, a exclusão de foto ainda referenciada, a limpeza de upload com rollback SQL confirmado e o conflito entre eventos de atividade e exclusão administrativa em cascata de uma conta sem chamados.

Decisões tomadas e custos:

- Chat mantém a regra existente: chamados encerrados são somente leitura; custo: favoritos não permitem reabrir envio em conversa encerrada.
- Modelo privado compartilhado e consulta paginada substituem o rascunho de migration exclusivo do ciclista; custo: não aplicar as duas migrations concorrentes como se fossem a mesma entrega.
- Uma action/RPC com operações explicitamente permitidas concentra validação e sessão; custo: operações futuras precisam atualizar a lista permitida.
- Rascunhos ficam na memória da página por conta, não em armazenamento persistente do navegador; custo: recarregar descarta o que não foi salvo.
- Auth, RLS anterior, envio e favoritos existentes foram preservados e exercitados pelas suítes locais, não certificados em ambiente remoto; custo: homologação com contas reais continua obrigatória.
- Não foi acrescentada exclusão de conta à interface. Foi mantida a integridade da cascata para conta sem chamados; custo: o procedimento administrativo de exclusão continua sendo o existente do projeto.
- Não foi afirmada validação visual em aparelho real nem de corrida entre conexões remotas do Storage; custo: permanecem no roteiro de homologação.
- Links de fotos expiram em cinco minutos; recarregar a página renova os links. Renovação automática não faz parte desta entrega; custo: foto cujo link expirou pode exigir recarga.
- O titular possui permissão de upload no seu bucket privado. Decodificação, remoção de metadados e limites adicionais são aplicados pelo fluxo do app, não são uma inspeção global de qualquer arquivo enviado diretamente à API do Storage. O acesso direto permanece limitado ao titular; custo: não afirmar que APIs externas passam pelo processador do aplicativo.
- Ambiente remoto não identificado e sem credenciais configuradas; custo: nenhuma aplicação remota de migration, criação de contas ou confirmação de persistência/Storage/push em produção foi realizada. O PR não está aprovado para merge por este checklist.
