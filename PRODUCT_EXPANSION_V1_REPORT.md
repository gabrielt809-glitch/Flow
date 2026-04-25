# Product Expansion + UX Refinement v1

## Resumo

Esta sprint expandiu o FLOW-APP-LIMPO para além da fundação técnica e dos polishes visuais, adicionando funcionalidades persistidas em várias abas e corrigindo pontos abertos de UX. A aba Hoje foi preservada.

## Checklist

Correções:
- [x] Lo-fi toca áudio
- [x] Chuva toca áudio
- [x] Deep focus toca áudio
- [x] Volume do áudio funciona
- [x] Deep 50m adicionado
- [x] Modal de bloco ajustado
- [x] Botão fechar menu reduzido

Saúde:
- [x] Botões de passos pré-definidos
- [x] Biblioteca de atividades
- [x] Cálculo de calorias
- [x] Registro de atividade
- [x] Área Academia
- [ ] Treinos semanais personalizáveis
- [x] Recomendação extra de água por exercício

Sono:
- [x] Duração em hh:mm
- [x] Visualização semanal
- [x] Adicionar/editar sono por dia
- [x] Campo de sensação ao acordar

Nutrição:
- [x] Biblioteca de alimentos
- [x] Porções comuns
- [x] Adicionar alimento por biblioteca
- [x] Salvar refeição
- [x] Lista de refeições da dieta

Hábitos:
- [x] Visão semanal
- [x] Visão mensal
- [x] Preenchimento manual
- [x] Sugestões de hábitos

Bem-estar:
- [x] Respiração
- [x] Modal diário no primeiro acesso
- [x] Diário noturno

Configurações:
- [x] Reset diário
- [x] Reset total mantido
- [x] Modo claro removido
- [x] Personalizar abas fixadas

UX:
- [x] Todas as abas refinadas
- [x] Aba Hoje preservada
- [x] Paleta atual preservada
- [x] Bottom nav consistente
- [x] Sem overflow horizontal

Técnico:
- [x] Schema atualizado, se necessário
- [x] Migrations criadas, se necessário
- [x] STATE_SCHEMA atualizado
- [x] CHANGELOG atualizado
- [x] npm test passou

## O que foi alterado

### Estrutura persistida

- `assets/js/schema.js`
- `assets/js/migrations.js`
- `assets/js/selectors.js`
- `STATE_SCHEMA.md`

Mudanças:

- `STATE_VERSION` atualizado para `3`
- `ui.pinnedTabs` formalizado para personalização da bottom nav
- `health.activityEntries` e `health.workouts`
- `sleep.entries` e `sleep.wakeMood`
- `food.savedMeals` e `food.dietMeals`
- `mood.dailyCheckinShownDate` e `mood.journalEntries`

### Configurações e navegação

- `assets/js/settings.js`
- `assets/js/navigation.js`
- `index.html`

Mudanças:

- remoção prática do modo claro
- reset diário sem apagar perfil, metas ou histórico completo
- editor de abas fixadas na bottom nav
- bottom nav baseada em `ui.pinnedTabs`

### Saúde

- `assets/js/health.js`
- `index.html`

Mudanças:

- atalhos de passos
- biblioteca de atividades com MET aproximado
- cálculo de calorias por peso do perfil ou fallback de 70kg
- histórico do dia com exclusão
- área Academia com treino simples, dias e exercícios
- recomendação extra de água por treino

### Sono

- `assets/js/sleep.js`
- `index.html`

Mudanças:

- registro por data
- duração formatada em `hh:mm`
- wake mood
- resumo semanal

### Nutrição

- `assets/js/food.js`
- `index.html`

Mudanças:

- biblioteca de alimentos
- multiplicação por porção
- refeições do dia
- salvar refeição como modelo
- refeições planejadas da dieta

### Hábitos

- `assets/js/habits.js`
- `index.html`

Mudanças:

- sugestões rápidas
- seleção manual de data
- leitura semanal e mensal

### Bem-estar

- `assets/js/mood.js`
- `index.html`

Mudanças:

- modal diário no primeiro acesso do dia
- respiração guiada
- diário noturno por data

### Correções visuais / UX

- `assets/styles.css`
- `index.html`

Mudanças:

- modal de bloco mais confortável no mobile
- botão fechar do menu lateral reduzido
- densidade e agrupamento melhores nas novas áreas
- recomendação extra de água mostrada também na aba Água

## Testes

Executado:

```bash
npm test
```

Resultado:

- `utils.test.js`: passou
- `selectors.test.js`: passou
- `timeblocks.test.js`: passou
- `storage.test.js`: passou
- `state.test.js`: passou
- `product-expansion.test.js`: passou

Também foi feita checagem de sintaxe com `node --check` nos módulos principais alterados.

## Item não concluído por completo

### Treinos semanais personalizáveis

O app já salva treinos com nome, dias, exercícios e observações, e permite remover e consultar. O que não entrou nesta sprint foi um fluxo completo de edição detalhada treino a treino com manipulação individual de séries, repetições e carga por exercício.

Arquivos que pediriam uma continuação segura:

- `assets/js/health.js`
- `index.html`
- possivelmente `assets/styles.css`

Recomendação para próxima sprint:

- transformar a área Academia em editor de treino completo, com modal ou formulário dedicado para editar exercícios individualmente

## Validação manual pendente

Ficou pendente somente a validação manual em navegador/iPhone/PWA real para:

- confirmar áudio do player de foco no ambiente-alvo
- sentir o encaixe final do modal de bloco no iPhone
- validar toque e densidade visual das novas áreas em tela física
