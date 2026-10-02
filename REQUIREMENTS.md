# Cupons de desconto no checkout

**Tipo:** Feature

**User story:** Como cliente finalizando um pedido, quero aplicar um cupom de desconto para pagar menos, e quero saber na hora se o cupom não é válido para o meu carrinho.

## Regras de negócio

- A validação do código não diferencia maiúsculas/minúsculas.
- Cupom percentual desconta sobre o subtotal dos itens — gorjeta e doação não entram na conta.
- Cupom de valor fixo exige um pedido mínimo; abaixo disso, a mensagem de erro informa o mínimo exigido.
- O total nunca fica negativo, mesmo que um cupom de valor fixo seja maior que o pedido.
- Só é possível ter um cupom aplicado por vez — para trocar, é preciso remover o atual primeiro.
- Remover um cupom aplicado devolve o total original, sem precisar recarregar a página.

## Critérios de aceite

- Dado um item no carrinho, quando aplico um cupom válido, então o total é recalculado e uma confirmação com o código aparece na tela.
- Dado um código que não existe, quando tento aplicar, então vejo uma mensagem de erro clara e o total permanece igual.
- Dado um cupom expirado, quando aplico, então recebo uma mensagem específica dizendo que o cupom expirou (diferente da mensagem de "código inválido").
- Dado um cupom com pedido mínimo, quando meu subtotal está abaixo do mínimo, então a mensagem de erro informa o valor mínimo necessário.
- Dado um cupom já aplicado, quando clico em remover, então o total volta ao valor original e o campo fica disponível para um novo código.
- O botão de aplicar fica desabilitado enquanto o campo de código está vazio.

## Fora de escopo

- Painel de administração para cadastrar/editar cupons (os códigos são fixos na aplicação, não vêm do banco).
- Limite de uso por cliente ou por conta.
- Combinação de mais de um cupom no mesmo pedido.
