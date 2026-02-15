# Nginx: 413 Request Entity Too Large (վիդեո/մեդիա բեռնում)

Երբ Admin-ում մեքենայի մեդիա (վիդեո կամ մեծ նկար) բեռնելիս ստանում եք **413 Request Entity Too Large** (nginx/1.24.0), պատճառը nginx-ի body size սահմանափակումն է (default ~1MB):

## Լուծում

Սերվերի nginx կոնֆիգում ավելացրեք `client_max_body_size` (օրինակ 25MB, մեդիա-բեռնման համար):

### 1. Կոնֆիգ ֆայլի ճանապարհ

Ubuntu/Debian-ում սովորաբար.

- Կայքի site: `/etc/nginx/sites-available/your-site` (կամ `default`)
- Ընդհանուր http: `/etc/nginx/nginx.conf`

### 2. Ավելացնել directive

**Տարբերակ A — միայն այդ site-ի համար** (`server` բլոկի ներսում):

```nginx
server {
    listen 80;
    server_name nampoputi.rent;
    # ... այլ կարգավորումներ ...

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ...
    }
}
```

**Տարբերակ B — բոլոր site-երի համար** (`/etc/nginx/nginx.conf`-ի `http` բլոկում):

```nginx
http {
    client_max_body_size 25M;
    # ...
}
```

### 3. Ստուգել և reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Այսից հետո մեդիա բեռնումը (մինչև 25MB) չպետք է 413 վերադարձնի:
