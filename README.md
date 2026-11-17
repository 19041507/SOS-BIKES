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

## Como rodar

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Organização do repositório

- `main`: versão estável.
- `dev`: integração das funcionalidades.
- `feat/*`, `fix/*`: uma branch por funcionalidade ou correção, criada a partir da `dev`.
