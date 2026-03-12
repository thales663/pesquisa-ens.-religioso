# Pesquisa Religiosa da Turma

Sistema web para coleta e visualização de dados sobre religiões por grupo.

## Como rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor
```bash
npm start
```

### 3. Acessar no navegador
```
http://localhost:3000
```

---

## Estrutura
```
/server.js        → API REST (Express)
/database.js      → Banco SQLite
/package.json     → Dependências
/dados.db         → Gerado automaticamente
/public/
  index.html      → Interface
  style.css       → Estilos
  script.js       → Lógica do frontend
```

## Funcionalidades
- Criar grupos (ex: Grupo A, Turma 3B)
- Adicionar respostas com nome (opcional) + religião
- Gráfico automático com % de cada religião
- Imprimir ou baixar PDF
- Dados salvos permanentemente no SQLite
