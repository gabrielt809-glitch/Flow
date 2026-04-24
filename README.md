# FLOW-APP-LIMPO

FLOW e um app de rotina pessoal em HTML, CSS e JavaScript nativo, reconstruido em versao modular e limpa dentro desta pasta.

## Como Abrir

- abra `index.html` no navegador

## Como Rodar Testes

```bash
npm test
```

## Estrutura Basica

- `index.html`: entrada do app
- `assets/styles.css`: estilos
- `assets/js/`: modulos da aplicacao
- `tests/`: testes basicos de regressao

## Status da Fundacao

A fundacao tecnica esta fechada com:

- state centralizado
- storage versionado
- migrations
- selectors
- render por escopo
- safety layer
- testes basicos
- documentacao de arquitetura

## GitHub / Vercel

- rode `npm test`
- suba os arquivos para o repositorio
- publique no Vercel apontando para esta pasta/projeto
- faca smoke test manual apos o deploy
