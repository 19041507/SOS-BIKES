# SOS Bikes

**Socorro sobre duas rodas.** Sistema web que conecta ciclistas com pane mecânica a mecânicos próximos.

Projeto acadêmico do curso de Administração da Faculdade Católica Imaculada Conceição do Recife (FICR), disciplina Práticas em Administração. Os dados exibidos no sistema são fictícios.

## Perfis

- **Ciclista:** informa o defeito e a localização, escolhe um mecânico próximo, confirma a estimativa de preço e tempo, acompanha o atendimento e avalia o serviço.
- **Mecânico:** fica disponível, recebe o chamado, informa preço e tempo estimados, realiza o atendimento e registra o valor final.

## Regras de negócio

- O ciclista escolhe o mecânico na lista (distância e avaliação).
- O mecânico aceita ou recusa. Se recusar, o ciclista volta para a lista.
- Ao aceitar, o mecânico informa preço e tempo estimados; o ciclista confirma antes do atendimento.
- O valor final pode variar. O mecânico registra o valor final e o motivo da variação ao concluir.
- A plataforma retém 10% do valor final de cada serviço concluído.
- O pagamento e a gorjeta são feitos diretamente ao mecânico; o sistema apenas registra.
- Comunicação por mensagem (WhatsApp) ou ligação.

## Como rodar local

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

Para usar o banco localmente, crie um `.env.local` (não vai para o Git) com os mesmos valores configurados na Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://<id-do-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Os dois valores ficam no painel do Supabase, no botão **Connect** da página inicial do projeto. Nunca use a **Secret key** (`sb_secret_...`) no front. Sem esse arquivo o site abre, mas o login responde que não está configurado.

## Testes automatizados

Os testes unitários e de componentes usam Vitest e Testing Library; os fluxos de login, cadastro e pedido de socorro usam Playwright com um Supabase local isolado. Os testes E2E nunca usam o banco remoto.
Para executar os testes E2E, use Node.js 22 ou superior; o SDK do Supabase usado na preparação dos testes requer o WebSocket nativo disponível nessa versão.

```bash
npm test
npm run test:watch
```

Para os testes E2E, instale e inicie o Docker Desktop. O comando `npx` executa a Supabase CLI. No PowerShell, inicie e prepare o banco local:

```powershell
npx supabase start
npx supabase db reset
npx supabase status
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<Anon key exibida pelo comando anterior>"
npm run test:e2e
```

O reset recria o banco local a partir das migrations; as contas de teste são criadas pelo próprio teste. A configuração local desativa a confirmação de e-mail apenas nesse ambiente. O workflow do GitHub Actions executa Vitest e Playwright em Pull Requests.

## Login

O login usa o Supabase Auth (e-mail e senha). No formulário, a pessoa escolhe "Sou ciclista" ou "Sou mecânico"; se a conta for do outro tipo, o login avisa qual opção escolher.

- `/ciclista` só abre para contas de ciclista e `/mecanico` só para contas de mecânico. Quem não está logado volta para o login; quem já está logado e abre o login vai direto para a própria área.
- A sessão fica em cookies e é renovada a cada requisição pelo `src/proxy.ts`.
- **Sair** encerra a sessão e volta para o login.

Para testar, use as contas de demonstração criadas em **Banco de dados → Configurar o banco**.

## Avaliação do ciclista pelo mecânico

Após concluir, o mecânico pode dar de 1 a 5 estrelas ao ciclista e deixar um
comentário opcional. Também pode avaliar pelos detalhes do histórico. Cada
atendimento aceita uma avaliação de cada lado, de forma independente. Nos
detalhes, os dois participantes veem a nota e o comentário; outras contas não
têm acesso. A avaliação não impede a conclusão do serviço nem depende da nota
enviada pelo ciclista.

Aplique a migration
[avaliacoes_ciclistas.sql](supabase/migrations/20261120010000_avaliacoes_ciclistas.sql)
no Supabase **antes do merge e do deploy desta funcionalidade**. Todas as consultas
de chamados passam a incluir essa relação; sem a tabela, o PostgREST retorna erro
e afeta também o pedido de socorro, o painel e o histórico. Confirme a aplicação
no ambiente de destino antes de integrar o código.

Em um banco de teste isolado com as migrations aplicadas, valide as permissões:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/avaliacoes-ciclistas.sql
```

O teste cobre nota sem comentário, avaliação única, bloqueio antes da conclusão,
leitura pelos participantes e bloqueio de terceiros. Os dados de teste são
descartados por `rollback`.

## Termos, privacidade e local do atendimento

As páginas públicas [Termos de Uso](http://localhost:3000/termos) e
[Política de Privacidade](http://localhost:3000/privacidade) estão acessíveis no
login, cadastro e rodapé das áreas internas. O cadastro exige aceite dos termos
no formulário e na action do servidor. A versão aceita e a data gerada no servidor
são enviadas aos metadados de cadastro do Supabase Auth; isso não constitui um
registro de auditoria imutável.

Na primeira vez que o ciclista entra, uma tela explica para que serve a
localização, com **Ativar localização** e **Agora não**; só depois aparece o pedido
de permissão do navegador. A escolha de ter visto a tela fica no `localStorage` do
aparelho. Com a permissão liberada, o app lê a posição ao abrir a área do
ciclista: o ponto aparece no mapa, a lista vem pela distância e o endereço do
pedido já vem preenchido (editável). Sem permissão, o endereço é digitado. O
botão "Usar minha localização" na etapa do endereço serve para tentar de novo.
As coordenadas só ficam no banco quando o pedido é enviado.

Os documentos identificam diretamente o SOS Bikes como projeto acadêmico de
estudantes de Administração da FICR, sem serviço comercial nem canal de
atendimento. Não dependem de variáveis de ambiente para essa identificação e não
descrevem ferramentas locais de desenvolvimento.
O aceite permanece apenas nos metadados do Auth (`termos_versao` e
`termos_aceitos_em`), não em `perfis`, e os links legais permanecem no rodapé de
todas as telas de `AreaLogada`; confirmar essas decisões com o grupo antes da
integração.

O caráter acadêmico não certifica conformidade integral com a LGPD. Antes de uma
eventual operação real, ainda seria necessário definir canal de privacidade e
validar bases legais, retenção, atendimento aos titulares e condições dos
fornecedores.

## Mecânicos favoritos

O ciclista pode salvar ou remover mecânicos na lista de escolha, na tela de
avaliação e nos detalhes de um chamado. A lista **Favoritos**, no menu e no início
da área do ciclista, mantém os mecânicos salvos por conta, inclusive os que estão
indisponíveis. **Chamar novamente** inicia um novo pedido para o mecânico escolhido:
defeito → endereço → confirmar a solicitação. O aceite, a nova estimativa e a
confirmação do ciclista continuam obrigatórios.

Para habilitar a persistência, aplique a nova migration
[mecanicos_favoritos.sql](supabase/migrations/20261120000000_mecanicos_favoritos.sql)
no Supabase depois das anteriores. Ela cria a tabela e a consulta de favoritos,
isola os registros por ciclista e bloqueia novos pedidos para mecânicos
indisponíveis. Sem essa migration, o sistema mostra o erro ao carregar favoritos.

Esta funcionalidade depende da aprovação do grupo para entrar na versão.
A migration deve ser aplicada no Supabase **antes do merge/deploy**. Sem ela,
somente os controles de favoritos ficam indisponíveis; o pedido normal continua
funcionando e não vira uma ação de “Recarregar favoritos”.

A política de disponibilidade afeta todo pedido, com ou sem favorito: o banco
recusa inserir um chamado para um mecânico indisponível. Não há consulta extra
antes do envio; somente um insert recusado por RLS consulta a lista para exibir
um aviso de indisponibilidade. Os demais erros mantêm a mensagem normal.

Para validar as regras de isolamento e disponibilidade do banco, execute
[mecanicos-favoritos.sql](supabase/tests/mecanicos-favoritos.sql) em um banco de teste
com as migrations aplicadas; o script usa uma transação e desfaz os dados no final:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/mecanicos-favoritos.sql
```

Use somente um banco de teste com o schema de Auth do Supabase e os papéis
`authenticated`/`anon`. Este teste deve ser executado antes de liberar a migration;
não o rode no banco de produção.

## Perfil público do mecânico

Usuários autenticados podem consultar `/mecanicos/<id>` para ver as especialidades,
serviços, região de atendimento, fotos escolhidas pelo mecânico, avaliações e
comentários que o ciclista autorizou publicar. Os comentários existentes permanecem
privados por padrão; o ciclista pode retirar a autorização nos detalhes do chamado.
Fotos usam um bucket público, então qualquer pessoa com a URL do arquivo pode vê-las.

Para habilitar o perfil, aplique
[perfil_publico_mecanico.sql](supabase/migrations/20261126000000_perfil_publico_mecanico.sql)
no Supabase antes do merge/deploy. A migration adiciona campos e fotos, ajusta a
permissão de atualização de perfis e cria consultas autenticadas com retorno
limitado. Valide as regras em um banco de teste com as migrations aplicadas:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/perfil-publico-mecanico.sql
```

O teste desfaz os dados ao final; não o execute no banco de produção.

## Cadastro

Em `/cadastro` (link "Cadastre-se" no login), a pessoa escolhe o perfil e informa nome, WhatsApp, e-mail e senha (mínimo de 6 caracteres). O mecânico também pode informar a oficina; em branco, aparece como "Mecânico autônomo". O perfil no banco é criado automaticamente com esses dados.

A confirmação de e-mail fica **ligada**: só entra quem tem acesso ao e-mail informado. O e-mail tem o visual do site e, ao clicar em "Confirmar meu e-mail", a pessoa entra direto na própria área (rota `/auth/confirmar`). Se o link estiver vencido ou já tiver sido usado, o login mostra um aviso.

### Configurar o e-mail de confirmação (uma vez, no painel do Supabase)

1. **Authentication → Sign In / Providers → Email**: deixar **Confirm email** ligado.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://sos-bikes.vercel.app`
   - **Redirect URLs**: `https://sos-bikes.vercel.app/**`, `https://sos-bikes-*-19041507s-projects.vercel.app/**` e `http://localhost:3000/**`
3. **Authentication → Emails → Confirm signup**:
   - **Subject**: `Confirme seu cadastro no SOS Bikes`
   - **Body**: colar o conteúdo de `supabase/templates/confirmar-cadastro.html`

O link do e-mail sempre abre o site de produção (Site URL), inclusive para quem se cadastrou num preview: o banco é o mesmo, então a conta funciona em todos os ambientes.

O envio padrão do Supabase permite poucos e-mails por hora. Para a apresentação, vale configurar um SMTP próprio (ex.: Resend, gratuito) em **Authentication → Emails → SMTP Settings**.

As contas de demonstração usam e-mails que não existem; crie-as em **Authentication → Users → Add user** com **Auto Confirm User** marcado (ver **Banco de dados → Configurar o banco**).

## Recuperação de senha

Depois de uma tentativa com e-mail ou senha incorretos, o login mostra **"Esqueci minha senha"**, que leva a `/recuperar-senha`, que envia um link por e-mail. A resposta é a mesma com ou sem conta, para não revelar quais e-mails estão cadastrados. O link abre `/auth/confirmar?type=recovery`, que cria a sessão e leva a `/nova-senha`. Ao salvar, a pessoa sai da conta e volta ao login com o aviso "Senha alterada". Link vencido ou já usado volta para `/recuperar-senha` com um aviso. `/nova-senha` sem a sessão do link também volta para lá.

### Configurar o e-mail de redefinição (uma vez, no painel do Supabase)

