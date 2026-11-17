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

Os dois valores ficam no painel do Supabase, no botão **Connect** da página inicial do projeto. Nunca use a **Secret key** (`sb_secret_...`) no front.

## Banco de dados (Supabase)

| Tabela | Conteúdo |
|---|---|
| `perfis` | Um por usuário do Auth: tipo (ciclista ou mecânico), nome, telefone, oficina e disponibilidade. Criado automaticamente no cadastro. |
| `chamados` | Pedido do ciclista para o mecânico escolhido, com status, estimativa, valor final, comissão de 10% (calculada pelo banco) e o horário de cada etapa. |
| `avaliacoes` | Nota, comentário e gorjeta registrada, uma por chamado concluído. |

Status do chamado: `aguardando` → `aceito` → `a_caminho` → `em_atendimento` → `concluido`, ou encerrado como `recusado`, `cancelado` ou `expirado`.

O próprio banco garante as regras de negócio, mesmo que alguém chame a API direto:
- cada pessoa só vê os próprios chamados; ciclistas veem os mecânicos, e cada lado vê o contato da outra pessoa de um chamado em comum;
- só o mecânico aceita, recusa, informa preço e tempo, chega e conclui; só o ciclista confirma, cancela e avalia;
- aceitar exige preço e tempo; valor final diferente da estimativa exige motivo; cancelar exige motivo;
- um ciclista tem no máximo um chamado em andamento;
- ninguém troca o próprio tipo de perfil.

O ciclista e o mecânico recebem as mudanças de status em tempo real (Supabase Realtime na tabela `chamados`).

### Configurar o banco (uma vez)

1. **Estrutura:** no painel do Supabase, abrir **SQL Editor**, colar o conteúdo de `supabase/migrations/20261117000000_estrutura_inicial.sql` e clicar em **Run**.
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
