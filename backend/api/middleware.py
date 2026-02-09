from urllib import request
from django.http import JsonResponse
from .models import Barbershop
import re

class BarbershopMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # LOG DE DEBUG: Ver todos os requests que chegam no Python/Django
        print(f"[BACKEND DEBUG] Request: {request.method} {request.get_full_path()}")
        
        # MONITORAMENTO DE ARQUIVOS ESTÁTICOS
        import os
        if "/admin/" in request.path:
            static_check = "/app/backend_static/admin"
            exists = os.path.exists(static_check)
            print(f"[DEBUG FILE SYSTEM] Path {static_check} exists in Backend: {exists}")
            if exists:
                print(f"[DEBUG FILE SYSTEM] Files in {static_check}: {os.listdir(static_check)[:5]}")

        if request.path.startswith('/api/webhooks/'):
            return self.get_response(request)
        
        host = request.get_host().split(':')[0]
        slug = None

        # Estratégia 2: Subdomínio (Preparo)
        # Ex: mybarber.autoopera.com.br -> slug = mybarber
        is_ip = re.match(r'^\d{1,3}(\.\d{1,3}){3}$', host)
        if host not in ['localhost', '127.0.0.1', 'autoopera.com.br', 'www.autoopera.com.br'] and not is_ip:
            parts = host.split('.')
            if len(parts) >= 2:
                potential_slug = parts[0]
                # Se não for 'www', tratamos como tenant
                if potential_slug != 'www':
                    slug = potential_slug

        # Estratégia 1: Path (Referência /b/slug/...)
        path_match = re.match(r'^/api/b/([^/]+)/', request.path)
        if path_match:
            slug = path_match.group(1)
        
        # Override via Header (Útil para n8n ou Mobile)
        header_slug = request.headers.get('X-Barbershop-Slug')
        if header_slug:
            slug = header_slug

        # Resolução e Injeção
        if slug:
            try:
                barbershop = Barbershop.objects.get(slug=slug, is_active=True)
                request.barbershop = barbershop
            except Barbershop.DoesNotExist:
                # Se a rota for de cadastro ou login global, ignoramos o erro de slug do host
                # Também permitimos caminhos de auth que venham dentro de um tenant path: /api/b/<slug>/auth/...
                if request.path.startswith('/api/auth/') or re.match(r'^/api/b/[^/]+/auth/', request.path):
                    request.barbershop = None
                else:
                    return JsonResponse({"error": "barbershop_not_found", "message": "Barbearia não encontrada ou inativa."}, status=404)
        else:
            # Se for uma rota de API que exige tenant e não tem slug, bloqueamos
            # Rota de admin ou auth global permitidas sem tenant
            if request.path.startswith('/api/') and not request.path.startswith('/api/auth/') and not slug:
                # Opcional: permitir rotas globais
                pass
            request.barbershop = None

        response = self.get_response(request)
        return response
