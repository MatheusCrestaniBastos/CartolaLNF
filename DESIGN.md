# 🎨 LNF Fantasy - Guia Visual de Design

## 📐 Design System

### Cores Principais

```css
/* Verde Cartola - Cor primária */
--primary: #05D982
--primary-dark: #04c378

/* Laranja LNF - Cor secundária */
--secondary: #FF6B00
--secondary-dark: #E55F00

/* Azul LNF - Cor de destaque */
--accent: #003366
```

### Gradientes

```css
/* Header */
background: linear-gradient(135deg, #05D982 0%, #04c378 100%);

/* Campo de Futsal */
background: linear-gradient(180deg, #2d7a3e 0%, #236c33 100%);

/* Login Background */
background: linear-gradient(135deg, #05D982 0%, #04c378 50%, #FF6B00 100%);
```

---

## 🏠 Página de Login (index.html)

### Design
- Fundo com gradiente verde → laranja
- Card branco centralizado
- Logo grande com emoji ⚽
- Tabs para Login/Cadastro
- Inputs com foco verde
- Botões com hover animado

### Responsivo
- Desktop: Card de 440px
- Mobile: Full width com padding

---

## ⚽ Dashboard (dashboard.html)

### Header Verde
- Background: #05D982
- Logo à esquerda
- Menu no centro
- User à direita
- Sticky no topo

### Team Header Card
- Avatar circular com gradiente
- Nome do time (800 weight)
- Status da rodada
- 3 stats em linha: Pontos | Posição | Cartoletas

### Campo de Futsal
- Gradiente verde escuro
- Textura de grama (stripes)
- Borda branca semitransparente
- Grid de 5 colunas (desktop)
- Responsivo: 3 cols (tablet), 2 cols (mobile), 1 col (small)

### Player Cards
- Fundo branco
- Foto circular 72px com borda verde
- Badge da posição (verde)
- Nome em bold
- Time em cinza
- Box de pontos (fundo cinza, número verde)
- Hover: translateY(-4px) + shadow

### Ranking
- Tabela simples
- Header cinza claro
- Row do usuário: fundo verde claro
- Medalhas 🥇🥈🥉 para top 3
- Badge "VOCÊ" para usuário

---

## 🛒 Mercado (mercado.html)

### Layout
- Sidebar fixa (320px) à esquerda
- Content principal à direita
- Grid 2 colunas

### Sidebar - Orçamento
- Card sticky
- Disponível | Gasto | Restante
- Valores em destaque

### Sidebar - Mini Campo
- Campo verde compacto
- Slots para cada posição
- Botões: Salvar (verde) | Limpar (outline)

### Tabela de Jogadores
- Filtros no topo (3 colunas)
- Foto circular 48px
- Badge colorido por posição
- Botão "COMPRAR" verde
- Hover na row

### Responsivo Mobile
- Sidebar vira horizontal no topo
- Sticky com scroll
- Tabela com scroll horizontal

---

## ⚙️ Admin (admin.html)

### Stats Cards (Topo)
- Grid 4 colunas
- Ícone grande colorido
- Número em destaque
- Label em uppercase
- Hover: translateY(-2px)

### Tabs System
- Header cinza claro
- Tabs com border-bottom
- Tab ativa: border verde
- Smooth transition

### Forms
- Fundo cinza claro
- Labels em bold
- Inputs com border verde no focus
- Botões full width

### Scouts (Tab especial)
- Grid centralizado
- Seções: Positivas (verde) | Negativas (vermelho)
- Inputs em grid 2x2
- Botão grande no final

---

## 📱 Breakpoints

```css
/* Desktop grande */
@media (min-width: 1200px) {
  /* Layout completo */
}

/* Desktop */
@media (max-width: 1024px) {
  /* 3 colunas no campo */
}

/* Tablet */
@media (max-width: 768px) {
  /* 2 colunas no campo */
  /* Menu wraps */
}

/* Mobile */
@media (max-width: 480px) {
  /* 1 coluna no campo */
  /* Elementos empilhados */
}
```

---

## 🎯 Componentes Reutilizáveis

### Botões
```css
.btn-primary     /* Verde #05D982 */
.btn-secondary   /* Laranja #FF6B00 */
.btn-outline     /* Border verde */
.btn-ghost       /* Transparente branco */
.btn-sm          /* Pequeno */
.btn-lg          /* Grande */
```

### Badges
```css
.badge-primary   /* Verde claro */
.badge-secondary /* Laranja claro */
.badge-success   /* Verde */
.badge-warning   /* Amarelo */
.badge-error     /* Vermelho */
```

### Cards
```css
.card            /* Branco, shadow, radius 8px */
.card-header     /* Flex entre título e ação */
.card-title      /* 18px, bold */
```

---

## ✨ Animações

### Transições Padrão
```css
transition: all 0.2s ease;
```

### Hover Effects
```css
/* Cards */
:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Botões */
:hover {
  background: var(--primary-dark);
}

/* Player Cards */
:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}
```

### Loading
```css
.spinner {
  animation: spin 0.8s linear infinite;
}
```

---

## 🎨 Shadows

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05)
--shadow:     0 1px 3px rgba(0,0,0,0.1)
--shadow-md:  0 4px 6px rgba(0,0,0,0.1)
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1)
--shadow-xl:  0 20px 25px rgba(0,0,0,0.1)
```

---

## 📏 Espaçamentos

```css
/* Padding */
.p-4: 16px
.p-6: 24px
.p-8: 32px

/* Gap */
.gap-2: 8px
.gap-4: 16px
.gap-6: 24px
```

---

## 🔤 Tipografia

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...

/* Tamanhos */
h1: 32px (2rem)
h2: 24px (1.5rem)
h3: 20px (1.25rem)

/* Weights */
normal: 400
semibold: 600
bold: 700
extrabold: 800
```

---

## 🌟 Destaques

### Campo de Futsal
```css
/* Gradiente verde */
background: linear-gradient(180deg, #2d7a3e, #236c33);

/* Textura de grama */
repeating-linear-gradient(90deg, 
  transparent, 
  transparent 60px,
  rgba(0,0,0,0.03) 60px,
  rgba(0,0,0,0.03) 120px
);

/* Borda do campo */
border: 2px solid rgba(255,255,255,0.15);
```

### Player Card
```css
/* Card branco */
background: white;
border-radius: 8px;
padding: 16px;
box-shadow: 0 4px 12px rgba(0,0,0,0.2);

/* Foto */
width: 72px;
height: 72px;
border-radius: 50%;
border: 3px solid var(--primary);
```

---

## ✅ Checklist de Qualidade

- [x] Design consistente em todas as páginas
- [x] Cores LNF (verde + laranja)
- [x] 100% responsivo
- [x] Animações suaves
- [x] Acessibilidade (contraste, foco)
- [x] Performance (CSS otimizado)
- [x] Cross-browser (Chrome, Firefox, Safari)
- [x] Mobile-friendly
- [x] Loading states
- [x] Empty states

---

**Design System criado para LNF Fantasy** 🎨⚽
