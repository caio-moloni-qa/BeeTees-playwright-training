# Medidor de fome

**Tipo:** Feature

**User story:** Como cliente sem ideia do que pedir, quero informar o quanto estou com fome e receber sugestões do cardápio, para decidir mais rápido.

## Regras de negócio

- O medidor tem 4 níveis, de "um pouco de fome" até "faminto".
- As sugestões são calculadas a partir dos dados reais do cardápio (calorias) — não é uma lista fixa de produtos, então se o cardápio mudar, as sugestões se ajustam automaticamente.
- Cada nível corresponde a um quarto do cardápio ordenado por calorias: o nível mais baixo mostra os itens mais leves, o mais alto mostra os mais calóricos.
- Um item sugerido pode ser adicionado ao carrinho exatamente como no cardápio principal, incluindo a exigência de localização de entrega definida.
- O botão de entrada ("Feeling hungry?") fica no mesmo espaço do filtro de categorias, na tela principal do cardápio.

## Critérios de aceite

- Dado que estou na tela do cardápio, quando olho para a área do filtro de categorias, então também vejo o botão "Feeling hungry?" ali.
- Dado que clico no botão, quando a tela do medidor abre, então o nível mais baixo já vem selecionado, com os itens correspondentes exibidos abaixo.
- Dado que arrasto o medidor até o nível mais alto, então a lista de sugestões muda para os itens mais calóricos do cardápio.
- Dado uma sugestão exibida, quando clico em adicionar ao carrinho, então o comportamento é idêntico ao da tela de cardápio (personalização do item, contagem no carrinho atualizada).
- Dado que clico em "voltar ao menu", então volto para a tela principal do cardápio.

## Fora de escopo

- Filtro por categoria dentro da tela do medidor de fome.
- Persistência do nível escolhido entre sessões ou visitas.
- Explicação em tela de como o cálculo (calorias) funciona — é uma regra interna, não visível ao usuário final.
