# Poddynho.Fetch

Busca todos os postos Petrobras via API GraphQL e exporta JSON compatível com o `ImportadorPetrobras`.

## Uso

```bash
# Saída para arquivo
poddynho-fetch --token "eyJ..." --output postos.json

# Saída para stdout
poddynho-fetch --token "eyJ..."

# Token via variável de ambiente
TOKEN="eyJ..." poddynho-fetch --output postos.json

# Opções completas
poddynho-fetch --token "eyJ..." \
               --latitude -22.74 \
               --longitude -47.23 \
               --limit 100 \
               --distance 300000 \
               --output postos.json
```

O progresso é impresso no stderr. O JSON vai para stdout ou `--output`.

---

## Como obter o token com Frida

O token JWT expira — para renovar, intercepte o app Premmia em um dispositivo Android rooteado.

### Pré-requisitos

- Dispositivo Android rooteado com ADB ativo
- [Frida](https://frida.re) instalado na máquina: `pip install frida-tools`
- `frida-server` compatível com a arquitetura do dispositivo (baixe em [github.com/frida/frida/releases](https://github.com/frida/frida/releases))

### 1. Instalar o frida-server no dispositivo

```bash
adb push frida-server /data/local/tmp/
adb shell su -c "chmod +x /data/local/tmp/frida-server"
```

### 2. Iniciar o frida-server

```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

### 3. Hookear o app

Com o app Premmia **fechado**, execute:

```bash
frida -U -n Premmia -l okhttp_hook.js
```

Se o app ainda não estiver rodando, use `-f` para spawnar:

```bash
frida -U -f com.br.petrobras.premmia -l okhttp_hook.js --no-pause
```

### 4. Capturar o token

Abra o app e navegue até qualquer tela que carregue postos (ex: mapa). O token aparece no terminal:

```
[TOKEN] eyJ2ZXIiOiIxLjAi...
```

Copie o valor completo — esse é o `--token` para o `poddynho-fetch`.

### Como o hook funciona

O script em `okhttp_hook.js` intercepta o `okhttp3.Request.Builder` antes de cada requisição e loga o header `Authorization`. Não modifica o tráfego.