**Authentication → Emails → Reset password**:
- **Subject**: `Redefina sua senha do SOS Bikes`
- **Body**: colar o conteúdo de `supabase/templates/redefinir-senha.html`

Sem esse template, o e-mail padrão do Supabase não leva à tela de senha nova.

## Notificações (Web Push)

Com o app fechado, o mecânico é avisado de chamado novo e de cancelamento; o ciclista, de chamado aceito e de quando o mecânico chega; e os dois, de mensagens no chat. A pergunta para ativar aparece ao ligar "Disponível" (mecânico) e depois do primeiro pedido (ciclista). No iPhone só funciona com o app instalado na tela inicial (iOS 16.4+).

Como funciona: o Supabase chama `/api/notificacoes` (Database Webhooks) quando um chamado é criado ou muda e quando chega mensagem; a rota busca as inscrições de quem deve receber (`inscricoes_push`) e envia com `web-push`. O `public/sw.js` mostra o aviso (também com o app aberto) e abre o app ao tocar; dentro do app, além do aviso na tela, toca um som curto.

### Configurar (uma vez)

1. **Chaves VAPID**: rodar `npx web-push generate-vapid-keys` e guardar as duas.
2. **Vercel → Settings → Environment Variables** (Production, Preview e Development):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: a chave pública
   - `VAPID_PRIVATE_KEY`: a chave privada
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Project Settings → API Keys → `service_role` (secreta: ignora o RLS)
   - `NOTIFICACOES_SEGREDO`: um texto aleatório longo (ex.: `openssl rand -hex 32`)
   - Depois, refazer o deploy.
3. **Supabase → Database → Webhooks → Create a new hook** (dois hooks):
   - `chamados`: tabela `chamados`, eventos **Insert** e **Update**
   - `mensagens`: tabela `mensagens`, evento **Insert**
   - Nos dois: tipo **HTTP Request**, método **POST**, URL `https://sos-bikes.vercel.app/api/notificacoes`, cabeçalho `Authorization` = `Bearer <NOTIFICACOES_SEGREDO>`.
4. Aplicar a migration `supabase/migrations/20261125000000_notificacoes.sql`.

**Diagnóstico:** ao ativar, o app manda um aviso de teste e mostra o erro se não conseguir. E cada chamada do webhook guarda o resultado (aparelhos inscritos, enviados e erros por aparelho):

```sql
select created, status_code, left(content::text, 300) as resposta
from net._http_response order by created desc limit 5;
```

`401` = cabeçalho `Authorization` errado (precisa de `Bearer `); `"inscricoes":0` = a pessoa não ativou; erro `403` = chaves VAPID diferentes das usadas ao ativar (ativar de novo resolve).

O webhook aponta para uma URL só (produção): como o banco é o mesmo para `dev`, previews e produção, os avisos são enviados pela produção. Para testar antes do release, trocar a URL do webhook pela da `dev` por um tempo.

## Banco de dados (Supabase)

| Tabela | Conteúdo |
|---|---|
| `perfis` | Um por usuário do Auth: tipo (ciclista ou mecânico), nome, telefone, oficina e disponibilidade. Para mecânicos, também guarda especialidades, serviços e bairro/região de atendimento. Criado automaticamente no cadastro. |
| `perfil_mecanico_fotos` | Fotos do perfil e dos trabalhos, com metadados; os arquivos ficam em um bucket público e podem ser acessados por URL. |
| `chamados` | Pedido do ciclista para o mecânico escolhido, com status, estimativa, valor final, comissão de 10% (calculada pelo banco) e o horário de cada etapa. |
| `avaliacoes` | Nota, comentário e gorjeta registrada, uma por chamado concluído. O comentário só aparece no perfil do mecânico com autorização explícita do ciclista. |

Status do chamado: `aguardando` → `aceito` → `a_caminho` → `em_atendimento` → `concluido`, ou encerrado como `recusado`, `cancelado` ou `expirado`.

