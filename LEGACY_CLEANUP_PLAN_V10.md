# Plano de limpeza controlada do legado

## Regra de segurança

Não remover blocos grandes de uma vez. Cada remoção deve preservar:

- onboarding;
- navegação;
- tarefas;
- calendário;
- blocos de tempo;
- sono;
- histórico;
- overview;
- PWA no Safari/iPhone.

## Ordem sugerida

### 1. Criar backup físico

Criar:

```txt
assets/app.legacy.full.js
```

E manter `assets/app.legacy.js` como arquivo reduzido.

### 2. Remover apenas comentários e patches mortos

Primeira limpeza sem risco funcional alto.

### 3. Remover duplicidades já cobertas pelo bridge

Somente quando o módulo oficial estiver validado:

- calendário;
- blocos;
- tarefas;
- sono;
- overview;
- água/alimentação/saúde;
- foco/hábitos/humor;
- settings/onboarding.

### 4. Testar após cada área

Checklist mínimo:

```txt
Abrir app
Salvar sono
Adicionar tarefa vinculada
Adicionar bloco recorrente
Remover bloco de um dia
Restaurar bloco
Adicionar água
Adicionar refeição
Adicionar passos
Ver histórico semanal
Fechar e reabrir app
```

## Meta

Reduzir gradualmente o legado sem comprometer o app funcionando.
