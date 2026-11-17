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