O próprio banco garante as regras de negócio, mesmo que alguém chame a API direto:
- cada pessoa só vê os próprios chamados; ciclistas veem os mecânicos, e cada lado vê o contato da outra pessoa de um chamado em comum;
- só o mecânico aceita, recusa, informa preço e tempo, chega e conclui; só o ciclista confirma, cancela e avalia;
- aceitar exige preço e tempo; valor final diferente da estimativa exige motivo; cancelar exige motivo;
- um ciclista tem no máximo um chamado em andamento;
- ninguém troca o próprio tipo de perfil.

O ciclista e o mecânico recebem as mudanças de status em tempo real (Supabase Realtime na tabela `chamados`).

A função `mecanicos_disponiveis()` devolve a lista que o ciclista vê: só mecânicos marcados como disponíveis, com a nota média e os totais de avaliações e atendimentos (sem expor as avaliações em si).

### Como um chamado acontece

1. O mecânico liga **Disponível** no painel e passa a aparecer para os ciclistas.
2. O ciclista escolhe o defeito, informa onde está e solicita um mecânico da lista.
3. O chamado aparece na hora no painel do mecânico, que tem 60 segundos para aceitar (informando preço e tempo) ou recusar. Sem resposta, o chamado expira e o ciclista volta para a lista.
4. O ciclista confirma ou escolhe outro mecânico; o mecânico avisa que chegou e, ao concluir, registra o valor final.
5. O ciclista avalia e, se quiser, registra a gorjeta.

Para ver os dois lados ao mesmo tempo, entre como ciclista num navegador (ou aba anônima) e como mecânico em outro.

### Configurar o banco (uma vez)

1. **Estrutura:** no painel do Supabase, abrir **SQL Editor** e rodar, **em ordem**, cada arquivo de `supabase/migrations` (colar o conteúdo e clicar em **Run**). Cada migration roda uma vez só; ao atualizar o projeto, rode apenas as novas.
2. **Contas de demonstração:** em **Authentication → Users → Add user → Create new user**, criar uma conta para o ciclista e outra para o mecânico, com **Auto Confirm User** marcado.
3. **Perfis e histórico:** abrir `supabase/scripts/contas-de-demonstracao.sql`, trocar os dois e-mails do topo pelos usados no passo 2, colar no **SQL Editor** e clicar em **Run**. A mensagem final confirma as contas e os 4 chamados de histórico.

Uma mudança no banco é sempre uma migration nova em `supabase/migrations` (nunca editar uma já aplicada), acompanhada da atualização de `src/lib/supabase/database.types.ts`.

## Organização do repositório

- `main`: produção. Só recebe a `dev` depois de testada.
- `dev`: integração e testes.
- `feat/*`, `fix/*`, `chore/*`: uma branch por funcionalidade ou correção, criada a partir da `dev`.

Todo PR vai para a `dev`. A `main` só recebe PR vindo da `dev`, seguido de uma tag de versão (`vX.Y.Z`).

Todo PR passa pelo CI (GitHub Actions): checagem de tipos, lint e build. Para rodar o mesmo localmente antes de abrir o PR:

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy (Vercel)

O projeto usa a configuração padrão da Vercel para Next.js, sem arquivo de configuração extra. A versão do Node vem do campo `engines` do `package.json`.

| Branch | Ambiente |
|---|---|
| `main` | Produção (site oficial) |
| `dev` | Preview (ambiente de teste) |
| PRs e demais branches | Preview com link próprio, comentado no PR |

### Conectar o repositório (uma vez)

1. Em [vercel.com/new](https://vercel.com/new), importar `19041507/SOS-BIKES` (autorizar o app da Vercel no GitHub, se pedir).
2. Framework: Next.js (detectado automaticamente). Manter os comandos padrão.
3. Em **Settings → Git**, conferir que a **Production Branch** é `main`.
4. Opcional: em **Settings → Domains**, adicionar um domínio para a branch `dev` (ex.: `dev-sos-bikes.vercel.app`) para ter um link fixo do ambiente de teste.
