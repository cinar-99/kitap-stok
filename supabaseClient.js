@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}

body {
  background-color: #f4eee1;
  -webkit-tap-highlight-color: transparent;
}

/* Barkod okuyucu ile satış ekranında yanlışlıkla metin seçimini engelle */
.no-select {
  user-select: none;
}
