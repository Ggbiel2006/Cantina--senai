# Cantina · Sistema de pedidos (protótipo funcional em React)

Dois sistemas separados no mesmo projeto, feitos a partir do wireframe "Organizando os pedidos da cantina":

| Sistema | Endereço | Para quem | Telas |
|---|---|---|---|
| **Aluno** | `/aluno/` | Estudantes (pensado para celular, também funciona em tablet e computador) | Cardápio, Revisão do pedido, Acompanhamento, Meus pedidos, Perfil |
| **Cantina** | `/cantina/` | Atendente (tablet no balcão 1, também funciona em computador e celular) | Painel com Recebidos / Em preparo / Prontos, Disponibilidade, Entregues |

## Como rodar

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`):

- `http://localhost:5173/aluno/` → sistema do aluno
- `http://localhost:5173/cantina/` → sistema da cantina

Abra os dois **em abas do mesmo navegador**. O pedido confirmado pelo aluno aparece na hora no painel, e cada mudança de status no painel atualiza a tela do aluno.

### Testar no celular
O `npm run dev` também mostra um endereço "Network" (ex.: `http://192.168.0.10:5173`). Com o celular no mesmo Wi-Fi, abra `.../aluno/` nele para ver a versão para celular.
Observação: os dados ficam salvos no navegador (localStorage), então o pedido feito no celular só aparece num painel aberto **no mesmo aparelho**. Para a apresentação, use as duas abas no mesmo navegador, ou o modo celular do DevTools (F12 → ícone de celular).

## Roteiro do teste (tarefa da atividade)
"Você deseja comprar dois sucos e um sanduíche. Antes de confirmar, decide remover um dos sucos. Depois, precisa descobrir quando poderá retirar o pedido."

1. **Aluno:** adicione 2 sucos e 1 sanduíche → "Ver pedido →".
2. Na revisão, diminua o suco para 1 → "Confirmar pedido · R$ 10,00".
3. A tela mostra o número **#A27**, a previsão de retirada e as etapas.
4. **Cantina:** "Iniciar preparo →" → "Marcar como pronto →".
5. **Aluno:** chega o aviso "Pedido #A27 pronto! Vá ao balcão 1." (com vibração no celular).
6. **Cantina:** "Confirmar entrega ✓" → confere número e nome → "Entregar e receber".

## Estados de erro e sucesso
- **Item esgota durante o pedido:** com o item no carrinho, desligue-o na Disponibilidade do painel. Ao confirmar, o aluno vê o aviso e o item é retirado do pedido.
- **Últimas unidades:** o suco tem 5 unidades; cada pedido diminui a contagem. Quando chega a zero, ele fica "Esgotado".
- **Cantina pausou os pedidos:** botão "Pausar pedidos" no painel.
- **Horário encerrado:** "Encerrar horário de pedidos" no rodapé do painel.
- **Sucesso:** confirmação com número de retirada e aviso de pedido pronto.

"Reiniciar dados" no rodapé do painel apaga os pedidos e volta ao início.

## Estrutura

```
index.html                 página inicial com os links dos dois sistemas
aluno/index.html           entrada do sistema do aluno
cantina/index.html         entrada do sistema da cantina
public/img/                ilustrações dos alimentos (SVG)
src/shared/                código usado pelos dois sistemas
  produtos.js              cardápio, preços e dados de retirada
  store.js                 "banco de dados" compartilhado + regras (enviar, avançar, entregar, disponibilidade)
  formato.js               dinheiro e horários
src/aluno/                 sistema do aluno
  App.jsx                  navegação entre telas, carrinho, avisos
  screens/                 Cardapio, Revisao, Acompanhamento, MeusPedidos, Perfil
  components/              Stepper (− / + / lixeira), ItemCardapio, ResumoPedido, Navegacao, Camadas
  aluno.css                estilos mobile-first (celular → tablet → computador)
src/cantina/               sistema da cantina
  App.jsx                  painel com colunas, entregues, pausa
  components/              CartaoPedido, Disponibilidade
  cantina.css              estilos (3 colunas no tablet; abas no celular)
```

## Responsividade (sistema do aluno)
- **Celular (até 639px):** layout do wireframe. Cabeçalho no topo, barra "Ver pedido →" e abas Cardápio / Meus pedidos / Perfil fixas embaixo, botões de 44px, campos com 16px para o iPhone não dar zoom, respeita a área do notch.
- **Tablet (640–959px):** itens do cardápio em duas colunas.
- **Computador (960px ou mais):** menu no topo e o "Seu pedido" fixo ao lado do cardápio.

Não há backend: os dados ficam no navegador e são compartilhados entre as abas (localStorage + BroadcastChannel). O pagamento é feito na retirada, por isso não existe tela de pagamento.
