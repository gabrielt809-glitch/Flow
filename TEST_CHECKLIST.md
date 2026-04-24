# FLOW-APP-LIMPO Test Checklist

## Como Rodar Testes Automatizados

```bash
npm test
```

Rodar antes de subir para Vercel:

- sempre que houver mudanca em `schema.js`, `state.js`, `storage.js`, `migrations.js`
- sempre que houver mudanca em `selectors.js`
- sempre que houver mudanca em `calendar.js` ou `timeblocks.js`
- sempre que houver mudanca em `render.js` ou nos escopos de render
- antes de qualquer deploy de release

## Checklist Manual no Navegador

- abrir `index.html`
- confirmar que o app carrega sem erros visiveis
- confirmar que a interface continua igual ao baseline atual
- confirmar que recarregar a pagina preserva os dados

## Checklist Manual iPhone / PWA

- abrir o app no Safari do iPhone
- adicionar a tela inicial
- abrir como PWA
- validar onboarding
- validar navegacao entre abas
- validar calendario e blocos
- validar persistencia ao fechar e reabrir
- validar campos de formulario e modais

## Checklist Deploy GitHub + Vercel

- garantir que `npm test` passou
- conferir se `index.html`, `assets/` e `tests/` estao atualizados
- revisar `CHANGELOG.md`
- subir para GitHub
- validar build/deploy no Vercel
- abrir a URL publicada e repetir smoke test manual

## Checklist de LocalStorage

- limpar a chave `flow-app-limpo-v1`
- validar onboarding do zero
- salvar alguns dados
- recarregar e confirmar persistencia
- testar com dados antigos, se houver backup/manual fixture
- confirmar que reset limpa o storage

## Checklist de Onboarding

- preencher nome, peso, altura, idade e emoji
- finalizar onboarding
- confirmar que header e app principal aparecem
- recarregar e confirmar que onboarding nao reaparece

## Checklist de Navegacao

- abrir cada aba pelo menu
- confirmar que a secao ativa troca corretamente
- confirmar que o side menu abre e fecha

## Checklist de Tarefas

- criar tarefa simples
- criar tarefa com data
- criar tarefa com caracteres especiais
- alternar concluida/pendente
- excluir tarefa
- testar filtros `all`, `pending`, `done`, `high`

## Checklist de Calendario

- abrir semana atual
- navegar para semana anterior
- navegar para próxima semana
- usar o botão Hoje
- confirmar exibicao de tarefas com data
- confirmar exibicao de blocos do dia
- confirmar que dias sem itens mostram estado vazio

## Checklist de Blocos de Tempo

- abrir modal
- criar bloco e confirmar que aparece na lista
- editar um bloco existente pela lista
- confirmar que aparece no calendario no dia esperado
- excluir bloco inteiro pela lista

## Checklist de Bloco de Dia Unico

- criar bloco `single`
- confirmar exibicao apenas na data escolhida
- confirmar que nao aparece em outros dias

## Checklist de Bloco Recorrente com Periodo

- criar bloco `recurring_period`
- escolher `startDate`, `endDate` e dias da semana
- confirmar aparicao apenas entre as datas
- confirmar dias corretos

## Checklist de Bloco Recorrente Sem Periodo

- criar bloco `recurring_forever`
- definir `startDate`
- confirmar aparicao recorrente apos a data inicial

## Checklist de Skip / Restore

- usar botao `Pular` no calendario em ocorrencia recorrente
- confirmar que a ocorrencia some naquele dia
- abrir lista de blocos
- restaurar a data pulada
- confirmar que a ocorrencia volta no calendario

## Checklist de Sono

- alterar horario inicial e final
- alterar qualidade
- salvar notas
- recarregar e confirmar persistencia

## Checklist de Foco

- iniciar timer
- pausar timer
- resetar timer
- concluir sessao
- validar volume, modo de som e modo de foco

## Checklist de Agua

- adicionar e remover copos
- trocar tamanho do copo
- recarregar e confirmar persistencia

## Checklist de Saude

- salvar passos
- salvar minutos de treino
- recarregar e confirmar persistencia

## Checklist de Alimentacao

- adicionar refeicao
- usar caracteres especiais no nome
- excluir refeicao
- recarregar e confirmar persistencia

## Checklist de Habitos

- criar habito
- marcar/desmarcar no dia atual
- recarregar e confirmar persistencia

## Checklist de Humor

- escolher humor
- salvar gratidao e notas
- recarregar e confirmar persistencia

## Checklist de Configuracoes

- alterar metas
- alternar tema
- validar resumo do perfil
- usar reset e confirmar limpeza total
