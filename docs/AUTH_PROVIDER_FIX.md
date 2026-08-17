# Correção — AuthProvider

Erro observado:

`useAuth fora do AuthProvider`

Causa:
`App` estava sendo renderizado diretamente no `createRoot`, embora vários componentes usem `useAuth()` e `useLiveProducts()`.

Correção aplicada:

```tsx
<AuthProvider>
  <LiveProductProvider>
    <App />
  </LiveProductProvider>
</AuthProvider>
```

Depois de substituir o pacote/projeto, execute:

```cmd
npm --prefix apps\web install
npm --prefix apps\web run build
firebase deploy --only hosting
```
